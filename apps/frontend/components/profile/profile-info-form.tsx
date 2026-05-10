import { User as UserIcon } from 'lucide-react';
import { AvatarUpload } from './avatar-upload';
import { BIO_MAX } from '@/app/(dashboard)/profile/utils';
import type { User } from '@/lib/api';

interface ProfileInfoFormProps {
  profile: User;
  firstName: string;
  setFirstName: (val: string) => void;
  lastName: string;
  setLastName: (val: string) => void;
  city: string;
  setCity: (val: string) => void;
  bio: string;
  setBio: (val: string) => void;
  avatarUrl: string;
  setAvatarUrl: (val: string) => void;
  onSave: () => Promise<void>;
  saving: boolean;
}

export function ProfileInfoForm({
  profile,
  firstName, setFirstName,
  lastName, setLastName,
  city, setCity,
  bio, setBio,
  avatarUrl, setAvatarUrl,
  onSave, saving
}: ProfileInfoFormProps) {
  return (
    <section className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <UserIcon className="w-5 h-5 text-primary" /> Informations générales
      </h2>

      {/* Avatar */}
      <AvatarUpload
        currentUrl={avatarUrl}
        firstName={profile.firstName}
        lastName={profile.lastName}
        onUploaded={setAvatarUrl}
      />

      {/* Name */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium">Prénom</label>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            maxLength={50}
            className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Nom</label>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            maxLength={50}
            className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* City */}
      <div className="space-y-1">
        <label className="text-xs font-medium">Ville <span className="text-muted-foreground">(optionnel)</span></label>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          maxLength={100}
          placeholder="Ex: Casablanca"
          className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Bio */}
      <div className="space-y-1">
        <label className="text-xs font-medium">Bio <span className="text-muted-foreground">(optionnel)</span></label>
        <textarea
          value={bio}
          onChange={(e) => { if (e.target.value.length <= BIO_MAX) setBio(e.target.value); }}
          rows={4}
          placeholder="Parlez de votre parcours, vos passions…"
          className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
        <p className={`text-xs text-right ${bio.length >= BIO_MAX ? 'text-destructive' : 'text-muted-foreground'}`}>
          {bio.length}/{BIO_MAX}
        </p>
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-60 transition-opacity shadow-sm hover:bg-primary/90"
      >
        {saving ? 'Sauvegarde…' : 'Sauvegarder les informations'}
      </button>
    </section>
  );
}
