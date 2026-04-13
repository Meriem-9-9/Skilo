// ============================================================
// skilo — Prisma Seed
// Couvre : users, skill_catalog, user_skills, matches,
//          sessions, reviews, credit_transactions, notifications
// ============================================================

import { PrismaClient } from 'generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
// prisma/seed.ts
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ── helpers ────────────────────────────────────────────────
//fonction
// const hash = (pwd: string) => bcrypt.hashSync(pwd, 12);

// const future = (days: number) => {
//   const d = new Date();
//   d.setDate(d.getDate() + days);
//   return d;
// };

// const past = (days: number) => {
//   const d = new Date();
//   d.setDate(d.getDate() - days);
//   return d;
// };

// ── main ───────────────────────────────────────────────────
async function main() {
  console.log('🌱 Seeding database...\n');

  // ════════════════════════════════════════════════════════════════
  // 0. CLEAN existing seed data (safe to re-run)
  // ════════════════════════════════════════════════════════════════
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

  // ════════════════════════════════════════════════════════════════
  // 1. SKILL CATALOG — 30 approved + 2 pending_review
  // ════════════════════════════════════════════════════════════════
  const skills = await prisma.$transaction([
    // ── Tech ─────────────────────────────────────────────────────
    prisma.skillCatalog.create({
      data: {
        name: 'Python',
        category: 'tech',
        status: 'approved',
        aliases: ['py'],
        usageCount: 120,
      },
    }),
    prisma.skillCatalog.create({
      data: {
        name: 'JavaScript',
        category: 'tech',
        status: 'approved',
        aliases: ['JS', 'js'],
        usageCount: 200,
      },
    }),
    prisma.skillCatalog.create({
      data: {
        name: 'React',
        category: 'tech',
        status: 'approved',
        aliases: ['ReactJS'],
        usageCount: 180,
      },
    }),
    prisma.skillCatalog.create({
      data: {
        name: 'NestJS',
        category: 'tech',
        status: 'approved',
        aliases: ['Nest'],
        usageCount: 60,
      },
    }),
    prisma.skillCatalog.create({
      data: {
        name: 'TypeScript',
        category: 'tech',
        status: 'approved',
        aliases: ['TS'],
        usageCount: 140,
      },
    }),
    prisma.skillCatalog.create({
      data: {
        name: 'PostgreSQL',
        category: 'tech',
        status: 'approved',
        aliases: ['postgres', 'pg'],
        usageCount: 80,
      },
    }),
    prisma.skillCatalog.create({
      data: {
        name: 'Docker',
        category: 'tech',
        status: 'approved',
        aliases: [],
        usageCount: 55,
      },
    }),
    prisma.skillCatalog.create({
      data: {
        name: 'Git',
        category: 'tech',
        status: 'approved',
        aliases: ['GitHub', 'GitLab'],
        usageCount: 95,
      },
    }),
    prisma.skillCatalog.create({
      data: {
        name: 'Figma',
        category: 'tech',
        status: 'approved',
        aliases: [],
        usageCount: 75,
      },
    }),
    prisma.skillCatalog.create({
      data: {
        name: 'Machine Learning',
        category: 'tech',
        status: 'approved',
        aliases: ['ML', 'AI'],
        usageCount: 40,
      },
    }),

    // ── Languages ─────────────────────────────────────────────────
    prisma.skillCatalog.create({
      data: {
        name: 'English',
        category: 'languages',
        status: 'approved',
        aliases: ['Anglais'],
        usageCount: 300,
      },
    }),
    prisma.skillCatalog.create({
      data: {
        name: 'French',
        category: 'languages',
        status: 'approved',
        aliases: ['Français'],
        usageCount: 150,
      },
    }),
    prisma.skillCatalog.create({
      data: {
        name: 'Spanish',
        category: 'languages',
        status: 'approved',
        aliases: ['Español'],
        usageCount: 90,
      },
    }),
    prisma.skillCatalog.create({
      data: {
        name: 'Arabic',
        category: 'languages',
        status: 'approved',
        aliases: ['Arabe'],
        usageCount: 110,
      },
    }),
    prisma.skillCatalog.create({
      data: {
        name: 'German',
        category: 'languages',
        status: 'approved',
        aliases: ['Allemand'],
        usageCount: 45,
      },
    }),

    // ── Arts ──────────────────────────────────────────────────────
    prisma.skillCatalog.create({
      data: {
        name: 'Photography',
        category: 'arts',
        status: 'approved',
        aliases: ['Photo'],
        usageCount: 65,
      },
    }),
    prisma.skillCatalog.create({
      data: {
        name: 'Graphic Design',
        category: 'arts',
        status: 'approved',
        aliases: ['Design'],
        usageCount: 85,
      },
    }),
    prisma.skillCatalog.create({
      data: {
        name: 'Music',
        category: 'arts',
        status: 'approved',
        aliases: ['Guitar', 'Piano'],
        usageCount: 70,
      },
    }),
    prisma.skillCatalog.create({
      data: {
        name: 'Drawing',
        category: 'arts',
        status: 'approved',
        aliases: ['Illustration'],
        usageCount: 50,
      },
    }),
    prisma.skillCatalog.create({
      data: {
        name: 'Video Editing',
        category: 'arts',
        status: 'approved',
        aliases: ['Montage vidéo'],
        usageCount: 55,
      },
    }),

    // ── Business ──────────────────────────────────────────────────
    prisma.skillCatalog.create({
      data: {
        name: 'Excel',
        category: 'business',
        status: 'approved',
        aliases: ['Tableur'],
        usageCount: 130,
      },
    }),
    prisma.skillCatalog.create({
      data: {
        name: 'Public Speaking',
        category: 'business',
        status: 'approved',
        aliases: ['Prise de parole'],
        usageCount: 60,
      },
    }),
    prisma.skillCatalog.create({
      data: {
        name: 'Marketing',
        category: 'business',
        status: 'approved',
        aliases: [],
        usageCount: 75,
      },
    }),
    prisma.skillCatalog.create({
      data: {
        name: 'Accounting',
        category: 'business',
        status: 'approved',
        aliases: ['Comptabilité'],
        usageCount: 40,
      },
    }),

    // ── Sport ─────────────────────────────────────────────────────
    prisma.skillCatalog.create({
      data: {
        name: 'Yoga',
        category: 'sport',
        status: 'approved',
        aliases: [],
        usageCount: 45,
      },
    }),
    prisma.skillCatalog.create({
      data: {
        name: 'Swimming',
        category: 'sport',
        status: 'approved',
        aliases: ['Natation'],
        usageCount: 35,
      },
    }),
    prisma.skillCatalog.create({
      data: {
        name: 'Football',
        category: 'sport',
        status: 'approved',
        aliases: ['Soccer'],
        usageCount: 80,
      },
    }),

    // ── Cooking ───────────────────────────────────────────────────
    prisma.skillCatalog.create({
      data: {
        name: 'Cooking',
        category: 'cooking',
        status: 'approved',
        aliases: ['Cuisine'],
        usageCount: 90,
      },
    }),
    prisma.skillCatalog.create({
      data: {
        name: 'Pastry',
        category: 'cooking',
        status: 'approved',
        aliases: ['Pâtisserie'],
        usageCount: 50,
      },
    }),

    // ── Other ─────────────────────────────────────────────────────
    prisma.skillCatalog.create({
      data: {
        name: 'Meditation',
        category: 'other',
        status: 'approved',
        aliases: [],
        usageCount: 30,
      },
    }),

    // ── Pending review (admin test) ───────────────────────────────
    prisma.skillCatalog.create({
      data: {
        name: 'Darija marocaine',
        category: 'languages',
        status: 'pending_review',
        aliases: ['Darija'],
        usageCount: 0,
      },
    }),
    prisma.skillCatalog.create({
      data: {
        name: 'Prompt Engineering',
        category: 'tech',
        status: 'pending_review',
        aliases: ['Prompting'],
        usageCount: 0,
      },
    }),
  ]);

  // Named shortcuts for the skills we use in user profiles
  const skillPython = skills[0]; // Python
  const skillReact = skills[2]; // React
  const skillFigma = skills[8]; // Figma
  const skillEnglish = skills[10]; // English

  console.log('✅ Skills created:', skills.length);

  // ════════════════════════════════════════════════════════════════
  // 2. USERS
  // ════════════════════════════════════════════════════════════════
  const passwordHash = await bcrypt.hash('Password123', 12);

  // ── Admin ────────────────────────────────────────────────────────
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
      bio: 'Administrateur de la plateforme skilo.',
      creditBalance: 10,
      profileScore: 40,
    },
  });

  // ── User A — Zakariae (offers Python + Figma, wants React + English) ──
  const userA = await prisma.user.create({
    data: {
      email: 'zakariae@skilo.com',
      passwordHash,
      firstName: 'Zakariae',
      lastName: 'Benali',
      role: 'user',
      isOnboarded: true,
      isActive: true,
      city: 'Casablanca',
      bio: "Développeur Python passionné par le design. J'apprends React en ce moment.",
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Zakariae',
      creditBalance: 5,
      profileScore: 100,
      sessionsCompleted: 3,
      avgRating: 4.5,
    },
  });

  // ── User B — Meriem (offers React + English, wants Python + Figma) ──
  const userB = await prisma.user.create({
    data: {
      email: 'meriem@skilo.com',
      passwordHash,
      firstName: 'Meriem',
      lastName: 'Tazi',
      role: 'user',
      isOnboarded: true,
      isActive: true,
      city: 'Rabat',
      bio: 'Frontend developer & English tutor. Passionnée par le design et Python.',
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Meriem',
      creditBalance: 8,
      profileScore: 100,
      sessionsCompleted: 3,
      avgRating: 4.8,
    },
  });

  console.log('✅ Users created: admin, userA (Zakariae), userB (Meriem)');

  // ════════════════════════════════════════════════════════════════
  // 3. USER SKILLS
  // ════════════════════════════════════════════════════════════════

  // User A: offers Python (intermediate) + Figma (advanced)
  //         wants  React (beginner)       + English (intermediate)
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
    ],
  });

  // User B: offers React (intermediate) + English (advanced)
  //         wants  Python (beginner)     + Figma (intermediate)
  await prisma.userSkill.createMany({
    data: [
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
        userId: userB.id,
        skillCatalogId: skillFigma.id,
        type: 'wanted',
        level: 'intermediate',
      },
    ],
  });

  // Update usageCount on used skills
  await prisma.skillCatalog.updateMany({
    where: {
      id: {
        in: [skillPython.id, skillReact.id, skillFigma.id, skillEnglish.id],
      },
    },
    data: { usageCount: { increment: 2 } },
  });

  console.log('✅ UserSkills created');

  // ════════════════════════════════════════════════════════════════
  // 4. MATCH — perfect match between A and B
  // Canonical order: smaller UUID first
  // ════════════════════════════════════════════════════════════════
  const [canonicalA, canonicalB] =
    userA.id < userB.id ? [userA.id, userB.id] : [userB.id, userA.id];

  const match = await prisma.match.create({
    data: {
      userAId: canonicalA,
      userBId: canonicalB,
      type: 'perfect',
      score: 100,
      label: 'Très compatible',
      matchedPairs: [
        { offeredByA: skillPython.id, offeredByB: skillReact.id },
        { offeredByA: skillFigma.id, offeredByB: skillEnglish.id },
      ],
      status: 'active',
    },
  });

  console.log('✅ Match created (perfect, score 100)');

  // ════════════════════════════════════════════════════════════════
  // 5. SESSIONS — 4 different statuses to test all flows
  // ════════════════════════════════════════════════════════════════

  const now = new Date();
  const inFuture = (hours: number) =>
    new Date(now.getTime() + hours * 3_600_000);
  const inPast = (hours: number) => new Date(now.getTime() - hours * 3_600_000);

  // ── Session 1: PENDING — proposed by A, not yet accepted by B ────
  const sessionPending = await prisma.session.create({
    data: {
      matchId: match.id,
      proposedById: userA.id,
      recipientId: userB.id,
      scheduledAt: inFuture(48),
      durationMinutes: 60,
      skillsExchanged: [
        { skillCatalogId: skillPython.id, role: 'offered' },
        { skillCatalogId: skillReact.id, role: 'wanted' },
      ],
      message: 'Salut Meriem ! On échange Python contre React ?',
      status: 'pending',
      creditsUsed: 0,
      confirmationDeadline: inFuture(48 + 24),
    },
  });

  // ── Session 2: CONFIRMED — accepted by B ──────────────────────────
  const sessionConfirmed = await prisma.session.create({
    data: {
      matchId: match.id,
      proposedById: userA.id,
      recipientId: userB.id,
      scheduledAt: inFuture(5),
      durationMinutes: 90,
      skillsExchanged: [
        { skillCatalogId: skillFigma.id, role: 'offered' },
        { skillCatalogId: skillEnglish.id, role: 'wanted' },
      ],
      message: 'Session Figma ↔ English demain !',
      status: 'confirmed',
      creditsUsed: 0,
      confirmationDeadline: inFuture(5 + 24),
    },
  });

  // ── Session 3: COMPLETED — both confirmed, credits distributed ────
  const sessionCompleted = await prisma.session.create({
    data: {
      matchId: match.id,
      proposedById: userA.id,
      recipientId: userB.id,
      scheduledAt: inPast(30),
      durationMinutes: 60,
      skillsExchanged: [
        { skillCatalogId: skillPython.id, role: 'offered' },
        { skillCatalogId: skillReact.id, role: 'wanted' },
      ],
      status: 'completed',
      confirmedByA: true,
      confirmedByB: true,
      creditsUsed: 0,
      confirmationDeadline: inPast(6),
    },
  });

  // ── Session 4: CANCELLED ──────────────────────────────────────────
  const sessionCancelled = await prisma.session.create({
    data: {
      matchId: match.id,
      proposedById: userB.id,
      recipientId: userA.id,
      scheduledAt: inPast(72),
      durationMinutes: 30,
      skillsExchanged: [
        { skillCatalogId: skillEnglish.id, role: 'offered' },
        { skillCatalogId: skillFigma.id, role: 'wanted' },
      ],
      status: 'cancelled',
      cancelledById: userB.id,
      cancellationReason: 'Empêchement de dernière minute.',
      creditsUsed: 0,
      confirmationDeadline: inPast(48),
    },
  });

  console.log('✅ Sessions created: pending, confirmed, completed, cancelled');

  // ════════════════════════════════════════════════════════════════
  // 6. CREDIT TRANSACTIONS for the completed session
  // ════════════════════════════════════════════════════════════════

  // Welcome bonuses (logged at registration)
  await prisma.creditTransaction.createMany({
    data: [
      {
        userId: userA.id,
        type: 'welcome_bonus',
        amount: 2,
        balanceAfter: 2,
        description: "Crédit de bienvenue à l'inscription",
      },
      {
        userId: userB.id,
        type: 'welcome_bonus',
        amount: 2,
        balanceAfter: 2,
        description: "Crédit de bienvenue à l'inscription",
      },
      // B earned 1 credit for teaching Python in the completed session
      {
        userId: userB.id,
        sessionId: sessionCompleted.id,
        type: 'session_earned',
        amount: 1,
        balanceAfter: 3,
        description: '1 crédit(s) gagné(s) pour la session enseignée',
      },
      // Profile bonus for both having 100% profile score
      {
        userId: userA.id,
        type: 'profile_bonus',
        amount: 1,
        balanceAfter: 3,
        description: 'Bonus profil complet (100%)',
      },
      {
        userId: userB.id,
        type: 'profile_bonus',
        amount: 1,
        balanceAfter: 4,
        description: 'Bonus profil complet (100%)',
      },
    ],
  });

  console.log('✅ Credit transactions created');

  // ════════════════════════════════════════════════════════════════
  // 7. REVIEWS for the completed session (both visible)
  // ════════════════════════════════════════════════════════════════
  const reviewWindow = new Date(now.getTime() + 7 * 24 * 3_600_000);

  await prisma.review.createMany({
    data: [
      // A reviews B
      {
        sessionId: sessionCompleted.id,
        reviewerId: userA.id,
        revieweeId: userB.id,
        skillCatalogId: skillReact.id,
        rating: 5,
        ratingPedagogy: 5,
        ratingPunctuality: 4,
        ratingCommunication: 5,
        comment: 'Meriem explique très bien React, session au top !',
        isVisible: true,
        expiresAt: reviewWindow,
      },
      // B reviews A
      {
        sessionId: sessionCompleted.id,
        reviewerId: userB.id,
        revieweeId: userA.id,
        skillCatalogId: skillPython.id,
        rating: 4,
        ratingPedagogy: 4,
        ratingPunctuality: 5,
        ratingCommunication: 4,
        comment: 'Zakariae maîtrise bien Python, bonne session.',
        isVisible: true,
        expiresAt: reviewWindow,
      },
    ],
  });

  console.log('✅ Reviews created (both visible)');

  // ════════════════════════════════════════════════════════════════
  // 8. NOTIFICATIONS
  // ════════════════════════════════════════════════════════════════
  await prisma.notification.createMany({
    data: [
      {
        userId: userB.id,
        type: 'session_proposed',
        payload: {
          fromUserFirstName: 'Zakariae',
          sessionId: sessionPending.id,
        },
        isRead: false,
      },
      {
        userId: userA.id,
        type: 'new_perfect_match',
        payload: { fromUserFirstName: 'Meriem' },
        isRead: false,
      },
      {
        userId: userB.id,
        type: 'new_perfect_match',
        payload: { fromUserFirstName: 'Zakariae' },
        isRead: true,
      },
      {
        userId: userA.id,
        type: 'session_completed',
        payload: { sessionId: sessionCompleted.id },
        isRead: true,
      },
      {
        userId: userB.id,
        type: 'credits_earned',
        payload: { amount: 1, sessionId: sessionCompleted.id },
        isRead: false,
      },
    ],
  });

  console.log('✅ Notifications created\n');

  // ════════════════════════════════════════════════════════════════
  // 9. PRINT SUMMARY — copy these into your .http files
  // ════════════════════════════════════════════════════════════════
  console.log('═══════════════════════════════════════════════════');
  console.log('📋 COPY THESE IDs INTO YOUR .HTTP FILES');
  console.log('═══════════════════════════════════════════════════\n');

  console.log('👤 USERS');
  console.log(`  Admin:   ${admin.id}  →  admin@skilo.com  / Password123`);
  console.log(`  User A:  ${userA.id}  →  zakariae@skilo.com / Password123`);
  console.log(`  User B:  ${userB.id}  →  meriem@skilo.com / Password123\n`);

  console.log('🎯 SKILLS (use these in onboarding / addSkill)');
  console.log(`  Python:  ${skillPython.id}`);
  console.log(`  React:   ${skillReact.id}`);
  console.log(`  Figma:   ${skillFigma.id}`);
  console.log(`  English: ${skillEnglish.id}\n`);

  console.log('🤝 MATCH');
  console.log(`  Match (perfect A↔B): ${match.id}\n`);

  console.log('📅 SESSIONS');
  console.log(`  Pending:   ${sessionPending.id}`);
  console.log(`  Confirmed: ${sessionConfirmed.id}`);
  console.log(`  Completed: ${sessionCompleted.id}  ← use this for reviews`);
  console.log(`  Cancelled: ${sessionCancelled.id}\n`);

  console.log('═══════════════════════════════════════════════════');
  console.log('🚀 Seed complete! Run your .http tests now.');
  console.log('═══════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
