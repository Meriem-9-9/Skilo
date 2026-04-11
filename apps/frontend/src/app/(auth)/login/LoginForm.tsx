// src/components/auth/LoginForm.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AxiosError } from 'axios';
import Link from 'next/link';

import { useAuth } from '@/contexts/AuthContext';

// ─── Validation schema ────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email requis')
    .email('Format email invalide'),
  password: z
    .string()
    .min(1, 'Mot de passe requis'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ─── Component ────────────────────────────────────────────────────────────────
export function LoginForm() {
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null);
    setIsLocked(false);

    try {
      await login(data);
      // La redirection est gérée dans AuthContext.login()
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string; statusCode: number }>;
      const status = axiosErr.response?.status;
      const message = axiosErr.response?.data?.message;

      if (status === 403) {
        // Compte verrouillé (bruteforce FC-01-B)
        setIsLocked(true);
        setServerError(message ?? 'Compte temporairement verrouillé.');
      } else if (status === 401) {
        setServerError('Email ou mot de passe incorrect.');
      } else {
        setServerError('Une erreur est survenue. Réessayez plus tard.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Erreur serveur globale */}
      {serverError && (
        <div
          role="alert"
          className={`mb-4 rounded-md px-4 py-3 text-sm ${
            isLocked
              ? 'bg-orange-50 text-orange-700 border border-orange-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {serverError}
        </div>
      )}

      {/* Email */}
      <div className="mb-4">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register('email')}
          className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm outline-none
            focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
            ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
          placeholder="alice@skilo.com"
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="mb-6">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register('password')}
          className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm outline-none
            focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
            ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
          placeholder="••••••••"
        />
        {errors.password && (
          <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold
          text-white shadow hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2
          focus-visible:outline-offset-2 focus-visible:outline-indigo-600
          disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Connexion…' : 'Se connecter'}
      </button>

      <p className="mt-4 text-center text-sm text-gray-500">
        Pas encore de compte ?{' '}
        <Link
          href="/register"
          className="font-medium text-indigo-600 hover:text-indigo-500"
        >
          Créer un compte
        </Link>
      </p>
    </form>
  );
}