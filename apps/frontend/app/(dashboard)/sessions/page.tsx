'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { sessionsApi, Session, SessionStatus } from '@/lib/api';
import { Coins, Link as LinkIcon, Check, X, Calendar, Archive, ArrowLeft, ArrowRight, FolderClosed, AlertTriangle, Sparkles, MessageCircle, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ReviewDialog } from '@/components/sessions/review-dialog';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string; icon: any }> = {
  pending:        { label: 'En attente',     color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Calendar },
  confirmed:      { label: 'Confirmée',      color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: Check },
  completed:      { label: 'Terminée',       color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Archive },
  auto_completed: { label: 'Auto-complétée', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Archive },
  cancelled:      { label: 'Annulée',        color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: X },
  disputed:       { label: 'Litige',         color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', icon: AlertTriangle },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
  });
}

function Avatar({ user, size = 10 }: { user: { firstName: string; lastName: string; avatarUrl?: string }; size?: number }) {
  const initials = [user.firstName?.[0] || '?', user.lastName?.[0] || ''].join('').toUpperCase();
  const sizeClass = size === 16 ? 'w-16 h-16' : `w-${size} h-${size}`;
  return (
    <div className={`${sizeClass} rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0 shadow-inner`}>
      {user.avatarUrl
        ? <img src={user.avatarUrl} alt={user.firstName} className="w-full h-full object-cover" />
        : <span className="text-xl font-bold text-primary">{initials}</span>
      }
    </div>
  );
}

// ─── Session card ─────────────────────────────────────────────────────────────

function SessionCard({
  session, currentUserId, onAccept, onDecline, onCancel, onConfirm, onOpenReview, highlight
}: {
  session: Session;
  currentUserId: string;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onCancel: (id: string) => void;
  onConfirm: (id: string, happened: boolean) => void;
  onOpenReview: (session: Session) => void;
  highlight?: boolean;
}) {
  const router = useRouter();
  const isInitiator = session.proposedBy?.id === currentUserId;
  const other = isInitiator ? session.recipient : session.proposedBy;
  if (!other) return null;
  const cfg = STATUS_CONFIG[session.status];
  const StatusIcon = cfg.icon;

  const now = new Date();
  const scheduledAt = new Date(session.scheduledAt);
  const isConfirmable = session.status === 'confirmed';
  const canIConfirm = isConfirmable && (isInitiator ? !session.confirmedByA : !session.confirmedByB);
  
  const hasReviewed = session.reviews?.some(r => r.reviewerId === currentUserId);
  const canReview = session.status === 'completed' && !hasReviewed;

  return (
    <div 
      id={`session-${session.id}`}
      className={`group relative bg-card/40 backdrop-blur-md border rounded-[2rem] p-6 transition-all hover:bg-card/60 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 overflow-hidden cursor-pointer ${highlight ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-lg shadow-primary/10' : 'border-border/50'}`}
      onClick={() => router.push(`/sessions/${session.id}`)}
    >
      {/* Decorative gradient blob */}
      <div className={`absolute -top-24 -right-24 w-48 h-48 blur-[100px] rounded-full group-hover:bg-primary/10 transition-colors ${highlight ? 'bg-primary/20' : 'bg-primary/5'}`} />

      {/* Top Bar: Status & Credits */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${cfg.color}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {cfg.label}
        </div>
        
        <div className="flex items-center gap-2">
          {session.creditsUsed > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest">
              <Coins className="w-3.5 h-3.5" />
              {session.creditsUsed} Crédit{session.creditsUsed > 1 ? 's' : ''}
            </div>
          )}
          {['pending', 'confirmed'].includes(session.status) && (
            <Link
              href={`/sessions/${session.id}/chat`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-sm active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Chat
            </Link>
          )}
        </div>
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-start relative z-10">
        <Link href={`/users/${other.id}`} onClick={(e) => e.stopPropagation()} className="relative mx-auto md:mx-0 group/avatar">
          <Avatar user={other} size={16} />
          {!isInitiator && session.status === 'pending' && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-xl border-4 border-background flex items-center justify-center shadow-lg">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          )}
        </Link>

        <div className="space-y-5 text-center md:text-left">
          <div>
            <Link href={`/users/${other.id}`} onClick={(e) => e.stopPropagation()}>
              <h3 className="text-2xl font-black text-foreground tracking-tight hover:text-primary transition-colors">
                {other.firstName} {other.lastName}
              </h3>
            </Link>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-muted-foreground mt-2">
              <span className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-xl border border-border/50">
                <Calendar className="w-3.5 h-3.5 text-primary/70" /> 
                <span className="font-semibold">{formatDate(session.scheduledAt)}</span>
              </span>
              <span className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-xl border border-border/50">
                <Clock className="w-3.5 h-3.5 text-primary/70" /> 
                <span className="font-semibold">{session.durationMinutes} min</span>
              </span>
            </div>
          </div>

          {/* Skill Exchange Visualization */}
          {session.skillsExchanged?.length > 0 && (
            <div className="bg-muted/20 rounded-[1.5rem] p-5 border border-border/40 relative overflow-hidden group/skills">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover/skills:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between gap-4 relative z-10">
                <div className="flex-1 space-y-1 min-w-0">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Demandé</p>
                  <p className="text-sm font-bold truncate text-primary uppercase italic">
                    {session.skillsExchanged[0]?.wantedSkillName || 'Non spécifié'}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-background border border-border flex items-center justify-center shrink-0 shadow-sm group-hover/skills:rotate-180 transition-transform duration-500">
                  <LinkIcon className="w-5 h-5 text-muted-foreground/50 rotate-45" />
                </div>
                <div className="flex-1 space-y-1 text-right min-w-0">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Offert</p>
                  <p className="text-sm font-bold truncate text-foreground uppercase italic">
                    {session.skillsExchanged[0]?.offeredSkillName || 'Non spécifié'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Message */}
          {session.message && (
            <div className="relative bg-primary/5 p-4 rounded-2xl border border-primary/10">
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                "{session.message}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions & Meeting Link */}
      <div className="mt-8 pt-6 border-t border-border/50 flex flex-col gap-4 relative z-10">
        {session.meetingLink && (session.status === 'confirmed' || session.status === 'pending') && (
          <a
            href={session.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all group/link shadow-xl shadow-primary/10 active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <LinkIcon className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">Rejoindre la session</p>
                <p className="text-sm font-bold truncate max-w-[180px] md:max-w-xs">{session.meetingLink}</p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center transition-transform group-hover/link:translate-x-1">
              <ArrowRight className="w-5 h-5" />
            </div>
          </a>
        )}

        <div className="flex flex-wrap gap-3">
          {/* Recipient actions on pending */}
          {!isInitiator && session.status === 'pending' && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onAccept(session.id); }}
                className="flex-[2] h-14 flex items-center justify-center gap-3 rounded-2xl bg-foreground text-background text-sm font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl active:scale-95"
              >
                <Check className="w-5 h-5" /> Accepter
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDecline(session.id); }}
                className="flex-1 h-14 flex items-center justify-center gap-3 rounded-2xl border-2 border-border text-sm font-black uppercase tracking-widest hover:bg-muted transition-all active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Confirm completion */}
          {canIConfirm && (
            <div className="w-full space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Confirmation requise
              </div>
              <div className="flex gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); onConfirm(session.id, true); }}
                  className="flex-1 h-14 flex items-center justify-center gap-3 rounded-2xl bg-emerald-500 text-white text-sm font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                >
                  <Check className="w-5 h-5" /> Oui, c'est fait
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onConfirm(session.id, false); }}
                  className="flex-1 h-14 flex items-center justify-center gap-3 rounded-2xl border-2 border-red-500/20 bg-red-500/5 text-red-500 text-sm font-black uppercase tracking-widest hover:bg-red-500/10 transition-all active:scale-95"
                >
                  <X className="w-5 h-5" /> Non
                </button>
              </div>
            </div>
          )}

          {/* Review Button */}
          {canReview && (
            <button
              onClick={(e) => { e.stopPropagation(); onOpenReview(session); }}
              className="w-full h-14 flex items-center justify-center gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all shadow-sm active:scale-[0.98] mt-2"
            >
              <Star className="w-5 h-5" /> Laisser un avis
            </button>
          )}

          {/* Cancel (if cancellable) */}
          {(session.status === 'pending' || session.status === 'confirmed') && (
            <button
              onClick={(e) => { e.stopPropagation(); onCancel(session.id); }}
              className="text-[10px] font-black text-muted-foreground/60 hover:text-red-500 transition-colors py-2 px-4 rounded-xl hover:bg-red-500/5 ml-auto flex items-center gap-2 uppercase tracking-widest"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Annuler
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SessionsPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const searchParams = useSearchParams();
  const targetId = searchParams.get('id');

  const [tab,      setTab]      = useState<'upcoming' | 'past'>('upcoming');
  const [statusFilter, setStatusFilter] = useState<SessionStatus | ''>('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [error,    setError]    = useState<string | null>(null);
  const [toast,    setToast]    = useState<string | null>(null);
  const [sessionToCancel, setSessionToCancel] = useState<string | null>(null);
  const [reviewSession, setReviewSession] = useState<Session | null>(null);

  const LIMIT = 10;

  const fetchSessions = useCallback(() => {
    setLoading(true);
    sessionsApi.list({ tab, page, limit: LIMIT, status: statusFilter || undefined })
      .then((res) => { 
        setSessions(res.data); 
        setTotal(res.total);
        
        // Redirect to detail page if ID is provided
        if (targetId) {
          router.push(`/sessions/${targetId}`);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tab, page, targetId, statusFilter]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);
  useEffect(() => { setPage(1); setStatusFilter(''); }, [tab]);
  useEffect(() => { setPage(1); }, [statusFilter]);

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

  function handleCancel(id: string) {
    setSessionToCancel(id);
  }

  async function handleCancelConfirm() {
    if (!sessionToCancel) return;
    try {
      await sessionsApi.cancel(sessionToCancel);
      fetchSessions();
      showToast('Session annulée.');
    } catch (e) { showToast(e instanceof Error ? e.message : 'Erreur'); }
    finally { setSessionToCancel(null); }
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
    <div className="max-w-[1600px] mx-auto space-y-10 pb-10">

      {/* Confirmation Dialog */}
      <Dialog open={!!sessionToCancel} onOpenChange={(open) => !open && setSessionToCancel(null)}>
        <DialogContent className="p-0 overflow-hidden border-none shadow-2xl rounded-2xl sm:max-w-md">
          <div className="p-6 bg-destructive/5">
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Annuler la session ?</DialogTitle>
              <DialogDescription className="text-muted-foreground mt-2">
                Êtes-vous sûr de vouloir annuler cette session ? Cette action informera l'autre participant et pourrait avoir un impact sur vos crédits si elle est annulée tardivement.
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="p-6 bg-muted/30 gap-3 sm:gap-0">
            <Button 
              variant="ghost" 
              onClick={() => setSessionToCancel(null)}
              className="rounded-xl h-11 font-semibold"
            >
              Retour
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelConfirm}
              className="rounded-xl h-11 px-8 font-bold shadow-lg shadow-destructive/10 transition-all hover:scale-[1.02]"
            >
              Confirmer l'annulation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Tabs & Filters */}
      <div className="space-y-6">
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

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${statusFilter === '' ? 'bg-foreground text-background border-foreground' : 'bg-card text-muted-foreground border-border hover:border-muted-foreground/30'}`}
          >
            Tous
          </button>
          {(tab === 'upcoming' ? ['pending', 'confirmed'] : ['completed', 'cancelled']).map((s) => {
            const status = s as SessionStatus;
            const cfg = STATUS_CONFIG[status];
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${statusFilter === status ? 'bg-foreground text-background border-foreground' : 'bg-card text-muted-foreground border-border hover:border-muted-foreground/30'}`}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>
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
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {sessions.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                currentUserId={authUser!.id}
                onAccept={handleAccept}
                onDecline={handleDecline}
                onCancel={handleCancel}
                onConfirm={handleConfirm}
                onOpenReview={setReviewSession}
                highlight={s.id === targetId}
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

      {/* Review Dialog */}
      <ReviewDialog
        session={reviewSession}
        isOpen={!!reviewSession}
        onClose={() => setReviewSession(null)}
        onSuccess={() => {
          showToast('Avis envoyé avec succès !');
          fetchSessions();
        }}
      />
    </div>
  );
}
