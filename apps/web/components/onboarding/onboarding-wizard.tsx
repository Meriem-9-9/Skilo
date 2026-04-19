'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FormError } from '@/components/auth/form-error';
import { SkillPicker } from '@/components/onboarding/skill-picker';
import { ProfileStep, ProfileInfo } from '@/components/onboarding/profile-step';
import { onboardingApi, SkillEntry } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

const STEPS = [
  { id: 1, label: 'Skills you teach', description: 'What can you offer to others?' },
  { id: 2, label: 'Skills you learn', description: 'What do you want to learn?' },
  { id: 3, label: 'Your profile', description: 'A bit about yourself.' },
];

export function OnboardingWizard() {
  const { setOnboarded } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(0); // 0-indexed
  const [skillsOffered, setSkillsOffered] = useState<SkillEntry[]>([]);
  const [skillsWanted, setSkillsWanted] = useState<SkillEntry[]>([]);
  const [profile, setProfile] = useState<ProfileInfo>({ city: '', bio: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLastStep = step === STEPS.length - 1;

  // Per-step validation
  const canProceed = () => {
    if (step === 0) return skillsOffered.length >= 1;
    if (step === 1) return skillsWanted.length >= 1;
    return true; // step 3 (profile) is optional
  };

  const handleNext = () => {
    if (!canProceed()) return;
    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await onboardingApi.complete({
        skillsOffered,
        skillsWanted,
        city: profile.city || undefined,
        bio: profile.bio || undefined,
      });

      setOnboarded();
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 flex-1">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 transition-colors ${
                i <= step
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {i < step ? '✓' : s.id}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 transition-colors ${
                  i < step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step].label}</CardTitle>
          <CardDescription>{STEPS[step].description}</CardDescription>
        </CardHeader>

        <CardContent>
          <FormError message={error} />

          {step === 0 && (
            <SkillPicker
              description="Select 1–5 skills you can offer to others."
              selected={skillsOffered}
              onChange={setSkillsOffered}
            />
          )}

          {step === 1 && (
            <SkillPicker
              description="Select 1–5 skills you'd like to pick up."
              selected={skillsWanted}
              onChange={setSkillsWanted}
            />
          )}

          {step === 2 && (
            <ProfileStep value={profile} onChange={setProfile} />
          )}
        </CardContent>

        <CardFooter className="flex justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={step === 0}
          >
            Back
          </Button>

          {isLastStep ? (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Finishing…' : 'Finish & Go to Dashboard'}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Next
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
