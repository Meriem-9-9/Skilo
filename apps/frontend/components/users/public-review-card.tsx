import { Award, MessageSquare } from 'lucide-react';
import type { Review } from '@/lib/api';
import { Stars } from './stars';
import { formatDate } from '@/app/(dashboard)/users/[id]/utils';

interface PublicReviewCardProps {
  review: Review;
}

export function PublicReviewCard({ review }: PublicReviewCardProps) {
  return (
    <div className="p-6 border border-border/50 rounded-2xl bg-card/30 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden">
            {review.reviewer.avatarUrl ? (
              <img src={review.reviewer.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-black text-primary">{review.reviewer.firstName[0]}{review.reviewer.lastName?.[0]}</span>
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{review.reviewer.firstName} {review.reviewer.lastName}</p>
            <p className="text-[10px] text-muted-foreground font-medium">{formatDate(review.submittedAt)}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Stars rating={review.rating} />
          {review.skillCatalog && (
            <span className="text-[10px] font-black text-primary uppercase tracking-tighter">
              {review.skillCatalog.name}
            </span>
          )}
        </div>
      </div>

      {review.comment && (
        <p className="text-sm text-muted-foreground italic leading-relaxed">"{review.comment}"</p>
      )}

      {(review.ratingPedagogy || review.ratingPunctuality || review.ratingCommunication) && (
        <div className="flex flex-wrap gap-4 pt-3 border-t border-border/30">
          {review.ratingPedagogy && (
            <div className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Pédagogie: <span className="text-foreground">{review.ratingPedagogy}/5</span></span>
            </div>
          )}
          {review.ratingCommunication && (
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Comm.: <span className="text-foreground">{review.ratingCommunication}/5</span></span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
