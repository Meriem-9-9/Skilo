import { Coins, Clock, Lightbulb } from 'lucide-react';
import type { CreditBalance } from '@/lib/api';

interface CreditBalanceCardProps {
  balance: CreditBalance;
}

export function CreditBalanceCard({ balance }: CreditBalanceCardProps) {
  const fillPct = Math.round((balance.total / balance.cap) * 100);

  return (
    <div className="bg-card border border-border rounded-3xl p-8 space-y-8 shadow-sm relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-amber-500/10 transition-colors" />
      
      <div className="flex items-center justify-between relative z-10">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-70">Solde disponible</p>
          <div className="flex items-baseline gap-1">
            <span className="text-6xl font-black text-amber-500 tracking-tighter">{balance.available}</span>
            <span className="text-xl text-muted-foreground font-medium">/{balance.cap}</span>
          </div>
        </div>
        <div className="w-20 h-20 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 rotate-3 group-hover:rotate-6 transition-transform">
          <Coins className="w-10 h-10 text-amber-500" />
        </div>
      </div>

      {/* Reserved Credits */}
      {balance.reserved > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/5 border border-amber-500/10 rounded-xl w-fit">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-xs font-bold text-amber-600">
            {balance.reserved} crédit{balance.reserved > 1 ? 's' : ''} réservé{balance.reserved > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="space-y-3 relative z-10">
        <div className="flex justify-between items-end mb-1">
          <span className="text-sm font-bold">Utilisation du plafond</span>
          <span className="text-xs font-bold text-amber-500">{fillPct}%</span>
        </div>
        <div className="h-3 w-full bg-amber-500/10 rounded-full overflow-hidden p-0.5">
          <div 
            className="h-full bg-amber-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(245,158,11,0.4)]" 
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </div>

      {/* Insight Card */}
      <div className="bg-muted/30 border border-border/50 rounded-2xl p-5 flex gap-4 items-start relative z-10">
        <div className="p-2 bg-background rounded-lg border border-border/50 shrink-0 mt-0.5">
          <Lightbulb className="w-4 h-4 text-amber-500" />
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Avec votre solde actuel, vous pouvez accéder à{' '}
          <span className="text-foreground font-bold">{balance.estimatedHours} heure{balance.estimatedHours !== 1 ? 's' : ''}</span>{' '}
          d'apprentissage personnalisé avec nos experts.
        </p>
      </div>
      
      {/* Action Tip */}
      {balance.available === 0 && (
        <div className="text-center p-4 bg-primary/5 rounded-2xl border border-primary/10">
          <p className="text-xs font-medium text-primary">
            Besoin de crédits ? Proposez une session pour partager votre savoir !
          </p>
        </div>
      )}
    </div>
  );
}
