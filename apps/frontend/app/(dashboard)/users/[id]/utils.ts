import { Monitor, Globe, Palette, Briefcase, Trophy, ChefHat, Sparkles } from 'lucide-react';

export const LEVEL_LABELS: Record<string, string> = {
  beginner:     'Débutant',
  intermediate: 'Intermédiaire',
  advanced:     'Avancé',
};

export const LEVEL_COLORS: Record<string, string> = {
  beginner:     'bg-green-100 text-green-700',
  intermediate: 'bg-blue-100 text-blue-700',
  advanced:     'bg-purple-100 text-purple-700',
};

export const CATEGORY_ICONS: Record<string, any> = {
  tech: Monitor,
  languages: Globe,
  arts: Palette,
  business: Briefcase,
  sport: Trophy,
  cooking: ChefHat,
  other: Sparkles,
};

export const CATEGORY_COLORS: Record<string, string> = {
  tech: 'bg-blue-100 text-blue-700',
  languages: 'bg-emerald-100 text-emerald-700',
  arts: 'bg-pink-100 text-pink-700',
  business: 'bg-amber-100 text-amber-700',
  sport: 'bg-indigo-100 text-indigo-700',
  cooking: 'bg-orange-100 text-orange-700',
  other: 'bg-purple-100 text-purple-700',
};

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
