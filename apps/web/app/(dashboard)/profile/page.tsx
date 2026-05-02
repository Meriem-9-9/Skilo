'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
  usersApi, skillsApi, uploadApi,
  User, UserSkill, SkillCatalogItem, SkillLevel, SkillType, SkillCategory,
} from '@/lib/api';
import { 
  Monitor, Globe, Palette, Briefcase, Trophy, ChefHat, Sparkles, 
  Camera, CheckCircle2, AlertCircle, XCircle, X, GraduationCap, 
  BookOpen, BarChart3, Star, Coins, Medal 
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const LEVELS: { value: SkillLevel; label: string }[] = [
  { value: 'beginner',     label: 'Débutant' },
  { value: 'intermediate', label: 'Intermédiaire' },
  { value: 'advanced',     label: 'Avancé' },
];

const LEVEL_COLORS: Record<SkillLevel, string> = {
  beginner:     'bg-green-100 text-green-700',
  intermediate: 'bg-blue-100 text-blue-700',
  advanced:     'bg-purple-100 text-purple-700',
};

const CATEGORIES: { value: SkillCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'tech',      label: 'Tech',      icon: <Monitor className="w-4 h-4" /> },
  { value: 'languages', label: 'Langues',   icon: <Globe className="w-4 h-4" /> },
  { value: 'arts',      label: 'Arts',      icon: <Palette className="w-4 h-4" /> },
  { value: 'business',  label: 'Business',  icon: <Briefcase className="w-4 h-4" /> },
  { value: 'sport',     label: 'Sport',     icon: <Trophy className="w-4 h-4" /> },
  { value: 'cooking',   label: 'Cuisine',   icon: <ChefHat className="w-4 h-4" /> },
  { value: 'other',     label: 'Autre',     icon: <Sparkles className="w-4 h-4" /> },
];

const BIO_MAX = 280;
const MAX_SKILLS = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_MB = 5;

// ─── Profile strength ─────────────────────────────────────────────────────────

function StrengthBar({ score }: { score: number }) {
  const color = score >= 71 ? 'bg-green-500' : score >= 41 ? 'bg-amber-500' : 'bg-destructive';
  
  let Icon = XCircle;
  let labelText = 'Incomplet';
  let textColor = 'text-destructive';
  if (score >= 71) {
    Icon = CheckCircle2;
    labelText = 'Complet';
    textColor = 'text-green-600';
  } else if (score >= 41) {
    Icon = AlertCircle;
    labelText = 'Partiel';
    textColor = 'text-amber-600';
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 text-xs">
        <span className="font-semibold text-muted-foreground uppercase tracking-wider">Force du profil</span>
        <div className={`flex items-center gap-1.5 font-semibold ${textColor}`}>
          <span>{score}/100 · {labelText}</span>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div className={`h-2 rounded-full transition-all duration-500 ${color}`} style={{ width: `${score}%` }} />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>Photo +20</span>
        <span>Bio +20</span>
        <span>3 skills offerts +30</span>
        <span>3 skills cherchés +30</span>
      </div>
    </div>
  );
}

// ─── Avatar upload ────────────────────────────────────────────────────────────

function AvatarUpload({
  currentUrl, firstName, lastName, onUploaded,
}: {
  currentUrl?: string; firstName: string; lastName: string; onUploaded: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview]   = useState(currentUrl ?? '');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const initials = [firstName[0], lastName[0]].join('').toUpperCase();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Formats acceptés : JPG, PNG, WebP.');
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`Photo max ${MAX_FILE_MB} Mo.`);
      return;
    }
    setError(null);
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    try {
      const { avatarUrl } = await uploadApi.avatar(file);
      setPreview(avatarUrl);
      onUploaded(avatarUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload échoué.');
      setPreview(currentUrl ?? '');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={loading}
        className="relative w-24 h-24 rounded-full border-2 border-dashed border-border hover:border-primary transition-colors overflow-hidden bg-muted flex items-center justify-center"
      >
        {preview
          ? <img src={preview} alt="avatar" className="w-full h-full object-cover" />
          : <span className="text-2xl font-bold text-primary">{initials}</span>
        }
        {loading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-xs">Upload…</span>
          </div>
        )}
        <div className="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-2 border-background">
          <Camera className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
      </button>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
      <p className="text-xs text-muted-foreground text-center">JPG, PNG, WebP · max {MAX_FILE_MB} Mo</p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── Skill add panel ──────────────────────────────────────────────────────────

function AddSkillPanel({
  type, existingSkillIds, onAdd, onClose,
}: {
  type: SkillType;
  existingSkillIds: string[];
  onAdd: (skill: SkillCatalogItem, level: SkillLevel) => void;
  onClose: () => void;
}) {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState<SkillCatalogItem[]>([]);
  const [selected, setSelected] = useState<SkillCatalogItem | null>(null);
  const [level, setLevel]       = useState<SkillLevel>('beginner');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      skillsApi.search(query)
        .then(setResults)
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="border border-border rounded-xl p-4 bg-muted/30 space-y-3">
      <h4 className="text-sm font-semibold">
        Ajouter une compétence {type === 'offered' ? 'à enseigner' : 'à apprendre'}
      </h4>

      <input
        autoFocus
        value={query}
        onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
        placeholder="Rechercher (ex: JavaScript, Photoshop…)"
        className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
      />

      {selected ? (
        <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20">
          <span className="text-sm font-semibold">{selected.name}</span>
          <button type="button" onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted/50 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="max-h-40 overflow-y-auto space-y-1">
          {loading && <p className="text-xs text-muted-foreground p-2">Recherche…</p>}
          {!loading && results.filter((r) => !existingSkillIds.includes(r.id)).slice(0, 8).map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => { setSelected(r); setQuery(r.name); }}
              className="w-full text-left text-sm px-3 py-2.5 rounded-xl hover:bg-muted transition-colors flex items-center gap-3 font-medium"
            >
              <div className="text-muted-foreground bg-background p-1.5 rounded-md border border-border/50">
                {CATEGORIES.find((c) => c.value === r.category)?.icon}
              </div>
              {r.name}
            </button>
          ))}
          {!loading && results.length === 0 && query.length >= 2 && (
            <p className="text-xs text-muted-foreground p-2">Aucun résultat. Vous pouvez créer cette compétence.</p>
          )}
        </div>
      )}

      {selected && (
        <div>
          <label className="text-xs font-medium block mb-1">Niveau</label>
          <div className="flex gap-2">
            {LEVELS.map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => setLevel(l.value)}
                className={`flex-1 text-xs py-1.5 rounded-lg border font-medium transition-colors ${
                  level === l.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:border-primary'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 text-sm py-2 rounded-lg border border-border hover:bg-muted transition-colors"
        >
          Annuler
        </button>
        <button
          type="button"
          disabled={!selected}
          onClick={() => { if (selected) { onAdd(selected, level); onClose(); } }}
          className="flex-1 text-sm py-2 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50 transition-opacity"
        >
          Ajouter
        </button>
      </div>
    </div>
  );
}

// ─── Skills section ───────────────────────────────────────────────────────────

function SkillsSection({
  title, type, skills, onRemove, onLevelChange, onAdd, allSkills,
}: {
  title: string;
  type: SkillType;
  skills: UserSkill[];
  onRemove: (id: string) => void;
  onLevelChange: (id: string, level: SkillLevel) => void;
  onAdd: (skill: SkillCatalogItem, level: SkillLevel) => void;
  allSkills: UserSkill[];
}) {
  const [showAdd, setShowAdd] = useState(false);
  // Pass all skill IDs to prevent adding a skill as both offered and wanted
  const allSkillIds = allSkills.map((s) => s.skillCatalogId);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground">{skills.length}/{MAX_SKILLS}</span>
      </div>

      {skills.length === 0 && !showAdd && (
        <p className="text-xs text-muted-foreground py-2">Aucune compétence ajoutée.</p>
      )}

      <div className="space-y-2">
        {skills.map((s) => (
          <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{s.skillCatalog.name}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground capitalize mt-0.5">
                {CATEGORIES.find((c) => c.value === s.skillCatalog.category)?.icon}
                <span>{s.skillCatalog.category}</span>
              </div>
            </div>
            <select
              value={s.level}
              onChange={(e) => onLevelChange(s.id, e.target.value as SkillLevel)}
              className={`text-xs font-medium px-2 py-1 rounded-full border-0 focus:outline-none focus:ring-1 focus:ring-primary ${LEVEL_COLORS[s.level]}`}
            >
              {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
            <button
              type="button"
              onClick={() => onRemove(s.id)}
              className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-md hover:bg-destructive/10 ml-1"
              title="Supprimer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {showAdd
        ? <AddSkillPanel type={type} existingSkillIds={allSkillIds} onAdd={onAdd} onClose={() => setShowAdd(false)} />
        : skills.length < MAX_SKILLS && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="w-full text-sm py-2.5 rounded-xl border border-dashed border-border hover:border-primary hover:text-primary transition-colors text-muted-foreground"
          >
            + Ajouter une compétence
          </button>
        )
      }
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user: authUser } = useAuth();

  const [profile,  setProfile]  = useState<(User & { skills: UserSkill[] }) | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [city,      setCity]      = useState('');
  const [bio,       setBio]       = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [skills,    setSkills]    = useState<UserSkill[]>([]);

  useEffect(() => {
    usersApi.me()
      .then((data) => {
        setProfile(data);
        setFirstName(data.firstName);
        setLastName(data.lastName);
        setCity(data.city ?? '');
        setBio(data.bio ?? '');
        setAvatarUrl(data.avatarUrl ?? '');
        setSkills(data.skills);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSaveInfo() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const updated = await usersApi.updateMe({ firstName, lastName, city: city || undefined, bio: bio || undefined, avatarUrl: avatarUrl || undefined });
      setProfile((prev) => prev ? { ...prev, ...updated } : null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddSkill(type: SkillType, skill: SkillCatalogItem, level: SkillLevel) {
    try {
      const res = await usersApi.addSkill({ skillId: skill.id, type, level });
      setSkills((prev) => [...prev, res.skill]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'ajout.');
    }
  }

  async function handleRemoveSkill(userSkillId: string) {
    try {
      await usersApi.removeSkill(userSkillId);
      setSkills((prev) => prev.filter((s) => s.id !== userSkillId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de supprimer. La compétence est liée à une session.');
    }
  }

  async function handleLevelChange(userSkillId: string, level: SkillLevel) {
    try {
      const res = await usersApi.updateSkillLevel(userSkillId, level);
      setSkills((prev) => prev.map((s) => s.id === userSkillId ? { ...s, level: res.skill.level } : s));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la mise à jour.');
    }
  }

  // ── Derived ──────────────────────────────────────────────────────────────────

  const offeredSkills = skills.filter((s) => s.type === 'offered');
  const wantedSkills  = skills.filter((s) => s.type === 'wanted');

  // Recalculate profile score locally so it updates in real-time
  const localScore = (
    (avatarUrl     ? 20 : 0) +
    (bio.trim()    ? 20 : 0) +
    (offeredSkills.length >= 3 ? 30 : 0) +
    (wantedSkills.length  >= 3 ? 30 : 0)
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

  if (!profile) return <p className="text-destructive">{error}</p>;

  return (
    <div className="max-w-2xl space-y-6">

      <div>
        <h1 className="text-2xl font-bold">Mon profil</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Un profil complet améliore la qualité de vos matchs.
        </p>
      </div>

      {/* Strength bar */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <StrengthBar score={localScore} />
      </div>

      {/* Info card */}
      <section className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <User className="w-5 h-5 text-primary" /> Informations générales
        </h2>

        {/* Avatar */}
        <AvatarUpload
          currentUrl={avatarUrl}
          firstName={profile.firstName}
          lastName={profile.lastName}
          onUploaded={setAvatarUrl}
        />

        {/* Name */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">Prénom</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              maxLength={50}
              className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Nom</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              maxLength={50}
              className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* City */}
        <div className="space-y-1">
          <label className="text-xs font-medium">Ville <span className="text-muted-foreground">(optionnel)</span></label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            maxLength={100}
            placeholder="Ex: Casablanca"
            className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Bio */}
        <div className="space-y-1">
          <label className="text-xs font-medium">Bio <span className="text-muted-foreground">(optionnel)</span></label>
          <textarea
            value={bio}
            onChange={(e) => { if (e.target.value.length <= BIO_MAX) setBio(e.target.value); }}
            rows={4}
            placeholder="Parlez de votre parcours, vos passions…"
            className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
          <p className={`text-xs text-right ${bio.length >= BIO_MAX ? 'text-destructive' : 'text-muted-foreground'}`}>
            {bio.length}/{BIO_MAX}
          </p>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}
        {success && <p className="text-xs text-green-600">✓ Profil mis à jour avec succès.</p>}

        <button
          type="button"
          onClick={handleSaveInfo}
          disabled={saving}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-60 transition-opacity shadow-sm hover:bg-primary/90"
        >
          {saving ? 'Sauvegarde…' : 'Sauvegarder les informations'}
        </button>
      </section>

      {/* Skills offered */}
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

      {/* Skills wanted */}
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

      {/* Stats readonly */}
      <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" /> Statistiques
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-center">
          <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
            <p className="text-3xl font-black text-primary">{profile.sessionsCompleted}</p>
            <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wide">Sessions</p>
          </div>
          <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
            <div className="flex items-center justify-center gap-1">
              <p className="text-3xl font-black text-amber-500">
                {profile.avgRating ? Number(profile.avgRating).toFixed(1) : '—'}
              </p>
              <Star className="w-5 h-5 text-amber-500 fill-amber-500 -mt-1" />
            </div>
            <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wide">Note moy.</p>
          </div>
          <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
            <div className="flex items-center justify-center gap-1.5">
              <p className="text-3xl font-black text-emerald-500">{profile.creditBalance}</p>
              <Coins className="w-5 h-5 text-emerald-500 -mt-1" />
            </div>
            <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wide">Crédits</p>
          </div>
        </div>
        {profile.hasBadgeFiable && (
          <div className="mt-6 flex items-center gap-2 justify-center text-sm bg-amber-500/10 text-amber-700 py-3 rounded-xl font-bold border border-amber-500/20">
            <Medal className="w-5 h-5 text-amber-600" />
            <span>Badge Fiable obtenu</span>
          </div>
        )}
      </section>

    </div>
  );
}
