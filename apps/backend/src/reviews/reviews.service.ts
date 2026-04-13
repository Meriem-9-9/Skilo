import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitReviewDto } from './dto/submit-review.dto';

const REVIEW_WINDOW_DAYS = 7;
const BADGE_MIN_SESSIONS = 5;
const BADGE_MIN_RATING = 4.0;

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  // ══════════════════════════════════════════════════════════════════════════
  // POST /reviews
  // ══════════════════════════════════════════════════════════════════════════
  async submit(reviewerId: string, dto: SubmitReviewDto) {
    // 1. Fetch the session
    const session = await this.prisma.session.findUnique({
      where: { id: dto.sessionId },
      select: {
        id: true,
        status: true,
        proposedById: true,
        recipientId: true,
        updatedAt: true,
        skillsExchanged: true,
      },
    });

    if (!session) throw new NotFoundException('Session not found');

    // 2. Session must be completed or auto_completed
    if (!['completed', 'auto_completed'].includes(session.status)) {
      throw new ForbiddenException(
        "Vous ne pouvez évaluer qu'une session complétée.",
      );
    }

    // 3. Reviewer must be a participant
    const isParticipant =
      session.proposedById === reviewerId || session.recipientId === reviewerId;
    if (!isParticipant) throw new ForbiddenException();

    // 4. 7-day review window
    const windowClose = new Date(
      session.updatedAt.getTime() + REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );
    if (new Date() > windowClose) {
      throw new ForbiddenException(
        "La fenêtre d'évaluation est fermée pour cette session.",
      );
    }

    // 5. Can't review twice
    const existing = await this.prisma.review.findUnique({
      where: {
        sessionId_reviewerId: { sessionId: dto.sessionId, reviewerId },
      },
    });
    if (existing) {
      throw new ConflictException('Vous avez déjà évalué cette session.');
    }

    // 6. Determine who is being reviewed (the other participant)
    const revieweeId =
      session.proposedById === reviewerId
        ? session.recipientId
        : session.proposedById;

    // Extract the skill from skillsExchanged JSON
    const skills = session.skillsExchanged as {
      skillCatalogId: string;
      role: string;
    }[];
    // Reviewer evaluates the OTHER person's teaching skill
    const taughtSkill = skills.find((s) =>
      reviewerId === session.proposedById
        ? s.role === 'wanted'
        : s.role === 'offered',
    );

    // 7. Save review — isVisible = false until both sides reviewed
    await this.prisma.review.create({
      data: {
        sessionId: dto.sessionId,
        reviewerId,
        revieweeId,
        skillCatalogId: taughtSkill?.skillCatalogId ?? null,
        rating: dto.globalRating,
        ratingPedagogy: dto.pedagogyRating ?? null,
        ratingPunctuality: dto.punctualityRating ?? null,
        ratingCommunication: dto.communicationRating ?? null,
        comment: dto.comment ?? null,
        isVisible: false,
        // expiresAt = session completion date + 7 days
        expiresAt: windowClose,
      },
    });

    // 8. Check if the OTHER person already submitted their review
    const otherReview = await this.prisma.review.findUnique({
      where: {
        sessionId_reviewerId: {
          sessionId: dto.sessionId,
          reviewerId: revieweeId,
        },
      },
    });

    if (otherReview) {
      // Both reviews exist → make both visible
      await this.prisma.review.updateMany({
        where: { sessionId: dto.sessionId },
        data: { isVisible: true },
      });
    }

    // 9. Recalculate averages for the reviewee
    await this.recalculateAverages(revieweeId);

    // 10. Check badge eligibility
    await this.checkReliableBadge(revieweeId);

    // 11. Notify reviewee that they received a review (only when visible)
    if (otherReview) {
      await this.prisma.notification.create({
        data: {
          userId: revieweeId,
          type: 'review_received',
          payload: { sessionId: dto.sessionId },
        },
      });
    }

    return { message: 'Votre évaluation a été enregistrée.' };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GET /reviews/session/:sessionId — own reviews for a session
  // ══════════════════════════════════════════════════════════════════════════
  async getForSession(sessionId: string, userId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: { proposedById: true, recipientId: true },
    });
    if (!session) throw new NotFoundException('Session not found');

    const isParticipant =
      session.proposedById === userId || session.recipientId === userId;
    if (!isParticipant) throw new ForbiddenException();

    return this.prisma.review.findMany({
      where: { sessionId, isVisible: true },
      select: {
        id: true,
        rating: true,
        ratingPedagogy: true,
        ratingPunctuality: true,
        ratingCommunication: true,
        comment: true,
        submittedAt: true,
        reviewer: { select: { id: true, firstName: true, avatarUrl: true } },
        reviewee: { select: { id: true, firstName: true } },
      },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GET /users/:id/reviews — public reviews for a user profile
  // ══════════════════════════════════════════════════════════════════════════
  async getForUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where: { revieweeId: userId, isVisible: true },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          rating: true,
          ratingPedagogy: true,
          ratingPunctuality: true,
          ratingCommunication: true,
          comment: true,
          submittedAt: true,
          skillCatalog: { select: { name: true } },
          reviewer: { select: { firstName: true, avatarUrl: true } },
        },
      }),
      this.prisma.review.count({
        where: { revieweeId: userId, isVisible: true },
      }),
    ]);

    return {
      data: reviews,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INTERNAL — recalculate all average ratings for a user
  // ══════════════════════════════════════════════════════════════════════════
  async recalculateAverages(userId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { revieweeId: userId, isVisible: true },
      select: {
        rating: true,
        ratingPedagogy: true,
        ratingPunctuality: true,
        ratingCommunication: true,
      },
    });

    if (reviews.length === 0) return;

    const avg = (values: (number | null)[]) => {
      const valid = values.filter((v): v is number => v !== null);
      return valid.length > 0
        ? parseFloat(
            (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(2),
          )
        : null;
    };

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        avgRating: avg(reviews.map((r) => r.rating)),
        avgPedagogy: avg(reviews.map((r) => r.ratingPedagogy)),
        avgPunctuality: avg(reviews.map((r) => r.ratingPunctuality)),
        avgCommunication: avg(reviews.map((r) => r.ratingCommunication)),
      },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INTERNAL — check and award/revoke "Fiable" badge (FC-05-B)
  // ══════════════════════════════════════════════════════════════════════════
  async checkReliableBadge(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        sessionsCompleted: true,
        avgRating: true,
        hasBadgeFiable: true,
      },
    });
    if (!user) return;

    const qualifies =
      user.sessionsCompleted >= BADGE_MIN_SESSIONS &&
      user.avgRating !== null &&
      Number(user.avgRating) >= BADGE_MIN_RATING;

    if (qualifies && !user.hasBadgeFiable) {
      // Award the badge
      await this.prisma.user.update({
        where: { id: userId },
        data: { hasBadgeFiable: true },
      });
      await this.prisma.notification.create({
        data: {
          userId,
          type: 'badge_earned',
          payload: {
            badge: 'fiable',
            message: 'Félicitations — vous avez obtenu le badge Fiable !',
          },
        },
      });
    } else if (!qualifies && user.hasBadgeFiable) {
      // Silently revoke — no notification (spec FC-05-B)
      await this.prisma.user.update({
        where: { id: userId },
        data: { hasBadgeFiable: false },
      });
    }
  }
}
