import { forwardRef, Module } from '@nestjs/common';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { MatchingJob } from './jobs/matching.job';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    forwardRef(() => AuthModule),
  ],
  controllers: [MatchingController],
  providers: [MatchingService, MatchingJob, PrismaService],
  exports: [MatchingService],
})
export class MatchingModule {}
