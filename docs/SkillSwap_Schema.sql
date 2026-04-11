-- ============================================================
-- SkillSwap — Modèle Physique de Données
-- PostgreSQL 15+
-- Version 1.0 — 2025
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Pour la recherche floue sur skill_catalog

-- ============================================================
-- 1. TOKEN_BLACKLIST
-- Refresh tokens révoqués (déconnexion sécurisée FC-01-C)
-- ============================================================
CREATE TABLE token_blacklist (
    id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_hash    VARCHAR(64) NOT NULL UNIQUE,       -- SHA-256 du refresh token
    expires_at    TIMESTAMPTZ NOT NULL,              -- Date d'expiration originale du token
    blacklisted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Nettoyage automatique des tokens expirés (job CRON ou trigger)
CREATE INDEX idx_token_blacklist_expires ON token_blacklist(expires_at);
CREATE INDEX idx_token_blacklist_hash    ON token_blacklist(token_hash);

COMMENT ON TABLE  token_blacklist              IS 'Refresh tokens révoqués suite à déconnexion explicite (FC-01-C)';
COMMENT ON COLUMN token_blacklist.token_hash   IS 'Hash SHA-256 du refresh token — jamais le token en clair';
COMMENT ON COLUMN token_blacklist.expires_at   IS 'Copie de l expiration originale pour le nettoyage CRON';

-- ============================================================
-- 2. USERS
-- Compte utilisateur principal (FC-01, FC-02)
-- ============================================================
CREATE TABLE users (
    id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    email             VARCHAR(255) NOT NULL UNIQUE,
    email_lower       VARCHAR(255) GENERATED ALWAYS AS (LOWER(email)) STORED, -- Unicité insensible à la casse
    password_hash     VARCHAR(60)  NOT NULL,                                   -- bcrypt hash (60 chars fixe)
    first_name        VARCHAR(50)  NOT NULL CHECK (LENGTH(TRIM(first_name)) >= 2),
    last_name         VARCHAR(50)  NOT NULL CHECK (LENGTH(TRIM(last_name))  >= 2),
    city              VARCHAR(100),
    bio               VARCHAR(280),
    avatar_url        VARCHAR(500),
    is_onboarded      BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
    credit_balance    SMALLINT     NOT NULL DEFAULT 2     CHECK (credit_balance >= 0 AND credit_balance <= 20),
    credit_reserved   SMALLINT     NOT NULL DEFAULT 0     CHECK (credit_reserved >= 0),
    profile_score     SMALLINT     NOT NULL DEFAULT 0     CHECK (profile_score >= 0 AND profile_score <= 100),
    avg_rating        NUMERIC(3,2)          DEFAULT NULL  CHECK (avg_rating >= 1 AND avg_rating <= 5),
    avg_pedagogy      NUMERIC(3,2)          DEFAULT NULL  CHECK (avg_pedagogy >= 1 AND avg_pedagogy <= 5),
    avg_punctuality   NUMERIC(3,2)          DEFAULT NULL  CHECK (avg_punctuality >= 1 AND avg_punctuality <= 5),
    avg_communication NUMERIC(3,2)          DEFAULT NULL  CHECK (avg_communication >= 1 AND avg_communication <= 5),
    sessions_completed SMALLINT    NOT NULL DEFAULT 0     CHECK (sessions_completed >= 0),
    has_badge_fiable  BOOLEAN      NOT NULL DEFAULT FALSE,
    failed_login_attempts SMALLINT NOT NULL DEFAULT 0,
    locked_until      TIMESTAMPTZ           DEFAULT NULL, -- Protection brute force (FC-01-B)
    last_login_at     TIMESTAMPTZ           DEFAULT NULL,
    onboarding_step   SMALLINT     NOT NULL DEFAULT 1     CHECK (onboarding_step BETWEEN 1 AND 3),
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_users_email_lower ON users(email_lower);
CREATE INDEX        idx_users_city        ON users(city);
CREATE INDEX        idx_users_active      ON users(is_active) WHERE is_active = TRUE;
CREATE INDEX        idx_users_onboarded   ON users(is_onboarded) WHERE is_onboarded = TRUE;

COMMENT ON TABLE  users                    IS 'Comptes utilisateurs SkillSwap (FC-01, FC-02)';
COMMENT ON COLUMN users.email_lower        IS 'Colonne générée pour garantir l unicité insensible à la casse';
COMMENT ON COLUMN users.password_hash      IS 'Hash bcrypt coût 12 — jamais le mot de passe en clair';
COMMENT ON COLUMN users.credit_balance     IS 'Crédits disponibles. Plafond 20, plancher 0 (FC-06)';
COMMENT ON COLUMN users.credit_reserved    IS 'Crédits bloqués en attente d acceptation de session (FC-06)';
COMMENT ON COLUMN users.profile_score      IS 'Score 0-100 : photo+20, bio+20, 3 skills offered+30, 3 skills wanted+30';
COMMENT ON COLUMN users.has_badge_fiable   IS 'Recalculé après chaque review reçue (FC-05-B)';
COMMENT ON COLUMN users.locked_until       IS 'NULL = pas bloqué. Sinon timestamp de fin de blocage brute force';
COMMENT ON COLUMN users.onboarding_step    IS '1=compétences offertes, 2=recherchées, 3=infos perso. Complété quand is_onboarded=TRUE';

-- ============================================================
-- 3. SKILL_CATALOG
-- Référentiel centralisé des compétences (autocomplétion FC-02)
-- ============================================================
CREATE TYPE skill_category_enum AS ENUM (
    'tech', 'languages', 'arts', 'business', 'sport', 'cooking', 'other'
);

CREATE TYPE skill_status_enum AS ENUM (
    'approved',       -- Validée, visible dans l'autocomplétion
    'pending_review', -- Créée par un user, en attente de validation
    'rejected'        -- Rejetée (doublon ou inappropriée)
);

CREATE TABLE skill_catalog (
    id           UUID               PRIMARY KEY DEFAULT uuid_generate_v4(),
    name         VARCHAR(100)       NOT NULL,
    name_lower   VARCHAR(100)       GENERATED ALWAYS AS (LOWER(name)) STORED,
    category     skill_category_enum NOT NULL,
    status       skill_status_enum  NOT NULL DEFAULT 'approved',
    aliases      TEXT[],            -- Ex: ['JS', 'ECMAScript'] pour JavaScript
    usage_count  INTEGER            NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
    created_by   UUID               REFERENCES users(id) ON DELETE SET NULL, -- NULL = seed initial
    created_at   TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_skill_catalog_name_lower ON skill_catalog(name_lower);
CREATE INDEX        idx_skill_catalog_category   ON skill_catalog(category);
CREATE INDEX        idx_skill_catalog_status      ON skill_catalog(status) WHERE status = 'approved';
CREATE INDEX        idx_skill_catalog_trgm        ON skill_catalog USING gin(name_lower gin_trgm_ops); -- Recherche floue

COMMENT ON TABLE  skill_catalog             IS 'Référentiel centralisé des compétences pour éviter les doublons (FC-02)';
COMMENT ON COLUMN skill_catalog.aliases     IS 'Synonymes reconnus — permettent de matcher JS avec JavaScript';
COMMENT ON COLUMN skill_catalog.usage_count IS 'Incrémenté à chaque ajout dans user_skills, pour trier les suggestions';
COMMENT ON COLUMN skill_catalog.created_by  IS 'NULL = entrée du seed. UUID = créée par un utilisateur (pending_review)';

-- ============================================================
-- 4. USER_SKILLS
-- Compétences offertes et recherchées d'un utilisateur (FC-02)
-- ============================================================
CREATE TYPE skill_level_enum AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE skill_type_enum  AS ENUM ('offered', 'wanted');

CREATE TABLE user_skills (
    id               UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_catalog_id UUID              NOT NULL REFERENCES skill_catalog(id) ON DELETE RESTRICT,
    type             skill_type_enum   NOT NULL,
    level            skill_level_enum  NOT NULL,
    description      VARCHAR(140),
    created_at       TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

    UNIQUE (user_id, skill_catalog_id, type) -- Un user ne peut pas ajouter deux fois la même compétence du même type
);

-- Contrainte : max 5 compétences par type par user (géré en applicatif + trigger)
CREATE INDEX idx_user_skills_user     ON user_skills(user_id);
CREATE INDEX idx_user_skills_catalog  ON user_skills(skill_catalog_id);
CREATE INDEX idx_user_skills_type     ON user_skills(type);
CREATE INDEX idx_user_skills_level    ON user_skills(level);
CREATE INDEX idx_user_skills_matching ON user_skills(skill_catalog_id, type, level); -- Index composite pour le matching

COMMENT ON TABLE  user_skills        IS 'Compétences offertes et recherchées par utilisateur (FC-02). Max 5 par type.';
COMMENT ON COLUMN user_skills.type   IS 'offered = ce que l user peut enseigner. wanted = ce qu il veut apprendre.';

-- Trigger pour incrémenter usage_count sur skill_catalog
CREATE OR REPLACE FUNCTION increment_skill_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE skill_catalog SET usage_count = usage_count + 1 WHERE id = NEW.skill_catalog_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_skill_usage
    AFTER INSERT ON user_skills
    FOR EACH ROW EXECUTE FUNCTION increment_skill_usage();

-- ============================================================
-- 5. MATCHES
-- Correspondances calculées entre utilisateurs (FC-03)
-- ============================================================
CREATE TYPE match_type_enum   AS ENUM ('perfect', 'partial');
CREATE TYPE match_status_enum AS ENUM ('active', 'archived');

CREATE TABLE matches (
    id           UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_a_id    UUID              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_b_id    UUID              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type         match_type_enum   NOT NULL,
    score        SMALLINT          NOT NULL CHECK (score >= 0 AND score <= 100),
    label        VARCHAR(30)       NOT NULL, -- 'Très compatible' | 'Compatible' | 'Partiellement compatible'
    matched_pairs JSONB            NOT NULL DEFAULT '[]', -- [{"offered_by_a": skill_id, "offered_by_b": skill_id}]
    status       match_status_enum NOT NULL DEFAULT 'active',
    created_at   TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

    -- Un seul match par paire, dans un sens canonique (user_a_id < user_b_id)
    UNIQUE (user_a_id, user_b_id),
    CHECK (user_a_id <> user_b_id)
);

CREATE INDEX idx_matches_user_a  ON matches(user_a_id) WHERE status = 'active';
CREATE INDEX idx_matches_user_b  ON matches(user_b_id) WHERE status = 'active';
CREATE INDEX idx_matches_type    ON matches(type);
CREATE INDEX idx_matches_score   ON matches(score DESC);

COMMENT ON TABLE  matches              IS 'Résultats de l algorithme de matching (FC-03). Recalculé après modification de profil.';
COMMENT ON COLUMN matches.user_a_id   IS 'Toujours l UUID le plus petit des deux — garantit l unicité canonique de la paire';
COMMENT ON COLUMN matches.matched_pairs IS 'JSON des paires de compétences à l origine du match';
COMMENT ON COLUMN matches.label        IS 'Calculé depuis score : >=70=Très compatible, >=50=Compatible, sinon Partiellement compatible';

-- ============================================================
-- 6. SESSIONS
-- Cycle de vie d'une session d'échange (FC-04)
-- ============================================================
CREATE TYPE session_status_enum AS ENUM (
    'pending',        -- Proposition envoyée, en attente de réponse
    'confirmed',      -- Acceptée par le destinataire
    'completed',      -- Les deux ont confirmé la tenue
    'auto_completed', -- Un confirme, l'autre ne répond pas sous 24h
    'cancelled',      -- Annulée par l'une ou l'autre partie
    'disputed'        -- L'un dit oui, l'autre dit non
);

CREATE TYPE session_modality_enum AS ENUM ('online'); -- Présentiel désactivé (tout en ligne)

CREATE TABLE sessions (
    id                   UUID                  PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id             UUID                  NOT NULL REFERENCES matches(id) ON DELETE RESTRICT,
    proposed_by_id       UUID                  NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    recipient_id         UUID                  NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    scheduled_at         TIMESTAMPTZ           NOT NULL,                         -- Date/heure proposée
    duration_minutes     SMALLINT              NOT NULL CHECK (duration_minutes IN (30, 60, 90, 120)),
    modality             session_modality_enum NOT NULL DEFAULT 'online',
    meeting_link         VARCHAR(500),                                           -- Lien Google Meet, Zoom…
    message              VARCHAR(300),                                           -- Message d'accompagnement
    skills_exchanged     JSONB                 NOT NULL DEFAULT '[]',            -- Compétences échangées confirmées
    status               session_status_enum   NOT NULL DEFAULT 'pending',
    cancelled_by_id      UUID                  REFERENCES users(id),
    cancellation_reason  VARCHAR(200),
    confirmed_by_a       BOOLEAN               NOT NULL DEFAULT FALSE,           -- Confirmation de complétion
    confirmed_by_b       BOOLEAN               NOT NULL DEFAULT FALSE,
    confirmation_deadline TIMESTAMPTZ,                                           -- scheduled_at + 24h
    credits_used         SMALLINT              NOT NULL DEFAULT 0 CHECK (credits_used >= 0),
    created_at           TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ           NOT NULL DEFAULT NOW(),

    CHECK (proposed_by_id <> recipient_id)
);

CREATE INDEX idx_sessions_match          ON sessions(match_id);
CREATE INDEX idx_sessions_proposed_by    ON sessions(proposed_by_id);
CREATE INDEX idx_sessions_recipient      ON sessions(recipient_id);
CREATE INDEX idx_sessions_status         ON sessions(status);
CREATE INDEX idx_sessions_scheduled      ON sessions(scheduled_at);
CREATE INDEX idx_sessions_upcoming       ON sessions(scheduled_at) WHERE status IN ('pending', 'confirmed');

COMMENT ON TABLE  sessions                    IS 'Sessions d échange planifiées entre deux utilisateurs (FC-04)';
COMMENT ON COLUMN sessions.skills_exchanged   IS 'JSON des compétences échangées — pré-rempli pour match parfait, saisi pour partiel';
COMMENT ON COLUMN sessions.confirmed_by_a     IS 'TRUE quand proposed_by_id confirme que la session a eu lieu';
COMMENT ON COLUMN sessions.confirmed_by_b     IS 'TRUE quand recipient_id confirme que la session a eu lieu';
COMMENT ON COLUMN sessions.confirmation_deadline IS 'scheduled_at + 24h — déclencheur de l auto_completed';
COMMENT ON COLUMN sessions.credits_used       IS 'Nombre de crédits débités pour cette session (0 pour match parfait)';

-- ============================================================
-- 7. REVIEWS
-- Évaluations post-session (FC-05)
-- ============================================================
CREATE TABLE reviews (
    id                    UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id            UUID         NOT NULL REFERENCES sessions(id) ON DELETE RESTRICT,
    reviewer_id           UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reviewee_id           UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    skill_catalog_id      UUID         REFERENCES skill_catalog(id) ON DELETE SET NULL,
    rating                SMALLINT     NOT NULL CHECK (rating BETWEEN 1 AND 5),
    rating_pedagogy       SMALLINT              CHECK (rating_pedagogy BETWEEN 1 AND 5),       -- Optionnel
    rating_punctuality    SMALLINT              CHECK (rating_punctuality BETWEEN 1 AND 5),    -- Optionnel
    rating_communication  SMALLINT              CHECK (rating_communication BETWEEN 1 AND 5),  -- Optionnel
    comment               VARCHAR(500),
    is_visible            BOOLEAN      NOT NULL DEFAULT FALSE, -- Devient TRUE quand les deux ont évalué
    submitted_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    expires_at            TIMESTAMPTZ  NOT NULL, -- submitted_at + 7 jours depuis la session

    UNIQUE (session_id, reviewer_id), -- Un reviewer ne peut évaluer qu'une fois par session
    CHECK  (reviewer_id <> reviewee_id)
);

CREATE INDEX idx_reviews_session   ON reviews(session_id);
CREATE INDEX idx_reviews_reviewee  ON reviews(reviewee_id);
CREATE INDEX idx_reviews_reviewer  ON reviews(reviewer_id);
CREATE INDEX idx_reviews_visible   ON reviews(reviewee_id) WHERE is_visible = TRUE;

COMMENT ON TABLE  reviews             IS 'Évaluations mutuelles post-session (FC-05). Visibles seulement quand les deux ont évalué.';
COMMENT ON COLUMN reviews.is_visible  IS 'FALSE tant que les deux reviews de la session ne sont pas soumises. Prévention du biais.';
COMMENT ON COLUMN reviews.expires_at  IS 'Fenêtre de 7 jours après la session. Passé ce délai, plus d évaluation possible.';

-- Trigger recalcul notes moyennes après chaque review visible
CREATE OR REPLACE FUNCTION update_user_ratings()
RETURNS TRIGGER AS $$
DECLARE
    v_avg_rating        NUMERIC(3,2);
    v_avg_pedagogy      NUMERIC(3,2);
    v_avg_punctuality   NUMERIC(3,2);
    v_avg_communication NUMERIC(3,2);
    v_sessions_count    INTEGER;
    v_badge             BOOLEAN;
BEGIN
    IF NEW.is_visible = FALSE THEN RETURN NEW; END IF;

    SELECT
        ROUND(AVG(rating)::NUMERIC, 2),
        ROUND(AVG(rating_pedagogy)::NUMERIC, 2),
        ROUND(AVG(rating_punctuality)::NUMERIC, 2),
        ROUND(AVG(rating_communication)::NUMERIC, 2)
    INTO v_avg_rating, v_avg_pedagogy, v_avg_punctuality, v_avg_communication
    FROM reviews
    WHERE reviewee_id = NEW.reviewee_id AND is_visible = TRUE;

    SELECT sessions_completed INTO v_sessions_count FROM users WHERE id = NEW.reviewee_id;

    v_badge := (v_sessions_count >= 5 AND v_avg_rating >= 4.0);

    UPDATE users SET
        avg_rating        = v_avg_rating,
        avg_pedagogy      = v_avg_pedagogy,
        avg_punctuality   = v_avg_punctuality,
        avg_communication = v_avg_communication,
        has_badge_fiable  = v_badge,
        updated_at        = NOW()
    WHERE id = NEW.reviewee_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_ratings
    AFTER INSERT OR UPDATE OF is_visible ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_user_ratings();

-- ============================================================
-- 8. CREDIT_TRANSACTIONS
-- Historique complet des mouvements de crédits (FC-06)
-- ============================================================
CREATE TYPE credit_type_enum AS ENUM (
    'welcome_bonus',      -- +2 à l'inscription
    'profile_bonus',      -- +1 quand profil_score = 100
    'session_earned',     -- +N après avoir enseigné
    'session_spent',      -- -N pour accéder à une session sans match mutuel
    'session_reserved',   -- Crédits bloqués à la proposition
    'session_released',   -- Remboursement suite à annulation
    'session_confirmed'   -- Débit définitif à l'acceptation
);

CREATE TABLE credit_transactions (
    id           UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id   UUID              REFERENCES sessions(id) ON DELETE SET NULL, -- NULL pour welcome_bonus, profile_bonus
    type         credit_type_enum  NOT NULL,
    amount       SMALLINT          NOT NULL, -- Positif = gain, négatif = dépense
    balance_after SMALLINT         NOT NULL CHECK (balance_after >= 0), -- Solde après cette transaction
    description  VARCHAR(200)      NOT NULL,
    created_at   TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_credit_user     ON credit_transactions(user_id, created_at DESC);
CREATE INDEX idx_credit_session  ON credit_transactions(session_id);
CREATE INDEX idx_credit_type     ON credit_transactions(type);

COMMENT ON TABLE  credit_transactions              IS 'Journal immuable de tous les mouvements de crédits temps (FC-06)';
COMMENT ON COLUMN credit_transactions.amount       IS 'Positif = crédit gagné, négatif = crédit dépensé ou réservé';
COMMENT ON COLUMN credit_transactions.balance_after IS 'Snapshot du solde après transaction — facilite l audit et le débogage';

-- ============================================================
-- 9. NOTIFICATIONS
-- Notifications in-app temps réel (FC-04, FC-05, FC-06)
-- ============================================================
CREATE TYPE notification_type_enum AS ENUM (
    'new_perfect_match',      -- Nouveau match parfait disponible
    'new_partial_match',      -- Nouveau match partiel disponible
    'match_upgraded',         -- Match partiel devenu parfait
    'session_proposed',       -- Demande de session reçue
    'session_accepted',       -- Session acceptée
    'session_declined',       -- Session refusée
    'session_cancelled',      -- Session annulée
    'session_reminder',       -- Rappel 1h avant
    'session_completion_ask', -- "Votre session a-t-elle eu lieu ?"
    'session_completed',      -- Session confirmée complétée
    'review_received',        -- Nouvel avis visible
    'credits_earned',         -- Crédits gagnés
    'credits_spent',          -- Crédits dépensés
    'credits_refunded',       -- Crédits remboursés
    'badge_earned'            -- Badge obtenu
);

CREATE TABLE notifications (
    id          UUID                    PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID                    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        notification_type_enum  NOT NULL,
    payload     JSONB                   NOT NULL DEFAULT '{}', -- Données contextuelles (prénom, date, montant…)
    is_read     BOOLEAN                 NOT NULL DEFAULT FALSE,
    read_at     TIMESTAMPTZ             DEFAULT NULL,
    created_at  TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_user_unread ON notifications(user_id, created_at DESC) WHERE is_read = FALSE;
CREATE INDEX idx_notif_user_all    ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notif_type        ON notifications(type);

COMMENT ON TABLE  notifications          IS 'Notifications in-app émises par le système (FC-04, FC-05, FC-06)';
COMMENT ON COLUMN notifications.payload  IS 'JSON contextuel ex: {"from_user":"Jean","session_date":"2025-06-15T15:00:00Z","credits":2}';

-- ============================================================
-- INDEXES COMPOSITES POUR LE MATCHING
-- Optimisation critique de l'algorithme FC-03
-- ============================================================
-- Trouver tous les skills "wanted" d'un user avec leur catalog_id
CREATE INDEX idx_matching_wanted  ON user_skills(user_id, skill_catalog_id) WHERE type = 'wanted';
-- Trouver tous les users qui offrent un skill donné à un niveau donné
CREATE INDEX idx_matching_offered ON user_skills(skill_catalog_id, level)   WHERE type = 'offered';

-- ============================================================
-- SEED DATA — Catégories de compétences populaires
-- ============================================================
INSERT INTO skill_catalog (name, category, status, aliases) VALUES
    ('JavaScript',       'tech',      'approved', ARRAY['JS', 'js', 'javascript']),
    ('Python',           'tech',      'approved', ARRAY['python', 'py']),
    ('React',            'tech',      'approved', ARRAY['ReactJS', 'react.js']),
    ('NestJS',           'tech',      'approved', ARRAY['Nest', 'nestjs']),
    ('PostgreSQL',       'tech',      'approved', ARRAY['Postgres', 'psql', 'SQL']),
    ('Figma',            'arts',      'approved', ARRAY['figma']),
    ('Photoshop',        'arts',      'approved', ARRAY['PS', 'Adobe Photoshop']),
    ('Excel',            'business',  'approved', ARRAY['Microsoft Excel', 'xlsx']),
    ('Anglais',          'languages', 'approved', ARRAY['English', 'anglais']),
    ('Français',         'languages', 'approved', ARRAY['French', 'FLE']),
    ('Espagnol',         'languages', 'approved', ARRAY['Spanish', 'Español']),
    ('Guitare',          'arts',      'approved', ARRAY['guitar']),
    ('Piano',            'arts',      'approved', ARRAY['piano']),
    ('Photographie',     'arts',      'approved', ARRAY['Photo', 'photography']),
    ('Prise de parole',  'business',  'approved', ARRAY['Public speaking', 'expression orale']),
    ('Comptabilité',     'business',  'approved', ARRAY['Compta', 'accounting']),
    ('Yoga',             'sport',     'approved', ARRAY['yoga']),
    ('Cuisine française','cooking',   'approved', ARRAY['French cooking', 'gastronomie']);
