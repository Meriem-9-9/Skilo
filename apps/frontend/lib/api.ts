// ============================================================
// skilo — API client
// Base URL: http://localhost:2006
// All requests include Authorization: Bearer <token> from memory
// Refresh is handled by the auth context (401 → POST /auth/refresh)
// ============================================================

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:2006';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';
export type SkillCategory = 'tech' | 'languages' | 'arts' | 'business' | 'sport' | 'cooking' | 'other';
export type SkillType = 'offered' | 'wanted';
export type MatchType = 'perfect' | 'partial';
export type SessionStatus = 'pending' | 'confirmed' | 'completed' | 'auto_completed' | 'cancelled' | 'disputed';
export type CreditType = 'welcome_bonus' | 'profile_bonus' | 'session_earned' | 'session_spent' | 'session_reserved' | 'session_released' | 'session_confirmed';

export interface User {
  id: string;
  email?: string;
  firstName: string;
  lastName: string;
  city?: string;
  bio?: string;
  avatarUrl?: string;
  isOnboarded: boolean;
  isActive: boolean;
  creditBalance: number;
  creditReserved: number;
  profileScore: number;
  avgRating?: number;
  avgPedagogy?: number;
  avgPunctuality?: number;
  avgCommunication?: number;
  sessionsCompleted: number;
  hasBadgeFiable: boolean;
  createdAt: string;
}

export interface SkillCatalogItem {
  id: string;
  name: string;
  category: SkillCategory;
  status: 'approved' | 'pending_review';
  usageCount: number;
}

export interface SkillEntry {
  skillId: string;
  level: SkillLevel;
}

export interface UserSkill {
  id: string;
  skillCatalogId: string;
  type: SkillType;
  level: SkillLevel;
  skillCatalog: SkillCatalogItem;
}

export interface Match {
  id: string;
  score: number;
  type: MatchType;
  label: string;           // 'Très compatible' | 'Compatible' | 'Partiellement compatible'
  matchedPairs: MatchedPair[];
  status: 'active' | 'archived';
  // The other user
  otherUser: {
    id: string;
    firstName: string;
    lastName: string;
    city?: string;
    avatarUrl?: string;
    avgRating?: number;
    sessionsCompleted: number;
    hasBadgeFiable: boolean;
    skills: UserSkill[];
  };
}

export interface MatchedPair {
  offeredByA: { id: string; name: string; level: SkillLevel };
  offeredByB: { id: string; name: string; level: SkillLevel };
}

export interface Session {
  id: string;
  status: SessionStatus;
  scheduledAt: string;
  durationMinutes: number;
  meetingLink?: string;
  message?: string;
  skillsExchanged: { offeredSkillName: string; wantedSkillName: string }[];
  confirmedByA: boolean | null;
  confirmedByB: boolean | null;
  creditsUsed: number;
  createdAt: string;
  proposedBy: {
    id: string;
    firstName: string;
    lastName: string;
    city?: string;
    avatarUrl?: string;
    avgRating?: number;
    sessionsCompleted?: number;
  };
  recipient: {
    id: string;
    firstName: string;
    lastName: string;
    city?: string;
    avatarUrl?: string;
    avgRating?: number;
    sessionsCompleted?: number;
  };
  reviews?: { reviewerId: string }[];
}

export interface Message {
  id: string;
  sessionId: string;
  senderId: string;
  content?: string;
  imageUrl?: string;
  isMeetingLinkSuggestion: boolean;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
}

export interface Review {
  id: string;
  rating: number;
  ratingPedagogy?: number;
  ratingPunctuality?: number;
  ratingCommunication?: number;
  comment?: string;
  isVisible: boolean;
  submittedAt: string;
  reviewer: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  skillCatalog?: { name: string };
}

export interface CreditBalance {
  available: number;
  reserved: number;
  total: number;
  cap: number;   // always 20
  estimatedHours: number;
}

export interface CreditTransaction {
  id: string;
  type: CreditType;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
  session?: { id: string };
}

export interface Notification {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ─── HTTP client ──────────────────────────────────────────────────────────────

// Token is stored in memory (never localStorage) — set by auth context after login
let _accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

export function getAccessToken() {
  return _accessToken;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  isFormData = false,
): Promise<T> {
  const headers: Record<string, string> = {};

  if (_accessToken) {
    headers['Authorization'] = `Bearer ${_accessToken}`;
  }
  if (body && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    credentials: 'include',   // needed for httpOnly refresh cookie
    body: body
      ? isFormData
        ? (body as FormData)
        : JSON.stringify(body)
      : undefined,
  });

  // Try to refresh on 401 (token expired)
  if (res.status === 401 && path !== '/auth/refresh' && path !== '/auth/login') {
    const refreshed = await tryRefresh();
    if (refreshed) {
      // Replay the original request with the new token
      return request<T>(method, path, body, isFormData);
    }
    // Refresh failed → force logout (auth context listens to this event)
    window.dispatchEvent(new Event('skilo:session-expired'));
    throw new Error('Session expirée, veuillez vous reconnecter.');
  }

  if (!res.ok) {
    let message = `Erreur ${res.status}`;
    try {
      const err = await res.json();
      message = err?.message ?? message;
    } catch { /* empty */ }
    throw new Error(message);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json();
}

export async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return false;
    const json = await res.json();

    if (json?.access_token) {
      const { access_token, user } = json;
      _accessToken = access_token;

      // Sync cookies for middleware and client rehydration
      const onboardedStr = String(user.isOnboarded ?? false);
      const userStr = encodeURIComponent(JSON.stringify(user));

      document.cookie = `access_token=${access_token}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `onboarded=${onboardedStr}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `user=${userStr}; path=/; max-age=604800; SameSite=Lax`;

      return true;
    }
    return false;
  } catch {
    return false;
  }
}

const get = <T>(path: string) => request<T>('GET', path);
const post = <T>(path: string, body?: unknown) => request<T>('POST', path, body);
const patch = <T>(path: string, body?: unknown) => request<T>('PATCH', path, body);
const del = <T>(path: string) => request<T>('DELETE', path);

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authApi = {
  register: ({ passwordConfirm, ...data }: { firstName: string; lastName: string; email: string; password: string; passwordConfirm?: string; referredById?: string }) =>
    post<{ access_token: string; user: User }>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    post<{ access_token: string; user: User; redirectTo: string }>('/auth/login', data),

  logout: () =>
    post<void>('/auth/logout'),

  refresh: () =>
    post<{ access_token: string }>('/auth/refresh'),

  me: () =>
    get<User>('/auth/me'),
};

// ─── Onboarding API ───────────────────────────────────────────────────────────

export const onboardingApi = {
  complete: (data: {
    skillsOffered: { skillId: string; level: SkillLevel }[];
    skillsWanted: { skillId: string; level: SkillLevel }[];
    city?: string;
    bio?: string;
    avatarUrl?: string;
  }) => post<{ user: User }>('/onboarding', data),

  status: () =>
    get<{ isOnboarded: boolean }>('/onboarding/status'),
};

// ─── Upload API ───────────────────────────────────────────────────────────────

export const uploadApi = {
  avatar: async (file: File): Promise<{ avatarUrl: string }> => {
    const fd = new FormData();
    fd.append('file', file);
    return request<{ avatarUrl: string }>('POST', '/upload', fd, true);
  },
};

// ─── Users API ────────────────────────────────────────────────────────────────

export const usersApi = {
  me: () =>
    get<User & { skills: UserSkill[] }>('/users/me'),

  list: (params?: { page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    return get<PaginatedResponse<User>>(`/users?${qs}`);
  },

  updateMe: (data: { firstName?: string; lastName?: string; city?: string; bio?: string; avatarUrl?: string }) =>
    patch<{ message: string; user: User }>('/users/me', data),

  publicProfile: (userId: string) =>
    get<User & {
      skills: UserSkill[];
      reviews: Review[];
      actionButton: 'propose_session' | 'write_message' | 'view_session' | 'none';
    }>(`/users/${userId}`),

  // Skills management
  addSkill: (data: { skillId: string; type: SkillType; level: SkillLevel }) =>
    post<{ message: string; skill: UserSkill }>('/users/me/skills', data),

  updateSkillLevel: (userSkillId: string, level: SkillLevel) =>
    patch<{ message: string; skill: UserSkill }>(`/users/me/skills/${userSkillId}`, { level }),

  removeSkill: (userSkillId: string) =>
    del<void>(`/users/me/skills/${userSkillId}`),
};

// ─── Skills catalog API ───────────────────────────────────────────────────────

export const skillsApi = {
  search: (q?: string) =>
    get<SkillCatalogItem[]>(`/skills/search${q ? `?q=${encodeURIComponent(q)}` : ''}`),

  findAll: (params?: { status?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    return get<PaginatedResponse<SkillCatalogItem>>(`/skills?${qs}`);
  },

  create: (data: { name: string; category: SkillCategory }) =>
    post<SkillCatalogItem>('/skills', data),
};

// ─── Matches API ──────────────────────────────────────────────────────────────

export const matchesApi = {
  list: (params?: {
    type?: MatchType;
    category?: SkillCategory;
    level?: SkillLevel;
    sort?: 'score' | 'rating' | 'sessions';
    page?: number;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.type) qs.set('type', params.type);
    if (params?.category) qs.set('category', params.category);
    if (params?.level) qs.set('level', params.level);
    if (params?.sort) qs.set('sort', params.sort);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    return get<PaginatedResponse<Match>>(`/matches?${qs}`);
  },

  get: (matchId: string) =>
    get<Match>(`/matches/${matchId}`),

  byUser: (userId: string) =>
    get<Match>(`/matches/user/${userId}`),

  recalculate: () =>
    post<void>('/matches/recalculate'),
};

// ─── Sessions API ─────────────────────────────────────────────────────────────

export const sessionsApi = {
  propose: (data: {
    recipientId: string;
    scheduledAt: string;
    duration: number;
    offeredSkillId: string;
    wantedSkillId: string;
    message?: string;
    meetingLink?: string;
  }) => post<Session>('/sessions', data),

  list: (params?: { tab?: 'upcoming' | 'past'; page?: number; limit?: number; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.tab) qs.set('tab', params.tab);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.status) qs.set('status', params.status);
    return get<PaginatedResponse<Session>>(`/sessions?${qs}`);
  },

  get: (sessionId: string) =>
    get<Session>(`/sessions/${sessionId}`),

  accept: (sessionId: string) =>
    patch<Session>(`/sessions/${sessionId}/accept`),

  decline: (sessionId: string, reason?: string) =>
    patch<Session>(`/sessions/${sessionId}/decline`, { reason }),

  cancel: (sessionId: string, reason?: string) =>
    patch<Session>(`/sessions/${sessionId}/cancel`, { reason }),

  confirm: (sessionId: string, didHappen: boolean) =>
    patch<Session>(`/sessions/${sessionId}/confirm`, { didHappen }),

  getMessages: (sessionId: string) =>
    get<Message[]>(`/sessions/${sessionId}/messages`),

  createMessage: (sessionId: string, data: { content?: string; imageUrl?: string; isMeetingLinkSuggestion?: boolean }) =>
    post<Message>(`/sessions/${sessionId}/messages`, data),
};

// ─── Credits API ──────────────────────────────────────────────────────────────

export const creditsApi = {
  balance: () =>
    get<CreditBalance>('/credits/balance'),

  history: (params?: { type?: CreditType; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.type) qs.set('type', params.type);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    return get<PaginatedResponse<CreditTransaction>>(`/credits/history?${qs}`);
  },
};

// ─── Reviews API ──────────────────────────────────────────────────────────────

export const reviewsApi = {
  submit: (data: {
    sessionId: string;
    globalRating: number;
    pedagogyRating?: number;
    punctualityRating?: number;
    communicationRating?: number;
    comment?: string;
  }) => post<Review>('/reviews', data),

  forUser: (userId: string) =>
    get<PaginatedResponse<Review>>(`/users/${userId}/reviews`),
};

// ─── Notifications API ────────────────────────────────────────────────────────

export const notificationsApi = {
  list: (params?: { page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    return get<PaginatedResponse<Notification>>(`/notifications?${qs}`);
  },

  markRead: (notificationId: string) =>
    patch<void>(`/notifications/${notificationId}/read`),

  markAllRead: () =>
    patch<void>('/notifications/read-all'),
};
