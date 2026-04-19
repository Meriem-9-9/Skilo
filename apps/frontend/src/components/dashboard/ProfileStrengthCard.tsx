/**
 * components/dashboard/ProfileStrengthCard.tsx
 * Circular SVG gauge showing profile completion score.
 */

import type { ProfileStrength } from '@/types/api';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface ProfileStrengthCardProps {
  strength?: ProfileStrength;
}

const RADIUS = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getColor(score: number): string {
  if (score >= 80) return '#6366f1'; // indigo-500
  if (score >= 50) return '#f59e0b'; // amber-500
  return '#ef4444';                   // red-500
}

export function ProfileStrengthCard({ strength }: ProfileStrengthCardProps) {
  const score = strength?.score ?? 0;
  const offset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;
  const color = getColor(score);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-widest text-slate-400 mb-3">
        Profil
      </p>

      <div className="flex items-center gap-4">
        {/* Circular gauge */}
        <svg width="68" height="68" viewBox="0 0 68 68" className="shrink-0 -rotate-90">
          {/* Track */}
          <circle
            cx="34"
            cy="34"
            r={RADIUS}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="6"
          />
          {/* Progress */}
          <circle
            cx="34"
            cy="34"
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            className="transition-all duration-700"
          />
          {/* Center text — counter-rotate */}
          <text
            x="34"
            y="34"
            textAnchor="middle"
            dominantBaseline="central"
            className="rotate-90"
            style={{
              transform: 'rotate(90deg)',
              transformOrigin: '34px 34px',
              fill: '#0f172a',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            {score}
          </text>
        </svg>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">
            {strength?.label ?? 'Incomplet'}
          </p>
          {strength?.nextAction && (
            <Link
              href="/profile"
              className="mt-1 flex items-center gap-0.5 text-xs text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              {strength.nextAction}
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
