/**
 * components/dashboard/CreditsCard.tsx
 * Credit balance widget showing available and reserved credits.
 */

import { Coins } from 'lucide-react';

interface CreditsCardProps {
  balance: number;
  reserved: number;
}

export function CreditsCard({ balance, reserved }: CreditsCardProps) {
  const available = balance - reserved;
  const usedPercent = balance > 0 ? Math.round((reserved / balance) * 100) : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
          Crédits
        </p>
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50">
          <Coins className="h-3.5 w-3.5 text-indigo-600" />
        </div>
      </div>

      <p className="text-3xl font-bold tabular-nums text-slate-900">{available}</p>
      <p className="mt-1 text-xs text-slate-500">disponibles</p>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${usedPercent}%` }}
          />
        </div>
        {reserved > 0 && (
          <p className="mt-1.5 text-xs text-slate-400">
            {reserved} réservé{reserved > 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );
}
