'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { matchesApi, Match, SkillCategory, SkillLevel, MatchType } from '@/lib/api';

import { ProposeSessionModal } from '@/components/matches/propose-modal';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: { value: SkillCategory; label: string; emoji: string }[] = [
  { value: 'tech',      label: 'Tech',      emoji: '💻' },
  { value: 'languages', label: 'Langues',   emoji: '🌍' },
  { value: 'arts',      label: 'Arts',      emoji: '🎨' },
  { value: 'business',  label: 'Business',  emoji: '📊' },
  { value: 'sport',     label: 'Sport',     emoji: '⚽' },
  { value: 'cooking',   label: 'Cuisine',   emoji: '🍳' },
  { value: 'other',     label: 'Autre',     emoji: '✨' },
];

const SORT_OPTIONS = [
  { value: 'score',    label: 'Compatibilité' },
  { value: 'rating',   label: 'Note' },
  { value: 'sessions', label: 'Sessions' },
] as const;

// ─── Match card ───────────────────────────────────────────────────────────────

function MatchCard({ match, onPropose }: { match: Match; onPropose: (m: Match) => void }) {
  const u = match.otherUser;
  const initials = [u?.firstName?.[0] || '?', u?.lastName?.[0] || ''].join('').toUpperCase();
  const isPerfect = match.type === 'perfect';

  const compatColor =
    match.score >= 70 ? 'text-green-600 bg-green-50 border-green-200'
    : match.score >= 50 ? 'text-blue-600 bg-blue-50 border-blue-200'
    : 'text-orange-600 bg-orange-50 border-orange-200';

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-sm transition-all">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0 border-2 border-primary/20 transition-colors">
          {u.avatarUrl
            ? <img src={u.avatarUrl} alt={u.firstName} className="w-full h-full object-cover" />
            : <span className="text-lg font-bold text-primary">{initials}</span>
          }
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold">
              {u.firstName} {u.lastName}
            </h3>
            {u.hasBadgeFiable && (
              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">🏅 Fiable</span>
            )}
            {isPerfect
              ? <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">⇄ Match parfait</span>
              : <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">Match partiel</span>
            }
          </div>

          {u.city && <p className="text-xs text-muted-foreground mt-0.5">📍 {u.city}</p>}

          {u.avgRating && (
            <p className="text-xs text-muted-foreground mt-0.5">
              ⭐ {Number(u.avgRating).toFixed(1)} · {u.sessionsCompleted} session{u.sessionsCompleted !== 1 ? 's' : ''}
            </p>
          )}

          {/* Matched pairs */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {match.matchedPairs.map((pair, i) => (
              <span key={i} className="text-xs bg-primary/8 text-primary px-2 py-1 rounded-lg border border-primary/10">
                {pair.offeredByA?.name ?? '?'} ⇄ {pair.offeredByB?.name ?? '?'}
              </span>
            ))}
          </div>

          {/* Partial match hint */}
          {!isPerfect && match.matchedPairs.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1.5 italic">
              Peut t'apprendre {match.matchedPairs[0].offeredByB?.name}. Propose-lui ce que tu sais faire !
            </p>
          )}
        </div>

        {/* Score + action */}
        <div className="shrink-0 flex flex-col items-end gap-2">
          <span className={`text-sm font-bold px-2.5 py-1 rounded-full border ${compatColor}`}>
            {match.score}%
          </span>
          <span className="text-xs text-muted-foreground">{match.label}</span>
          <button
            onClick={() => onPropose(match)}
            className={`mt-1 text-xs px-4 py-2 rounded-lg font-medium transition-all transform active:scale-95 ${
              isPerfect
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/10'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {isPerfect ? 'Proposer' : 'Écrire'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MatchesPage() {
  const [matches,   setMatches]   = useState<Match[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [page,      setPage]      = useState(1);
  const [total,     setTotal]     = useState(0);

  // Modal state
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [typeFilter,     setTypeFilter]     = useState<MatchType | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<SkillCategory | ''>('');
  const [sort,           setSort]           = useState<'score' | 'rating' | 'sessions'>('score');

  const LIMIT = 20;

  const fetchMatches = useCallback(() => {
    setLoading(true);
    matchesApi.list({
      type:     typeFilter     || undefined,
      category: categoryFilter || undefined,
      sort,
      page,
      limit: LIMIT,
    })
      .then((res) => {
        setMatches(res.data);
        setTotal(res.total);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [typeFilter, categoryFilter, sort, page]);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [typeFilter, categoryFilter, sort]);

  const handlePropose = (match: Match) => {
    setSelectedMatch(match);
    setIsModalOpen(true);
  };

  const perfectMatches  = matches.filter((m) => m.type === 'perfect');
  const partialMatches  = matches.filter((m) => m.type === 'partial');
  const totalPages      = Math.ceil(total / LIMIT);

  return (
    <div className="max-w-3xl space-y-5">

      <div>
        <h1 className="text-2xl font-bold">Mes matchs</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {total > 0 ? `${total} utilisateur${total > 1 ? 's' : ''} compatible${total > 1 ? 's' : ''} trouvé${total > 1 ? 's' : ''}` : 'Aucun match'}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {/* Type filter */}
          <button
            onClick={() => setTypeFilter('')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${typeFilter === '' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary'}`}
          >
            Tous
          </button>
          <button
            onClick={() => setTypeFilter('perfect')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${typeFilter === 'perfect' ? 'bg-green-500 text-white border-green-500' : 'border-border hover:border-green-400'}`}
          >
            ⇄ Parfaits uniquement
          </button>
          <button
            onClick={() => setTypeFilter('partial')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${typeFilter === 'partial' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary'}`}
          >
            Partiels uniquement
          </button>
        </div>

        {/* Category */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCategoryFilter('')}
            className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${categoryFilter === '' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary'}`}
          >
            Toutes catégories
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategoryFilter(categoryFilter === c.value ? '' : c.value)}
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${categoryFilter === c.value ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary'}`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground shrink-0">Trier par :</span>
          <div className="flex gap-1.5">
            {SORT_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => setSort(s.value)}
                className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${sort === s.value ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-destructive mb-2">{error}</p>
          <button onClick={fetchMatches} className="text-sm text-primary hover:underline">Réessayer</button>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-semibold mb-1">Aucun match trouvé</p>
          <p className="text-muted-foreground text-sm mb-4">
            {typeFilter || categoryFilter
              ? 'Essayez d\'élargir vos filtres.'
              : 'Enrichissez votre profil avec plus de compétences !'
            }
          </p>
          <Link href="/profile" className="text-sm text-primary hover:underline">
            Améliorer mon profil →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Perfect matches */}
          {perfectMatches.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">⇄ Matchs parfaits</h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{perfectMatches.length}</span>
              </div>
              {perfectMatches.map((m) => <MatchCard key={m.id} match={m} onPropose={handlePropose} />)}
            </div>
          )}

          {/* Partial matches */}
          {partialMatches.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">Matchs partiels</h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{partialMatches.length}</span>
              </div>
              {partialMatches.map((m) => <MatchCard key={m.id} match={m} onPropose={handlePropose} />)}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-border disabled:opacity-40 hover:bg-muted transition-colors"
              >
                ← Précédent
              </button>
              <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-border disabled:opacity-40 hover:bg-muted transition-colors"
              >
                Suivant →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Proposal Modal */}
      <ProposeSessionModal
        match={selectedMatch}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchMatches}
      />
    </div>
  );
}

