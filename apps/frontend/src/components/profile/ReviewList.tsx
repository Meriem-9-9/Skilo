/**
 * components/profile/ReviewList.tsx
 * Review cards with star ratings and optional sub-ratings.
 */

import type { Review } from '@/types/api';
import { Star } from 'lucide-react';

interface ReviewListProps {
  reviews: Review[];
}

function StarRating({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${
            i < Math.round(value)
              ? 'fill-amber-400 text-amber-400'
              : 'text-slate-200'
          }`}
        />
      ))}
    </span>
  );
}

function SubRating({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-slate-500">{label}</span>
      <div className="flex items-center gap-1.5">
        <div className="h-1 w-16 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-400"
            style={{ width: `${(value / 5) * 100}%` }}
          />
        </div>
        <span className="w-5 text-right text-xs font-medium tabular-nums text-slate-600">
          {value.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

export function ReviewList({ reviews }: ReviewListProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-base font-semibold text-slate-900">
        Avis reçus
        <span className="ml-2 text-sm font-normal text-slate-400">
          ({reviews.length})
        </span>
      </h2>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="rounded-xl border border-slate-100 bg-slate-50 p-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {review.reviewer.avatarUrl ? (
                  <img
                    src={review.reviewer.avatarUrl}
                    alt={review.reviewer.firstName}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">
                    {review.reviewer.firstName[0]}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {review.reviewer.firstName}
                  </p>
                  <p className="text-xs text-slate-400">
                    {review.skillCatalog.name} ·{' '}
                    {new Date(review.submittedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <StarRating value={review.rating} />
                <span className="text-xs font-semibold text-slate-700 tabular-nums">
                  {review.rating.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Comment */}
            {review.comment && (
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {review.comment}
              </p>
            )}

            {/* Sub-ratings */}
            {(review.ratingPedagogy != null ||
              review.ratingPunctuality != null ||
              review.ratingCommunication != null) && (
              <div className="mt-3 space-y-1.5 border-t border-slate-200 pt-3">
                {review.ratingPedagogy != null && (
                  <SubRating label="Pédagogie" value={review.ratingPedagogy} />
                )}
                {review.ratingPunctuality != null && (
                  <SubRating label="Ponctualité" value={review.ratingPunctuality} />
                )}
                {review.ratingCommunication != null && (
                  <SubRating label="Communication" value={review.ratingCommunication} />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
