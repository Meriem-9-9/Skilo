// src/lib/store/auth.store.ts
//
// RÈGLE : access_token → mémoire JS uniquement (jamais localStorage / sessionStorage)
// Le refresh_token est géré côté serveur dans un cookie httpOnly, inaccessible ici.

import { create } from "zustand";
import type { AuthUser } from "@/types/auth.types";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean; // true après le premier /auth/refresh au boot

  // Actions
  setUser: (user: AuthUser | null) => void;
  setAccessToken: (token: string | null) => void;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  setHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isHydrated: false,

  setUser: (user) => set({ user }),

  setAccessToken: (token) =>
    set({ accessToken: token, isAuthenticated: !!token }),

  setAuth: (user, token) =>
    set({ user, accessToken: token, isAuthenticated: true }),

  clearAuth: () =>
    set({ user: null, accessToken: null, isAuthenticated: false }),

  setHydrated: (value) => set({ isHydrated: value }),
}));
