'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export interface ProfileInfo {
  city: string;
  bio: string;
}

interface ProfileStepProps {
  value: ProfileInfo;
  onChange: (info: ProfileInfo) => void;
}

export function ProfileStep({ value, onChange }: ProfileStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-base">About you</h3>
        <p className="text-sm text-muted-foreground">
          Help others know where you are and what you&apos;re about.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="onboarding-city">City</Label>
        <Input
          id="onboarding-city"
          placeholder="Paris, Lyon, Casablanca…"
          value={value.city}
          onChange={(e) => onChange({ ...value, city: e.target.value })}
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="onboarding-bio">Bio</Label>
          <span className="text-xs text-muted-foreground">{value.bio.length}/280</span>
        </div>
        <Textarea
          id="onboarding-bio"
          placeholder="Tell the community a bit about yourself and what you love to learn or teach…"
          value={value.bio}
          onChange={(e) => onChange({ ...value, bio: e.target.value })}
          maxLength={280}
          rows={4}
        />
      </div>
    </div>
  );
}
