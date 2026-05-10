import { SkillLevel, SkillCategory } from '@/lib/api';
import React from 'react';
import { Monitor, Globe, Palette, Briefcase, Trophy, ChefHat, Sparkles } from 'lucide-react';

export const LEVELS: { value: SkillLevel; label: string }[] = [
  { value: 'beginner',     label: 'Débutant' },
  { value: 'intermediate', label: 'Intermédiaire' },
  { value: 'advanced',     label: 'Avancé' },
];

export const LEVEL_COLORS: Record<SkillLevel, string> = {
  beginner:     'bg-green-100 text-green-700',
  intermediate: 'bg-blue-100 text-blue-700',
  advanced:     'bg-purple-100 text-purple-700',
};

export const CATEGORIES: { value: SkillCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'tech',      label: 'Tech',      icon: React.createElement(Monitor, { className: "w-4 h-4" }) },
  { value: 'languages', label: 'Langues',   icon: React.createElement(Globe, { className: "w-4 h-4" }) },
  { value: 'arts',      label: 'Arts',      icon: React.createElement(Palette, { className: "w-4 h-4" }) },
  { value: 'business',  label: 'Business',  icon: React.createElement(Briefcase, { className: "w-4 h-4" }) },
  { value: 'sport',     label: 'Sport',     icon: React.createElement(Trophy, { className: "w-4 h-4" }) },
  { value: 'cooking',   label: 'Cuisine',   icon: React.createElement(ChefHat, { className: "w-4 h-4" }) },
  { value: 'other',     label: 'Autre',     icon: React.createElement(Sparkles, { className: "w-4 h-4" }) },
];

export const BIO_MAX = 280;
export const MAX_SKILLS = 5;
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_FILE_MB = 5;

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
