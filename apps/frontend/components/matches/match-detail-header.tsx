import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MatchDetailHeaderProps {
  isPerfect: boolean;
}

export function MatchDetailHeader({ isPerfect }: MatchDetailHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between">
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      >
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </div>
        Retour aux opportunités
      </button>
      <div className="flex items-center gap-2">
        <span className={`px-4 py-1.5 rounded-full border text-xs font-black uppercase tracking-widest ${isPerfect ? 'bg-green-100 text-green-700 border-green-200' : 'bg-muted text-muted-foreground border-border'}`}>
          {isPerfect ? 'Match Parfait' : 'Match Partiel'}
        </span>
      </div>
    </div>
  );
}
