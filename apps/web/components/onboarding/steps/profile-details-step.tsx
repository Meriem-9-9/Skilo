'use client';

import { useState, useRef } from 'react';
import { uploadApi } from '@/lib/api';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Camera } from 'lucide-react';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_MB   = 5;
const BIO_MAX    = 280;

export function ProfileDetailsStep({ city, bio, avatarUrl, onCityChange, onBioChange, onAvatarUrl }: {
  city: string;
  bio: string;
  avatarUrl: string;
  onCityChange: (v: string) => void;
  onBioChange: (v: string) => void;
  onAvatarUrl: (url: string) => void;
}) {
  const fileInputRef       = useRef<HTMLInputElement>(null);
  const [preview, setPreview]         = useState<string>(avatarUrl);
  const [uploading, setUploading]     = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Accepted formats: JPG, PNG, WebP.');
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setUploadError(`Photo must be under ${MAX_FILE_MB} MB.`);
      return;
    }

    setUploadError(null);
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    setUploading(true);
    try {
      const { avatarUrl: cloudUrl } = await uploadApi.avatar(file);
      onAvatarUrl(cloudUrl);
      setPreview(cloudUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed.');
      setPreview('');
      onAvatarUrl('');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">A bit about you</h2>
        <p className="text-muted-foreground text-sm mt-1">
          All fields are optional — you can always fill them in later.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative w-24 h-24 rounded-full border-2 border-dashed border-border hover:border-primary transition-colors overflow-hidden bg-muted flex items-center justify-center"
          disabled={uploading}
        >
          {preview ? (
            <img src={preview} alt="Avatar preview" className="w-full h-full object-cover" />
          ) : (
            <Camera className="w-8 h-8 text-muted-foreground" />
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-xs">Uploading…</span>
            </div>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        <p className="text-xs text-muted-foreground text-center">
          Click to upload a photo<br />JPG, PNG or WebP · max {MAX_FILE_MB} MB
        </p>
        {uploadError && <p className="text-xs text-destructive text-center">{uploadError}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">City <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Input
          id="city"
          placeholder="e.g. Casablanca"
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Textarea
          id="bio"
          placeholder="Tell others what you're passionate about…"
          value={bio}
          onChange={(e) => { if (e.target.value.length <= BIO_MAX) onBioChange(e.target.value); }}
          rows={4}
        />
        <p className={`text-xs text-right ${bio.length >= BIO_MAX ? 'text-destructive' : 'text-muted-foreground'}`}>
          {bio.length} / {BIO_MAX}
        </p>
      </div>
    </div>
  );
}
