import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreditsService } from '../credits/credits.service';
import { ProposeSessionDto } from './dto/propose-session.dto';
import { ConfirmSessionDto } from './dto/confirm-session.dto';
import { DeclineCancelDto, SessionFilterDto } from './dto/session-filter.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { NotificationType } from '@prisma/client';

// selection des infos de l'autre utilisateur pour les cartes de session
const SESSION_USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
  city: true,
  avgRating: true,
  sessionsCompleted: true,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SESSION_SKILL_SELECT = { id: true, name: true, category: true };

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly creditsService: CreditsService,
  ) {}

    // POST /sessions — propose a session
    async propose(initiatorId: string, dto: ProposeSessionDto) {
    const scheduledAt = new Date(dto.scheduledAt);

    this.validateSessionDate(scheduledAt);
    await this.ensureActiveSessionLimit(initiatorId, dto.recipientId);

    const match = await this.getActiveMatchOrThrow(
      initiatorId,
      dto.recipientId,
    );

    const creditsNeeded = CreditsService.creditsForDuration(dto.duration);
    const isCreditBased = match.type === 'partial';

    let reservationTransactionId: string | null = null;
    if (isCreditBased) {
      const tx = await this.creditsService.reserve(initiatorId, creditsNeeded);
      reservationTransactionId = tx.id;
    }

    const offeredSkill = dto.offeredSkillId
      ? await this.prisma.skillCatalog.findUnique({
          where: { id: dto.offeredSkillId },
        })
      : null;
    const wantedSkill = dto.wantedSkillId
      ? await this.prisma.skillCatalog.findUnique({
          where: { id: dto.wantedSkillId },
        })
      : null;

    const session = await this.prisma.session.create({
      data: {
        matchId: match.id,
        proposedById: initiatorId,
        recipientId: dto.recipientId,
        scheduledAt,
        durationMinutes: dto.duration,
        skillsExchanged: [
          {
            offeredSkillName: offeredSkill?.name ?? 'Compétence',
            wantedSkillName: wantedSkill?.name ?? 'Compétence',
          },
        ],
        message: dto.message ?? null,
        meetingLink: dto.meetingLink ?? null,
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
        meetingLink: true,
      },
    });

    // on genere un lien si besoin
    if (!session.meetingLink) {
      const generatedLink = `https://meet.ffmuc.net/skilo-${session.id}`;
      await this.prisma.session.update({
        where: { id: session.id },
        data: { meetingLink: generatedLink },
      });
      (session as any).meetingLink = generatedLink;
    }

    if (reservationTransactionId) {
      await this.prisma.creditTransaction.update({
        where: { id: reservationTransactionId },
        data: { sessionId: session.id },
      });
    }

    await this.notifyUser(
      dto.recipientId,
      initiatorId,
      session.id,
      'session_proposed',
      {
        scheduledAt: scheduledAt.toISOString(),
        body: "Vous avez reçu une nouvelle demande de session d'échange.",
      },
    );

    return { message: 'Session proposee avec succes.', session };
  }

    // Validation Helpers
    private validateSessionDate(scheduledAt: Date) {
    const now = new Date();
    const minDate = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    if (scheduledAt < minDate) {
      throw new BadRequestException(
        "La session doit être proposée au moins 2 heures à l'avance.",
      );
    }
    const maxDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (scheduledAt > maxDate) {
      throw new BadRequestException(
        'La session ne peut pas être planifiée à plus de 30 jours.',
      );
    }
  }

  private async ensureActiveSessionLimit(userAId: string, userBId: string) {
    const activeCount = await this.prisma.session.count({
      where: {
        status: { in: ['pending', 'confirmed'] },
        OR: [
          { proposedById: userAId, recipientId: userBId },
          { proposedById: userBId, recipientId: userAId },
        ],
      },
    });

    if (activeCount >= 3) {
      throw new ConflictException(
        "Vous avez déjà 3 sessions actives avec cet utilisateur. Veuillez en terminer une avant d'en proposer une nouvelle.",
      );
    }
  }

  private readonly logger = new Logger(SessionsService.name);

  private async getActiveMatchOrThrow(userAId: string, userBId: string) {
    this.logger.debug(
      `Searching active match between ${userAId} and ${userBId}`,
    );
    const match = await this.prisma.match.findFirst({
      where: {
        status: 'active',
        OR: [
          { userAId, userBId },
          { userAId: userBId, userBId: userAId },
        ],
      },
    });

    if (!match) {
      this.logger.warn(
        `No active match found for users ${userAId} and ${userBId}. Checking if match exists at all...`,
      );
      const anyMatch = await this.prisma.match.findFirst({
        where: {
          OR: [
            { userAId, userBId },
            { userAId: userBId, userBId: userAId },
          ],
        },
      });
      if (anyMatch) {
        this.logger.warn(
          `Found match ${anyMatch.id} but status is ${anyMatch.status}`,
        );
      } else {
        this.logger.error(
          `No match record at all between ${userAId} and ${userBId}`,
        );
      }

      throw new BadRequestException(
        'Aucun match actif trouvé avec cet utilisateur.',
      );
    }
    return match;
  }

  private async notifyUser(
    targetUserId: string,
    fromUserId: string,
    sessionId: string,
    type: NotificationType,
    extraPayload: any = {},
  ) {
    const initiator = await this.prisma.user.findUnique({
      where: { id: fromUserId },
      select: { firstName: true },
    });
    await this.prisma.notification.create({
      data: {
        userId: targetUserId,
        type,
        payload: {
          fromUserFirstName: initiator?.firstName,
          sessionId,
          ...extraPayload,
        },
      },
    });
  }

    // PATCH /sessions/:id/accept
    async accept(sessionId: string, recipientId: string) {
    const session = await this.findSessionOrThrow(sessionId);

    if (session.recipientId !== recipientId) throw new ForbiddenException();
    if (session.status !== 'pending') {
      throw new BadRequestException(
        'Cette session ne peut plus être acceptée.',
      );
    }

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

    await this.notifyUser(
      session.proposedById,
      recipientId,
      sessionId,
      'session_accepted',
      {
        scheduledAt: session.scheduledAt.toISOString(),
        body: 'Votre demande de session a ete acceptee !',
      },
    );

    return { message: 'Session acceptee.' };
  }

  // PATCH /sessions/:id/decline
  async decline(sessionId: string, userId: string, dto: DeclineCancelDto) {
    const session = await this.findSessionOrThrow(sessionId);

    const isParticipant =
      session.proposedById === userId || session.recipientId === userId;
    if (!isParticipant) throw new ForbiddenException();
    if (session.status !== 'pending') {
      throw new BadRequestException('Cette session ne peut plus etre refusee.');
    }

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

    await this.notifyUser(
      session.proposedById,
      userId,
      sessionId,
      'session_declined',
      {
        reason: dto.reason ?? null,
        body: 'Votre demande de session a ete declinee.',
      },
    );

    return { message: 'Session refusee.' };
  }

  // PATCH /sessions/:id/cancel
  async cancel(sessionId: string, userId: string, dto: DeclineCancelDto) {
    const session = await this.findSessionOrThrow(sessionId);

    const isParticipant =
      session.proposedById === userId || session.recipientId === userId;
    if (!isParticipant) throw new ForbiddenException();

    if (!['pending', 'confirmed'].includes(session.status)) {
      throw new BadRequestException('Cette session ne peut plus etre annulee.');
    }

    const twoHoursBefore = new Date(
      session.scheduledAt.getTime() - 2 * 60 * 60 * 1000,
    );
    const isLateCancel = new Date() > twoHoursBefore;

    if (
      session.creditsUsed > 0 &&
      (session.status === 'pending' || session.status === 'confirmed')
    ) {
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

    const otherUserId =
      session.proposedById === userId
        ? session.recipientId
        : session.proposedById;
    await this.prisma.notification.create({
      data: {
        userId: otherUserId,
        type: 'session_cancelled',
        payload: {
          sessionId,
          reason: dto.reason ?? null,
          body: 'session annulee',
        },
      },
    });

    return {
      message: 'Session annulee.',
      warning: isLateCancel
        ? 'Annulation tardive (moins de 2h avant la session).'
        : null,
    };
  }

  // PATCH /sessions/:id/confirm
  async confirm(sessionId: string, userId: string, dto: ConfirmSessionDto) {
    const session = await this.findSessionOrThrow(sessionId);

    if (session.status !== 'confirmed') {
      throw new BadRequestException(
        'La session doit etre confirmee avant de pouvoir valider sa tenue.',
      );
    }

    const isInitiator = session.proposedById === userId;
    const isRecipient = session.recipientId === userId;
    if (!isInitiator && !isRecipient) throw new ForbiddenException();

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

    const { confirmedByA, confirmedByB } = updated;
    const bothAnswered = confirmedByA !== null && confirmedByB !== null;

    if (bothAnswered) {
      if (confirmedByA && confirmedByB) {
        await this.completeSession(sessionId, updated);
      } else if (!confirmedByA && !confirmedByB) {
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
        await this.prisma.session.update({
          where: { id: sessionId },
          data: { status: 'disputed' },
        });
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

    return { message: 'Confirmation enregistree.' };
  }

  // GET /sessions
  async getMySessions(userId: string, filters: SessionFilterDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;
    const now = new Date();

    const where: any = {
      AND: [{ OR: [{ proposedById: userId }, { recipientId: userId }] }],
    };

    if (filters.tab === 'upcoming') {
      where.AND.push({
        scheduledAt: { gte: now },
        status: { in: ['pending', 'confirmed'] },
      });
    } else {
      where.AND.push({
        OR: [
          { scheduledAt: { lt: now } },
          {
            status: {
              in: ['completed', 'cancelled', 'disputed', 'auto_completed'],
            },
          },
        ],
      });
    }

    if (filters.status) {
      where.status = filters.status;
    }

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
          reviews: { select: { reviewerId: true } },
        },
      }),
      this.prisma.session.count({ where }),
    ]);

    const shaped = sessions.map((s) => ({
      ...s,
      proposedBy: s.proposedBy,
      recipient: s.recipient,
    }));

    return {
      data: shaped,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // GET /sessions/:id
  async findOne(sessionId: string, userId: string) {
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

    if (!session) throw new NotFoundException('Session non trouvee');

    const isParticipant =
      session.proposedBy.id === userId || session.recipient.id === userId;
    if (!isParticipant) throw new ForbiddenException();

    return session;
  }

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

    if (session.creditsUsed > 0) {
      const creditsEarned = CreditsService.creditsForDuration(
        session.durationMinutes,
      );
      
      if (creditsEarned > 0) {
        await this.creditsService.credit(
          session.recipientId,
          creditsEarned,
          sessionId,
        );
      }
    }

    await this.prisma.user.updateMany({
      where: { id: { in: [session.proposedById, session.recipientId] } },
      data: { sessionsCompleted: { increment: 1 } },
    });

    await this.prisma.notification.createMany({
      data: [
        {
          userId: session.proposedById,
          type: 'session_completed',
          payload: {
            sessionId,
            body: "Votre session d'echange est maintenant terminee. N'oubliez pas de laisser un avis !",
          },
        },
        {
          userId: session.recipientId,
          type: 'session_completed',
          payload: {
            sessionId,
            body: "Votre session d'echange est maintenant terminee. N'oubliez pas de laisser un avis !",
          },
        },
      ],
    });
  }

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
    if (!session) throw new NotFoundException('session non trouvee');
    return session;
  }

  // GET /sessions/:id/messages
  async getMessages(sessionId: string, userId: string) {
    const session = await this.findSessionOrThrow(sessionId);

    if (session.proposedById !== userId && session.recipientId !== userId) {
      throw new ForbiddenException();
    }

    const messages = await this.prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return messages;
  }

  // POST /sessions/:id/messages
  async createMessage(
    sessionId: string,
    userId: string,
    dto: CreateMessageDto,
  ) {
    const session = await this.findSessionOrThrow(sessionId);

    if (session.proposedById !== userId && session.recipientId !== userId) {
      throw new ForbiddenException();
    }

    if (!['pending', 'confirmed'].includes(session.status)) {
      throw new BadRequestException(
        'Vous ne pouvez envoyer des messages que dans les sessions en attente ou confirmees.',
      );
    }

    const message = await this.prisma.message.create({
      data: {
        sessionId,
        senderId: userId,
        content: dto.content,
        imageUrl: dto.imageUrl,
        isMeetingLinkSuggestion: dto.isMeetingLinkSuggestion ?? false,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return message;
  }
}
