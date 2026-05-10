import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { CreditTransaction } from '@/lib/api';
import { TransactionItem } from './transaction-item';

interface CreditHistoryCardProps {
  history: CreditTransaction[];
}

export function CreditHistoryCard({ history }: CreditHistoryCardProps) {
  return (
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
          history.map((tx) => (
            <TransactionItem key={tx.id} transaction={tx} />
          ))
        )}
      </div>
    </div>
  );
}
