import { Zap, Target, Sparkles } from 'lucide-react';
import type { User } from '@/lib/api';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '@/app/(dashboard)/matches/[id]/utils';

interface MatchSkillsSectionProps {
  user: {
    skills: any[];
  };
}

export function MatchSkillsSection({ user }: MatchSkillsSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* User's Offered Skills */}
      <div className="bg-card border border-border rounded-[2.5rem] p-8 space-y-6 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" /> Ses points forts
        </h3>
        <div className="space-y-3">
          {user.skills?.filter(s => s.type === 'offered').map((s: any, i: number) => {
            const Icon = CATEGORY_ICONS[s.skillCatalog.category] || Sparkles;
            return (
              <div key={s.id || `offered-${i}`} className="flex items-center gap-4 p-4 rounded-2xl border border-border/50 hover:bg-muted/30 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${CATEGORY_COLORS[s.skillCatalog.category]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-foreground">{s.skillCatalog.name}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{s.level}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* User's Interests */}
      <div className="bg-card border border-border rounded-[2.5rem] p-8 space-y-6 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
          <Target className="w-4 h-4 text-red-500" /> Ce qu'il cherche
        </h3>
        <div className="space-y-3">
          {user.skills?.filter(s => s.type === 'wanted').map((s: any, i: number) => {
            const Icon = CATEGORY_ICONS[s.skillCatalog.category] || Sparkles;
            return (
              <div key={s.id || `wanted-${i}`} className="flex items-center gap-4 p-4 rounded-2xl border border-border/50 hover:bg-muted/30 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${CATEGORY_COLORS[s.skillCatalog.category]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-foreground">{s.skillCatalog.name}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-red-500">{s.level}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
