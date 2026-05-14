import { SkillLevel } from '@prisma/client';

export type UserSkill = {
  skillCatalogId: string;
  type: string;
  level: SkillLevel;
  skillCatalog: { id: string; name: string; category: string };
};

export type PerfectPair = {
  offeredByA: { id: string; name: string; level: SkillLevel };
  offeredByB: { id: string; name: string; level: SkillLevel };
  levelScore: number;
};

export type PartialMatch = {
  offeredByA: { id: string; name: string; level: SkillLevel } | null;
  offeredByB: { id: string; name: string; level: SkillLevel } | null;
  levelScore: number;
};
