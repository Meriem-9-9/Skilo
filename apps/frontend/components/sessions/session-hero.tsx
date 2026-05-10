import { Calendar, Clock, Video, Link as LinkIcon } from 'lucide-react';
import type { Session, User } from '@/lib/api';
import { formatDate, formatTime } from '@/app/(dashboard)/sessions/[id]/utils';

interface SessionHeroProps {
  session: Session;
  otherUser: User;
}

export function SessionHero({ session, otherUser }: SessionHeroProps) {
  return (
    <div className="relative bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-sm">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full -ml-32 -mb-32 blur-3xl" />

      <div className="relative p-10 flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="space-y-6 text-center md:text-left">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-3">Session de compétence</p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
              Échange avec <span className="text-primary">{otherUser.firstName}</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-primary">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</p>
                <p className="font-bold">{formatDate(session.scheduledAt)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-primary">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Heure</p>
                <p className="font-bold">{formatTime(session.scheduledAt)} ({session.durationMinutes} min)</p>
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-center gap-4">
          {session.status === 'confirmed' && session.meetingLink ? (
            <a 
              href={session.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-64 h-20 bg-primary text-primary-foreground rounded-[2rem] flex items-center justify-center gap-3 font-black text-lg uppercase tracking-widest hover:scale-105 hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-95"
            >
              <Video className="w-7 h-7" />
              Rejoindre
            </a>
          ) : (
            <div className="w-64 h-20 bg-muted/50 border-2 border-dashed border-border rounded-[2rem] flex flex-col items-center justify-center text-muted-foreground">
              <LinkIcon className="w-6 h-6 mb-1 opacity-50" />
              <span className="text-[10px] font-black uppercase tracking-widest">Lien à venir</span>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground font-medium max-w-[200px] text-center">
            Le lien sera actif dès que la session est confirmée.
          </p>
        </div>
      </div>
    </div>
  );
}
