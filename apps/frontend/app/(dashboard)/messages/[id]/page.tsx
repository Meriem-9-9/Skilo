'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { sessionsApi, Message, Session, getAccessToken } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { io, Socket } from 'socket.io-client';
import { ChatHeader } from '@/components/chat/chat-header';
import { MessageList } from '@/components/chat/message-list';
import { ChatInput } from '@/components/chat/chat-input';
import { ChatLoader } from '@/components/chat/chat-loader';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const { user: authUser } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    
    let isMounted = true;
    
    const fetchSession = async () => {
      try {
        const s = await sessionsApi.get(sessionId);
        if (isMounted) setSession(s);
      } catch (err) {
        console.error('Failed to fetch session', err);
        if (isMounted) router.push('/messages');
      } finally {
        if (isMounted) setPageLoading(false);
      }
    };

    fetchSession();

    return () => { isMounted = false; };
  }, [sessionId, router]);

  useEffect(() => {
    if (!sessionId || !session) return;
    
    let isMounted = true;
    
    const fetchMessages = async () => {
      try {
        const res = await sessionsApi.getMessages(sessionId);
        if (isMounted) setMessages(res);
      } catch (err) {
        console.error('Failed to fetch messages', err);
      }
    };

    fetchMessages();

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2006';
    const newSocket = io(baseUrl);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('joinSession', {
        sessionId,
        token: getAccessToken(),
      });
    });

    newSocket.on('newMessage', (msg: Message) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      isMounted = false;
      newSocket.disconnect();
    };
  }, [sessionId, session]);

  if (pageLoading || !authUser) {
    return <ChatLoader />;
  }

  if (!session) return null;

  const isInitiator = session.proposedBy.id === authUser.id;
  const otherUser = isInitiator ? session.recipient : session.proposedBy;

  const handleSendMessage = (content: string) => {
    if (socket && session) {
      socket.emit('sendMessage', {
        sessionId: session.id,
        token: getAccessToken(),
        content
      });
    }
  };

  const handleSendImage = (imageUrl: string) => {
    if (socket && session) {
      socket.emit('sendMessage', {
        sessionId: session.id,
        token: getAccessToken(),
        imageUrl
      });
    }
  };

  const handleSuggestMeetingLink = () => {
    if (socket && session) {
      socket.emit('sendMessage', {
        sessionId: session.id,
        token: getAccessToken(),
        isMeetingLinkSuggestion: true
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-10rem)] flex flex-col bg-card/60 backdrop-blur-xl border border-border/50 rounded-3xl overflow-hidden shadow-sm">
      <ChatHeader otherUser={otherUser} session={session} />
      
      <MessageList 
        messages={messages} 
        session={session} 
        authUser={authUser} 
      />

      {['pending', 'confirmed'].includes(session.status) ? (
        <ChatInput 
          onSendMessage={handleSendMessage} 
          onSendImage={handleSendImage} 
          onSuggestMeeting={handleSuggestMeetingLink} 
        />
      ) : (
        <div className="p-4 bg-muted/30 border-t border-border/50 text-center text-sm font-semibold text-muted-foreground">
          Le chat n'est plus disponible pour cette session.
        </div>
      )}
    </div>
  );
}
