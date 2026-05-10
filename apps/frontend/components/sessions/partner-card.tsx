import Link from 'next/link';
import { MapPin, Star, ArrowLeft } from 'lucide-react';
import type { User } from '@/lib/api';

interface PartnerCardProps {
  user: User;
}

export function PartnerCard({ user }: PartnerCardProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Votre partenaire d'échange</h3>
      <Link href={`/users/${user.id}`} className="block group">
        <div className="bg-card border border-border rounded-3xl p-6 flex items-center gap-6 group-hover:border-primary/30 group-hover:shadow-md transition-all">
          <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 overflow-hidden shrink-0">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.firstName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-primary">
                {user.firstName[0]}{user.lastName?.[0]}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xl font-black text-foreground group-hover:text-primary transition-colors">
              {user.firstName} {user.lastName}
            </h4>
            {user.city && (
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-4 h-4" /> {user.city}
              </p>
            )}
            
            <div className="flex items-center gap-3 mt-3">
              {user.avgRating && (
                <div className="flex items-center gap-1 text-sm font-bold text-amber-500">
                  <Star className="w-4 h-4 fill-amber-500" /> {Number(user.avgRating).toFixed(1)}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                {user.sessionsCompleted} session{user.sessionsCompleted !== 1 ? 's' : ''} terminée{user.sessionsCompleted !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
            <ArrowLeft className="w-5 h-5 rotate-180" />
          </div>
        </div>
      </Link>
    </div>
  );
}
