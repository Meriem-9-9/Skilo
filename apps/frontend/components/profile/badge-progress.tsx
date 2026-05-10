import { Medal } from 'lucide-react';
import type { User } from '@/lib/api';

interface BadgeProgressProps {
  profile: User;
}

export function BadgeProgress({ profile }: BadgeProgressProps) {
  if (profile.hasBadgeFiable) {
    return (
      <div className="mt-6 flex items-center gap-2 justify-center text-sm bg-amber-500/10 text-amber-700 py-3 rounded-xl font-bold border border-amber-500/20 shadow-sm animate-in zoom-in duration-500">
        <Medal className="w-5 h-5 text-amber-600" />
        <span>Badge Fiable obtenu</span>
      </div>
    );
  }

  return (
    <div className="mt-6 p-5 bg-muted/20 border border-dashed border-border rounded-2xl space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Medal className="w-3.5 h-3.5" /> Objectif Badge Fiable
        </p>
        <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full">En cours</span>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
          <span className={profile.sessionsCompleted >= 5 ? "text-emerald-500" : "text-muted-foreground"}>
            Sessions: {profile.sessionsCompleted}/5
          </span>
          <span className={Number(profile.avgRating || 0) >= 4 ? "text-emerald-500" : "text-muted-foreground"}>
            Note: {profile.avgRating ? Number(profile.avgRating).toFixed(1) : '—'}/4.0
          </span>
        </div>
        <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-primary h-full transition-all duration-1000" 
            style={{ width: `${Math.min(100, (profile.sessionsCompleted / 5) * 100)}%` }} 
          />
        </div>
      </div>
      <p className="text-[9px] text-muted-foreground leading-tight italic">
        Terminez 5 sessions avec une moyenne de 4.0 pour obtenir ce badge.
      </p>
    </div>
  );
}
