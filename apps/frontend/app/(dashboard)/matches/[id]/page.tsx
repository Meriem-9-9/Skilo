'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { matchesApi, Match } from '@/lib/api';
import { 
  Zap, Target, ChevronRight, Calendar
} from 'lucide-react';
import Link from 'next/link';
import { ProposeSessionModal } from '@/components/matches/propose-modal';
import { MatchDetailHeader } from '@/components/matches/match-detail-header';
import { MatchHeroInfo } from '@/components/matches/match-hero-info';
import { MatchSkillsSection } from '@/components/matches/match-skills-section';
import { MatchDetailLoader } from '@/components/matches/match-detail-loader';

export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function fetchData() {
      try {
        const data = await matchesApi.get(id);
        setMatch(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return <MatchDetailLoader />;
  }

  if (error || !match) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <div className="text-6xl">🔍</div>
        <h1 className="text-xl font-bold">Match introuvable</h1>
        <p className="text-muted-foreground">{error || "Ce match n'existe pas."}</p>
        <button onClick={() => router.back()} className="text-primary font-medium hover:underline">
          Retour aux opportunités
        </button>
      </div>
    );
  }

  const u = match.otherUser;
  const isPerfect = match.type === 'perfect';

  const compatColor =
    match.score >= 70 ? 'text-green-600 bg-green-50 border-green-200'
    : match.score >= 50 ? 'text-blue-600 bg-blue-50 border-blue-200'
    : 'text-orange-600 bg-orange-50 border-orange-200';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 pb-20">
      <MatchDetailHeader isPerfect={isPerfect} />

      {/* Main Hero Card */}
      <div className="relative bg-card border border-border rounded-[3rem] p-10 shadow-2xl overflow-hidden group">
        {/* Glow Effect */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full -mr-64 -mt-64 blur-[100px] group-hover:bg-primary/10 transition-colors duration-1000" />
        
        <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-start">
          <MatchHeroInfo user={u} score={match.score} compatColor={compatColor} />

          {/* Right: Matches & Action */}
          <div className="flex-1 space-y-10 w-full">
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" /> Pourquoi ce match ?
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                {match.matchedPairs.map((pair, i) => (
                  <div key={i} className="group/pair p-6 bg-muted/40 rounded-3xl border border-border/50 hover:border-primary/30 transition-all">
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex-1 space-y-2">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Il vous propose</p>
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-primary fill-primary" />
                          <p className="text-lg font-black text-foreground">{pair.offeredByB?.name}</p>
                        </div>
                      </div>
                      
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover/pair:rotate-12 transition-transform">
                        <ChevronRight className="w-6 h-6" />
                      </div>

                      <div className="flex-1 text-right space-y-2">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Vous lui donnez</p>
                        <p className="text-lg font-black text-foreground">{pair.offeredByA?.name || 'Session payante'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex-[2] h-16 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary/30 hover:opacity-90 hover:-translate-y-1 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <Calendar className="w-5 h-5" />
                Proposer une session
              </button>
              <Link 
                href={`/users/${u.id}`}
                className="flex-1 h-16 rounded-2xl border-2 border-border font-black uppercase tracking-widest text-xs hover:bg-muted transition-all active:scale-[0.98] flex items-center justify-center"
              >
                Voir le profil complet
              </Link>
            </div>
          </div>
        </div>
      </div>

      <MatchSkillsSection user={u} />

      <ProposeSessionModal
        match={match}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          router.push('/sessions');
        }}
      />
    </div>
  );
}
