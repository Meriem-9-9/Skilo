'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { MatchCard } from '@/components/landing/MatchCard'

const HERO_STATS = [
  { num: '2K', suffix: '+', label: 'Utilisateurs actifs' },
  { num: '840', suffix: '+', label: 'Sessions réalisées' },
  { num: '98', suffix: '%', label: 'Satisfaction' },
]

export function HeroSection() {
  return (
    <section
      className="relative bg-[#1C1033] overflow-hidden"
      style={{
        minHeight: 'calc(100vh - 68px)',
        display: 'flex',
        flexDirection: 'column',
        padding: '60px 5% 0',
        
      }}
    >
      {/* ── Orbes de fond ── */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(109,40,217,.40) 0%, transparent 70%)',
          top: -150, right: 0,
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: 450, height: 450, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,240,0,0.46) 0%, transparent 70%)',
          bottom: -100, left: '10%',
        }}
      />

      {/* ── Contenu principal : texte + carte côte à côte ── */}
      <div
        className="relative z-10"
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '4rem',
        }}
      >
        {/* Texte & CTA */}
        <div className="animate-fade-up" style={{ flex: 1, maxWidth: '580px',fontSize: '1.25rem',
                fontWeight: 700, textDecoration: 'none', letterSpacing: '0.06em' }}>

          {/* Eyebrow badge */}
          <div style={{ marginBottom: '24px' }} className="inline-flex items-center gap-2 bg-[rgba(212,240,0,0.1)] border border-[rgba(212,240,0,0.25)] rounded-full px-[14px] py-[5px]">
            <span className="text-[#D4F000] text-[0.7rem]">✦</span>
            <span className="text-[#D4F000] text-[0.8rem] font-semibold tracking-[0.06em] uppercase">
              Plateforme de compétences
            </span>
          </div>

          {/* Headline */}
          <h1
          //on veut un font gras et une taille de font qui s'adapte à la largeur de l'écran, avec un minimum de 3.8rem et un maximum de 4.2rem
            style={{ marginBottom: '24px', lineHeight: '1.08', letterSpacing: '-0.02em', fontWeight: 'bold' }} //pour le font en gras on doit faire dans style fontWeight: 'bold' et pour la taille de font qui s'adapte à la largeur de l'écran on doit faire fontSize: 'clamp(3.8rem, 5vw, 4.2rem)'
            className="font-display text-[clamp(3.8rem,5.5vw,4.2rem)] font-extrabold leading-[1.08] tracking-tight text-[#ffffff]"
          >
            Échangez ce que<br />
            vous <span className="text-[#D4F000]">savez faire</span>
          </h1>

          {/* Sous-titre */}
          <p
            style={{ marginBottom: '32px' }}
            className="text-[rgba(255,255,255,0.55)] text-[1.05rem] leading-[1.7] max-w-[460px] font-light"
          >
            Trouvez quelqu'un qui a ce que vous cherchez, offrez ce que vous savez —
            sans argent, juste du temps et du talent.
          </p>

          {/* Boutons */}
          <div className="flex gap-[14px] flex-wrap">
            <Button style={{ borderRadius: '10px', padding: '8px 20px' }} variant="citron" size="lg" asChild>
              <Link href="/register" style={{ textDecoration: 'none' }}>Créer mon profil ↗</Link>
            </Button>
            <Button style={{ borderRadius: '10px', padding: '8px 20px' }} variant="outline-white" size="lg" asChild>
              <Link href="#how" style={{ textDecoration: 'none' }}>Voir comment ça marche</Link>
            </Button>
          </div>
        </div>

        {/* Carte MatchCard */}
        <div className="relative z-10 flex-shrink-0 lg:block">
          <MatchCard
            name="Sara A."
            initials="SA"
            city="Paris"
            subtitle="Créatrice de contenu"
            //rating={4.9}
            score={94}
            offeredSkills={['Figma', 'UI Design']}
            wantedSkills={['Python', 'React']}
          />
        </div>
      </div>

      {/* ── Stats — toujours en bas, pleine largeur ── */}
      <div
        className="relative z-10"
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '3rem',
          padding: '28px 0 32px',
          borderTop: '1px solid rgba(255,255,255,0.10)',
          marginTop: '48px',
        }}
      >
        {HERO_STATS.map((s) => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <p className="font-display text-[1.9rem] font-extrabold text-[#ffffff] leading-none">
              {s.num}<span className="text-[#D4F000]">{s.suffix}</span>
            </p>
            <p className="text-[rgba(255,255,255,0.45)] text-[0.8rem] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

    </section>
  )
}