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
    <div style={{
      width: '50%', height: '100%',
      backgroundColor: '#6D28D9',
      padding: '40px 48px',
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', flexShrink: 0,
    }}>
      {/* Orbe sombre top-right */}
      <div style={{
        position: 'absolute', width: '420px', height: '420px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(28,16,51,0.55) 0%, transparent 70%)',
        top: -120, right: -120, pointerEvents: 'none',
      }} />
      {/* Orbe citron bottom-left */}
      <div style={{
        position: 'absolute', width: '300px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,240,0,0.15) 0%, transparent 70%)',
        bottom: -60, left: -40, pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ marginBottom: '36px' }}>
          <Logo variant="dark" size="md" href="/" />
        </div>

        {/* Titre */}
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 'clamp(1.9rem, 3vw, 2.6rem)',
          fontWeight: 900, lineHeight: 1.1,
          color: '#ffffff', marginBottom: '14px', letterSpacing: '-0.01em',
        }}>
          Rejoins des milliers<br />
          de personnes qui ont<br />
          trouvé leur{' '}
          <span style={{ color: '#D4F000' }}>connexion idéale</span>
        </h1>

        <p style={{
          color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem',
          lineHeight: 1.6, marginBottom: '28px', maxWidth: '340px',
        }}>
          Crée ton profil en 2 minutes et découvre tes premiers matchs dès aujourd'hui.
        </p>

        {/* Carte profil mock */}
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: '16px', padding: '18px 20px', marginBottom: '28px',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '50%',
              backgroundColor: '#7C3AED',
              border: '2px solid rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.82rem', fontWeight: 800, color: '#ffffff', flexShrink: 0,
            }}>SA</div>
            <div>
              <p style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>
                Sarah, 28 ans
              </p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.74rem', margin: '2px 0 0' }}>
                Paris · Créatrice de contenu
              </p>
            </div>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <span style={{
              backgroundColor: '#D4F000', color: '#1C1033',
              fontSize: '0.7rem', fontWeight: 800,
              padding: '4px 11px', borderRadius: '999px',
            }}>✦ Match parfait · 97%</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {TAGS.map((tag) => (
              <span key={tag} style={{
                backgroundColor: 'rgba(255,255,255,0.12)',
                color: '#ffffff', fontSize: '0.73rem', fontWeight: 500,
                padding: '4px 11px', borderRadius: '999px',
                border: '1px solid rgba(255,255,255,0.18)',
              }}>{tag}</span>
            ))}
          </div>
        </div>

        {/* Perks */}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '11px' }}>
          {PERKS.map((perk) => (
            <li key={perk} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%',
                backgroundColor: 'rgba(212,240,0,0.18)',
                border: '1px solid rgba(212,240,0,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                  <path d="M1 4L4 7L10 1" stroke="#D4F000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.84rem' }}>{perk}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}