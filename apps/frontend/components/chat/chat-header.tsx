import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { User, Session } from '@/lib/api';

interface ChatHeaderProps {
  otherUser: User;
  session: Session;
}

export function ChatHeader({ otherUser, session }: ChatHeaderProps) {
  return (
    <div className="p-4 sm:p-6 border-b border-border/50 bg-muted/20 flex items-center gap-4">
      <Button variant="ghost" size="icon" asChild className="rounded-xl h-10 w-10 shrink-0">
        <Link href="/messages">
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </Button>
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
        {otherUser.avatarUrl ? (
          <img src={otherUser.avatarUrl} alt={otherUser.firstName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-lg font-bold text-primary">
            {otherUser.firstName[0]}{otherUser.lastName[0]}
          </span>
        )}
      </div>
      <div>
        <h1 className="text-xl font-black">
          {otherUser.firstName} {otherUser.lastName}
        </h1>
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mt-1">
          Session {session.status === 'confirmed' ? 'Confirmée' : 'En attente'}
        </p>
      </div>
    </div>
  );
}
