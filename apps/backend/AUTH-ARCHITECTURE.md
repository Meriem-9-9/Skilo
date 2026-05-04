# 🏗️ Architecture Auth System - Skilo Backend

## 📊 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT                                  │
│  (Frontend - React/Next.js)                                     │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ HTTP Requests
                 │ + Cookies (refresh_token)
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEST.JS BACKEND                              │
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐     │
│  │              AUTH MODULE                              │     │
│  │                                                       │     │
│  │  ┌──────────────────┐      ┌──────────────────┐     │     │
│  │  │ AuthController   │─────▶│  AuthService     │     │     │
│  │  │                  │      │                  │     │     │
│  │  │ POST /register   │      │ register()       │     │     │
│  │  │ POST /login      │      │ login()          │     │     │
│  │  │ POST /refresh    │      │ refresh()        │     │     │
│  │  │ POST /logout     │      │ logout()         │     │     │
│  │  │ GET  /me         │      │ buildResponse()  │     │     │
│  │  └──────────────────┘      │ hashToken()      │     │     │
│  │                            └──────┬───────────┘     │     │
│  │                                   │                 │     │
│  │  ┌──────────────────┐             │                 │     │
│  │  │    Guards        │             │                 │     │
│  │  │                  │             │                 │     │
│  │  │ JwtGuard         │◀────────────┘                 │     │
│  │  │ RolesGuard       │                               │     │
│  │  └──────────────────┘                               │     │
│  │                                                       │     │
│  │  ┌──────────────────┐                               │     │
│  │  │  CRON Tasks      │                               │     │
│  │  │                  │                               │     │
│  │  │ Blacklist        │                               │     │
│  │  │ Cleanup (3 AM)   │                               │     │
│  │  └──────────────────┘                               │     │
│  └───────────────────────────────────────────────────────┘     │
│                           │                                    │
│                           ▼                                    │
│  ┌───────────────────────────────────────────────────────┐     │
│  │              PRISMA SERVICE                           │     │
│  │         (Database Abstraction Layer)                  │     │
│  └───────────────────────────────────────────────────────┘     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   POSTGRESQL DATABASE                           │
│                                                                 │
│  ┌──────────────┐          ┌───────────────────┐               │
│  │    users     │          │ token_blacklist   │               │
│  │              │          │                   │               │
│  │ id           │          │ id                │               │
│  │ email        │          │ tokenHash         │               │
│  │ passwordHash │          │ expiresAt         │               │
│  │ firstName    │          │ blacklistedAt     │               │
│  │ lastName     │          └───────────────────┘               │
│  │ role         │                                              │
│  │ isActive     │                                              │
│  │ ...          │                                              │
│  └──────────────┘                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flux d'Authentification Détaillé

### 1️⃣ Register / Login

```
Client                  Controller              Service              Database
  │                         │                       │                    │
  ├─POST /auth/register────▶│                       │                    │
  │  {email, password}      │                       │                    │
  │                         ├──register(dto)───────▶│                    │
  │                         │                       ├─Check email exists─▶│
  │                         │                       │◀───Result──────────┤
  │                         │                       ├─Hash password      │
  │                         │                       ├─Create user────────▶│
  │                         │                       │◀───User────────────┤
  │                         │                       ├─Generate tokens    │
  │                         │                       │  • access (15m)    │
  │                         │                       │  • refresh (7d)    │
  │                         │◀──return tokens───────┤                    │
  │◀─200 + Cookie──────────┤                       │                    │
  │  {access_token, user}   │                       │                    │
  │  Cookie: refresh_token  │                       │                    │
```

### 2️⃣ Refresh Token

```
Client                  Controller              Service              Database
  │                         │                       │                    │
  ├─POST /auth/refresh─────▶│                       │                    │
  │  Cookie: refresh_token  │                       │                    │
  │                         ├──refresh(token)──────▶│                    │
  │                         │                       ├─Check blacklist───▶│
  │                         │                       │◀───Not found───────┤
  │                         │                       ├─Verify JWT        │
  │                         │                       ├─Get user──────────▶│
  │                         │                       │◀───User────────────┤
  │                         │                       ├─Blacklist old──────▶│
  │                         │                       ├─Generate new tokens│
  │                         │◀──return tokens───────┤                    │
  │◀─200 + New Cookie──────┤                       │                    │
  │  {access_token, user}   │                       │                    │
  │  Cookie: NEW refresh    │                       │                    │
```

### 3️⃣ Logout

```
Client                  Controller              Service              Database
  │                         │                       │                    │
  ├─POST /auth/logout──────▶│                       │                    │
  │  Cookie: refresh_token  │                       │                    │
  │                         ├──logout(token)───────▶│                    │
  │                         │                       ├─Hash token        │
  │                         │                       ├─Add to blacklist──▶│
  │                         │◀──void────────────────┤                    │
  │◀─200 + Clear Cookie────┤                       │                    │
  │  {"message": "success"} │                       │                    │
```

### 4️⃣ Protected Route (GET /me)

```
Client                  Controller         JwtGuard            Database
  │                         │                  │                   │
  ├─GET /auth/me───────────▶│                  │                   │
  │  Auth: Bearer token     │                  │                   │
  │                         ├─canActivate()───▶│                   │
  │                         │                  ├─Extract token     │
  │                         │                  ├─Verify JWT        │
  │                         │                  ├─Check isActive───▶│
  │                         │                  │◀──User active─────┤
  │                         │◀─req.user────────┤                   │
  │◀─200────────────────────┤                  │                   │
  │  {user profile}         │                  │                   │
```

---

## 🔐 Sécurité en Couches

### Couche 1: Transport
```
┌─────────────────────────────────────┐
│  HTTPS (Production)                 │
│  • Encryption en transit            │
│  • Certificat SSL/TLS               │
└─────────────────────────────────────┘
```

### Couche 2: Cookies
```
┌─────────────────────────────────────┐
│  HttpOnly Cookies                   │
│  • httpOnly: true → Pas de JS       │
│  • secure: true → HTTPS only        │
│  • sameSite: 'lax' → CSRF protect   │
│  • path: '/auth' → Scope limité     │
└─────────────────────────────────────┘
```

### Couche 3: Tokens
```
┌─────────────────────────────────────┐
│  JWT Tokens                         │
│  • Access: 15 minutes               │
│  • Refresh: 7 days                  │
│  • Separate secrets                 │
│  • Signature verification           │
└─────────────────────────────────────┘
```

### Couche 4: Blacklist
```
┌─────────────────────────────────────┐
│  Token Revocation                   │
│  • SHA-256 hash storage             │
│  • Automatic cleanup (CRON)         │
│  • Fast lookup (indexed)            │
└─────────────────────────────────────┘
```

### Couche 5: Password
```
┌─────────────────────────────────────┐
│  Password Security                  │
│  • bcrypt hash (cost 10)            │
│  • Never stored plain text          │
│  • Strong validation rules          │
│  • Min 8 chars, upper, lower, digit │
└─────────────────────────────────────┘
```

---

## 📁 Structure des Fichiers

```
../auth/
│
├── auth.controller.ts          # Endpoints HTTP
│   ├── POST /register
│   ├── POST /login
│   ├── POST /refresh           # ✅ NEW
│   ├── POST /logout            # ✅ NEW
│   └── GET  /me
│
├── auth.service.ts             # Business Logic
│   ├── register()
│   ├── login()
│   ├── refresh()               # ✅ NEW
│   ├── logout()                # ✅ NEW
│   ├── buildResponse()         # ✅ UPDATED (2 tokens)
│   └── hashToken()             # ✅ NEW
│
├── auth.module.ts              # Module configuration
│   ├── JwtModule
│   ├── Providers
│   └── BlacklistCleanupTask    # ✅ NEW
│
├── dto/
│   ├── register.dto.ts
│   ├── login.dto.ts
│   └── auth-response.dto.ts    # ✅ UPDATED (refresh_token)
│
├── guards/
│   ├── jwt.guard.ts            # Token validation
│   └── roles.guard.ts          # Role-based access
│
├── tasks/
│   └── blacklist-cleanup.task.ts  # ✅ NEW (CRON)
│
├── types/
│   ├── jwt-payload.type.ts
│   └── request-with-user.type.ts
│
└── decorators/
    ├── public.decorator.ts
    └── roles.decorator.ts
```

---

## ⏱️ Timelines

### Token Lifespans

```
Access Token
├─ Created: 0s
├─ Valid: 0 → 15 minutes
└─ Expired: After 15 minutes

Refresh Token
├─ Created: 0s
├─ Valid: 0 → 7 days
├─ Rotation: Every refresh request
└─ Expired: After 7 days OR after logout
```

### Blacklist Lifecycle

```
Token Logout
├─ Hashed: SHA-256
├─ Stored: token_blacklist table
├─ Indexed: Fast lookup
├─ Checked: On every refresh
└─ Cleanup: Daily at 3 AM (CRON)
```

---

## 🔄 Token Rotation Flow

```
Initial Login
  │
  ├─ access_token_1 (15min)
  └─ refresh_token_1 (7days)
        │
        ▼
   After 16 minutes
        │
        ├─ POST /refresh
        │
        ├─ refresh_token_1 → BLACKLISTED ✅
        │
        ├─ access_token_2 (15min) → NEW
        └─ refresh_token_2 (7days) → NEW
              │
              ▼
         After 16 minutes
              │
              ├─ POST /refresh
              │
              ├─ refresh_token_2 → BLACKLISTED ✅
              │
              ├─ access_token_3 (15min) → NEW
              └─ refresh_token_3 (7days) → NEW
                    │
                    └─ Continue...
```

**Avantage:** Un refresh token volé ne peut être utilisé qu'une seule fois.

---

## 🧪 Test Scenarios

### ✅ Happy Path
```
1. Register → 201 + tokens
2. Use access_token → 200
3. Wait 16 min
4. Refresh → 200 + new tokens
5. Use new access_token → 200
6. Logout → 200
```

### ❌ Error Path
```
1. Register → 201
2. Logout → 200
3. Try refresh → 401 "Token revoked"
```

### 🔒 Security Test
```
1. Register → 201
2. Copy refresh_token
3. Refresh (1st time) → 200
4. Try refresh with old token → 401 "Token revoked"
```

---

## 📊 Database Schema

### users
```sql
CREATE TABLE users (
  id                    UUID PRIMARY KEY,
  email                 VARCHAR(255) UNIQUE,
  passwordHash          VARCHAR(60),      -- bcrypt
  firstName             VARCHAR(50),
  lastName              VARCHAR(50),
  role                  user_roles_enum,  -- user/admin
  isActive              BOOLEAN,
  failedLoginAttempts   INT DEFAULT 0,    -- Future: brute force
  lockedUntil           TIMESTAMPTZ,      -- Future: brute force
  ...
);
```

### token_blacklist
```sql
CREATE TABLE token_blacklist (
  id              UUID PRIMARY KEY,
  tokenHash       VARCHAR(64) UNIQUE,  -- SHA-256
  expiresAt       TIMESTAMPTZ,
  blacklistedAt   TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_token_blacklist_hash (tokenHash),
  INDEX idx_token_blacklist_expires (expiresAt)
);
```

---

## 🎯 Performance

### Token Verification
- **Access Token:** Local JWT verify (~1ms)
- **Refresh Token:** JWT verify + DB check (~10-50ms)

### Blacklist Lookup
- **Indexed:** O(log n) with B-tree index
- **Average:** <10ms for 100k entries

### CRON Cleanup
- **Frequency:** Daily at 3 AM
- **Impact:** ~100-1000ms (off-peak)
- **Deleted:** Expired tokens only

---

**Architecture complète et sécurisée ! 🎉**
