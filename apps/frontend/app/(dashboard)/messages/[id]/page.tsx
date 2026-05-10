'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { sessionsApi, uploadApi, Message, Session, getAccessToken } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { Send, Image as ImageIcon, Link as LinkIcon, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const { user: authUser } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (pageLoading || !authUser) {
    return (
      <div className="flex-1 flex items-center justify-center h-full min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  const isInitiator = session.proposedBy.id === authUser.id;
  const otherUser = isInitiator ? session.recipient : session.proposedBy;

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!content.trim() && !uploading) return;
    
    if (socket && session) {
      socket.emit('sendMessage', {
        sessionId: session.id,
        token: getAccessToken(),
        content: content.trim()
      });
      setContent('');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { avatarUrl } = await uploadApi.avatar(file);
      if (socket && session) {
        socket.emit('sendMessage', {
          sessionId: session.id,
          token: getAccessToken(),
          imageUrl: avatarUrl
        });
      }
    } catch (err) {
      console.error('Failed to upload image', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSuggestMeetingLink = async () => {
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
      {/* Header */}
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

      {/* Messages */}
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
              <div key={msg.id} className={`flex gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && (
                  <div className="w-8 shrink-0 hidden sm:block">
                    {showAvatar && (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {msg.sender.avatarUrl ? (
                          <img src={msg.sender.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold">{msg.sender.firstName[0]}</span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className={`flex flex-col gap-1 max-w-[85%] sm:max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {/* Image Attachment */}
                  {msg.imageUrl && (
                    <div className="rounded-2xl overflow-hidden border border-border shadow-sm w-full max-w-sm">
                      <img src={msg.imageUrl} alt="attachment" className="w-full h-auto" />
                    </div>
                  )}
                  
                  {/* Meeting Link Suggestion */}
                  {msg.isMeetingLinkSuggestion && session.meetingLink && (
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
                  {msg.content && (
                    <div 
                      className={`px-5 py-3 rounded-2xl text-sm break-words w-full ${
                        isMe 
                          ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                          : 'bg-muted rounded-tl-sm text-foreground'
                      }`}
                    >
                      {msg.content}
                    </div>
                  )}
                  
                  <span className="text-[10px] text-muted-foreground px-1 font-medium">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {['pending', 'confirmed'].includes(session.status) ? (
        <div className="p-4 bg-muted/10 border-t border-border/50">
          <form onSubmit={handleSend} className="flex items-end gap-2 sm:gap-3">
            <div className="flex gap-1 sm:gap-2">
              {/* Image Upload */}
              <input 
                type="file" 
                id="image-upload" 
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
              />
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                className="rounded-xl h-10 w-10 sm:h-12 sm:w-12 shrink-0 border-border bg-background"
                onClick={() => document.getElementById('image-upload')?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />}
              </Button>
              
              {/* Meeting Link Suggestion */}
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-xl h-10 w-10 sm:h-12 sm:w-12 shrink-0 border-primary/20 text-primary bg-primary/5 hover:bg-primary/10"
                title="Suggérer un appel"
                onClick={handleSuggestMeetingLink}
                disabled={loading}
              >
                <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>

            {/* Text Input */}
            <div className="flex-1 bg-background rounded-2xl border border-border shadow-sm flex items-center overflow-hidden pl-3 pr-1.5 focus-within:ring-2 focus-within:ring-primary/20">
              <input
                type="text"
                placeholder="Écrivez un message..."
                className="flex-1 h-10 sm:h-12 bg-transparent outline-none text-sm w-full min-w-0"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={loading}
              />
              <Button 
                type="submit" 
                size="icon" 
                className="h-7 w-7 sm:h-9 sm:w-9 rounded-xl shrink-0" 
                disabled={!content.trim() || loading}
              >
                <Send className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="p-4 bg-muted/30 border-t border-border/50 text-center text-sm font-semibold text-muted-foreground">
          Le chat n'est plus disponible pour cette session.
        </div>
      )}
    </div>
  );
}
