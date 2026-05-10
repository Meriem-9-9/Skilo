import { SessionStatus } from '@/lib/api';
import { Clock, Check, X, AlertTriangle } from 'lucide-react';

export const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string; icon: any }> = {
  pending:        { label: 'En attente',     color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Clock },
  confirmed:      { label: 'Confirmé',      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: Check },
  completed:      { label: 'Terminé',       color: 'bg-primary/10 text-primary border-primary/20', icon: Check },
  auto_completed: { label: 'Terminé',       color: 'bg-primary/10 text-primary border-primary/20', icon: Check },
  cancelled:      { label: 'Annulé',        color: 'bg-destructive/10 text-destructive border-destructive/20', icon: X },
  disputed:       { label: 'Litige',         color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: AlertTriangle },
};

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
