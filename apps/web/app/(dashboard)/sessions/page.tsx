'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { sessionsApi, Session, SessionStatus } from '@/lib/api';
import { Coins, Link as LinkIcon, Check, X, Calendar, Archive, ArrowLeft, ArrowRight, FolderClosed } from 'lucide-react';

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
  const initials = [user.firstName?.[0] || '?', user.lastName?.[0] || ''].join('').toUpperCase();
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
  const isInitiator = session.proposedBy?.id === currentUserId;
  const other = isInitiator ? session.recipient : session.proposedBy;
  if (!other) return null; // Defensive check for corrupted/incomplete data
  const cfg = STATUS_CONFIG[session.status];

  const now = new Date();
  const scheduledAt = new Date(session.scheduledAt);
  const isPast = scheduledAt < now;
  const isConfirmable = (session.status === 'confirmed') && isPast;
  const canIConfirm = isConfirmable && (isInitiator ? !session.confirmedByA : !session.confirmedByB);

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-sm hover:shadow-md transition-shadow">
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
          <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full shrink-0">
            <Coins className="w-3.5 h-3.5" /> {session.creditsUsed} crédit{session.creditsUsed > 1 ? 's' : ''}
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
      {session.meetingLink && (session.status === 'confirmed' || session.status === 'pending') && (
        <div className="flex flex-col gap-1.5 bg-muted/50 p-3 rounded-xl border border-border/50">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Lien de la réunion</span>
          <a
            href={session.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
          >
            <LinkIcon className="w-4 h-4" />
            <span className="truncate">{session.meetingLink}</span>
          </a>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-border mt-4">
        {/* Recipient actions on pending */}
        {!isInitiator && session.status === 'pending' && (
          <>
            <button
              onClick={() => onAccept(session.id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Check className="w-4 h-4" /> Accepter
            </button>
            <button
              onClick={() => onDecline(session.id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" /> Refuser
            </button>
          </>
        )}

        {/* Confirm completion */}
        {canIConfirm && (
          <div className="w-full space-y-3">
            <p className="w-full text-xs font-medium text-muted-foreground text-center">La session a-t-elle eu lieu ?</p>
            <div className="flex gap-3">
              <button
                onClick={() => onConfirm(session.id, true)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors shadow-sm"
              >
                <Check className="w-4 h-4" /> Oui, confirmée
              </button>
              <button
                onClick={() => onConfirm(session.id, false)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-red-600 bg-red-50/50 text-sm font-semibold hover:bg-red-50 transition-colors"
              >
                <X className="w-4 h-4" /> Non, annuler
              </button>
            </div>
          </div>
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
      <div className="flex gap-1 bg-muted/50 p-1 rounded-2xl w-fit border border-border/50">
        {(['upcoming', 'past'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t === 'upcoming' ? <Calendar className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
            {t === 'upcoming' ? 'À venir' : 'Passées'}
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
        <div className="flex flex-col items-center justify-center py-20 bg-card border border-border rounded-2xl shadow-sm">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            {tab === 'upcoming' ? <Calendar className="w-8 h-8 text-muted-foreground/50" /> : <FolderClosed className="w-8 h-8 text-muted-foreground/50" />}
          </div>
          <p className="font-semibold text-lg mb-1">
            {tab === 'upcoming' ? 'Aucune session à venir' : 'Aucune session passée'}
          </p>
          <p className="text-muted-foreground text-sm max-w-sm text-center">
            {tab === 'upcoming' ? 'Proposez une session à l\'un de vos matchs pour commencer à échanger !' : 'Vos sessions passées apparaîtront ici.'}
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
            <div className="flex items-center justify-center gap-3 pt-6 pb-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border border-border disabled:opacity-40 hover:bg-muted transition-colors bg-card"
              >
                <ArrowLeft className="w-4 h-4" /> Précédent
              </button>
              <span className="text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-lg">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border border-border disabled:opacity-40 hover:bg-muted transition-colors bg-card"
              >
                Suivant <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
