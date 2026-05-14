'use client';

import { useState } from 'react';
import { Match, sessionsApi, SkillCatalogItem } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MessageSquare, Sparkles, CreditCard, Link as LinkIcon, AlertCircle } from 'lucide-react';

import { toast } from 'sonner';

interface ProposeSessionModalProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProposeSessionModal({
  match,
  isOpen,
  onClose,
  onSuccess,
}: ProposeSessionModalProps) {
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState('2026-05-27');
  const [time, setTime] = useState('12:00');
  const [duration, setDuration] = useState('60');
  const [selectedPairIndex, setSelectedPairIndex] = useState('0');
  const [message, setMessage] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!match) return null;

  const otherUser = match.otherUser;
  const isPartial = match.type === 'partial';
  const creditsNeeded = Math.ceil(parseInt(duration) / 60);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!date || !time) {
      toast.error('Veuillez choisir une date et une heure');
      return;
    }

    setLoading(true);
    try {
      const scheduledAt = new Date(`${date}T${time}`).toISOString();
      const pair = match.matchedPairs[parseInt(selectedPairIndex)];

      await sessionsApi.propose({
        recipientId: otherUser.id,
        scheduledAt,
        duration: parseInt(duration),
        offeredSkillId: pair.offeredByA?.id,
        wantedSkillId: pair.offeredByB?.id,
        message,
        meetingLink,
      });

      toast.success('Session proposée avec succès !');
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.message || 'Une erreur est survenue';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl max-h-[95vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          {/* Header with primary background (Fixed) */}
          <div className="bg-primary p-6 text-primary-foreground shrink-0">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center backdrop-blur-md">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <DialogTitle className="text-2xl font-bold text-primary-foreground leading-tight">
                  Proposer une session
                </DialogTitle>
              </div>
              <DialogDescription className="text-primary-foreground/80 text-sm">
                Planifiez un échange de compétences avec <span className="font-semibold text-primary-foreground">{otherUser.firstName}</span>.
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {/* Skills selection */}
            <div className="space-y-3">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Compétences à échanger
              </Label>
              <Select value={selectedPairIndex} onValueChange={setSelectedPairIndex}>
                <SelectTrigger className="w-full h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-primary">
                  <SelectValue placeholder="Sélectionnez l'échange" />
                </SelectTrigger>
                <SelectContent>
                  {match.matchedPairs.map((pair, i) => {
                    const nameA = pair.offeredByA?.name || 'Aucune';
                    const nameB = pair.offeredByB?.name || 'Aucune';
                    return (
                      <SelectItem key={i} value={i.toString()}>
                        <span className={!pair.offeredByA ? 'text-muted-foreground italic' : ''}>{nameA}</span>
                        <span className="mx-2 text-slate-300">⇄</span>
                        <span className={!pair.offeredByB ? 'text-muted-foreground italic' : ''}>{nameB}</span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Date
                </Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-primary"
                  required
                />
              </div>
              <div className="space-y-3">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Heure
                </Label>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-primary"
                  required
                />
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-3">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Durée de la session
              </Label>
              <div className="flex gap-2">
                {['30', '60', '90', '120'].map((d) => (
                  <Button
                    key={d}
                    type="button"
                    variant={duration === d ? 'default' : 'outline'}
                    className={`flex-1 h-11 rounded-xl transition-all ${
                      duration === d 
                        ? 'bg-primary hover:bg-primary/90 shadow-md shadow-primary/10 text-primary-foreground border-transparent' 
                        : 'bg-white border-slate-200 hover:border-primary/30 hover:bg-primary/5 text-slate-600'
                    }`}
                    onClick={() => setDuration(d)}
                  >
                    {d} min
                  </Button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="space-y-3">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                Message (Optionnel)
              </Label>
              <Textarea
                placeholder="Ex: Salut ! On pourrait commencer par les bases..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px] bg-slate-50 border-slate-200 rounded-xl focus:ring-primary resize-none"
              />
            </div>

            {/* Meeting Link */}
            <div className="space-y-3">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                Lien de la réunion
              </Label>
              <Input
                placeholder="Google Meet, Zoom, Discord... (Optionnel)"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                className="h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-primary"
              />
              <p className="text-[10px] text-muted-foreground px-1 italic">
                Laissez vide pour générer un lien <strong>Skilo Meet (Jitsi)</strong> automatiquement.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-destructive">Impossible de proposer la session</p>
                  <p className="text-xs text-destructive/80 mt-1 leading-relaxed">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* Credit Info for Partial Match */}
            {isPartial && !error && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-900">Coût de la session</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    C'est un match partiel. <span className="font-bold">{creditsNeeded} crédit(s)</span> seront réservés jusqu'à l'acceptation.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer (Fixed) */}
          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="h-12 rounded-xl text-slate-500 hover:bg-slate-200"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/10 transition-all disabled:opacity-50"
            >
              {loading ? 'Envoi...' : 'Envoyer la proposition'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
