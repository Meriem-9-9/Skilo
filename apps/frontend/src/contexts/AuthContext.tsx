// src/contexts/AuthContext.tsx
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';

import { authApi } from '@/lib/api/auth';
import { setGlobalAccessToken } from '@/lib/api/axios';
import type { LoginPayload, RegisterPayload, AuthUser } from '@/types/auth.types';
import type { UserMe } from '@/types/api';

// ─── Forme du contexte ────────────────────────────────────────────────────────
interface AuthContextValue {
  user: UserMe | AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateUserInContext: (user: Partial<UserMe | AuthUser>) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  
  const [user, setUser] = useState<UserMe | AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [loading, setLoading] = useState(false);

  // Évite un double appel en StrictMode React
  const hydrated = useRef(false);

  const setAuth = useCallback((newUser: AuthUser, token: string) => {
    setUser(newUser);
    setAccessToken(token);
    setGlobalAccessToken(token);
    setIsAuthenticated(true);
  }, []);

  const clearAuth = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setGlobalAccessToken(null);
    setIsAuthenticated(false);
  }, []);

  const updateUserInContext = useCallback((updates: Partial<UserMe | AuthUser>) => {
    setUser(prev => prev ? { ...prev, ...updates } as UserMe | AuthUser : null);
  }, []);

  // ── Hydration au montage ────────────────────────────────────────────────────
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    authApi
      .refresh()
      .then(({ user: refreshedUser, access_token }) => {
        setAuth(refreshedUser, access_token);
      })
      .catch(() => {
        clearAuth();
      })
      .finally(() => {
        setIsHydrated(true);
      });
  }, [setAuth, clearAuth]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const login = useCallback(
    async (payload: LoginPayload) => {
      setLoading(true);
      try {
        const { user: newUser, access_token } = await authApi.login(payload);
        setAuth(newUser, access_token);

        if (!newUser.isOnboarded) {
          router.push(`/onboarding/step-1`);
        } else {
          router.push('/dashboard');
        }
      } finally {
        setLoading(false);
      }
    },
    [setAuth, router],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      setLoading(true);
      try {
        const { user: newUser, access_token } = await authApi.register(payload);
        setAuth(newUser, access_token);
        router.push('/onboarding/step-1');
      } finally {
        setLoading(false);
      }
    },
    [setAuth, router],
  );

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authApi.logout();
    } catch {
      // Même si l'appel échoue, on nettoie le client
    } finally {
      clearAuth();
      router.push('/login');
      setLoading(false);
    }
  }, [clearAuth, router]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      accessToken, 
      isAuthenticated, 
      isHydrated, 
      login, 
      register, 
      logout,
      updateUserInContext, 
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}