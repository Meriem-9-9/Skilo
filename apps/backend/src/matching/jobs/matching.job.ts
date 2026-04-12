import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { MatchingService } from '../matching.service';

/**
 * MatchingJob
 *
 * Runs every hour and recalculates matches for every active, onboarded user.
 * This catches any cases that were missed by event-driven triggers
 * (login, profile update, skill changes).
 *
 * To use this job, make sure @nestjs/schedule is installed and
 * ScheduleModule.forRoot() is added in AppModule.
 */
@Injectable()
export class MatchingJob {
  private readonly logger = new Logger(MatchingJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly matchingService: MatchingService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async runHourlyRecalculation() {
    this.logger.log('Starting hourly matching recalculation...');

    // Fetch all active, onboarded users
    const users = await this.prisma.user.findMany({
      where: { isActive: true, isOnboarded: true },
      select: { id: true },
    });

    this.logger.log(`Recalculating matches for ${users.length} users`);

    // Process one by one — not in parallel to avoid DB overload
    for (const user of users) {
      try {
        await this.matchingService.recalculateForUser(user.id);
      } catch (error) {
        // Log and continue — one failure shouldn't stop the whole job
        this.logger.error(`Failed for user ${user.id}:`, error);
      }
    }

    this.logger.log('Hourly matching recalculation completed.');
  }
}
