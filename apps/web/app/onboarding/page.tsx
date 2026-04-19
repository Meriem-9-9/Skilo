'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { OnboardingForm } from '@/components/onboarding/onboarding-form';

export default function OnboardingPage() {
  const { isAuthenticated, isOnboarded, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
    }
    // ✅ Do NOT redirect when isOnboarded becomes true here.
    // The OnboardingForm handles its own navigation:
    //   - step 4 (congrats) renders inside the form
    //   - "Explore matches" button calls setOnboarded() THEN router.push('/dashboard')
    // If we redirect here, the congrats screen never shows.
  }, [isAuthenticated, isLoading, router]);

  // Only block render if not authenticated or still loading
  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">skilo</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Let&apos;s set up your profile — it only takes 2 minutes.
        </p>
      </div>
      <OnboardingForm />
    </main>
  );
}