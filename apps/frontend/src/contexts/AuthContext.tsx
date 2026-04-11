// src/contexts/AuthContext.tsx
'use client';

// Ce contexte :
// 1. Tente un refresh silencieux au démarrage de l'app (hydration)
//    → Si le cookie refresh_token existe, l'utilisateur est reconnecté sans action de sa part.
// 2. Expose les actions login / register / logout aux composants.
// 3. Synchronise le store Zustand (source de vérité pour l'access token).

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
import { useAuthStore } from '@/lib/store/auth.store';
import type { LoginPayload, RegisterPayload } from '@/types/auth.types';

// ─── Forme du contexte ────────────────────────────────────────────────────────
interface AuthContextValue {
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setAuth, clearAuth, setHydrated } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Évite un double appel en StrictMode React
  const hydrated = useRef(false);

  // ── Hydration au montage ────────────────────────────────────────────────────
  // Tente de récupérer un access token via le cookie refresh_token.
  // Si le cookie est absent / expiré, on passe directement à isHydrated = true
  // pour que le middleware puisse rediriger vers /login.
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    authApi
      .refresh()
      .then(({ user, access_token }) => {
        setAuth(user, access_token);
      })
      .catch(() => {
        // Pas de cookie valide → utilisateur non connecté, c'est normal
        clearAuth();
      })
      .finally(() => {
        setHydrated(true);
      });
  }, [setAuth, clearAuth, setHydrated]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const login = useCallback(
    async (payload: LoginPayload) => {
      setLoading(true);
      try {
        const { user, access_token } = await authApi.login(payload);
        setAuth(user, access_token);

        // Redirection selon état d'onboarding
        if (!user.isOnboarded) {
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
        const { user, access_token } = await authApi.register(payload);
        setAuth(user, access_token);
        // Nouvel utilisateur → toujours vers l'onboarding étape 1
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
    <AuthContext.Provider value={{ login, register, logout, loading }}>
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