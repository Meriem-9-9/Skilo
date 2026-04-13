import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { SessionsJob } from './jobs/sessions.job';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { CreditsModule } from '../credits/credits.module';

@Module({
  imports: [
    AuthModule,
    CreditsModule, // SessionsService needs CreditsService
  ],
  controllers: [SessionsController],
  providers: [SessionsService, SessionsJob, PrismaService],
  exports: [SessionsService], // ReviewsModule needs completeSession
})
export class SessionsModule {}
