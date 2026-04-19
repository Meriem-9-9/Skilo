'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { sessionsApi, Session, SessionStatus } from '@/lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string }> = {
  pending:        { label: 'En attente',     color: 'bg-gray-100 text-gray-600' },
  confirmed:      { label: 'Confirmée',      color: 'bg-blue-100 text-blue-700' },
  completed:      { label: 'Terminée',       color: 'bg-green-100 text-green-700' },
  auto_completed: { label: 'Auto-complétée', color: 'bg-green-100 text-green-700' },
  cancelled:      { label: 'Annulée',        color: 'bg-red-100 text-red-700' },
  disputed:       { label: 'Litige',         color: 'bg-orange-100 text-orange-700' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
  });
}

function Avatar({ user, size = 10 }: { user: { firstName: string; lastName: string; avatarUrl?: string }; size?: number }) {
  const initials = [user.firstName[0], user.lastName[0]].join('').toUpperCase();
  const sizeClass = `w-${size} h-${size}`;
  return (
    <div className={`${sizeClass} rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0`}>
      {user.avatarUrl
        ? <img src={user.avatarUrl} alt={user.firstName} className="w-full h-full object-cover" />
        : <span className="text-sm font-bold text-primary">{initials}</span>
      }
    </div>
  );
}

// ─── Session card ─────────────────────────────────────────────────────────────

function SessionCard({
  session, currentUserId, onAccept, onDecline, onCancel, onConfirm,
}: {
  session: Session;
  currentUserId: string;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onCancel: (id: string) => void;
  onConfirm: (id: string, happened: boolean) => void;
}) {
  const isInitiator = session.proposedBy.id === currentUserId;
  const other = isInitiator ? session.recipient : session.proposedBy;
  const cfg = STATUS_CONFIG[session.status];

  const now = new Date();
  const scheduledAt = new Date(session.scheduledAt);
  const isPast = scheduledAt < now;
  const isConfirmable = (session.status === 'confirmed') && isPast;
  const canIConfirm = isConfirmable && (isInitiator ? !session.confirmedByA : !session.confirmedByB);

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Avatar user={other} size={12} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold">{other.firstName} {other.lastName}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
              {cfg.label}
            </span>
            {!isInitiator && session.status === 'pending' && (
              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                Vous a invité
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {formatDate(session.scheduledAt)} · {session.durationMinutes} min
          </p>
        </div>
        {session.creditsUsed > 0 && (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full shrink-0">
            🪙 {session.creditsUsed} crédit{session.creditsUsed > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Skills */}
      {session.skillsExchanged?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {session.skillsExchanged.map((s, i) => (
            <span key={i} className="text-xs bg-primary/8 text-primary px-2 py-1 rounded-lg border border-primary/10">
              {s.offeredSkillName} ⇄ {s.wantedSkillName}
            </span>
          ))}
        </div>
      )}

      {/* Message */}
      {session.message && (
        <p className="text-sm text-muted-foreground italic border-l-2 border-border pl-3">
          "{session.message}"
        </p>
      )}

      {/* Meeting link */}
      {session.meetingLink && session.status === 'confirmed' && (
        <a
          href={session.meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          🔗 Rejoindre la réunion
        </a>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-1 border-t border-border">
        {/* Recipient actions on pending */}
        {!isInitiator && session.status === 'pending' && (
          <>
            <button
              onClick={() => onAccept(session.id)}
              className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              ✓ Accepter
            </button>
            <button
              onClick={() => onDecline(session.id)}
              className="flex-1 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
            >
              ✗ Refuser
            </button>
          </>
        )}

        {/* Confirm completion */}
        {canIConfirm && (
          <>
            <p className="w-full text-xs text-muted-foreground">La session a-t-elle eu lieu ?</p>
            <button
              onClick={() => onConfirm(session.id, true)}
              className="flex-1 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors"
            >
              ✓ Oui, elle a eu lieu
            </button>
            <button
              onClick={() => onConfirm(session.id, false)}
              className="flex-1 py-2 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors"
            >
              ✗ Non, annuler
            </button>
          </>
        )}

        {/* Cancel (if cancellable) */}
        {(session.status === 'pending' || session.status === 'confirmed') && (
          <button
            onClick={() => onCancel(session.id)}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors ml-auto"
          >
            Annuler la session
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SessionsPage() {
  const { user: authUser } = useAuth();

  const [tab,      setTab]      = useState<'upcoming' | 'past'>('upcoming');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [error,    setError]    = useState<string | null>(null);
  const [toast,    setToast]    = useState<string | null>(null);

  const LIMIT = 10;

  const fetchSessions = useCallback(() => {
    setLoading(true);
    sessionsApi.list({ tab, page, limit: LIMIT })
      .then((res) => { setSessions(res.data); setTotal(res.total); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tab, page]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);
  useEffect(() => { setPage(1); }, [tab]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleAccept(id: string) {
    try {
      await sessionsApi.accept(id);
      fetchSessions();
      showToast('Session acceptée !');
    } catch (e) { showToast(e instanceof Error ? e.message : 'Erreur'); }
  }

  async function handleDecline(id: string) {
    try {
      await sessionsApi.decline(id);
      fetchSessions();
      showToast('Session refusée.');
    } catch (e) { showToast(e instanceof Error ? e.message : 'Erreur'); }
  }

  async function handleCancel(id: string) {
    if (!confirm('Annuler cette session ?')) return;
    try {
      await sessionsApi.cancel(id);
      fetchSessions();
      showToast('Session annulée.');
    } catch (e) { showToast(e instanceof Error ? e.message : 'Erreur'); }
  }

  async function handleConfirm(id: string, happened: boolean) {
    try {
      await sessionsApi.confirm(id, happened);
      fetchSessions();
      showToast(happened ? 'Confirmation enregistrée !' : 'Réponse enregistrée.');
    } catch (e) { showToast(e instanceof Error ? e.message : 'Erreur'); }
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="max-w-2xl space-y-5">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-card border border-border rounded-xl px-4 py-3 shadow-lg text-sm z-50">
          {toast}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold">Mes sessions</h1>
        <p className="text-muted-foreground text-sm mt-1">Gérez vos échanges de compétences.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        {(['upcoming', 'past'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t === 'upcoming' ? '📅 À venir' : '📂 Passées'}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-destructive mb-2">{error}</p>
          <button onClick={fetchSessions} className="text-sm text-primary hover:underline">Réessayer</button>
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <p className="text-4xl mb-3">{tab === 'upcoming' ? '📅' : '📂'}</p>
          <p className="font-semibold mb-1">
            {tab === 'upcoming' ? 'Aucune session à venir' : 'Aucune session passée'}
          </p>
          <p className="text-muted-foreground text-sm">
            {tab === 'upcoming' ? 'Proposez une session à l\'un de vos matchs !' : 'Vos sessions passées apparaîtront ici.'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {sessions.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                currentUserId={authUser!.id}
                onAccept={handleAccept}
                onDecline={handleDecline}
                onCancel={handleCancel}
                onConfirm={handleConfirm}
              />
            ))}
          </div>

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
        </>
      )}
    </div>
  );
}
