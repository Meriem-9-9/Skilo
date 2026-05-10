import { useState, useEffect } from 'react';
import { Search, Loader2, Sparkles } from 'lucide-react';
import { skillsApi } from '@/lib/api';
import type { SkillCatalogItem, SkillLevel, SkillType, SkillCategory } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { CATEGORIES, LEVELS } from '@/app/(dashboard)/profile/utils';

interface SkillChipProps {
  skill: SkillCatalogItem;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}

function SkillChip({ skill, selected, disabled, onClick }: SkillChipProps) {
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

interface AddSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: SkillType;
  existingSkillIds: string[];
  onAdd: (skill: SkillCatalogItem, level: SkillLevel) => Promise<void>;
}

export function AddSkillModal({
  isOpen, onClose, type, existingSkillIds, onAdd
}: AddSkillModalProps) {
  const [query, setQuery]       = useState('');
  const [allSkills, setAllSkills] = useState<SkillCatalogItem[]>([]);
  const [results, setResults]   = useState<SkillCatalogItem[]>([]);
  const [selected, setSelected] = useState<SkillCatalogItem | null>(null);
  const [level, setLevel]       = useState<SkillLevel>('beginner');
  const [loading, setLoading]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeCategory, setActiveCategory] = useState<SkillCategory | null>(null);

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

                <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

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
