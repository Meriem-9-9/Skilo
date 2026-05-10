import { Calendar, Archive } from 'lucide-react';
import type { SessionStatus } from '@/lib/api';
import { STATUS_CONFIG } from '@/app/(dashboard)/sessions/utils';

interface SessionFiltersProps {
  tab: 'upcoming' | 'past';
  setTab: (tab: 'upcoming' | 'past') => void;
  statusFilter: SessionStatus | '';
  setStatusFilter: (status: SessionStatus | '') => void;
}

export function SessionFilters({
  tab, setTab, statusFilter, setStatusFilter
}: SessionFiltersProps) {
  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-muted/50 p-1 rounded-2xl w-fit border border-border/50">
        {(['upcoming', 'past'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t === 'upcoming' ? <Calendar className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
            {t === 'upcoming' ? 'À venir' : 'Passées'}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${statusFilter === '' ? 'bg-foreground text-background border-foreground' : 'bg-card text-muted-foreground border-border hover:border-muted-foreground/30'}`}
        >
          Tous
        </button>
        {(tab === 'upcoming' ? ['pending', 'confirmed'] : ['completed', 'cancelled']).map((s) => {
          const status = s as SessionStatus;
          const cfg = STATUS_CONFIG[status];
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${statusFilter === status ? 'bg-foreground text-background border-foreground' : 'bg-card text-muted-foreground border-border hover:border-muted-foreground/30'}`}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
