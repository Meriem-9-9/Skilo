import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

// ── Fonts ─────────────────────────────────────────────────────────────────

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-dm-sans",
  display: "swap",
});

// ── Metadata ──────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: "SkillSwap — Échangez vos compétences",
    template: "%s | SkillSwap",
  },
  description:
    "Trouvez quelquun qui a ce que vous cherchez, offrez ce que vous savez — sans argent, juste du temps et du talent.",
  keywords: [
    "compétences",
    "échange",
    "skill swap",
    "apprentissage",
    "communauté",
  ],
  openGraph: {
    title: "SkillSwap — Échangez vos compétences",
    description:
      "La plateforme qui transforme le savoir en monnaie déchange. Trouvez, partagez, grandissez ensemble.",
    type: "website",
  },
};

// ── Layout ────────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${syne.variable} ${dmSans.variable}`}>
      <body className="font-body antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
