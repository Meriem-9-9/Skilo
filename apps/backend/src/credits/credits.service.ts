import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const CREDIT_CAP = 20;

@Injectable()
export class CreditsService {
  constructor(private readonly prisma: PrismaService) {}

  async reserve(userId: string, amount: number, sessionId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true, creditReserved: true },
    });
    if (!user) throw new BadRequestException('User not found');

    const available = user.creditBalance - user.creditReserved;

    if (available < amount) {
      throw new BadRequestException(
        `Vous n'avez pas assez de crédits. Il vous faut ${amount} crédit(s), vous en avez ${available}.`,
      );
    }

    // Move amount from available → reserved
    const [_, transaction] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { creditReserved: { increment: amount } },
      }),
      this.prisma.creditTransaction.create({
        data: {
          userId,
          sessionId: (sessionId === 'pending' || !sessionId) ? null : sessionId,
          type: 'session_reserved',
          amount: -amount, // negative = going out
          balanceAfter: user.creditBalance, // balance unchanged yet
          description: `${amount} crédit(s) réservé(s) pour la session`,
        },
      }),
    ]);

    return transaction;
  }

  // ─── debit(userId, amount, sessionId) ────────────────────────────────────
  // Called when a session is ACCEPTED.
  // Converts reserved → actually spent.
  async debit(userId: string, amount: number, sessionId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true, creditReserved: true },
    });
    if (!user) return;

    const newBalance = user.creditBalance - amount;
    const newReserved = Math.max(0, user.creditReserved - amount);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { creditBalance: newBalance, creditReserved: newReserved },
      }),
      this.prisma.creditTransaction.create({
        data: {
          userId,
          sessionId,
          type: 'session_spent',
          amount: -amount,
          balanceAfter: newBalance,
          description: `${amount} crédit(s) débité(s) pour la session`,
        },
      }),
    ]);
  }

  // ─── credit(userId, amount, sessionId) ───────────────────────────────────
  // Called when a session is COMPLETED — pays the teacher.
  // Caps at 20 and warns if the user would lose credits (Q3 decision).
  async credit(
    userId: string, 
    amount: number, 
    sessionId: string, 
    type: string = 'session_earned',
    customDescription?: string
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true },
    });
    if (!user) return;
 
    const rawNewBalance = user.creditBalance + amount;
    const surplus = Math.max(0, rawNewBalance - CREDIT_CAP);
    const actualAmount = amount - surplus;
    const newBalance = Math.min(rawNewBalance, CREDIT_CAP);
 
    // Warn BEFORE crediting if credits would be lost (Q3 decision)
    if (surplus > 0) {
      await this.prisma.notification.create({
        data: {
          userId,
          type: 'credits_earned',
          payload: {
            message: `Attention, votre solde atteint le plafond de ${CREDIT_CAP} crédits. ${surplus} crédit(s) seront perdus.`,
            body: `Plafond atteint : ${surplus} crédit(s) non crédités`,
            surplus,
          },
        },
      });
    }
 
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { creditBalance: newBalance },
      }),
      this.prisma.creditTransaction.create({
        data: {
          userId,
          sessionId: sessionId === 'none' ? null : sessionId,
          type: type as any,
          amount: actualAmount,
          balanceAfter: newBalance,
          description: customDescription ?? `${actualAmount} crédit(s) gagné(s) pour la session enseignée`,
        },
      }),
    ]);
 
    // Notify the teacher
    await this.prisma.notification.create({
      data: {
        userId,
        type: 'credits_earned',
        payload: {
          message: customDescription ? `Vous avez reçu ${actualAmount} crédit(s) : ${customDescription}` : `Vous avez gagné ${actualAmount} crédit(s) suite à votre session.`,
          body: `Vous avez gagné ${actualAmount} crédit(s)`,
          amount: actualAmount,
          sessionId: sessionId === 'none' ? null : sessionId,
        },
      },
    });
  }

  // ─── refund(userId, amount, sessionId) ────────────────────────────────────
  // Called when a credit-based session is CANCELLED or DECLINED.
  // Releases reserved credits back to available.
  async refund(userId: string, amount: number, sessionId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true, creditReserved: true },
    });
    if (!user) return;

    const newReserved = Math.max(0, user.creditReserved - amount);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { creditReserved: newReserved },
        // creditBalance stays the same — the debit never happened
      }),
      this.prisma.creditTransaction.create({
        data: {
          userId,
          sessionId,
          type: 'session_released',
          amount, // positive = coming back
          balanceAfter: user.creditBalance,
          description: `${amount} crédit(s) remboursé(s) suite à l'annulation`,
        },
      }),
    ]);

    await this.prisma.notification.create({
      data: {
        userId,
        type: 'credits_refunded',
        payload: {
          message: `${amount} crédit(s) remboursé(s) suite à l'annulation de la session.`,
          body: `${amount} crédit(s) remboursés`,
          amount,
          sessionId,
        },
      },
    });
  }

  // ─── GET /credits/balance ─────────────────────────────────────────────────
  async getBalance(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true, creditReserved: true },
    });
    if (!user) throw new BadRequestException('User not found');

    const available = user.creditBalance - user.creditReserved;

    return {
      available,
      reserved: user.creditReserved,
      total: user.creditBalance,
      cap: CREDIT_CAP,
      progressToCap: `${user.creditBalance}/${CREDIT_CAP}`,
      // 1 credit = 1 hour of learning
      hoursAccessible: available,
    };
  }

  // ─── GET /credits/history ─────────────────────────────────────────────────
  async getHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [transactions, total] = await this.prisma.$transaction([
      this.prisma.creditTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          amount: true,
          balanceAfter: true,
          description: true,
          createdAt: true,
          session: {
            select: {
              id: true,
              scheduledAt: true,
              proposedBy: { select: { firstName: true } },
              recipient: { select: { firstName: true } },
            },
          },
        },
      }),
      this.prisma.creditTransaction.count({ where: { userId } }),
    ]);

    return {
      data: transactions,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Internal helper — how many credits a session costs ───────────────────
  // 1 credit per hour, rounded UP (spec FC-06-A)
  static creditsForDuration(durationMinutes: number): number {
    return Math.ceil(durationMinutes / 60);
  }
}
