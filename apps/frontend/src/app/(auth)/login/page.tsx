import { LoginBackground } from '@/components/auth/LoginBackground'
import { LoginCard } from '@/components/auth/LoginCard'

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      position: 'relative',
    }}>
      <LoginBackground />
      <LoginCard />
    </div>
  )
}