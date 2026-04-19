/**
 * components/profile/SkillBadge.tsx
 * Pill chip for a skill with an optional remove button.
 */

import type { UserSkill } from '@/types/api';
import { X } from 'lucide-react';

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
  expert: 'Expert',
};

interface SkillBadgeProps {
  skill: UserSkill;
  onRemove?: (id: string) => void;
  /** If true, renders the "offered" indigo style; otherwise violet for "wanted". */
  variant?: 'offered' | 'wanted';
  disabled?: boolean;
}

export function SkillBadge({
  skill,
  onRemove,
  variant,
  disabled = false,
}: SkillBadgeProps) {
  const type = variant ?? skill.type;
  const isOffered = type === 'offered';

  const colorClasses = isOffered
    ? 'border-indigo-100 bg-indigo-50 text-indigo-700'
    : 'border-violet-100 bg-violet-50 text-violet-700';

  const removeColorClasses = isOffered
    ? 'text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100'
    : 'text-violet-400 hover:text-violet-600 hover:bg-violet-100';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${colorClasses}`}
    >
      {skill.skillCatalog.name}
      <span className="opacity-60">
        · {LEVEL_LABELS[skill.level] ?? skill.level}
      </span>

      {onRemove && (
        <button
          type="button"
          aria-label={`Supprimer ${skill.skillCatalog.name}`}
          disabled={disabled}
          onClick={() => onRemove(skill.id)}
          className={`ml-0.5 flex h-4 w-4 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${removeColorClasses}`}
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </span>
  );
}
