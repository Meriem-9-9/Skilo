import { Module } from '@nestjs/common';
import { CreditsController } from './credits.controller';
import { CreditsService } from './credits.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CreditsController],
  providers: [CreditsService, PrismaService],
  exports: [CreditsService], // SessionsModule needs this
})
export class CreditsModule {}
