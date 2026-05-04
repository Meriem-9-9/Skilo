import { Metadata } from 'next';
import { Suspense } from 'react';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata: Metadata = {
  title: 'Inscription | Skilo',
  description: 'Créer un nouveau compte sur Skilo',
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8 text-muted-foreground">Chargement du formulaire...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
