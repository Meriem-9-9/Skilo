import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OnboardingDto } from './dto/onboarding.dto';
import { SkillType } from 'generated/prisma/client';
import { MatchingService } from '../matching/matching.service';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matchingService: MatchingService,
  ) {}

  // ─── GET /onboarding/status ───────────────────────────────────────────────
  async getStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        isOnboarded: true,
        city: true,
        bio: true,
        avatarUrl: true,
        skills: {
          select: {
            type: true,
            level: true,
            skillCatalog: { select: { id: true, name: true, category: true } },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return {
      isOnboarded: user.isOnboarded,
      // Tells the frontend which steps are already filled
      steps: {
        skillsOffered: user.skills.filter((s) => s.type === SkillType.offered),
        skillsWanted: user.skills.filter((s) => s.type === SkillType.wanted),
        cityAndBio: { city: user.city, bio: user.bio },
        avatar: user.avatarUrl,
      },
    };
  }

  // ─── POST /onboarding ─────────────────────────────────────────────────────
  async complete(userId: string, dto: OnboardingDto) {
    // 1. Verify the user isn't already onboarded
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.isOnboarded) {
      throw new BadRequestException(
        'Onboarding already completed. Use PATCH /users/me to update your profile.',
      );
    }

    // 2. Collect all skillIds from both lists
    const allSkillIds = [
      ...dto.skillsOffered.map((s) => s.skillId),
      ...dto.skillsWanted.map((s) => s.skillId),
    ];

    // 3. Verify every skillId exists in the catalog (approved or pending_review)
    const foundSkills = await this.prisma.skillCatalog.findMany({
      where: {
        id: { in: allSkillIds },
        status: { in: ['approved', 'pending_review'] },
      },
      select: { id: true },
    });

    const foundIds = new Set(foundSkills.map((s) => s.id));
    const missingIds = allSkillIds.filter((id) => !foundIds.has(id));

    if (missingIds.length > 0) {
      throw new BadRequestException(
        `The following skill IDs were not found: ${missingIds.join(', ')}`,
      );
    }

    // 4. Build the UserSkill records to insert
    const skillsToCreate = [
      ...dto.skillsOffered.map((s) => ({
        userId,
        skillCatalogId: s.skillId,
        type: SkillType.offered,
        level: s.level,
      })),
      ...dto.skillsWanted.map((s) => ({
        userId,
        skillCatalogId: s.skillId,
        type: SkillType.wanted,
        level: s.level,
      })),
    ];

    // 5. Run everything in a DB transaction so either all saves succeed or none do
    await this.prisma.$transaction(async (tx) => {
      // Delete any partial skills that may exist from a previous failed attempt
      await tx.userSkill.deleteMany({ where: { userId } });

      // Create the new skills
      await tx.userSkill.createMany({ data: skillsToCreate });

      // Update the user: city, bio, avatar, isOnboarded = true
      await tx.user.update({
        where: { id: userId },
        data: {
          city: dto.city,
          bio: dto.bio ?? null,
          avatarUrl: dto.avatarUrl ?? null,
          isOnboarded: true,
          // Log the welcome bonus credit transaction
          // creditBalance is already set to 2 at register (schema default)
        },
      });

      // Log the welcome bonus as a CreditTransaction for history visibility (FC-06)
      await tx.creditTransaction.create({
        data: {
          userId,
          type: 'welcome_bonus',
          amount: 2,
          balanceAfter: user.creditBalance, // still 2 from register
          description: "Crédit de bienvenue à l'inscription",
        },
      });
    });

    // 6. Return the updated profile (without sensitive fields)
    const updated = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        city: true,
        bio: true,
        avatarUrl: true,
        isOnboarded: true,
        creditBalance: true,
        skills: {
          select: {
            id: true,
            type: true,
            level: true,
            skillCatalog: { select: { id: true, name: true, category: true } },
          },
        },
      },
    });

    this.matchingService.recalculateForUser(userId).catch(() => {});

    return {
      message: 'Onboarding completed successfully',
      user: updated,
      redirectTo: '/dashboard',
    };
  }
}
