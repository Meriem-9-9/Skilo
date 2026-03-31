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
const hash = (pwd: string) => bcrypt.hashSync(pwd, 12);

const future = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

const past = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};

// ── main ───────────────────────────────────────────────────
async function main() {
  console.log('🌱  Seeding skilo …');

  // ──────────────────────────────────────────────────────────
  // 1. SKILL CATALOG  (entrées seed — createdById = null)
  // ──────────────────────────────────────────────────────────
  console.log('  → skill_catalog');

  const skills = await Promise.all([
    // tech
    prisma.skillCatalog.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'JavaScript',
        category: 'tech',
        aliases: ['JS', 'ECMAScript'],
        usageCount: 0,
      },
    }),
    prisma.skillCatalog.upsert({
      where: { id: '00000000-0000-0000-0000-000000000002' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Python',
        category: 'tech',
        aliases: ['py'],
        usageCount: 0,
      },
    }),
    prisma.skillCatalog.upsert({
      where: { id: '00000000-0000-0000-0000-000000000003' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000003',
        name: 'React',
        category: 'tech',
        aliases: ['ReactJS', 'React.js'],
        usageCount: 0,
      },
    }),
    prisma.skillCatalog.upsert({
      where: { id: '00000000-0000-0000-0000-000000000004' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000004',
        name: 'Node.js',
        category: 'tech',
        aliases: ['NodeJS', 'Node'],
        usageCount: 0,
      },
    }),
    prisma.skillCatalog.upsert({
      where: { id: '00000000-0000-0000-0000-000000000005' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000005',
        name: 'UI/UX Design',
        category: 'tech',
        aliases: ['UX', 'UI Design', 'Figma'],
        usageCount: 0,
      },
    }),
    // languages
    prisma.skillCatalog.upsert({
      where: { id: '00000000-0000-0000-0000-000000000006' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000006',
        name: 'Anglais',
        category: 'languages',
        aliases: ['English', 'EN'],
        usageCount: 0,
      },
    }),
    prisma.skillCatalog.upsert({
      where: { id: '00000000-0000-0000-0000-000000000007' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000007',
        name: 'Espagnol',
        category: 'languages',
        aliases: ['Spanish', 'ES'],
        usageCount: 0,
      },
    }),
    prisma.skillCatalog.upsert({
      where: { id: '00000000-0000-0000-0000-000000000008' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000008',
        name: 'Arabe',
        category: 'languages',
        aliases: ['Arabic', 'AR'],
        usageCount: 0,
      },
    }),
    // arts
    prisma.skillCatalog.upsert({
      where: { id: '00000000-0000-0000-0000-000000000009' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000009',
        name: 'Photographie',
        category: 'arts',
        aliases: ['Photo', 'Photography'],
        usageCount: 0,
      },
    }),
    prisma.skillCatalog.upsert({
      where: { id: '00000000-0000-0000-0000-000000000010' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000010',
        name: 'Guitare',
        category: 'arts',
        aliases: ['Guitar'],
        usageCount: 0,
      },
    }),
    // business
    prisma.skillCatalog.upsert({
      where: { id: '00000000-0000-0000-0000-000000000011' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000011',
        name: 'Marketing Digital',
        category: 'business',
        aliases: ['Digital Marketing', 'SEO/SEA'],
        usageCount: 0,
      },
    }),
    prisma.skillCatalog.upsert({
      where: { id: '00000000-0000-0000-0000-000000000012' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000012',
        name: 'Comptabilité',
        category: 'business',
        aliases: ['Accounting', 'Finance'],
        usageCount: 0,
      },
    }),
    // cooking
    prisma.skillCatalog.upsert({
      where: { id: '00000000-0000-0000-0000-000000000013' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000013',
        name: 'Cuisine marocaine',
        category: 'cooking',
        aliases: ['Moroccan cooking', 'Tajine'],
        usageCount: 0,
      },
    }),
    // sport
    prisma.skillCatalog.upsert({
      where: { id: '00000000-0000-0000-0000-000000000014' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000014',
        name: 'Yoga',
        category: 'sport',
        aliases: ['Hatha Yoga', 'Vinyasa'],
        usageCount: 0,
      },
    }),
  ]);

  const [
    skillJS,
    skillPython,
    skillReact,
    skillNode,
    skillUXUI,
    skillAnglais,
    skillEspagnol,
    skillArabe,
    skillPhoto,
    skillGuitare,
    skillMarketing,
    skillCompta,
    skillCuisine,
    skillYoga,
  ] = skills;

  // ──────────────────────────────────────────────────────────
  // 2. USERS  (mot de passe : Password123!)
  // ──────────────────────────────────────────────────────────
  console.log('  → users');

  const PWD = hash('Password123!');

  const zakariae = await prisma.user.upsert({
    where: { email: 'zakariae@skilo.app' },
    update: {},
    create: {
      id: '11000000-0000-0000-0000-000000000001',
      email: 'zakariae@skilo.app',
      emailLower: 'zakariae@skilo.app',
      passwordHash: PWD,
      firstName: 'Zakariae',
      lastName: 'Benchekroun',
      city: 'Casablanca',
      bio: "Dev fullstack passionné par le partage de savoirs. J'enseigne JS/React et j'apprends la photo.",
      avatarUrl: 'https://i.pravatar.cc/150?u=zakariae',
      isOnboarded: true,
      creditBalance: 8,
      profileScore: 100,
      avgRating: 4.8,
      avgPedagogy: 4.9,
      avgPunctuality: 4.7,
      avgCommunication: 4.8,
      sessionsCompleted: 5,
      hasBadgeFiable: true,
      lastLoginAt: past(1),
    },
  });

  const meriem = await prisma.user.upsert({
    where: { email: 'meriem@skilo.app' },
    update: {},
    create: {
      id: '11000000-0000-0000-0000-000000000002',
      email: 'meriem@skilo.app',
      emailLower: 'meriem@skilo.app',
      passwordHash: PWD,
      firstName: 'Meriem',
      lastName: 'Ouali',
      city: 'Rabat',
      bio: 'Designer UX/UI & photographe amateur. Je cherche à progresser en développement web.',
      avatarUrl: 'https://i.pravatar.cc/150?u=meriem',
      isOnboarded: true,
      creditBalance: 6,
      profileScore: 100,
      avgRating: 4.6,
      avgPedagogy: 4.5,
      avgPunctuality: 4.8,
      avgCommunication: 4.6,
      sessionsCompleted: 3,
      hasBadgeFiable: true,
      lastLoginAt: past(2),
    },
  });

  const youssef = await prisma.user.upsert({
    where: { email: 'youssef@skilo.app' },
    update: {},
    create: {
      id: '11000000-0000-0000-0000-000000000003',
      email: 'youssef@skilo.app',
      emailLower: 'youssef@skilo.app',
      passwordHash: PWD,
      firstName: 'Youssef',
      lastName: 'Alami',
      city: 'Marrakech',
      bio: "Guitariste et prof de musique. J'apprends Python pour automatiser mes partitions.",
      avatarUrl: 'https://i.pravatar.cc/150?u=youssef',
      isOnboarded: true,
      creditBalance: 4,
      profileScore: 90,
      avgRating: 4.9,
      sessionsCompleted: 2,
      hasBadgeFiable: false,
      lastLoginAt: past(5),
    },
  });

  const sofia = await prisma.user.upsert({
    where: { email: 'sofia@skilo.app' },
    update: {},
    create: {
      id: '11000000-0000-0000-0000-000000000004',
      email: 'sofia@skilo.app',
      emailLower: 'sofia@skilo.app',
      passwordHash: PWD,
      firstName: 'Sofia',
      lastName: 'Tazi',
      city: 'Casablanca',
      bio: "Comptable de formation, je veux apprendre le marketing digital. J'enseigne le yoga en parallèle.",
      avatarUrl: 'https://i.pravatar.cc/150?u=sofia',
      isOnboarded: true,
      creditBalance: 5,
      profileScore: 80,
      avgRating: 4.4,
      sessionsCompleted: 1,
      hasBadgeFiable: false,
      lastLoginAt: past(3),
    },
  });

  // Utilisateur en cours d'onboarding — step 2
  const newUser = await prisma.user.upsert({
    where: { email: 'nouveau@skilo.app' },
    update: {},
    create: {
      id: '11000000-0000-0000-0000-000000000005',
      email: 'nouveau@skilo.app',
      emailLower: 'nouveau@skilo.app',
      passwordHash: PWD,
      firstName: 'Karim',
      lastName: 'Idrissi',
      city: 'Fès',
      isOnboarded: false,
      onboardingStep: 2,
      creditBalance: 2, // welcome_bonus
    },
  });

  // ──────────────────────────────────────────────────────────
  // 3. USER_SKILLS
  // ──────────────────────────────────────────────────────────
  console.log('  → user_skills');

  // Zakariae : offre JS + React + Node, cherche Photo + Guitare
  await prisma.userSkill.createMany({
    skipDuplicates: true,
    data: [
      {
        userId: zakariae.id,
        skillCatalogId: skillJS.id,
        type: 'offered',
        level: 'advanced',
        description: "5 ans d'expérience, ES2023, TypeScript",
      },
      {
        userId: zakariae.id,
        skillCatalogId: skillReact.id,
        type: 'offered',
        level: 'advanced',
        description: 'React 18, hooks, Zustand, React Query',
      },
      {
        userId: zakariae.id,
        skillCatalogId: skillNode.id,
        type: 'offered',
        level: 'intermediate',
        description: 'APIs REST, Prisma, NestJS',
      },
      {
        userId: zakariae.id,
        skillCatalogId: skillPhoto.id,
        type: 'wanted',
        level: 'beginner',
        description: 'Débutant complet, intéressé par la photo de rue',
      },
      {
        userId: zakariae.id,
        skillCatalogId: skillGuitare.id,
        type: 'wanted',
        level: 'beginner',
        description: 'Je veux apprendre les accords de base',
      },
    ],
  });

  // Meriem : offre UX/UI + Photo, cherche JS + React
  await prisma.userSkill.createMany({
    skipDuplicates: true,
    data: [
      {
        userId: meriem.id,
        skillCatalogId: skillUXUI.id,
        type: 'offered',
        level: 'advanced',
        description: 'Figma, Design System, prototypage haute fidélité',
      },
      {
        userId: meriem.id,
        skillCatalogId: skillPhoto.id,
        type: 'offered',
        level: 'intermediate',
        description: 'Portrait et paysage, Lightroom',
      },
      {
        userId: meriem.id,
        skillCatalogId: skillAnglais.id,
        type: 'offered',
        level: 'advanced',
        description: 'Niveau C1, vécu 2 ans au Royaume-Uni',
      },
      {
        userId: meriem.id,
        skillCatalogId: skillJS.id,
        type: 'wanted',
        level: 'beginner',
        description: 'Bases solides pour comprendre le front',
      },
      {
        userId: meriem.id,
        skillCatalogId: skillReact.id,
        type: 'wanted',
        level: 'beginner',
        description: 'Créer des composants simples',
      },
    ],
  });

  // Youssef : offre Guitare + Arabe + Cuisine, cherche Python
  await prisma.userSkill.createMany({
    skipDuplicates: true,
    data: [
      {
        userId: youssef.id,
        skillCatalogId: skillGuitare.id,
        type: 'offered',
        level: 'advanced',
        description: 'Classique et flamenco, 15 ans de pratique',
      },
      {
        userId: youssef.id,
        skillCatalogId: skillArabe.id,
        type: 'offered',
        level: 'advanced',
        description: 'Arabe classique et dialectal marocain',
      },
      {
        userId: youssef.id,
        skillCatalogId: skillCuisine.id,
        type: 'offered',
        level: 'intermediate',
        description: 'Spécialité tajines et pâtisseries marocaines',
      },
      {
        userId: youssef.id,
        skillCatalogId: skillPython.id,
        type: 'wanted',
        level: 'beginner',
        description: 'Automatisation et traitement de fichiers MIDI',
      },
    ],
  });

  // Sofia : offre Compta + Yoga + Espagnol, cherche Marketing + Photo
  await prisma.userSkill.createMany({
    skipDuplicates: true,
    data: [
      {
        userId: sofia.id,
        skillCatalogId: skillCompta.id,
        type: 'offered',
        level: 'advanced',
        description: 'Bilan, fiscalité marocaine, Excel avancé',
      },
      {
        userId: sofia.id,
        skillCatalogId: skillYoga.id,
        type: 'offered',
        level: 'intermediate',
        description: 'Hatha yoga, cours en français et arabe',
      },
      {
        userId: sofia.id,
        skillCatalogId: skillEspagnol.id,
        type: 'offered',
        level: 'intermediate',
        description: 'Niveau B2, séjour à Madrid',
      },
      {
        userId: sofia.id,
        skillCatalogId: skillMarketing.id,
        type: 'wanted',
        level: 'beginner',
        description: 'Google Ads, Meta Ads, stratégie de contenu',
      },
      {
        userId: sofia.id,
        skillCatalogId: skillPhoto.id,
        type: 'wanted',
        level: 'beginner',
        description: 'Photo produit pour mon activité de vente',
      },
    ],
  });

  // ──────────────────────────────────────────────────────────
  // 4. MATCHES
  // Zakariae <-> Meriem : match parfait (JS⇄Photo, React⇄UX)
  // Zakariae <-> Youssef : match partiel (Node⇄Python)
  // ──────────────────────────────────────────────────────────
  console.log('  → matches');

  // Canonical order : userAId < userBId (string comparison)
  const [uidA_ZM, uidB_ZM] =
    zakariae.id < meriem.id
      ? [zakariae.id, meriem.id]
      : [meriem.id, zakariae.id];

  const [uidA_ZY, uidB_ZY] =
    zakariae.id < youssef.id
      ? [zakariae.id, youssef.id]
      : [youssef.id, zakariae.id];

  const matchZM = await prisma.match.upsert({
    where: { userAId_userBId: { userAId: uidA_ZM, userBId: uidB_ZM } },
    update: {},
    create: {
      id: '22000000-0000-0000-0000-000000000001',
      userAId: uidA_ZM,
      userBId: uidB_ZM,
      type: 'perfect',
      score: 95,
      label: 'Très compatible',
      matchedPairs: [
        { offered_by_a: skillJS.id, offered_by_b: skillPhoto.id },
        { offered_by_a: skillReact.id, offered_by_b: skillUXUI.id },
      ],
      status: 'active',
    },
  });

  const matchZY = await prisma.match.upsert({
    where: { userAId_userBId: { userAId: uidA_ZY, userBId: uidB_ZY } },
    update: {},
    create: {
      id: '22000000-0000-0000-0000-000000000002',
      userAId: uidA_ZY,
      userBId: uidB_ZY,
      type: 'partial',
      score: 60,
      label: 'Partiellement compatible',
      matchedPairs: [
        { offered_by_a: skillNode.id, offered_by_b: skillGuitare.id },
      ],
      status: 'active',
    },
  });

  // ──────────────────────────────────────────────────────────
  // 5. SESSIONS
  // S1 : Zakariae → Meriem, JS, passée + completed
  // S2 : Meriem → Zakariae, UX, upcoming + confirmed
  // S3 : Zakariae → Youssef, Node/Python, pending
  // ──────────────────────────────────────────────────────────
  console.log('  → sessions');

  const session1 = await prisma.session.upsert({
    where: { id: '33000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '33000000-0000-0000-0000-000000000001',
      matchId: matchZM.id,
      proposedById: zakariae.id,
      recipientId: meriem.id,
      scheduledAt: past(10),
      durationMinutes: 60,
      modality: 'online',
      meetingLink: 'https://meet.jit.si/skilo-zakariae-meriem-01',
      message:
        "On fait un tour des fondamentaux JS ? Je t'explique les closures.",
      skillsExchanged: [{ skill: skillJS.id, direction: 'zakariae→meriem' }],
      status: 'completed',
      confirmedByA: true,
      confirmedByB: true,
      confirmationDeadline: past(9),
      creditsUsed: 0, // match parfait
    },
  });

  const session2 = await prisma.session.upsert({
    where: { id: '33000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '33000000-0000-0000-0000-000000000002',
      matchId: matchZM.id,
      proposedById: meriem.id,
      recipientId: zakariae.id,
      scheduledAt: future(3),
      durationMinutes: 90,
      modality: 'online',
      meetingLink: 'https://meet.jit.si/skilo-meriem-zakariae-02',
      message: 'Je te montre comment construire un design system sur Figma.',
      skillsExchanged: [],
      status: 'confirmed',
      confirmedByA: false,
      confirmedByB: false,
      confirmationDeadline: future(4),
      creditsUsed: 0,
    },
  });

  const session3 = await prisma.session.upsert({
    where: { id: '33000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '33000000-0000-0000-0000-000000000003',
      matchId: matchZY.id,
      proposedById: zakariae.id,
      recipientId: youssef.id,
      scheduledAt: future(7),
      durationMinutes: 60,
      modality: 'online',
      message: "Je t'explique Prisma + Node, en échange d'une intro guitare.",
      skillsExchanged: [],
      status: 'pending',
      confirmedByA: false,
      confirmedByB: false,
      confirmationDeadline: future(8),
      creditsUsed: 1, // match partiel
    },
  });

  // ──────────────────────────────────────────────────────────
  // 6. REVIEWS  (session1 seulement — session complétée)
  // ──────────────────────────────────────────────────────────
  console.log('  → reviews');

  const reviewZM = await prisma.review.upsert({
    where: {
      sessionId_reviewerId: {
        sessionId: session1.id,
        reviewerId: zakariae.id,
      },
    },
    update: {},
    create: {
      id: '44000000-0000-0000-0000-000000000001',
      sessionId: session1.id,
      reviewerId: zakariae.id,
      revieweeId: meriem.id,
      skillCatalogId: skillUXUI.id,
      rating: 5,
      ratingPedagogy: 5,
      ratingPunctuality: 5,
      ratingCommunication: 5,
      comment:
        'Meriem est une excellente pédagogue, explications très claires !',
      isVisible: true,
      expiresAt: future(7 - 10 + 10), // submitted_at + 7j
    },
  });

  const reviewMZ = await prisma.review.upsert({
    where: {
      sessionId_reviewerId: {
        sessionId: session1.id,
        reviewerId: meriem.id,
      },
    },
    update: {},
    create: {
      id: '44000000-0000-0000-0000-000000000002',
      sessionId: session1.id,
      reviewerId: meriem.id,
      revieweeId: zakariae.id,
      skillCatalogId: skillJS.id,
      rating: 5,
      ratingPedagogy: 5,
      ratingPunctuality: 4,
      ratingCommunication: 5,
      comment:
        "Zakariae explique très bien, j'ai enfin compris les closures et le event loop !",
      isVisible: true,
      expiresAt: future(7),
    },
  });
  console.log(reviewMZ);
  console.log(reviewZM);

  // ──────────────────────────────────────────────────────────
  // 7. CREDIT_TRANSACTIONS
  // ──────────────────────────────────────────────────────────
  console.log('  → credit_transactions');

  await prisma.creditTransaction.createMany({
    skipDuplicates: true,
    data: [
      // Zakariae
      {
        id: '55000000-0000-0000-0000-000000000001',
        userId: zakariae.id,
        type: 'welcome_bonus',
        amount: 2,
        balanceAfter: 2,
        description: 'Bonus de bienvenue',
      },
      {
        id: '55000000-0000-0000-0000-000000000002',
        userId: zakariae.id,
        type: 'profile_bonus',
        amount: 3,
        balanceAfter: 5,
        description: 'Profil complété à 100 %',
      },
      {
        id: '55000000-0000-0000-0000-000000000003',
        userId: zakariae.id,
        sessionId: session1.id,
        type: 'session_earned',
        amount: 3,
        balanceAfter: 8,
        description: 'Session complétée avec Meriem — JS',
      },
      // Meriem
      {
        id: '55000000-0000-0000-0000-000000000004',
        userId: meriem.id,
        type: 'welcome_bonus',
        amount: 2,
        balanceAfter: 2,
        description: 'Bonus de bienvenue',
      },
      {
        id: '55000000-0000-0000-0000-000000000005',
        userId: meriem.id,
        type: 'profile_bonus',
        amount: 3,
        balanceAfter: 5,
        description: 'Profil complété à 100 %',
      },
      {
        id: '55000000-0000-0000-0000-000000000006',
        userId: meriem.id,
        sessionId: session1.id,
        type: 'session_earned',
        amount: 3,
        balanceAfter: 8,
        description: 'Session complétée avec Zakariae — UX',
      },
      {
        id: '55000000-0000-0000-0000-000000000007',
        userId: meriem.id,
        sessionId: session2.id,
        type: 'session_reserved',
        amount: -2,
        balanceAfter: 6,
        description: 'Crédits réservés — session confirmée avec Zakariae',
      },
      // Youssef
      {
        id: '55000000-0000-0000-0000-000000000008',
        userId: youssef.id,
        type: 'welcome_bonus',
        amount: 2,
        balanceAfter: 2,
        description: 'Bonus de bienvenue',
      },
      {
        id: '55000000-0000-0000-0000-000000000009',
        userId: youssef.id,
        type: 'profile_bonus',
        amount: 3,
        balanceAfter: 5,
        description: 'Profil complété à 90 %',
      },
      // Karim — nouveau
      {
        id: '55000000-0000-0000-0000-000000000010',
        userId: newUser.id,
        type: 'welcome_bonus',
        amount: 2,
        balanceAfter: 2,
        description: 'Bonus de bienvenue',
      },
    ],
  });

  // ──────────────────────────────────────────────────────────
  // 8. NOTIFICATIONS
  // ──────────────────────────────────────────────────────────
  console.log('  → notifications');

  await prisma.notification.createMany({
    skipDuplicates: true,
    data: [
      // Meriem reçoit un nouveau match parfait
      {
        id: '66000000-0000-0000-0000-000000000001',
        userId: meriem.id,
        type: 'new_perfect_match',
        payload: {
          from_user: 'Zakariae',
          match_id: matchZM.id,
          score: 95,
        },
        isRead: true,
        readAt: past(9),
      },
      // Meriem : session proposée par Zakariae (session1)
      {
        id: '66000000-0000-0000-0000-000000000002',
        userId: meriem.id,
        type: 'session_proposed',
        payload: {
          from_user: 'Zakariae',
          session_id: session1.id,
          session_date: past(10).toISOString(),
        },
        isRead: true,
        readAt: past(10),
      },
      // Zakariae : session acceptée par Meriem (session2)
      {
        id: '66000000-0000-0000-0000-000000000003',
        userId: zakariae.id,
        type: 'session_accepted',
        payload: {
          from_user: 'Meriem',
          session_id: session2.id,
          session_date: future(3).toISOString(),
        },
        isRead: false,
      },
      // Zakariae : review reçue de Meriem
      {
        id: '66000000-0000-0000-0000-000000000004',
        userId: zakariae.id,
        type: 'review_received',
        payload: {
          from_user: 'Meriem',
          rating: 5,
          session_id: session1.id,
        },
        isRead: false,
      },
      // Zakariae : crédits gagnés après session1
      {
        id: '66000000-0000-0000-0000-000000000005',
        userId: zakariae.id,
        type: 'credits_earned',
        payload: { amount: 3, balance_after: 8, session_id: session1.id },
        isRead: false,
      },
      // Youssef : nouvelle session proposée (session3)
      {
        id: '66000000-0000-0000-0000-000000000006',
        userId: youssef.id,
        type: 'session_proposed',
        payload: {
          from_user: 'Zakariae',
          session_id: session3.id,
          session_date: future(7).toISOString(),
        },
        isRead: false,
      },
      // Meriem : badge_earned après hasBadgeFiable
      {
        id: '66000000-0000-0000-0000-000000000007',
        userId: meriem.id,
        type: 'badge_earned',
        payload: { badge: 'fiable', sessions_completed: 3 },
        isRead: false,
      },
    ],
  });

  // ──────────────────────────────────────────────────────────
  // 9. Mise à jour des usageCount du skill_catalog
  // ──────────────────────────────────────────────────────────
  console.log('  → usageCount skill_catalog');

  const usageCounts: Record<string, number> = {};
  const allUserSkills = await prisma.userSkill.findMany();
  for (const us of allUserSkills) {
    usageCounts[us.skillCatalogId] = (usageCounts[us.skillCatalogId] || 0) + 1;
  }
  for (const [id, count] of Object.entries(usageCounts)) {
    await prisma.skillCatalog.update({
      where: { id },
      data: { usageCount: count },
    });
  }

  console.log('✅  Seed terminé !');
  console.log('');
  console.log('  Comptes créés (mot de passe : Password123!)');
  console.log('  ┌──────────────────────────────────┬────────────┐');
  console.log('  │ email                            │ rôle       │');
  console.log('  ├──────────────────────────────────┼────────────┤');
  console.log('  │ zakariae@skilo.app               │ dev        │');
  console.log('  │ meriem@skilo.app                 │ designer   │');
  console.log('  │ youssef@skilo.app                │ musicien   │');
  console.log('  │ sofia@skilo.app                  │ comptable  │');
  console.log('  │ nouveau@skilo.app                │ onboarding │');
  console.log('  └──────────────────────────────────┴────────────┘');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
