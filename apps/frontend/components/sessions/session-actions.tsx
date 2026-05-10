import Link from 'next/link';
import { MessageSquare, Star, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import type { Session } from '@/lib/api';

interface SessionActionsProps {
  session: Session;
  canAccept: boolean;
  canConfirm: boolean;
  canReview: boolean;
  onAction: (action: 'accept' | 'decline' | 'confirm' | 'cancel', didHappen?: boolean) => void;
  onOpenReview: () => void;
}

export function SessionActions({
  session, canAccept, canConfirm, canReview, onAction, onOpenReview
}: SessionActionsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Actions</h3>
      <div className="space-y-3">
        <Link 
          href={`/sessions/${session.id}/chat`}
          className="w-full h-14 flex items-center justify-center gap-3 rounded-2xl bg-foreground text-background text-sm font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg active:scale-[0.98]"
        >
          <MessageSquare className="w-5 h-5" /> Chat de session
        </Link>

        {canAccept && (
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => onAction('accept')}
              className="h-14 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md active:scale-95"
            >
              Accepter
            </button>
            <button 
              onClick={() => onAction('decline')}
              className="h-14 bg-destructive text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-destructive/90 transition-all shadow-md active:scale-95"
            >
              Refuser
            </button>
          </div>
        )}

        {canConfirm && (
          <button 
            onClick={() => onAction('confirm')}
            className="w-full h-14 bg-primary text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5"
          >
            <span>Confirmer la session</span>
            <span className="text-[8px] font-bold opacity-70">Avez-vous terminé l'échange ?</span>
          </button>
        )}

        {canReview && (
          <button 
            onClick={onOpenReview}
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
  );
}
