/**
 * app/(dashboard)/profile/page.tsx
 *
 * Own profile page — lets the authenticated user:
 *   • View their complete profile (strength, skills, stats)
 *   • Edit bio, city, avatar URL inline
 *   • Add / remove / update skills
 *   • See their badge status
 *
 * Data:
 *   - useMe() → GET /users/me
 *   - updateProfile() → PATCH /users/me
 *   - addSkill / removeSkill / updateSkillLevel → skill endpoints
 *   - searchSkills() → GET /skills/search?q=
 *
 * Error handling:
 *   - Field-level errors from the server are surfaced below the form control.
 *   - Network errors show a toast (shadcn Sonner or your preferred library).
 *   - All HTTP errors are pre-logged by api-client.ts.
 *
 * TODO (onboarding):
 *   - Replace avatar URL input with a file upload once storage is configured (FC-02-03).
 *   - Add onboarding stepper — this page doubles as the post-registration flow.
 *   - Wire up `hasBadgeFiable` badge with its backend trigger conditions.
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AxiosError } from 'axios';

import { useAuth } from '@/contexts/AuthContext';
import { updateProfile, addSkill, removeSkill, updateSkillLevel, searchSkills } from '@/lib/api/users';
import { ProfileStrengthCard } from '@/components/dashboard/ProfileStrengthCard';
import { SkillBadge } from '@/components/profile/SkillBadge';
import { SkillSearch } from '@/components/profile/SkillSearch';
import { ReviewList } from '@/components/profile/ReviewList';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertCircle,
  CheckCircle2,
  Pencil,
  Shield,
  Sparkles,
  Star,
  X,
} from 'lucide-react';

// ─── Validation ───────────────────────────────────────────────────────────────

const profileSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis').max(50),
  lastName: z.string().min(1, 'Nom requis').max(50),
  city: z.string().max(100).nullable().optional(),
  bio: z.string().max(500, 'Bio trop longue (500 car. max)').nullable().optional(),
  avatarUrl: z
    .string()
    .url('URL invalide')
    .nullable()
    .optional()
    .or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user: authUser, loading: isLoading, updateUserInContext } = useAuth();
  const user = authUser as import('@/types/api').UserMe | null;
  const error = !isLoading && !user;
  const [editMode, setEditMode] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: user
      ? {
          firstName: user.firstName,
          lastName: user.lastName,
          city: user.city ?? '',
          bio: user.bio ?? '',
          avatarUrl: user.avatarUrl ?? '',
        }
      : undefined,
  });

  // ── Submit profile edits ─────────────────────────────────────────────────
  const onSubmit = async (data: ProfileFormValues) => {
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const res = await updateProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        city: data.city || null,
        bio: data.bio || null,
        avatarUrl: data.avatarUrl || null,
      } as any);
      updateUserInContext(res.user);
      setSaveSuccess(true);
      setEditMode(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setSaveError(
        axiosErr.response?.data?.message ?? 'Une erreur est survenue.',
      );
    }
  };

  const cancelEdit = () => {
    reset();
    setEditMode(false);
    setSaveError(null);
  };

  // ─── Loading / error states ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F7FF] p-8">
        <div className="mx-auto max-w-3xl space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Impossible de charger le profil. Rechargez la page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      {/* Header bar (reuse same as dashboard) */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-8">
          <h1 className="text-base font-semibold text-slate-800">Mon profil</h1>
          {!editMode ? (
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl gap-2"
              onClick={() => setEditMode(true)}
            >
              <Pencil className="h-3.5 w-3.5" /> Modifier
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={cancelEdit}>
                Annuler
              </Button>
              <Button
                size="sm"
                className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white"
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting || !isDirty}
              >
                {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-8">
        {/* Success/error banners */}
        {saveSuccess && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription>Profil mis à jour avec succès.</AlertDescription>
          </Alert>
        )}
        {saveError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}

        {/* ── Profile card ──────────────────────────────────────────────── */}
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="relative shrink-0">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.firstName}
                    className="h-20 w-20 rounded-2xl object-cover shadow ring-2 ring-white"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-100 text-3xl font-bold text-indigo-600 shadow">
                    {user?.firstName?.[0]}
                  </div>
                )}
                {user?.hasBadgeFiable && (
                  <span
                    title="Badge Fiable"
                    className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 shadow"
                  >
                    <Shield className="h-3.5 w-3.5 text-white" />
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl text-slate-900">
                  {user?.firstName} {user?.lastName}
                </CardTitle>
                {user?.city && (
                  <CardDescription className="mt-0.5">{user.city}</CardDescription>
                )}
                {/* Rating pills */}
                {user?.avgRating != null && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <RatingPill label="Global" value={user.avgRating} />
                    {user.avgPedagogy != null && (
                      <RatingPill label="Pédagogie" value={user.avgPedagogy} />
                    )}
                    {user.avgPunctuality != null && (
                      <RatingPill label="Ponctualité" value={user.avgPunctuality} />
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Edit form */}
            {editMode ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Prénom
                    </label>
                    <Input {...register('firstName')} className="rounded-xl" />
                    {errors.firstName && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Nom
                    </label>
                    <Input {...register('lastName')} className="rounded-xl" />
                    {errors.lastName && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Ville
                  </label>
                  <Input
                    {...register('city')}
                    placeholder="Paris, Lyon…"
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Bio{' '}
                    <span className="font-normal text-slate-400">(500 car. max)</span>
                  </label>
                  <Textarea
                    {...register('bio')}
                    rows={4}
                    placeholder="Parlez de vous, de ce que vous enseignez et apprenez…"
                    className="rounded-xl resize-none"
                  />
                  {errors.bio && (
                    <p className="mt-1 text-xs text-red-500">{errors.bio.message}</p>
                  )}
                </div>

                {/* TODO (onboarding): replace with file upload component once
                    the storage service is configured (FC-02-03). */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    URL de la photo de profil
                  </label>
                  <Input
                    {...register('avatarUrl')}
                    placeholder="https://…"
                    className="rounded-xl"
                  />
                  {errors.avatarUrl && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.avatarUrl.message}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* Read-only bio */
              user?.bio && (
                <p className="text-sm leading-relaxed text-slate-600">{user.bio}</p>
              )
            )}

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-4">
              <StatCell label="Sessions" value={user?.sessionsCompleted ?? 0} />
              <StatCell
                label="Crédits"
                value={(user?.creditBalance ?? 0) - (user?.creditReserved ?? 0)}
              />
              <StatCell label="Score profil" value={`${user?.profileScore ?? 0}%`} />
            </div>
          </CardContent>
        </Card>

        {/* ── Profile strength ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ProfileStrengthCard strength={user?.profileStrength} />

          {/* Credits detail */}
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-widest">
                Crédits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums text-slate-900">
                {user?.creditBalance ?? 0}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                dont {user?.creditReserved ?? 0} réservé
                {(user?.creditReserved ?? 0) !== 1 ? 's' : ''}
              </p>
              {/* TODO: "Acheter des crédits" button */}
            </CardContent>
          </Card>
        </div>

        {/* ── Skills ───────────────────────────────────────────────────── */}
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              Compétences
            </CardTitle>
            <CardDescription>
              Max 5 offertes · max 5 recherchées
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Offered skills */}
            <SkillSection
              label="J'enseigne"
              accent="indigo"
              skills={(user?.skills ?? []).filter((s: { type: string; }) => s.type === 'offered')}
              limit={5}
            />

            <Separator />

            {/* Wanted skills */}
            <SkillSection
              label="J'apprends"
              accent="violet"
              skills={(user?.skills ?? []).filter((s: { type: string; }) => s.type === 'wanted')}
              limit={5}
            />
          </CardContent>
        </Card>

        {/* ── Reviews ──────────────────────────────────────────────────── */}
        {/* Reviews on own profile come from getMe which doesn't return them —
            they're only on getPublicProfile. For now we show a placeholder.
            TODO (onboarding): add reviews to GET /users/me or fetch separately. */}
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-4 w-4 text-amber-500" />
              Avis reçus
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(user?.sessionsCompleted ?? 0) === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">
                Vos avis apparaîtront ici après vos premières sessions.
              </p>
            ) : (
              <p className="text-sm text-slate-400 text-center py-6">
                {/* TODO (onboarding): fetch reviews from GET /users/:id
                    or add a dedicated GET /users/me/reviews endpoint. */}
                Consultez votre profil public pour voir les avis.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RatingPill({ label, value }: { label: string; value: number }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
      {value.toFixed(1)} {label}
    </span>
  );
}

function StatCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold tabular-nums text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function SkillSection({
  label,
  accent,
  skills,
  limit,
}: {
  label: string;
  accent: 'indigo' | 'violet';
  skills: import('@/types/api').UserSkill[];
  limit: number;
}) {
  const [showSearch, setShowSearch] = useState(false);
  const [removeLoading, setRemoveLoading] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  const type = accent === 'indigo' ? 'offered' : 'wanted';
  const canAdd = skills.length < limit;

  const handleRemove = async (userSkillId: string) => {
    setRemoveLoading(userSkillId);
    try {
      await removeSkill(userSkillId);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      // Surface error in the UI; api-client already logged it
      alert(axiosErr.response?.data?.message ?? 'Impossible de supprimer cette compétence.');
    } finally {
      setRemoveLoading(null);
    }
  };

  const handleAdd = async (skillId: string, level: string) => {
    setAddError(null);
    try {
      await addSkill({ skillId, type, level });
      setShowSearch(false);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setAddError(axiosErr.response?.data?.message ?? "Erreur lors de l'ajout.");
    }
  };

  const accentClass =
    accent === 'indigo'
      ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
      : 'bg-violet-50 text-violet-700 border-violet-100';

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">
          {label}{' '}
          <span className="font-normal text-slate-400">
            ({skills.length}/{limit})
          </span>
        </p>
        {canAdd && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 rounded-lg px-2.5 text-xs text-indigo-600 hover:bg-indigo-50"
            onClick={() => setShowSearch((s) => !s)}
          >
            {showSearch ? 'Fermer' : '+ Ajouter'}
          </Button>
        )}
      </div>

      {/* Skill chips */}
      <div className="flex flex-wrap gap-2">
        {skills.map((s) => (
          <SkillBadge
            key={s.id}
            skill={s}
            onRemove={() => handleRemove(s.id)}
            disabled={removeLoading === s.id}
          />
        ))}
        {skills.length === 0 && !showSearch && (
          <p className="text-xs text-slate-400 italic">
            Aucune compétence ajoutée.
          </p>
        )}
      </div>

      {/* Inline skill search */}
      {showSearch && (
        <div className="mt-3">
          {addError && (
            <p className="mb-2 text-xs text-red-500">{addError}</p>
          )}
          <SkillSearch type={type} onAdd={handleAdd} />
        </div>
      )}
    </div>
  );
}
