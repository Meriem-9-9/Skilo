'use client'

import { useEffect, useRef, useState } from 'react'

const STATS = [
  { num: 2, suffix: 'K+', label: 'Membres actifs' },
  { num: 840, suffix: '+', label: 'Sessions réalisées' },
  { num: 120, suffix: '+', label: 'Compétences référencées' },
]

const TESTIMONIALS = [
  {
    text: "J'ai appris les bases de React en 3 sessions en échange de cours d'anglais. Incroyable comme concept.",
    initials: 'JT',
    name: 'Julie T.',
    role: 'ANGLAIS → REACT',
  },
  {
    text: "Le système de crédits temps m'a permis d'apprendre la photo sans attendre un match parfait.",
    initials: 'KM',
    name: 'Karim M.',
    role: 'DEV → PHOTOGRAPHIE',
  },
  {
    text: "L'algorithme m'a trouvé le match parfait en 2 jours. Je partage Figma, j'apprends le piano !",
    initials: 'AR',
    name: 'Amina R.',
    role: 'FIGMA → PIANO',
  },
]

function AnimatedStat({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        let n = 0
        const step = Math.ceil(target / 150)
        const timer = setInterval(() => {
          n += step
          if (n >= target) { setCount(target); clearInterval(timer) }
          else setCount(n)
        }, 28)
      }
    }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return (
    <span ref={ref} style={{
      fontFamily: "'Barlow Condensed', sans-serif",
      fontSize: 'clamp(3.5rem, 7vw, 5.5rem)',
      fontWeight: 900,
      color: '#ffffff',
      lineHeight: 1,
      letterSpacing: '-0.02em',
    }}>
      {count}
      <span style={{ color: '#D4F000' }}>{suffix}</span>
    </span>
  )
}

function InitialsAvatar({ initials }: { initials: string }) {
  return (
    <div style={{
      width: '48px', height: '48px', borderRadius: '50%',
      background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
      border: '2px solid rgba(212,240,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      fontSize: '1rem', fontWeight: 800, color: '#D4F000',
      fontFamily: "'Barlow Condensed', sans-serif",
    }}>
      {initials}
    </div>
  )
}

export function StatsSection() {
  return (
    <section
      id="stats"
      style={{
        backgroundColor: '#6D28D9',
        padding: '90px 5%',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Décoration fond */}
      <div style={{
        position: 'absolute', width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
        top: '-150px', left: '50%', transform: 'translateX(-50%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '960px', margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Titre */}
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
          fontWeight: 900,
          color: '#ffffff',
          marginBottom: '10px',
          letterSpacing: '-0.01em',
        }}>
          Une communauté qui grandit chaque jour
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '64px', fontSize: '1rem' }}>
          Des milliers d'échanges créés, des compétences transmises, des liens forgés
        </p>

        {/* ── Stats — grands chiffres sans card ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '0',
          marginBottom: '56px',
          paddingBottom: '56px',
          borderBottom: '1px solid rgba(255,255,255,0.15)',
        }}>
          {STATS.map((s, i) => (
            <div
              key={s.label}
              style={{
                borderRight: i < 2 ? '1px solid rgba(255,255,255,0.15)' : 'none',
                padding: '0 32px',
              }}
            >
              <AnimatedStat target={s.num} suffix={s.suffix} />
              <p style={{
                color: '#D4F000',
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginTop: '10px',
              }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Témoignages ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '20px',
        }}>
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '20px',
                padding: '28px 26px 24px',
                textAlign: 'left',
                border: '1px solid rgba(255,255,255,0.12)',
                position: 'relative',
                backdropFilter: 'blur(8px)',
              }}
            >
              {/* Grand guillemet décoratif */}
              <span style={{
                position: 'absolute',
                top: '16px',
                right: '22px',
                fontFamily: 'Georgia, serif',
                fontSize: '4rem',
                fontWeight: 900,
                color: 'rgba(255,255,255,0.15)',
                lineHeight: 1,
                userSelect: 'none',
              }}>
                "
              </span>

              <p style={{
                color: 'rgba(255,255,255,0.88)',
                fontSize: '0.9rem',
                lineHeight: 1.7,
                marginBottom: '24px',
                fontStyle: 'italic',
                position: 'relative',
                zIndex: 1,
              }}>
                "{t.text}"
              </p>

              {/* Auteur */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <InitialsAvatar initials={t.initials} />
                <div>
                  <p style={{
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    margin: 0,
                  }}>
                    {t.name}
                  </p>
                  <p style={{
                    color: '#D4F000',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    margin: '3px 0 0',
                  }}>
                    {t.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}