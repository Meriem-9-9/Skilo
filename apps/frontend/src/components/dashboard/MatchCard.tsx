/**
 * components/dashboard/MatchCard.tsx
 * Individual match card showing the other user's info, shared skills, and score.
 *
 * TODO (onboarding):
 *   - Replace Link navigation with <SessionProposalModal /> trigger.
 */

import Link from 'next/link';
import type { Match } from '@/types/api';
import { Badge } from '@/components/ui/badge';
import { MapPin, Shield, Star, Zap } from 'lucide-react';

interface MatchCardProps {
  match: Match;
  currentUserId: string;
}

export function MatchCard({ match, currentUserId }: MatchCardProps) {
  // Show the "other" user from the current user's perspective
  const other =
    match.userA.id === currentUserId ? match.userB : match.userA;

  const isPerfect = match.type === 'perfect';

  return (
    <Link href={`/users/${other.id}`} className="group block">
      <div className="relative h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-indigo-200 hover:shadow-md">
        {/* Perfect match badge */}
        {isPerfect && (
          <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            <Zap className="h-3 w-3 fill-amber-400 text-amber-400" /> Parfait
          </span>
        )}

        {/* Avatar + name */}
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            {other.avatarUrl ? (
              <img
                src={other.avatarUrl}
                alt={other.firstName}
                className="h-12 w-12 rounded-xl object-cover ring-2 ring-white shadow"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-lg font-bold text-indigo-600 shadow">
                {other.firstName[0]}
              </div>
            )}
            {other.hasBadgeFiable && (
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 shadow">
                <Shield className="h-3 w-3 text-white" />
              </span>
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">
              {other.firstName} {other.lastName}
            </p>
            {other.city && (
              <p className="flex items-center gap-1 truncate text-xs text-slate-400 mt-0.5">
                <MapPin className="h-3 w-3 shrink-0" />
                {other.city}
              </p>
            )}
            {other.avgRating != null && (
              <p className="flex items-center gap-1 text-xs text-amber-600 mt-0.5">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {other.avgRating.toFixed(1)}
                <span className="text-slate-400">
                  · {other.sessionsCompleted} session
                  {other.sessionsCompleted !== 1 ? 's' : ''}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Shared skills */}
        {match.sharedSkills.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-slate-400">
              Compétences communes
            </p>
            <div className="flex flex-wrap gap-1.5">
              {match.sharedSkills.slice(0, 3).map((skill) => (
                <Badge
                  key={skill.id}
                  variant="secondary"
                  className="rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs"
                >
                  {skill.name}
                </Badge>
              ))}
              {match.sharedSkills.length > 3 && (
                <Badge
                  variant="secondary"
                  className="rounded-full bg-slate-100 text-slate-500 text-xs"
                >
                  +{match.sharedSkills.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Score bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">Score de compatibilité</span>
            <span className="text-xs font-semibold text-indigo-600">
              {Math.round(match.score * 100)}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${match.score * 100}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
