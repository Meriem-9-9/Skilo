/**
 * types/api.ts
 * Shared TypeScript types mirroring the NestJS backend models.
 *
 * TODO (onboarding):
 *   - When the backend gains an OpenAPI / Swagger spec, generate these types
 *     automatically with `openapi-typescript` to avoid drift.
 *   - Extend `UserMe` if new fields are added to GET /users/me.
 */

// ─── Skill ────────────────────────────────────────────────────────────────────

export type SkillType = 'offered' | 'wanted';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface SkillCatalog {
  id: string;
  name: string;
  category: string;
}

export interface UserSkill {
  id: string;
  type: SkillType;
  level: SkillLevel;
  skillCatalog: SkillCatalog;
}

// ─── Profile strength ─────────────────────────────────────────────────────────

export interface ProfileStrength {
  score: number;       // 0 – 100
  label: string;
  nextAction: string;
}

// ─── User (own profile — GET /users/me) ──────────────────────────────────────

export interface UserMe {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  city: string | null;
  bio: string | null;
  avatarUrl: string | null;
  creditBalance: number;
  creditReserved: number;
  avgRating: number | null;
  avgPedagogy: number | null;
  avgPunctuality: number | null;
  avgCommunication: number | null;
  sessionsCompleted: number;
  hasBadgeFiable: boolean;
  profileScore: number;
  isOnboarded: boolean;
  createdAt: string;
  skills: UserSkill[];
  profileStrength: ProfileStrength;
}

// ─── User (public profile — GET /users/:id) ──────────────────────────────────

export type ActionButton = 'propose_session' | 'write_message' | 'view_session' | 'none';

export interface Review {
  id: string;
  rating: number;
  ratingPedagogy: number | null;
  ratingPunctuality: number | null;
  ratingCommunication: number | null;
  comment: string | null;
  submittedAt: string;
  skillCatalog: { name: string };
  reviewer: { firstName: string; avatarUrl: string | null };
}

export interface UserPublic {
  id: string;
  firstName: string;
  lastName: string;
  city: string | null;
  bio: string | null;
  avatarUrl: string | null;
  avgRating: number | null;
  avgPedagogy: number | null;
  avgPunctuality: number | null;
  avgCommunication: number | null;
  sessionsCompleted: number;
  hasBadgeFiable: boolean;
  profileScore: number;
  isOnboarded: boolean;
  createdAt: string;
  skills: UserSkill[];
  email?: string;             // only present if confirmed session exists
  reviewsReceived: Review[];
  actionButton: ActionButton;
}

// ─── Match ────────────────────────────────────────────────────────────────────

export type MatchType = 'perfect' | 'partial';
export type MatchStatus = 'active' | 'expired' | 'converted';

export interface Match {
  id: string;
  type: MatchType;
  status: MatchStatus;
  score: number;
  userA: UserPublic;
  userB: UserPublic;
  sharedSkills: SkillCatalog[];
  createdAt: string;
}

export interface MatchesResponse {
  data: Match[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── API helpers ─────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface ApiError {
  message: string;
  statusCode: number;
}
