import { Module } from '@nestjs/common';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { MatchingJob } from './jobs/matching.job';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule, // provides JwtGuard + RolesGuard
  ],
  controllers: [MatchingController],
  providers: [MatchingService, MatchingJob, PrismaService],
  exports: [MatchingService], // exported so AuthService, UsersService can call recalculateForUser
})
export class MatchingModule {}
