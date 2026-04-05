"use client";
// components/auth/RegisterForm.tsx
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import Logo from "@/components/ui/Logo";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Alert } from "@/components/ui/Alert";
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
    <div
      style={{
        width: "50%",
        height: "100%",
        flexShrink: 0,
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "32px",
        overflowY: "auto",
      }}
    >
      <div style={{ width: "100%", maxWidth: "400px" }}>
        {/* Logo */}
        <div style={{ marginBottom: "18px" }}>
          <Logo variant="light" size="sm" href="/" />
        </div>

        <h2
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "1.9rem",
            fontWeight: 900,
            color: "#1C1033",
            marginBottom: "4px",
            letterSpacing: "-0.01em",
          }}
        >
          Créer mon compte
        </h2>

        <p
          style={{
            color: "#8B7EA8",
            fontSize: "0.85rem",
            marginBottom: "22px",
            lineHeight: 1.5,
          }}
        >
          Quelques secondes pour commencer ton aventure
        </p>

        <Alert variant="error" visible={!!serverError} className="mb-3">
          {serverError}
        </Alert>

        <form
          onSubmit={handleSubmit}
          noValidate
          style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
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
            showStrength
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
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            style={{
              width: "100%",
              height: "46px",
              backgroundColor: btnHover ? "#2d1a4f" : "#1C1033",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              fontSize: "0.92rem",
              fontWeight: 700,
              cursor: "pointer",
              marginTop: "2px",
              letterSpacing: "0.01em",
              transition: "background-color 0.2s",
            }}
          >
            Créer mon compte →
          </button>
        </form>

        <Divider label="ou continuer avec" />
        <GoogleButton />

        <p
          style={{
            textAlign: "center",
            marginTop: "16px",
            fontSize: "0.83rem",
            color: "#8B7EA8",
          }}
        >
          Déjà un compte ?{" "}
          <Link
            href="/login"
            style={{
              color: "#6D28D9",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Se connecter →
          </Link>
        </p>

        <p
          style={{
            textAlign: "center",
            marginTop: "12px",
            fontSize: "0.7rem",
            color: "rgba(139,126,168,0.7)",
            lineHeight: 1.6,
          }}
        >
          En créant un compte, tu acceptes nos{" "}
          <Link
            href="/cgu"
            style={{ color: "#6D28D9", textDecoration: "underline" }}
          >
            CGU
          </Link>{" "}
          et notre{" "}
          <Link
            href="/privacy"
            style={{ color: "#6D28D9", textDecoration: "underline" }}
          >
            politique de confidentialité
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
