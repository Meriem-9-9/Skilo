'use client'

import { useState } from 'react'
import { SectionTag } from '@/components/landing/SectionTag'

const STEPS = [
  {
    emoji: '🎯',
    num: '1',
    title: 'Créez votre profil',
    desc: "Déclarez ce que vous savez faire et ce que vous souhaitez apprendre. L'algorithme fait le reste.",
  },
  {
    emoji: '⚡',
    num: '2',
    title: 'Trouvez vos matchs',
    desc: "L'algorithme identifie les échanges parfaits — les profils où chacun a ce que l'autre cherche.",
  },
  {
    emoji: '🚀',
    num: '3',
    title: 'Échangez & progressez',
    desc: 'Planifiez une session, échangez vos savoirs et gagnez des crédits temps pour la prochaine.',
  },
]

export function HowItWorksSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <section id="how" className="bg-[#FAFAFA] px-[5%] py-[50px] text-center">

      <SectionTag>Simple & rapide</SectionTag>

      <h2 style={{ marginBottom: '24px' }} className="font-display text-[clamp(2rem,4vw,2.8rem)] font-extrabold tracking-tight text-[#1C1033] mb-[14px]">
        Comment ça marche ?
      </h2>
      <p style={{ marginBottom: '24px' }} className="text-[#8B7EA8] text-base max-w-[500px] mx-auto mb-16 leading-[1.7]">
        Trois étapes pour commencer à apprendre et partager vos compétences
      </p>

      {/* ── Étapes ── */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', alignItems: 'flex-start' }} className="flex justify-center gap-8 items-start">
        {STEPS.map((step, i) => {
          const isHovered = hoveredIndex === i
          const isBlurred = hoveredIndex !== null && !isHovered

          return (
            <div
              key={step.num}
              className="flex-1 max-w-[300px] px-8 text-center relative"
              style={{
                transition: 'filter 0.35s ease, opacity 0.35s ease, transform 0.35s ease',
                filter: isBlurred ? 'blur(3px)' : 'none',
                opacity: isBlurred ? 0.4 : 1,
                transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
                cursor: 'default',
              }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Connecteur entre étapes */}
              {i < STEPS.length - 1 && (
                <div
                  className="absolute top-9 h-[2px] pointer-events-none"
                  style={{
                    left: 'calc(50% + 60px)',
                    right: 'calc(-50% + 60px)',
                    background: 'linear-gradient(90deg, #6D28D9, rgba(109,40,217,.15))',
                    transition: 'opacity 0.35s ease',
                    opacity: isBlurred ? 0.2 : 1,
                  }}
                />
              )}

              {/* Icône + numéro */}
              <div
                className="relative w-[72px] h-[72px] rounded-full bg-[#6D28D9] mx-auto mb-5 flex items-center justify-center text-2xl"
                style={{
                  marginBottom: '24px' ,
                  boxShadow: isHovered
                    ? '0 12px 40px rgba(109,40,217,.55)'
                    : '0 8px 30px rgba(108, 40, 217, 0.89)',
                  transition: 'box-shadow 0.35s ease',
                }}
              >
                <span style={{
                  fontSize: '1rem',
                  justifyContent: 'center',
                  display: 'flex',
                  alignItems: 'center',
                }} className="absolute -top-1 -right-1 w-[25px] h-[25px] rounded-full bg-[#D4F000] text-[#1C1033] text-[0.7rem] font-extrabold font-display flex items-center justify-center">
                  {step.num}
                </span>
              </div>

              <h3 className="font-display text-[1.05rem] font-bold text-[#1C1033] mb-[10px]">
                {step.title}
              </h3>
              <p className="text-[#8B7EA8] text-[0.88rem] leading-[1.65]">{step.desc}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}