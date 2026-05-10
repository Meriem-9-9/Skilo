import { useRef, useEffect } from 'react';
import type { Message, Session, User } from '@/lib/api';
import { MessageItem } from './message-item';

interface MessageListProps {
  messages: Message[];
  session: Session;
  authUser: User;
}

export function MessageList({ messages, session, authUser }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
          <p className="font-semibold mb-2">Aucun message pour le moment</p>
          <p className="text-sm">Envoyez un message pour commencer la discussion.</p>
        </div>
      ) : (
        messages.map((msg, i) => {
          const isMe = msg.senderId === authUser.id;
          const showAvatar = !isMe && (i === 0 || messages[i - 1].senderId !== msg.senderId);
          
          return (
            <MessageItem 
              key={msg.id} 
              message={msg} 
              session={session} 
              authUser={authUser} 
              showAvatar={showAvatar} 
            />
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
