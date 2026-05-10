// ============================================================
// skilo — Prisma Seed
// Couvre : users, skill_catalog, user_skills, matches,
//          sessions, reviews, credit_transactions, notifications
// ============================================================

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...\n');

  // 0. CLEAN
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.creditTransaction.deleteMany();
  await prisma.session.deleteMany();
  await prisma.match.deleteMany();
  await prisma.userSkill.deleteMany();
  await prisma.skillCatalog.deleteMany();
  await prisma.tokenBlacklist.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleaned existing data\n');

  // 1. SKILL CATALOG
  const skills = await prisma.$transaction([
    prisma.skillCatalog.create({
      data: {
        name: 'Python',
        category: 'tech',
        status: 'approved',
        usageCount: 120,
      },
    }),
    prisma.skillCatalog.create({
      data: {
        name: 'JavaScript',
        category: 'tech',
        status: 'approved',
        usageCount: 200,
      },
    }),
    prisma.skillCatalog.create({
      data: {
        name: 'React',
        category: 'tech',
        status: 'approved',
        usageCount: 180,
      },
    }),
    prisma.skillCatalog.create({
      data: {
        name: 'NestJS',
        category: 'tech',
        status: 'approved',
        usageCount: 60,
      },
    }),
    prisma.skillCatalog.create({
      data: {
        name: 'TypeScript',
        category: 'tech',
        status: 'approved',
        usageCount: 140,
      },
    }),
    prisma.skillCatalog.create({
      data: {
        name: 'English',
        category: 'languages',
        status: 'approved',
        usageCount: 300,
      },
    }),
    prisma.skillCatalog.create({
      data: {
        name: 'Marketing',
        category: 'business',
        status: 'approved',
        usageCount: 75,
      },
    }),
    prisma.skillCatalog.create({
      data: {
        name: 'Excel',
        category: 'business',
        status: 'approved',
        usageCount: 130,
      },
    }),
    prisma.skillCatalog.create({
      data: {
        name: 'Photography',
        category: 'arts',
        status: 'approved',
        usageCount: 65,
      },
    }),
    prisma.skillCatalog.create({
      data: {
        name: 'Figma',
        category: 'tech',
        status: 'approved',
        usageCount: 75,
      },
    }),
  ]);

  const skillPython = skills[0];
  const skillReact = skills[2];
  const skillEnglish = skills[5];
  const skillMarketing = skills[6];
  const skillExcel = skills[7];
  const skillPhotography = skills[8];
  const skillFigma = skills[9];

  // 2. USERS
  const passwordHash = await bcrypt.hash('Password123', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@skilo.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'Skilo',
      role: 'admin',
      isOnboarded: true,
      isActive: true,
      city: 'Casablanca',
      bio: 'Admin',
      creditBalance: 10,
      profileScore: 100,
    },
  });

  const userA = await prisma.user.create({
    data: {
      email: 'zakariae@skilo.com',
      passwordHash,
      firstName: 'Zakariae',
      lastName: 'bakkari',
      role: 'user',
      isOnboarded: true,
      isActive: true,
      city: 'Casablanca',
      bio: 'Développeur passionné.',
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Zakariae',
      creditBalance: 12,
      profileScore: 100,
      sessionsCompleted: 8,
      avgRating: 4.8,
    },
  });

  const userB = await prisma.user.create({
    data: {
      email: 'meriem@skilo.com',
      passwordHash,
      firstName: 'Meriem',
      lastName: 'Hamri',
      role: 'user',
      isOnboarded: true,
      isActive: true,
      city: 'Rabat',
      bio: 'Frontend dev.',
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Meriem',
      creditBalance: 8,
      profileScore: 100,
      sessionsCompleted: 5,
      avgRating: 4.8,
    },
  });

  const userC = await prisma.user.create({
    data: {
      email: 'amine@skilo.com',
      passwordHash,
      firstName: 'Amine',
      lastName: 'Kabbaj',
      role: 'user',
      isOnboarded: true,
      isActive: true,
      city: 'Marrakech',
      bio: 'Marketing manager.',
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Amine',
      creditBalance: 4,
      profileScore: 100,
      sessionsCompleted: 2,
      avgRating: 4.2,
    },
  });

  const userD = await prisma.user.create({
    data: {
      email: 'sarah@skilo.com',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Idrissi',
      role: 'user',
      isOnboarded: true,
      isActive: true,
      city: 'Casablanca',
      bio: 'Expert React & UI Designer.',
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Sarah',
      creditBalance: 15,
      profileScore: 100,
      sessionsCompleted: 12,
      avgRating: 4.9,
    },
  });

  const userE = await prisma.user.create({
    data: {
      email: 'yassine@skilo.com',
      passwordHash,
      firstName: 'Yassine',
      lastName: 'Mansouri',
      role: 'user',
      isOnboarded: true,
      isActive: true,
      city: 'Tanger',
      bio: "Prof d'anglais certifié.",
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Yassine',
      creditBalance: 6,
      profileScore: 100,
      sessionsCompleted: 4,
      avgRating: 4.5,
    },
  });

  const userF = await prisma.user.create({
    data: {
      email: 'kenza@skilo.com',
      passwordHash,
      firstName: 'Kenza',
      lastName: 'Ait',
      role: 'user',
      isOnboarded: true,
      isActive: true,
      city: 'Casablanca',
      bio: 'Photography enthusiast.',
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Kenza',
      creditBalance: 10,
      profileScore: 100,
      sessionsCompleted: 1,
      avgRating: 5.0,
    },
  });

  // 3. USER SKILLS
  await prisma.userSkill.createMany({
    data: [
      {
        userId: userA.id,
        skillCatalogId: skillPython.id,
        type: 'offered',
        level: 'intermediate',
      },
      {
        userId: userA.id,
        skillCatalogId: skillFigma.id,
        type: 'offered',
        level: 'advanced',
      },
      {
        userId: userA.id,
        skillCatalogId: skillReact.id,
        type: 'wanted',
        level: 'beginner',
      },
      {
        userId: userA.id,
        skillCatalogId: skillEnglish.id,
        type: 'wanted',
        level: 'intermediate',
      },

      {
        userId: userB.id,
        skillCatalogId: skillReact.id,
        type: 'offered',
        level: 'intermediate',
      },
      {
        userId: userB.id,
        skillCatalogId: skillEnglish.id,
        type: 'offered',
        level: 'advanced',
      },
      {
        userId: userB.id,
        skillCatalogId: skillPython.id,
        type: 'wanted',
        level: 'beginner',
      },

      {
        userId: userC.id,
        skillCatalogId: skillMarketing.id,
        type: 'offered',
        level: 'advanced',
      },
      {
        userId: userC.id,
        skillCatalogId: skillPhotography.id,
        type: 'wanted',
        level: 'beginner',
      },

      {
        userId: userD.id,
        skillCatalogId: skillReact.id,
        type: 'offered',
        level: 'advanced',
      },
      {
        userId: userD.id,
        skillCatalogId: skillFigma.id,
        type: 'wanted',
        level: 'intermediate',
      },

      {
        userId: userE.id,
        skillCatalogId: skillEnglish.id,
        type: 'offered',
        level: 'advanced',
      },
      {
        userId: userE.id,
        skillCatalogId: skillPython.id,
        type: 'wanted',
        level: 'intermediate',
      },

      {
        userId: userF.id,
        skillCatalogId: skillPhotography.id,
        type: 'offered',
        level: 'intermediate',
      },
      {
        userId: userF.id,
        skillCatalogId: skillEnglish.id,
        type: 'wanted',
        level: 'beginner',
      },
    ],
  });

  // 4. MATCHES
  const [canA_B, canB_B] =
    userA.id < userB.id ? [userA.id, userB.id] : [userB.id, userA.id];
  const matchAB = await prisma.match.create({
    data: {
      userAId: canA_B,
      userBId: canB_B,
      type: 'perfect',
      score: 100,
      label: 'Très compatible',
      matchedPairs: [
        {
          offeredByA: {
            id: skillPython.id,
            name: skillPython.name,
            level: 'intermediate',
          },
          offeredByB: {
            id: skillReact.id,
            name: skillReact.name,
            level: 'intermediate',
          },
        },
      ],
    },
  });

  const [canA_D, canD_D] =
    userA.id < userD.id ? [userA.id, userD.id] : [userD.id, userA.id];
  const matchAD = await prisma.match.create({
    data: {
      userAId: canA_D,
      userBId: canD_D,
      type: 'perfect',
      score: 95,
      label: 'Match parfait',
      matchedPairs: [
        {
          offeredByA: {
            id: skillFigma.id,
            name: skillFigma.name,
            level: 'advanced',
          },
          offeredByB: {
            id: skillReact.id,
            name: skillReact.name,
            level: 'advanced',
          },
        },
      ],
    },
  });

  const [canA_E, canE_E] =
    userA.id < userE.id ? [userA.id, userE.id] : [userE.id, userA.id];
  const matchAE = await prisma.match.create({
    data: {
      userAId: canA_E,
      userBId: canE_E,
      type: 'perfect',
      score: 90,
      label: 'Match idéal',
      matchedPairs: [
        {
          offeredByA: {
            id: skillPython.id,
            name: skillPython.name,
            level: 'intermediate',
          },
          offeredByB: {
            id: skillEnglish.id,
            name: skillEnglish.name,
            level: 'advanced',
          },
        },
      ],
    },
  });

  const [canA_C, canC_C] =
    userA.id < userC.id ? [userA.id, userC.id] : [userC.id, userA.id];
  const matchAC = await prisma.match.create({
    data: {
      userAId: canA_C,
      userBId: canC_C,
      type: 'partial',
      score: 75,
      label: 'Compatible',
      matchedPairs: [
        {
          offeredByA: {
            id: skillEnglish.id,
            name: skillEnglish.name,
            level: 'intermediate',
          },
          offeredByB: {
            id: skillMarketing.id,
            name: skillMarketing.name,
            level: 'advanced',
          },
        },
      ],
    },
  });

  const [canA_F, canF_F] =
    userA.id < userF.id ? [userA.id, userF.id] : [userF.id, userA.id];
  const matchAF = await prisma.match.create({
    data: {
      userAId: canA_F,
      userBId: canF_F,
      type: 'partial',
      score: 65,
      label: 'Potentiel',
      matchedPairs: [
        {
          offeredByA: {
            id: skillEnglish.id,
            name: skillEnglish.name,
            level: 'intermediate',
          },
          offeredByB: {
            id: skillPhotography.id,
            name: skillPhotography.name,
            level: 'intermediate',
          },
        },
      ],
    },
  });

  // 5. SESSIONS
  const now = new Date();
  const inFuture = (hours: number) =>
    new Date(now.getTime() + hours * 3_600_000);
  const inPast = (hours: number) => new Date(now.getTime() - hours * 3_600_000);

  const sessionPending = await prisma.session.create({
    data: {
      matchId: matchAB.id,
      proposedById: userA.id,
      recipientId: userB.id,
      scheduledAt: inFuture(48),
      durationMinutes: 60,
      status: 'pending',
      skillsExchanged: [{ skillCatalogId: skillPython.id, role: 'offered' }],
    },
  });

  const sessionConfirmed = await prisma.session.create({
    data: {
      matchId: matchAB.id,
      proposedById: userA.id,
      recipientId: userB.id,
      scheduledAt: inFuture(2),
      durationMinutes: 90,
      status: 'confirmed',
      skillsExchanged: [{ skillCatalogId: skillFigma.id, role: 'offered' }],
    },
  });

  const sessionUpcomingSarah = await prisma.session.create({
    data: {
      matchId: matchAD.id,
      proposedById: userD.id,
      recipientId: userA.id,
      scheduledAt: inFuture(12),
      durationMinutes: 60,
      status: 'confirmed',
      skillsExchanged: [{ skillCatalogId: skillReact.id, role: 'offered' }],
    },
  });

  const sessionUpcomingYassine = await prisma.session.create({
    data: {
      matchId: matchAE.id,
      proposedById: userE.id,
      recipientId: userA.id,
      scheduledAt: inFuture(72),
      durationMinutes: 60,
      status: 'pending',
      skillsExchanged: [{ skillCatalogId: skillEnglish.id, role: 'offered' }],
    },
  });

  const sessionCompletedAB = await prisma.session.create({
    data: {
      matchId: matchAB.id,
      proposedById: userB.id,
      recipientId: userA.id,
      scheduledAt: inPast(24),
      durationMinutes: 60,
      status: 'completed',
      confirmedByA: true,
      confirmedByB: true,
    },
  });

  const sessionCompletedSarahPast = await prisma.session.create({
    data: {
      matchId: matchAD.id,
      proposedById: userA.id,
      recipientId: userD.id,
      scheduledAt: inPast(48),
      durationMinutes: 60,
      status: 'completed',
      confirmedByA: true,
      confirmedByB: true,
    },
  });

  const sessionCompletedAC = await prisma.session.create({
    data: {
      matchId: matchAC.id,
      proposedById: userA.id,
      recipientId: userC.id,
      scheduledAt: inPast(168),
      durationMinutes: 120,
      status: 'completed',
      confirmedByA: true,
      confirmedByB: true,
    },
  });

  // 6. TRANSACTIONS
  await prisma.creditTransaction.createMany({
    data: [
      {
        userId: userA.id,
        type: 'welcome_bonus',
        amount: 2,
        balanceAfter: 2,
        description: 'Bienvenue',
      },
      {
        userId: userA.id,
        sessionId: sessionCompletedAC.id,
        type: 'session_earned',
        amount: 2,
        balanceAfter: 4,
        description: 'Session Python',
      },
    ],
  });

  // 7. REVIEWS
  const reviewWindow = new Date(now.getTime() + 7 * 24 * 3_600_000);
  await prisma.review.createMany({
    data: [
      {
        sessionId: sessionCompletedAB.id,
        reviewerId: userA.id,
        revieweeId: userB.id,
        rating: 5,
        comment: 'Top !',
        isVisible: true,
        expiresAt: reviewWindow,
      },
      {
        sessionId: sessionCompletedAB.id,
        reviewerId: userB.id,
        revieweeId: userA.id,
        rating: 5,
        comment: 'Super !',
        isVisible: true,
        expiresAt: reviewWindow,
      },
      {
        sessionId: sessionCompletedSarahPast.id,
        reviewerId: userD.id,
        revieweeId: userA.id,
        rating: 5,
        comment: 'Excellent mentor !',
        isVisible: true,
        expiresAt: reviewWindow,
      },
    ],
  });

  // 8. NOTIFICATIONS
  await prisma.notification.createMany({
    data: [
      {
        userId: userA.id,
        type: 'new_perfect_match',
        payload: { fromUserFirstName: 'Meriem' },
        isRead: false,
      },
      {
        userId: userA.id,
        type: 'new_perfect_match',
        payload: { fromUserFirstName: 'Sarah' },
        isRead: false,
      },
      {
        userId: userA.id,
        type: 'session_accepted',
        payload: {
          fromUserFirstName: 'Sarah',
          scheduledAt: sessionUpcomingSarah.scheduledAt,
        },
        isRead: false,
      },
    ],
  });

  console.log(
    '✅ Seed completed successfully for Zakariae, Meriem, and Amine.',
  );
  console.log(`Zakariae ID: ${userA.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
