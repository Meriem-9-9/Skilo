// src/hooks/useAuthGuard.ts
'use client';

// Hook utilisé dans les layouts clients pour rediriger après hydration.
// Le middleware gère la protection initiale (cookie présent ?).
// Ce hook gère le cas où le refresh a échoué malgré le cookie
// (token révoqué, compte désactivé…).

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';

interface Options {
  /** Redirection si NON connecté (défaut : '/login') */
  redirectTo?: string;
  /** Redirection si DÉJÀ connecté (pour les pages /login, /register) */
  redirectIfAuth?: string;
}

export function useAuthGuard({
  redirectTo = '/login',
  redirectIfAuth,
}: Options = {}) {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAuthStore();

  useEffect(() => {
    // Attend que l'AuthProvider ait terminé le refresh au boot
    if (!isHydrated) return;

    if (!isAuthenticated && redirectTo) {
      router.replace(redirectTo);
    }

    if (isAuthenticated && redirectIfAuth) {
      router.replace(redirectIfAuth);
    }
  }, [isAuthenticated, isHydrated, redirectTo, redirectIfAuth, router]);

  return { isAuthenticated, isHydrated };
}