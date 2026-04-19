import { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Sign In | Skilo',
  description: 'Sign in to your account',
};

export default function LoginPage() {
  return <LoginForm />;
}
