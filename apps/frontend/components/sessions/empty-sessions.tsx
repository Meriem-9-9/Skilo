import { Calendar, FolderClosed } from 'lucide-react';

interface EmptySessionsProps {
  tab: 'upcoming' | 'past';
}

export function EmptySessions({ tab }: EmptySessionsProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-card border border-border rounded-2xl shadow-sm">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        {tab === 'upcoming' ? <Calendar className="w-8 h-8 text-muted-foreground/50" /> : <FolderClosed className="w-8 h-8 text-muted-foreground/50" />}
      </div>
      <p className="font-semibold text-lg mb-1">
        {tab === 'upcoming' ? 'Aucune session à venir' : 'Aucune session passée'}
      </p>
      <p className="text-muted-foreground text-sm max-w-sm text-center">
        {tab === 'upcoming' ? 'Proposez une session à l\'un de vos matchs pour commencer à échanger !' : 'Vos sessions passées apparaîtront ici.'}
      </p>
    </div>
  );
}
