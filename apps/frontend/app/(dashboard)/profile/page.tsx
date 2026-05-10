'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { usersApi, reviewsApi } from '@/lib/api';
import type {
  User, UserSkill, SkillCatalogItem, SkillLevel, SkillType, Review
} from '@/lib/api';
import {
  GraduationCap, BookOpen, Star
} from 'lucide-react';
import { toast } from 'sonner';

import { StrengthBar } from '@/components/profile/strength-bar';
import { ProfileInfoForm } from '@/components/profile/profile-info-form';
import { ProfileStats } from '@/components/profile/profile-stats';
import { BadgeProgress } from '@/components/profile/badge-progress';
import { SkillsSection } from '@/components/profile/skills-section';
import { ReviewsSection } from '@/components/profile/reviews-section';

export default function ProfilePage() {
  const { updateUser } = useAuth();

  const [profile, setProfile] = useState<(User & { skills: UserSkill[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [userData, reviewData] = await Promise.all([
          usersApi.me(),
          reviewsApi.forUser('me')
        ]);

        if (isMounted) {
          setProfile(userData);
          setFirstName(userData.firstName);
          setLastName(userData.lastName);
          setCity(userData.city ?? '');
          setBio(userData.bio ?? '');
          setAvatarUrl(userData.avatarUrl ?? '');
          setSkills(userData.skills);
          setReviews(reviewData.data);
        }
      } catch (e: any) {
        toast.error(e.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, []);

  async function handleSaveInfo() {
    setSaving(true);
    try {
      const res = await usersApi.updateMe({
        firstName,
        lastName,
        city: city || undefined,
        bio: bio || undefined,
        avatarUrl: avatarUrl || undefined
      });
      setProfile((prev) => prev ? { ...prev, ...res.user } : null);
      updateUser(res.user);
      toast.success('Profil mis à jour avec succès');
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddSkill(type: SkillType, skill: SkillCatalogItem, level: SkillLevel) {
    try {
      const res = await usersApi.addSkill({ skillId: skill.id, type, level });
      setSkills((prev) => [...prev, res.skill]);
      toast.success(`Compétence "${skill.name}" ajoutée`);
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de l\'ajout.');
    }
  }

  async function handleRemoveSkill(userSkillId: string) {
    try {
      await usersApi.removeSkill(userSkillId);
      setSkills((prev) => prev.filter((s) => s.id !== userSkillId));
      toast.success('Compétence supprimée');
    } catch (e: any) {
      toast.error(e.message || 'Impossible de supprimer. La compétence est liée à une session.');
    }
  }

  async function handleLevelChange(userSkillId: string, level: SkillLevel) {
    try {
      const res = await usersApi.updateSkillLevel(userSkillId, level);
      setSkills((prev) => prev.map((s) => s.id === userSkillId ? { ...s, level: res.skill.level } : s));
      toast.success('Niveau mis à jour');
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de la mise à jour.');
    }
  }

  // ── Derived ──────────────────────────────────────────────────────────────────

  const offeredSkills = skills.filter((s) => s.type === 'offered');
  const wantedSkills = skills.filter((s) => s.type === 'wanted');

  const localScore = (
    (avatarUrl ? 20 : 0) +
    (bio.trim() ? 20 : 0) +
    (offeredSkills.length >= 3 ? 30 : 0) +
    (wantedSkills.length >= 3 ? 30 : 0)
  );

  if (loading) {
    return (
      <div className="max-w-2xl space-y-4 animate-pulse">
        <div className="h-8 w-40 bg-muted rounded" />
        <div className="h-64 bg-muted rounded-xl" />
        <div className="h-48 bg-muted rounded-xl" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-6xl space-y-10">

      <div>
        <h1 className="text-2xl font-bold">Mon profil</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Un profil complet améliore la qualité de vos matchs.
        </p>
      </div>

      <StrengthBar score={localScore} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Info & Stats */}
        <div className="space-y-8">
          <ProfileInfoForm
            profile={profile}
            firstName={firstName} setFirstName={setFirstName}
            lastName={lastName} setLastName={setLastName}
            city={city} setCity={setCity}
            bio={bio} setBio={setBio}
            avatarUrl={avatarUrl} setAvatarUrl={setAvatarUrl}
            onSave={handleSaveInfo}
            saving={saving}
          />

          <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <ProfileStats profile={profile} />
            <BadgeProgress profile={profile} />
          </section>
        </div>

        {/* Right Column: Skills */}
        <div className="space-y-8">
          <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" /> Compétences à enseigner
            </h2>
            <SkillsSection
              title="Ce que vous pouvez apprendre aux autres"
              type="offered"
              skills={offeredSkills}
              onRemove={handleRemoveSkill}
              onLevelChange={handleLevelChange}
              onAdd={(skill, level) => handleAddSkill('offered', skill, level)}
              allSkills={skills}
            />
          </section>

          <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> Compétences à apprendre
            </h2>
            <SkillsSection
              title="Ce que vous cherchez à maîtriser"
              type="wanted"
              skills={wantedSkills}
              onRemove={handleRemoveSkill}
              onLevelChange={handleLevelChange}
              onAdd={(skill, level) => handleAddSkill('wanted', skill, level)}
              allSkills={skills}
            />
          </section>
        </div>
      </div>

      <ReviewsSection reviews={reviews} />
    </div>
  );
}
