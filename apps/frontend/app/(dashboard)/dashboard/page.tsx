'use client';

import { useState, useEffect } from 'react';
import { usersApi, matchesApi, sessionsApi } from '@/lib/api';
import type { User, Match, Session } from '@/lib/api';
import { ProfileSidebar } from '@/components/dashboard/profile-sidebar';
import { MatchList } from '@/components/dashboard/match-list';
import { SessionList } from '@/components/dashboard/session-list';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { GrowthCard } from '@/components/dashboard/growth-card';
import { InviteCard } from '@/components/dashboard/invite-card';
import { DashboardLoader } from '@/components/dashboard/dashboard-loader';
import { Users as UsersIcon, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [meData, matchesResponse, sessionsResponse] = await Promise.all([
          usersApi.me(),
          matchesApi.list(),
          sessionsApi.list()
        ]);
        // const meData = await usersApi.me();
        setUser(meData);

        // const matchesResponse = await matchesApi.list();
        setMatches(matchesResponse.data || []);

        // const sessionsResponse = await sessionsApi.list();
        setSessions(sessionsResponse.data || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);
  
  const handleCopyInvite = () => {
    if (!user) return;
    const inviteLink = `${window.location.origin}/register?ref=${user.id}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success("Lien d'invitation copié !", {
      description: "Partagez-le avec vos amis pour gagner des crédits."
    });
  };

  if (loading) {
    return <DashboardLoader />;
  }

  return (
    <div className="space-y-10 pb-10">
      <DashboardHeader firstName={user?.firstName} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Profile & Stats */}
        <div className="lg:col-span-3 space-y-6">
          <ProfileSidebar user={user} />
          <GrowthCard profileScore={user?.profileScore} />
        </div>

        {/* Middle Column: Matches */}
        <div className="lg:col-span-6 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-primary" /> 
              Matches pour vous
            </h2>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold opacity-70">
              {matches.length} Recommandés
            </Badge>
          </div>
          <MatchList matches={matches} />
        </div>

        {/* Right Column: Sessions & Extras */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center gap-2 px-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Vos Sessions</h2>
          </div>
          <SessionList sessions={sessions} />
          <InviteCard onCopyInvite={handleCopyInvite} />
        </div>
      </div>
    </div>
  );
}
