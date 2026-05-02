'use client';

import { useState, useEffect } from 'react';
import { skillsApi, SkillCatalogItem, SkillLevel, SkillCategory } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Monitor, Globe, Palette, Briefcase, Trophy, ChefHat, Sparkles, X, AlertTriangle } from 'lucide-react';

export interface SelectedSkill {
  skillId: string;
  name: string;
  level: SkillLevel;
}

const LEVELS: { value: SkillLevel; label: string }[] = [
  { value: 'beginner',     label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced',     label: 'Advanced' },
];

const CATEGORIES: { value: SkillCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'tech',      label: 'Tech',      icon: <Monitor className="w-3.5 h-3.5" /> },
  { value: 'languages', label: 'Languages', icon: <Globe className="w-3.5 h-3.5" /> },
  { value: 'arts',      label: 'Arts',      icon: <Palette className="w-3.5 h-3.5" /> },
  { value: 'business',  label: 'Business',  icon: <Briefcase className="w-3.5 h-3.5" /> },
  { value: 'sport',     label: 'Sport',     icon: <Trophy className="w-3.5 h-3.5" /> },
  { value: 'cooking',   label: 'Cooking',   icon: <ChefHat className="w-3.5 h-3.5" /> },
  { value: 'other',     label: 'Other',     icon: <Sparkles className="w-3.5 h-3.5" /> },
];

const MAX_SKILLS = 5;

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
        className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-md hover:bg-destructive/10"
        aria-label={`Remove ${skill.name}`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SkillSelectorStep({ title, subtitle, selectedSkills, onToggle, onLevelChange, onRemove, disabledSkillIds }: {
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${activeCategory === cat.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:border-primary'}`}>
            {cat.icon} {cat.label}
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
          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" /> Greyed-out skills are already in your other list.
          </p>
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
