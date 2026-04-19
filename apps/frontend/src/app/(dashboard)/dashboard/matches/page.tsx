/**
 * app/(dashboard)/matches/page.tsx
 *
 * Full match list with filtering (all / perfect / partial) and pagination.
 * Reads from GET /matches?type=&page=&limit=
 *
 * Data:
 *   useMatches(filters) → MatchesResponse { data, meta }
 *
 * Error handling:
 *   - Filter/page changes are instant (SWR revalidates the new key).
 *   - Errors render a non-blocking alert so the filter tabs remain usable.
 *
 * TODO (onboarding):
 *   - Add a sort option (by score, by date) once the backend supports it.
 *   - Wire the "Proposer" button to <SessionProposalModal />.
 *   - Add a "city" filter query param when geolocation is implemented.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useMatches } from '@/hooks/useMatches';
import { MatchCard } from '@/components/dashboard/MatchCard';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react';

const LIMIT = 9;

export default function MatchesPage() {
  const { user } = useAuth();
  const [type, setType] = useState<'all' | 'perfect' | 'partial'>('all');
  const [page, setPage] = useState(1);

  const { matches, error, isLoading } = useMatches({
    type: type === 'all' ? undefined : type,
    page,
    limit: LIMIT,
  });

  const totalPages = matches?.meta.totalPages ?? 1;

  const handleTypeChange = (v: string) => {
    setType(v as typeof type);
    setPage(1); // reset pagination on filter change
  };

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Tableau de bord
          </Link>
          <div className="flex items-center gap-2 ml-auto">
            <Users className="h-4 w-4 text-indigo-500" />
            <h1 className="text-base font-semibold text-slate-800">Mes matchs</h1>
            {matches?.meta.total != null && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500">
                {matches.meta.total}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        <Tabs value={type} onValueChange={handleTypeChange}>
          <TabsList className="mb-6 rounded-xl bg-slate-100">
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

          {/* Non-blocking error */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Impossible de charger les matchs. Vérifiez votre connexion et réessayez.
              </AlertDescription>
            </Alert>
          )}

          <TabsContent value={type}>
            {isLoading ? (
              <MatchGridSkeleton />
            ) : !matches?.data.length ? (
              <EmptyMatchesState type={type} />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {matches.data.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      currentUserId={user?.id ?? ''}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <span className="text-sm text-slate-500">
                      Page {page} sur {totalPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function MatchGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <Skeleton key={i} className="h-56 rounded-2xl" />
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyMatchesState({ type }: { type: string }) {
  const messages = {
    all: {
      title: 'Aucun match pour l\'instant',
      body: 'Ajoutez des compétences à votre profil pour commencer à matcher avec d\'autres apprenants.',
    },
    perfect: {
      title: 'Pas encore de match parfait',
      body: 'Un match parfait se forme quand deux utilisateurs peuvent s\'enseigner mutuellement.',
    },
    partial: {
      title: 'Pas de match partiel',
      body: 'Les matchs partiels apparaissent quand un seul côté de l\'échange est possible.',
    },
  } as Record<string, { title: string; body: string }>;

  const { title, body } = messages[type] ?? messages.all;

  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
        <Users className="h-8 w-8 text-indigo-400" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-800">{title}</h3>
      <p className="mt-2 max-w-xs text-xs text-slate-500 leading-relaxed">{body}</p>
      <Button
        asChild
        className="mt-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white"
        size="sm"
      >
        <Link href="/profile">Compléter mon profil</Link>
      </Button>
    </div>
  );
}
