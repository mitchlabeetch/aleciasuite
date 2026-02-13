-- ============================================================================
-- V010: Calendar & Analytics Tables
-- ============================================================================
-- Description: Creates tables for calendar event management, calendar sync state,
--              analytics events ingestion, and analytics cache
-- Dependencies: V001 (shared schema, users, deals tables)
-- Author: Alecia Suite
-- Date: 2026-02-08
-- ============================================================================

-- ============================================================================
-- Calendar Events
-- ============================================================================
CREATE TABLE shared.calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_date_time BIGINT NOT NULL,
    end_date_time BIGINT NOT NULL,
    is_all_day BOOLEAN DEFAULT FALSE,
    location TEXT,
    source TEXT NOT NULL CHECK (source IN ('microsoft', 'google', 'manual')),
    owner_id UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES shared.deals(id) ON DELETE SET NULL,
    company_id UUID REFERENCES shared.companies(id) ON DELETE SET NULL,
    organizer JSONB,
    attendees JSONB DEFAULT '[]',
    is_online_meeting BOOLEAN DEFAULT FALSE,
    online_meeting_url TEXT,
    online_meeting_provider TEXT,
    status TEXT CHECK (status IN ('confirmed', 'tentative', 'cancelled')),
    ical_uid TEXT,
    change_key TEXT,
    recurrence TEXT,
    recurring_event_id TEXT,
    last_synced_at BIGINT NOT NULL,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    UNIQUE(source, external_id)
);

CREATE INDEX idx_calendar_events_owner_id ON shared.calendar_events(owner_id);
CREATE INDEX idx_calendar_events_deal_id ON shared.calendar_events(deal_id);
CREATE INDEX idx_calendar_events_company_id ON shared.calendar_events(company_id);
CREATE INDEX idx_calendar_events_source ON shared.calendar_events(source);
CREATE INDEX idx_calendar_events_start_date_time ON shared.calendar_events(start_date_time);
CREATE INDEX idx_calendar_events_external_id ON shared.calendar_events(external_id);
CREATE INDEX idx_calendar_events_created_at ON shared.calendar_events(created_at);

-- ============================================================================
-- Calendar Sync State
-- ============================================================================
CREATE TABLE shared.calendar_sync_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES shared.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('microsoft', 'google')),
    is_enabled BOOLEAN DEFAULT FALSE,
    sync_direction TEXT CHECK (sync_direction IN ('import_only', 'export_only', 'bidirectional')),
    last_synced_at BIGINT,
    sync_token TEXT,
    last_error TEXT,
    last_error_at BIGINT,
    consecutive_errors INT DEFAULT 0,
    sync_past_days INT DEFAULT 30,
    sync_future_days INT DEFAULT 90,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);

CREATE INDEX idx_calendar_sync_state_user_id ON shared.calendar_sync_state(user_id);
CREATE INDEX idx_calendar_sync_state_provider ON shared.calendar_sync_state(provider);
CREATE INDEX idx_calendar_sync_state_is_enabled ON shared.calendar_sync_state(is_enabled);
CREATE INDEX idx_calendar_sync_state_last_synced_at ON shared.calendar_sync_state(last_synced_at);

-- ============================================================================
-- Analytics Events (Vercel Web Analytics drain)
-- ============================================================================
CREATE TABLE shared.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    path TEXT NOT NULL,
    hostname TEXT,
    referrer TEXT,
    referrer_hostname TEXT,
    visitor_id TEXT,
    session_id TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    country TEXT,
    country_code TEXT,
    region TEXT,
    city TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_term TEXT,
    utm_content TEXT,
    event_timestamp BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_event_id ON shared.analytics_events(event_id);
CREATE INDEX idx_analytics_events_event_type ON shared.analytics_events(event_type);
CREATE INDEX idx_analytics_events_path ON shared.analytics_events(path);
CREATE INDEX idx_analytics_events_visitor_id ON shared.analytics_events(visitor_id);
CREATE INDEX idx_analytics_events_session_id ON shared.analytics_events(session_id);
CREATE INDEX idx_analytics_events_country_code ON shared.analytics_events(country_code);
CREATE INDEX idx_analytics_events_event_timestamp ON shared.analytics_events(event_timestamp);
CREATE INDEX idx_analytics_events_created_at ON shared.analytics_events(created_at);

-- ============================================================================
-- Analytics Cache
-- ============================================================================
CREATE TABLE shared.analytics_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key TEXT UNIQUE NOT NULL,
    data JSONB NOT NULL,
    expires_at BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_cache_cache_key ON shared.analytics_cache(cache_key);
CREATE INDEX idx_analytics_cache_expires_at ON shared.analytics_cache(expires_at);
CREATE INDEX idx_analytics_cache_created_at ON shared.analytics_cache(created_at);

-- ============================================================================
-- Grant permissions
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON shared.calendar_events TO alecia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON shared.calendar_sync_state TO alecia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON shared.analytics_events TO alecia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON shared.analytics_cache TO alecia_app;

-- ============================================================================
-- End of V010
-- ============================================================================
