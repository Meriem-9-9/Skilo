'use client';

import { useState, useEffect } from 'react';
import { creditsApi, CreditBalance, CreditTransaction } from '@/lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; color: string; sign: string }> = {
  welcome_bonus:    { label: 'Bonus bienvenue',   color: 'text-green-600',  sign: '+' },
  profile_bonus:    { label: 'Bonus profil',      color: 'text-green-600',  sign: '+' },
  session_earned:   { label: 'Session enseignée', color: 'text-green-600',  sign: '+' },
  session_spent:    { label: 'Session payée',     color: 'text-red-600',    sign: '-' },
  session_reserved: { label: 'Réservé',           color: 'text-amber-600',  sign: '−' },
  session_released: { label: 'Libéré',            color: 'text-blue-600',   sign: '+' },
  session_confirmed:{ label: 'Confirmé',          color: 'text-green-600',  sign: '+' },
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
    <div className="max-w-xl space-y-6">

      <div>
        <h1 className="text-2xl font-bold">Mes crédits temps</h1>
        <p className="text-muted-foreground text-sm mt-1">
          1 heure enseignée = 1 crédit · 1 crédit = 1 heure d'apprentissage
        </p>
      </div>

      {/* Balance card */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Solde disponible</p>
            <p className="text-5xl font-bold text-amber-500 mt-1">
              {balance.available}
              <span className="text-2xl text-muted-foreground font-normal ml-1">/{balance.cap}</span>
            </p>
            {balance.reserved > 0 && (
              <p className="text-sm text-amber-600 mt-1">+ {balance.reserved} réservé{balance.reserved > 1 ? 's' : ''}</p>
            )}
          </div>
          <span className="text-6xl">🪙</span>
        </div>

        {/* Progress bar */}
        <div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full bg-amber-400 transition-all duration-500"
              style={{ width: `${fillPct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{fillPct}% du plafond atteint</p>
        </div>

        {/* Estimation */}
        <div className="border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            💡 Avec votre solde, vous pouvez accéder à{' '}
            <strong className="text-foreground">{balance.estimatedHours} heure{balance.estimatedHours !== 1 ? 's' : ''}</strong>{' '}
            d'apprentissage.
          </p>
        </div>

        {/* Zero balance */}
        {balance.available === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
            Enseignez pour gagner des crédits et débloquer de nouveaux apprentissages.
          </div>
        )}
      </div>

      {/* History */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-base font-semibold mb-4">Historique des mouvements</h2>

        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Aucun mouvement pour l'instant.</p>
        ) : (
          <div className="space-y-2">
            {history.map((tx) => {
              const cfg = TYPE_CONFIG[tx.type] ?? { label: tx.type, color: 'text-foreground', sign: '' };
              return (
                <div key={tx.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{tx.description || cfg.label}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className={`text-sm font-bold ${cfg.color}`}>
                      {cfg.sign}{Math.abs(tx.amount)} crédit{Math.abs(tx.amount) !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">Solde: {tx.balanceAfter}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
