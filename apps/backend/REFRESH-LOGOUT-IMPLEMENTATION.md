# 🔐 Implémentation Refresh Token & Logout

**Date:** 2026-04-08  
**Statut:** ✅ Complété

---

## 📝 Résumé des changements

Cette implémentation ajoute deux fonctionnalités critiques au système d'authentification :

1. **Refresh Token** - Renouvellement automatique des tokens
2. **Logout** - Déconnexion sécurisée avec révocation de tokens

---

## 🆕 Nouveaux Endpoints

### 1. POST `/auth/refresh`
Renouvelle l'access token en utilisant le refresh token.

**Request:**
- Cookie: `refresh_token` (httpOnly)

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Cookie Set:**
- `refresh_token` (nouveau, rotation)

**Status Codes:**
- `200` - Succès
- `401` - Refresh token invalide/expiré/révoqué

---

### 2. POST `/auth/logout`
Déconnecte l'utilisateur et révoque son refresh token.

**Request:**
- Cookie: `refresh_token` (optionnel)

**Response:**
```json
{
  "message": "Déconnecté avec succès"
}
```

**Cookie Cleared:**
- `refresh_token`

**Status Codes:**
- `200` - Succès (toujours, même sans token)

---

## 🔄 Endpoints Modifiés

### 1. POST `/auth/register` (modifié)
Retourne maintenant le refresh token dans un cookie httpOnly.

**Avant:**
```json
{
  "access_token": "...",
  "user": {...}
}
```

**Après:**
```json
{
  "access_token": "...",
  "user": {...}
}
```
+ **Cookie:** `refresh_token` (httpOnly, 7 jours)

---

### 2. POST `/auth/login` (modifié)
Retourne maintenant le refresh token dans un cookie httpOnly.

**Avant:**
```json
{
  "access_token": "...",
  "user": {...}
}
```

**Après:**
```json
{
  "access_token": "...",
  "user": {...}
}
```
+ **Cookie:** `refresh_token` (httpOnly, 7 jours)

---

## 🔐 Sécurité Implémentée

### Refresh Token Rotation
- ✅ Ancien refresh token blacklisté lors du renouvellement
- ✅ Nouveau refresh token généré à chaque `/auth/refresh`
- ✅ Impossible de réutiliser un refresh token

### Token Blacklist
- ✅ Stockage SHA-256 hash (jamais le token en clair)
- ✅ Vérification automatique dans JwtGuard (future implémentation)
- ✅ Cleanup automatique quotidien (3 AM)

### HttpOnly Cookies
- ✅ Refresh token inaccessible en JavaScript
- ✅ Protection contre XSS
- ✅ `secure: true` en production (HTTPS only)
- ✅ `sameSite: 'lax'` protection CSRF

### Token Expiration
- ✅ Access token: **15 minutes**
- ✅ Refresh token: **7 jours**

---

## 📁 Fichiers Modifiés

### 1. `../auth/auth.service.ts`
**Ajouts:**
- `refresh(refreshToken: string)` - Renouvelle les tokens
- `logout(refreshToken: string)` - Révoque le refresh token
- `hashToken(token: string)` - Hash SHA-256 pour blacklist
- Import `crypto` et `ConfigService`
- Génération séparée access/refresh tokens

**Modifications:**
- `buildResponse()` génère maintenant 2 tokens avec secrets différents

### 2. `../auth/auth.controller.ts`
**Ajouts:**
- `refresh()` endpoint - POST `/auth/refresh`
- `logout()` endpoint - POST `/auth/logout`
- Import `Res`, `Req` de NestJS
- Import `Response` de Express

**Modifications:**
- `register()` - Stocke refresh token dans cookie
- `login()` - Stocke refresh token dans cookie

### 3. `../auth/dto/auth-response.dto.ts`
**Modifications:**
- Ajout champ `refresh_token: string`

### 4. `../auth/auth.module.ts`
**Ajouts:**
- Import `BlacklistCleanupTask`
- Provider `BlacklistCleanupTask`

**Modifications:**
- JWT expiration: `1h` → `15m`

### 5. `../auth/tasks/blacklist-cleanup.task.ts` (nouveau)
**Fonctionnalité:**
- Tâche CRON quotidienne (3 AM)
- Supprime tokens expirés de la blacklist
- Logging des opérations

---

## 🗄️ Base de Données

### Table Utilisée: `token_blacklist`
La table existe déjà dans le schéma Prisma :

```prisma
model TokenBlacklist {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tokenHash     String   @unique @db.VarChar(64)
  expiresAt     DateTime @db.Timestamptz()
  blacklistedAt DateTime @default(now()) @db.Timestamptz()

  @@index([expiresAt], map: "idx_token_blacklist_expires")
  @@index([tokenHash], map: "idx_token_blacklist_hash")
  @@map("token_blacklist")
}
```

**Note:** Aucune migration nécessaire, la table existe déjà.

---

## 🔧 Configuration Requise

### Variables d'environnement `.env`

```env
# Access token secret (courte durée)
JWT_SECRET="votre_secret_access_token"

# Refresh token secret (DOIT être différent de JWT_SECRET)
JWT_REFRESH_SECRET="votre_secret_refresh_token"

# Environnement (production/development)
NODE_ENV="development"
```

**⚠️ Important:**
- `JWT_SECRET` et `JWT_REFRESH_SECRET` doivent être **différents**
- Générer avec: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

---

## 🧪 Tests Manuels

### 1. Register → Refresh → Logout

```bash
# 1. Register
POST http://localhost:2006/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Password123",
  "firstName": "John",
  "lastName": "Doe"
}

# Réponse: access_token + cookie refresh_token

# 2. Attendre 16 minutes (access token expiré)

# 3. Refresh
POST http://localhost:2006/auth/refresh
# Cookie refresh_token envoyé automatiquement

# Réponse: nouveau access_token + nouveau refresh_token (cookie)

# 4. Logout
POST http://localhost:2006/auth/logout
# Cookie refresh_token envoyé automatiquement

# Réponse: { "message": "Déconnecté avec succès" }

# 5. Tenter Refresh à nouveau (doit échouer)
POST http://localhost:2006/auth/refresh

# Réponse: 401 "Token has been revoked"
```

---

### 2. Login → Utiliser Access Token → Refresh

```bash
# 1. Login
POST http://localhost:2006/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Password123"
}

# 2. Utiliser access_token
GET http://localhost:2006/auth/me
Authorization: Bearer <access_token>

# 3. Après 15+ minutes, access_token expiré
GET http://localhost:2006/auth/me
Authorization: Bearer <expired_token>
# Réponse: 401 Unauthorized

# 4. Refresh pour obtenir nouveau token
POST http://localhost:2006/auth/refresh
# Cookie refresh_token automatique

# 5. Utiliser nouveau access_token
GET http://localhost:2006/auth/me
Authorization: Bearer <new_access_token>
# Réponse: User profile
```

---

## 📊 Flux d'Authentification

```
┌─────────────┐
│   Register  │
│   / Login   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│  access_token (15 min)      │
│  refresh_token (7 jours)    │
│  Cookie: refresh_token      │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Utiliser access_token      │
│  pour requêtes API          │
└──────┬──────────────────────┘
       │
       ▼
   Access token
    expiré ?
       │
       ├─── NON ──> Continuer
       │
       └─── OUI
              │
              ▼
       ┌──────────────┐
       │  POST        │
       │  /refresh    │
       └──────┬───────┘
              │
              ▼
       ┌──────────────────────┐
       │  Nouveau access +    │
       │  refresh token       │
       │  (ancien blacklisté) │
       └──────┬───────────────┘
              │
              ▼
       Répéter le cycle
```

---

## 🚀 Prochaines Étapes

### ⚠️ À Implémenter Ensuite:

1. **JwtGuard avec vérification blacklist**
   - Vérifier si access token est blacklisté
   - (Actuellement seul refresh token est blacklisté)

2. **Rate limiting**
   - Installer `@nestjs/throttler`
   - Limiter `/auth/refresh` (10 req/min)
   - Limiter `/auth/login` (5 req/min)

3. **Brute force protection**
   - Utiliser `failedLoginAttempts` et `lockedUntil`
   - Bloquer après 5 tentatives

4. **Tests unitaires**
   - auth.service.spec.ts
   - auth.controller.spec.ts
   - blacklist-cleanup.task.spec.ts

---

## ✅ Checklist de Déploiement

Avant de déployer en production :

- [ ] Variables `.env` configurées (JWT_SECRET, JWT_REFRESH_SECRET différents)
- [ ] `NODE_ENV=production` en production
- [ ] HTTPS activé (pour cookies `secure: true`)
- [ ] CORS configuré avec domaine frontend
- [ ] Table `token_blacklist` créée en DB
- [ ] Tâche CRON activée (ScheduleModule dans AppModule)
- [ ] Tester refresh token rotation
- [ ] Tester logout et révocation
- [ ] Vérifier cleanup quotidien

---

## 📚 Ressources

### Documentation
- [NestJS JWT](https://docs.nestjs.com/security/authentication#jwt-token)
- [NestJS Cookies](https://docs.nestjs.com/techniques/cookies)
- [NestJS Scheduling](https://docs.nestjs.com/techniques/task-scheduling)

### Sécurité
- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [Refresh Token Rotation](https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation)

---

**Implémentation complète ✅**
