import { MapPin, Star } from 'lucide-react';
import type { User } from '@/lib/api';

interface MatchHeroInfoProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    city?: string;
    avgRating?: number;
    sessionsCompleted: number;
  };
  score: number;
  compatColor: string;
}

export function MatchHeroInfo({ user, score, compatColor }: MatchHeroInfoProps) {
  const initials = [user.firstName[0], user.lastName[0]].join('').toUpperCase();

  return (
    <div className="flex flex-col items-center gap-6 shrink-0 mx-auto lg:mx-0">
      <div className="relative">
        <div className="w-40 h-40 rounded-[2.5rem] bg-gradient-to-br from-primary/20 to-primary/5 p-1">
          <div className="w-full h-full rounded-[2.2rem] bg-card overflow-hidden border-4 border-card">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.firstName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl font-black text-primary">
                {initials}
              </div>
            )}
          </div>
        </div>
        {/* Score Overlay */}
        <div className={`absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-card border-4 border-background flex flex-col items-center justify-center shadow-xl ${compatColor}`}>
          <span className="text-xl font-black">{score}%</span>
          <span className="text-[8px] font-black uppercase tracking-tighter">Score</span>
        </div>
      </div>

      <div className="text-center">
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          {user.firstName} {user.lastName}
        </h1>
        {user.city && <p className="text-sm text-muted-foreground flex items-center gap-1.5 justify-center mt-1"><MapPin className="w-4 h-4" /> {user.city}</p>}
      </div>

      <div className="flex items-center gap-4 py-2 px-6 bg-muted/30 rounded-2xl border border-border/50">
        {user.avgRating && (
          <div className="flex items-center gap-1.5 text-sm font-black text-amber-500">
            <Star className="w-4 h-4 fill-amber-500" /> {Number(user.avgRating).toFixed(1)}
          </div>
        )}
        <div className="w-px h-4 bg-border" />
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          {user.sessionsCompleted} Session{user.sessionsCompleted !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
