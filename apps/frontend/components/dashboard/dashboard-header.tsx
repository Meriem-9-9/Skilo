import { Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardHeaderProps {
  firstName?: string;
}

export function DashboardHeader({ firstName }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card/30 p-8 rounded-3xl border border-border/40 backdrop-blur-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
        <Sparkles className="w-48 h-48" />
      </div>
      <div className="relative z-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Bonjour, {firstName}!</h1>
        <p className="text-muted-foreground">Ravi de vous revoir sur votre plateforme d'échange de compétences. Voici ce qui se passe aujourd'hui.</p>
      </div>
      <div className="flex gap-3 relative z-10">
        <Button 
          className="gap-2 shadow-lg shadow-primary/20 rounded-xl px-6 h-12 font-bold"
          onClick={() => window.location.href = '/matches'}
        >
          <Search className="w-4 h-4" /> Explorer les matches
        </Button>
      </div>
    </div>
  );
}
