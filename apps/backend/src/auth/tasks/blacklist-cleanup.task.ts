import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BlacklistCleanupTask {
  private readonly logger = new Logger(BlacklistCleanupTask.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanExpiredTokens() {
    try {
      const result = await this.prisma.tokenBlacklist.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });

      this.logger.log(`Cleaned ${result.count} expired tokens from blacklist`);
    } catch (error) {
      this.logger.error('Failed to clean expired tokens:', error);
    }
  }
}
