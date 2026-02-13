-- ============================================================================
-- V007: Team Members, User Preferences, and Presence Tables
-- ============================================================================
-- Description: Adds tables for team member profiles, user preferences,
--              and real-time presence tracking.
-- Dependencies: V001 (shared schema), V006 (BetterAuth)
-- Author: Alecia Suite
-- Date: 2026-02-08
-- ============================================================================

-- ── Team Members (for website team page) ────────────────────────────────

CREATE TABLE shared.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    photo TEXT,
    photo_url TEXT,
    bio_fr TEXT,
    bio_en TEXT,
    linkedin_url TEXT,
    email TEXT,
    sectors_expertise TEXT[] DEFAULT '{}',
    transaction_slugs TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_team_members_slug ON shared.team_members(slug);
CREATE INDEX idx_team_members_display_order ON shared.team_members(display_order);

CREATE TRIGGER trg_team_members_updated_at BEFORE UPDATE ON shared.team_members
    FOR EACH ROW EXECUTE FUNCTION shared.update_updated_at();

-- ── User Preferences (cross-app sync) ───────────────────────────────────

CREATE TABLE shared.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES shared.users(id) ON DELETE CASCADE,

    -- UI preferences
    theme TEXT DEFAULT 'system', -- 'light' | 'dark' | 'system'
    accent_color TEXT,
    sidebar_collapsed BOOLEAN DEFAULT FALSE,
    compact_mode BOOLEAN DEFAULT FALSE,

    -- Notification preferences
    notifications JSONB DEFAULT '{
        "emailEnabled": true,
        "pushEnabled": true,
        "digestFrequency": "daily"
    }',

    -- Localization
    locale TEXT DEFAULT 'fr', -- 'fr' | 'en'
    timezone TEXT DEFAULT 'Europe/Paris',
    date_format TEXT DEFAULT 'DD/MM/YYYY',
    number_format TEXT DEFAULT 'fr-FR',

    -- Dashboard preferences
    default_dashboard TEXT,
    pinned_deals TEXT[] DEFAULT '{}',
    favorite_views TEXT[] DEFAULT '{}',

    -- Editor preferences
    editor_font_size INTEGER DEFAULT 14,
    editor_line_height NUMERIC(3,1) DEFAULT 1.5,
    editor_word_wrap BOOLEAN DEFAULT TRUE,
    spell_check_enabled BOOLEAN DEFAULT TRUE,

    -- Integration preferences
    default_calendar_provider TEXT, -- 'microsoft' | 'google' | 'none'
    auto_link_emails BOOLEAN DEFAULT TRUE,
    keyboard_shortcuts JSONB DEFAULT '{}',

    -- Activity tracking
    last_active_app TEXT, -- 'panel' | 'colab'
    last_active_route TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_preferences_user_id ON shared.user_preferences(user_id);

CREATE TRIGGER trg_user_preferences_updated_at BEFORE UPDATE ON shared.user_preferences
    FOR EACH ROW EXECUTE FUNCTION shared.update_updated_at();

-- ── Presence (real-time user activity tracking) ─────────────────────────

CREATE TABLE shared.presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES shared.users(id) ON DELETE CASCADE,
    current_page TEXT NOT NULL,
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_presence_user_id ON shared.presence(user_id);
CREATE INDEX idx_presence_last_seen ON shared.presence(last_seen);

-- No updated_at trigger needed for presence (last_seen is the timestamp)

-- ── Grant permissions ────────────────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE, DELETE ON shared.team_members TO alecia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON shared.user_preferences TO alecia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON shared.presence TO alecia_app;

-- ============================================================================
-- End of V007
-- ============================================================================
