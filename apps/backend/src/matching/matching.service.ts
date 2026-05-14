import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MatchFilterDto } from './dto/match-filter.dto';
import { MatchType, SkillLevel } from '@prisma/client';
import { UserSkill, PerfectPair, PartialMatch } from './matching.types';

const LEVEL_ORDER: Record<SkillLevel, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(private readonly prisma: PrismaService) { }

  // POST /matches/recalculate
  async recalculateForUser(userId: string): Promise<void> {
    const userA = await this.getUserWithSkills(userId);
    if (!userA) return;

    const { offered: aOffered, wanted: aWanted } = this.splitSkills(
      userA.skills,
    );
    
    this.logger.debug(`Recalculating matches for ${userA.firstName} (${userId}). Offered: ${aOffered.map(s => s.skillCatalog.name)}, Wanted: ${aWanted.map(s => s.skillCatalog.name)}`);

    if (aOffered.length === 0 && aWanted.length === 0) {
      this.logger.warn(`User ${userId} has no skills. Archiving all their matches.`);
      await this.prisma.match.updateMany({
        where: { OR: [{ userAId: userId }, { userBId: userId }], status: 'active' },
        data: { status: 'archived' }
      });
      return;
    }

    const candidates = await this.getCandidates(userId);

    await this.prisma.match.updateMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
        status: 'active',
      },
      data: { status: 'archived' },
    });

    for (const userB of candidates) {
      const { offered: bOffered, wanted: bWanted } = this.splitSkills(
        userB.skills,
      );

      // on cherche les matches parfaits
      const perfectPairs = this.findPerfectMatches(
        aOffered,
        aWanted,
        bOffered,
        bWanted,
      );

      // sinon on cherche les matches partiels
      let partialSkills: PartialMatch[] = [];
      if (perfectPairs.length === 0) {
        partialSkills = this.findPartialMatches(
          aOffered,
          aWanted,
          bOffered,
          bWanted,
        );
      }

      // si rien on passe au suivant
      if (perfectPairs.length === 0 && partialSkills.length === 0) {
        continue;
      }

      // on calcule le score final
      const matchDetails = this.calculateMatchDetails(
        perfectPairs,
        partialSkills,
      );
      await this.upsertMatch(userId, userB.id, matchDetails);
    }



    this.logger.log(`Matching recalculated for user ${userId}`);
  }

  //HELPERS FOR RECALCULATE

  private async getUserWithSkills(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        skills: {
          select: {
            skillCatalogId: true,
            type: true,
            level: true,
            skillCatalog: { select: { id: true, category: true, name: true } },
          },
        },
      },
    });
  }

  private async getCandidates(userId: string) {
    return this.prisma.user.findMany({
      where: { id: { not: userId }, isActive: true, isOnboarded: true },
      select: {
        id: true,
        skills: {
          select: {
            skillCatalogId: true,
            type: true,
            level: true,
            skillCatalog: { select: { id: true, category: true, name: true } },
          },
        },
      },
    });
  }

  private async getBlockedUserIds(userId: string): Promise<Set<string>> {
    const activeSessions = await this.prisma.session.findMany({
      where: {
        status: { in: ['pending', 'confirmed'] },
        OR: [{ proposedById: userId }, { recipientId: userId }],
      },
      select: { proposedById: true, recipientId: true },
    });

    return new Set(
      activeSessions.map((s) =>
        s.proposedById === userId ? s.recipientId : s.proposedById,
      ),
    );
  }

  private splitSkills(skills: any[]) {
    return {
      offered: skills.filter((s) => s.type === 'offered') as UserSkill[],
      wanted: skills.filter((s) => s.type === 'wanted') as UserSkill[],
    };
  }

  private findPerfectMatches(
    aOffered: UserSkill[],
    aWanted: UserSkill[],
    bOffered: UserSkill[],
    bWanted: UserSkill[],
  ): PerfectPair[] {
    const perfectPairs: PerfectPair[] = [];
    for (const ao of aOffered) {
      for (const bw of bWanted) {
        if (ao.skillCatalogId !== bw.skillCatalogId) continue;
        for (const bo of bOffered) {
          for (const aw of aWanted) {
            if (bo.skillCatalogId !== aw.skillCatalogId) continue;
            perfectPairs.push({
              offeredByA: {
                id: ao.skillCatalogId,
                name: ao.skillCatalog.name,
                level: ao.level,
              },
              offeredByB: {
                id: bo.skillCatalogId,
                name: bo.skillCatalog.name,
                level: bo.level,
              },
              levelScore: this.levelBonus(ao.level, bw.level),
            });
          }
        }
      }
    }
    return perfectPairs;
  }

  private findPartialMatches(
    aOffered: UserSkill[],
    aWanted: UserSkill[],
    bOffered: UserSkill[],
    bWanted: UserSkill[],
  ): PartialMatch[] {
    const partialSkills: PartialMatch[] = [];

    // Direction 1 : B offre ce que A veut (A apprend)
    for (const bo of bOffered) {
      const aw = aWanted.find((aw) => aw.skillCatalogId === bo.skillCatalogId);
      if (!aw) continue;

      // On évite de compter comme partiel si c'est déjà un match parfait potentiel 
      // (déjà géré par findPerfectMatches, mais au cas où)
      const bWantsAnythingAOffers = bWanted.some((bw) =>
        aOffered.some((ao) => ao.skillCatalogId === bw.skillCatalogId),
      );
      if (bWantsAnythingAOffers) continue;

      partialSkills.push({
        offeredByA: null,
        offeredByB: {
          id: bo.skillCatalogId,
          name: bo.skillCatalog.name,
          level: bo.level,
        },
        levelScore: this.levelBonusPartial(bo.level, aw.level),
      });
    }

    // Direction 2 : A offre ce que B veut (A enseigne)
    for (const ao of aOffered) {
      const bw = bWanted.find((bw) => bw.skillCatalogId === ao.skillCatalogId);
      if (!bw) continue;

      const aWantsAnythingBOffers = aWanted.some((aw) =>
        bOffered.some((bo) => bo.skillCatalogId === aw.skillCatalogId),
      );
      if (aWantsAnythingBOffers) continue;

      partialSkills.push({
        offeredByA: {
          id: ao.skillCatalogId,
          name: ao.skillCatalog.name,
          level: ao.level,
        },
        offeredByB: null,
        levelScore: this.levelBonusPartial(ao.level, bw.level),
      });
    }

    return partialSkills;
  }

  private calculateMatchDetails(
    perfectPairs: PerfectPair[],
    partialSkills: PartialMatch[],
  ) {
    let score = 0;
    let matchType: MatchType;
    let matchedPairs: object[];

    if (perfectPairs.length > 0) {
      matchType = MatchType.perfect;
      score = perfectPairs.reduce((acc, p) => acc + 50 + p.levelScore, 0);
      score = Math.min(score, 100);
      matchedPairs = perfectPairs.map((p) => ({
        offeredByA: p.offeredByA,
        offeredByB: p.offeredByB,
      }));
    } else {
      matchType = MatchType.partial;
      score = partialSkills.reduce((acc, p) => acc + 40 + p.levelScore, 0);
      score = Math.min(score, 100);
      matchedPairs = partialSkills.map((p) => ({
        offeredByA: p.offeredByA,
        offeredByB: p.offeredByB,
      }));
    }
    return { matchType, score, matchedPairs };
  }

  private async upsertMatch(
    userAId: string,
    userBId: string,
    details: { matchType: MatchType; score: number; matchedPairs: object[] },
  ) {
    const { matchType, score, matchedPairs: rawPairs } = details;
    const label = this.scoreToLabel(score);
    
    let matchedPairs = rawPairs;
    const [canonicalA, canonicalB] =
      userAId < userBId ? [userAId, userBId] : [userBId, userAId];

    // Important: if we swapped A and B to be canonical, we must also swap the skills in the pairs
    if (userAId > userBId) {
      matchedPairs = rawPairs.map((p: any) => ({
        offeredByA: p.offeredByB,
        offeredByB: p.offeredByA,
      }));
    }

    const existing = await this.prisma.match.findUnique({
      where: { userAId_userBId: { userAId: canonicalA, userBId: canonicalB } },
      select: { id: true, type: true, status: true },
    });

    if (existing) {
      const wasNotPerfect = existing.type !== MatchType.perfect;
      const isNowPerfect = matchType === MatchType.perfect;

      await this.prisma.match.update({
        where: { id: existing.id },
        data: { type: matchType, score, label, matchedPairs, status: 'active' },
      });

      if (wasNotPerfect && isNowPerfect) {
        await this.sendMatchUpgradeNotification(userAId, userBId, existing.id);
      }
    } else {
      const newMatch = await this.prisma.match.create({
        data: {
          userAId: canonicalA,
          userBId: canonicalB,
          type: matchType,
          score,
          label,
          matchedPairs,
          status: 'active',
        },
      });

      if (matchType === MatchType.perfect) {
        await this.sendNewPerfectMatchNotification(userAId, userBId, newMatch.id);
      }
    }
  }

  // GET /matches
  async getMatchesForUser(userId: string, filters: MatchFilterDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const baseWhere = {
      status: 'active' as const,
      OR: [{ userAId: userId }, { userBId: userId }],
      ...(filters.type && { type: filters.type }),
    };

    const orderBy = this.resolveOrderBy(filters.sort);

    const [matches, total] = await this.prisma.$transaction([
      this.prisma.match.findMany({
        where: baseWhere,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          score: true,
          label: true,
          matchedPairs: true,
          userA: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              city: true,
              avatarUrl: true,
              avgRating: true,
              sessionsCompleted: true,
              hasBadgeFiable: true,
              skills: {
                select: {
                  type: true,
                  level: true,
                  skillCatalog: {
                    select: { id: true, name: true, category: true },
                  },
                },
              },
            },
          },
          userB: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              city: true,
              avatarUrl: true,
              avgRating: true,
              sessionsCompleted: true,
              hasBadgeFiable: true,
              skills: {
                select: {
                  type: true,
                  level: true,
                  skillCatalog: {
                    select: { id: true, name: true, category: true },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.match.count({ where: baseWhere }),
    ]);

    const shaped = matches
      .map((match) => {
        const other = match.userA.id === userId ? match.userB : match.userA;

        if (filters.category) {
          const relevantSkills = other.skills.filter(
            (s) => s.skillCatalog.category === filters.category,
          );
          if (relevantSkills.length === 0) return null;
        }

        if (filters.level) {
          const relevantSkills = other.skills.filter(
            (s) => s.level === filters.level,
          );
          if (relevantSkills.length === 0) return null;
        }

        return {
          id: match.id,
          type: match.type,
          score: match.score,
          label: match.label,
          matchedPairs: match.matchedPairs,
          otherUser: {
            id: other.id,
            firstName: other.firstName,
            lastName: other.lastName,
            city: other.city,
            avatarUrl: other.avatarUrl,
            avgRating: other.avgRating,
            sessionsCompleted: other.sessionsCompleted,
            hasBadgeFiable: other.hasBadgeFiable,
            skills: other.skills,
          },
        };
      })
      .filter(Boolean);

    const perfect = shaped.filter((m) => m?.type === MatchType.perfect);
    const partial = shaped.filter((m) => m?.type === MatchType.partial);

    return {
      data: shaped,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      perfectCount: perfect.length,
      partialCount: partial.length,
    };
  }

  // GET /matches/:id
  async getMatchById(matchId: string, userId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        type: true,
        score: true,
        label: true,
        matchedPairs: true,
        status: true,
        createdAt: true,
        userA: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            city: true,
            avatarUrl: true,
            avgRating: true,
            skills: {
              select: {
                type: true,
                level: true,
                skillCatalog: {
                  select: { id: true, name: true, category: true },
                },
              },
            },
          },
        },
        userB: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            city: true,
            avatarUrl: true,
            avgRating: true,
            skills: {
              select: {
                type: true,
                level: true,
                skillCatalog: {
                  select: { id: true, name: true, category: true },
                },
              },
            },
          },
        },
      },
    });

    if (!match) throw new Error('match non trouve');

    if (match.userA.id !== userId && match.userB.id !== userId) {
      throw new Error('acces refuse');
    }

    const other = match.userA.id === userId ? match.userB : match.userA;
    return { ...match, otherUser: other };
  }

  private scoreToLabel(score: number): string {
    if (score >= 70) return 'tres compatible';
    if (score >= 50) return 'compatible';
    return 'partiel';
  }

  private levelBonus(
    offeredLevel: SkillLevel,
    wantedLevel: SkillLevel,
  ): number {
    const diff = LEVEL_ORDER[offeredLevel] - LEVEL_ORDER[wantedLevel];
    if (diff === 0) return 20;
    if (diff === 1) return 10;
    return 0;
  }

  private levelBonusPartial(
    offeredLevel: SkillLevel,
    wantedLevel?: SkillLevel,
  ): number {
    if (!wantedLevel) return 0;
    return offeredLevel === wantedLevel ? 15 : 0;
  }

  private resolveOrderBy(sort?: string) {
    if (sort === 'rating') return { userA: { avgRating: 'desc' as const } };
    if (sort === 'sessions')
      return { userA: { sessionsCompleted: 'desc' as const } };
    return { score: 'desc' as const };
  }

  // ───Notifications
  private async sendNewPerfectMatchNotification(
    userAId: string,
    userBId: string,
    matchId: string,
  ) {
    const userB = await this.prisma.user.findUnique({
      where: { id: userBId },
      select: { firstName: true },
    });
    const userA = await this.prisma.user.findUnique({
      where: { id: userAId },
      select: { firstName: true },
    });

    await this.prisma.notification.createMany({
      data: [
        {
          userId: userAId,
          type: 'new_perfect_match',
          payload: { fromUserFirstName: userB?.firstName, matchId },
        },
        {
          userId: userBId,
          type: 'new_perfect_match',
          payload: { fromUserFirstName: userA?.firstName, matchId },
        },
      ],
    });
  }

  private async sendMatchUpgradeNotification(userAId: string, userBId: string, matchId: string) {
    const userB = await this.prisma.user.findUnique({
      where: { id: userBId },
      select: { firstName: true },
    });
    const userA = await this.prisma.user.findUnique({
      where: { id: userAId },
      select: { firstName: true },
    });

    await this.prisma.notification.createMany({
      data: [
        {
          userId: userAId,
          type: 'match_upgraded',
          payload: { fromUserFirstName: userB?.firstName, matchId },
        },
        {
          userId: userBId,
          type: 'match_upgraded',
          payload: { fromUserFirstName: userA?.firstName, matchId },
        },
      ],
    });
  }

  // GET /matches/user/:userId
  async getMatchBetweenUsers(user1Id: string, user2Id: string) {
    const [id1, id2] = [user1Id, user2Id].sort();

    const match = await this.prisma.match.findUnique({
      where: {
        userAId_userBId: { userAId: id1, userBId: id2 },
      },
      include: {
        userA: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            avgRating: true,
            sessionsCompleted: true,
            hasBadgeFiable: true,
          },
        },
        userB: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            avgRating: true,
            sessionsCompleted: true,
            hasBadgeFiable: true,
          },
        },
      },
    });

    if (!match) throw new NotFoundException('match non trouve');

    const otherUser = match.userAId === user1Id ? match.userB : match.userA;
    const { userA, userB, ...rest } = match;

    return { ...rest, otherUser };
  }
}
