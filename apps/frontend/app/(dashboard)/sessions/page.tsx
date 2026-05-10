'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { sessionsApi, Session, SessionStatus } from '@/lib/api';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

import { ReviewDialog } from '@/components/sessions/review-dialog';
import { SessionCard } from '@/components/sessions/session-card';
import { SessionFilters } from '@/components/sessions/session-filters';
import { EmptySessions } from '@/components/sessions/empty-sessions';
import { CancelSessionDialog } from '@/components/sessions/cancel-dialog';

export default function SessionsPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const searchParams = useSearchParams();
  const targetId = searchParams.get('id');

  const [tab,          setTab]          = useState<'upcoming' | 'past'>('upcoming');
  const [statusFilter, setStatusFilter] = useState<SessionStatus | ''>('');
  const [sessions,     setSessions]     = useState<Session[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [total,        setTotal]        = useState(0);
  const [page,         setPage]         = useState(1);
  const [error,        setError]        = useState<string | null>(null);
  const [toast,        setToast]        = useState<string | null>(null);
  const [sessionToCancel, setSessionToCancel] = useState<string | null>(null);
  const [reviewSession, setReviewSession] = useState<Session | null>(null);

  const LIMIT = 10;

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sessionsApi.list({ 
        tab, 
        page, 
        limit: LIMIT, 
        status: statusFilter || undefined 
      });
      setSessions(res.data);
      setTotal(res.total);

      if (targetId) {
        router.push(`/sessions/${targetId}`);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tab, page, targetId, statusFilter, router]);

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
    } catch (e: any) { showToast(e.message || 'Erreur'); }
  }

  async function handleDecline(id: string) {
    try {
      await sessionsApi.decline(id);
      fetchSessions();
      showToast('Session refusée.');
    } catch (e: any) { showToast(e.message || 'Erreur'); }
  }

  async function handleCancelConfirm() {
    if (!sessionToCancel) return;
    try {
      await sessionsApi.cancel(sessionToCancel);
      fetchSessions();
      showToast('Session annulée.');
    } catch (e: any) { showToast(e.message || 'Erreur'); }
    finally { setSessionToCancel(null); }
  }

  async function handleConfirm(id: string, happened: boolean) {
    try {
      await sessionsApi.confirm(id, happened);
      fetchSessions();
      showToast(happened ? 'Confirmation enregistrée !' : 'Réponse enregistrée.');
    } catch (e: any) { showToast(e.message || 'Erreur'); }
  }

  const totalPages = Math.ceil(total / LIMIT);

  if (!authUser) return null;

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 pb-10">

      <CancelSessionDialog 
        isOpen={!!sessionToCancel} 
        onClose={() => setSessionToCancel(null)}
        onConfirm={handleCancelConfirm}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-card border border-border rounded-xl px-4 py-3 shadow-lg text-sm z-50 animate-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold">Mes sessions</h1>
        <p className="text-muted-foreground text-sm mt-1">Gérez vos échanges de compétences.</p>
      </div>

      <SessionFilters 
        tab={tab}
        setTab={setTab}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

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
        <EmptySessions tab={tab} />
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {sessions.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                currentUserId={authUser.id}
                onAccept={handleAccept}
                onDecline={handleDecline}
                onCancel={setSessionToCancel}
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
