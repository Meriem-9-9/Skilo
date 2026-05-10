import { Coins } from 'lucide-react';
import type { CreditTransaction } from '@/lib/api';
import { TYPE_CONFIG, formatDate } from '@/app/(dashboard)/credits/utils';

interface TransactionItemProps {
  transaction: CreditTransaction;
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const cfg = TYPE_CONFIG[transaction.type] ?? { label: transaction.type, color: 'text-foreground', sign: '' };
  const isPositive = cfg.sign === '+';

  return (
    <div className="px-6 py-5 flex items-center justify-between hover:bg-muted/30 transition-colors group">
      <div className="flex gap-4 items-center min-w-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
          isPositive ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-red-500/10 border-red-500/20 text-red-600'
        }`}>
          <Coins className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
            {transaction.description || cfg.label}
          </p>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 font-medium">
            {formatDate(transaction.createdAt)}
          </p>
        </div>
      </div>
      <div className="text-right ml-4 shrink-0">
        <p className={`text-sm font-black ${
          isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          {cfg.sign}{Math.abs(transaction.amount)}
        </p>
        <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-50 tracking-tighter mt-0.5">
          Solde: {transaction.balanceAfter}
        </p>
      </div>
    </div>
  );
}
