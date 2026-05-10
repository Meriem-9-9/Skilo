import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Coins, Link as LinkIcon, Check, X, Calendar, ArrowRight, Sparkles, MessageCircle, Clock, Star, AlertTriangle } from 'lucide-react';
import type { Session } from '@/lib/api';
import { STATUS_CONFIG, formatDate } from '@/app/(dashboard)/sessions/utils';

interface AvatarProps {
  user: { firstName: string; lastName: string; avatarUrl?: string };
  size?: number;
}

function Avatar({ user, size = 10 }: AvatarProps) {
  const initials = [user.firstName?.[0] || '?', user.lastName?.[0] || ''].join('').toUpperCase();
  const sizeClass = size === 16 ? 'w-16 h-16' : `w-${size} h-${size}`;
  return (
    <div className={`${sizeClass} rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0 shadow-inner`}>
      {user.avatarUrl
        ? <img src={user.avatarUrl} alt={user.firstName} className="w-full h-full object-cover" />
        : <span className="text-xl font-bold text-primary">{initials}</span>
      }
    </div>
  );
}

interface SessionCardProps {
  session: Session;
  currentUserId: string;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onCancel: (id: string) => void;
  onConfirm: (id: string, happened: boolean) => void;
  onOpenReview: (session: Session) => void;
  highlight?: boolean;
}

export function SessionCard({
  session, currentUserId, onAccept, onDecline, onCancel, onConfirm, onOpenReview, highlight
}: SessionCardProps) {
  const router = useRouter();
  const isInitiator = session.proposedBy?.id === currentUserId;
  const other = isInitiator ? session.recipient : session.proposedBy;
  if (!other) return null;
  const cfg = STATUS_CONFIG[session.status];
  const StatusIcon = cfg.icon;

  const isConfirmable = session.status === 'confirmed';
  const canIConfirm = isConfirmable && (isInitiator ? !session.confirmedByA : !session.confirmedByB);
  
  const hasReviewed = session.reviews?.some(r => r.reviewerId === currentUserId);
  const canReview = session.status === 'completed' && !hasReviewed;

  return (
    <div 
      id={`session-${session.id}`}
      className={`group relative bg-card/40 backdrop-blur-md border rounded-[2rem] p-6 transition-all hover:bg-card/60 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 overflow-hidden cursor-pointer ${highlight ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-lg shadow-primary/10' : 'border-border/50'}`}
      onClick={() => router.push(`/sessions/${session.id}`)}
    >
      <div className={`absolute -top-24 -right-24 w-48 h-48 blur-[100px] rounded-full group-hover:bg-primary/10 transition-colors ${highlight ? 'bg-primary/20' : 'bg-primary/5'}`} />

      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${cfg.color}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {cfg.label}
        </div>
        
        <div className="flex items-center gap-2">
          {session.creditsUsed > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest">
              <Coins className="w-3.5 h-3.5" />
              {session.creditsUsed} Crédit{session.creditsUsed > 1 ? 's' : ''}
            </div>
          )}
          {['pending', 'confirmed'].includes(session.status) && (
            <Link
              href={`/sessions/${session.id}/chat`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-sm active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Chat
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-start relative z-10">
        <Link href={`/users/${other.id}`} onClick={(e) => e.stopPropagation()} className="relative mx-auto md:mx-0 group/avatar">
          <Avatar user={other} size={16} />
          {!isInitiator && session.status === 'pending' && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-xl border-4 border-background flex items-center justify-center shadow-lg">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          )}
        </Link>

        <div className="space-y-5 text-center md:text-left">
          <div>
            <Link href={`/users/${other.id}`} onClick={(e) => e.stopPropagation()}>
              <h3 className="text-2xl font-black text-foreground tracking-tight hover:text-primary transition-colors">
                {other.firstName} {other.lastName}
              </h3>
            </Link>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-muted-foreground mt-2">
              <span className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-xl border border-border/50">
                <Calendar className="w-3.5 h-3.5 text-primary/70" /> 
                <span className="font-semibold">{formatDate(session.scheduledAt)}</span>
              </span>
              <span className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-xl border border-border/50">
                <Clock className="w-3.5 h-3.5 text-primary/70" /> 
                <span className="font-semibold">{session.durationMinutes} min</span>
              </span>
            </div>
          </div>

          {session.skillsExchanged?.length > 0 && (
            <div className="bg-muted/20 rounded-[1.5rem] p-5 border border-border/40 relative overflow-hidden group/skills">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover/skills:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between gap-4 relative z-10">
                <div className="flex-1 space-y-1 min-w-0">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Demandé</p>
                  <p className="text-sm font-bold truncate text-primary uppercase italic">
                    {session.skillsExchanged[0]?.wantedSkillName || 'Non spécifié'}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-background border border-border flex items-center justify-center shrink-0 shadow-sm group-hover/skills:rotate-180 transition-transform duration-500">
                  <LinkIcon className="w-5 h-5 text-muted-foreground/50 rotate-45" />
                </div>
                <div className="flex-1 space-y-1 text-right min-w-0">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Offert</p>
                  <p className="text-sm font-bold truncate text-foreground uppercase italic">
                    {session.skillsExchanged[0]?.offeredSkillName || 'Non spécifié'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {session.message && (
            <div className="relative bg-primary/5 p-4 rounded-2xl border border-primary/10">
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                "{session.message}"
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-border/50 flex flex-col gap-4 relative z-10">
        {session.meetingLink && (session.status === 'confirmed' || session.status === 'pending') && (
          <a
            href={session.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all group/link shadow-xl shadow-primary/10 active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <LinkIcon className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">Rejoindre la session</p>
                <p className="text-sm font-bold truncate max-w-[180px] md:max-w-xs">{session.meetingLink}</p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center transition-transform group-hover/link:translate-x-1">
              <ArrowRight className="w-5 h-5" />
            </div>
          </a>
        )}

        <div className="flex flex-wrap gap-3">
          {!isInitiator && session.status === 'pending' && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onAccept(session.id); }}
                className="flex-[2] h-14 flex items-center justify-center gap-3 rounded-2xl bg-foreground text-background text-sm font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl active:scale-95"
              >
                <Check className="w-5 h-5" /> Accepter
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDecline(session.id); }}
                className="flex-1 h-14 flex items-center justify-center gap-3 rounded-2xl border-2 border-border text-sm font-black uppercase tracking-widest hover:bg-muted transition-all active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          )}

          {canIConfirm && (
            <div className="w-full space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Confirmation requise
              </div>
              <div className="flex gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); onConfirm(session.id, true); }}
                  className="flex-1 h-14 flex items-center justify-center gap-3 rounded-2xl bg-emerald-500 text-white text-sm font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                >
                  <Check className="w-5 h-5" /> Oui, c'est fait
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onConfirm(session.id, false); }}
                  className="flex-1 h-14 flex items-center justify-center gap-3 rounded-2xl border-2 border-red-500/20 bg-red-500/5 text-red-500 text-sm font-black uppercase tracking-widest hover:bg-red-500/10 transition-all active:scale-95"
                >
                  <X className="w-5 h-5" /> Non
                </button>
              </div>
            </div>
          )}

          {canReview && (
            <button
              onClick={(e) => { e.stopPropagation(); onOpenReview(session); }}
              className="w-full h-14 flex items-center justify-center gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all shadow-sm active:scale-[0.98] mt-2"
            >
              <Star className="w-5 h-5" /> Laisser un avis
            </button>
          )}

          {(session.status === 'pending' || session.status === 'confirmed') && (
            <button
              onClick={(e) => { e.stopPropagation(); onCancel(session.id); }}
              className="text-[10px] font-black text-muted-foreground/60 hover:text-red-500 transition-colors py-2 px-4 rounded-xl hover:bg-red-500/5 ml-auto flex items-center gap-2 uppercase tracking-widest"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Annuler
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
