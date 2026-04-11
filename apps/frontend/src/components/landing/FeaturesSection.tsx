'use client'

import { useEffect, useRef, useState } from 'react'
import { SectionTag } from '@/components/landing/SectionTag'
import { Target, Clock, Star } from 'lucide-react'



const FEATURES = [
  {
    id: 0,
    icon: '✦',
    emoji: '',
    color: '#6D28D9',
    accent: 'rgba(109,40,217,0.12)',
    title: 'Matching algorithmique',
    shortTitle: 'Matching',
    desc: 'Matchs parfaits (réciprocité mutuelle) et matchs partiels avec score de compatibilité détaillé.',
    stat: '94%',
    statLabel: 'Taux de match',
    preview: [
      { name: 'Sara A.', skill: 'Figma → React', score: 97, color: '#6D28D9' },
      { name: 'Marc L.', skill: 'Node.js → Piano', score: 89, color: '#7C3AED' },
      { name: 'Léa M.', skill: 'Espagnol → Python', score: 82, color: '#8B5CF6' },
    ],
  },
  {
    id: 1,
    icon: '⏱',
    emoji: '',
    color: '#0EA5E9',
    accent: 'rgba(14,165,233,0.12)',
    title: 'Crédits temps',
    shortTitle: 'Crédits',
    desc: "1h enseignée = 1 crédit. Apprenez même sans match direct grâce à notre banque de temps communautaire.",
    stat: '1h',
    statLabel: '= 1 crédit',
    preview: [
      { label: 'Crédits gagnés', value: '+12h', bar: 80, color: '#0EA5E9' },
      { label: 'Sessions données', value: '8', bar: 60, color: '#38BDF8' },
      { label: 'Crédits disponibles', value: '4h', bar: 40, color: '#7DD3FC' },
    ],
  },
  {
    id: 2,
    icon: '⭐',
    emoji: '⭐⭐⭐⭐⭐',
    color: '#F59E0B',
    accent: 'rgba(245,158,11,0.12)',
    title: 'Évaluation fiable',
    shortTitle: 'Évaluation',
    desc: 'Notes et avis vérifiés après chaque session. Badge "Fiable" décerné aux membres les plus engagés.',
    stat: '4.9★',
    statLabel: 'Note moyenne',
    preview: [
      { name: 'Session Figma', rating: 5, comment: 'Excellent pédagogue !' },
      { name: 'Session React', rating: 5, comment: 'Très clair et patient.' },
      { name: 'Session Piano', rating: 4, comment: 'Super ambiance.' },
    ],
  },
]

function AnimatedCount({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        let n = 0
        const step = Math.ceil(target / 40)
        const t = setInterval(() => {
          n += step
          if (n >= target) { setCount(target); clearInterval(t) }
          else setCount(n)
        }, 28)
      }
    }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])
  return <span ref={ref}>{count}{suffix}</span>
}

function PreviewPanel({ feature }: { feature: typeof FEATURES[0] }) {
  if (feature.id === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
        {feature.preview.map((p: any) => (
          <div key={p.name} style={{
            backgroundColor: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px', padding: '12px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            backdropFilter: 'blur(8px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                backgroundColor: p.color, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff',
              }}>
                {p.name.split(' ').map((w: string) => w[0]).join('')}
              </div>
              <div>
                <p style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 600, margin: 0 }}>{p.name}</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', margin: 0 }}>{p.skill}</p>
              </div>
            </div>
            <span style={{
              backgroundColor: '#D4F000', color: '#1C1033',
              fontSize: '0.7rem', fontWeight: 800, padding: '3px 10px', borderRadius: '999px',
            }}>{p.score}%</span>
          </div>
        ))}
      </div>
    )
  }
  if (feature.id === 1) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
        {feature.preview.map((p: any) => (
          <div key={p.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem' }}>{p.label}</span>
              <span style={{ color: '#fff', fontSize: '0.78rem', fontWeight: 700 }}>{p.value}</span>
            </div>
            <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${p.bar}%`,
                background: `linear-gradient(90deg, ${p.color}, ${p.color}99)`,
                borderRadius: '999px',
                transition: 'width 0.8s ease',
              }} />
            </div>
          </div>
        ))}
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
      {feature.preview.map((p: any) => (
        <div key={p.name} style={{
          backgroundColor: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px', padding: '12px 14px',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>{p.name}</span>
            <span style={{ color: '#F59E0B', fontSize: '0.75rem' }}>{'★'.repeat(p.rating)}</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.72rem', margin: 0, fontStyle: 'italic' }}>"{p.comment}"</p>
        </div>
      ))}
    </div>
  )
}

export function FeaturesSection() {
  const [active, setActive] = useState(0)
  const [visible, setVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const feature = FEATURES[active]

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisible(true)
    }, { threshold: 0.15 })
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="features"
      style={{
        backgroundColor: '#F8F8FF',
        padding: '80px 5%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Décoration fond */}
      <div style={{
        position: 'absolute', width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,240,0,0.08) 0%, transparent 70%)',
        top: '-200px', right: '-100px', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(109,40,217,0.07) 0%, transparent 70%)',
        bottom: '-100px', left: '-80px', pointerEvents: 'none',
      }} />

      {/* Header centré */}
      <div style={{ textAlign: 'center', marginBottom: '56px' }}>
        <SectionTag>Pourquoi matchup</SectionTag>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 'clamp(2.4rem, 4.5vw, 3.6rem)',
          fontWeight: 900, lineHeight: 1.05,
          color: '#0D0B1A', margin: '16px 0 16px',
          letterSpacing: '-0.01em',
        }}>
          Tout le monde a quelque chose{' '}
          <span style={{ color: '#6D28D9', position: 'relative', display: 'inline-block' }}>
            à offrir.
            <span style={{
              position: 'absolute', bottom: '-4px', left: 0, right: 0,
              height: '4px', borderRadius: '2px',
              background: 'linear-gradient(90deg, #6D28D9, #D4F000)',
            }} />
          </span>
        </h2>
        <p style={{ color: '#8B7EA8', fontSize: '1rem', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
          Notre algorithme analyse vos compétences en profondeur pour des échanges vraiment pertinents.
        </p>
      </div>

      {/* Bento grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gridTemplateRows: 'auto auto',
        gap: '16px',
        maxWidth: '1100px',
        margin: '0 auto',
      }}>

        {/* Tabs de sélection — ligne du haut, 3 colonnes */}
        {FEATURES.map((f, i) => (
          <div
            key={f.id}
            onClick={() => setActive(i)}
            style={{
              backgroundColor: active === i ? '#ffffff' : 'rgba(255,255,255,0.5)',
              borderRadius: '16px',
              padding: '20px 22px',
              border: `2px solid ${active === i ? f.color : 'transparent'}`,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: active === i ? `0 8px_30px ${f.color}22` : 'none',
              transform: visible ? 'translateY(0)' : 'translateY(30px)',
              opacity: visible ? 1 : 0,
              transitionDelay: `${i * 0.1}s`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                backgroundColor: active === i ? f.color : f.accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem', flexShrink: 0,
                transition: 'all 0.3s ease',
              }}>
                {f.icon}
              </div>
              <div>
                <p style={{
                  fontWeight: 700, fontSize: '0.92rem',
                  color: active === i ? '#1C1033' : '#8B7EA8',
                  margin: 0, transition: 'color 0.3s',
                }}>{f.title}</p>
                <p style={{ color: '#8B7EA8', fontSize: '0.78rem', margin: '3px 0 0', lineHeight: 1.4 }}>
                  {f.desc}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Grande carte active — 2 colonnes */}
        <div
          key={`panel-${active}`}
          style={{
            gridColumn: '1 / 3',
            background: `linear-gradient(135deg, ${feature.color} 0%, ${feature.color}cc 100%)`,
            borderRadius: '20px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '280px',
            boxShadow: `0 20px 60px ${feature.color}44`,
            animation: 'fadeSlide 0.4s ease',
          }}
        >
          <div>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>{feature.emoji}</div>
            <h3 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '2rem', fontWeight: 900,
              color: '#ffffff', margin: '0 0 8px', lineHeight: 1,
            }}>{feature.title}</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
              {feature.desc}
            </p>
          </div>
          <div style={{
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
            marginTop: '24px',
          }}>
            <div>
              <p style={{ color: '#ffffff', fontSize: '2.8rem', fontWeight: 900, margin: 0, lineHeight: 1 }}>
                {feature.stat}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '4px 0 0' }}>
                {feature.statLabel}
              </p>
            </div>
            {/* Pills de navigation */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {FEATURES.map((_, i) => (
                <div
                  key={i}
                  onClick={() => setActive(i)}
                  style={{
                    width: i === active ? '24px' : '8px',
                    height: '8px', borderRadius: '999px',
                    backgroundColor: i === active ? '#D4F000' : 'rgba(255,255,255,0.35)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Carte preview — 1 colonne */}
        <div style={{
          gridColumn: '3 / 4',
          backgroundColor: feature.color,
          background: `linear-gradient(160deg, ${feature.color}22 0%, #ffffff 60%)`,
          border: `1px solid ${feature.color}33`,
          borderRadius: '20px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          minHeight: '280px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
        }}>
          <p style={{
            fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.1em', color: feature.color, margin: '0 0 8px',
          }}>
            Aperçu live
          </p>
          <PreviewPanel feature={feature} />
        </div>

      </div>

      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </section>
  )
}