/**
 * app/(dashboard)/dashboard/page.tsx
 *
 * Dashboard — shows the user's:
 *   • Profile strength widget
 *   • Credit balance
 *   • Top matches (perfect first, then partial)
 *   • Quick actions
 *
 * Data strategy:
 *   - useMe()     → GET /users/me       (credits, strength, skills)
 *   - useMatches()→ GET /matches        (paginated, default limit=6)
 *
 * Error handling:
 *   - Each data source errors independently; the UI degrades gracefully.
 *   - All HTTP errors are already logged by api-client.ts interceptors.
 *
 * TODO (onboarding):
 *   - Add a <Suspense> boundary once Next 14 server components are wired in.
 *   - Wire up the "Propose a session" CTA — needs a SessionModal component.
 *   - Add skeleton loaders for the match cards (see DashboardSkeleton below).
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useMatches } from '@/hooks/useMatches';
import { ProfileStrengthCard } from '@/components/dashboard/ProfileStrengthCard';
import { CreditsCard } from '@/components/dashboard/CreditsCard';
import { MatchCard } from '@/components/dashboard/MatchCard';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
// import { EmptyMatches } from '@/components/dashboard/EmptyMatches';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import {
  Sparkles,
  Users,
  AlertCircle,
  ChevronRight,
  Trophy,
} from 'lucide-react';

import type { UserMe } from '@/types/api';

export default function DashboardPage() {
  const { user, loading: userLoading, isAuthenticated } = useAuth();
  const userMe = user as UserMe | null;
  const userError = !userLoading && !user && !isAuthenticated; // Natively derive error
  const [matchType, setMatchType] = useState<'all' | 'perfect' | 'partial'>('all');

  const {
    matches,
    error: matchError,
    isLoading: matchLoading,
  } = useMatches({
    type: matchType === 'all' ? undefined : matchType,
    limit: 6,
  });

  // ── Loading state ─────────────────────────────────────────────────────────
  if (userLoading) return <DashboardSkeleton />;

  // ── Critical auth error (user not found at all) ───────────────────────────
  if (userError && !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Impossible de charger votre profil. Veuillez{' '}
            <Link href="/login" className="underline font-medium">
              vous reconnecter
            </Link>
            .
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const perfectCount = matches?.data.filter((m) => m.type === 'perfect').length ?? 0;

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-800">
              Skilo
            </span>
          </div>

          <nav className="hidden items-center gap-6 sm:flex">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-indigo-600"
            >
              Tableau de bord
            </Link>
            <Link
              href="/matches"
              className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              Mes matchs
            </Link>
            <Link
              href="/sessions"
              className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              Sessions
            </Link>
          </nav>

          <Link href="/profile">
            <div className="flex items-center gap-2.5 rounded-full border border-slate-200 px-3 py-1.5 hover:border-indigo-300 transition-colors">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.firstName}
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                  {user?.firstName?.[0]}
                </div>
              )}
              <span className="text-sm font-medium text-slate-700">
                {user?.firstName}
              </span>
            </div>
          </Link>
        </div>
      </header>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        {/* Welcome row */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Bonjour, {user?.firstName} 👋
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>

          {perfectCount > 0 && (
            <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2">
              <Trophy className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">
                {perfectCount} match{perfectCount > 1 ? 's' : ''} parfait
                {perfectCount > 1 ? 's' : ''} !
              </span>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CreditsCard
            balance={userMe?.creditBalance ?? 0}
            reserved={userMe?.creditReserved ?? 0}
          />
          <ProfileStrengthCard strength={userMe?.profileStrength} />

          {/* Sessions completed */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
              Sessions
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
              {userMe?.sessionsCompleted ?? 0}
            </p>
            <p className="mt-1 text-xs text-slate-500">complétées</p>
          </div>

          {/* Rating */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
              Note moyenne
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
              {userMe?.avgRating ? userMe.avgRating.toFixed(1) : '—'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {userMe?.avgRating ? '⭐ sur 5' : 'Pas encore noté'}
            </p>
          </div>
        </div>

        {/* Matches section */}
        <section>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-slate-900">
                Mes matchs
              </h2>
              {matches?.meta.total != null && (
                <Badge variant="secondary" className="rounded-full px-2.5">
                  {matches.meta.total}
                </Badge>
              )}
            </div>

            <Link
              href="/matches"
              className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              Voir tous <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Filter tabs */}
          <Tabs
            value={matchType}
            onValueChange={(v) => setMatchType(v as typeof matchType)}
            className="mb-5"
          >
            <TabsList className="rounded-xl bg-slate-100">
              <TabsTrigger value="all" className="rounded-lg text-sm">
                Tous
              </TabsTrigger>
              <TabsTrigger value="perfect" className="rounded-lg text-sm">
                Parfaits ✨
              </TabsTrigger>
              <TabsTrigger value="partial" className="rounded-lg text-sm">
                Partiels
              </TabsTrigger>
            </TabsList>

            {/* Match error banner (non-blocking) */}
            {matchError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Impossible de charger les matchs. Réessayez dans quelques
                  instants.
                </AlertDescription>
              </Alert>
            )}

            <TabsContent value={matchType} className="mt-0">
              {matchLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-52 animate-pulse rounded-2xl bg-slate-100"
                    />
                  ))}
                </div>
              ) : !matches?.data.length ? (
                <div></div>
                // <EmptyMatches type={matchType} />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
                  {matches.data.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      currentUserId={user!.id}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
}
