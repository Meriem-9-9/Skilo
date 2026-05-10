'use client';

import { useState, useEffect } from 'react';
import { creditsApi } from '@/lib/api';
import type { CreditBalance, CreditTransaction } from '@/lib/api';
import { CreditHeader } from '@/components/credits/credit-header';
import { CreditBalanceCard } from '@/components/credits/credit-balance-card';
import { CreditHistoryCard } from '@/components/credits/credit-history-card';

export default function CreditsPage() {
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [history, setHistory] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const bal = await creditsApi.balance();
        setBalance(bal);

        const hist = await creditsApi.history({ limit: 50 });
        setHistory(hist.data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
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

  return (
    <div className="space-y-10 pb-10">
      <CreditHeader />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Balance & Progress */}
        <div className="lg:col-span-5 space-y-6">
          <CreditBalanceCard balance={balance} />
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-7 space-y-6">
          <CreditHistoryCard history={history} />
        </div>
      </div>
    </div>
  );
}
