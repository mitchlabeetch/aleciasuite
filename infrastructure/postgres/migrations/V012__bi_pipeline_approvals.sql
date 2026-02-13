-- ============================================================================
-- V012: Alecia BI Schema - Pipeline & Approval Workflow Tables
-- ============================================================================
-- Description: Creates tables for Kanban pipeline management, project events
--              timeline, and multi-level approval workflows
-- Dependencies: V001 (shared schema)
-- Author: Alecia Suite
-- Date: 2026-02-08
-- ============================================================================

-- ============================================================================
-- Kanban Columns (Pipeline Management)
-- ============================================================================
CREATE TABLE alecia_bi.kanban_columns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES shared.deals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    sort_order INT NOT NULL,
    color TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kanban_columns_deal_id ON alecia_bi.kanban_columns(deal_id);
CREATE INDEX idx_kanban_columns_sort_order ON alecia_bi.kanban_columns(sort_order);
CREATE INDEX idx_kanban_columns_created_at ON alecia_bi.kanban_columns(created_at);

-- ============================================================================
-- Project Events (Activity Timeline)
-- ============================================================================
CREATE TABLE alecia_bi.project_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES shared.deals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES shared.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'status_change',
        'note_added',
        'document_uploaded',
        'meeting_scheduled',
        'email_sent',
        'call_logged'
    )),
    title TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_events_deal_id ON alecia_bi.project_events(deal_id);
CREATE INDEX idx_project_events_user_id ON alecia_bi.project_events(user_id);
CREATE INDEX idx_project_events_event_type ON alecia_bi.project_events(event_type);
CREATE INDEX idx_project_events_deal_created ON alecia_bi.project_events(deal_id, created_at DESC);
CREATE INDEX idx_project_events_created_at ON alecia_bi.project_events(created_at);

-- ============================================================================
-- Approval Requests (Generic Approval Workflow)
-- ============================================================================
CREATE TABLE alecia_bi.approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL CHECK (entity_type IN (
        'deal',
        'document',
        'page',
        'expense'
    )),
    entity_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    requested_by UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES shared.deals(id) ON DELETE SET NULL,
    approval_type TEXT NOT NULL CHECK (approval_type IN ('any', 'all', 'sequential')) DEFAULT 'any',
    required_approvals INT NOT NULL DEFAULT 1,
    status TEXT NOT NULL CHECK (status IN (
        'pending',
        'approved',
        'rejected',
        'cancelled',
        'expired'
    )) DEFAULT 'pending',
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    due_date TIMESTAMPTZ,
    current_step INT DEFAULT 1,
    template_id UUID,
    decided_at TIMESTAMPTZ,
    decided_by UUID REFERENCES shared.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_approval_requests_entity ON alecia_bi.approval_requests(entity_type, entity_id);
CREATE INDEX idx_approval_requests_requested_by ON alecia_bi.approval_requests(requested_by);
CREATE INDEX idx_approval_requests_deal_id ON alecia_bi.approval_requests(deal_id);
CREATE INDEX idx_approval_requests_status ON alecia_bi.approval_requests(status);
CREATE INDEX idx_approval_requests_priority ON alecia_bi.approval_requests(priority);
CREATE INDEX idx_approval_requests_due_date ON alecia_bi.approval_requests(due_date);
CREATE INDEX idx_approval_requests_template_id ON alecia_bi.approval_requests(template_id);
CREATE INDEX idx_approval_requests_decided_by ON alecia_bi.approval_requests(decided_by);
CREATE INDEX idx_approval_requests_created_at ON alecia_bi.approval_requests(created_at);

CREATE TRIGGER update_approval_requests_updated_at
    BEFORE UPDATE ON alecia_bi.approval_requests
    FOR EACH ROW
    EXECUTE FUNCTION shared.update_updated_at();

-- ============================================================================
-- Approval Reviews (Individual Review Decisions)
-- ============================================================================
CREATE TABLE alecia_bi.approval_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES alecia_bi.approval_requests(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
    step INT DEFAULT 1,
    decision TEXT NOT NULL CHECK (decision IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    comment TEXT,
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(request_id, reviewer_id)
);

CREATE INDEX idx_approval_reviews_request_id ON alecia_bi.approval_reviews(request_id);
CREATE INDEX idx_approval_reviews_reviewer_id ON alecia_bi.approval_reviews(reviewer_id);
CREATE INDEX idx_approval_reviews_decision ON alecia_bi.approval_reviews(decision);
CREATE INDEX idx_approval_reviews_step ON alecia_bi.approval_reviews(step);
CREATE INDEX idx_approval_reviews_decided_at ON alecia_bi.approval_reviews(decided_at);
CREATE INDEX idx_approval_reviews_created_at ON alecia_bi.approval_reviews(created_at);

-- ============================================================================
-- Approval Templates (Reusable Approval Workflows)
-- ============================================================================
CREATE TABLE alecia_bi.approval_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    entity_type TEXT NOT NULL CHECK (entity_type IN (
        'deal',
        'document',
        'page',
        'expense'
    )),
    approval_type TEXT NOT NULL CHECK (approval_type IN ('any', 'all', 'sequential')) DEFAULT 'any',
    required_approvals INT NOT NULL DEFAULT 1,
    default_reviewers JSONB DEFAULT '[]',
    auto_assign_rules JSONB,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_approval_templates_entity_type ON alecia_bi.approval_templates(entity_type);
CREATE INDEX idx_approval_templates_is_default ON alecia_bi.approval_templates(is_default);
CREATE INDEX idx_approval_templates_is_active ON alecia_bi.approval_templates(is_active);
CREATE INDEX idx_approval_templates_created_by ON alecia_bi.approval_templates(created_by);
CREATE INDEX idx_approval_templates_created_at ON alecia_bi.approval_templates(created_at);

CREATE TRIGGER update_approval_templates_updated_at
    BEFORE UPDATE ON alecia_bi.approval_templates
    FOR EACH ROW
    EXECUTE FUNCTION shared.update_updated_at();

-- ============================================================================
-- Grant permissions
-- ============================================================================
GRANT USAGE ON SCHEMA alecia_bi TO alecia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA alecia_bi TO alecia_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA alecia_bi TO alecia_app;

-- ============================================================================
-- End of V012
-- ============================================================================
