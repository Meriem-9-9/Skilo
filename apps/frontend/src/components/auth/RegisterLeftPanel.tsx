// components/auth/RegisterLeftPanel.tsx

import Logo from '@/components/ui/Logo'

const TAGS = ['Voyages', 'Jazz', 'Photographie']
const PERKS = [
  'Inscription 100% gratuite',
  'Profils vérifiés uniquement',
  'Données sécurisées & privées',
]

export function RegisterLeftPanel() {
  return (
    <div className="w-1/2 h-full bg-violet-custom px-12 py-10 flex flex-col justify-center relative overflow-hidden shrink-0">
      {/* Orbe sombre top-right */}
      <div 
        className="absolute w-[420px] h-[420px] rounded-full -top-[120px] -right-[120px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(28,16,51,0.55) 0%, transparent 70%)' }}
      />
      {/* Orbe citron bottom-left */}
      <div 
        className="absolute w-[300px] h-[300px] rounded-full -bottom-[60px] -left-[40px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(212,240,0,0.15) 0%, transparent 70%)' }}
      />

      <div className="relative z-10">
        {/* Logo */}
        <div className="mb-9">
          <Logo variant="dark" size="md" href="/" />
        </div>

        {/* Titre */}
        <h1 className="font-display text-[clamp(1.9rem,3vw,2.6rem)] font-black leading-[1.1] text-white mb-3.5 tracking-tight">
          Rejoins des milliers<br />
          de personnes qui ont<br />
          trouvé leur{' '}
          <span className="text-citron-custom text-citron">connexion idéale</span>
        </h1>

        <p className="text-white/60 text-[0.88rem] leading-relaxed mb-7 max-w-[340px]">
          Crée ton profil en 2 minutes et découvre tes premiers matchs dès aujourd'hui.
        </p>

        {/* Carte profil mock */}
        <div className="bg-white/10 border border-white/20 rounded-2xl px-5 py-[18px] mb-7 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-[42px] h-[42px] rounded-full bg-[#7C3AED] border-2 border-white/25 flex items-center justify-center text-[0.82rem] font-bold text-white shrink-0">
              SA
            </div>
            <div>
              <p className="text-white font-bold text-[0.9rem] m-0">
                Sarah, 28 ans
              </p>
              <p className="text-white/50 text-[0.74rem] mt-[2px]">
                Paris · Créatrice de contenu
              </p>
            </div>
          </div>
          <div className="mb-2.5">
            <span className="bg-citron-custom text-dark text-[0.7rem] font-bold px-[11px] py-1 rounded-full">
              ✦ Match parfait · 97%
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TAGS.map((tag) => (
              <span key={tag} className="bg-white/10 text-white text-[0.73rem] font-medium px-[11px] py-1 rounded-full border border-white/20">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Perks */}
        <ul className="list-none p-0 m-0 flex flex-col gap-[11px]">
          {PERKS.map((perk) => (
            <li key={perk} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[rgba(212,240,0,0.18)] border border-[rgba(212,240,0,0.35)] flex items-center justify-center shrink-0">
                <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                  <path d="M1 4L4 7L10 1" stroke="#D4F000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-white/80 text-[0.84rem]">{perk}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}