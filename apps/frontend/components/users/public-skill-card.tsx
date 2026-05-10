import { Sparkles } from 'lucide-react';
import type { UserSkill } from '@/lib/api';
import { CATEGORY_ICONS, CATEGORY_COLORS, LEVEL_LABELS } from '@/app/(dashboard)/users/[id]/utils';

interface PublicSkillCardProps {
  skill: UserSkill;
}

export function PublicSkillCard({ skill }: PublicSkillCardProps) {
  const Icon = CATEGORY_ICONS[skill.skillCatalog.category] || Sparkles;
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl border border-border/50 bg-card/50 hover:bg-card transition-colors">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${CATEGORY_COLORS[skill.skillCatalog.category]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-foreground text-sm truncate">{skill.skillCatalog.name}</p>
        <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${skill.type === 'offered' ? 'text-primary' : 'text-indigo-500'}`}>
          {LEVEL_LABELS[skill.level]}
        </p>
      </div>
    </div>
  );
}
