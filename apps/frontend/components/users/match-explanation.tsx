import { Zap, ChevronRight } from 'lucide-react';
import type { MatchedPair } from '@/lib/api';

interface MatchExplanationProps {
  matchedPairs: MatchedPair[];
}

export function MatchExplanation({ matchedPairs }: MatchExplanationProps) {
  if (matchedPairs.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-[3rem] p-10 space-y-8">
      <div className="space-y-1">
        <h2 className="text-xl font-black tracking-tight">Pourquoi cet échange est idéal ?</h2>
        <p className="text-sm text-muted-foreground">Voici comment vos compétences s'alignent parfaitement.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {matchedPairs.map((pair, i) => (
          <div key={i} className="group p-6 bg-muted/40 rounded-3xl border border-border/50 hover:border-primary/30 transition-all">
            <div className="flex items-center justify-between gap-6">
              <div className="flex-1 space-y-2">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Il vous propose</p>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary fill-primary" />
                  <p className="text-lg font-black text-foreground">{pair.offeredByB?.name}</p>
                </div>
              </div>
              
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:rotate-12 transition-transform">
                <ChevronRight className="w-6 h-6" />
              </div>

              <div className="flex-1 text-right space-y-2">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">En échange de</p>
                <p className="text-lg font-black text-foreground">{pair.offeredByA?.name || 'Session payante'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
