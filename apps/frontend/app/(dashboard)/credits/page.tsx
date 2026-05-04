'use client';

import { useState, useEffect } from 'react';
import { creditsApi } from '@/lib/api';
import type { CreditBalance, CreditTransaction } from '@/lib/api';
import { Coins, Lightbulb, Clock, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; color: string; sign: string }> = {
  welcome_bonus:    { label: 'Bonus bienvenue',   color: 'text-green-600',  sign: '+' },
  profile_bonus:    { label: 'Bonus profil',      color: 'text-green-600',  sign: '+' },
  session_earned:   { label: 'Session enseignée', color: 'text-green-600',  sign: '+' },
  session_spent:    { label: 'Session payée',     color: 'text-red-600',    sign: '-' },
  session_reserved: { label: 'Réservé',           color: 'text-amber-600',  sign: '−' },
  session_released: { label: 'Libéré',            color: 'text-blue-600',   sign: '+' },
  session_confirmed:{ label: 'Confirmé',          color: 'text-green-600',  sign: '+' },
  referral_bonus:   { label: 'Invitation',        color: 'text-green-600',  sign: '+' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CreditsPage() {
  const [balance,  setBalance]  = useState<CreditBalance | null>(null);
  const [history,  setHistory]  = useState<CreditTransaction[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      creditsApi.balance(),
      creditsApi.history({ limit: 50 }),
    ])
      .then(([bal, hist]) => {
        setBalance(bal);
        setHistory(hist.data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-xl space-y-4 animate-pulse">
        <div className="h-8 w-40 bg-muted rounded" />
        <div className="h-40 bg-muted rounded-xl" />
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    );
  }

  if (error || !balance) {
    return <p className="text-destructive">{error ?? 'Erreur de chargement.'}</p>;
  }

  const fillPct = Math.round((balance.total / balance.cap) * 100);

  return (
    <div className="space-y-10 pb-10">
      {/* Header Section */}
      <div className="bg-card/30 p-8 rounded-3xl border border-border/40 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none rotate-12">
          <Coins className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground flex items-center gap-3">
            <Coins className="w-8 h-8 text-amber-500" />
            Mes crédits temps
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Le système de Skilo repose sur l'échange équitable : <span className="font-bold text-foreground">1 heure enseignée = 1 crédit</span>. Utilisez vos crédits pour apprendre de nouvelles compétences.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Balance & Progress */}
        <div className="lg:col-span-5 space-y-6">
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
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-muted/20">
              <h2 className="font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Historique des mouvements
              </h2>
              <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold opacity-60">
                {history.length} Transactions
              </Badge>
            </div>

            <div className="divide-y divide-border">
              {history.length === 0 ? (
                <div className="py-20 text-center space-y-3">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto opacity-30">
                    <Clock className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">Aucun mouvement pour l'instant.</p>
                </div>
              ) : (
                history.map((tx) => {
                  const cfg = TYPE_CONFIG[tx.type] ?? { label: tx.type, color: 'text-foreground', sign: '' };
                  const isPositive = cfg.sign === '+';
                  
                  return (
                    <div key={tx.id} className="px-6 py-5 flex items-center justify-between hover:bg-muted/30 transition-colors group">
                      <div className="flex gap-4 items-center min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                          isPositive ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-red-500/10 border-red-500/20 text-red-600'
                        }`}>
                          <Coins className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                            {tx.description || cfg.label}
                          </p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 font-medium">
                            {formatDate(tx.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right ml-4 shrink-0">
                        <p className={`text-sm font-black ${
                          isPositive ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {cfg.sign}{Math.abs(tx.amount)}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-50 tracking-tighter mt-0.5">
                          Solde: {tx.balanceAfter}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
