import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { UserSkill, SkillCatalogItem, SkillLevel, SkillType } from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddSkillModal } from './add-skill-modal';
import { CATEGORIES, LEVEL_COLORS, LEVELS, MAX_SKILLS } from '@/app/(dashboard)/profile/utils';

interface SkillsSectionProps {
  title: string;
  type: SkillType;
  skills: UserSkill[];
  onRemove: (id: string) => void;
  onLevelChange: (id: string, level: SkillLevel) => void;
  onAdd: (skill: SkillCatalogItem, level: SkillLevel) => Promise<void>;
  allSkills: UserSkill[];
}

export function SkillsSection({
  title, type, skills, onRemove, onLevelChange, onAdd, allSkills,
}: SkillsSectionProps) {
  const [showAdd, setShowAdd] = useState(false);
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
