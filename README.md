# 🚀 Skilo — Échangez vos compétences

**Skilo** est une plateforme d'apprentissage collaboratif basée sur l'échange de temps et de savoirs. Le concept est simple : enseignez ce que vous maîtrisez pour gagner des crédits, et utilisez ces crédits pour apprendre de nouvelles compétences auprès d'autres experts.

---

## 🌐 Liens de Déploiement

- **Frontend** : [skilo-frontend-five.vercel.app](https://skilo-frontend-five.vercel.app/)
- **Backend (API)** : [skilo-backend-sigma.vercel.app](https://skilo-backend-sigma.vercel.app/)

---

## ✨ Fonctionnalités Clés

- **🎯 Matching Intelligent** : Un algorithme qui analyse vos compétences offertes et recherchées pour vous proposer des "Matchs Parfaits" (échange mutuel) ou des "Matchs Partiels".
- **⏳ Économie de Crédits Temps** : Système basé sur l'équité où **1 heure enseignée = 1 crédit**. Un plafond de 20 crédits assure une circulation fluide des connaissances.
- **📅 Gestion des Sessions** : Interface complète pour proposer, accepter et suivre vos sessions d'échange. Intégration automatique de liens de réunion (Jitsi).
- **🎁 Système de Parrainage** : Invitez vos amis et recevez **5 crédits** instantanément lors de leur inscription pour booster votre apprentissage.
- **🔔 Notifications en Temps Réel** : Alertes pour les nouveaux matchs, les messages reçus et les mises à jour de vos sessions prévues.
- **💎 Interface Premium** : Design moderne, sombre et épuré, optimisé pour une expérience utilisateur fluide et agréable.

---

## 🛠️ Stack Technique

### Monorepo (Turborepo)
- **Frontend** : [Next.js 16](https://nextjs.org/) (App Router), Tailwind CSS, Lucide React, Sonner.
- **Backend** : [NestJS](https://nestjs.com/), Prisma ORM, PostgreSQL.
- **Base de données** : Hébergée sur [Neon.tech](https://neon.tech/).
- **Authentification** : Système JWT sécurisé avec Refresh Tokens (HTTP-only cookies).

---

## 🚀 Démarrage Rapide

### 1. Installation
Installez les dépendances depuis la racine du projet :
```sh
pnpm install
```

### 2. Configuration
Créez les fichiers `.env` dans les dossiers respectifs :
- `apps/backend/.env` (DATABASE_URL, JWT_SECRET, etc.)
- `apps/frontend/.env.local` (NEXT_PUBLIC_API_URL)

### 3. Lancement
Démarrez les serveurs frontend et backend simultanément :
```sh
pnpm dev
```

L'application sera accessible sur `http://localhost:2004` (Frontend) et l'API sur `http://localhost:2006` (Backend).

---

## 📝 Licence
Projet développé dans le cadre de Skilo. Tous droits réservés.
