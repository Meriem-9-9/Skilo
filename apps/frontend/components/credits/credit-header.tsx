import { Coins } from 'lucide-react';

export function CreditHeader() {
  return (
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
  );
}
