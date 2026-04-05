# Authentication System Review

**Date:** 2026-04-05  
**Reviewed Components:** Login, Register, Me, Refresh, Logout, Access Tokens, Refresh Tokens  
**Status:** ⚠️ Production-Ready with Recommendations

---

## 🟢 Strengths & Well-Implemented Features

### ✅ Security Best Practices
1. **Password Security**
   - bcrypt hashing with cost factor 12 ✓
   - Passwords never stored in plain text ✓
   - 72-character maximum (bcrypt limitation) properly enforced ✓

2. **Brute-Force Protection**
   - 5 failed login attempts trigger 15-minute account lockout ✓
   - Failed attempt counter resets on successful login ✓
   - Lockout stored in database (`lockedUntil` field) ✓

3. **Token Architecture**
   - Separate secrets for access and refresh tokens ✓
   - Short-lived access tokens (15 minutes) ✓
   - Long-lived refresh tokens (7 days) ✓
   - Type checking prevents token misuse (`type: 'access'` vs `type: 'refresh'`) ✓

4. **Cookie Security**
   - HttpOnly cookies prevent XSS attacks ✓
   - Secure flag enabled in production (HTTPS only) ✓
   - SameSite='lax' provides CSRF protection ✓
   - Cookie scoped to `/auth/refresh` path ✓

5. **Token Revocation**
   - SHA-256 hashed tokens stored in blacklist (never plain) ✓
   - Daily cleanup task removes expired tokens (3 AM) ✓
   - Logout properly revokes refresh tokens ✓

6. **User Status Validation**
   - `isActive` flag checked on every JWT validation ✓
   - Deactivated users immediately lose access ✓

7. **Input Validation**
   - Global ValidationPipe with whitelist enabled ✓
   - Unknown fields rejected (`forbidNonWhitelisted: true`) ✓
   - Email auto-trimmed and lowercased ✓
   - Case-insensitive email matching ✓

---

## 🔴 Critical Issues

### ❌ ISSUE #1: Access Token Exposed in Response Body
**File:** `src/auth/auth.controller.ts`  
**Lines:** 43-46 (register), 62-65 (login), 87-90 (refresh)  
**Severity:** HIGH

**Problem:**
```typescript
// Line 43-46 (register)
return {
  user: result.user,
  access_token: result.access_token,  // ⚠️ Vulnerable to XSS
};

// Line 62-65 (login)
return {
  user: result.user,
  access_token: result.access_token,  // ⚠️ Vulnerable to XSS
};

// Line 87-90 (refresh)
return {
  user: result.user,
  access_token: result.access_token,  // ⚠️ Vulnerable to XSS
};
```

Access tokens are returned in the JSON response body, making them accessible to JavaScript. If an XSS vulnerability exists anywhere in the application, attackers can steal these tokens.

**Recommendation:**
- Store access tokens in httpOnly cookies (like refresh tokens)
- OR: Accept the XSS risk if using a trusted frontend framework with CSP headers
- Add documentation explaining the security tradeoff

**Impact:** If exploited via XSS, attackers can impersonate users for up to 15 minutes.

---

### ❌ ISSUE #2: No Refresh Token Rotation
**File:** `src/auth/auth.service.ts`  
**Lines:** 133-166 (entire refresh method)  
**Specific Issue:** Line 163 (only generates new access token)  
**Severity:** MEDIUM-HIGH

**Problem:**
```typescript
// Line 133-166
async refresh(refreshToken: string) {
  // ... validation ...
  
  // Line 163: ⚠️ Only issues new access token, reuses same refresh token
  const accessToken = this.signAccessToken(payload.sub, payload.email);
  
  // Line 165: Returns WITHOUT rotating refresh token
  return { user, access_token: accessToken };
}
```

The system does NOT rotate refresh tokens. If a refresh token is compromised (e.g., stolen from cookies), it can be reused for up to 7 days.

**Recommendation:**
Implement refresh token rotation:
```typescript
async refresh(refreshToken: string) {
  // ... existing validation ...
  
  // 1. Blacklist old refresh token
  const tokenHash = this.hashToken(refreshToken);
  await this.prisma.tokenBlacklist.create({
    data: { tokenHash, expiresAt: new Date(payload.exp * 1000) },
  });
  
  // 2. Issue NEW refresh token + access token
  const tokens = await this.generateTokens(user.id, user.email);
  return { user, ...tokens };
}
```

Then update the controller to set the new refresh token cookie.

**Impact:** Stolen refresh tokens remain valid for full 7-day lifetime.

---

### ❌ ISSUE #3: Logout Requires Valid Access Token
**File:** `src/auth/auth.controller.ts`  
**Lines:** 94-105 (entire logout method)  
**Specific Issue:** Line 94 (`@UseGuards(JwtAuthGuard)`)  
**Severity:** MEDIUM

**Problem:**
```typescript
// Line 94: ⚠️ Guard blocks logout if access token expired
@UseGuards(JwtAuthGuard)
@Post('logout')
@HttpCode(HttpStatus.OK)
async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
  const cookies = req.cookies as { refresh_token?: string } | undefined;
  const refreshToken = cookies?.refresh_token;
  if (refreshToken) {
    await this.authService.logout(refreshToken);
  }
  res.clearCookie('refresh_token', { path: '/auth/refresh' });
  return { message: 'Déconnecté avec succès' };
}
```

Users cannot logout if their access token is expired (even though they have a valid refresh token in cookies).

**Recommendation:**
Mark logout as public and validate refresh token instead:
```typescript
@Public()  // ✓ Allow logout without access token
@Post('logout')
async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
  const refreshToken = req.cookies?.refresh_token;
  if (refreshToken) {
    await this.authService.logout(refreshToken);
  }
  res.clearCookie('refresh_token', { path: '/auth/refresh' });
  return { message: 'Déconnecté avec succès' };
}
```

**Impact:** Poor UX - users cannot logout after 15 minutes of inactivity.

---

## 🟡 Security Warnings

### ⚠️ WARNING #1: No Rate Limiting on Auth Endpoints
**File:** `src/auth/auth.controller.ts`  
**Lines:** 36-47 (register), 52-66 (login), 72-91 (refresh)  
**Severity:** MEDIUM

**Problem:**
No rate limiting is applied to:
- **Line 36-47:** `POST /auth/register` - Can be spammed to create fake accounts
- **Line 52-66:** `POST /auth/login` - Can be brute-forced (only database-level lockout after 5 attempts)
- **Line 72-91:** `POST /auth/refresh` - Can be abused to check token validity

**Recommendation:**
Add rate limiting using `@nestjs/throttler`:
```typescript
@Throttle({ default: { limit: 5, ttl: 60000 } })  // 5 requests per minute
@Post('login')
```

Or use a reverse proxy (nginx, Cloudflare) for rate limiting.

**Impact:** Vulnerable to automated attacks and account enumeration.

---

### ⚠️ WARNING #2: Weak Password Requirements
**File:** `src/auth/dto/register.dto.ts`  
**Line:** 21-23  
**Severity:** MEDIUM

**Problem:**
```typescript
// Line 21-23: Missing special character requirement
@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
  message: 'Mot de passe : au moins 1 majuscule, 1 minuscule et 1 chiffre',
})
password: string;
```

Password validation does NOT require special characters (e.g., `!@#$%^&*`).

**Example Weak Password:** `Password123` (valid but easily guessed)

**Recommendation:**
Add special character requirement:
```typescript
@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
  message: 'Le mot de passe doit contenir une minuscule, une majuscule, un chiffre et un caractère spécial',
})
```

**Impact:** Users may choose weak passwords that meet minimal requirements.

---

### ⚠️ WARNING #3: No Email Verification
**File:** `src/auth/auth.service.ts`  
**Lines:** 43-65 (entire register method)  
**Severity:** MEDIUM

**Problem:**
```typescript
// Line 43-65: No email verification step
async register(dto: RegisterDto) {
  const existing = await this.prisma.user.findUnique({
    where: { email: dto.email.toLowerCase() },
  });

  if (existing) throw new ConflictException('Email déjà utilisé');

  const passwordHash = await bcrypt.hash(dto.password, 12);

  // ⚠️ User created immediately without email verification
  const user = await this.prisma.user.create({
    data: {
      email: dto.email.toLowerCase(),
      emailLower: dto.email.toLowerCase(),
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
    },
    select: USER_SELECT,
  });

  const tokens = await this.generateTokens(user.id, user.email);
  return { user, ...tokens };
}
```

Users can register with any email address without verification. This allows:
- Fake account creation
- Email enumeration
- Account takeover if user mistypes their email

**Recommendation:**
Implement email verification flow:
1. Set `emailVerified: false` on registration
2. Send verification email with token
3. Require verification before accessing protected features

**Impact:** Fake accounts and potential spam/abuse.

---

### ⚠️ WARNING #4: Token Blacklist Can Grow Large
**File:** `src/auth/tasks/blacklist-cleanup.task.ts`  
**Estimated Line:** ~15-20 (based on typical cron task structure)  
**Also affects:** `src/auth/auth.service.ts` Line 171-188 (logout method adds to blacklist)  
**Severity:** LOW-MEDIUM

**Problem:**
Blacklist cleanup runs only once per day (3 AM). During peak usage, the `token_blacklist` table can accumulate thousands of entries, slowing queries.

**Current Cleanup:**
```typescript
// src/auth/tasks/blacklist-cleanup.task.ts
@Cron(CronExpression.EVERY_DAY_AT_3AM)
async cleanExpiredTokens() {
  // Only runs once per day
}
```

**Recommendation:**
- Run cleanup more frequently (e.g., every 6 hours)
- Add database index on `expiresAt` (already exists ✓)
- Consider using Redis for blacklist (faster lookups)

**Impact:** Database performance degradation with high logout volume.

---

### ⚠️ WARNING #5: CORS Origin Hardcoded
**File:** `src/main.ts`  
**Line:** 13-17  
**Severity:** LOW

**Problem:**
```typescript
// Line 13-17: Hardcoded origin URL
app.enableCors({
  origin: 'http://localhost:2004',  // ⚠️ Hardcoded
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
});
```

CORS origin is hardcoded to localhost, preventing production deployment without code changes.

**Recommendation:**
Use environment variable:
```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:2004',
  credentials: true,
});
```

**Impact:** Requires code changes for each deployment environment.

---

## 🔵 Minor Issues & Improvements

### 🔹 ISSUE #1: Missing Environment Variable Validation
**File:** `src/main.ts`  
**Line:** 9-11 (only validates DATABASE_URL, not JWT secrets)  
**Severity:** LOW

**Problem:**
```typescript
// Line 9-11: Only validates DATABASE_URL
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}
// ⚠️ No validation for JWT_SECRET or JWT_REFRESH_SECRET
```

No validation ensures `JWT_SECRET` and `JWT_REFRESH_SECRET` exist at startup.

**Recommendation:**
Add validation in `main.ts` or use `@nestjs/config` validation schema:
```typescript
const requiredEnvVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});
```

---

### 🔹 ISSUE #2: Inconsistent Error Messages
**Files:** `src/auth/auth.service.ts`, `src/auth/auth.controller.ts`, `src/auth/dto/register.dto.ts`  
**Lines:** Multiple locations (48, 80, 104, 141, 145, 153, 160, 198, etc.)  
**Severity:** LOW

**Problem:**
Error messages mix French and English:
- **French:** `'Email déjà utilisé'` (line 48), `'Déconnecté avec succès'` (line 104), etc.
- **English:** Would be in validation errors

**Examples:**
```typescript
// src/auth/auth.service.ts:48
throw new ConflictException('Email déjà utilisé');  // French

// src/auth/dto/register.dto.ts:12
@IsEmail({}, { message: 'Email invalide' })  // French

// Future validation errors would likely be in English by default
```

**Recommendation:**
Standardize all messages to one language (likely French based on existing code).

---

### 🔹 ISSUE #3: Cookie Path May Be Too Restrictive
**File:** `src/auth/auth.controller.ts`  
**Line:** 22-28 (COOKIE_OPTIONS constant)  
**Specific Line:** 27  
**Severity:** LOW

**Problem:**
```typescript
// Line 22-28
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/auth/refresh',  // Line 27: Cookie only sent to this exact path
};
```

If you later need to access the refresh token from other endpoints, this path restriction will block it.

**Recommendation:**
- Keep restrictive path if refresh token should ONLY be used for `/auth/refresh` (current design ✓)
- Change to `path: '/'` if other endpoints need access

**Current Design:** Appears intentional for security, no action needed unless requirements change.

---

### 🔹 ISSUE #4: No Monitoring/Logging for Security Events
**File:** `src/auth/auth.service.ts`  
**Lines:** 68-115 (validateUser - no failed login logging), 133-166 (refresh - no logging), 171-188 (logout - no logging)  
**Severity:** LOW

**Problem:**
No logging for:
- **Failed login attempts** (Line 87-101: increments counter but doesn't log)
- **Account lockouts** (Line 79-83: throws error but doesn't log)
- **Token refresh failures** (Line 140-142, 153: throws errors but doesn't log)
- **Suspicious activity patterns** (No logging anywhere)

**Recommendation:**
Add logging:
```typescript
this.logger.warn(`Failed login attempt for ${email} from IP ${ip}`);
this.logger.warn(`Account locked: ${email} after ${attempts} attempts`);
this.logger.log(`Token refreshed for user ${userId}`);
```

Use a centralized logging service (Sentry, LogRocket, etc.) in production.

---

### 🔹 ISSUE #5: No "Remember Me" Option
**Severity:** LOW

**Problem:**
Refresh token lifetime is fixed at 7 days for all users.

**Recommendation:**
Add optional "remember me" checkbox:
- Checked: 30-day refresh token
- Unchecked: 7-day refresh token

---

### 🔹 ISSUE #6: User Select Fields Properly Configured ✅
**File:** `src/auth/auth.service.ts`  
**Line:** 20-32 (USER_SELECT constant)  
**Severity:** N/A - This is actually CORRECT

**Status:** ✅ **VERIFIED AS SECURE**
```typescript
// Line 20-32
const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  city: true,
  avatarUrl: true,
  isOnboarded: true,
  onboardingStep: true,
  creditBalance: true,
  profileScore: true,
  createdAt: true,
} as const;
```

**Confirmed:**
- ✅ `passwordHash` is NOT included
- ✅ `failedLoginAttempts` is NOT included
- ✅ `lockedUntil` is NOT included
- ✅ Only safe public fields are returned

**Conclusion:** This is correctly implemented. No action needed.

---

## 📋 Summary & Priority

### 🚨 Fix Immediately (Before Production)
1. ❌ **Implement refresh token rotation** - Prevents token reuse attacks
2. ❌ **Make logout route public** - Users should always be able to logout
3. ⚠️ **Add rate limiting** - Prevents brute-force and spam

### 🛠️ Fix Soon (Next Sprint)
4. ⚠️ **Strengthen password requirements** - Add special character requirement
5. ⚠️ **Implement email verification** - Prevents fake accounts
6. ⚠️ **Use environment variable for CORS** - Deployment flexibility

### 💡 Consider for Future
7. 🔹 **Increase blacklist cleanup frequency** - Performance optimization
8. 🔹 **Add security event logging** - Monitoring and incident response
9. 🔹 **Add "Remember Me" feature** - Improved UX
10. 🔹 **Validate environment variables at startup** - Fail-fast deployment

### ✅ Access Token in Response Body
- **Decision Required:** Accept XSS risk with proper CSP headers, or move to httpOnly cookie?
- If keeping current design, document the security tradeoff and ensure CSP headers are configured.

---

## 🎯 Overall Assessment

**Grade: B+ (Production-Ready with Improvements)**

The authentication system demonstrates solid security fundamentals:
- ✅ Excellent password hashing (bcrypt)
- ✅ Strong brute-force protection
- ✅ Proper token architecture (separate secrets, short/long lifetimes)
- ✅ Secure cookie configuration
- ✅ Token revocation mechanism
- ✅ Input validation and sanitization

However, the system has several vulnerabilities that should be addressed before production deployment, particularly refresh token rotation and logout accessibility.

**Recommendation:** Address all "Fix Immediately" items before going live. The authentication system is otherwise well-architected and follows industry best practices.

---

## 📚 Additional Recommendations

### Security Headers
Add security headers in `main.ts`:
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
}));
```

### Session Management
Consider adding:
- Active session tracking (store refresh token IDs in database)
- "Logout from all devices" feature
- Session activity logs (last used, IP address, device info)

### Two-Factor Authentication (2FA)
For high-security applications, consider implementing TOTP-based 2FA as an optional feature.

---

**Review Completed Successfully ✓**
