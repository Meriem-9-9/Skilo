'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  usersApi, reviewsApi,
  User, UserSkill, Review,
} from '@/lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LEVEL_LABELS: Record<string, string> = {
  beginner:     'Débutant',
  intermediate: 'Intermédiaire',
  advanced:     'Avancé',
};

const LEVEL_COLORS: Record<string, string> = {
  beginner:     'bg-green-100 text-green-700',
  intermediate: 'bg-blue-100 text-blue-700',
  advanced:     'bg-purple-100 text-purple-700',
};

const CATEGORY_EMOJIS: Record<string, string> = {
  tech: '💻', languages: '🌍', arts: '🎨',
  business: '📊', sport: '⚽', cooking: '🍳', other: '✨',
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-400">
      {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── Skill badge ──────────────────────────────────────────────────────────────

function SkillBadge({ skill }: { skill: UserSkill }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-sm">
      <span className="text-base">{CATEGORY_EMOJIS[skill.skillCatalog.category] ?? '✨'}</span>
      <span className="font-medium">{skill.skillCatalog.name}</span>
      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ml-auto ${LEVEL_COLORS[skill.level]}`}>
        {LEVEL_LABELS[skill.level]}
      </span>
    </div>
  );
}

// ─── Review card ──────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="p-4 border border-border rounded-xl bg-card space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            {review.reviewer.firstName[0]}{review.reviewer.lastName[0]}
          </div>
          <div>
            <p className="text-sm font-medium">{review.reviewer.firstName} {review.reviewer.lastName}</p>
            <p className="text-xs text-muted-foreground">{formatDate(review.submittedAt)}</p>
          </div>
        </div>
        <div className="text-right">
          <Stars rating={review.rating} />
          {review.skillCatalog && (
            <p className="text-xs text-muted-foreground mt-0.5">{review.skillCatalog.name}</p>
          )}
        </div>
      </div>

      {/* Sub-ratings */}
      {(review.ratingPedagogy || review.ratingPunctuality || review.ratingCommunication) && (
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground border-t border-border pt-2">
          {review.ratingPedagogy && (
            <span>Pédagogie: <span className="text-foreground font-medium">{review.ratingPedagogy}/5</span></span>
          )}
          {review.ratingPunctuality && (
            <span>Ponctualité: <span className="text-foreground font-medium">{review.ratingPunctuality}/5</span></span>
          )}
          {review.ratingCommunication && (
            <span>Communication: <span className="text-foreground font-medium">{review.ratingCommunication}/5</span></span>
          )}
        </div>
      )}

      {review.comment && (
        <p className="text-sm text-muted-foreground">{review.comment}</p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type PublicUser = User & {
  skills: UserSkill[];
  reviews: Review[];
  actionButton: 'propose_session' | 'write_message' | 'view_session' | 'none';
};

export default function PublicProfilePage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();

  const [user,    setUser]    = useState<PublicUser | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      usersApi.publicProfile(id),
      reviewsApi.forUser(id),
    ])
      .then(([userData, reviewData]) => {
        setUser(userData);
        setReviews(reviewData);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-2xl space-y-4 animate-pulse">
        <div className="h-8 w-32 bg-muted rounded" />
        <div className="h-48 bg-muted rounded-xl" />
        <div className="h-32 bg-muted rounded-xl" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center py-16 max-w-md mx-auto">
        <p className="text-4xl mb-4">🔍</p>
        <p className="font-semibold mb-1">Profil introuvable</p>
        <p className="text-muted-foreground text-sm mb-4">{error ?? 'Ce profil n\'existe pas ou n\'est pas disponible.'}</p>
        <button onClick={() => router.back()} className="text-sm text-primary hover:underline">
          ← Retour
        </button>
      </div>
    );
  }

  const offeredSkills = user.skills.filter((s) => s.type === 'offered');
  const wantedSkills  = user.skills.filter((s) => s.type === 'wanted');
  const initials      = [user.firstName[0], user.lastName[0]].join('').toUpperCase();

  const ACTION_BUTTONS = {
    propose_session: {
      label: '📅 Proposer une session',
      color: 'bg-primary text-primary-foreground hover:bg-primary/90',
    },
    write_message: {
      label: '✉️ Lui écrire',
      color: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    },
    view_session: {
      label: '👁 Voir la session',
      color: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    },
    none: null,
  };

  const btn = ACTION_BUTTONS[user.actionButton];

  return (
    <div className="max-w-2xl space-y-6">

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Retour
      </button>

      {/* Header card */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0 border-2 border-primary/20">
            {user.avatarUrl
              ? <img src={user.avatarUrl} alt={user.firstName} className="w-full h-full object-cover" />
              : <span className="text-2xl font-bold text-primary">{initials}</span>
            }
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{user.firstName} {user.lastName}</h1>
              {user.hasBadgeFiable && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  🏅 Fiable
                </span>
              )}
            </div>

            {user.city && (
              <p className="text-sm text-muted-foreground mt-0.5">📍 {user.city}</p>
            )}

            {/* Rating */}
            {user.avgRating ? (
              <div className="flex items-center gap-2 mt-1.5">
                <Stars rating={Number(user.avgRating)} />
                <span className="text-sm font-medium">{Number(user.avgRating).toFixed(1)}/5</span>
                <span className="text-xs text-muted-foreground">· {user.sessionsCompleted} session{user.sessionsCompleted !== 1 ? 's' : ''}</span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-1.5">Pas encore évalué · {user.sessionsCompleted} session{user.sessionsCompleted !== 1 ? 's' : ''}</p>
            )}

            {/* Sub-ratings */}
            {(user.avgPedagogy || user.avgPunctuality || user.avgCommunication) && (
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                {user.avgPedagogy     && <span>Pédagogie <strong className="text-foreground">{Number(user.avgPedagogy).toFixed(1)}</strong></span>}
                {user.avgPunctuality  && <span>Ponctualité <strong className="text-foreground">{Number(user.avgPunctuality).toFixed(1)}</strong></span>}
                {user.avgCommunication && <span>Communication <strong className="text-foreground">{Number(user.avgCommunication).toFixed(1)}</strong></span>}
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="mt-4 text-sm text-muted-foreground border-t border-border pt-4">{user.bio}</p>
        )}

        {/* Action button */}
        {btn && (
          <div className="mt-4 border-t border-border pt-4">
            <button
              onClick={() => {
                if (user.actionButton === 'propose_session') {
                  router.push(`/dashboard/matches?propose=${user.id}`);
                } else if (user.actionButton === 'view_session') {
                  router.push('/dashboard/sessions');
                }
              }}
              className={`w-full py-2.5 rounded-xl font-medium text-sm transition-colors ${btn.color}`}
            >
              {btn.label}
            </button>
          </div>
        )}
      </div>

      {/* Skills offered */}
      {offeredSkills.length > 0 && (
        <section className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-3">🎓 Peut enseigner</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {offeredSkills.map((s) => <SkillBadge key={s.id} skill={s} />)}
          </div>
        </section>
      )}

      {/* Skills wanted */}
      {wantedSkills.length > 0 && (
        <section className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-3">📚 Cherche à apprendre</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {wantedSkills.map((s) => <SkillBadge key={s.id} skill={s} />)}
          </div>
        </section>
      )}

      {/* Reviews */}
      <section className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold mb-3">
          ⭐ Avis reçus
          <span className="ml-2 text-muted-foreground font-normal">({reviews.length})</span>
        </h2>

        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Aucun avis pour l'instant.
          </p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
          </div>
        )}
      </section>

    </div>
  );
}
