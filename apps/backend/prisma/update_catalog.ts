import 'dotenv/config';
import { PrismaClient, SkillCategory } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const NEW_SKILLS: { name: string; category: SkillCategory }[] = [
  // Tech
  { name: 'Vue.js', category: 'tech' },
  { name: 'Flutter', category: 'tech' },
  { name: 'Docker', category: 'tech' },
  { name: 'Kubernetes', category: 'tech' },
  { name: 'AWS', category: 'tech' },
  { name: 'Machine Learning', category: 'tech' },
  { name: 'Cybersecurity', category: 'tech' },
  { name: 'Solidity', category: 'tech' },
  { name: 'Go', category: 'tech' },
  { name: 'Rust', category: 'tech' },

  // Languages
  { name: 'German', category: 'languages' },
  { name: 'Spanish', category: 'languages' },
  { name: 'French', category: 'languages' },
  { name: 'Mandarin', category: 'languages' },
  { name: 'Japanese', category: 'languages' },
  { name: 'Arabic', category: 'languages' },
  { name: 'Italian', category: 'languages' },
  { name: 'Portuguese', category: 'languages' },

  // Arts & Design
  { name: 'Guitar', category: 'arts' },
  { name: 'Piano', category: 'arts' },
  { name: 'UI/UX Design', category: 'arts' },
  { name: 'Illustration', category: 'arts' },
  { name: 'Video Editing', category: 'arts' },
  { name: '3D Modeling', category: 'arts' },
  { name: 'Photography', category: 'arts' },
  { name: 'Calligraphy', category: 'arts' },

  // Sport & Wellness
  { name: 'Yoga', category: 'sport' },
  { name: 'Crossfit', category: 'sport' },
  { name: 'Swimming', category: 'sport' },
  { name: 'Tennis', category: 'sport' },
  { name: 'Meditation', category: 'sport' },
  { name: 'Surfing', category: 'sport' },
  { name: 'Chess', category: 'sport' },

  // Cooking
  { name: 'Pastry', category: 'cooking' },
  { name: 'Italian Cuisine', category: 'cooking' },
  { name: 'Sushi Making', category: 'cooking' },
  { name: 'Baking', category: 'cooking' },
  { name: 'Vegan Cooking', category: 'cooking' },
  { name: 'Wine Tasting', category: 'cooking' },

  // Business & Marketing
  { name: 'Public Speaking', category: 'business' },
  { name: 'SEO', category: 'business' },
  { name: 'Copywriting', category: 'business' },
  { name: 'Project Management', category: 'business' },
  { name: 'Financial Modeling', category: 'business' },
  { name: 'Sales Strategy', category: 'business' },
  { name: 'Crypto Trading', category: 'business' },
];

async function main() {
  console.log('🚀 Updating Skill Catalog...\n');

  for (const skill of NEW_SKILLS) {
    const existing = await prisma.skillCatalog.findFirst({
      where: { name: { equals: skill.name, mode: 'insensitive' } },
    });

    if (existing) {
      console.log(`⏭️  Skill "${skill.name}" already exists, skipping.`);
      continue;
    }

    await prisma.skillCatalog.create({
      data: {
        name: skill.name,
        category: skill.category,
        status: 'approved',
        usageCount: 0,
      },
    });
    console.log(`✅ Added skill: ${skill.name} (${skill.category})`);
  }

  console.log('\n✨ Catalog update complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error updating catalog:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
