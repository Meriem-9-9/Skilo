'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { sessionsApi, Session, User } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { 
  Calendar, Clock, MapPin, Check, X, AlertTriangle, 
  Video, MessageSquare, ArrowLeft, Star, CreditCard, Link as LinkIcon 
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { ReviewDialog } from '@/components/sessions/review-dialog';

// ─── Constants & Helpers ──────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending:   { label: 'En attente', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Clock },
  confirmed: { label: 'Confirmé', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: Check },
  completed: { label: 'Terminé', color: 'bg-primary/10 text-primary border-primary/20', icon: Check },
  cancelled: { label: 'Annulé', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: X },
  disputed:  { label: 'Litige', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: AlertTriangle },
};

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user: authUser } = useAuth();

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    sessionsApi.get(id)
      .then(setSession)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAction = async (action: 'accept' | 'decline' | 'confirm' | 'cancel', didHappen: boolean = true) => {
    if (!session) return;
    try {
      if (action === 'accept') await sessionsApi.accept(session.id);
      if (action === 'decline') await sessionsApi.decline(session.id);
      if (action === 'confirm') await sessionsApi.confirm(session.id, didHappen);
      
      toast.success('Action effectuée avec succès');
      // Refresh session data
      const updated = await sessionsApi.get(session.id);
      setSession(updated);
    } catch (err: any) {
      toast.error(err.message || "Une erreur est survenue");
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-8 animate-pulse">
        <div className="h-10 w-48 bg-muted rounded-xl" />
        <div className="h-64 bg-muted rounded-[2.5rem]" />
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 h-48 bg-muted rounded-3xl" />
          <div className="h-48 bg-muted rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black mb-2">Session introuvable</h2>
        <p className="text-muted-foreground mb-8">{error || "Cette session n'existe pas ou vous n'y avez pas accès."}</p>
        <button onClick={() => router.push('/sessions')} className="px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-bold">
          Retour au planning
        </button>
      </div>
    );
  }

  const isInitiator = session.proposedBy.id === authUser?.id;
  const otherUser = isInitiator ? session.recipient : session.proposedBy;
  const config = STATUS_CONFIG[session.status] || STATUS_CONFIG.pending;
  const StatusIcon = config.icon;

  const canAccept = !isInitiator && session.status === 'pending';
  const canConfirm = session.status === 'confirmed' && 
                     ((isInitiator && session.confirmedByA === null) || (!isInitiator && session.confirmedByB === null));
  
  const canReview = session.status === 'completed' && 
                    !session.reviews?.some(r => r.reviewerId === authUser?.id);

  return (
    <div className="max-w-5xl mx-auto p-6 pb-20 space-y-8">
      {/* Header & Back */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.push('/sessions')}
          className="group flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Retour au planning
        </button>

        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 font-black text-xs uppercase tracking-widest ${config.color}`}>
          <StatusIcon className="w-4 h-4" />
          {config.label}
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full -ml-32 -mb-32 blur-3xl" />

        <div className="relative p-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="space-y-6 text-center md:text-left">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-3">Session de compétence</p>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                Échange avec <span className="text-primary">{otherUser.firstName}</span>
              </h1>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-primary">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</p>
                  <p className="font-bold">{new Date(session.scheduledAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-primary">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Heure</p>
                  <p className="font-bold">{new Date(session.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} ({session.durationMinutes} min)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-center gap-4">
            {session.status === 'confirmed' && session.meetingLink ? (
              <a 
                href={session.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-64 h-20 bg-primary text-primary-foreground rounded-[2rem] flex items-center justify-center gap-3 font-black text-lg uppercase tracking-widest hover:scale-105 hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-95"
              >
                <Video className="w-7 h-7" />
                Rejoindre
              </a>
            ) : (
              <div className="w-64 h-20 bg-muted/50 border-2 border-dashed border-border rounded-[2rem] flex flex-col items-center justify-center text-muted-foreground">
                <LinkIcon className="w-6 h-6 mb-1 opacity-50" />
                <span className="text-[10px] font-black uppercase tracking-widest">Lien à venir</span>
              </div>
            )}
            <p className="text-[10px] text-muted-foreground font-medium max-w-[200px] text-center">
              Le lien sera actif dès que la session est confirmée.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Other User Profile Card */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Votre partenaire d'échange</h3>
          <Link href={`/users/${otherUser.id}`} className="block group">
            <div className="bg-card border border-border rounded-3xl p-6 flex items-center gap-6 group-hover:border-primary/30 group-hover:shadow-md transition-all">
              <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 overflow-hidden shrink-0">
                {otherUser.avatarUrl ? (
                  <img src={otherUser.avatarUrl} alt={otherUser.firstName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-primary">
                    {otherUser.firstName[0]}{otherUser.lastName[0]}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xl font-black text-foreground group-hover:text-primary transition-colors">
                  {otherUser.firstName} {otherUser.lastName}
                </h4>
                {otherUser.city && <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5"><MapPin className="w-4 h-4" /> {otherUser.city}</p>}
                
                <div className="flex items-center gap-3 mt-3">
                  {otherUser.avgRating && (
                    <div className="flex items-center gap-1 text-sm font-bold text-amber-500">
                      <Star className="w-4 h-4 fill-amber-500" /> {Number(otherUser.avgRating).toFixed(1)}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {otherUser.sessionsCompleted} session{otherUser.sessionsCompleted !== 1 ? 's' : ''} terminée{otherUser.sessionsCompleted !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                <ArrowLeft className="w-5 h-5 rotate-180" />
              </div>
            </div>
          </Link>

          {/* Skills Exchanged Card */}
          <div className="bg-card border border-border rounded-3xl p-8 space-y-6">
            <h3 className="text-lg font-black tracking-tight">Échange réciproque</h3>
            <div className="grid grid-cols-2 gap-8 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-background border border-border rounded-full flex items-center justify-center z-10 shadow-sm">
                <ArrowLeft className="w-4 h-4 text-primary" />
              </div>
              
              {/* Logic: 
                  If isInitiator: Give Offered, Receive Wanted 
                  If !isInitiator: Give Wanted, Receive Offered 
              */}
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vous donnez</p>
                <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                  <p className="font-bold text-primary">
                    {isInitiator 
                      ? (session.skillsExchanged[0]?.offeredSkillName || 'Compétence') 
                      : (session.skillsExchanged[0]?.wantedSkillName || 'Compétence')}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Donné à {otherUser.firstName}</p>
                </div>
              </div>

              <div className="space-y-4 text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vous recevez</p>
                <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                  <p className="font-bold text-indigo-600">
                    {isInitiator 
                      ? (session.skillsExchanged[0]?.wantedSkillName || 'Compétence') 
                      : (session.skillsExchanged[0]?.offeredSkillName || 'Compétence')}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Reçu de {otherUser.firstName}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Actions</h3>
          <div className="space-y-3">
            {/* Link to Chat */}
            <Link 
              href={`/sessions/${session.id}/chat`}
              className="w-full h-14 flex items-center justify-center gap-3 rounded-2xl bg-foreground text-background text-sm font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg active:scale-[0.98]"
            >
              <MessageSquare className="w-5 h-5" /> Chat de session
            </Link>

            {canAccept && (
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleAction('accept')}
                  className="h-14 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md active:scale-95"
                >
                  Accepter
                </button>
                <button 
                  onClick={() => handleAction('decline')}
                  className="h-14 bg-destructive text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-destructive/90 transition-all shadow-md active:scale-95"
                >
                  Refuser
                </button>
              </div>
            )}

            {canConfirm && (
              <button 
                onClick={() => handleAction('confirm')}
                className="w-full h-14 bg-primary text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5"
              >
                <span>Confirmer la session</span>
                <span className="text-[8px] font-bold opacity-70">Avez-vous terminé l'échange ?</span>
              </button>
            )}

            {canReview && (
              <button 
                onClick={() => setIsReviewOpen(true)}
                className="w-full h-14 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-600 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                <Star className="w-4 h-4 fill-white" />
                Laisser un avis
              </button>
            )}

            <div className="pt-4 mt-4 border-t border-border">
              <button 
                onClick={() => toast.success("Votre signalement a été envoyé à l'équipe de modération. Nous vous contacterons sous 24h.")}
                className="w-full py-3 text-xs font-bold text-destructive hover:bg-destructive/5 rounded-xl transition-all"
              >
                Signaler un problème
              </button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
            <h4 className="text-sm font-black tracking-tight">Récapitulatif</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Crédits</span>
                <span className="font-bold flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-primary" /> {session.creditsUsed || 0}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Type d'échange</span>
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-muted rounded-full">
                  {session.creditsUsed === 0 ? 'Parfait (Gratuit)' : 'Partiel'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {session && (
        <ReviewDialog
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          session={session}
          onSuccess={() => {
            setIsReviewOpen(false);
            // Refresh session data to hide review button
            sessionsApi.get(session.id).then(setSession);
          }}
        />
      )}
    </div>
  );
}
