'use client';

import { useState, useEffect } from 'react';
import { SkillCatalogItem, SkillEntry, SkillLevel, skillsApi } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { X, CheckCircle2 } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const LEVELS: { value: SkillLevel; label: string; color: string }[] = [
  { value: 'beginner',     label: 'Beginner',     color: 'bg-blue-500/20 text-blue-400 border-blue-500/40 hover:bg-blue-500/30' },
  { value: 'intermediate', label: 'Intermediate',  color: 'bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30' },
  { value: 'advanced',     label: 'Advanced',      color: 'bg-green-500/20 text-green-400 border-green-500/40 hover:bg-green-500/30' },
];

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SelectedSkill extends SkillEntry {
  name: string;
  category: string;
}

interface SkillPickerProps {
  description: string;
  selected: SkillEntry[];
  onChange: (skills: SkillEntry[]) => void;
  max?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SkillPicker({ description, selected, onChange, max = 5 }: SkillPickerProps) {
  const [query, setQuery] = useState('');
  const [catalog, setCatalog] = useState<SkillCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Keep a local map of id→{name,category} so selected chips have labels
  const [skillMeta, setSkillMeta] = useState<Record<string, { name: string; category: string }>>({});

  // Fetch skills from backend (debounced by query)
  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await skillsApi.search(query.trim() || undefined);
        setCatalog(data);
        // Merge into meta map
        setSkillMeta((prev) => {
          const next = { ...prev };
          data.forEach((s) => { next[s.id] = { name: s.name, category: s.category }; });
          return next;
        });
      } catch {
        setCatalog([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const selectedIds = new Set(selected.map((s) => s.skillId));

  const toggleSkill = (skill: SkillCatalogItem) => {
    if (selectedIds.has(skill.id)) {
      // Deselect
      onChange(selected.filter((s) => s.skillId !== skill.id));
    } else {
      if (selected.length >= max) return;
      // Select with default level
      onChange([...selected, { skillId: skill.id, level: 'beginner' }]);
    }
  };

  const updateLevel = (skillId: string, level: SkillLevel) => {
    onChange(selected.map((s) => (s.skillId === skillId ? { ...s, level } : s)));
  };

  const removeSkill = (skillId: string) => {
    onChange(selected.filter((s) => s.skillId !== skillId));
  };

  // Group catalog by category
  const grouped = catalog.reduce<Record<string, SkillCatalogItem[]>>((acc, skill) => {
    const cat = skill.category ?? 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {});

  const selectedWithMeta: SelectedSkill[] = selected.map((s) => ({
    ...s,
    name: skillMeta[s.skillId]?.name ?? s.skillId,
    category: skillMeta[s.skillId]?.category ?? '',
  }));

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">{description}</p>

      {/* ── Search ── */}
      <Input
        placeholder="Search skills…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={selected.length >= max}
      />

      {/* ── Skill catalog as clickable badges ── */}
      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading skills…</p>
        ) : catalog.length === 0 ? (
          <p className="text-sm text-muted-foreground">No skills found.</p>
        ) : (
          Object.entries(grouped).map(([category, skills]) => (
            <div key={category}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                {category}
              </p>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => {
                  const isSelected = selectedIds.has(skill.id);
                  const isFull = selected.length >= max && !isSelected;
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      disabled={isFull}
                      onClick={() => toggleSkill(skill)}
                      className={[
                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-all',
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                          : 'border-border bg-muted/40 text-foreground hover:bg-muted hover:border-primary/50',
                        isFull ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
                      ].join(' ')}
                    >
                      {isSelected && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                      {skill.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Selected skills with level selector ── */}
      {selectedWithMeta.length > 0 && (
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">
              Selected{' '}
              <span className="text-muted-foreground font-normal">
                ({selected.length}/{max})
              </span>
            </p>
          </div>

          <div className="space-y-2">
            {selectedWithMeta.map((s) => (
              <div
                key={s.skillId}
                className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2"
              >
                {/* Skill name */}
                <span className="text-sm font-medium flex-1 truncate">{s.name}</span>

                {/* Level selector */}
                <div className="flex gap-1 shrink-0">
                  {LEVELS.map((l) => (
                    <button
                      key={l.value}
                      type="button"
                      onClick={() => updateLevel(s.skillId, l.value)}
                      className={[
                        'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all',
                        s.level === l.value
                          ? l.color
                          : 'border-border bg-transparent text-muted-foreground hover:bg-muted',
                      ].join(' ')}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeSkill(s.skillId)}
                  className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                  aria-label={`Remove ${s.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selected.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Select at least 1 skill (up to {max})
        </p>
      )}
    </div>
  );
}
