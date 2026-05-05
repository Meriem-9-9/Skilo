'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { usersApi, skillsApi, uploadApi, reviewsApi } from '@/lib/api';
import type {
  User, UserSkill, SkillCatalogItem, SkillLevel, SkillType, SkillCategory, Review
} from '@/lib/api';
import { 
  Monitor, Globe, Palette, Briefcase, Trophy, ChefHat, Sparkles, 
  Camera, CheckCircle2, AlertCircle, XCircle, X, GraduationCap, 
  BookOpen, BarChart3, Star, Coins, Medal, User as UserIcon, Plus,
  Loader2, Search, Award, MessageSquare
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

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

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star 
          key={i} 
          className={`w-3.5 h-3.5 ${i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} 
        />
      ))}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="p-6 border border-border/50 rounded-2xl bg-card/30 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden">
            {review.reviewer.avatarUrl ? (
              <img src={review.reviewer.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-black text-primary">
                {review.reviewer.firstName[0]}{review.reviewer.lastName?.[0]}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{review.reviewer.firstName} {review.reviewer.lastName}</p>
            <p className="text-[10px] text-muted-foreground font-medium">{formatDate(review.submittedAt)}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Stars rating={review.rating} />
          {review.skillCatalog && (
            <span className="text-[10px] font-black text-primary uppercase tracking-tighter">
              {review.skillCatalog.name}
            </span>
          )}
        </div>
      </div>

      {review.comment && (
        <p className="text-sm text-muted-foreground italic leading-relaxed">"{review.comment}"</p>
      )}

      {(review.ratingPedagogy || review.ratingPunctuality || review.ratingCommunication) && (
        <div className="flex flex-wrap gap-4 pt-3 border-t border-border/30">
          {review.ratingPedagogy && (
            <div className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Pédagogie: <span className="text-foreground">{review.ratingPedagogy}/5</span></span>
            </div>
          )}
          {review.ratingCommunication && (
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Comm.: <span className="text-foreground">{review.ratingCommunication}/5</span></span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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

function SkillChip({ skill, selected, disabled, onClick }: {
  skill: SkillCatalogItem;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (disabled && !selected) {
          toast.error("Cette compétence est déjà dans votre profil (offerte ou recherchée).");
          return;
        }
        onClick();
      }}
      className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all duration-200 active:scale-95 ${
        selected 
          ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
          : disabled 
            ? 'bg-muted/50 text-muted-foreground border-muted opacity-40 grayscale cursor-default' 
            : 'bg-card border-border hover:border-primary/50 hover:bg-primary/5'
      }`}
    >
      {skill.name}
    </button>
  );
}

function AddSkillModal({
  isOpen, onClose, type, existingSkillIds, onAdd
}: {
  isOpen: boolean;
  onClose: () => void;
  type: SkillType;
  existingSkillIds: string[];
  onAdd: (skill: SkillCatalogItem, level: SkillLevel) => Promise<void>;
}) {
  const [query, setQuery]       = useState('');
  const [allSkills, setAllSkills] = useState<SkillCatalogItem[]>([]);
  const [results, setResults]   = useState<SkillCatalogItem[]>([]);
  const [selected, setSelected] = useState<SkillCatalogItem | null>(null);
  const [level, setLevel]       = useState<SkillLevel>('beginner');
  const [loading, setLoading]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeCategory, setActiveCategory] = useState<SkillCategory | null>(null);

  // Initial load
  useEffect(() => {
    if (isOpen) {
      skillsApi.search('').then(setAllSkills).catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setSelected(null);
      setActiveCategory(null);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      skillsApi.search(query || "")
        .then(setResults)
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const visibleSkills = activeCategory 
    ? (query ? results : allSkills).filter(s => s.category === activeCategory)
    : (query ? results : allSkills);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] rounded-[2rem] p-0 overflow-hidden bg-background/80 backdrop-blur-xl border-border/50 shadow-2xl">
        <div className="p-8 space-y-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">
              Ajouter une compétence {type === 'offered' ? 'à enseigner' : 'à apprendre'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {!selected ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* Search */}
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
                    placeholder="Rechercher une compétence..."
                    className="w-full text-sm border border-border rounded-2xl pl-12 pr-4 py-4 bg-muted/20 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
                  />
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-2">
                  <button 
                    type="button" 
                    onClick={() => setActiveCategory(null)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                      activeCategory === null 
                        ? 'bg-foreground text-background border-foreground shadow-lg shadow-foreground/10' 
                        : 'bg-muted/30 border-border/50 text-muted-foreground hover:border-primary/30 hover:bg-muted/50'
                    }`}
                  >
                    Toutes
                  </button>
                  {CATEGORIES.map((cat) => (
                    <button 
                      key={cat.value} 
                      type="button"
                      onClick={() => setActiveCategory(cat.value === activeCategory ? null : cat.value)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        activeCategory === cat.value 
                          ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20' 
                          : 'bg-muted/30 border-border/50 text-muted-foreground hover:border-primary/30 hover:bg-muted/50'
                      }`}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>

                {/* Separator */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

                {/* Grid */}
                <div className="min-h-[200px] max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {loading && (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Recherche...</p>
                    </div>
                  )}
                  
                  {!loading && visibleSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-2 py-1">
                      {visibleSkills.map((r) => {
                        const isAlreadyAdded = existingSkillIds.includes(r.id);
                        return (
                          <SkillChip
                            key={r.id}
                            skill={r}
                            selected={false}
                            disabled={isAlreadyAdded}
                            onClick={() => setSelected(r)}
                          />
                        );
                      })}
                    </div>
                  ) : !loading && (
                    <div className="text-center py-12 opacity-60">
                      <Sparkles className="w-10 h-10 mx-auto mb-4 text-muted-foreground/30" />
                      <p className="text-xs font-bold uppercase tracking-widest">Aucun résultat</p>
                      <p className="text-[10px] text-muted-foreground mt-2">Essayez un autre mot-clé ou catégorie.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/10 border-2 border-primary/20 animate-in zoom-in duration-300">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-background rounded-xl border border-primary/20 shadow-sm">
                    {CATEGORIES.find((c) => c.value === selected.category)?.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none mb-1">Sélectionné</span>
                    <span className="text-base font-black">{selected.name}</span>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => { setSelected(null); setQuery(''); }} 
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg bg-background border border-border hover:bg-muted transition-colors shadow-sm"
                >
                  Changer
                </button>
              </div>
            )}

            {selected && (
              <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Votre niveau</label>
                <div className="grid grid-cols-3 gap-2">
                  {LEVELS.map((l) => (
                    <button
                      key={l.value}
                      type="button"
                      onClick={() => setLevel(l.value)}
                      className={`text-xs py-3 rounded-xl border-2 font-bold transition-all ${
                        level === l.value
                          ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                          : 'border-border bg-muted/10 hover:border-primary/40'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 rounded-xl h-12 font-bold"
              >
                Annuler
              </Button>
              <Button
                type="button"
                disabled={!selected || submitting}
                onClick={async () => { 
                  if (selected) { 
                    setSubmitting(true);
                    try {
                      await onAdd(selected, level); 
                      onClose(); 
                    } finally {
                      setSubmitting(false);
                    }
                  } 
                }}
                className="flex-1 rounded-xl h-12 font-bold shadow-lg shadow-primary/20"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Ajout...</span>
                  </div>
                ) : (
                  "Ajouter"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
  onAdd: (skill: SkillCatalogItem, level: SkillLevel) => Promise<void>;
  allSkills: UserSkill[];
}) {
  const [showAdd, setShowAdd] = useState(false);
  // Pass all skill IDs to prevent adding a skill as both offered and wanted
  const allSkillIds = allSkills.map((s) => s.skillCatalog.id);

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
            <Select
              value={s.level}
              onValueChange={(val) => onLevelChange(s.id, val as SkillLevel)}
            >
              <SelectTrigger className={`w-[130px] h-8 text-[10px] font-bold uppercase tracking-wider rounded-full border-0 focus:ring-1 focus:ring-primary ${LEVEL_COLORS[s.level]}`}>
                <SelectValue placeholder="Niveau" />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map((l) => (
                  <SelectItem key={l.value} value={l.value} className="text-xs font-medium">
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

      {skills.length < MAX_SKILLS && (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="w-full text-sm py-3 rounded-2xl border-2 border-dashed border-border hover:border-primary hover:text-primary transition-all text-muted-foreground font-bold flex items-center justify-center gap-2 group hover:bg-primary/5"
        >
          <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
          Ajouter une compétence
        </button>
      )}

      <AddSkillModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        type={type}
        existingSkillIds={allSkillIds}
        onAdd={onAdd}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user: authUser, updateUser } = useAuth();

  const [profile,  setProfile]  = useState<(User & { skills: UserSkill[] }) | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [city,      setCity]      = useState('');
  const [bio,       setBio]       = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [skills,    setSkills]    = useState<UserSkill[]>([]);
  const [reviews,   setReviews]   = useState<Review[]>([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      usersApi.me(),
      reviewsApi.forUser('me') // 'me' is handled by the backend reviews controller if it exists, or I should use authUser.id
    ])
      .then(([userData, reviewData]) => {
        setProfile(userData);
        setFirstName(userData.firstName);
        setLastName(userData.lastName);
        setCity(userData.city ?? '');
        setBio(userData.bio ?? '');
        setAvatarUrl(userData.avatarUrl ?? '');
        setSkills(userData.skills);
        setReviews(reviewData.data);
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSaveInfo() {
    setSaving(true);
    try {
      const res = await usersApi.updateMe({ firstName, lastName, city: city || undefined, bio: bio || undefined, avatarUrl: avatarUrl || undefined });
      setProfile((prev) => prev ? { ...prev, ...res.user } : null);
      updateUser(res.user); 
      toast.success('Profil mis à jour avec succès');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddSkill(type: SkillType, skill: SkillCatalogItem, level: SkillLevel) {
    try {
      const res = await usersApi.addSkill({ skillId: skill.id, type, level });
      setSkills((prev) => [...prev, res.skill]);
      toast.success(`Compétence "${skill.name}" ajoutée`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de l\'ajout.');
    }
  }

  async function handleRemoveSkill(userSkillId: string) {
    try {
      await usersApi.removeSkill(userSkillId);
      setSkills((prev) => prev.filter((s) => s.id !== userSkillId));
      toast.success('Compétence supprimée');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Impossible de supprimer. La compétence est liée à une session.');
    }
  }

  async function handleLevelChange(userSkillId: string, level: SkillLevel) {
    try {
      const res = await usersApi.updateSkillLevel(userSkillId, level);
      setSkills((prev) => prev.map((s) => s.id === userSkillId ? { ...s, level: res.skill.level } : s));
      toast.success('Niveau mis à jour');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de la mise à jour.');
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

  if (!profile) return null;

  return (
    <div className="max-w-6xl space-y-10">

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Info & Stats */}
        <div className="space-y-8">
          <section className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-primary" /> Informations générales
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

            <button
              type="button"
              onClick={handleSaveInfo}
              disabled={saving}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-60 transition-opacity shadow-sm hover:bg-primary/90"
            >
              {saving ? 'Sauvegarde…' : 'Sauvegarder les informations'}
            </button>
          </section>

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
            {profile.hasBadgeFiable ? (
              <div className="mt-6 flex items-center gap-2 justify-center text-sm bg-amber-500/10 text-amber-700 py-3 rounded-xl font-bold border border-amber-500/20 shadow-sm animate-in zoom-in duration-500">
                <Medal className="w-5 h-5 text-amber-600" />
                <span>Badge Fiable obtenu</span>
              </div>
            ) : (
              <div className="mt-6 p-5 bg-muted/20 border border-dashed border-border rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Medal className="w-3.5 h-3.5" /> Objectif Badge Fiable
                  </p>
                  <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full">En cours</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                    <span className={profile.sessionsCompleted >= 5 ? "text-emerald-500" : "text-muted-foreground"}>
                      Sessions: {profile.sessionsCompleted}/5
                    </span>
                    <span className={Number(profile.avgRating || 0) >= 4 ? "text-emerald-500" : "text-muted-foreground"}>
                      Note: {profile.avgRating ? Number(profile.avgRating).toFixed(1) : '—'}/4.0
                    </span>
                  </div>
                  <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all duration-1000" 
                      style={{ width: `${Math.min(100, (profile.sessionsCompleted / 5) * 100)}%` }} 
                    />
                  </div>
                </div>
                <p className="text-[9px] text-muted-foreground leading-tight italic">
                  Terminez 5 sessions avec une moyenne de 4.0 pour obtenir ce badge.
                </p>
              </div>
            )}
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

      {/* Reviews Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
            Avis reçus <span className="text-muted-foreground font-medium ml-1">({reviews.length})</span>
          </h2>
        </div>

        {reviews.length === 0 ? (
          <div className="p-16 text-center bg-card border border-border rounded-[2.5rem] shadow-sm">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Star className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <p className="text-lg font-bold text-muted-foreground uppercase tracking-widest">Aucun avis pour l'instant</p>
            <p className="text-sm text-muted-foreground mt-2">Participez à des sessions pour recevoir vos premières évaluations !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
          </div>
        )}
      </section>

    </div>
  );
}
