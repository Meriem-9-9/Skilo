import { Star } from 'lucide-react';
import { ReviewCard } from './review-card';
import type { Review } from '@/lib/api';

interface ReviewsSectionProps {
  reviews: Review[];
}

export function ReviewsSection({ reviews }: ReviewsSectionProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
          <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
          Avis reçus <span className="text-muted-foreground font-medium ml-1">({reviews.length})</span>
        </h2>
      </div>

      {reviews.length === 0 ? (
        <div className="p-16 text-center bg-card border border-border rounded-[2.5rem] shadow-sm">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Star className="w-8 h-8 text-muted-foreground/30" />
          </div>
          <p className="text-lg font-bold text-muted-foreground uppercase tracking-widest">Aucun avis pour l'instant</p>
          <p className="text-sm text-muted-foreground mt-2">Participez à des sessions pour recevoir vos premières évaluations !</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
        </div>
      )}
    </section>
  );
}
