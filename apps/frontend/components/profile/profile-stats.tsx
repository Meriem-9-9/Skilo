import { BarChart3, Star, Coins } from 'lucide-react';
import type { User } from '@/lib/api';

interface ProfileStatsProps {
  profile: User;
}

export function ProfileStats({ profile }: ProfileStatsProps) {
  return (
    <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" /> Statistiques
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-center">
        <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
          <p className="text-3xl font-black text-primary">{profile.sessionsCompleted}</p>
          <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wide">Sessions</p>
        </div>
        <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
          <div className="flex items-center justify-center gap-1">
            <p className="text-3xl font-black text-amber-500">
              {profile.avgRating ? Number(profile.avgRating).toFixed(1) : '—'}
            </p>
            <Star className="w-5 h-5 text-amber-500 fill-amber-500 -mt-1" />
          </div>
          <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wide">Note moy.</p>
        </div>
        <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
          <div className="flex items-center justify-center gap-1.5">
            <p className="text-3xl font-black text-emerald-500">{profile.creditBalance}</p>
            <Coins className="w-5 h-5 text-emerald-500 -mt-1" />
          </div>
          <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wide">Crédits</p>
        </div>
      </div>
    </section>
  );
}
