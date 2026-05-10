import { SessionStatus } from '@/lib/api';
import { Calendar, Check, Archive, X, AlertTriangle } from 'lucide-react';

export const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string; icon: any }> = {
  pending:        { label: 'En attente',     color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Calendar },
  confirmed:      { label: 'Confirmée',      color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: Check },
  completed:      { label: 'Terminée',       color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Archive },
  auto_completed: { label: 'Auto-complétée', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Archive },
  cancelled:      { label: 'Annulée',        color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: X },
  disputed:       { label: 'Litige',         color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', icon: AlertTriangle },
};

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
  });
}
