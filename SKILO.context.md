# SKILO — Project Context
> Fichier de contexte projet. À coller en début de conversation avec Claude pour maintenir la cohérence entre sessions.
> Dernière mise à jour : 2025

---

## 0. Contexte global du projet SkillSwap

**SkillSwap** est une plateforme web d'échange de compétences entre particuliers, développée en binôme dans un cadre académique.  
La promesse : *"Tu m'apprends ce que tu sais, je t'apprends ce que je sais."* — sans argent, uniquement du temps et du savoir.

**Problème résolu :** les cours en ligne coûtent cher, l'IA n'offre pas d'interaction humaine réelle, et trouver dans son entourage quelqu'un avec les bonnes compétences est difficile. SkillSwap répond à tout ça via un algorithme de matching et un système de crédits temps inspiré des banques de temps communautaires (1h enseignée = 1 crédit = 1h d'apprentissage auprès de n'importe qui).

**Stack technique :** NestJS (backend) · React + Next.js (frontend) · PostgreSQL · Socket.io · JWT · Axios

### 6 fonctionnalités Must Have

| Code | Feature |
|---|---|
| FC-01 | Authentification & Onboarding (inscription, connexion, déconnexion, onboarding 3 étapes obligatoires) |
| FC-02 | Profil utilisateur (édition avec indicateur de force, profil public) |
| FC-03 | Algorithme de matching (matchs parfaits = réciprocité mutuelle, matchs partiels = sens unique) |
| FC-04 | Sessions (proposition, cycle de vie complet : pending → confirmed → completed/cancelled/auto-completed) |
| FC-05 | Évaluations (note 1-5 étoiles + sous-critères, badge "Fiable" automatique) |
| FC-06 | Crédits temps (2 crédits à l'inscription, 1 crédit/heure enseignée, plafond 20 crédits) |

### Règles métier clés

- JWT access token 15min en mémoire (pas localStorage) + refresh token 7j en cookie httpOnly
- Matching recalculé asynchroniquement à la connexion, après modification du profil, et toutes les heures
- Une session doit être proposée au moins 2h à l'avance, max 30j dans le futur
- Les crédits sont réservés à la proposition, débités à l'acceptation, remboursés si annulation
- Les évaluations mutuelles ne sont visibles qu'après que les deux parties ont soumis la leur (anti-biais)
- Fenêtre d'évaluation : 7 jours après la session complétée
- IDs en UUID v4 uniquement (jamais d'entiers auto-incrémentés dans les URLs)

---

## 1. Vue d'ensemble

**SKILO** est une plateforme de skill-sharing peer-to-peer.  
Les utilisateurs échangent des compétences contre des crédits (pas d'argent réel).  
Stack : **NestJS 11 (backend)** + **Next.js 16 App Router (frontend)** + **PostgreSQL via Prisma 7**.

### Versions clés (monorepo)

| Couche | Package | Version |
|---|---|---|
| Backend | NestJS | 11.x |
| Backend | TypeScript | 5.7.x |
| Backend | Prisma CLI + @prisma/client | 7.6.0 |
| Backend | Node.js | 20.x (LTS recommandé) |
| Frontend | Next.js | 16.2.2 |
| Frontend | React | 19.2.4 |
| Frontend | TypeScript | 5.x |
| Frontend | Tailwind CSS | 4.x |
| Frontend | Axios | 1.x |

---

## 2. Stack technique

### Backend
| Élément | Choix |
|---|---|
| Framework | NestJS 11 (Node.js 20.x) |
| ORM | Prisma 7.6.0 |
| Base de données | PostgreSQL |
| Auth | Passport.js — JWT access (15min, en mémoire) + Refresh token (7j, cookie httpOnly) |
| Validation | class-validator + class-transformer |
| Config | @nestjs/config (.env) |
| Tâches planifiées | @nestjs/schedule (Cron) |
| Temps réel | Socket.io (notifications) |

### Frontend
| Élément | Choix |
|---|---|
| Framework | Next.js 16.2.2 (App Router) |
| React | 19.2.4 |
| Langage | TypeScript 5.x |
| State global | Zustand |
| HTTP client | **Axios 1.x** — instance configurée avec intercepteurs (refresh auto sur 401) |
| Forms | React Hook Form + Zod |
| UI | Tailwind CSS 4.x + shadcn/ui |
| Auth frontend | Refresh token → cookie httpOnly (posé serveur) · Access token → mémoire JS (jamais localStorage) |

---

## 3. Structure du projet (monorepo)

```
SKILO/
├── apps/
│   ├── backend/                    ← NestJS 11
│   │   └── src/
│   │       ├── auth/               # FC-01 — jwt.strategy + jwt-refresh.strategy
│   │       │   ├── auth.module.ts
│   │       │   ├── auth.controller.ts
│   │       │   ├── auth.service.ts
│   │       │   ├── strategies/
│   │       │   │   ├── jwt.strategy.ts
│   │       │   │   └── jwt-refresh.strategy.ts
│   │       │   ├── guards/
│   │       │   │   ├── jwt-auth.guard.ts
│   │       │   │   └── onboarding.guard.ts
│   │       │   ├── decorators/
│   │       │   │   └── current-user.decorator.ts
│   │       │   └── dto/
│   │       │       ├── register.dto.ts
│   │       │       ├── login.dto.ts
│   │       │       └── auth-response.dto.ts
│   │       ├── users/              # FC-02
│   │       │   ├── users.module.ts
│   │       │   ├── users.controller.ts
│   │       │   ├── users.service.ts
│   │       │   └── dto/
│   │       │       ├── update-profile.dto.ts
│   │       │       └── onboarding-step.dto.ts
│   │       ├── skills/             # FC-02 compétences
│   │       │   ├── skills.module.ts
│   │       │   ├── skills.controller.ts
│   │       │   ├── skills.service.ts
│   │       │   └── dto/
│   │       │       ├── create-skill.dto.ts
│   │       │       └── user-skill.dto.ts
│   │       ├── matching/           # FC-03 — scheduler toutes les heures
│   │       │   ├── matching.module.ts
│   │       │   ├── matching.controller.ts
│   │       │   ├── matching.service.ts
│   │       │   ├── matching.scheduler.ts
│   │       │   └── dto/
│   │       │       └── match-filter.dto.ts
│   │       ├── sessions/           # FC-04 — scheduler auto-complete 24h
│   │       │   ├── sessions.module.ts
│   │       │   ├── sessions.controller.ts
│   │       │   ├── sessions.service.ts
│   │       │   ├── sessions.scheduler.ts
│   │       │   └── dto/
│   │       │       ├── create-session.dto.ts
│   │       │       └── update-session-status.dto.ts
│   │       ├── reviews/            # FC-05
│   │       │   ├── reviews.module.ts
│   │       │   ├── reviews.controller.ts
│   │       │   ├── reviews.service.ts
│   │       │   └── dto/
│   │       │       └── create-review.dto.ts
│   │       ├── credits/            # FC-06
│   │       │   ├── credits.module.ts
│   │       │   ├── credits.controller.ts
│   │       │   ├── credits.service.ts
│   │       │   └── dto/
│   │       │       └── credit-transaction.dto.ts
│   │       ├── notifications/      # transversal — Socket.io gateway
│   │       │   ├── notifications.module.ts
│   │       │   ├── notifications.service.ts
│   │       │   └── notifications.gateway.ts
│   │       ├── uploads/            # photos de profil
│   │       │   ├── uploads.module.ts
│   │       │   └── uploads.controller.ts
│   │       ├── common/
│   │       │   ├── filters/
│   │       │   │   └── http-exception.filter.ts
│   │       │   ├── interceptors/
│   │       │   │   └── transform.interceptor.ts
│   │       │   └── pipes/
│   │       │       └── validation.pipe.ts
│   │       ├── config/
│   │       │   ├── database.config.ts
│   │       │   ├── jwt.config.ts
│   │       │   └── upload.config.ts
│   │       └── main.ts
│   │
│   └── frontend/                   ← Next.js 16 App Router
│       └── src/
│           ├── app/
│           │   ├── (auth)/         # routes publiques
│           │   │   ├── login/page.tsx
│           │   │   ├── register/page.tsx
│           │   │   └── layout.tsx
│           │   ├── (onboarding)/   # FC-01 onboarding obligatoire
│           │   │   ├── step-1/page.tsx   # compétences offertes
│           │   │   ├── step-2/page.tsx   # compétences recherchées
│           │   │   ├── step-3/page.tsx   # bio, ville, photo
│           │   │   └── layout.tsx        # barre de progression 1/3
│           │   ├── (dashboard)/    # routes privées
│           │   │   ├── dashboard/page.tsx
│           │   │   ├── matches/page.tsx
│           │   │   ├── sessions/page.tsx
│           │   │   ├── sessions/[id]/page.tsx
│           │   │   ├── profile/page.tsx
│           │   │   ├── profile/edit/page.tsx
│           │   │   ├── users/[id]/page.tsx
│           │   │   ├── credits/page.tsx
│           │   │   └── layout.tsx        # sidebar + header
│           │   ├── layout.tsx
│           │   └── globals.css
│           ├── components/
│           │   ├── ui/             # shadcn/ui
│           │   ├── auth/           # FC-01 : LoginForm, RegisterForm, ProtectedRoute
│           │   ├── onboarding/     # FC-01 : OnboardingProgress, SkillsOfferedStep, etc.
│           │   ├── profile/        # FC-02 : ProfileStrengthBar, ProfileEditForm, etc.
│           │   ├── skills/         # SkillAutocomplete, SkillBadge, SkillForm
│           │   ├── matches/        # FC-03 : MatchList, MatchCard, MatchFilters
│           │   ├── sessions/       # FC-04 : SessionList, ProposeSessionModal, etc.
│           │   ├── reviews/        # FC-05 : ReviewForm, StarRating, BadgeReliable
│           │   ├── credits/        # FC-06 : CreditBalance, CreditHistory, CreditProgressBar
│           │   ├── layout/         # Sidebar, Header, NotificationBell, UserMenu
│           │   └── shared/         # LoadingSpinner, ErrorMessage, EmptyState
│           ├── lib/
│           │   ├── api/            # ← TOUS les appels HTTP ici
│           │   │   ├── axios.ts          # instance Axios + intercepteurs refresh
│           │   │   ├── auth.api.ts
│           │   │   ├── users.api.ts
│           │   │   ├── skills.api.ts
│           │   │   ├── matches.api.ts
│           │   │   ├── sessions.api.ts
│           │   │   ├── reviews.api.ts
│           │   │   ├── credits.api.ts
│           │   │   └── index.ts          # ré-exporte tout
│           │   ├── store/
│           │   │   └── auth.store.ts     # Zustand — access token en mémoire
│           │   ├── socket.ts             # config Socket.io client
│           │   └── validations.ts        # schémas Zod partagés
│           ├── hooks/
│           │   ├── useAuth.ts
│           │   ├── useMatches.ts
│           │   ├── useSessions.ts
│           │   ├── useCredits.ts
│           │   ├── useSocket.ts
│           │   └── useNotifications.ts
│           └── types/                    # miroir des types backend
│               ├── user.ts
│               ├── skill.ts
│               ├── match.ts
│               ├── session.ts
│               ├── review.ts
│               └── credit.ts
│
├── prisma/                         ← schéma partagé
└── .env
```

---

## 4. Règle fondamentale frontend

> **Jamais d'appel Axios direct dans un composant.**  
> Tout appel HTTP passe obligatoirement par `src/lib/api/`.

---

## 5. `axios.ts` — instance Axios centrale

```typescript
// src/lib/api/axios.ts
import axios from 'axios';
import { getAccessToken, setAccessToken } from '@/lib/store/auth.store';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // envoie le cookie refresh_token automatiquement
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Intercepteur REQUEST ──────────────────────────────────────────────────
// Injecte l'access token dans chaque requête sortante
axiosInstance.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Intercepteur RESPONSE ────────────────────────────────────────────────
// Refresh silencieux sur 401 : tente un refresh puis rejoue la requête originale
let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processPendingQueue = (error: unknown, token: string | null = null) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  pendingQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Si un refresh est déjà en cours, mettre en file d'attente
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Le cookie httpOnly refresh_token est envoyé automatiquement (withCredentials)
        const { data } = await axiosInstance.post<{ access_token: string; user: User }>(
          '/auth/refresh',
        );

        setAccessToken(data.access_token); // nouveau token → mémoire uniquement
        processPendingQueue(null, data.access_token);

        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return axiosInstance(originalRequest); // rejoue la requête initiale
      } catch (refreshError) {
        processPendingQueue(refreshError, null);
        setAccessToken(null);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
```

> **Pourquoi une file d'attente (`pendingQueue`) ?**  
> Si plusieurs requêtes partent simultanément et reçoivent toutes un 401, une seule tentative de refresh est effectuée. Les autres attendent et utilisent le nouveau token dès qu'il est disponible, évitant les boucles de refresh parallèles.

---

## 6. Pattern `*.api.ts`

```typescript
// src/lib/api/auth.api.ts
import api from './axios';
import type { AuthResponse, LoginPayload, RegisterPayload } from '@/types/auth.types';

export const authApi = {
  register: (payload: RegisterPayload) =>
    api.post<AuthResponse>('/auth/register', payload).then((r) => r.data),

  login: (payload: LoginPayload) =>
    api.post<AuthResponse>('/auth/login', payload).then((r) => r.data),

  refresh: () =>
    api.post<AuthResponse>('/auth/refresh').then((r) => r.data),

  logout: () =>
    api.post<{ message: string }>('/auth/logout').then((r) => r.data),

  me: () =>
    api.get<{ user: User }>('/auth/me').then((r) => r.data.user),
};
```

> **Note :** Axios retourne `{ data, status, headers, ... }`. Toujours enchaîner `.then(r => r.data)` dans les fichiers `*.api.ts` pour exposer uniquement la donnée au composant.

---

## 7. Consommer dans les composants

### Client component (interactions utilisateur)

```typescript
// components/auth/LoginForm.tsx
'use client';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth.store';

export function LoginForm() {
  const { setUser, setAccessToken } = useAuthStore();

  const handleLogin = async (data: LoginPayload) => {
    try {
      const result = await authApi.login(data);
      setUser(result.user);               // → store Zustand
      setAccessToken(result.access_token); // → mémoire JS (jamais localStorage)
    } catch (error) {
      // Axios encapsule l'erreur HTTP dans error.response
      console.error(error);
    }
  };
}
```

### Server component (SSR — données initiales)

```typescript
// app/(dashboard)/dashboard/page.tsx
// Pour le SSR, utiliser fetch natif avec le cookie transmis côté serveur.
// L'instance Axios est réservée au client ; côté serveur, utiliser fetch.
import { cookies } from 'next/headers';

async function getDashboardData() {
  const cookieStore = cookies();
  const res = await fetch(`${process.env.API_URL}/users/me`, {
    headers: { Cookie: cookieStore.toString() },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Unauthorized');
  return res.json();
}
```

> **Règle :** L'instance Axios (`src/lib/api/axios.ts`) est **client-side uniquement**.  
> Pour le SSR dans les Server Components, utiliser `fetch` natif avec forwarding du cookie.

---

## 8. Auth — flux complet

```
Register / Login
  POST /auth/register  ou  POST /auth/login
    → body  : { email, password, ... }
    ← body  : { user: {...}, access_token: "eyJ..." }
    ← cookie: refresh_token (httpOnly, Secure, SameSite=Strict, 7j, path=/auth/refresh)

Stockage frontend
  access_token  → variable JS en mémoire via Zustand (jamais localStorage ni sessionStorage)
  refresh_token → cookie httpOnly (posé par le serveur, inaccessible au JS)

Refresh silencieux (intercepteur Axios sur réponse 401)
  POST /auth/refresh   (cookie envoyé automatiquement par le navigateur grâce à withCredentials)
    ← body : { user: {...}, access_token: "eyJ... (nouveau)" }
    → setAccessToken() remet le nouveau token en mémoire
    → la requête originale est rejouée automatiquement

Logout
  POST /auth/logout
    → header : Authorization: Bearer <access_token>  (injecté par l'intercepteur request)
    ← cookie refresh_token effacé (Max-Age=0)
    ← hash du refresh token blacklisté en DB (TokenBlacklist)
    → setAccessToken(null) vide la mémoire côté client
```

---

## 9. Modèles Prisma clés

### User
Champs principaux : `id`, `email`, `emailLower`, `passwordHash`, `firstName`, `lastName`, `city`, `bio`, `avatarUrl`, `isOnboarded`, `isActive`, `creditBalance` (défaut: 2), `creditReserved`, `profileScore`, `avgRating`, `failedLoginAttempts`, `lockedUntil`, `lastLoginAt`, `onboardingStep` (défaut: 1)

### TokenBlacklist
Champs : `id`, `tokenHash` (SHA-256 du refresh token), `expiresAt`, `blacklistedAt`  
Rôle : invalider immédiatement un refresh token au logout. Purgé chaque nuit (cron 3h).

---

## 10. Décorateurs backend

| Décorateur | Usage |
|---|---|
| `@Public()` | Exempte une route du JWT global |
| `@CurrentUser()` | Injecte `req.user` (id + email) depuis le JWT |
| `@CurrentUser('id')` | Injecte uniquement le champ `id` |
| `@Roles(Role.Admin)` | Restreint la route aux admins |

---

## 11. Variables d'environnement

### Backend `.env`
```
DATABASE_URL=postgresql://...
JWT_SECRET=<secret-64-chars>
JWT_REFRESH_SECRET=<secret-différent-64-chars>
NODE_ENV=development
```

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:3000   # utilisé côté client (Axios)
API_URL=http://localhost:3000               # utilisé côté serveur (SSR fetch natif)
```

---

## 12. Conventions de code

### Naming
- Fichiers : `kebab-case.ts`
- Classes/Types : `PascalCase`
- Variables/fonctions : `camelCase`
- Constantes : `UPPER_SNAKE_CASE`

### Backend NestJS
- Un module par feature : `auth/`, `users/`, `sessions/`, `matches/`
- Chaque module : `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`
- Guards globaux déclarés via `APP_GUARD` dans `auth.module.ts`
- Pas de logique métier dans les controllers — tout dans les services

### Frontend Next.js
- `app/` : pages et layouts (App Router)
- `components/` : composants réutilisables (jamais d'appel Axios direct)
- `lib/api/` : TOUS les appels HTTP — instance Axios + fichiers `*.api.ts`
- `lib/store/` : stores Zustand (access token en mémoire dans `auth.store.ts`)
- `hooks/` : hooks React custom
- `types/` : types TypeScript partagés (miroir des types du backend)

---

## 13. Endpoints API (état actuel)

### Auth
```
POST   /auth/register    @Public  → { user, access_token }
POST   /auth/login       @Public  → { user, access_token }
POST   /auth/refresh     @Public  → { user, access_token }
POST   /auth/logout      🔒JWT   → { message }
GET    /auth/me          🔒JWT   → { user }
```

### Users
```
GET    /users            🔒JWT   → liste paginée
GET    /users/:id        🔒JWT   → profil public
PATCH  /users/me         🔒JWT   → mise à jour profil
```

---

## 14. Statut des fonctionnalités

| Code | Feature | Statut |
|---|---|---|
| FC-01 | Auth (register/login/logout/refresh) | ✅ Fait |
| FC-01-B | Protection bruteforce (5 tentatives, lock 15min) | ✅ Fait |
| FC-02 | Onboarding (3 étapes : skills offerts, recherchés, infos perso) | 🔲 À faire |
| FC-03 | Matching (algorithme de compatibilité) | 🔲 À faire |
| FC-04 | Sessions (proposition, acceptation, annulation) | 🔲 À faire |
| FC-05 | Reviews (post-session, notation 4 critères) | 🔲 À faire |
| FC-05-B | Badge "Fiable" (recalculé après review) | 🔲 À faire |
| FC-06 | Crédits (balance, réservation, transaction) | 🔲 À faire |
| FC-07 | Notifications (Socket.io) | 🔲 À faire |

---

## 15. Ce que Claude sait déjà faire sur ce projet

- [x] Générer le module auth complet (service, controller, guards, strategies, decorators)
- [x] Générer `auth.http` (19 cas de test REST Client)
- [x] Architecture frontend auth (Axios + intercepteurs + Zustand + refresh auto)
- [ ] Module users
- [ ] Module sessions
- [ ] Module matches
- [ ] Pages Next.js (login, register, onboarding, dashboard)

---

## 16. Comment utiliser ce fichier avec Claude

Coller le contenu de ce fichier en début de conversation :

```
Voici le contexte de notre projet SKILO :

[contenu de ce fichier]

Ma question : ...
```

Ou référencer des sections :
```
En suivant notre convention (section 6 — pattern *.api.ts),
génère-moi le fichier sessions.api.ts
```
