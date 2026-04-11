# skilo — Backend TODO List
> Framework: **RCTC** (Route → Controller → Service → Repository/Entity)
> Stack: NestJS · PostgreSQL · TypeORM · JWT · bcrypt · Socket.io
> Priority: 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low

---

## ✅ STATUS LEGEND
- [ ] Not started
- [~] In progress
- [x] Done

---

## 🏗️ PHASE 0 — Project Setup
> Priority: 🔴 Critical — Must be done before everything else

- [ ] **P0-01** Init NestJS project (`nest new skilo-api`)
- [ ] **P0-02** Setup PostgreSQL + TypeORM config (`ormconfig` / `DataSource`)
- [ ] **P0-03** Setup environment variables (`.env` + `ConfigModule`)
  - `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `BCRYPT_COST`, `PORT`
  - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- [ ] **P0-04** Setup global validation pipe (`class-validator` + `class-transformer`)
- [ ] **P0-05** Setup global exception filter (uniform error response shape)
- [ ] **P0-06** Setup global response interceptor (uniform success response shape)
- [ ] **P0-07** Enable CORS (allow frontend origin + credentials: true for cookies)
- [ ] **P0-08** Setup UUID v4 as primary key strategy (no auto-increment IDs exposed)
- [ ] **P0-09** Setup cookie-parser middleware (for httpOnly refresh token)
- [ ] **P0-10** Create base Entity class (`id: UUID`, `createdAt`, `updatedAt`)
- [ ] **P0-11** Install Cloudinary packages: `cloudinary`, `multer`, `@nestjs/platform-express`, `streamifier`

---

## 🔐 FC-01 — Authentication & Onboarding
> Priority: 🔴 Critical

### Entities / DB
- [ ] **FC01-E1** Create `User` entity
  - `id` UUID PK
  - `firstName` varchar(50)
  - `lastName` varchar(50)
  - `email` varchar (unique, lowercase index)
  - `passwordHash` varchar (never returned in API)
  - `city` varchar(100) nullable
  - `bio` varchar(280) nullable
  - `avatarUrl` varchar nullable
  - `isOnboarded` boolean default false
  - `isActive` boolean default true
  - `lastLoginAt` timestamp nullable
  - `creditBalance` int default 2
  - `createdAt`, `updatedAt`

- [ ] **FC01-E2** Create `TokenBlacklist` entity
  - `id` UUID PK
  - `token` varchar (the refresh token)
  - `expiresAt` timestamp
  - `createdAt`

- [ ] **FC01-E3** Create `LoginAttempt` entity (brute force protection)
  - `id` UUID PK
  - `email` varchar
  - `ipAddress` varchar
  - `attemptCount` int default 0
  - `blockedUntil` timestamp nullable
  - `createdAt`, `updatedAt`

### Routes
```
POST   /auth/register       → RegisterController
POST   /auth/login          → LoginController
POST   /auth/logout         → LogoutController (protected)
POST   /auth/refresh        → RefreshController
GET    /auth/me             → MeController (protected)
```

### RCTC Breakdown

#### FC01-01 — Register
- [ ] **R** `POST /auth/register`
- [ ] **C** `AuthController.register(dto)` → calls AuthService
- [ ] **T** `RegisterDto`: validate firstName, lastName, email (lowercase), password (min 8, 1 uppercase, 1 digit), passwordConfirm match
- [ ] **C (Service)** `AuthService.register(dto)`:
  1. Check email uniqueness (case-insensitive) → throw 409 if exists
  2. Hash password with bcrypt (cost 12)
  3. Create & save User (`isOnboarded = false`, `creditBalance = 2`)
  4. Generate access token (JWT, 15min, payload: `{ sub, email, firstName, lastName }`)
  5. Generate refresh token (JWT, 7 days)
  6. Set refresh token as httpOnly, SameSite=Strict cookie
  7. Return access token in response body (never the refresh token)

#### FC01-02 — Onboarding (single POST, all steps at once)
> ⚠️ Decision: UI has multiple screens but submits ONE final request at the end.
> Avatar is uploaded separately FIRST via `POST /upload`, then its URL is passed here.

- [ ] **R** `POST /onboarding` (protected — user must be authenticated, `isOnboarded = false`)
- [ ] **R** `GET  /onboarding/status` (protected — returns current onboarding state)
- [ ] **C** `OnboardingController` (protected by JWT guard)
- [ ] **T** `OnboardingDto`:
  ```ts
  {
    skillsOffered: [{ skillId, level }]  // min 1, max 5 — no description (Q1 decision)
    skillsWanted:  [{ skillId, level }]  // min 1, max 5
    city:     string  // 2-100 chars
    bio:      string  // max 280 chars, optional
    avatarUrl: string // optional — URL from prior POST /upload call
  }
  ```
- [ ] **C (Service)** `OnboardingService.complete(userId, dto)`:
  1. Validate skillsOffered length (1-5) + skillsWanted length (1-5)
  2. Verify each skillId exists in the Skills catalog
  3. Save UserSkill records for offered + wanted (wrapped in DB transaction)
  4. Save city, bio, avatarUrl on User
  5. Set `isOnboarded = true`
  6. Award welcome credit bonus (already set at register, log the transaction)
  7. Trigger async matching recalculation job
  8. Return updated user profile
- [ ] **Guard** `OnboardingGuard`: protect dashboard routes — if `isOnboarded = false` → return 403 with `{ redirectTo: '/onboarding' }`

#### FC01-03 — Login
- [ ] **R** `POST /auth/login`
- [ ] **C** `AuthController.login(dto)`
- [ ] **T** `LoginDto`: email, password (both required)
- [ ] **C (Service)** `AuthService.login(dto)`:
  1. Check brute force: if `attemptCount >= 5` AND `blockedUntil > now` → throw 429 with "Blocage 15 minutes"
  2. Find user by email (case-insensitive)
  3. Compare password with bcrypt hash
  4. If invalid → increment `attemptCount`, if >= 5 set `blockedUntil = now + 15min` → throw 401 generic message
  5. On success → reset `attemptCount`, update `lastLoginAt`
  6. Check `isActive` → throw 403 if disabled
  7. Generate access + refresh tokens
  8. Set httpOnly cookie, return access token
  9. Return redirect hint: `{ redirectTo: isOnboarded ? '/dashboard' : '/onboarding' }`

#### FC01-04 — Token Refresh
- [ ] **R** `POST /auth/refresh`
- [ ] **C** `AuthController.refresh(req)`
- [ ] **C (Service)** `AuthService.refresh(refreshToken)`:
  1. Read refresh token from httpOnly cookie
  2. Check TokenBlacklist → throw 401 if found
  3. Verify JWT signature + expiry
  4. Generate new access token
  5. Return new access token in response body

#### FC01-05 — Logout
- [ ] **R** `POST /auth/logout` (protected)
- [ ] **C** `AuthController.logout(req, res)`
- [ ] **C (Service)** `AuthService.logout(refreshToken)`:
  1. Add refresh token to `TokenBlacklist` with `expiresAt`
  2. Clear httpOnly cookie (`Max-Age=0`)
  3. Return 200

#### FC01-06 — Guards & Strategy
- [ ] **G** `JwtAccessStrategy` (Passport) — validate access token, attach user to request
- [ ] **G** `JwtRefreshStrategy` (Passport) — validate refresh token from cookie
- [ ] **G** `JwtAuthGuard` — global guard for protected routes
- [ ] **G** Cron job: clean expired tokens from `TokenBlacklist` (daily)

---

## 👤 FC-02 — User Profile
> Priority: 🔴 Critical

### Entities / DB
- [ ] **FC02-E1** Create `Skill` entity (global skills catalog)
  - `id` UUID PK
  - `name` varchar (unique, normalized)
  - `categoryId` FK → Category
  - `status` enum: `approved | pending_review`
  - `createdAt`

- [ ] **FC02-E2** Create `Category` entity
  - `id` UUID PK
  - `name` varchar (Tech, Langues, Arts, Business, Sport, Cuisine, Autre)

- [ ] **FC02-E3** Create `UserSkill` entity (join table with metadata)
  - `id` UUID PK
  - `userId` FK → User
  - `skillId` FK → Skill
  - `type` enum: `offered | wanted`
  - `level` enum: `beginner | intermediate | advanced`
  - `isLinkedToSession` boolean default false *(set to true when first session uses this skill — blocks deletion)*
  - `createdAt`, `updatedAt`

### Routes
```
GET    /users/me                → Get own full profile
PATCH  /users/me                → Edit own profile
DELETE /users/me                → Soft delete own account
GET    /users/:id               → Get public profile
GET    /users                   → List all active users (paginated)
GET    /skills/search?q=        → Autocomplete skills
POST   /skills                  → Create new skill (pending_review)
POST   /upload                  → Upload avatar to Cloudinary → returns { avatarUrl }
```

### RCTC Breakdown

#### FC02-01 — Edit Own Profile
- [ ] **R** `PATCH /users/me` (protected)
- [ ] **C** `UsersController.updateMe(dto, user)`
- [ ] **T** `UpdateProfileDto`: firstName, lastName, city, bio (max 280), avatarUrl
- [ ] **C (Service)** `UsersService.updateMe(userId, dto)`:
  1. Validate file type MIME (server-side) if avatarUrl upload
  2. Save updated fields
  3. Recalculate profile strength score
  4. If strength = 100 AND bonus not yet given → add +1 credit (one-time)
  5. Trigger async matching recalculation job
  6. Return updated user (no password, no email of others)

#### FC02-02 — Manage Skills on Profile
> ⚠️ Q1 Decision: A skill linked to ANY session (any status) **cannot be deleted**. Only `level` can be updated (description field removed from UserSkill per Q1).

- [ ] **R** `POST /users/me/skills` (protected)
- [ ] **R** `PATCH /users/me/skills/:userSkillId` (protected — level only)
- [ ] **R** `DELETE /users/me/skills/:userSkillId` (protected)
- [ ] **C** `UsersController.addSkill(dto, user)` / `updateSkillLevel(id, dto, user)` / `removeSkill(id, user)`
- [ ] **T** `AddSkillDto`: `skillId`, `type` (offered|wanted), `level`
- [ ] **T** `UpdateSkillLevelDto`: `level` (beginner|intermediate|advanced) only
- [ ] **C (Service)** `UsersService.addSkill(userId, dto)`:
  1. Check user doesn't already have 5 skills of that type → throw 400
  2. Check skill exists in catalog (approved or pending_review)
  3. Save UserSkill
  4. Trigger matching recalculation
- [ ] **C (Service)** `UsersService.removeSkill(userId, userSkillId)`:
  1. Check skill is not linked to any session (any status) → throw 400 with message "Cette compétence est liée à une session et ne peut pas être supprimée."
  2. Delete UserSkill
  3. Trigger matching recalculation
- [ ] **C (Service)** `UsersService.updateSkillLevel(userId, userSkillId, level)`:
  1. Verify ownership → throw 403 if not owner
  2. Update level only
  3. Trigger matching recalculation

#### FC02-03 — Avatar Upload (Cloudinary)
> ⚠️ Q5 Decision: Avatar uploaded to Cloudinary BEFORE onboarding/profile submit. Returns URL stored on User.

- [ ] **P0-11** Install `multer`, `@nestjs/platform-express`, `cloudinary`, `streamifier` packages
- [ ] **P0-12** Add Cloudinary env vars: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- [ ] **R** `POST /upload` (protected)
- [ ] **C** `UploadController.uploadAvatar(file, user)`
- [ ] **C (Service)** `UploadService.uploadAvatar(file, userId)`:
  1. Validate MIME type server-side: only `image/jpeg`, `image/png`, `image/webp` → throw 400 otherwise
  2. Validate file size ≤ 5MB → throw 400 otherwise
  3. Stream upload to Cloudinary (folder: `skilo/avatars/`, public_id: `userId`)
  4. Return `{ avatarUrl: secure_url }`
  5. Previous avatar on Cloudinary is overwritten (same public_id)

#### FC02-04 — Profile Strength Calculation
- [ ] **C (Service)** `UsersService.calculateProfileStrength(userId)`:
  - avatarUrl set: +20
  - bio set: +20
  - >= 3 offered skills: +30
  - >= 3 wanted skills: +30
  - Return score + label (`incomplete | partial | complete`) + next recommended action

#### FC02-05 — Public Profile
- [ ] **R** `GET /users/:id` (protected)
- [ ] **C** `UsersController.getPublicProfile(id, currentUser)`
- [ ] **C (Service)** `UsersService.getPublicProfile(id, currentUserId)`:
  1. Throw 404 if user not found or `isOnboarded = false`
  2. Return: photo, name, city, bio, offered skills, wanted skills, average rating, session count, badges, reviews list
  3. Determine action button type: `propose_session | write_message | view_session | none`
  4. Never return: email (unless confirmed session exists between them), password, credit balance, session history

#### FC02-06 — Skills Autocomplete
- [ ] **R** `GET /skills/search?q=term` (protected)
- [ ] **C** `SkillsController.search(q)`
- [ ] **C (Service)** `SkillsService.search(q)`: ILIKE query on name, return top 10 approved skills
- [ ] **R** `POST /skills` — create new skill with `status: pending_review`

---

## 🤝 FC-03 — Matching Algorithm
> Priority: 🟠 High

### Entities / DB
- [ ] **FC03-E1** Create `Match` entity
  - `id` UUID PK
  - `userAId` FK → User
  - `userBId` FK → User
  - `type` enum: `perfect | partial`
  - `score` int
  - `compatibilityLabel` enum: `very_compatible | compatible | partially_compatible`
  - `matchedSkillPairs` JSONB (array of `{ offeredSkillId, wantedSkillId }`)
  - `status` enum: `active | archived`
  - `createdAt`, `updatedAt`

### Routes
```
GET    /matches                 → Get own matches (paginated, filterable)
GET    /matches/:id             → Get single match detail
POST   /matches/recalculate     → Manually trigger recalculation (admin or internal)
```

### RCTC Breakdown

#### FC03-01 — Match Calculation (Core Algorithm)
- [ ] **C (Service)** `MatchingService.recalculateForUser(userId)`:
  1. Fetch user's offered skills + wanted skills
  2. Fetch all other active, onboarded users
  3. For each candidate user B:
     - Find pairs where A offers X, B wants X AND B offers Y, A wants Y → **perfect match**
     - Find pairs where B offers something A wants BUT B wants nothing A offers → **partial match**
     - Skip if active session (pending|confirmed) already exists between A and B
  4. Calculate score:
     - **Perfect**: base +50/pair, +20 if level exact match, +10 if level one step above
     - **Partial**: base +40/skill, +15 if level exact match
  5. Set `compatibilityLabel` based on score thresholds (70-100 / 50-69 / 20-49)
  6. Upsert Match records (create or update score)
  7. Send notification if new perfect match appeared

- [ ] **C (Job)** `MatchingJob` — scheduled every hour (`@Cron`)
- [ ] **C (Job)** Trigger `recalculateForUser` on: login, profile update, skill add/remove

#### FC03-02 — Get Matches List
- [ ] **R** `GET /matches` (protected)
- [ ] **C** `MatchesController.getMyMatches(query, user)`
- [ ] **T** `MatchFilterDto`: `type` (perfect|partial), `category`, `level`, `sort` (score|rating|sessions), `page`, `limit` (default 20)
- [ ] **C (Service)** `MatchingService.getMatchesForUser(userId, filters)`:
  1. Return paginated list, separated by type (perfect first, then partial)
  2. Exclude users with active sessions (pending|confirmed)
  3. For each match return:
     - photo, firstName, city, compatibility label, average rating, session count, badges
     - `matchedSkillPairs[]`: ALL pairs highlighted (Q2 decision — show all, frontend lets user pick)
       - Each pair: `{ offeredSkill: { id, name, level }, wantedSkill: { id, name, level } }`

---

## 📅 FC-04 — Sessions
> Priority: 🟠 High

### Entities / DB
- [ ] **FC04-E1** Create `Session` entity
  - `id` UUID PK
  - `initiatorId` FK → User
  - `recipientId` FK → User
  - `matchId` FK → Match (nullable for credit-based sessions)
  - `status` enum: `pending | confirmed | completed | cancelled | auto_completed | disputed`
  - `proposedAt` timestamp
  - `scheduledAt` timestamp
  - `duration` int (minutes: 30, 60, 90, 120)
  - `modalityLink` varchar nullable
  - `offeredSkillId` FK → Skill (what initiator teaches)
  - `wantedSkillId` FK → Skill (what initiator learns)
  - `message` varchar(300) nullable
  - `cancellationReason` varchar(200) nullable
  - `initiatorConfirmed` boolean nullable (for completion)
  - `recipientConfirmed` boolean nullable (for completion)
  - `isDisputed` boolean default false *(stays true after auto-resolve, for future admin audit)*
  - `creditsPaid` int default 0
  - `createdAt`, `updatedAt`

### Routes
```
POST   /sessions                    → Propose a session
GET    /sessions                    → List own sessions (upcoming + past)
GET    /sessions/:id                → Get session detail
PATCH  /sessions/:id/accept         → Accept session (recipient)
PATCH  /sessions/:id/decline        → Decline session (recipient)
PATCH  /sessions/:id/cancel         → Cancel session (both)
PATCH  /sessions/:id/confirm        → Confirm session happened (both)
```

### RCTC Breakdown

#### FC04-01 — Propose Session
- [ ] **R** `POST /sessions` (protected)
- [ ] **C** `SessionsController.propose(dto, user)`
- [ ] **T** `ProposeSessionDto`: `recipientId`, `scheduledAt`, `duration` (30|60|90|120), `offeredSkillId`, `wantedSkillId`, `message`
- [ ] **C (Service)** `SessionsService.propose(initiatorId, dto)`:
  1. Validate `scheduledAt` >= now + 2h AND <= now + 30 days
  2. Check no existing pending|confirmed session between the two users → throw 409
  3. Check match exists (perfect or partial) OR user has enough credits for credit-based session
  4. For credit sessions: reserve credits (don't debit yet)
  5. Create Session with status `pending`
  6. Send notification to recipient

#### FC04-02 — Accept / Decline Session
- [ ] **R** `PATCH /sessions/:id/accept` (protected)
- [ ] **R** `PATCH /sessions/:id/decline` (protected)
- [ ] **C (Service)** `SessionsService.accept(sessionId, recipientId)`:
  1. Verify user is the recipient
  2. Verify status is `pending`
  3. If credit-based: debit reserved credits from initiator
  4. Set status → `confirmed`
  5. Notify initiator
- [ ] **C (Service)** `SessionsService.decline(sessionId, recipientId, reason?)`:
  1. Set status → `cancelled`
  2. If credit-based: release reserved credits back
  3. Notify initiator with reason

#### FC04-03 — Confirm Session Completion
- [ ] **R** `PATCH /sessions/:id/confirm` (protected)
- [ ] **C (Service)** `SessionsService.confirm(sessionId, userId, didHappen: boolean)`:
  1. Verify session is `confirmed` and `scheduledAt` is in the past
  2. Set `initiatorConfirmed` or `recipientConfirmed` based on who is calling
  3. Evaluate state matrix:
     - Both `true` → status `completed`, unlock evaluation, credit teacher
     - One `false` → status `disputed` + set `isDisputed = true` on Session, notify both
     - Both `false` → status `cancelled`
     - One confirmed, other silent after 24h → `auto_completed` (cron job)
  4. If `completed` or `auto_completed`: trigger credit distribution

#### FC04-05 — Disputed Session Auto-Resolve Cron Job
> ⚠️ Q4 Decision: Auto-resolve after 48h. Keep `isDisputed` flag for future admin panel.

- [ ] **C (Job)** `DisputeResolverJob` — runs every hour:
  1. Find sessions with `status = disputed` AND `updatedAt < now - 48h`
  2. Set status → `auto_completed`, `isDisputed` stays `true` (admin can audit later)
  3. Trigger credit distribution + unlock evaluation
  4. Notify both users: "Votre litige a été résolu automatiquement."

#### FC04-04 — Cancel Session
- [ ] **R** `PATCH /sessions/:id/cancel` (protected)
- [ ] **C (Service)** `SessionsService.cancel(sessionId, userId, reason?)`:
  1. Verify user is initiator or recipient
  2. Verify status is `pending` or `confirmed`
  3. If < 2h before scheduled time: flag with warning (reputation system future)
  4. If credit-based: refund credits to initiator
  5. Set status → `cancelled`, notify other party

#### FC04-05 — Auto-Complete Cron Job
- [ ] **C (Job)** `SessionCompletionJob` — runs every 30 minutes:
  1. Find `confirmed` sessions where `scheduledAt + duration < now`
  2. If one confirmed and other silent for > 24h → set `auto_completed`
  3. Trigger credit distribution + unlock evaluation

#### FC04-06 — 1-Hour Reminder Cron Job
- [ ] **C (Job)** `SessionReminderJob` — runs every 15 minutes:
  1. Find `confirmed` sessions where `scheduledAt` is between now+1h and now+1h15min
  2. Send in-app notification to both users

#### FC04-07 — Get Sessions List
- [ ] **R** `GET /sessions` (protected)
- [ ] **C** `SessionsController.getMySessions(query, user)`
- [ ] **T** `SessionFilterDto`: `tab` (upcoming|past), `page`, `limit`
- [ ] Returns: photo + firstName of other party, date, duration, skills, status with color code

---

## ⭐ FC-05 — Evaluations & Badges
> Priority: 🟡 Medium

### Entities / DB
- [ ] **FC05-E1** Create `Review` entity
  - `id` UUID PK
  - `sessionId` FK → Session (unique per reviewer)
  - `reviewerId` FK → User
  - `revieweeId` FK → User
  - `globalRating` int (1-5)
  - `pedagogyRating` int nullable (1-5)
  - `punctualityRating` int nullable (1-5)
  - `communicationRating` int nullable (1-5)
  - `comment` varchar(500) nullable
  - `skillId` FK → Skill
  - `isVisible` boolean default false (becomes true when both reviewed)
  - `createdAt`

- [ ] **FC05-E2** Create `Badge` entity
  - `id` UUID PK
  - `userId` FK → User (unique)
  - `type` enum: `reliable` (extendable)
  - `awardedAt` timestamp
  - `isActive` boolean default true

### Routes
```
POST   /reviews                     → Submit a review
GET    /reviews/session/:sessionId  → Get reviews for a session (own only)
GET    /users/:id/reviews           → Get public reviews for a user
```

### RCTC Breakdown

#### FC05-01 — Submit Review
- [ ] **R** `POST /reviews` (protected)
- [ ] **C** `ReviewsController.submit(dto, user)`
- [ ] **T** `SubmitReviewDto`: `sessionId`, `globalRating` (1-5, required), `pedagogyRating?`, `punctualityRating?`, `communicationRating?`, `comment?`
- [ ] **C (Service)** `ReviewsService.submit(reviewerId, dto)`:
  1. Verify session status is `completed` or `auto_completed`
  2. Verify session `createdAt` (completed date) < 7 days ago → throw 403
  3. Verify reviewer hasn't already reviewed this session → throw 409
  4. Save review with `isVisible = false`
  5. If other party already reviewed → set both reviews `isVisible = true`
  6. Recalculate reviewee's average ratings
  7. Trigger badge check

#### FC05-02 — Badge Fiable Check
- [ ] **C (Service)** `BadgeService.checkReliableBadge(userId)`:
  1. Count completed sessions >= 5
  2. Average global rating >= 4.0
  3. If both met AND badge not active → award badge, send notification
  4. If conditions no longer met AND badge active → silently revoke (`isActive = false`)

#### FC05-03 — Average Rating Calculation
- [ ] **C (Service)** `ReviewsService.recalculateAverages(userId)`:
  - Query avg of all visible `globalRating`, `pedagogyRating`, `punctualityRating`, `communicationRating`
  - Store on User entity as `avgGlobalRating`, `avgPedagogyRating`, etc. (denormalized for performance)

---

## 💳 FC-06 — Time Credits System
> Priority: 🟡 Medium

### Entities / DB
- [ ] **FC06-E1** Create `CreditTransaction` entity
  - `id` UUID PK
  - `userId` FK → User
  - `type` enum: `welcome_bonus | earned | spent | refunded | profile_bonus | reserved | released`
  - `amount` int (positive = credit, negative = debit)
  - `sessionId` FK → Session nullable
  - `description` varchar
  - `createdAt`

### Routes
```
GET    /credits/balance             → Get own credit balance + reserved
GET    /credits/history             → Get full transaction history (paginated)
```

### RCTC Breakdown

#### FC06-01 — Credit Operations (Internal Service)
- [ ] **C (Service)** `CreditsService.reserve(userId, amount, sessionId)`:
  1. Check balance >= amount → throw 400 with specific message
  2. Check balance - amount >= 0 (never negative)
  3. Create `reserved` transaction
  4. (Don't debit yet — shown as "reserved" in dashboard)

- [ ] **C (Service)** `CreditsService.debit(userId, amount, sessionId)`:
  1. Convert reserved → spent transaction
  2. Update `creditBalance` on User

- [ ] **C (Service)** `CreditsService.credit(userId, amount, sessionId)`:
  1. Calculate new balance: `current + amount`
  2. If new balance > 20 → cap at 20, log surplus as lost
  3. **Before** completing: warn teacher via notification "Attention, votre solde atteint le plafond de 20 crédits. [N] crédit(s) seront perdus." (Q3 decision — warn proactively)
  4. Create `earned` transaction (capped amount)
  5. Update `creditBalance` on User
  6. Notify user: "Vous avez gagné [N] crédit(s)..."

- [ ] **C (Service)** `CreditsService.refund(userId, amount, sessionId)`:
  1. Convert reserved → released, add back to balance
  2. Notify user: "[N] crédit(s) remboursé(s)..."

#### FC06-02 — Credit Dashboard
- [ ] **R** `GET /credits/balance` (protected)
- [ ] Returns: `available`, `reserved`, `total`, progression to cap (20), estimation of hours accessible
- [ ] **R** `GET /credits/history` (protected, paginated)
- [ ] Returns: date, type, amount (+/-), description, linked session

---

## 🔔 FC-07 — Notifications (In-App)
> Priority: 🟡 Medium

### Entities / DB
- [ ] **FC07-E1** Create `Notification` entity
  - `id` UUID PK
  - `userId` FK → User
  - `type` enum: `new_perfect_match | match_upgraded | session_proposed | session_accepted | session_declined | session_reminder | session_completed | review_received | badge_awarded | credit_earned | credit_refunded`
  - `title` varchar
  - `body` varchar
  - `isRead` boolean default false
  - `metadata` JSONB nullable (sessionId, matchId, etc.)
  - `createdAt`

### Routes
```
GET    /notifications               → Get own notifications (paginated, unread first)
PATCH  /notifications/:id/read      → Mark as read
PATCH  /notifications/read-all      → Mark all as read
```

### RCTC Breakdown
- [ ] **C (Service)** `NotificationsService.send(userId, type, data)` — internal method called by all other services
- [ ] **R** `GET /notifications` — list with unread count
- [ ] **R** `PATCH /notifications/:id/read`
- [ ] **R** `PATCH /notifications/read-all`

---

## 🔒 FC-08 — Authorization & Security (Transversal)
> Priority: 🔴 Critical

- [ ] **FC08-01** Validate all DTOs server-side with `class-validator` (never trust frontend only)
- [ ] **FC08-02** All file uploads: validate MIME type server-side (not just extension)
- [ ] **FC08-03** All UUIDs in URLs validated before hitting DB (throw 400 on invalid UUID format)
- [ ] **FC08-04** `403 Forbidden` on any attempt to modify another user's resources
- [ ] **FC08-05** Never return `passwordHash`, `refreshToken`, other users' emails in any response
- [ ] **FC08-06** Email stored + compared case-insensitively (normalize to lowercase on save)
- [ ] **FC08-07** Generic error messages for auth failures (never reveal if email exists)
- [ ] **FC08-08** Brute force protection: 5 failed logins → 15-minute block per email
- [ ] **FC08-09** Pagination on all list endpoints (default 20 items/page)
- [ ] **FC08-10** DB indexes: `users.email`, `skills.name`, `skills.category_id`, `sessions.status`, `sessions.scheduled_at`, `matches.user_a_id`, `matches.user_b_id`

---

## 🧪 PHASE — Testing
> Priority: 🟠 High (required for academic demo)

- [ ] **T-01** Unit tests: `AuthService` (register, login, refresh, logout)
- [ ] **T-02** Unit tests: `MatchingService.recalculateForUser` (perfect/partial logic)
- [ ] **T-03** Unit tests: `CreditsService` (reserve, debit, credit, refund edge cases)
- [ ] **T-04** Unit tests: `ReviewsService` (7-day window, visibility logic)
- [ ] **T-05** E2E tests: full auth flow (register → onboarding → login → refresh → logout)
- [ ] **T-06** E2E tests: session lifecycle (propose → accept → confirm → review)
- [ ] **T-07** HTTP files to keep updated: `auth.http`, `users.http`, add `sessions.http`, `matches.http`, `credits.http`, `reviews.http`

---

## 📋 EXECUTION ORDER (Recommended)

```
Phase 0: Setup
    ↓
FC-01: Auth (register + login + refresh + logout + guards)
    ↓
FC-02: Users + Skills (profile CRUD + autocomplete)
    ↓
FC-01 (cont): Onboarding steps (needs skills entities ready)
    ↓
FC-03: Matching Algorithm
    ↓
FC-04: Sessions (propose → accept → confirm → cancel)
    ↓
FC-06: Credits (integrated with sessions)
    ↓
FC-05: Reviews + Badges
    ↓
FC-07: Notifications
    ↓
FC-08: Security audit pass
    ↓
Tests
    ↓
→ FRONTEND
```

---

## ✅ DECISIONS LOG (All Questions Resolved)

| # | Question | Decision |
|---|----------|----------|
| Q1 | Can a skill linked to a session be modified/deleted? | ❌ Cannot be **deleted** if linked to any session. Only **level** can be updated. Description field removed from UserSkill. |
| Q2 | Match card: show all highlighted skill pairs or let user filter? | ✅ Show **all pairs highlighted**. Frontend lets user pick which one to act on. |
| Q3 | Credit cap at 20: silent loss or warn before? | ✅ **Warn proactively** via notification before session completes. Cap at 20, surplus lost. |
| Q4 | Disputed sessions resolution? | ✅ **Auto-resolve after 48h** → `auto_completed`. Keep `isDisputed = true` flag for future admin audit panel. |
| Q5 | File upload storage? | ✅ **Cloudinary** (free tier). Upload via `POST /upload` first, returns URL, then URL passed in onboarding/profile update. |
| Q6 | Onboarding: multi-step or single request? | ✅ **Single `POST /onboarding`** with all fields at once: `skillsOffered[]`, `skillsWanted[]`, `city`, `bio`, `avatarUrl`. UI can have multiple screens but one final submission. |

---

_skilo todos.md — Backend Phase · Updated 2026-04-11 · All decisions resolved ✅_
