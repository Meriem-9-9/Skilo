import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { MatchingService } from '../matching.service';

// job qui tourne a chaque heure pour recalculer les matches
@Injectable()
export class MatchingJob {
  private readonly logger = new Logger(MatchingJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly matchingService: MatchingService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async runHourlyRecalculation() {
    this.logger.log('Lancement du recalcul horaire...');

    // recuperation de tous les users actifs
    const users = await this.prisma.user.findMany({
      where: { isActive: true, isOnboarded: true },
      select: { id: true },
    });

    this.logger.log(`Recalcul de ${users.length} users`);

    // boucle un par un
    for (const user of users) {
      try {
        await this.matchingService.recalculateForUser(user.id);
      } catch (error) {
        this.logger.error(`Erreur pour user ${user.id}:`, error);
      }
    }

    this.logger.log('Recalcul termine.');
  }
}
