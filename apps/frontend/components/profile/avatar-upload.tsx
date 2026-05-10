import { useState, useRef } from 'react';
import { Camera } from 'lucide-react';
import { uploadApi } from '@/lib/api';
import { ALLOWED_TYPES, MAX_FILE_MB } from '@/app/(dashboard)/profile/utils';

interface AvatarUploadProps {
  currentUrl?: string;
  firstName: string;
  lastName: string;
  onUploaded: (url: string) => void;
}

export function AvatarUpload({
  currentUrl, firstName, lastName, onUploaded,
}: AvatarUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview]   = useState(currentUrl ?? '');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const initials = [firstName[0], lastName[0]].join('').toUpperCase();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Formats acceptés : JPG, PNG, WebP.');
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`Photo max ${MAX_FILE_MB} Mo.`);
      return;
    }
    setError(null);
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    try {
      const { avatarUrl } = await uploadApi.avatar(file);
      setPreview(avatarUrl);
      onUploaded(avatarUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload échoué.');
      setPreview(currentUrl ?? '');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={loading}
        className="relative w-24 h-24 rounded-full border-2 border-dashed border-border hover:border-primary transition-colors overflow-hidden bg-muted flex items-center justify-center"
      >
        {preview
          ? <img src={preview} alt="avatar" className="w-full h-full object-cover" />
          : <span className="text-2xl font-bold text-primary">{initials}</span>
        }
        {loading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-xs">Upload…</span>
          </div>
        )}
        <div className="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-2 border-background">
          <Camera className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
      </button>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
      <p className="text-xs text-muted-foreground text-center">JPG, PNG, WebP · max {MAX_FILE_MB} Mo</p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
