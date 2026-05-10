'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { sessionsApi, Session } from '@/lib/api';
import { MessageSearch } from '@/components/messages/message-search';
import { ConversationItem } from '@/components/messages/conversation-item';
import { MessagesLoader } from '@/components/messages/messages-loader';
import { EmptyMessages } from '@/components/messages/empty-messages';

export default function MessagesPage() {
  const { user: authUser } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let isMounted = true;
    
    // Fetch upcoming sessions to act as active chats
    const fetchChats = async () => {
      try {
        const res = await sessionsApi.list({ tab: 'upcoming', limit: 50 });
        if (isMounted) setSessions(res.data);
      } catch (err) {
        console.error('Failed to fetch chats', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchChats();

    return () => { isMounted = false; };
  }, []);

  if (!authUser) return null;

  const filteredSessions = sessions.filter(session => {
    const isInitiator = session.proposedBy.id === authUser.id;
    const otherUser = isInitiator ? session.recipient : session.proposedBy;
    const fullName = `${otherUser.firstName} ${otherUser.lastName}`.toLowerCase();
    return fullName.includes(search.toLowerCase());
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div>
        <h1 className="text-2xl font-bold">Messagerie</h1>
        <p className="text-muted-foreground text-sm mt-1">Discutez avec vos partenaires de session.</p>
      </div>

      <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-3xl overflow-hidden shadow-sm">
        <MessageSearch value={search} onChange={setSearch} />

        {loading ? (
          <MessagesLoader />
        ) : filteredSessions.length === 0 ? (
          <EmptyMessages />
        ) : (
          <div className="divide-y divide-border/50">
            {filteredSessions.map(session => (
              <ConversationItem 
                key={session.id} 
                session={session} 
                authUser={authUser} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
