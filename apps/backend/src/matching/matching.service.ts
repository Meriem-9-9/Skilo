import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MatchFilterDto } from './dto/match-filter.dto';
import { MatchType, SkillLevel } from 'generated/prisma/client';

// ─── Level ordering for bonus calculation ─────────────────────────────────────
// Used to check if the offered level is "one step above" the wanted level
const LEVEL_ORDER: Record<SkillLevel, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ══════════════════════════════════════════════════════════════════════════
  // CORE ALGORITHM — recalculateForUser(userId)
  //
  // Called:
  //   - after login
  //   - after profile update (PATCH /users/me)
  //   - after skill add/remove
  //   - every hour by the cron job (MatchingJob)
  //   - manually via POST /matches/recalculate (admin)
  // ══════════════════════════════════════════════════════════════════════════
  async recalculateForUser(userId: string): Promise<void> {
    // 1. Fetch user A's skills
    const userA = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        skills: {
          select: {
            skillCatalogId: true,
            type: true,
            level: true,
            skillCatalog: { select: { category: true } },
          },
        },
      },
    });

    if (!userA) return;

    const aOffered = userA.skills.filter((s) => s.type === 'offered');
    const aWanted = userA.skills.filter((s) => s.type === 'wanted');

    // Nothing to match against if user has no skills at all
    if (aOffered.length === 0 && aWanted.length === 0) return;

    // 2. Fetch all OTHER active, onboarded users with their skills
    const candidates = await this.prisma.user.findMany({
      where: {
        id: { not: userId },
        isActive: true,
        isOnboarded: true,
      },
      select: {
        id: true,
        skills: {
          select: {
            skillCatalogId: true,
            type: true,
            level: true,
            skillCatalog: { select: { category: true } },
          },
        },
      },
    });

    // 3. Find existing active sessions — skip those pairs (FC-03-A rule)
    const activeSessions = await this.prisma.session.findMany({
      where: {
        status: { in: ['pending', 'confirmed'] },
        OR: [{ proposedById: userId }, { recipientId: userId }],
      },
      select: { proposedById: true, recipientId: true },
    });

    // Build a Set of user IDs that already have an active session with A
    const blockedUserIds = new Set<string>(
      activeSessions.map((s) =>
        s.proposedById === userId ? s.recipientId : s.proposedById,
      ),
    );

    // 4. Process each candidate
    for (const userB of candidates) {
      if (blockedUserIds.has(userB.id)) continue;

      const bOffered = userB.skills.filter((s) => s.type === 'offered');
      const bWanted = userB.skills.filter((s) => s.type === 'wanted');

      // ── Find perfect match pairs ──────────────────────────────────────────
      // A offers X AND B wants X  +  B offers Y AND A wants Y
      const perfectPairs: {
        offeredByA: string;
        offeredByB: string;
        levelScore: number;
      }[] = [];

      for (const ao of aOffered) {
        for (const bw of bWanted) {
          if (ao.skillCatalogId !== bw.skillCatalogId) continue;

          // This skill is offered by A and wanted by B — now check the reverse
          for (const bo of bOffered) {
            for (const aw of aWanted) {
              if (bo.skillCatalogId !== aw.skillCatalogId) continue;

              // Perfect pair found: A offers ao ↔ B offers bo
              const levelScore = this.levelBonus(ao.level, bw.level);
              perfectPairs.push({
                offeredByA: ao.skillCatalogId,
                offeredByB: bo.skillCatalogId,
                levelScore,
              });
            }
          }
        }
      }

      // ── Find partial match skills ──────────────────────────────────────────
      // B offers something A wants, BUT B wants nothing that A offers
      const partialSkills: { skillCatalogId: string; levelScore: number }[] =
        [];

      if (perfectPairs.length === 0) {
        // Only compute partial if there's no perfect match
        for (const bo of bOffered) {
          const aWantsThis = aWanted.some(
            (aw) => aw.skillCatalogId === bo.skillCatalogId,
          );
          if (!aWantsThis) continue;

          const bWantsAnythingAOffers = bWanted.some((bw) =>
            aOffered.some((ao) => ao.skillCatalogId === bw.skillCatalogId),
          );
          if (bWantsAnythingAOffers) continue; // would be perfect — skip here

          const aw = aWanted.find(
            (aw) => aw.skillCatalogId === bo.skillCatalogId,
          );
          partialSkills.push({
            skillCatalogId: bo.skillCatalogId,
            levelScore: this.levelBonusPartial(bo.level, aw?.level),
          });
        }
      }

      // ── Skip if no match at all ───────────────────────────────────────────
      if (perfectPairs.length === 0 && partialSkills.length === 0) {
        // Archive existing match if it exists
        await this.archiveMatchIfExists(userId, userB.id);
        continue;
      }

      // ── Calculate score ───────────────────────────────────────────────────
      let score = 0;
      let matchType: MatchType;
      let matchedPairs: object[];

      if (perfectPairs.length > 0) {
        matchType = MatchType.perfect;
        score = perfectPairs.reduce((acc, p) => acc + 50 + p.levelScore, 0);
        // Cap at 100
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
          skillCatalogId: p.skillCatalogId,
        }));
      }

      const label = this.scoreToLabel(score);

      // ── Canonical pair: always store smaller UUID as userAId ──────────────
      // This guarantees the @@unique([userAId, userBId]) works correctly
      const [canonicalA, canonicalB] =
        userId < userB.id ? [userId, userB.id] : [userB.id, userId];

      // ── Upsert the match ──────────────────────────────────────────────────
      const existing = await this.prisma.match.findUnique({
        where: {
          userAId_userBId: { userAId: canonicalA, userBId: canonicalB },
        },
        select: { id: true, type: true, status: true },
      });

      if (existing) {
        const wasNotPerfect = existing.type !== MatchType.perfect;
        const isNowPerfect = matchType === MatchType.perfect;

        await this.prisma.match.update({
          where: { id: existing.id },
          data: {
            type: matchType,
            score,
            label,
            matchedPairs,
            status: 'active',
          },
        });

        // Notify if a partial match just became perfect (FC-03-B)
        if (wasNotPerfect && isNowPerfect) {
          await this.sendMatchUpgradeNotification(userId, userB.id);
        }
      } else {
        await this.prisma.match.create({
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

        // Notify A if a new perfect match was just created
        if (matchType === MatchType.perfect) {
          await this.sendNewPerfectMatchNotification(userId, userB.id);
        }
      }
    }

    this.logger.log(`Matching recalculated for user ${userId}`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GET /matches — paginated list for the current user
  // ══════════════════════════════════════════════════════════════════════════
  async getMatchesForUser(userId: string, filters: MatchFilterDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    // Base where clause: matches where the user is A or B and status is active
    const baseWhere = {
      status: 'active' as const,
      OR: [{ userAId: userId }, { userBId: userId }],
      // Filter by match type if provided
      ...(filters.type && { type: filters.type }),
    };

    // Determine orderBy
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

    // Shape the response — the "other" user depends on which side the current user is
    const shaped = matches
      .map((match) => {
        const other = match.userA.id === userId ? match.userB : match.userA;

        // Apply category filter if provided (filter on the matched skill pairs)
        if (filters.category) {
          const relevantSkills = other.skills.filter(
            (s) => s.skillCatalog.category === filters.category,
          );
          if (relevantSkills.length === 0) return null;
        }

        // Apply level filter if provided
        if (filters.level) {
          const relevantSkills = other.skills.filter(
            (s) => s.level === filters.level,
          );
          if (relevantSkills.length === 0) return null;
        }

        return {
          matchId: match.id,
          type: match.type,
          score: match.score,
          label: match.label,
          // All matched pairs — frontend lets user pick which one to act on (Q2 decision)
          matchedPairs: match.matchedPairs,
          user: {
            id: other.id,
            firstName: other.firstName,
            city: other.city,
            avatarUrl: other.avatarUrl,
            avgRating: other.avgRating,
            sessionsCompleted: other.sessionsCompleted,
            hasBadgeFiable: other.hasBadgeFiable,
            skills: other.skills,
          },
        };
      })
      .filter(Boolean); // remove nulls from category/level filtering

    // Split into perfect first, then partial (FC-03-B spec)
    const perfect = shaped.filter((m) => m?.type === MatchType.perfect);
    const partial = shaped.filter((m) => m?.type === MatchType.partial);

    return {
      data: { perfect, partial },
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        perfectCount: perfect.length,
        partialCount: partial.length,
      },
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

    // Verify the requesting user is part of this match
    if (match.userA.id !== userId && match.userB.id !== userId) {
      throw new Error('Forbidden');
    }

    const other = match.userA.id === userId ? match.userB : match.userA;

    return { ...match, otherUser: other };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ══════════════════════════════════════════════════════════════════════════

  // About match.status = active/archived (answer to zakariae's comment in schema):
  // active  → the match is currently valid and shown to users
  // archived → one of the two users deleted their skills or account — we don't
  //            delete the match row (it might have sessions linked to it) but
  //            we hide it from the list. This is why it's needed.
  private async archiveMatchIfExists(userAId: string, userBId: string) {
    const [canonicalA, canonicalB] =
      userAId < userBId ? [userAId, userBId] : [userBId, userAId];

    await this.prisma.match.updateMany({
      where: {
        userAId: canonicalA,
        userBId: canonicalB,
        status: 'active',
      },
      data: { status: 'archived' },
    });
  }

  // Score thresholds from spec (FC-03-A)
  private scoreToLabel(score: number): string {
    if (score >= 70) return 'Très compatible';
    if (score >= 50) return 'Compatible';
    return 'Partiellement compatible';
  }

  // Perfect match level bonus: +20 exact, +10 one step above (FC-03-A)
  private levelBonus(
    offeredLevel: SkillLevel,
    wantedLevel: SkillLevel,
  ): number {
    const diff = LEVEL_ORDER[offeredLevel] - LEVEL_ORDER[wantedLevel];
    if (diff === 0) return 20; // exact match
    if (diff === 1) return 10; // one step above
    return 0;
  }

  // Partial match level bonus: +15 exact (FC-03-A)
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
    return { score: 'desc' as const }; // default
  }

  // ─── Notifications ────────────────────────────────────────────────────────
  private async sendNewPerfectMatchNotification(
    userAId: string,
    userBId: string,
  ) {
    // Notify BOTH users about the new perfect match
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
          payload: { fromUserFirstName: userB?.firstName },
        },
        {
          userId: userBId,
          type: 'new_perfect_match',
          payload: { fromUserFirstName: userA?.firstName },
        },
      ],
    });
  }

  private async sendMatchUpgradeNotification(userAId: string, userBId: string) {
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
          payload: { fromUserFirstName: userB?.firstName },
        },
        {
          userId: userBId,
          type: 'match_upgraded',
          payload: { fromUserFirstName: userA?.firstName },
        },
      ],
    });
  }
}
