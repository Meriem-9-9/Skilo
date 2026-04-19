import { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata: Metadata = {
  title: 'Sign Up | Skilo',
  description: 'Create a new account',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
