import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CancelSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function CancelSessionDialog({ isOpen, onClose, onConfirm }: CancelSessionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 overflow-hidden border-none shadow-2xl rounded-2xl sm:max-w-md">
        <div className="p-6 bg-destructive/5">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Annuler la session ?</DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2">
              Êtes-vous sûr de vouloir annuler cette session ? Cette action informera l'autre participant et pourrait avoir un impact sur vos crédits si elle est annulée tardivement.
            </DialogDescription>
          </DialogHeader>
        </div>
        <DialogFooter className="p-6 bg-muted/30 gap-3 sm:gap-0">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="rounded-xl h-11 font-semibold"
          >
            Retour
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            className="rounded-xl h-11 px-8 font-bold shadow-lg shadow-destructive/10 transition-all hover:scale-[1.02]"
          >
            Confirmer l'annulation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
