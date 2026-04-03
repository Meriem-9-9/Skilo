# SKILO — Project Context
> Fichier de contexte projet. À coller en début de conversation avec Claude pour maintenir la cohérence entre sessions.
> Dernière mise à jour : 2025

---

## 0. Contexte global du projet SkillSwap

**SkillSwap** est une plateforme web d'échange de compétences entre particuliers, développée en binôme dans un cadre académique.  
La promesse : *"Tu m'apprends ce que tu sais, je t'apprends ce que je sais."* — sans argent, uniquement du temps et du savoir.

**Problème résolu :** les cours en ligne coûtent cher, l'IA n'offre pas d'interaction humaine réelle, et trouver dans son entourage quelqu'un avec les bonnes compétences est difficile. SkillSwap répond à tout ça via un algorithme de matching et un système de crédits temps inspiré des banques de temps communautaires (1h enseignée = 1 crédit = 1h d'apprentissage auprès de n'importe qui).

**Stack technique :** NestJS (backend) · React + Next.js (frontend) · PostgreSQL · Socket.io · JWT

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

---

## 2. Stack technique

### Backend
| Élément | Choix |
|---|---|
| Framework | NestJS 11 (Node.js 20.x) |
| ORM | Prisma 7.6.0 |
| Base de données | PostgreSQL |
| Auth | Passport.js — JWT (access 15m) + Refresh token (7j, cookie httpOnly) |
| Validation | class-validator + class-transformer |
| Config | @nestjs/config (.env) |
| Tâches planifiées | @nestjs/schedule (Cron) |

### Frontend
| Élément | Choix |
|---|---|
| Framework | Next.js 16.2.2 (App Router) |
| React | 19.2.4 |
| Langage | TypeScript 5.x |
| State global | Zustand |
| HTTP client | fetch natif (wrapper configuré avec intercepteurs) |
| Forms | React Hook Form + Zod |
| UI | Tailwind CSS 4.x |
| Auth frontend | Cookie httpOnly (refresh) + mémoire (access token) |

### Monorepo
```
SKILO/
├── apps/
│   ├── backend/          ← NestJS
│   │   └── src/
│   │       ├── auth/
│   │       ├── users/
│   │       ├── prisma/
│   │       └── main.ts
│   └── frontend/         ← Next.js 16 App Router
│       └── src/
│           ├── app/          ← pages (App Router)
│           ├── components/
│           ├── lib/
│           │   ├── api/      ← couche API (appels HTTP)
│           │   └── store/    ← stores Zustand
│           ├── hooks/
│           └── types/
├── prisma/               ← schéma partagé
└── .env
```

---

## 3. Organisation du frontend Next.js

### Règle fondamentale
> **Jamais d'appel `fetch` direct dans un composant.**  
> Tout appel HTTP passe par `src/lib/api/`.

### Structure `src/lib/api/`

```
src/lib/api/
├── client.ts          ← wrapper fetch configuré (baseURL, headers, refresh auto)
├── auth.api.ts        ← appels /auth/*
├── users.api.ts       ← appels /users/*
├── matches.api.ts     ← appels /matches/*
├── sessions.api.ts    ← appels /sessions/*
└── index.ts           ← ré-exporte tout
```

### `client.ts` — wrapper fetch central

```typescript
// src/lib/api/client.ts
import { getAccessToken, setAccessToken } from '@/lib/store/auth.store';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  retry = true,
): Promise<T> {
  const token = getAccessToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: 'include', // cookie refresh_token
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  // Refresh automatique sur 401
  if (res.status === 401 && retry) {
    const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (refreshRes.ok) {
      const { access_token } = await refreshRes.json();
      setAccessToken(access_token);
      return request<T>(method, path, body, false); // une seule retry
    } else {
      setAccessToken(null);
      window.location.href = '/login';
      throw new Error('Session expirée');
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw Object.assign(new Error(error.message ?? 'Erreur API'), { status: res.status, data: error });
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export const api = {
  get:    <T>(path: string)                    => request<T>('GET',    path),
  post:   <T>(path: string, body?: unknown)    => request<T>('POST',   path, body),
  patch:  <T>(path: string, body?: unknown)    => request<T>('PATCH',  path, body),
  put:    <T>(path: string, body?: unknown)    => request<T>('PUT',    path, body),
  delete: <T>(path: string)                    => request<T>('DELETE', path),
};

export default api;
```

### Pattern d'un fichier `*.api.ts`

```typescript
// src/lib/api/auth.api.ts
import api from './client';
import type { AuthResponse, LoginPayload, RegisterPayload } from '@/types/auth.types';

export const authApi = {
  register: (payload: RegisterPayload) =>
    api.post<AuthResponse>('/auth/register', payload),

  login: (payload: LoginPayload) =>
    api.post<AuthResponse>('/auth/login', payload),

  refresh: () =>
    api.post<AuthResponse>('/auth/refresh'),

  logout: () =>
    api.post<{ message: string }>('/auth/logout'),

  me: () =>
    api.get<{ user: User }>('/auth/me').then(r => r.user),
};
```

### Comment consommer dans les composants

**Client component (interactions utilisateur) :**
```typescript
// app/login/page.tsx  ou  components/LoginForm.tsx
'use client';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth.store';

export function LoginForm() {
  const setUser = useAuthStore(s => s.setUser);

  const handleLogin = async (data: LoginPayload) => {
    const result = await authApi.login(data);
    setUser(result.user);         // → store Zustand
    setAccessToken(result.access_token); // → mémoire
  };
}
```

**Server component (données initiales, SSR) :**
```typescript
// app/dashboard/page.tsx
// Pour le SSR : utiliser fetch() natif avec le cookie transmis côté serveur
import { cookies } from 'next/headers';

async function getDashboardData() {
  const cookieStore = cookies();
  const res = await fetch(`${process.env.API_URL}/users/me`, {
    headers: { Cookie: cookieStore.toString() },
    cache: 'no-store',
  });
  return res.json();
}
```

---

## 4. Auth — flux complet

```
Login
  POST /auth/login
    → body  : { email, password }
    ← body  : { user: {...}, access_token: "eyJ..." }
    ← cookie: refresh_token (httpOnly, 7j, path=/auth/refresh)

Stockage frontend
  access_token  → variable JS en mémoire (jamais localStorage)
  refresh_token → cookie httpOnly (posé par le serveur, invisible au JS)

Refresh silencieux (au démarrage ou sur 401)
  POST /auth/refresh  (cookie envoyé automatiquement)
    ← body : { user: {...}, access_token: "eyJ... (nouveau)" }

Logout
  POST /auth/logout
    → header : Authorization: Bearer <access_token>
    ← cookie refresh_token effacé + hash blacklisté en DB
```

---

## 5. Modèles Prisma clés

### User
Champs principaux : `id`, `email`, `emailLower`, `passwordHash`, `firstName`, `lastName`, `city`, `bio`, `avatarUrl`, `isOnboarded`, `isActive`, `creditBalance` (défaut: 2), `creditReserved`, `profileScore`, `avgRating`, `failedLoginAttempts`, `lockedUntil`, `lastLoginAt`, `onboardingStep` (défaut: 1)

### TokenBlacklist
Champs : `id`, `tokenHash` (SHA-256 du refresh token), `expiresAt`, `blacklistedAt`  
Rôle : invalider immédiatement un refresh token au logout. Purgé chaque nuit (cron 3h).

---

## 6. Décorateurs backend

| Décorateur | Usage |
|---|---|
| `@Public()` | Exempte une route du JWT global |
| `@CurrentUser()` | Injecte `req.user` (id + email) depuis le JWT |
| `@CurrentUser('id')` | Injecte uniquement le champ `id` |
| `@Roles(Role.Admin)` | Restreint la route aux admins |

---

## 7. Variables d'environnement

### Backend `.env`
```
DATABASE_URL=postgresql://...
JWT_SECRET=<secret-64-chars>
JWT_REFRESH_SECRET=<secret-différent-64-chars>
NODE_ENV=development
```

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:3000   # utilisé côté client
API_URL=http://localhost:3000               # utilisé côté serveur (SSR)
```

---

## 8. Conventions de code

### Naming
- Fichiers : `kebab-case.ts`
- Classes/Types : `PascalCase`
- Variables/fonctions : `camelCase`
- Constantes : `UPPER_SNAKE_CASE`

### Backend NestJS
- Un module par feature : `auth/`, `users/`, `sessions/`, `matches/`
- Chaque module : `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`, `types/`
- Guards globaux déclarés via `APP_GUARD` dans `auth.module.ts`
- Pas de logique métier dans les controllers — tout dans les services

### Frontend Next.js
- `app/` : pages et layouts (App Router)
- `components/` : composants réutilisables (pas de fetch direct)
- `lib/api/` : TOUS les appels HTTP
- `lib/store/` : stores Zustand
- `hooks/` : hooks React custom
- `types/` : types TypeScript partagés (copier les types du backend ici)

---

## 9. Fonctionnalités planifiées (backlog)

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
| FC-07 | Notifications | 🔲 À faire |

---

## 10. Endpoints API (état actuel)

### Auth
```
POST   /auth/register    @Public  → { user, access_token }
POST   /auth/login       @Public  → { user, access_token }
POST   /auth/refresh     @Public  → { user, access_token }
POST   /auth/logout      🔒JWT   → { message }
GET    /auth/me          🔒JWT   → { user }
```

### Users (à compléter)
```
GET    /users            🔒JWT   → liste paginée
GET    /users/:id        🔒JWT   → profil public
PATCH  /users/me         🔒JWT   → mise à jour profil
```

---

## 11. Comment utiliser ce fichier avec Claude

Coller le contenu de ce fichier en début de conversation :

```
Voici le contexte de notre projet SKILO :

[contenu de ce fichier]

Ma question : ...
```

Ou référencer des sections :
```
En suivant notre convention (section 3 — lib/api/), 
génère-moi le fichier sessions.api.ts
```

---

## 12. Ce que Claude sait déjà faire sur ce projet

- [x] Générer le module auth complet (service, controller, guards, strategies, decorators)
- [x] Générer `auth.http` (19 cas de test REST Client)
- [x] Architecture frontend auth (fetch natif + Zustand + refresh auto)
- [ ] Module users
- [ ] Module sessions
- [ ] Module matches
- [ ] Pages Next.js (login, register, onboarding, dashboard)
