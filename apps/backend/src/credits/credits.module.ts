import { forwardRef, Module } from '@nestjs/common';
import { CreditsController } from './credits.controller';
import { CreditsService } from './credits.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [CreditsController],
  providers: [CreditsService, PrismaService],
  exports: [CreditsService],
})
export class CreditsModule {}
