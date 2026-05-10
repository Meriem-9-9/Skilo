'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { sessionsApi, Session } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { ReviewDialog } from '@/components/sessions/review-dialog';
import { SessionHero } from '@/components/sessions/session-hero';
import { PartnerCard } from '@/components/sessions/partner-card';
import { SkillExchangeCard } from '@/components/sessions/skill-exchange-card';
import { SessionActions } from '@/components/sessions/session-actions';
import { SessionDetailLoader } from '@/components/sessions/session-detail-loader';
import { STATUS_CONFIG } from './utils';

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
    const fetchSession = async () => {
      try {
        const data = await sessionsApi.get(id);
        setSession(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [id]);

  const handleAction = async (action: 'accept' | 'decline' | 'confirm' | 'cancel', didHappen: boolean = true) => {
    if (!session) return;
    try {
      if (action === 'accept') await sessionsApi.accept(session.id);
      if (action === 'decline') await sessionsApi.decline(session.id);
      if (action === 'confirm') await sessionsApi.confirm(session.id, didHappen);
      
      toast.success('Action effectuée avec succès');
      const updated = await sessionsApi.get(session.id);
      setSession(updated);
    } catch (err: any) {
      toast.error(err.message || "Une erreur est survenue");
    }
  };

  if (loading) return <SessionDetailLoader />;

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
  if (!otherUser) return null;

  const config = STATUS_CONFIG[session.status] || STATUS_CONFIG.pending;
  const StatusIcon = config.icon;

  const canAccept = !isInitiator && session.status === 'pending';
  const canConfirm = session.status === 'confirmed' && 
                     ((isInitiator && session.confirmedByA === null) || (!isInitiator && session.confirmedByB === null));
  
  const canReview = session.status === 'completed' && 
                    !session.reviews?.some(r => r.reviewerId === authUser?.id);

  return (
    <div className="max-w-5xl mx-auto p-6 pb-20 space-y-8">
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

      <SessionHero session={session} otherUser={otherUser} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <PartnerCard user={otherUser} />
          <SkillExchangeCard session={session} otherUser={otherUser} isInitiator={isInitiator} />
        </div>

        <SessionActions 
          session={session}
          canAccept={canAccept}
          canConfirm={canConfirm}
          canReview={canReview}
          onAction={handleAction}
          onOpenReview={() => setIsReviewOpen(true)}
        />
      </div>

      <ReviewDialog
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        session={session}
        onSuccess={async () => {
          setIsReviewOpen(false);
          const updated = await sessionsApi.get(session.id);
          setSession(updated);
        }}
      />
    </div>
  );
}
