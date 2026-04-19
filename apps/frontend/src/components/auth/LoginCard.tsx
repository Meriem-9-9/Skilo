'use client'

// components/auth/LoginCard.tsx

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AxiosError } from 'axios'
import { ShieldCheck, Check } from 'lucide-react'
import Logo from '@/components/ui/Logo'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { Divider } from '@/components/ui/Divider'
import { GoogleButton } from '@/components/auth/GoogleButton'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'

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
    <div className="fixed inset-0 bg-dark-custom z-50 flex flex-col items-center justify-center gap-5">
      <span className="text-5xl text-white">✦</span>
      <p className="text-3xl font-black text-white font-display uppercase tracking-wider">
        Connexion <span className="text-citron">réussie !</span>
      </p>
      <p className="text-white/50 text-sm">Redirection vers votre dashboard...</p>
    </div>
  )

  return (
    <Card className="relative z-10 w-full max-w-[440px] bg-white rounded-3xl p-10 pb-8 shadow-[0_8px_16px_rgba(109,40,217,0.06),0_24px_64px_rgba(109,40,217,0.14),0_0_0_1px_rgba(109,40,217,0.08)] border-none">

      {/* Logo centré */}
      <div className="text-center mb-5">
        <Logo variant="light" size="md" href="/" />
      </div>

      {/* Badge */}
      <div className="text-center mb-4">
        <span className="inline-flex items-center gap-1.5 bg-citron-custom text-dark px-4 py-1.5 rounded-full text-xs font-extrabold tracking-wide">
          ✦ Bon retour parmi nous !
        </span>
      </div>

      {/* Titre */}
      <h1 className="font-display text-4xl font-black text-dark text-center mb-2 tracking-tight uppercase">
        Se connecter
      </h1>
      <p className="text-text-muted text-sm text-center mb-7 leading-relaxed">
        Content de te revoir. Entre tes identifiants pour accéder à tes matchs.
      </p>

      {/* Alertes */}
      {!!serverError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}
      {!!lockedBanner && (
        <Alert variant="warning" className="mb-4">
          <AlertDescription>{lockedBanner}</AlertDescription>
        </Alert>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3.5">

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
            <Link href="/forgot-password" className="text-violet font-semibold text-xs hover:underline">
              Mot de passe oublié ?
            </Link>
          }
        />

        {/* Se souvenir de moi */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none group">
          <div
            onClick={() => setRememberMe(!rememberMe)}
            className={`w-4 h-4 rounded-md shrink-0 flex items-center justify-center transition-all ${
              rememberMe ? 'bg-violet-custom border-2 border-violet-custom' : 'bg-transparent border-2 border-violet-custom/25'
            }`}
          >
            {rememberMe && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
          </div>
          <span className="text-text-muted text-sm">Se souvenir de moi</span>
        </label>

        {/* Bouton submit */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 mt-1 bg-dark-custom hover:bg-[#2d1a4f] text-white text-[15px] font-bold tracking-wide rounded-xl transition-all"
        >
          {loading ? 'Connexion...' : 'Se connecter →'}
        </Button>
      </form>

      <Divider label="ou continuer avec" />
      <GoogleButton />

      {/* Lien inscription */}
      <p className="text-center mt-5 text-sm text-text-muted">
        Pas encore de compte ?{' '}
        <Link href="/register" className="text-violet font-bold hover:underline">
          S&apos;inscrire gratuitement →
        </Link>
      </p>

      {/* Badge sécurité */}
      <p className="text-center mt-4 text-[11px] text-text-muted/60 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3 h-3" />
        Connexion sécurisée SSL · Données chiffrées
      </p>
    </Card>
  )
}