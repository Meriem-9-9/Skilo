import { MessageCircle } from 'lucide-react';

export function EmptyMessages() {
  return (
    <div className="p-16 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <MessageCircle className="w-8 h-8 text-muted-foreground/50" />
      </div>
      <p className="font-semibold text-lg mb-1">Aucune conversation</p>
      <p className="text-muted-foreground text-sm max-w-sm">
        Vous n'avez pas de sessions actives pour le moment. Proposez ou acceptez une session pour commencer à discuter !
      </p>
    </div>
  );
}
