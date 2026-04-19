/**
 * components/dashboard/DashboardSkeleton.tsx
 * Full-page loading skeleton for the dashboard.
 * Also exports EmptyMatches empty-state component.
 */

import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/Button';
import { Users } from 'lucide-react';
import Link from 'next/link';

// ─── Page-level skeleton ──────────────────────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-8">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        {/* Welcome */}
        <div className="mb-8 space-y-2">
          <Skeleton className="h-7 w-56 rounded-xl" />
          <Skeleton className="h-4 w-36 rounded-lg" />
        </div>

        {/* Stats row */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>

        {/* Match cards */}
        <div>
          <Skeleton className="mb-5 h-6 w-40 rounded-xl" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-2xl" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Empty matches ────────────────────────────────────────────────────────────

interface EmptyMatchesProps {
  type?: 'all' | 'perfect' | 'partial';
}

const MESSAGES = {
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
};

export function EmptyMatches({ type = 'all' }: EmptyMatchesProps) {
  const { title, body } = MESSAGES[type];

  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center mt-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
        <Users className="h-7 w-7 text-indigo-400" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-800">{title}</h3>
      <p className="mt-2 max-w-xs text-xs text-slate-500 leading-relaxed">{body}</p>
      <Button
        asChild
        size="sm"
        className="mt-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white"
      >
        <Link href="/profile">Compléter mon profil</Link>
      </Button>
    </div>
  );
}
