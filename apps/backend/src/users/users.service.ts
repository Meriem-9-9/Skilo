import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AddSkillDto, UpdateSkillLevelDto } from './dto/skill.dto';
import { SkillType } from '@prisma/client';
import { MatchingService } from '../matching/matching.service';
// selection des champs publics
const USER_PUBLIC_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  city: true,
  bio: true,
  avatarUrl: true,
  avgRating: true,
  avgPedagogy: true,
  avgPunctuality: true,
  avgCommunication: true,
  sessionsCompleted: true,
  hasBadgeFiable: true,
  profileScore: true,
  isOnboarded: true,
  createdAt: true,
};

const SKILL_SELECT = {
  id: true,
  type: true,
  level: true,
  skillCatalog: {
    select: { id: true, name: true, category: true },
  },
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matchingService: MatchingService,
  ) {}

  // GET /users/me
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...USER_PUBLIC_SELECT,
        email: true,
        creditBalance: true,
        creditReserved: true,
        skills: { select: SKILL_SELECT },
      },
    });

    if (!user) throw new NotFoundException('user non trouve');

    return {
      ...user,
      profileStrength: this.calculateStrength(user),
    };
  }

  // PATCH /users/me
  async updateMe(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('user non trouve');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName && { lastName: dto.lastName }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      },
      select: {
        ...USER_PUBLIC_SELECT,
        email: true,
        creditBalance: true,
        creditReserved: true,
        skills: { select: SKILL_SELECT },
      },
    });

    // on recalcule la force du profil
    const strength = this.calculateStrength(updated);

    // bonus de 1 credit si on atteint 100% pour la premiere fois
    if (strength.score === 100 && user.profileScore < 100) {
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: userId },
          data: {
            profileScore: 100,
            creditBalance: { increment: 1 },
          },
        }),
        this.prisma.creditTransaction.create({
          data: {
            userId,
            type: 'profile_bonus',
            amount: 1,
            balanceAfter: updated.creditBalance + 1,
            description: 'Bonus profil complet (100%)',
          },
        }),
      ]);
    } else {
      // on met a jour le score meme si c'est pas 100
      await this.prisma.user.update({
        where: { id: userId },
        data: { profileScore: strength.score },
      });
    }

    return {
      message: 'profil mis a jour',
      user: { ...updated, profileStrength: strength },
    };
  }

  // DELETE /users/me
  async deleteMe(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
    return { message: 'compte desactive' };
  }

  // GET /users/:id
  async getPublicProfile(targetId: string, currentUserId: string) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: {
        ...USER_PUBLIC_SELECT,
        isActive: true,
        email: true,
        skills: { select: SKILL_SELECT },
        reviewsReceived: {
          where: { isVisible: true },
          orderBy: { submittedAt: 'desc' },
          take: 20,
          select: {
            id: true,
            rating: true,
            ratingPedagogy: true,
            ratingPunctuality: true,
            ratingCommunication: true,
            comment: true,
            submittedAt: true,
            skillCatalog: { select: { name: true } },
            reviewer: { select: { firstName: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!target || !target.isOnboarded || !target.isActive) {
      throw new NotFoundException('user non trouve');
    }

    const actionButton = await this.resolveActionButton(
      currentUserId,
      targetId,
    );

    const hasConfirmedSession = await this.prisma.session.findFirst({
      where: {
        status: 'confirmed',
        OR: [
          { proposedById: currentUserId, recipientId: targetId },
          { proposedById: targetId, recipientId: currentUserId },
        ],
      },
    });

    const [id1, id2] = [currentUserId, targetId].sort();
    const match = await this.prisma.match.findUnique({
      where: {
        userAId_userBId: { userAId: id1, userBId: id2 },
      },
      select: { score: true, label: true, type: true, matchedPairs: true },
    });

    return {
      ...target,
      email: hasConfirmedSession ? target['email'] : undefined,
      actionButton,
      match: match || null,
    };
  }

  // GET /users
  async listUsers(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: { isActive: true, isOnboarded: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          ...USER_PUBLIC_SELECT,
          skills: { select: SKILL_SELECT },
        },
      }),
      this.prisma.user.count({ where: { isActive: true, isOnboarded: true } }),
    ]);

    return {
      data: users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // POST /users/me/skills
  async addSkill(userId: string, dto: AddSkillDto) {
    // verifier si l'utilisateur avoir deja 5 skills
    const count = await this.prisma.userSkill.count({
      where: { userId, type: dto.type },
    });
    if (count >= 5) {
      throw new BadRequestException(
        `limite de 5 competences atteinte pour ce type`,
      );
    }

    // verfier si skill exist
    const skill = await this.prisma.skillCatalog.findFirst({
      where: {
        id: dto.skillId,
        status: { in: ['approved', 'pending_review'] },
      },
    });
    if (!skill) throw new NotFoundException('competence non trouvee');

    // verfier si l'utilisateur a deja cette skill dans son profil
    const alreadyHas = await this.prisma.userSkill.findFirst({
      where: { userId, skillCatalogId: dto.skillId },
    });
    if (alreadyHas) {
      throw new BadRequestException(
        `cette competence est deja dans votre profil`,
      );
    }

    const userSkill = await this.prisma.userSkill.create({
      data: {
        userId,
        skillCatalogId: dto.skillId,
        type: dto.type,
        level: dto.level,
      },
      select: {
        id: true,
        type: true,
        level: true,
        skillCatalog: { select: { id: true, name: true, category: true } },
      },
    });

    // incrementer usecount de la skill dans skillcatalog
    await this.prisma.skillCatalog.update({
      where: { id: dto.skillId },
      data: { usageCount: { increment: 1 } },
    });

    await this.matchingService.recalculateForUser(userId); 

    return { message: 'competence ajoutee', skill: userSkill };
  }

  // PATCH /users/me/skills/:userSkillId
  async updateSkillLevel(
    userId: string,
    userSkillId: string,
    dto: UpdateSkillLevelDto,
  ) {
    const userSkill = await this.prisma.userSkill.findUnique({
      where: { id: userSkillId },
    });

    if (!userSkill) throw new NotFoundException('competence non trouvee');
    if (userSkill.userId !== userId) throw new ForbiddenException();

    const updated = await this.prisma.userSkill.update({
      where: { id: userSkillId },
      data: { level: dto.level },
      select: {
        id: true,
        type: true,
        level: true,
        skillCatalog: { select: { id: true, name: true } },
      },
    });

    await this.matchingService.recalculateForUser(userId); 

    return { message: 'niveau mis a jour', skill: updated };
  }

  // DELETE /users/me/skills/:userSkillId
  async removeSkill(userId: string, userSkillId: string) {
    const userSkill = await this.prisma.userSkill.findUnique({
      where: { id: userSkillId },
    });

    if (!userSkill) throw new NotFoundException('competence non trouvee');
    if (userSkill.userId !== userId) throw new ForbiddenException();

    const userSessions = await this.prisma.session.findMany({
      where: {
        OR: [{ proposedById: userId }, { recipientId: userId }],
      },
      select: { skillsExchanged: true },
    });

    const isLinked = userSessions.some((session) => {
      const skills = session.skillsExchanged as { skillCatalogId?: string }[];
      return (
        Array.isArray(skills) &&
        skills.some((s) => s.skillCatalogId === userSkill.skillCatalogId)
      );
    });

    if (isLinked) {
      throw new BadRequestException(
        'cette competence est liee a une session et ne peut pas etre supprimee',
      );
    }

    await this.prisma.userSkill.delete({ where: { id: userSkillId } });

    await this.matchingService.recalculateForUser(userId); 

    return { message: 'competence supprimee' };
  }

  // calcule la force du profil
  calculateStrength(user: {
    avatarUrl?: string | null;
    bio?: string | null;
    skills?: { type: string }[];
  }): { score: number; label: string; nextAction: string } {
    let score = 0;

    if (user.avatarUrl) score += 20;
    if (user.bio) score += 20;

    const offered = (user.skills ?? []).filter(
      (s) => s.type === SkillType.offered,
    ).length;
    const wanted = (user.skills ?? []).filter(
      (s) => s.type === SkillType.wanted,
    ).length;

    if (offered >= 3) score += 30;
    if (wanted >= 3) score += 30;

    let label: string;
    let nextAction: string;

    if (score <= 40) {
      label = 'Profil incomplet';
      nextAction = !user.avatarUrl
        ? 'Ajoutez une photo de profil (+20 pts)'
        : !user.bio
          ? 'Rédigez votre bio (+20 pts)'
          : offered < 3
            ? 'Ajoutez au moins 3 compétences offertes (+30 pts)'
            : 'Ajoutez au moins 3 compétences recherchées (+30 pts)';
    } else if (score <= 70) {
      label = 'Profil partiel';
      nextAction =
        offered < 3
          ? 'Ajoutez au moins 3 compétences offertes (+30 pts)'
          : wanted < 3
            ? 'Ajoutez au moins 3 compétences recherchées (+30 pts)'
            : !user.avatarUrl
              ? 'Ajoutez une photo de profil (+20 pts)'
              : 'Rédigez votre bio (+20 pts)';
    } else {
      label = 'Profil complet';
      nextAction = 'Votre profil est complet !';
    }

    return { score, label, nextAction };
  }

  // resolve le bouton d'action pour le profil public
  private async resolveActionButton(currentUserId: string, targetId: string) {
    // Check if there's an active session between the two
    const activeSession = await this.prisma.session.findFirst({
      where: {
        status: { in: ['pending', 'confirmed'] },
        OR: [
          { proposedById: currentUserId, recipientId: targetId },
          { proposedById: targetId, recipientId: currentUserId },
        ],
      },
    });
    if (activeSession) return 'view_session';

    // Check if there's a perfect match
    const match = await this.prisma.match.findFirst({
      where: {
        status: 'active',
        OR: [
          { userAId: currentUserId, userBId: targetId },
          { userAId: targetId, userBId: currentUserId },
        ],
      },
    });

    if (!match) return 'none';
    if (match.type === 'perfect') return 'propose_session';
    return 'write_message'; // partial match
  }
}
