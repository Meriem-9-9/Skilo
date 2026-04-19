'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { skillsApi, onboardingApi, uploadApi, SkillCatalogItem, SkillLevel, SkillCategory, User } from '@/lib/api';
import { FormError } from '@/components/auth/form-error';
import { useAuth } from '@/contexts/auth-context';

// ─── Constants ────────────────────────────────────────────────────────────────

interface SelectedSkill {
  skillId: string;
  name: string;
  level: SkillLevel;
}

const LEVELS: { value: SkillLevel; label: string }[] = [
  { value: 'beginner',     label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced',     label: 'Advanced' },
];

const CATEGORIES: { value: SkillCategory; label: string; emoji: string }[] = [
  { value: 'tech',      label: 'Tech',      emoji: '💻' },
  { value: 'languages', label: 'Languages', emoji: '🌍' },
  { value: 'arts',      label: 'Arts',      emoji: '🎨' },
  { value: 'business',  label: 'Business',  emoji: '📊' },
  { value: 'sport',     label: 'Sport',     emoji: '⚽' },
  { value: 'cooking',   label: 'Cooking',   emoji: '🍳' },
  { value: 'other',     label: 'Other',     emoji: '✨' },
];

const MAX_SKILLS = 5;
const BIO_MAX    = 280;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_MB   = 5;

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ currentStep, total }: { currentStep: number; total: number }) {
  const labels = ['Skills you offer', 'Skills you want', 'Your profile'];
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {labels.map((label, index) => {
        const step    = index + 1;
        const isActive = step === currentStep;
        const isDone   = step < currentStep;
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                isActive ? 'bg-primary text-primary-foreground'
                : isDone  ? 'bg-primary/20 text-primary'
                           : 'bg-muted text-muted-foreground'
              }`}>
                {isDone ? '✓' : step}
              </div>
              <span className={`text-xs hidden sm:block ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </div>
            {index < labels.length - 1 && (
              <div className={`w-12 h-0.5 mx-2 mb-4 transition-colors ${isDone ? 'bg-primary/40' : 'bg-muted'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Skill chip ───────────────────────────────────────────────────────────────

function SkillChip({ skill, selected, disabled, onClick }: {
  skill: SkillCatalogItem;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled && !selected}
      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
        selected  ? 'bg-primary text-primary-foreground border-primary'
        : disabled ? 'bg-muted text-muted-foreground border-muted cursor-not-allowed opacity-50'
                   : 'bg-background text-foreground border-border hover:border-primary hover:text-primary'
      }`}
    >
      {skill.name}
    </button>
  );
}

// ─── Selected skill row ───────────────────────────────────────────────────────

function SelectedSkillRow({ skill, onLevelChange, onRemove }: {
  skill: SelectedSkill;
  onLevelChange: (level: SkillLevel) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
      <span className="flex-1 text-sm font-medium">{skill.name}</span>
      <select
        value={skill.level}
        onChange={(e) => onLevelChange(e.target.value as SkillLevel)}
        className="text-sm border border-border rounded-md px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
      </select>
      <button
        type="button"
        onClick={onRemove}
        className="text-muted-foreground hover:text-destructive transition-colors text-lg leading-none"
        aria-label={`Remove ${skill.name}`}
      >×</button>
    </div>
  );
}

// ─── Skill selector step ──────────────────────────────────────────────────────

function SkillSelectorStep({ title, subtitle, selectedSkills, onToggle, onLevelChange, onRemove, disabledSkillIds }: {
  title: string;
  subtitle: string;
  selectedSkills: SelectedSkill[];
  onToggle: (skill: SkillCatalogItem) => void;
  onLevelChange: (skillId: string, level: SkillLevel) => void;
  onRemove: (skillId: string) => void;
  disabledSkillIds: string[];
}) {
  const [allSkills, setAllSkills]       = useState<SkillCatalogItem[]>([]);
  const [searchQuery, setSearchQuery]   = useState('');
  const [isSearching, setIsSearching]   = useState(false);
  const [activeCategory, setActiveCategory] = useState<SkillCategory | null>(null);

  useEffect(() => {
    skillsApi.search('').then(setAllSkills).catch(() => {});
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      skillsApi.search('').then(setAllSkills).catch(() => {});
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(() => {
      skillsApi.search(searchQuery).then(setAllSkills).catch(() => {}).finally(() => setIsSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const selectedIds  = new Set(selectedSkills.map((s) => s.skillId));
  const isMaxReached = selectedSkills.length >= MAX_SKILLS;
  const visibleSkills = activeCategory ? allSkills.filter((s) => s.category === activeCategory) : allSkills;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
      </div>

      <Input placeholder="Search skills…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setActiveCategory(null)}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${activeCategory === null ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:border-primary'}`}>
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button key={cat.value} type="button"
            onClick={() => setActiveCategory(cat.value === activeCategory ? null : cat.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${activeCategory === cat.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:border-primary'}`}>
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Chips */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">{isSearching ? 'Searching…' : `${visibleSkills.length} skill(s)`}</span>
          <span className={`text-xs font-medium ${isMaxReached ? 'text-destructive' : 'text-muted-foreground'}`}>
            {selectedSkills.length} / {MAX_SKILLS}
          </span>
        </div>

        {visibleSkills.length === 0 && !isSearching && (
          <p className="text-sm text-muted-foreground text-center py-4">No skills found.</p>
        )}

        <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto py-1">
          {visibleSkills.map((skill) => (
            <SkillChip
              key={skill.id}
              skill={skill}
              selected={selectedIds.has(skill.id)}
              disabled={isMaxReached || disabledSkillIds.includes(skill.id)}
              onClick={() => onToggle(skill)}
            />
          ))}
        </div>

        {disabledSkillIds.length > 0 && (
          <p className="text-xs text-amber-600 mt-2">⚠ Greyed-out skills are already in your other list.</p>
        )}
      </div>

      {/* Selected with level */}
      {selectedSkills.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Pick a level for each</Label>
          <div className="space-y-2">
            {selectedSkills.map((skill) => (
              <SelectedSkillRow
                key={skill.skillId}
                skill={skill}
                onLevelChange={(level) => onLevelChange(skill.skillId, level)}
                onRemove={() => onRemove(skill.skillId)}
              />
            ))}
          </div>
        </div>
      )}

      {isMaxReached && (
        <p className="text-xs text-destructive">Max {MAX_SKILLS} skills. Remove one to add another.</p>
      )}
    </div>
  );
}

// ─── Step 3: Profile info + avatar upload ─────────────────────────────────────

function ProfileStep({ city, bio, avatarUrl, onCityChange, onBioChange, onAvatarUrl }: {
  city: string;
  bio: string;
  avatarUrl: string;
  onCityChange: (v: string) => void;
  onBioChange: (v: string) => void;
  onAvatarUrl: (url: string) => void;
}) {
  const fileInputRef       = useRef<HTMLInputElement>(null);
  const [preview, setPreview]         = useState<string>(avatarUrl);
  const [uploading, setUploading]     = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side guard
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Accepted formats: JPG, PNG, WebP.');
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setUploadError(`Photo must be under ${MAX_FILE_MB} MB.`);
      return;
    }

    setUploadError(null);
    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    setUploading(true);
    try {
      const { avatarUrl: cloudUrl } = await uploadApi.avatar(file);
      onAvatarUrl(cloudUrl);
      setPreview(cloudUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed.');
      setPreview('');
      onAvatarUrl('');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">A bit about you</h2>
        <p className="text-muted-foreground text-sm mt-1">
          All fields are optional — you can always fill them in later.
        </p>
      </div>

      {/* Avatar upload */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative w-24 h-24 rounded-full border-2 border-dashed border-border hover:border-primary transition-colors overflow-hidden bg-muted flex items-center justify-center"
          disabled={uploading}
        >
          {preview ? (
            <img src={preview} alt="Avatar preview" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl text-muted-foreground">📷</span>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-xs">Uploading…</span>
            </div>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        <p className="text-xs text-muted-foreground text-center">
          Click to upload a photo<br />JPG, PNG or WebP · max {MAX_FILE_MB} MB
        </p>
        {uploadError && <p className="text-xs text-destructive text-center">{uploadError}</p>}
      </div>

      {/* City */}
      <div className="space-y-2">
        <Label htmlFor="city">City <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Input
          id="city"
          placeholder="e.g. Casablanca"
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          maxLength={100}
        />
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="bio">Bio <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Textarea
          id="bio"
          placeholder="Tell others what you're passionate about…"
          value={bio}
          onChange={(e) => { if (e.target.value.length <= BIO_MAX) onBioChange(e.target.value); }}
          rows={4}
        />
        <p className={`text-xs text-right ${bio.length >= BIO_MAX ? 'text-destructive' : 'text-muted-foreground'}`}>
          {bio.length} / {BIO_MAX}
        </p>
      </div>
    </div>
  );
}

// ─── Step 4: Congrats profile card ───────────────────────────────────────────

function CongratsStep({ user, offeredSkills, wantedSkills, onGoToDashboard }: {
  user: User | null;
  offeredSkills: SelectedSkill[];
  wantedSkills: SelectedSkill[];
  onGoToDashboard: () => void;
}) {
  const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('').toUpperCase();

  return (
    <div className="space-y-6 text-center">
      {/* Celebration header */}
      <div className="space-y-2">
        <div className="text-4xl">🎉</div>
        <h2 className="text-2xl font-bold">You're all set!</h2>
        <p className="text-muted-foreground text-sm">
          Here's how others will see your profile. Start exploring matches!
        </p>
      </div>

      {/* Profile card preview */}
      <div className="bg-muted/30 border border-border rounded-xl p-5 text-left space-y-4">
        {/* Avatar + name */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-primary">{initials || '?'}</span>
            )}
          </div>
          <div>
            <p className="font-semibold text-base">
              {user?.firstName} {user?.lastName}
            </p>
            {user?.city && (
              <p className="text-sm text-muted-foreground">📍 {user.city}</p>
            )}
          </div>
        </div>

        {/* Bio */}
        {user?.bio && (
          <p className="text-sm text-muted-foreground border-t border-border pt-3">{user.bio}</p>
        )}

        {/* Skills */}
        <div className="border-t border-border pt-3 space-y-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              🎓 Can teach
            </p>
            <div className="flex flex-wrap gap-1.5">
              {offeredSkills.map((s) => (
                <span key={s.skillId} className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {s.name} · {s.level}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              📚 Wants to learn
            </p>
            <div className="flex flex-wrap gap-1.5">
              {wantedSkills.map((s) => (
                <span key={s.skillId} className="px-2.5 py-0.5 rounded-full bg-secondary/50 text-secondary-foreground text-xs font-medium">
                  {s.name} · {s.level}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Credit badge */}
        <div className="border-t border-border pt-3 flex items-center gap-2">
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
            🪙 2 welcome credits
          </span>
          <span className="text-xs text-muted-foreground">ready to spend</span>
        </div>
      </div>

      <Button className="w-full" onClick={onGoToDashboard}>
        Explore matches →
      </Button>
    </div>
  );
}

// ─── Main onboarding form ─────────────────────────────────────────────────────

export function OnboardingForm() {
  const [step, setStep] = useState(1);

  const [offeredSkills, setOfferedSkills] = useState<SelectedSkill[]>([]);
  const [wantedSkills,  setWantedSkills]  = useState<SelectedSkill[]>([]);
  const [city,      setCity]      = useState('');
  const [bio,       setBio]       = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  // The user object we get back after completing onboarding
  const [finalUser, setFinalUser] = useState<User | null>(null);

  const { user, setOnboarded } = useAuth();
  const router = useRouter();

  // ── Skill helpers ───────────────────────────────────────────────────────────

  function toggleSkill(skill: SkillCatalogItem, list: SelectedSkill[], setList: React.Dispatch<React.SetStateAction<SelectedSkill[]>>) {
    const exists = list.find((s) => s.skillId === skill.id);
    if (exists) {
      setList(list.filter((s) => s.skillId !== skill.id));
    } else {
      if (list.length >= MAX_SKILLS) return;
      setList([...list, { skillId: skill.id, name: skill.name, level: 'beginner' }]);
    }
  }

  function changeLevel(skillId: string, level: SkillLevel, setList: React.Dispatch<React.SetStateAction<SelectedSkill[]>>) {
    setList((prev) => prev.map((s) => (s.skillId === skillId ? { ...s, level } : s)));
  }

  function removeSkill(skillId: string, setList: React.Dispatch<React.SetStateAction<SelectedSkill[]>>) {
    setList((prev) => prev.filter((s) => s.skillId !== skillId));
  }

  // ── Validation ──────────────────────────────────────────────────────────────

  function validateStep(): string | null {
    if (step === 1 && offeredSkills.length === 0) return 'Select at least one skill you can teach.';
    if (step === 2 && wantedSkills.length === 0)  return 'Select at least one skill you want to learn.';
    // Step 3 has no required fields
    return null;
  }

  function handleNext() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError(null);
    setStep((s) => s + 1);
  }

  // ── Submit to backend ────────────────────────────────────────────────────────

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await onboardingApi.complete({
        skillsOffered: offeredSkills.map((s) => ({ skillId: s.skillId, level: s.level })),
        skillsWanted:  wantedSkills.map((s)  => ({ skillId: s.skillId, level: s.level })),
        city:      city.trim()      || undefined,
        bio:       bio.trim()       || undefined,
        avatarUrl: avatarUrl        || undefined,
      });

      // Build the user object for the congrats card
      // Merge: what the backend returns + local state for fields that may not be in result.user yet
      setFinalUser({
        ...user,
        ...result.user,
        city:      city.trim()  || user?.city,
        bio:       bio.trim()   || user?.bio,
        avatarUrl: avatarUrl    || user?.avatarUrl,
      });

      setStep(4); // Congrats — setOnboarded() is called when user clicks the button
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const offeredIds = offeredSkills.map((s) => s.skillId);
  const wantedIds  = wantedSkills.map((s)  => s.skillId);

  // Step 4 is outside the normal step indicator
  if (step === 4) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <CongratsStep
            user={finalUser}
            offeredSkills={offeredSkills}
            wantedSkills={wantedSkills}
            onGoToDashboard={() => { setOnboarded(); router.push('/dashboard'); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <StepIndicator currentStep={step} total={3} />

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
        {step === 1 && (
          <SkillSelectorStep
            title="What can you teach?"
            subtitle="Select skills you're comfortable sharing. Up to 5."
            selectedSkills={offeredSkills}
            onToggle={(skill) => toggleSkill(skill, offeredSkills, setOfferedSkills)}
            onLevelChange={(id, level) => changeLevel(id, level, setOfferedSkills)}
            onRemove={(id) => removeSkill(id, setOfferedSkills)}
            disabledSkillIds={wantedIds}
          />
        )}

        {step === 2 && (
          <SkillSelectorStep
            title="What do you want to learn?"
            subtitle="Select skills you'd like to pick up from others. Up to 5."
            selectedSkills={wantedSkills}
            onToggle={(skill) => toggleSkill(skill, wantedSkills, setWantedSkills)}
            onLevelChange={(id, level) => changeLevel(id, level, setWantedSkills)}
            onRemove={(id) => removeSkill(id, setWantedSkills)}
            disabledSkillIds={offeredIds}
          />
        )}

        {step === 3 && (
          <ProfileStep
            city={city}
            bio={bio}
            avatarUrl={avatarUrl}
            onCityChange={setCity}
            onBioChange={setBio}
            onAvatarUrl={setAvatarUrl}
          />
        )}

        <FormError message={error} />

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          {step > 1 && (
            <Button type="button" variant="outline" className="flex-1"
              onClick={() => { setError(null); setStep((s) => s - 1); }}
              disabled={isSubmitting}>
              Back
            </Button>
          )}

          {step < 3 ? (
            <Button type="button" className="flex-1" onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button type="button" className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Setting up your profile…' : 'Complete setup'}
            </Button>
          )}
        </div>

        {step === 3 && (
          <p className="text-center text-xs text-muted-foreground">
            Everything on this step is optional — you can update it anytime from your profile.
          </p>
        )}
      </div>
    </div>
  );
}