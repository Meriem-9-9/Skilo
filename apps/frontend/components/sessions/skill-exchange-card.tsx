import { ArrowLeft } from 'lucide-react';
import type { Session, User } from '@/lib/api';

interface SkillExchangeCardProps {
  session: Session;
  otherUser: User;
  isInitiator: boolean;
}

export function SkillExchangeCard({ session, otherUser, isInitiator }: SkillExchangeCardProps) {
  const skill = session.skillsExchanged?.[0];
  
  return (
    <div className="bg-card border border-border rounded-3xl p-8 space-y-6">
      <h3 className="text-lg font-black tracking-tight">Échange réciproque</h3>
      <div className="grid grid-cols-2 gap-8 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-background border border-border rounded-full flex items-center justify-center z-10 shadow-sm">
          <ArrowLeft className="w-4 h-4 text-primary" />
        </div>
        
        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vous donnez</p>
          <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl">
            <p className="font-bold text-primary">
              {isInitiator 
                ? (skill?.offeredSkillName || 'Compétence') 
                : (skill?.wantedSkillName || 'Compétence')}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Donné à {otherUser.firstName}</p>
          </div>
        </div>

        <div className="space-y-4 text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vous recevez</p>
          <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
            <p className="font-bold text-indigo-600">
              {isInitiator 
                ? (skill?.wantedSkillName || 'Compétence') 
                : (skill?.offeredSkillName || 'Compétence')}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Reçu de {otherUser.firstName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
