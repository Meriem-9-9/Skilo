'use client';

import { useState, useEffect } from 'react';
import { usersApi, matchesApi, sessionsApi } from '@/lib/api';
import type { User, Match, Session } from '@/lib/api';
import { ProfileSidebar } from '@/components/dashboard/profile-sidebar';
import { MatchList } from '@/components/dashboard/match-list';
import { SessionList } from '@/components/dashboard/session-list';
import { Loader2, Plus, Sparkles, TrendingUp, Zap, Users as UsersIcon, Calendar, Share2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
        setUser(meData);
        setMatches(matchesResponse.data || []);
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
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Chargement…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-10">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card/30 p-8 rounded-3xl border border-border/40 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Sparkles className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Bonjour, {user?.firstName}! 👋</h1>
          <p className="text-muted-foreground">Ravi de vous revoir sur votre plateforme d'échange de compétences. Voici ce qui se passe aujourd'hui.</p>
        </div>
        <div className="flex gap-3 relative z-10">
          <Button 
            className="gap-2 shadow-lg shadow-primary/20 rounded-xl px-6 h-12 font-bold"
            onClick={() => window.location.href = '/matches'}
          >
            <Search className="w-4 h-4" /> Explorer les matches
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Profile & Stats */}
        <div className="lg:col-span-3 space-y-6">
          <ProfileSidebar user={user} />
          
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6 space-y-4 shadow-sm relative overflow-hidden group">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
            <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest relative z-10">
              <Zap className="w-3 h-3" /> Next Level
            </div>
            <div className="space-y-2 relative z-10">
              <div className="flex justify-between items-end mb-1">
                <span className="text-sm font-bold">Croissance</span>
                <span className="text-xs font-bold text-primary">{user?.profileScore}%</span>
              </div>
              <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${user?.profileScore}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed pt-2">
                Complétez 2 sessions de plus pour atteindre le <span className="font-bold text-foreground">Niveau 2</span> et débloquer de nouveaux avantages !
              </p>
            </div>
          </div>
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
          
          <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-5 shadow-sm hover:border-primary/30 transition-colors relative group">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto rotate-3 group-hover:rotate-6 transition-transform">
              <Share2 className="w-7 h-7 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-sm">Inviter un ami</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Gagnez <span className="text-primary font-bold">5 crédits</span> pour chaque ami qui termine sa première session !
              </p>
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              className="w-full text-xs rounded-xl h-9"
              onClick={handleCopyInvite}
            >
              Copier le lien d'invitation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
