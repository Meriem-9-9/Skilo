import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreditsService } from '../credits/credits.service';
import { ProposeSessionDto } from './dto/propose-session.dto';
import { ConfirmSessionDto } from './dto/confirm-session.dto';
import { DeclineCancelDto, SessionFilterDto } from './dto/session-filter.dto';

// Shared select for the "other user" in a session card
const SESSION_USER_SELECT = {
  id: true,
  firstName: true,
  avatarUrl: true,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SESSION_SKILL_SELECT = {
  id: true,
  name: true,
  category: true,
};

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly creditsService: CreditsService,
  ) {}

  // ══════════════════════════════════════════════════════════════════════════
  // POST /sessions — propose a session
  // ══════════════════════════════════════════════════════════════════════════
  async propose(initiatorId: string, dto: ProposeSessionDto) {
    const scheduledAt = new Date(dto.scheduledAt);
    const now = new Date();

    // Rule: at least 2 hours from now
    const minDate = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    if (scheduledAt < minDate) {
      throw new BadRequestException(
        "La session doit être proposée au moins 2 heures à l'avance.",
      );
    }

    // Rule: at most 30 days from now
    const maxDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (scheduledAt > maxDate) {
      throw new BadRequestException(
        'La session ne peut pas être planifiée à plus de 30 jours.',
      );
    }

    // Rule: no existing pending/confirmed session between these two users
    const existing = await this.prisma.session.findFirst({
      where: {
        status: { in: ['pending', 'confirmed'] },
        OR: [
          { proposedById: initiatorId, recipientId: dto.recipientId },
          { proposedById: dto.recipientId, recipientId: initiatorId },
        ],
      },
    });
    if (existing) {
      throw new ConflictException(
        'Une session est déjà en cours avec cet utilisateur.',
      );
    }

    // Find the match between the two users — required by schema (matchId is not nullable)
    const match = await this.prisma.match.findFirst({
      where: {
        status: 'active',
        OR: [
          { userAId: initiatorId, userBId: dto.recipientId },
          { userAId: dto.recipientId, userBId: initiatorId },
        ],
      },
    });

    if (!match) {
      throw new BadRequestException(
        'Aucun match actif trouvé avec cet utilisateur.',
      );
    }

    // Calculate credits needed
    const creditsNeeded = CreditsService.creditsForDuration(dto.duration);
    // Credits required only for partial matches (not perfect — exchange is mutual)
    const isCreditBased = match.type === 'partial';

    if (isCreditBased) {
      // reserve() will throw 400 with the exact message if balance is insufficient
      await this.creditsService.reserve(initiatorId, creditsNeeded, 'pending');
    }

    // Create the session
    const session = await this.prisma.session.create({
      data: {
        matchId: match.id, // guaranteed non-null — we threw above if missing
        proposedById: initiatorId,
        recipientId: dto.recipientId,
        scheduledAt,
        durationMinutes: dto.duration,
        skillsExchanged: [
          { skillCatalogId: dto.offeredSkillId, role: 'offered' },
          { skillCatalogId: dto.wantedSkillId, role: 'wanted' },
        ],
        message: dto.message ?? null,
        status: 'pending',
        creditsUsed: isCreditBased ? creditsNeeded : 0,
        confirmationDeadline: new Date(
          scheduledAt.getTime() + 24 * 60 * 60 * 1000,
        ),
      },
      select: {
        id: true,
        status: true,
        scheduledAt: true,
        durationMinutes: true,
      },
    });

    // If credits were reserved with a placeholder sessionId, update it now
    if (isCreditBased) {
      await this.prisma.creditTransaction.updateMany({
        where: { userId: initiatorId, sessionId: 'pending' },
        data: { sessionId: session.id },
      });
    }

    // Notify recipient
    const initiator = await this.prisma.user.findUnique({
      where: { id: initiatorId },
      select: { firstName: true },
    });
    await this.prisma.notification.create({
      data: {
        userId: dto.recipientId,
        type: 'session_proposed',
        payload: {
          fromUserFirstName: initiator?.firstName,
          sessionId: session.id,
          scheduledAt: scheduledAt.toISOString(),
        },
      },
    });

    return { message: 'Session proposée avec succès.', session };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PATCH /sessions/:id/accept
  // ══════════════════════════════════════════════════════════════════════════
  async accept(sessionId: string, recipientId: string) {
    const session = await this.findSessionOrThrow(sessionId);

    if (session.recipientId !== recipientId) throw new ForbiddenException();
    if (session.status !== 'pending') {
      throw new BadRequestException(
        'Cette session ne peut plus être acceptée.',
      );
    }

    // If credit-based → debit the reserved credits now
    if (session.creditsUsed > 0) {
      await this.creditsService.debit(
        session.proposedById,
        session.creditsUsed,
        sessionId,
      );
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { status: 'confirmed' },
    });

    // Notify initiator
    const recipient = await this.prisma.user.findUnique({
      where: { id: recipientId },
      select: { firstName: true },
    });
    await this.prisma.notification.create({
      data: {
        userId: session.proposedById,
        type: 'session_accepted',
        payload: {
          fromUserFirstName: recipient?.firstName,
          sessionId,
          scheduledAt: session.scheduledAt.toISOString(),
        },
      },
    });

    return { message: 'Session acceptée.' };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PATCH /sessions/:id/decline
  // ══════════════════════════════════════════════════════════════════════════
  async decline(sessionId: string, recipientId: string, dto: DeclineCancelDto) {
    const session = await this.findSessionOrThrow(sessionId);

    if (session.recipientId !== recipientId) throw new ForbiddenException();
    if (session.status !== 'pending') {
      throw new BadRequestException('Cette session ne peut plus être refusée.');
    }

    // Refund reserved credits if applicable
    if (session.creditsUsed > 0) {
      await this.creditsService.refund(
        session.proposedById,
        session.creditsUsed,
        sessionId,
      );
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { status: 'cancelled', cancellationReason: dto.reason ?? null },
    });

    const recipient = await this.prisma.user.findUnique({
      where: { id: recipientId },
      select: { firstName: true },
    });
    await this.prisma.notification.create({
      data: {
        userId: session.proposedById,
        type: 'session_declined',
        payload: {
          fromUserFirstName: recipient?.firstName,
          sessionId,
          reason: dto.reason ?? null,
        },
      },
    });

    return { message: 'Session refusée.' };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PATCH /sessions/:id/cancel
  // ══════════════════════════════════════════════════════════════════════════
  async cancel(sessionId: string, userId: string, dto: DeclineCancelDto) {
    const session = await this.findSessionOrThrow(sessionId);

    const isParticipant =
      session.proposedById === userId || session.recipientId === userId;
    if (!isParticipant) throw new ForbiddenException();

    if (!['pending', 'confirmed'].includes(session.status)) {
      throw new BadRequestException('Cette session ne peut plus être annulée.');
    }

    // Warning if < 2h before scheduled time
    const twoHoursBefore = new Date(
      session.scheduledAt.getTime() - 2 * 60 * 60 * 1000,
    );
    const isLateCancel = new Date() > twoHoursBefore;

    // Refund credits if session was credit-based and not yet debited
    if (session.creditsUsed > 0 && session.status === 'pending') {
      await this.creditsService.refund(
        session.proposedById,
        session.creditsUsed,
        sessionId,
      );
    }
    // If confirmed + credit-based → refund too (session never happened)
    if (session.creditsUsed > 0 && session.status === 'confirmed') {
      await this.creditsService.refund(
        session.proposedById,
        session.creditsUsed,
        sessionId,
      );
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'cancelled',
        cancellationReason: dto.reason ?? null,
        cancelledById: userId,
      },
    });

    // Notify the OTHER participant
    const otherUserId =
      session.proposedById === userId
        ? session.recipientId
        : session.proposedById;

    await this.prisma.notification.create({
      data: {
        userId: otherUserId,
        type: 'session_cancelled',
        payload: { sessionId, reason: dto.reason ?? null },
      },
    });

    return {
      message: 'Session annulée.',
      warning: isLateCancel
        ? 'Annulation tardive (moins de 2h avant la session).'
        : null,
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PATCH /sessions/:id/confirm — both users confirm if it happened
  // ══════════════════════════════════════════════════════════════════════════
  async confirm(sessionId: string, userId: string, dto: ConfirmSessionDto) {
    const session = await this.findSessionOrThrow(sessionId);

    if (session.status !== 'confirmed') {
      throw new BadRequestException(
        'La session doit être confirmée avant de pouvoir valider sa tenue.',
      );
    }
    if (session.scheduledAt > new Date()) {
      throw new BadRequestException("La session n'a pas encore eu lieu.");
    }

    const isInitiator = session.proposedById === userId;
    const isRecipient = session.recipientId === userId;
    if (!isInitiator && !isRecipient) throw new ForbiddenException();

    // Update the right confirmation flag
    const updateData = isInitiator
      ? { confirmedByA: dto.didHappen }
      : { confirmedByB: dto.didHappen };

    const updated = await this.prisma.session.update({
      where: { id: sessionId },
      data: updateData,
      select: {
        confirmedByA: true,
        confirmedByB: true,
        proposedById: true,
        recipientId: true,
        durationMinutes: true,
        creditsUsed: true,
      },
    });

    // Evaluate state matrix
    const { confirmedByA, confirmedByB } = updated;
    const bothAnswered = confirmedByA !== null && confirmedByB !== null;

    if (bothAnswered) {
      if (confirmedByA && confirmedByB) {
        // ✅ Both said yes → completed
        await this.completeSession(sessionId, updated);
      } else if (!confirmedByA && !confirmedByB) {
        // ❌ Both said no → cancelled
        await this.prisma.session.update({
          where: { id: sessionId },
          data: { status: 'cancelled' },
        });
        if (session.creditsUsed > 0) {
          await this.creditsService.refund(
            session.proposedById,
            session.creditsUsed,
            sessionId,
          );
        }
      } else {
        // ⚠️ One yes, one no → disputed
        await this.prisma.session.update({
          where: { id: sessionId },
          data: { status: 'disputed' },
        });
        // Notify both users about the dispute
        await this.prisma.notification.createMany({
          data: [
            {
              userId: session.proposedById,
              type: 'session_completed',
              payload: { sessionId, status: 'disputed' },
            },
            {
              userId: session.recipientId,
              type: 'session_completed',
              payload: { sessionId, status: 'disputed' },
            },
          ],
        });
      }
    }

    return { message: 'Confirmation enregistrée.' };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GET /sessions
  // ══════════════════════════════════════════════════════════════════════════
  async getMySessions(userId: string, filters: SessionFilterDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;
    const now = new Date();

    const where = {
      OR: [{ proposedById: userId }, { recipientId: userId }],
      scheduledAt: filters.tab === 'upcoming' ? { gte: now } : { lt: now },
    };

    const [sessions, total] = await this.prisma.$transaction([
      this.prisma.session.findMany({
        where,
        orderBy: { scheduledAt: filters.tab === 'upcoming' ? 'asc' : 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          status: true,
          scheduledAt: true,
          durationMinutes: true,
          creditsUsed: true,
          skillsExchanged: true,
          proposedBy: { select: SESSION_USER_SELECT },
          recipient: { select: SESSION_USER_SELECT },
        },
      }),
      this.prisma.session.count({ where }),
    ]);

    // Shape response — resolve "other" user from the current user's perspective
    const shaped = sessions.map((s) => ({
      id: s.id,
      status: s.status,
      scheduledAt: s.scheduledAt,
      durationMinutes: s.durationMinutes,
      creditsUsed: s.creditsUsed,
      skillsExchanged: s.skillsExchanged,
      otherUser: s.proposedBy.id === userId ? s.recipient : s.proposedBy,
      isInitiator: s.proposedBy.id === userId,
    }));

    return {
      data: shaped,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GET /sessions/:id
  // ══════════════════════════════════════════════════════════════════════════
  async getSessionById(sessionId: string, userId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        status: true,
        scheduledAt: true,
        durationMinutes: true,
        meetingLink: true,
        message: true,
        cancellationReason: true,
        confirmedByA: true,
        confirmedByB: true,
        creditsUsed: true,
        skillsExchanged: true,
        createdAt: true,
        proposedBy: { select: { ...SESSION_USER_SELECT, email: true } },
        recipient: { select: { ...SESSION_USER_SELECT, email: true } },
      },
    });

    if (!session) throw new NotFoundException('Session not found');

    const isParticipant =
      session.proposedBy.id === userId || session.recipient.id === userId;
    if (!isParticipant) throw new ForbiddenException();

    return session;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INTERNAL — completeSession (called from confirm + cron jobs)
  // ══════════════════════════════════════════════════════════════════════════
  async completeSession(
    sessionId: string,
    session: {
      proposedById: string;
      recipientId: string;
      durationMinutes: number;
      creditsUsed: number;
    },
    isAutoCompleted = false,
  ) {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { status: isAutoCompleted ? 'auto_completed' : 'completed' },
    });

    // Credit the teacher (recipient taught, so initiator was the learner)
    // The INITIATOR wanted to learn → they paid credits (if credit-based)
    // The RECIPIENT taught → they earn credits
    const creditsEarned = CreditsService.creditsForDuration(
      session.durationMinutes,
    );
    await this.creditsService.credit(
      session.recipientId, // teacher = recipient
      creditsEarned,
      sessionId,
    );

    // Update sessionsCompleted counter on both users
    await this.prisma.user.updateMany({
      where: { id: { in: [session.proposedById, session.recipientId] } },
      data: { sessionsCompleted: { increment: 1 } },
    });

    // Notify both to submit their reviews
    await this.prisma.notification.createMany({
      data: [
        {
          userId: session.proposedById,
          type: 'session_completed',
          payload: { sessionId },
        },
        {
          userId: session.recipientId,
          type: 'session_completed',
          payload: { sessionId },
        },
      ],
    });
  }

  // ─── Private helper ───────────────────────────────────────────────────────
  private async findSessionOrThrow(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        status: true,
        scheduledAt: true,
        durationMinutes: true,
        proposedById: true,
        recipientId: true,
        creditsUsed: true,
        confirmedByA: true,
        confirmedByB: true,
      },
    });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }
}
