'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FormError } from '@/components/auth/form-error';
import { useAuth } from '@/contexts/auth-context';

export function RegisterForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');

  // Client-side validation before hitting the API
  function validate(): string | null {
    if (firstName.trim().length < 2) return 'Le prénom doit contenir au moins 2 caractères.';
    if (lastName.trim().length < 2) return 'Le nom doit contenir au moins 2 caractères.';
    if (password.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
    if (!/[A-Z]/.test(password)) return 'Le mot de passe doit contenir au moins une majuscule.';
    if (!/[0-9]/.test(password)) return 'Le mot de passe doit contenir au moins un chiffre.';
    if (password !== confirmPassword) return 'Les mots de passe ne correspondent pas.';
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      const data = await authApi.register({ 
        firstName, 
        lastName, 
        email, 
        password,
        referredById: ref || undefined
      });
      login(data.access_token, data.user);
      //New users go to onboarding, not dashboard
      router.push('/onboarding');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Créer votre compte</CardTitle>
        <CardDescription className="text-center">
          Rejoignez skilo — enseignez ce que vous savez, apprenez ce que vous voulez
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <FormError message={error} />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="register-firstName">Prénom</Label>
              <Input
                id="register-firstName"
                placeholder="Jean"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                minLength={2}
                maxLength={50}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-lastName">Nom</Label>
              <Input
                id="register-lastName"
                placeholder="Dupont"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                minLength={2}
                maxLength={50}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-email">Email</Label>
            <Input
              id="register-email"
              type="email"
              placeholder="votre@email.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-password">Mot de passe</Label>
            <Input
              id="register-password"
              type="password"
              autoComplete="new-password"
              placeholder="Min. 8 car., 1 majuscule, 1 chiffre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-confirm">Confirmer le mot de passe</Label>
            <Input
              id="register-confirm"
              type="password"
              autoComplete="new-password"
              placeholder="Répétez votre mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 mt-2">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Création du compte…' : 'S\'inscrire'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Vous avez déjà un compte ?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Se connecter
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}