/**
 * components/profile/SkillSearch.tsx
 * Debounced autocomplete input for searching and adding skills.
 *
 * Usage:
 *   <SkillSearch
 *     type="offered"
 *     onAdd={(skillId, level) => addSkill({ skillId, type: 'offered', level })}
 *   />
 *
 * TODO (onboarding):
 *   - Add "Propose a new skill" flow (POST /skills) when the search returns no results.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { searchSkills } from '@/lib/api/users';
import type { SkillLevel } from '@/types/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search, Plus, Loader2 } from 'lucide-react';

const LEVEL_OPTIONS: { value: SkillLevel; label: string }[] = [
  { value: 'beginner', label: 'Débutant' },
  { value: 'intermediate', label: 'Intermédiaire' },
  { value: 'advanced', label: 'Avancé' },
  { value: 'expert', label: 'Expert' },
];

interface SkillSearchResult {
  id: string;
  name: string;
  category: string;
}

interface SkillSearchProps {
  type: 'offered' | 'wanted';
  onAdd: (skillId: string, level: SkillLevel) => Promise<void>;
  disabled?: boolean;
}

export function SkillSearch({ type, onAdd, disabled = false }: SkillSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SkillSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<SkillSearchResult | null>(null);
  const [level, setLevel] = useState<SkillLevel>('beginner');
  const [isAdding, setIsAdding] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await searchSkills(query.trim());
        setResults(data);
        setIsOpen(true);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSelect = (skill: SkillSearchResult) => {
    setSelected(skill);
    setQuery(skill.name);
    setIsOpen(false);
    setResults([]);
  };

  const handleAdd = async () => {
    if (!selected) return;
    setIsAdding(true);
    try {
      await onAdd(selected.id, level);
      setSelected(null);
      setQuery('');
      setLevel('beginner');
    } finally {
      setIsAdding(false);
    }
  };

  const isOffered = type === 'offered';
  const placeholder = isOffered
    ? 'Rechercher une compétence à enseigner…'
    : 'Rechercher une compétence à apprendre…';

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div ref={containerRef} className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
          {isSearching ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
          ) : (
            <Search className="h-3.5 w-3.5 text-slate-400" />
          )}
        </div>
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (selected && e.target.value !== selected.name) setSelected(null);
          }}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="rounded-xl pl-9 text-sm border-slate-200 focus-visible:ring-indigo-500"
        />

        {/* Dropdown */}
        {isOpen && results.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            {results.map((skill) => (
              <li key={skill.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors"
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent blur before click
                    handleSelect(skill);
                  }}
                >
                  <span className="font-medium text-slate-800">{skill.name}</span>
                  <span className="text-xs text-slate-400">{skill.category}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {isOpen && !isSearching && results.length === 0 && query.length >= 2 && (
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg">
            <p className="text-xs text-slate-400">Aucune compétence trouvée.</p>
            {/* TODO: "Propose a new skill" CTA */}
          </div>
        )}
      </div>

      {/* Level selector + Add button (only shown when a skill is selected) */}
      {selected && (
        <div className="flex items-center gap-2">
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as SkillLevel)}
            disabled={disabled || isAdding}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {LEVEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <Button
            type="button"
            size="sm"
            onClick={handleAdd}
            disabled={disabled || isAdding}
            className={`rounded-xl gap-1.5 ${
              isOffered
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                : 'bg-violet-600 hover:bg-violet-500 text-white'
            }`}
          >
            {isAdding ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            Ajouter
          </Button>
        </div>
      )}
    </div>
  );
}
