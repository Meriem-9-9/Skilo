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