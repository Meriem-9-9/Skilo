'use client'

import { useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import Link from 'next/link'

interface MatchCardProps {
  name?: string
  initials?: string
  city?: string
  subtitle?: string
  score?: number
  offeredSkills?: string[]
  wantedSkills?: string[]
}

export function MatchCard({
  name = 'Sarah, 28 ans',
  initials = 'SA',
  city = 'Paris',
  subtitle = 'Créatrice de contenu',
  score = 97,
  offeredSkills = ['Voyages', 'Jazz', 'Photographie', 'Lecture'],
  wantedSkills = ['Python', 'C++'],
}: MatchCardProps) {
  const [hovered, setHovered] = useState(false)

  const tagStyle = {
    backgroundColor: 'rgba(109,40,217,0.25)',
    color: '#ffffff',
    fontSize: '0.85rem',
    fontWeight: 500,
    padding: '8px 16px',
    borderRadius: '999px',
    border: '1px solid rgba(109,40,217,0.4)',
    display: 'inline-block',
  }

  const labelStyle = {
    color: 'rgba(255,255,255,0.4)',
    fontSize: '0.72rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: '10px',
  }

  return (
    <div className="relative animate-float" style={{ position: 'relative', display: 'inline-block' }}>
      <div
        style={{
          backgroundColor: '#1e1545',
          borderRadius: '20px',
          width: '360px',
          padding: '28px',
          position: 'relative',
          right: '-100px',
          boxShadow: '0 20px 60px rgba(211, 200, 215, 0.5), 0 0 0 1px rgba(109,40,217,0.3)',
          border: '1px solid rgba(109,40,217,0.25)',
        }}
      >
        {/* Header — Profil */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '26px' }}>
          {/* Avatar agrandi via wrapper */}
          {/* Avatar — cercle mauve forcé */}
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            backgroundColor: '#6D28D9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: '1rem',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '0.02em',
          }}>
            {initials}
          </div>
          <div>
            <h4 style={{
              fontWeight: 700,
              fontSize: '1.05rem',
              color: '#ffffff',
              margin: 0,
              lineHeight: 1.3,
            }}>
              {name}
            </h4>
            <p style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.83rem',
              margin: 0,
              marginTop: '4px',
            }}>
              {city} · {subtitle}
            </p>
          </div>
        </div>

        {/* Badge score */}
        <div style={{ marginBottom: '26px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#D4F000',
            color: '#1C1033',
            fontWeight: 700,
            fontSize: '0.88rem',
            padding: '9px 18px',
            borderRadius: '999px',
          }}>
            ✦ {score}% compatible
          </span>
        </div>

        {/* Compétences offertes */}
        <div style={{ marginBottom: '22px' }}>
          <p style={labelStyle}>Elle offre</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {offeredSkills.map((s) => (
              <span key={s} style={tagStyle}>{s}</span>
            ))}
          </div>
        </div>

        {/* Séparateur */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.07)',
          marginBottom: '22px',
        }} />

        {/* Compétences cherchées */}
        <div style={{ marginBottom: '26px' }}>
          <p style={labelStyle}>Elle cherche</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {wantedSkills.map((s) => (
              <span
                key={s}
                style={{
                  ...tagStyle,
                  backgroundColor: 'rgba(212,240,0,0.1)',
                  border: '1px solid rgba(212,240,0,0.25)',
                  color: '#D4F000',
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: '18px',
          textAlign: 'center',
        }}>
          <Link
            href="/register"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
              color: hovered ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)',
              fontSize: '0.85rem',
              textDecoration: 'none',
              letterSpacing: '0.03em',
              transition: 'color 0.2s',
              fontWeight: hovered ? 600 : 400,
            }}
          >
            Explorer ce profil →
          </Link>
        </div>
      </div>
    </div>
  )
}