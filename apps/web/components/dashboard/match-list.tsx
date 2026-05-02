'use client';

import { Match } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Sparkles, ArrowRight } from 'lucide-react';
import { ProposeSessionModal } from '@/components/matches/propose-modal';

import { useState } from 'react';


export function MatchList({ matches }: { matches: Match[] }) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handlePropose = (match: Match) => {
    setSelectedMatch(match);
    setDialogOpen(true);
  };

  if (matches.length === 0) {
    return (
      <Card className="border-dashed h-full flex flex-col items-center justify-center p-8 text-center bg-muted/20">
        <div className="w-12 h-12 rounded-full border border-dashed flex items-center justify-center mb-4">
          <Search className="w-6 h-6 text-muted-foreground" />
        </div>
        <CardTitle className="text-xl">No matches yet</CardTitle>
        <CardDescription className="mt-2 max-w-xs">
          We're looking for mentors or learners that match your skill profile. 
          Try adding more skills to your profile!
        </CardDescription>
        <Button variant="outline" size="sm" className="mt-6">
          Update your skills
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" /> Matches for you
        </h3>
        <span className="text-xs text-muted-foreground">{matches.length} found</span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {matches.map((match) => (
          <Card key={match.id} className="hover:border-primary/50 transition-colors group cursor-pointer overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold overflow-hidden shadow-sm">
                    {match.otherUser.avatarUrl ? (
                      <img src={match.otherUser.avatarUrl} alt="Match" className="w-full h-full object-cover" />
                    ) : (
                      <span>{match.otherUser.firstName[0]}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{match.otherUser.firstName} {match.otherUser.lastName}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{match.otherUser.city ? `From ${match.otherUser.city}` : 'Skill sharer'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100">
                    {Math.round(match.score * 100)}% Match
                  </Badge>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-1.5 line-clamp-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Skills swap:</span>
                  {match.matchedPairs && match.matchedPairs.length > 0 && match.matchedPairs[0].offeredByB && match.matchedPairs[0].offeredByA && (
                    <Badge variant="outline" className="text-[10px] h-5 py-0 truncate max-w-[200px]">
                      {match.matchedPairs[0].offeredByB.name} for {match.matchedPairs[0].offeredByA.name}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t flex justify-end">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 text-[10px] gap-1 group-hover:text-primary transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePropose(match);
                  }}
                >
                  Propose session <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ProposeSessionModal 
        match={selectedMatch}
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => {
           // Optionally refresh data
        }}
      />
    </div>
  );
}

