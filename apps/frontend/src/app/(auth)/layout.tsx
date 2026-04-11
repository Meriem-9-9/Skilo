import { ReactNode } from 'react'

/**
 * Layout partagé entre /login et /register.
 * Fond #F5F3FF + formes géométriques décoratives violet & citron.
 * Chaque page enfant se centre elle-même ou se positionne librement.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#F5F3FF] overflow-hidden">

      {/* ── Formes géométriques de fond ── */}

      {/* Grand cercle violet top-right */}
      <div
        className="pointer-events-none fixed z-0"
        style={{
          width: 480,
          height: 480,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(109,40,217,.10) 0%, transparent 65%)',
          top: -100,
          right: -80,
        }}
      />

      {/* Grand cercle violet bottom-left */}
      <div
        className="pointer-events-none fixed z-0"
        style={{
          width: 350,
          height: 350,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(109,40,217,.07) 0%, transparent 65%)',
          bottom: -60,
          left: -60,
        }}
      />

      {/* Rectangle décoratif top-left */}
      <div
        className="pointer-events-none fixed z-0 border-2 border-[rgba(109,40,217,0.08)]"
        style={{
          width: 160,
          height: 160,
          borderRadius: 24,
          transform: 'rotate(20deg)',
          top: '15%',
          left: '6%',
        }}
      />

      {/* Cercle citron mid-right */}
      <div
        className="pointer-events-none fixed z-0 border-2 border-[rgba(212,240,0,0.15)] rounded-full"
        style={{ width: 90, height: 90, top: '60%', right: '8%' }}
      />

      {/* Carré violet mid-right */}
      <div
        className="pointer-events-none fixed z-0 border-2 border-[rgba(109,40,217,0.10)]"
        style={{
          width: 50,
          height: 50,
          transform: 'rotate(45deg)',
          top: '30%',
          right: '12%',
        }}
      />

      {/* Grille de points */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            'radial-gradient(rgba(109,40,217,.12) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(0,0,0,.3) 0%, transparent 100%)',
          maskImage:
            'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(0,0,0,.3) 0%, transparent 100%)',
        }}
      />

      {/* Contenu de la page (login ou register) */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
