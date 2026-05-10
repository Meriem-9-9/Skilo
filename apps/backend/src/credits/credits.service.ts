import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const CREDIT_CAP = 20;

@Injectable()
export class CreditsService {
  constructor(private readonly prisma: PrismaService) {}

  // reservation de credits
  async reserve(userId: string, amount: number, sessionId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true, creditReserved: true },
    });
    if (!user) throw new BadRequestException('User not found');

    const available = user.creditBalance - user.creditReserved;

    if (available < amount) {
      throw new BadRequestException(
        `pas assez de credits. il vous faut ${amount}, vous avez ${available}`,
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
          description: `${amount} credit(s) reserve(s) pour la session`,
        },
      }),
    ]);

    return transaction;
  }

  // debit de credits apres acceptation
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
          description: `${amount} credit(s) debite(s) pour la session`,
        },
      }),
    ]);
  }

  // ajout de credits apres session terminee
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
            message: `attention, votre solde atteint le plafond de ${CREDIT_CAP} credits. ${surplus} seront perdus`,
            body: `plafond atteint : ${surplus} non credites`,
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
          description: customDescription ?? `${actualAmount} credit(s) gagne(s) pour la session`,
        },
      }),
    ]);
 
    // Notify the teacher
    await this.prisma.notification.create({
      data: {
        userId,
        type: 'credits_earned',
        payload: {
          message: customDescription ? `vous avez recu ${actualAmount} : ${customDescription}` : `vous avez gagne ${actualAmount} suite a votre session`,
          body: `vous avez gagne ${actualAmount} credits`,
          amount: actualAmount,
          sessionId: sessionId === 'none' ? null : sessionId,
        },
      },
    });
  }

  // remboursement si session annulee
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
          description: `${amount} credit(s) rembourse(s) suite a l'annulation`,
        },
      }),
    ]);

    await this.prisma.notification.create({
      data: {
        userId,
        type: 'credits_refunded',
        payload: {
          message: `${amount} credit(s) rembourse(s) suite a l'annulation`,
          body: `${amount} credits rembourses`,
          amount,
          sessionId,
        },
      },
    });
  }

  // GET /credits/balance
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

  // GET /credits/history
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

  // Calcul du nombre de credits necessaires pour une duree donnee (1 credit = 1 heure de cours)
  static creditsForDuration(durationMinutes: number): number {
    return Math.ceil(durationMinutes / 60);
  }
}
