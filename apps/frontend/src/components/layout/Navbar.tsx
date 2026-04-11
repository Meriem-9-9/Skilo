'use client'

import Link from 'next/link'
import { useState } from 'react'
import Logo from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'

const NAV_LINKS = [
  { label: 'Fonctionnalités', href: '#features' },
  { label: 'Comment ça marche', href: '#how' },
  { label: 'Témoignages', href: '#stats' },
]

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav
      style={{
        backgroundColor: '#1C1033',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 5%',
        height: '68px',
      }}
    >
      {/* Logo */}
      <Logo variant="dark" size="md" href="/" />

      {/* Links — toujours visibles (pas de hidden md:flex) */}
      <ul style={{ display: 'flex', gap: '2rem', listStyle: 'none', margin: 0, padding: 0 }}>
        {NAV_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              style={{
                color: 'rgba(255,255,255,0.65)',
                fontSize: '1rem',
                fontWeight: 700,
                textDecoration: 'none',
                letterSpacing: '0.06em',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Se connecter */}
        <Button
          asChild
          variant="outline-white"
          size="sm"
          style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.35)', borderRadius: '10px' ,padding: '8px 20px'}}
        >
          <Link href="/login" style={{ color: '#ffffff', textDecoration: 'none' }}>
            Se connecter
          </Link>
        </Button>

        {/* Commencer */}
        <Button
          asChild
          variant="citron"
          size="sm"
          style={{ backgroundColor: '#D4F000', color: '#1C1033', borderRadius: '10px' ,padding: '8px 20px'}}
        >
          <Link href="/register" style={{ color: '#1C1033', textDecoration: 'none' }}>
            Commencer →
          </Link>
        </Button>
      </div>
    </nav>
  )
}