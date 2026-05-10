import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { SessionsGateway } from './sessions.gateway';
import { SessionsJob } from './jobs/sessions.job';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { CreditsModule } from '../credits/credits.module';

@Module({
  imports: [
    AuthModule,
    CreditsModule, 
  ],
  controllers: [SessionsController],
  providers: [SessionsService, SessionsGateway, SessionsJob, PrismaService],
  exports: [SessionsService], 
})
export class SessionsModule {}
