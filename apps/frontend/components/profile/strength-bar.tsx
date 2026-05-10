import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

interface StrengthBarProps {
  score: number;
}

export function StrengthBar({ score }: StrengthBarProps) {
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
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
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
