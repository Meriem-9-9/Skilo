import { Module } from '@nestjs/common';
import { SkillsController } from './skills.controller';
import { SkillsService } from './skills.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule, // provides JwtGuard + RolesGuard dependencies
  ],
  controllers: [SkillsController],
  providers: [SkillsService, PrismaService],
  exports: [SkillsService], // ← UsersModule, OnboardingModule, MatchingModule all need this
})
export class SkillsModule {}
