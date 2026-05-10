'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  usersApi, reviewsApi,
  User, UserSkill, Review, MatchedPair,
} from '@/lib/api';
import { 
  Star, ArrowLeft, 
  Target, Award
} from 'lucide-react';

import { ProfileHeader } from '@/components/users/profile-header';
import { MatchExplanation } from '@/components/users/match-explanation';
import { PublicSkillCard } from '@/components/users/public-skill-card';
import { ActionSidebar } from '@/components/users/action-sidebar';
import { PublicReviewCard } from '@/components/users/public-review-card';
import { ProfileLoader } from '@/components/users/profile-loader';

type PublicUser = User & {
  skills: UserSkill[];
  actionButton: 'propose_session' | 'write_message' | 'view_session' | 'none';
  match?: { score: number; label: string; type: string; matchedPairs: MatchedPair[] } | null;
};

export default function PublicProfilePage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();

  const [user,    setUser]    = useState<PublicUser | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [userData, reviewData] = await Promise.all([
          usersApi.publicProfile(id),
          reviewsApi.forUser(id),
        ]);
        setUser(userData);
        setReviews(reviewData.data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <ProfileLoader />;

  if (error || !user) {
    return (
      <div className="text-center py-24 max-w-md mx-auto space-y-6">
        <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
          <Target className="w-10 h-10" />
        </div>
        <div>
          <h1 className="text-2xl font-black mb-2">Profil introuvable</h1>
          <p className="text-muted-foreground text-sm">{error || 'Ce profil n\'existe pas ou n\'est pas disponible.'}</p>
        </div>
        <button onClick={() => router.push('/dashboard')} className="px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20">
          Retour au Dashboard
        </button>
      </div>
    );
  }

  const offeredSkills = user.skills.filter((s) => s.type === 'offered');
  const wantedSkills  = user.skills.filter((s) => s.type === 'wanted');

  return (
    <div className="max-w-6xl mx-auto p-6 pb-20 space-y-8">

      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-all group"
      >
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all">
          <ArrowLeft className="w-4 h-4" />
        </div>
        Retour
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          <ProfileHeader user={user} />

          {user.match && user.match.matchedPairs.length > 0 && (
            <MatchExplanation matchedPairs={user.match.matchedPairs} />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-card border border-border rounded-[2.5rem] p-8 space-y-6 shadow-sm">
              <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" /> Peut enseigner
              </h2>
              <div className="space-y-3">
                {offeredSkills.map((s) => <PublicSkillCard key={s.id} skill={s} />)}
              </div>
            </section>

            <section className="bg-card border border-border rounded-[2.5rem] p-8 space-y-6 shadow-sm">
              <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-500" /> Cherche à apprendre
              </h2>
              <div className="space-y-3">
                {wantedSkills.map((s) => <PublicSkillCard key={s.id} skill={s} />)}
              </div>
            </section>
          </div>
        </div>

        <div className="space-y-8">
          <ActionSidebar user={user} />
          
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-black uppercase tracking-widest">
                Avis reçus <span className="text-muted-foreground font-medium ml-1">({reviews.length})</span>
              </h2>
            </div>

            {reviews.length === 0 ? (
              <div className="p-10 text-center bg-card/40 border border-border/50 rounded-[2.5rem]">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-6 h-6 text-muted-foreground/30" />
                </div>
                <p className="text-sm text-muted-foreground">Aucun avis pour l'instant.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => <PublicReviewCard key={r.id} review={r} />)}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
