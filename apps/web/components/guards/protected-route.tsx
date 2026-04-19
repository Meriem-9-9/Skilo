'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If true, user must also be onboarded. Defaults to false. */
  requireOnboarded?: boolean;
}

/**
 * Client-side guard.
 * - Not authenticated  → /login
 * - Authenticated but not onboarded and requireOnboarded=true → /onboarding
 * Shows nothing (null) while the context is loading to avoid flicker.
 */
export function ProtectedRoute({ children, requireOnboarded = false }: ProtectedRouteProps) {
  const { isAuthenticated, isOnboarded, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (requireOnboarded && !isOnboarded) {
      router.replace('/onboarding');
    }
  }, [isLoading, isAuthenticated, isOnboarded, requireOnboarded, router]);

  // While loading or about to redirect, render nothing
  if (isLoading) return null;
  if (!isAuthenticated) return null;
  if (requireOnboarded && !isOnboarded) return null;

  return <>{children}</>;
}
