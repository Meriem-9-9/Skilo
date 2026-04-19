'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import {
  usersApi, matchesApi, sessionsApi, creditsApi,
  User, UserSkill, Match, Session, CreditBalance,
} from '@/lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}

const SESSION_COLORS: Record<string, string> = {
  pending:        'bg-gray-100 text-gray-600',
  confirmed:      'bg-blue-100 text-blue-700',
  completed:      'bg-green-100 text-green-700',
  auto_completed: 'bg-green-100 text-green-700',
  cancelled:      'bg-red-100 text-red-700',
  disputed:       'bg-orange-100 text-orange-700',
};

const SESSION_LABELS: Record<string, string> = {
  pending:        'En attente',
  confirmed:      'Confirmée',
  completed:      'Terminée',
  auto_completed: 'Auto-complétée',
  cancelled:      'Annulée',
  disputed:       'Litige',
};

// ─── Profile strength bar ─────────────────────────────────────────────────────

function ProfileStrengthBar({ score }: { score: number }) {
  const color = score >= 71 ? 'bg-green-500' : score >= 41 ? 'bg-amber-500' : 'bg-red-500';
  const label = score >= 71 ? 'Profil complet' : score >= 41 ? 'Profil partiel' : 'Profil incomplet';

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Force du profil</h3>
        <span className="text-sm font-bold">{score}/100</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      {score < 100 && (
        <Link
          href="/dashboard/profile"
          className="mt-3 inline-flex items-center text-xs text-primary hover:underline font-medium"
        >
          Améliorer mon profil →
        </Link>
      )}
    </div>
  );
}

// ─── Stats grid ───────────────────────────────────────────────────────────────

function StatsGrid({ user, credits }: { user: User & { skills: UserSkill[] }; credits: CreditBalance | null }) {
  const stats = [
    {
      label: 'Crédits disponibles',
      value: credits ? `${credits.available}` : '…',
      sub:   credits?.reserved ? `+ ${credits.reserved} réservés` : 'sur 20 max',
      icon:  '🪙',
      color: 'text-amber-600',
    },
    {
      label: 'Sessions réalisées',
      value: String(user.sessionsCompleted),
      sub:   user.sessionsCompleted === 1 ? 'échange' : 'échanges',
      icon:  '📅',
      color: 'text-blue-600',
    },
    {
      label: 'Note moyenne',
      value: user.avgRating ? `${Number(user.avgRating).toFixed(1)}/5` : '—',
      sub:   user.avgRating ? '⭐'.repeat(Math.round(Number(user.avgRating))) : 'Pas encore évalué',
      icon:  '⭐',
      color: 'text-yellow-600',
    },
    {
      label: 'Compétences',
      value: String(user.skills.length),
      sub:   `${user.skills.filter((s) => s.type === 'offered').length} offertes · ${user.skills.filter((s) => s.type === 'wanted').length} recherchées`,
      icon:  '🎓',
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{s.icon}</span>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
          <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Match card (compact) ─────────────────────────────────────────────────────

function MatchCardCompact({ match }: { match: Match }) {
  const u = match.otherUser;
  const initials = [u.firstName[0], u.lastName[0]].join('').toUpperCase();

  const compatColor =
    match.label.includes('Très')       ? 'text-green-600 bg-green-50 border-green-200'
    : match.label.includes('Compatible') ? 'text-blue-600 bg-blue-50 border-blue-200'
    : 'text-orange-600 bg-orange-50 border-orange-200';

  return (
    <Link
      href={`/dashboard/users/${u.id}`}
      className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/30 hover:shadow-sm transition-all group"
    >
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0 border border-primary/20">
        {u.avatarUrl
          ? <img src={u.avatarUrl} alt={u.firstName} className="w-full h-full object-cover" />
          : <span className="text-sm font-bold text-primary">{initials}</span>
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold">
            {u.firstName} {u.lastName}
          </p>
          {u.hasBadgeFiable && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">🏅 Fiable</span>}
          {match.type === 'perfect' && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">⇄ Parfait</span>}
        </div>
        {u.city && <p className="text-xs text-muted-foreground">📍 {u.city}</p>}
        <div className="flex flex-wrap gap-1 mt-1.5">
          {match.matchedPairs.slice(0, 2).map((pair, i) => (
            <span key={i} className="text-xs bg-primary/8 text-primary px-1.5 py-0.5 rounded">
              {pair.offeredByA?.name} ⇄ {pair.offeredByB?.name}
            </span>
          ))}
          {match.matchedPairs.length > 2 && (
            <span className="text-xs text-muted-foreground">+{match.matchedPairs.length - 2}</span>
          )}
        </div>
      </div>

      {/* Score */}
      <div className="shrink-0 text-right">
        <span className={`text-xs font-medium px-2 py-1 rounded-full border ${compatColor}`}>
          {match.score}%
        </span>
        {u.avgRating && (
          <p className="text-xs text-muted-foreground mt-1">⭐ {Number(u.avgRating).toFixed(1)}</p>
        )}
      </div>
    </Link>
  );
}

// ─── Session row ──────────────────────────────────────────────────────────────

function SessionRow({ session, currentUserId }: { session: Session; currentUserId: string }) {
  const other = session.proposedBy.id === currentUserId ? session.recipient : session.proposedBy;
  const initials = [other.firstName[0], other.lastName[0]].join('').toUpperCase();

  return (
    <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0 border border-primary/20">
        {other.avatarUrl
          ? <img src={other.avatarUrl} alt={other.firstName} className="w-full h-full object-cover" />
          : <span className="text-sm font-bold text-primary">{initials}</span>
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{other.firstName} {other.lastName}</p>
        <p className="text-xs text-muted-foreground">{formatDate(session.scheduledAt)} · {session.durationMinutes} min</p>
        {session.skillsExchanged?.length > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {session.skillsExchanged[0].offeredSkillName} ⇄ {session.skillsExchanged[0].wantedSkillName}
          </p>
        )}
      </div>

      {/* Status */}
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${SESSION_COLORS[session.status]}`}>
        {SESSION_LABELS[session.status]}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user: authUser } = useAuth();

  const [profile,  setProfile]  = useState<(User & { skills: UserSkill[] }) | null>(null);
  const [matches,  setMatches]  = useState<Match[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [credits,  setCredits]  = useState<CreditBalance | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    if (!authUser) return;

    Promise.all([
      usersApi.me(),
      matchesApi.list({ limit: 6, sort: 'score' }),
      sessionsApi.list({ tab: 'upcoming', limit: 5 }),
      creditsApi.balance(),
    ])
      .then(([prof, matchRes, sessRes, cred]) => {
        setProfile(prof);
        setMatches(matchRes.data);
        setSessions(sessRes.data);
        setCredits(cred);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [authUser]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-muted rounded-xl" />)}
        </div>
        <div className="h-48 bg-muted rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-destructive mb-2">{error}</p>
        <button onClick={() => window.location.reload()} className="text-sm text-primary hover:underline">
          Réessayer
        </button>
      </div>
    );
  }

  if (!profile) return null;

  const perfectMatches  = matches
  const partialMatches  = matches

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">
          Bonjour, {profile.firstName} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Voici un résumé de votre activité sur skilo.
        </p>
      </div>

      {/* Stats */}
      <StatsGrid user={profile} credits={credits} />

      {/* Profile strength */}
      <ProfileStrengthBar score={profile.profileScore} />

      {/* Matches preview */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Vos matchs récents</h2>
          <Link href="/dashboard/matches" className="text-sm text-primary hover:underline">
            Voir tous →
          </Link>
        </div>

        {matches.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-muted-foreground text-sm mb-2">
              Aucun match pour l'instant. Enrichissez votre profil !
            </p>
            <Link href="/dashboard/profile" className="text-sm text-primary hover:underline">
              Compléter mon profil →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {perfectMatches.length > 0 && (
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                ⇄ Matchs parfaits ({perfectMatches.length})
              </p>
            )}
            {perfectMatches.slice(0, 3).map((m) => (
              <MatchCardCompact key={m.id} match={m} />
            ))}

            {partialMatches.length > 0 && (
              <>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-3 mb-1">
                  Matchs partiels ({partialMatches.length})
                </p>
                {partialMatches.slice(0, 3).map((m) => (
                  <MatchCardCompact key={m.id} match={m} />
                ))}
              </>
            )}
          </div>
        )}
      </section>

      {/* Upcoming sessions */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Sessions à venir</h2>
          <Link href="/dashboard/sessions" className="text-sm text-primary hover:underline">
            Voir toutes →
          </Link>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-muted-foreground text-sm">Aucune session planifiée.</p>
            <p className="text-muted-foreground text-xs mt-1">
              Proposez une session à l'un de vos matchs !
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <SessionRow key={s.id} session={s} currentUserId={authUser!.id} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
