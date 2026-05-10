import { useRouter } from 'next/navigation';
import { Calendar, MessageSquare, CheckCircle2, Zap } from 'lucide-react';
import type { User } from '@/lib/api';

interface ActionSidebarProps {
  user: User & { actionButton: string; match?: { score: number } | null };
}

export function ActionSidebar({ user }: ActionSidebarProps) {
  const router = useRouter();

  return (
    <div className="bg-foreground text-background rounded-[3rem] p-10 space-y-8 shadow-2xl shadow-primary/20 sticky top-6">
      <div className="space-y-2">
        <h3 className="text-2xl font-black tracking-tight leading-tight">Envie d'échanger avec {user.firstName} ?</h3>
        <p className="text-sm opacity-60">Réservez une session dès maintenant.</p>
      </div>

      <div className="space-y-3">
        {user.actionButton === 'propose_session' && (
          <button 
            onClick={() => router.push(`/matches?propose=${user.id}`)}
            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 hover:-translate-y-1 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
            <Calendar className="w-5 h-5" />
            Proposer une session
          </button>
        )}
        {user.actionButton === 'view_session' && (
          <button 
            onClick={() => router.push('/sessions')}
            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5" />
            Voir ma session
          </button>
        )}
        <button className="w-full py-4 bg-white/10 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-3 border border-white/10">
          <MessageSquare className="w-5 h-5" />
          Lui écrire
        </button>
      </div>

      <div className="pt-6 border-t border-white/10 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Tarif match</p>
            <p className="text-sm font-bold">{user.match?.score === 100 ? 'Gratuit (Réciprocité)' : '1 crédit / session'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
