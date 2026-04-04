// app/(auth)/register/page.tsx

/**
 * Page Register
 *
 * Ce fichier ne contient aucune logique ni aucun style.
 * Il orchestre simplement les deux panneaux.
 * Pour modifier → aller dans components/auth/
 */

import { RegisterLeftPanel } from '@/components/auth/RegisterLeftPanel'
import { RegisterForm } from '@/components/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <div style={{
      display: 'flex',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
    }}>
      <RegisterLeftPanel />
      <RegisterForm />
    </div>
  )
}