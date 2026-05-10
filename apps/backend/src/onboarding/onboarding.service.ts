import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OnboardingDto } from './dto/onboarding.dto';
import { SkillType } from '@prisma/client';
import { MatchingService } from '../matching/matching.service';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matchingService: MatchingService,
  ) { }

  // GET /onboarding/status
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

    if (!user) throw new NotFoundException('user non trouve');

    return {
      isOnboarded: user.isOnboarded,
      // on renvoie ce qui est deja rempli pour le frontend
      steps: {
        skillsOffered: user.skills.filter((s) => s.type === SkillType.offered),
        skillsWanted: user.skills.filter((s) => s.type === SkillType.wanted),
        cityAndBio: { city: user.city, bio: user.bio },
        avatar: user.avatarUrl,
      },
    };
  }

  // POST /onboarding
  async complete(userId: string, dto: OnboardingDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('user non trouve');

    if (user.isOnboarded) {
      throw new BadRequestException('onboarding deja fini');
    }

    // collecter 
    const allSkillIds = [
      ...dto.skillsOffered.map((s) => s.skillId),
      ...dto.skillsWanted.map((s) => s.skillId),
    ];

    // verifier que les skills existent
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
        `competences non trouvees: ${missingIds.join(', ')}`,
      );
    }

    // preparer les skills a creer
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

    // transaction pour tout sauvegarder d'un coup
    await this.prisma.$transaction(async (tx) => {
      await tx.userSkill.deleteMany({ where: { userId } });

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
          balanceAfter: user.creditBalance, 
          description: "credit de bienvenue",
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

    this.matchingService.recalculateForUser(userId).catch(() => { });

    return {
      message: 'onboarding fini avec succes',
      user: updated,
      redirectTo: '/dashboard',
    };
  }
}
