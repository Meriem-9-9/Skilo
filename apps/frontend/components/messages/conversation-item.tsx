import Link from 'next/link';
import type { Session, User } from '@/lib/api';

interface ConversationItemProps {
  session: Session;
  authUser: User;
}

export function ConversationItem({ session, authUser }: ConversationItemProps) {
  const isInitiator = session.proposedBy.id === authUser.id;
  const otherUser = isInitiator ? session.recipient : session.proposedBy;

  return (
    <Link
      href={`/messages/${session.id}`}
      className="flex items-center gap-4 p-4 sm:p-5 hover:bg-muted/30 transition-colors"
    >
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
        {otherUser.avatarUrl ? (
          <img src={otherUser.avatarUrl} alt={otherUser.firstName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-lg font-bold text-primary">
            {otherUser.firstName[0]}{otherUser.lastName[0]}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold truncate text-foreground">
            {otherUser.firstName} {otherUser.lastName}
          </h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-secondary/10 text-secondary-foreground uppercase tracking-widest shrink-0 ml-2">
            {session.status === 'confirmed' ? 'Confirmée' : 'En attente'}
          </span>
        </div>
        <p className="text-sm text-muted-foreground truncate">
          Session prévue le {new Date(session.scheduledAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
    </Link>
  );
}
