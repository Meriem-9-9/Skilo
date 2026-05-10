import { Link as LinkIcon } from 'lucide-react';
import type { Message, Session, User } from '@/lib/api';

interface MessageItemProps {
  message: Message;
  session: Session;
  authUser: User;
  showAvatar: boolean;
}

export function MessageItem({ message, session, authUser, showAvatar }: MessageItemProps) {
  const isMe = message.senderId === authUser.id;

  return (
    <div className={`flex gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
      {!isMe && (
        <div className="w-8 shrink-0 hidden sm:block">
          {showAvatar && (
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {message.sender.avatarUrl ? (
                <img src={message.sender.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold">{message.sender.firstName[0]}</span>
              )}
            </div>
          )}
        </div>
      )}

      <div className={`flex flex-col gap-1 max-w-[85%] sm:max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
        {/* Image Attachment */}
        {message.imageUrl && (
          <div className="rounded-2xl overflow-hidden border border-border shadow-sm w-full max-w-sm">
            <img src={message.imageUrl} alt="attachment" className="w-full h-auto" />
          </div>
        )}
        
        {/* Meeting Link Suggestion */}
        {message.isMeetingLinkSuggestion && session.meetingLink && (
          <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl flex flex-col gap-3 w-full max-w-sm">
            <div className="flex items-center gap-2 text-primary font-bold">
              <LinkIcon className="w-4 h-4" />
              <span>Suggestion de visioconférence</span>
            </div>
            <p className="text-sm">Rejoignez-moi sur le lien de la session pour échanger de vive voix !</p>
            <a 
              href={session.meetingLink} 
              target="_blank" 
              rel="noreferrer"
              className="bg-primary text-primary-foreground text-center text-sm font-bold py-2 rounded-xl hover:opacity-90 transition-opacity block w-full"
            >
              Rejoindre la session
            </a>
          </div>
        )}

        {/* Text Content */}
        {message.content && (
          <div 
            className={`px-5 py-3 rounded-2xl text-sm break-words w-full ${
              isMe 
                ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                : 'bg-muted rounded-tl-sm text-foreground'
            }`}
          >
            {message.content}
          </div>
        )}
        
        <span className="text-[10px] text-muted-foreground px-1 font-medium">
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
