import { Monitor, Globe, Palette, Briefcase, Trophy, ChefHat, Sparkles } from 'lucide-react';

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
