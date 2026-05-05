import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { SessionsService } from '../sessions.service';

@Injectable()
export class SessionsJob {
  private readonly logger = new Logger(SessionsJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionsService: SessionsService,
  ) {}

  // ─── 1-hour reminder — runs every 15 minutes ──────────────────────────────
  @Cron(CronExpression.EVERY_10_MINUTES)
  async sendReminders() {
    const now = new Date();
    const in1h = new Date(now.getTime() + 60 * 60 * 1000);
    const in1h15m = new Date(now.getTime() + 75 * 60 * 1000);

    const sessions = await this.prisma.session.findMany({
      where: {
        status: 'confirmed',
        scheduledAt: { gte: in1h, lte: in1h15m },
      },
      select: {
        id: true,
        proposedById: true,
        recipientId: true,
        scheduledAt: true,
        meetingLink: true,
        proposedBy: { select: { firstName: true } },
        recipient: { select: { firstName: true } },
      },
    });

    for (const session of sessions) {
      await this.prisma.notification.createMany({
        data: [
          {
            userId: session.proposedById,
            type: 'session_reminder',
            payload: {
              sessionId: session.id,
              otherUserFirstName: session.recipient.firstName,
              scheduledAt: session.scheduledAt,
              meetingLink: session.meetingLink,
            },
          },
          {
            userId: session.recipientId,
            type: 'session_reminder',
            payload: {
              sessionId: session.id,
              otherUserFirstName: session.proposedBy.firstName,
              scheduledAt: session.scheduledAt,
              meetingLink: session.meetingLink,
            },
          },
        ],
        skipDuplicates: true,
      });
    }

    if (sessions.length > 0) {
      this.logger.log(`Sent reminders for ${sessions.length} session(s)`);
    }
  }

  // ─── Auto-complete — runs every 30 minutes ────────────────────────────────
  // If one user confirmed and the other is silent for 24h → auto_completed
  @Cron(CronExpression.EVERY_30_MINUTES)
  async autoComplete() {
    const deadline = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h ago

    const sessions = await this.prisma.session.findMany({
      where: {
        status: 'confirmed',
        scheduledAt: { lt: new Date() }, // session has passed
        updatedAt: { lt: deadline }, // no update in 24h
        OR: [
          // One confirmed yes, other hasn't answered yet (null)
          { confirmedByA: true, confirmedByB: null },
          { confirmedByA: null, confirmedByB: true },
        ],
      },
      select: {
        id: true,
        proposedById: true,
        recipientId: true,
        durationMinutes: true,
        creditsUsed: true,
      },
    });

    for (const session of sessions) {
      try {
        await this.sessionsService.completeSession(session.id, session, true);
        this.logger.log(`Auto-completed session ${session.id}`);
      } catch (error) {
        this.logger.error(
          `Failed to auto-complete session ${session.id}:`,
          error,
        );
      }
    }
  }

  // ─── Dispute resolver — runs every hour ───────────────────────────────────
  // Disputed sessions auto-resolve after 48h (Q4 decision)
  @Cron(CronExpression.EVERY_HOUR)
  async resolveDisputes() {
    const deadline = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48h ago

    const sessions = await this.prisma.session.findMany({
      where: {
        status: 'disputed',
        updatedAt: { lt: deadline },
      },
      select: {
        id: true,
        proposedById: true,
        recipientId: true,
        durationMinutes: true,
        creditsUsed: true,
      },
    });

    for (const session of sessions) {
      try {
        // Auto-resolve: treat as completed for credit/review purposes
        // isDisputed flag stays true in DB for future admin audit
        await this.sessionsService.completeSession(session.id, session, true);

        // Notify both users
        await this.prisma.notification.createMany({
          data: [
            {
              userId: session.proposedById,
              type: 'session_completed',
              payload: { sessionId: session.id, autoResolved: true },
            },
            {
              userId: session.recipientId,
              type: 'session_completed',
              payload: { sessionId: session.id, autoResolved: true },
            },
          ],
        });

        this.logger.log(`Auto-resolved disputed session ${session.id}`);
      } catch (error) {
        this.logger.error(
          `Failed to resolve dispute for session ${session.id}:`,
          error,
        );
      }
    }
  }
}
