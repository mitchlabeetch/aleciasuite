-- ============================================================================
-- V008: Business Tables - Transactions, Notifications, Feature Flags, Config
-- ============================================================================
-- Description: Creates tables for M&A track record (transactions), user
--              notifications, feature flag management, and global configuration
-- Dependencies: V001 (shared schema, users, deals tables)
-- Author: Alecia Suite
-- Date: 2026-02-08
-- ============================================================================

-- ============================================================================
-- Transactions (M&A Track Record for Marketing)
-- ============================================================================
CREATE TABLE shared.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    client_name TEXT NOT NULL,
    client_logo TEXT,
    acquirer_name TEXT,
    acquirer_logo TEXT,
    sector TEXT NOT NULL,
    region TEXT,
    year INT NOT NULL,
    mandate_type TEXT NOT NULL,
    description TEXT,
    is_confidential BOOLEAN DEFAULT FALSE,
    is_client_confidential BOOLEAN DEFAULT FALSE,
    is_acquirer_confidential BOOLEAN DEFAULT FALSE,
    is_prior_experience BOOLEAN DEFAULT FALSE,
    context TEXT,
    intervention TEXT,
    result TEXT,
    testimonial_text TEXT,
    testimonial_author TEXT,
    role_type TEXT,
    deal_size TEXT,
    deal_id UUID REFERENCES shared.deals(id) ON DELETE SET NULL,
    key_metrics JSONB DEFAULT '{}',
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_slug ON shared.transactions(slug);
CREATE INDEX idx_transactions_deal_id ON shared.transactions(deal_id);
CREATE INDEX idx_transactions_sector ON shared.transactions(sector);
CREATE INDEX idx_transactions_year ON shared.transactions(year);
CREATE INDEX idx_transactions_mandate_type ON shared.transactions(mandate_type);
CREATE INDEX idx_transactions_display_order ON shared.transactions(display_order);
CREATE INDEX idx_transactions_created_at ON shared.transactions(created_at);

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON shared.transactions
    FOR EACH ROW
    EXECUTE FUNCTION shared.update_updated_at();

-- ============================================================================
-- Notifications
-- ============================================================================
CREATE TABLE shared.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
    trigger_id UUID REFERENCES shared.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    payload JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient_id ON shared.notifications(recipient_id);
CREATE INDEX idx_notifications_trigger_id ON shared.notifications(trigger_id);
CREATE INDEX idx_notifications_entity_type ON shared.notifications(entity_type);
CREATE INDEX idx_notifications_entity_id ON shared.notifications(entity_id);
CREATE INDEX idx_notifications_is_read ON shared.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON shared.notifications(created_at);
CREATE INDEX idx_notifications_recipient_read ON shared.notifications(recipient_id, is_read);

-- ============================================================================
-- Feature Flags
-- ============================================================================
CREATE TABLE shared.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT FALSE,
    rollout_strategy TEXT NOT NULL CHECK (rollout_strategy IN ('all', 'none', 'percentage', 'users', 'roles', 'domains')),
    rollout_percentage INT CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    allowed_user_ids TEXT[] DEFAULT '{}',
    allowed_roles TEXT[] DEFAULT '{}',
    allowed_domains TEXT[] DEFAULT '{}',
    environments TEXT[] DEFAULT '{}',
    category TEXT CHECK (category IN ('feature', 'experiment', 'ops', 'release')),
    expires_at BIGINT,
    created_by UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feature_flags_key ON shared.feature_flags(key);
CREATE INDEX idx_feature_flags_enabled ON shared.feature_flags(enabled);
CREATE INDEX idx_feature_flags_category ON shared.feature_flags(category);
CREATE INDEX idx_feature_flags_created_by ON shared.feature_flags(created_by);
CREATE INDEX idx_feature_flags_created_at ON shared.feature_flags(created_at);

CREATE TRIGGER update_feature_flags_updated_at
    BEFORE UPDATE ON shared.feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION shared.update_updated_at();

-- ============================================================================
-- Feature Flag Assignments (for tracking user-specific overrides)
-- ============================================================================
CREATE TABLE shared.feature_flag_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_key TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
    is_enabled BOOLEAN NOT NULL,
    assigned_by UUID REFERENCES shared.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(flag_key, user_id)
);

CREATE INDEX idx_feature_flag_assignments_flag_key ON shared.feature_flag_assignments(flag_key);
CREATE INDEX idx_feature_flag_assignments_user_id ON shared.feature_flag_assignments(user_id);
CREATE INDEX idx_feature_flag_assignments_created_at ON shared.feature_flag_assignments(created_at);

-- ============================================================================
-- Global Config (Key-Value Store)
-- ============================================================================
CREATE TABLE shared.global_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_global_config_key ON shared.global_config(key);
CREATE INDEX idx_global_config_updated_at ON shared.global_config(updated_at);

-- ============================================================================
-- Grant permissions
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON shared.transactions TO alecia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON shared.notifications TO alecia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON shared.feature_flags TO alecia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON shared.feature_flag_assignments TO alecia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON shared.global_config TO alecia_app;

-- ============================================================================
-- End of V008
-- ============================================================================
