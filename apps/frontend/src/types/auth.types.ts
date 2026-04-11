// src/types/auth.types.ts

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  city: string | null;
  avatarUrl: string | null;
  isOnboarded: boolean;
  creditBalance: number;
  profileScore: number;
  createdAt: string;
}

export interface AuthResponse {
  user: AuthUser;
  access_token: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RefreshResponse {
  user: AuthUser;
  access_token: string;
}