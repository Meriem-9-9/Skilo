export const TYPE_CONFIG: Record<string, { label: string; color: string; sign: string }> = {
  welcome_bonus:    { label: 'Bonus bienvenue',   color: 'text-green-600',  sign: '+' },
  profile_bonus:    { label: 'Bonus profil',      color: 'text-green-600',  sign: '+' },
  session_earned:   { label: 'Session enseignée', color: 'text-green-600',  sign: '+' },
  session_spent:    { label: 'Session payée',     color: 'text-red-600',    sign: '-' },
  session_reserved: { label: 'Réservé',           color: 'text-amber-600',  sign: '−' },
  session_released: { label: 'Libéré',            color: 'text-blue-600',   sign: '+' },
  session_confirmed:{ label: 'Confirmé',          color: 'text-green-600',  sign: '+' },
  referral_bonus:   { label: 'Invitation',        color: 'text-green-600',  sign: '+' },
};

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
