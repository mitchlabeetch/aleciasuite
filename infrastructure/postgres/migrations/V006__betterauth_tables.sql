-- ============================================================================
-- V006: BetterAuth Tables — Session, Account, Verification
-- ============================================================================
-- Description: Adds tables required by BetterAuth for authentication.
--              Replaces Keycloak SSO. Also renames keycloak_id → auth_provider_id
--              on the users table for provider-agnostic auth.
-- Dependencies: V001 (shared schema)
-- Author: Alecia Suite
-- Date: 2026-02-08
-- ============================================================================

-- ── Rename keycloak_id to auth_provider_id (backward-compatible) ─────
ALTER TABLE shared.users RENAME COLUMN keycloak_id TO auth_provider_id;
COMMENT ON COLUMN shared.users.auth_provider_id IS
  'Legacy: was keycloak_id. Now stores BetterAuth user ID or OAuth sub claim. Nullable for email/password users.';
ALTER TABLE shared.users ALTER COLUMN auth_provider_id DROP NOT NULL;

-- Add email_verified column required by BetterAuth
ALTER TABLE shared.users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- ── Sessions ─────────────────────────────────────────────────────────
CREATE TABLE shared.session (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_session_user_id ON shared.session(user_id);
CREATE INDEX idx_session_token ON shared.session(token);
CREATE INDEX idx_session_expires_at ON shared.session(expires_at);

CREATE TRIGGER update_session_updated_at
    BEFORE UPDATE ON shared.session
    FOR EACH ROW
    EXECUTE FUNCTION shared.update_updated_at();

-- ── Accounts (OAuth provider links: Microsoft, Google, etc.) ─────────
CREATE TABLE shared.account (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    access_token_expires_at TIMESTAMPTZ,
    scope TEXT,
    id_token TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_account_user_id ON shared.account(user_id);
CREATE INDEX idx_account_provider ON shared.account(provider_id, account_id);

CREATE TRIGGER update_account_updated_at
    BEFORE UPDATE ON shared.account
    FOR EACH ROW
    EXECUTE FUNCTION shared.update_updated_at();

-- ── Verification (email verification, magic links, password reset) ──
CREATE TABLE shared.verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_verification_identifier ON shared.verification(identifier);
CREATE INDEX idx_verification_expires_at ON shared.verification(expires_at);

-- ── Grant permissions ────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON shared.session TO alecia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON shared.account TO alecia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON shared.verification TO alecia_app;

-- ============================================================================
-- End of V006
-- ============================================================================
