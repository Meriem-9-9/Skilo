'use client'

// components/auth/LoginCard.tsx

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AxiosError } from 'axios'
import Logo from '@/components/ui/Logo'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Alert } from '@/components/ui/Alert'
import { Divider } from '@/components/ui/Divider'
import { GoogleButton } from '@/components/auth/GoogleButton'
import { useAuth } from '@/contexts/AuthContext'

function validateEmail(email: string): string | null {
  if (!email) return 'Veuillez saisir votre adresse email.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Adresse email invalide.'
  return null
}

function validatePassword(password: string): string | null {
  if (!password) return 'Veuillez saisir votre mot de passe.'
  return null
}

export function LoginCard() {
  const router = useRouter()
  const { login, loading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [lockedBanner, setLockedBanner] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [btnHover, setBtnHover] = useState(false)

  const clearErrors = () => { 
    setServerError(null)
    setLockedBanner(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearErrors()
    
    const emailErr = validateEmail(email)
    const passwordErr = validatePassword(password)
    setEmailError(emailErr)
    setPasswordError(passwordErr)
    
    if (emailErr || passwordErr) return

    try {
      await login({ email, password })
      // La redirection est gérée dans AuthContext.login()
      setShowSuccess(true)
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string; statusCode: number }>
      const status = axiosErr.response?.status
      const message = axiosErr.response?.data?.message

      if (status === 403) {
        // Compte verrouillé (bruteforce FC-01-B)
        setLockedBanner(message ?? 'Compte temporairement verrouillé.')
        setServerError(null)
      } else if (status === 401) {
        setServerError('Email ou mot de passe incorrect.')
        setLockedBanner(null)
      } else {
        setServerError('Une erreur est survenue. Réessayez plus tard.')
        setLockedBanner(null)
      }
    }
  }

  if (showSuccess) return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: '#1C1033', zIndex: 50,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px',
    }}>
      <span style={{ fontSize: '3rem' }}>✦</span>
      <p style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ffffff', fontFamily: "'Barlow Condensed', sans-serif" }}>
        Connexion <span style={{ color: '#D4F000' }}>réussie !</span>
      </p>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Redirection vers votre dashboard...</p>
    </div>
  )

  return (
    <div style={{
      position: 'relative', zIndex: 1,
      width: '100%', maxWidth: '440px',
      backgroundColor: '#ffffff',
      borderRadius: '24px',
      padding: '40px 40px 32px',
      boxShadow: '0 8px 16px rgba(109,40,217,0.06), 0 24px 64px rgba(109,40,217,0.14), 0 0 0 1px rgba(109,40,217,0.08)',
    }}>

      {/* Logo centré */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <Logo variant="light" size="md" href="/" />
      </div>

      {/* Badge */}
      <div style={{ textAlign: 'center', marginBottom: '18px' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          backgroundColor: '#D4F000', color: '#1C1033',
          fontSize: '0.8rem', fontWeight: 800,
          padding: '6px 16px', borderRadius: '999px',
          letterSpacing: '0.02em',
        }}>
          ✦ Bon retour parmi nous !
        </span>
      </div>

      {/* Titre */}
      <h1 style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: '2rem', fontWeight: 900,
        color: '#1C1033', textAlign: 'center',
        marginBottom: '6px', letterSpacing: '-0.01em',
      }}>
        Se connecter
      </h1>
      <p style={{
        color: '#8B7EA8', fontSize: '0.875rem',
        textAlign: 'center', marginBottom: '28px', lineHeight: 1.55,
      }}>
        Content de te revoir. Entre tes identifiants pour accéder à tes matchs.
      </p>

      {/* Alertes */}
      <Alert variant="error" visible={!!serverError} className="mb-4">{serverError}</Alert>
      <Alert variant="warning" visible={!!lockedBanner} className="mb-4">{lockedBanner}</Alert>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        <Input
          label="Adresse email" type="email" id="email"
          placeholder="marie@exemple.com" autoComplete="email" value={email}
          onChange={(e) => { setEmail(e.target.value); setEmailError(null); clearErrors() }}
          error={emailError ?? undefined}
        />

        <PasswordInput
          label="Mot de passe" id="password"
          placeholder="••••••••" autoComplete="current-password" value={password}
          onChange={(e) => { setPassword(e.target.value); setPasswordError(null); clearErrors() }}
          error={passwordError ?? undefined}
          rightSlot={
            <Link href="/forgot-password" style={{
              color: '#6D28D9', fontWeight: 600,
              fontSize: '0.78rem', textDecoration: 'none',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              Mot de passe oublié ?
            </Link>
          }
        />

        {/* Se souvenir de moi */}
        <label style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          cursor: 'pointer', userSelect: 'none',
        }}>
          <div
            onClick={() => setRememberMe(!rememberMe)}
            style={{
              width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0,
              border: `2px solid ${rememberMe ? '#6D28D9' : 'rgba(109,40,217,0.25)'}`,
              backgroundColor: rememberMe ? '#6D28D9' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
              cursor: 'pointer',
            }}
          >
            {rememberMe && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <span style={{ color: '#8B7EA8', fontSize: '0.84rem' }}>Se souvenir de moi</span>
        </label>

        {/* Bouton submit */}
        <button
          type="submit"
          disabled={loading}
          onMouseEnter={() => setBtnHover(true)}
          onMouseLeave={() => setBtnHover(false)}
          style={{
            width: '100%', height: '48px',
            backgroundColor: btnHover && !loading ? '#2d1a4f' : '#1C1033',
            color: '#ffffff', border: 'none', borderRadius: '10px',
            fontSize: '0.95rem', fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: '2px', letterSpacing: '0.01em',
            transition: 'background-color 0.2s',
            opacity: loading ? 0.7 : 1,
          }}>
          {loading ? 'Connexion...' : 'Se connecter →'}
        </button>
      </form>

      <Divider label="ou continuer avec" />
      <GoogleButton />

      {/* Lien inscription */}
      <p style={{ textAlign: 'center', marginTop: '18px', fontSize: '0.85rem', color: '#8B7EA8' }}>
        Pas encore de compte ?{' '}
        <Link href="/register" style={{ color: '#6D28D9', fontWeight: 700, textDecoration: 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
        >
          S&apos;inscrire gratuitement →
        </Link>
      </p>

      {/* Badge sécurité */}
      <p style={{
        textAlign: 'center', marginTop: '16px',
        fontSize: '0.7rem', color: 'rgba(139,126,168,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        Connexion sécurisée SSL · Données chiffrées
      </p>
    </div>
  )
}