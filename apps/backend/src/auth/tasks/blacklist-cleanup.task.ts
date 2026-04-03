// auth/tasks/blacklist-cleanup.task.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * Tâche planifiée : supprime chaque nuit les tokens blacklistés expirés.
 * Rôle de TokenBlacklist :
 *   - Stocke le SHA-256 des refresh tokens révoqués (logout / rotation).
 *   - Empêche leur réutilisation même si la signature JWT est encore valide.
 *   - expiresAt = date d'expiration du refresh token original (7j).
 *   - Au-delà de expiresAt, le token serait invalide de toute façon → on purge.
 *
 * Ajouter au AppModule :
 *   imports: [ScheduleModule.forRoot(), ...]
 */
@Injectable()
export class BlacklistCleanupTask {
  private readonly logger = new Logger(BlacklistCleanupTask.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanExpiredTokens() {
    const result = await this.prisma.tokenBlacklist.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    this.logger.log(`Blacklist purge : ${result.count} token(s) supprimé(s)`);
  }
}
