import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { SkillsService } from '../skills/skills.service';
import { MatchingModule } from '../matching/matching.module';

@Module({
  imports: [AuthModule, MatchingModule], // provides JwtGuard + JwtModule
  controllers: [UsersController],
  providers: [UsersService, SkillsService, PrismaService],
  exports: [UsersService], // exported so MatchingService can call calculateStrength later
})
export class UsersModule {}
