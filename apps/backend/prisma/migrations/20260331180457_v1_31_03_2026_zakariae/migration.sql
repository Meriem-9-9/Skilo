-- CreateEnum
CREATE TYPE "skill_category_enum" AS ENUM ('tech', 'languages', 'arts', 'business', 'sport', 'cooking', 'other');

-- CreateEnum
CREATE TYPE "skill_status_enum" AS ENUM ('approved', 'pending_review', 'rejected');

-- CreateEnum
CREATE TYPE "skill_level_enum" AS ENUM ('beginner', 'intermediate', 'advanced');

-- CreateEnum
CREATE TYPE "skill_type_enum" AS ENUM ('offered', 'wanted');

-- CreateEnum
CREATE TYPE "match_type_enum" AS ENUM ('perfect', 'partial');

-- CreateEnum
CREATE TYPE "match_status_enum" AS ENUM ('active', 'archived');

-- CreateEnum
CREATE TYPE "session_status_enum" AS ENUM ('pending', 'confirmed', 'completed', 'auto_completed', 'cancelled', 'disputed');

-- CreateEnum
CREATE TYPE "session_modality_enum" AS ENUM ('online');

-- CreateEnum
CREATE TYPE "credit_type_enum" AS ENUM ('welcome_bonus', 'profile_bonus', 'session_earned', 'session_spent', 'session_reserved', 'session_released', 'session_confirmed');

-- CreateEnum
CREATE TYPE "notification_type_enum" AS ENUM ('new_perfect_match', 'new_partial_match', 'match_upgraded', 'session_proposed', 'session_accepted', 'session_declined', 'session_cancelled', 'session_reminder', 'session_completion_ask', 'session_completed', 'review_received', 'credits_earned', 'credits_spent', 'credits_refunded', 'badge_earned');

-- CreateTable
CREATE TABLE "token_blacklist" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tokenHash" VARCHAR(64) NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "blacklistedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_blacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "emailLower" VARCHAR(255),
    "passwordHash" VARCHAR(60) NOT NULL,
    "firstName" VARCHAR(50) NOT NULL,
    "lastName" VARCHAR(50) NOT NULL,
    "city" VARCHAR(100),
    "bio" VARCHAR(280),
    "avatarUrl" VARCHAR(500),
    "isOnboarded" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "creditBalance" INTEGER NOT NULL DEFAULT 2,
    "creditReserved" INTEGER NOT NULL DEFAULT 0,
    "profileScore" INTEGER NOT NULL DEFAULT 0,
    "avgRating" DECIMAL(3,2),
    "avgPedagogy" DECIMAL(3,2),
    "avgPunctuality" DECIMAL(3,2),
    "avgCommunication" DECIMAL(3,2),
    "sessionsCompleted" INTEGER NOT NULL DEFAULT 0,
    "hasBadgeFiable" BOOLEAN NOT NULL DEFAULT false,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMPTZ,
    "lastLoginAt" TIMESTAMPTZ,
    "onboardingStep" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_catalog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "category" "skill_category_enum" NOT NULL,
    "status" "skill_status_enum" NOT NULL DEFAULT 'approved',
    "aliases" TEXT[],
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_skills" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "skillCatalogId" UUID NOT NULL,
    "type" "skill_type_enum" NOT NULL,
    "level" "skill_level_enum" NOT NULL,
    "description" VARCHAR(140),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userAId" UUID NOT NULL,
    "userBId" UUID NOT NULL,
    "type" "match_type_enum" NOT NULL,
    "score" INTEGER NOT NULL,
    "label" VARCHAR(30) NOT NULL,
    "matchedPairs" JSONB NOT NULL DEFAULT '[]',
    "status" "match_status_enum" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "matchId" UUID NOT NULL,
    "proposedById" UUID NOT NULL,
    "recipientId" UUID NOT NULL,
    "scheduledAt" TIMESTAMPTZ NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "modality" "session_modality_enum" NOT NULL DEFAULT 'online',
    "meetingLink" VARCHAR(500),
    "message" VARCHAR(300),
    "skillsExchanged" JSONB NOT NULL DEFAULT '[]',
    "status" "session_status_enum" NOT NULL DEFAULT 'pending',
    "cancelledById" UUID,
    "cancellationReason" VARCHAR(200),
    "confirmedByA" BOOLEAN NOT NULL DEFAULT false,
    "confirmedByB" BOOLEAN NOT NULL DEFAULT false,
    "confirmationDeadline" TIMESTAMPTZ,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL,
    "reviewerId" UUID NOT NULL,
    "revieweeId" UUID NOT NULL,
    "skillCatalogId" UUID,
    "rating" INTEGER NOT NULL,
    "ratingPedagogy" INTEGER,
    "ratingPunctuality" INTEGER,
    "ratingCommunication" INTEGER,
    "comment" VARCHAR(500),
    "isVisible" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "sessionId" UUID,
    "type" "credit_type_enum" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "description" VARCHAR(200) NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "type" "notification_type_enum" NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "token_blacklist_tokenHash_key" ON "token_blacklist"("tokenHash");

-- CreateIndex
CREATE INDEX "idx_token_blacklist_expires" ON "token_blacklist"("expiresAt");

-- CreateIndex
CREATE INDEX "idx_token_blacklist_hash" ON "token_blacklist"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_city" ON "users"("city");

-- CreateIndex
CREATE INDEX "idx_users_active" ON "users"("isActive");

-- CreateIndex
CREATE INDEX "idx_users_onboarded" ON "users"("isOnboarded");

-- CreateIndex
CREATE INDEX "idx_skill_catalog_category" ON "skill_catalog"("category");

-- CreateIndex
CREATE INDEX "idx_skill_catalog_status" ON "skill_catalog"("status");

-- CreateIndex
CREATE INDEX "idx_user_skills_user" ON "user_skills"("userId");

-- CreateIndex
CREATE INDEX "idx_user_skills_catalog" ON "user_skills"("skillCatalogId");

-- CreateIndex
CREATE INDEX "idx_user_skills_type" ON "user_skills"("type");

-- CreateIndex
CREATE INDEX "idx_user_skills_level" ON "user_skills"("level");

-- CreateIndex
CREATE INDEX "idx_user_skills_matching" ON "user_skills"("skillCatalogId", "type", "level");

-- CreateIndex
CREATE UNIQUE INDEX "user_skills_userId_skillCatalogId_type_key" ON "user_skills"("userId", "skillCatalogId", "type");

-- CreateIndex
CREATE INDEX "idx_matches_user_a" ON "matches"("userAId", "status");

-- CreateIndex
CREATE INDEX "idx_matches_user_b" ON "matches"("userBId", "status");

-- CreateIndex
CREATE INDEX "idx_matches_type" ON "matches"("type");

-- CreateIndex
CREATE INDEX "idx_matches_score" ON "matches"("score" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "matches_userAId_userBId_key" ON "matches"("userAId", "userBId");

-- CreateIndex
CREATE INDEX "idx_sessions_match" ON "sessions"("matchId");

-- CreateIndex
CREATE INDEX "idx_sessions_proposed_by" ON "sessions"("proposedById");

-- CreateIndex
CREATE INDEX "idx_sessions_recipient" ON "sessions"("recipientId");

-- CreateIndex
CREATE INDEX "idx_sessions_status" ON "sessions"("status");

-- CreateIndex
CREATE INDEX "idx_sessions_scheduled" ON "sessions"("scheduledAt");

-- CreateIndex
CREATE INDEX "idx_reviews_session" ON "reviews"("sessionId");

-- CreateIndex
CREATE INDEX "idx_reviews_reviewee" ON "reviews"("revieweeId");

-- CreateIndex
CREATE INDEX "idx_reviews_reviewer" ON "reviews"("reviewerId");

-- CreateIndex
CREATE INDEX "idx_reviews_visible" ON "reviews"("revieweeId", "isVisible");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_sessionId_reviewerId_key" ON "reviews"("sessionId", "reviewerId");

-- CreateIndex
CREATE INDEX "idx_credit_user" ON "credit_transactions"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_credit_session" ON "credit_transactions"("sessionId");

-- CreateIndex
CREATE INDEX "idx_credit_type" ON "credit_transactions"("type");

-- CreateIndex
CREATE INDEX "idx_notif_user_unread" ON "notifications"("userId", "isRead", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_notif_user_all" ON "notifications"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_notif_type" ON "notifications"("type");

-- AddForeignKey
ALTER TABLE "skill_catalog" ADD CONSTRAINT "skill_catalog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_skillCatalogId_fkey" FOREIGN KEY ("skillCatalogId") REFERENCES "skill_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_proposedById_fkey" FOREIGN KEY ("proposedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_skillCatalogId_fkey" FOREIGN KEY ("skillCatalogId") REFERENCES "skill_catalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
