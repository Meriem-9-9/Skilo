import { Module } from '@nestjs/common';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { MatchingModule } from '../matching/matching.module';

@Module({
  imports: [
    AuthModule, // imports JwtGuard + JwtModule so the guard works
    MatchingModule,
  ],
  controllers: [OnboardingController],
  providers: [OnboardingService, PrismaService],
})
export class OnboardingModule {}
