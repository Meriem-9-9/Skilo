import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MatchFilterDto } from './dto/match-filter.dto';
import { MatchType, SkillLevel } from '@prisma/client';

// ─── Level ordering for bonus calculation ─────────────────────────────────────
// Used to check if the offered level is "one step above" the wanted level
const LEVEL_ORDER: Record<SkillLevel, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

type UserSkill = {
  skillCatalogId: string;
  type: string;
  level: SkillLevel;
  skillCatalog: { id: string; name: string; category: string };
};

type PerfectPair = {
  offeredByA: { id: string; name: string; level: SkillLevel };
  offeredByB: { id: string; name: string; level: SkillLevel };
  levelScore: number;
};

type PartialMatch = {
  offeredByB: { id: string; name: string; level: SkillLevel };
  levelScore: number;
};

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ══════════════════════════════════════════════════════════════════════════
  // CORE ALGORITHM — recalculateForUser(userId)
  // ══════════════════════════════════════════════════════════════════════════
  async recalculateForUser(userId: string): Promise<void> {
    const userA = await this.getUserWithSkills(userId);
    if (!userA) return;

    const { offered: aOffered, wanted: aWanted } = this.splitSkills(
      userA.skills,
    );
    if (aOffered.length === 0 && aWanted.length === 0) return;

    const candidates = await this.getCandidates(userId);
    const blockedUserIds = await this.getBlockedUserIds(userId);

    for (const userB of candidates) {
      // We no longer skip blocked users (those with active sessions) 
      // because we want to allow multiple sessions (up to 3) with the same person.
      // if (blockedUserIds.has(userB.id)) continue;

      const { offered: bOffered, wanted: bWanted } = this.splitSkills(
        userB.skills,
      );

      // ── 1. Find perfect matches ─────────────────────────────────────────
      const perfectPairs = this.findPerfectMatches(
        aOffered,
        aWanted,
        bOffered,
        bWanted,
      );

      // ── 2. Find partial matches if no perfect match exists ──────────────
      let partialSkills: PartialMatch[] = [];
      if (perfectPairs.length === 0) {
        partialSkills = this.findPartialMatches(
          aOffered,
          aWanted,
          bOffered,
          bWanted,
        );
      }

      // ── 3. Skip if no match at all ──────────────────────────────────────
      if (perfectPairs.length === 0 && partialSkills.length === 0) {
        await this.archiveMatchIfExists(userId, userB.id);
        continue;
      }

      // ── 4. Calculate score and upsert ───────────────────────────────────
      const matchDetails = this.calculateMatchDetails(
        perfectPairs,
        partialSkills,
      );
      await this.upsertMatch(userId, userB.id, matchDetails);
    }

    this.logger.log(`Matching recalculated for user ${userId}`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // REFACTORED PROCESS HELPERS FOR RECALCULATE
  // ══════════════════════════════════════════════════════════════════════════

  private async getUserWithSkills(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
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
    for (const bo of bOffered) {
      const aWantsThis = aWanted.some(
        (aw) => aw.skillCatalogId === bo.skillCatalogId,
      );
      if (!aWantsThis) continue;

      const bWantsAnythingAOffers = bWanted.some((bw) =>
        aOffered.some((ao) => ao.skillCatalogId === bw.skillCatalogId),
      );
      if (bWantsAnythingAOffers) continue;

      const aw = aWanted.find((aw) => aw.skillCatalogId === bo.skillCatalogId);
      partialSkills.push({
        offeredByB: {
          id: bo.skillCatalogId,
          name: bo.skillCatalog.name,
          level: bo.level,
        },
        levelScore: this.levelBonusPartial(bo.level, aw?.level),
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
        offeredByA: null,
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
    const { matchType, score, matchedPairs } = details;
    const label = this.scoreToLabel(score);
    const [canonicalA, canonicalB] =
      userAId < userBId ? [userAId, userBId] : [userBId, userAId];

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

  // ══════════════════════════════════════════════════════════════════════════
  // GET /matches — paginated list for the current user
  // ══════════════════════════════════════════════════════════════════════════
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

  // ══════════════════════════════════════════════════════════════════════════
  // GET /matches/:id — single match detail
  // ══════════════════════════════════════════════════════════════════════════
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

    if (!match) throw new Error('Match not found');

    if (match.userA.id !== userId && match.userB.id !== userId) {
      throw new Error('Forbidden');
    }

    const other = match.userA.id === userId ? match.userB : match.userA;
    return { ...match, otherUser: other };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ══════════════════════════════════════════════════════════════════════════

  private async archiveMatchIfExists(userAId: string, userBId: string) {
    const [canonicalA, canonicalB] =
      userAId < userBId ? [userAId, userBId] : [userBId, userAId];

    await this.prisma.match.updateMany({
      where: { userAId: canonicalA, userBId: canonicalB, status: 'active' },
      data: { status: 'archived' },
    });
  }

  private scoreToLabel(score: number): string {
    if (score >= 70) return 'Très compatible';
    if (score >= 50) return 'Compatible';
    return 'Partiellement compatible';
  }

  private levelBonus(
    offeredLevel: SkillLevel,
    wantedLevel: SkillLevel,
  ): number {
    const diff = LEVEL_ORDER[offeredLevel] - LEVEL_ORDER[wantedLevel];
    if (diff === 0) return 20; // exact match
    if (diff === 1) return 10; // one step above
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

  // ─── Notifications ────────────────────────────────────────────────────────
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

    if (!match) throw new NotFoundException('Match not found');

    const otherUser = match.userAId === user1Id ? match.userB : match.userA;
    const { userA, userB, ...rest } = match;

    return { ...rest, otherUser };
  }
}
