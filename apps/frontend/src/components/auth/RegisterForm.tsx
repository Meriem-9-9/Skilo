"use client";
// components/auth/RegisterForm.tsx
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import Logo from "@/components/ui/Logo";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { Divider } from "@/components/ui/Divider";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { useAuth } from "@/contexts/AuthContext";

export function RegisterForm() {
  const router = useRouter();
  const { register: authRegister } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [btnHover, setBtnHover] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateField = (name: string, value: string) => {
    switch (name) {
      case "firstName":
        if (value.length < 2) return "Min. 2 caractères.";
        break;
      case "lastName":
        if (value.length < 2) return "Min. 2 caractères.";
        break;
      case "email":
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Email invalide.";
        break;
      case "password":
        if (value.length < 8) return "Min. 8 caractères.";
        if (!/(?=.*[A-Z])(?=.*\d)/.test(value))
          return "1 majuscule et 1 chiffre requis.";
        break;
      case "confirmPassword":
        if (value !== formData.password)
          return "Les mots de passe ne correspondent pas.";
        break;
    }
    return undefined;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field error when user starts typing
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setServerError(null);
  };

  const validateForm = () => {
    const errors: typeof fieldErrors = {};

    errors.firstName = validateField("firstName", formData.firstName);
    errors.lastName = validateField("lastName", formData.lastName);
    errors.email = validateField("email", formData.email);
    errors.password = validateField("password", formData.password);
    errors.confirmPassword = validateField(
      "confirmPassword",
      formData.confirmPassword
    );

    // Remove undefined values
    Object.keys(errors).forEach((key) => {
      if (errors[key as keyof typeof errors] === undefined) {
        delete errors[key as keyof typeof errors];
      }
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateForm()) return;

    try {
      await authRegister({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });
      // La redirection est gérée dans AuthContext
    } catch (err) {
      const axiosErr = err as AxiosError<{
        message: string | string[];
        statusCode: number;
      }>;
      const status = axiosErr.response?.status;
      const message = axiosErr.response?.data?.message;

      if (status === 409) {
        setFieldErrors((prev) => ({ ...prev, email: " " }));
        setServerError("Cette adresse email est déjà utilisée.");
      } else if (status === 400 && Array.isArray(message)) {
        setServerError(message.join(" — "));
      } else {
        setServerError("Une erreur est survenue. Réessayez plus tard.");
      }
    }
  };

  return (
    <div className="w-1/2 h-full shrink-0 bg-white flex flex-col justify-center items-center p-8 overflow-y-auto">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="mb-4">
          <Logo variant="light" size="sm" href="/" />
        </div>

        <h2 className="font-display text-[1.9rem] font-black text-dark mb-1 tracking-tight">
          Créer mon compte
        </h2>

        <p className="text-text-muted text-[0.85rem] mb-5 leading-relaxed">
          Quelques secondes pour commencer ton aventure
        </p>

        {!!serverError && (
          <Alert variant="destructive" className="mb-3">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Prénom"
              id="firstName"
              name="firstName"
              placeholder="Marie"
              autoComplete="given-name"
              value={formData.firstName}
              onChange={handleChange}
              error={fieldErrors.firstName}
            />
            <Input
              label="Nom"
              id="lastName"
              name="lastName"
              placeholder="Dupont"
              autoComplete="family-name"
              value={formData.lastName}
              onChange={handleChange}
              error={fieldErrors.lastName}
            />
          </div>

          <Input
            label="Adresse email"
            type="email"
            id="email"
            name="email"
            placeholder="marie@exemple.com"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            error={fieldErrors.email}
          />

          <PasswordInput
            label="Mot de passe"
            id="password"
            name="password"
            placeholder="••••••••"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            error={fieldErrors.password}
            // If the ui component supports showStrength uncomment this
            // showStrength
          />

          <PasswordInput
            label="Confirmer le mot de passe"
            id="confirmPassword"
            name="confirmPassword"
            placeholder="••••••••"
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={fieldErrors.confirmPassword}
          />

          <button
            type="submit"
            className="w-full h-[46px] bg-dark-custom hover:bg-[#2d1a4f] text-white border-none rounded-[10px] text-[0.92rem] font-bold cursor-pointer mt-0.5 tracking-[0.01em] transition-colors"
          >
            Créer mon compte →
          </button>
        </form>

        <Divider label="ou continuer avec" />
        <GoogleButton />

        <p className="text-center mt-4 text-[0.83rem] text-text-muted">
          Déjà un compte ?{" "}
          <Link href="/login" className="text-violet font-semibold no-underline hover:underline">
            Se connecter →
          </Link>
        </p>

        <p className="text-center mt-3 text-[0.7rem] text-text-muted/70 leading-relaxed">
          En créant un compte, tu acceptes nos{" "}
          <Link href="/cgu" className="text-violet underline">CGU</Link>{" "}
          et notre{" "}
          <Link href="/privacy" className="text-violet underline">politique de confidentialité</Link>.
        </p>
      </div>
    </div>
  );
}
