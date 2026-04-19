/**
 * app/(dashboard)/users/[id]/page.tsx
 *
 * Public profile view — shown when browsing another user.
 * Maps to GET /users/:id which returns:
 *   - Profile info, skills, reviews (last 20)
 *   - `actionButton` derived from match status (FC-02-B)
 *   - `email` only if a confirmed session exists
 *
 * TODO (onboarding):
 *   - Plug in the SessionProposalModal for `actionButton === 'propose_session'`.
 *   - Plug in the Messaging panel for `actionButton === 'write_message'`.
 */

'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { usePublicProfile } from '@/hooks/usePublicProfile';
import { ReviewList } from '@/components/profile/ReviewList';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import {
  AlertCircle,
  ArrowLeft,
  Mail,
  MapPin,
  Shield,
  Star,
  Zap,
} from 'lucide-react';

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
  expert: 'Expert',
};

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { profile, isLoading, error } = usePublicProfile(id ?? null);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F7FF]">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8 space-y-4">
          <div className="h-48 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }

  // ── Not found / error ─────────────────────────────────────────────────────
  if (error || !profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Profil introuvable ou non disponible.{' '}
            <Link href="/dashboard" className="underline font-medium">
              Retour au tableau de bord
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const offeredSkills = profile.skills.filter((s: any) => s.type === 'offered');
  const wantedSkills = profile.skills.filter((s: any) => s.type === 'wanted');

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3 sm:px-8">
          <Link
            href="/matches"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Retour
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-8">
        {/* ── Hero card ──────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.firstName}
                  className="h-24 w-24 rounded-2xl object-cover shadow ring-2 ring-white"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-indigo-100 text-4xl font-bold text-indigo-600 shadow">
                  {profile.firstName[0]}
                </div>
              )}
              {profile.hasBadgeFiable && (
                <span
                  title="Badge Fiable"
                  className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 shadow-md"
                >
                  <Shield className="h-4 w-4 text-white" />
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-slate-900">
                {profile.firstName} {profile.lastName}
              </h1>
              {profile.city && (
                <p className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
                  <MapPin className="h-3.5 w-3.5" /> {profile.city}
                </p>
              )}

              {/* Ratings */}
              {profile.avgRating != null && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="flex items-center gap-1 rounded-full bg-amber-50 border border-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {profile.avgRating.toFixed(1)} · {profile.sessionsCompleted} session
                    {profile.sessionsCompleted !== 1 ? 's' : ''}
                  </span>
                  {profile.avgPedagogy != null && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                      Pédagogie {profile.avgPedagogy.toFixed(1)}
                    </span>
                  )}
                  {profile.avgPunctuality != null && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                      Ponctualité {profile.avgPunctuality.toFixed(1)}
                    </span>
                  )}
                </div>
              )}

              {/* Contact (only if confirmed session) */}
              {profile.email && (
                <a
                  href={`mailto:${profile.email}`}
                  className="mt-3 flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-500"
                >
                  <Mail className="h-3.5 w-3.5" /> {profile.email}
                </a>
              )}
            </div>

            {/* CTA button */}
            <div className="sm:self-start">
              <ActionButton type={profile.actionButton} userId={profile.id} />
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="mt-5 text-sm leading-relaxed text-slate-600 border-t border-slate-100 pt-5">
              {profile.bio}
            </p>
          )}
        </div>

        {/* ── Skills ───────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <h2 className="text-base font-semibold text-slate-900">Compétences</h2>

          {offeredSkills.length > 0 && (
            <div>
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Enseigne
              </p>
              <div className="flex flex-wrap gap-2">
                {offeredSkills.map((s: any) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700"
                  >
                    {s.skillCatalog.name}
                    <span className="opacity-60">
                      · {LEVEL_LABELS[s.level] ?? s.level}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {offeredSkills.length > 0 && wantedSkills.length > 0 && (
            <Separator />
          )}

          {wantedSkills.length > 0 && (
            <div>
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Apprend
              </p>
              <div className="flex flex-wrap gap-2">
                {wantedSkills.map((s: any) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700"
                  >
                    {s.skillCatalog.name}
                    <span className="opacity-60">
                      · {LEVEL_LABELS[s.level] ?? s.level}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {offeredSkills.length === 0 && wantedSkills.length === 0 && (
            <p className="text-sm text-slate-400">Aucune compétence renseignée.</p>
          )}
        </div>

        {/* ── Reviews ──────────────────────────────────────────────────── */}
        {profile.reviewsReceived.length > 0 && (
          <ReviewList reviews={profile.reviewsReceived} />
        )}
      </main>
    </div>
  );
}

// ─── Action button ────────────────────────────────────────────────────────────

function ActionButton({
  type,
  userId,
}: {
  type: string;
  userId: string;
}) {
  if (type === 'propose_session') {
    return (
      // TODO (onboarding): open <SessionProposalModal userId={userId} />
      <Button
        className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white gap-2"
        size="sm"
      >
        <Zap className="h-3.5 w-3.5" /> Proposer une session
      </Button>
    );
  }

  if (type === 'write_message') {
    return (
      // TODO (onboarding): open messaging panel or navigate to /messages?userId=
      <Button variant="outline" className="rounded-xl gap-2" size="sm" asChild>
        <Link href={`/messages?userId=${userId}`}>
          <Mail className="h-3.5 w-3.5" /> Écrire un message
        </Link>
      </Button>
    );
  }

  if (type === 'view_session') {
    return (
      <Button variant="outline" className="rounded-xl" size="sm" asChild>
        <Link href="/sessions">Voir la session</Link>
      </Button>
    );
  }

  // 'none' — no active match
  return null;
}
