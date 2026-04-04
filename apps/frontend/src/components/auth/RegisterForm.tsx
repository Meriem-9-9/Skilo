'use client'

// components/auth/RegisterForm.tsx

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Logo from '@/components/ui/Logo'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Alert } from '@/components/ui/Alert'
import { Divider } from '@/components/ui/Divider'
import { GoogleButton } from '@/components/auth/GoogleButton'
import { useSimulatedAuth } from '@/hooks/useSimulatedAuth'

interface FormErrors {
  firstName?: string; lastName?: string; email?: string
  password?: string; confirmPassword?: string
}

function validate(f: {
  firstName: string; lastName: string; email: string
  password: string; confirmPassword: string
}): FormErrors {
  const e: FormErrors = {}
  if (f.firstName.length < 2) e.firstName = 'Min. 2 caractères.'
  if (f.lastName.length < 2) e.lastName = 'Min. 2 caractères.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Email invalide.'
  if (f.password.length < 8) e.password = 'Min. 8 caractères.'
  else if (!/(?=.*[A-Z])(?=.*\d)/.test(f.password)) e.password = '1 majuscule et 1 chiffre requis.'
  if (f.password !== f.confirmPassword) e.confirmPassword = 'Les mots de passe ne correspondent pas.'
  return e
}

export function RegisterForm() {
  const router = useRouter()
  const { loading, simulateRegister } = useSimulatedAuth()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [btnHover, setBtnHover] = useState(false)

  const clearField = (field: keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    setServerError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)
    const validationErrors = validate({ firstName, lastName, email, password, confirmPassword })
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return }
    setErrors({})
    const result = await simulateRegister({ firstName, lastName, email, password })
    if (!result.success) {
      if (result.error === 'EMAIL_ALREADY_EXISTS') {
        setErrors({ email: '' })
        setServerError(result.message ?? 'Cette adresse email est déjà utilisée.')
      } else {
        setServerError(result.message ?? 'Une erreur est survenue.')
      }
      return
    }
    router.push('/onboarding')
  }

  return (
    <div style={{
      width: '50%', height: '100%', flexShrink: 0,
      backgroundColor: '#ffffff',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      padding: '32px', overflowY: 'auto',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
        <div style={{ marginBottom: '18px' }}>
          <Logo variant="light" size="sm" href="/" />
        </div>

        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: '1.9rem', fontWeight: 900,
          color: '#1C1033', marginBottom: '4px', letterSpacing: '-0.01em',
        }}>
          Créer mon compte
        </h2>
        <p style={{ color: '#8B7EA8', fontSize: '0.85rem', marginBottom: '22px', lineHeight: 1.5 }}>
          Quelques secondes pour commencer ton aventure
        </p>

        <Alert variant="error" visible={!!serverError} className="mb-3">
          {serverError}
        </Alert>

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input label="Prénom" id="firstName" placeholder="Marie"
              autoComplete="given-name" value={firstName}
              onChange={(e) => { setFirstName(e.target.value); clearField('firstName') }}
              error={errors.firstName} />
            <Input label="Nom" id="lastName" placeholder="Dupont"
              autoComplete="family-name" value={lastName}
              onChange={(e) => { setLastName(e.target.value); clearField('lastName') }}
              error={errors.lastName} />
          </div>

          <Input label="Adresse email" type="email" id="email"
            placeholder="marie@exemple.com" autoComplete="email" value={email}
            onChange={(e) => { setEmail(e.target.value); clearField('email') }}
            error={errors.email} />

          <PasswordInput label="Mot de passe" id="password"
            placeholder="••••••••" autoComplete="new-password" value={password}
            onChange={(e) => { setPassword(e.target.value); clearField('password') }}
            error={errors.password} showStrength />

          <PasswordInput label="Confirmer le mot de passe" id="confirmPassword"
            placeholder="••••••••" autoComplete="new-password" value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); clearField('confirmPassword') }}
            error={errors.confirmPassword} />

          <button
            type="submit"
            disabled={loading}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            style={{
              width: '100%', height: '46px',
              backgroundColor: btnHover && !loading ? '#2d1a4f' : '#1C1033',
              color: '#ffffff', border: 'none', borderRadius: '10px',
              fontSize: '0.92rem', fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '2px', letterSpacing: '0.01em',
              transition: 'background-color 0.2s',
              opacity: loading ? 0.7 : 1,
            }}>
            {loading ? 'Création en cours...' : 'Créer mon compte →'}
          </button>
        </form>

        <Divider label="ou continuer avec" />
        <GoogleButton />

        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.83rem', color: '#8B7EA8' }}>
          Déjà un compte ?{' '}
          <Link href="/login" style={{ color: '#6D28D9', fontWeight: 600, textDecoration: 'none' }}>
            Se connecter →
          </Link>
        </p>

        <p style={{
          textAlign: 'center', marginTop: '12px',
          fontSize: '0.7rem', color: 'rgba(139,126,168,0.7)', lineHeight: 1.6,
        }}>
          En créant un compte, tu acceptes nos{' '}
          <Link href="/cgu" style={{ color: '#6D28D9', textDecoration: 'underline' }}>CGU</Link>
          {' '}et notre{' '}
          <Link href="/privacy" style={{ color: '#6D28D9', textDecoration: 'underline' }}>
            politique de confidentialité
          </Link>.
        </p>
      </div>
    </div>
  )
}