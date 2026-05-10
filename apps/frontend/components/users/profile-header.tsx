import { MapPin, Award } from 'lucide-react';
import type { User } from '@/lib/api';
import { Stars } from './stars';

interface ProfileHeaderProps {
  user: User & { match?: { score: number } | null };
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const initials = [user.firstName?.[0] || '?', user.lastName?.[0] || ''].join('').toUpperCase();

  return (
    <div className="relative bg-card border border-border rounded-[3rem] p-10 overflow-hidden shadow-2xl shadow-primary/5 group">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -mr-48 -mt-48 blur-[100px]" />
      
      <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
        {/* Avatar */}
        <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-primary/20 to-primary/5 p-1 shrink-0">
          <div className="w-full h-full rounded-[2.2rem] bg-card overflow-hidden border-4 border-card shadow-inner">
            {user.avatarUrl
              ? <img src={user.avatarUrl} alt={user.firstName} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-3xl font-black text-primary">{initials}</div>
            }
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
              <h1 className="text-3xl font-black tracking-tight">{user.firstName} {user.lastName}</h1>
              {user.hasBadgeFiable && (
                <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-200">
                  <Award className="w-3.5 h-3.5" /> Fiable
                </div>
              )}
            </div>
            {user.city && (
              <p className="text-sm text-muted-foreground flex items-center justify-center md:justify-start gap-1.5">
                <MapPin className="w-4 h-4 text-primary" /> {user.city}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
            {user.avgRating ? (
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Évaluation</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black">{Number(user.avgRating).toFixed(1)}</span>
                  <Stars rating={Number(user.avgRating)} />
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Statut</p>
                <p className="text-sm font-bold text-muted-foreground">Nouveau membre</p>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sessions</p>
              <p className="text-xl font-black">{user.sessionsCompleted}</p>
            </div>

            {user.match && (
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Compatibilité</p>
                <div className={`px-3 py-1 rounded-xl border font-black text-xs ${
                  user.match.score >= 70 ? 'text-green-600 bg-green-50 border-green-200'
                  : user.match.score >= 50 ? 'text-blue-600 bg-blue-50 border-blue-200'
                  : 'text-orange-600 bg-orange-50 border-orange-200'
                }`}>
                  {user.match.score}%
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {user.bio && (
        <div className="relative z-10 mt-10 p-6 bg-muted/30 rounded-3xl border border-border/50">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 opacity-60">À propos</p>
          <p className="text-sm leading-relaxed text-muted-foreground italic">"{user.bio}"</p>
        </div>
      )}
    </div>
  );
}
