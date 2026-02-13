-- ============================================================================
-- V011: CMS & Visual Editor Tables - Git-style Governance & Approval Workflow
-- ============================================================================
-- Description: Creates tables for CMS site pages, git-style governance proposals,
--              visual page editor content, pending changes, approvals, and versions
-- Dependencies: V001 (shared schema, users table)
-- Author: Alecia Suite
-- Date: 2026-02-08
-- ============================================================================

-- ============================================================================
-- Site Pages (Git-style CMS)
-- ============================================================================
CREATE TABLE shared.site_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_site_pages_slug ON shared.site_pages(slug);
CREATE INDEX idx_site_pages_is_published ON shared.site_pages(is_published);
CREATE INDEX idx_site_pages_created_at ON shared.site_pages(created_at);

CREATE TRIGGER update_site_pages_updated_at
    BEFORE UPDATE ON shared.site_pages
    FOR EACH ROW
    EXECUTE FUNCTION shared.update_updated_at();

-- ============================================================================
-- Proposals (Git-style governance)
-- ============================================================================
CREATE TABLE shared.proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_page_id UUID NOT NULL REFERENCES shared.site_pages(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    diff_snapshot TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
    votes_for TEXT[] DEFAULT '{}',
    votes_against TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'voting' CHECK (status IN ('voting', 'merged', 'rejected')),
    ai_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proposals_target_page_id ON shared.proposals(target_page_id);
CREATE INDEX idx_proposals_author_id ON shared.proposals(author_id);
CREATE INDEX idx_proposals_status ON shared.proposals(status);
CREATE INDEX idx_proposals_created_at ON shared.proposals(created_at);

-- ============================================================================
-- Page Content (Visual Editor)
-- ============================================================================
CREATE TABLE shared.page_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path TEXT NOT NULL,
    locale TEXT NOT NULL,
    sections JSONB NOT NULL DEFAULT '[]',
    theme JSONB,
    version INT NOT NULL DEFAULT 1,
    published_at BIGINT,
    published_by UUID REFERENCES shared.users(id) ON DELETE SET NULL,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    UNIQUE(path, locale)
);

CREATE INDEX idx_page_content_path ON shared.page_content(path);
CREATE INDEX idx_page_content_locale ON shared.page_content(locale);
CREATE INDEX idx_page_content_published_at ON shared.page_content(published_at);
CREATE INDEX idx_page_content_published_by ON shared.page_content(published_by);
CREATE INDEX idx_page_content_created_at ON shared.page_content(created_at);

-- ============================================================================
-- Pending Changes (Visual Editor Approval Workflow)
-- ============================================================================
CREATE TABLE shared.pending_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_content_id UUID NOT NULL REFERENCES shared.page_content(id) ON DELETE CASCADE,
    page_path TEXT NOT NULL,
    page_locale TEXT NOT NULL,
    changed_by UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
    changed_by_name TEXT NOT NULL,
    change_type TEXT NOT NULL,
    description TEXT,
    visual_diff JSONB NOT NULL,
    code_diff JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    required_approvals INT NOT NULL DEFAULT 2,
    approved_at BIGINT,
    published_at BIGINT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);

CREATE INDEX idx_pending_changes_page_content_id ON shared.pending_changes(page_content_id);
CREATE INDEX idx_pending_changes_changed_by ON shared.pending_changes(changed_by);
CREATE INDEX idx_pending_changes_status ON shared.pending_changes(status);
CREATE INDEX idx_pending_changes_created_at ON shared.pending_changes(created_at);

-- ============================================================================
-- Change Approvals (Visual Editor Approval Workflow)
-- ============================================================================
CREATE TABLE shared.change_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    change_id UUID NOT NULL REFERENCES shared.pending_changes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    approved BOOLEAN NOT NULL,
    comment TEXT,
    created_at BIGINT NOT NULL,
    UNIQUE(change_id, user_id)
);

CREATE INDEX idx_change_approvals_change_id ON shared.change_approvals(change_id);
CREATE INDEX idx_change_approvals_user_id ON shared.change_approvals(user_id);
CREATE INDEX idx_change_approvals_approved ON shared.change_approvals(approved);
CREATE INDEX idx_change_approvals_created_at ON shared.change_approvals(created_at);

-- ============================================================================
-- Page Versions (Visual Editor Version History)
-- ============================================================================
CREATE TABLE shared.page_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_content_id UUID NOT NULL REFERENCES shared.page_content(id) ON DELETE CASCADE,
    page_path TEXT NOT NULL,
    version INT NOT NULL,
    sections JSONB NOT NULL,
    theme JSONB,
    published_by UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
    published_by_name TEXT NOT NULL,
    published_at BIGINT NOT NULL,
    change_description TEXT
);

CREATE INDEX idx_page_versions_page_content_id ON shared.page_versions(page_content_id);
CREATE INDEX idx_page_versions_version ON shared.page_versions(version);
CREATE INDEX idx_page_versions_published_by ON shared.page_versions(published_by);
CREATE INDEX idx_page_versions_published_at ON shared.page_versions(published_at);

-- ============================================================================
-- Grant permissions
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON shared.site_pages TO alecia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON shared.proposals TO alecia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON shared.page_content TO alecia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON shared.pending_changes TO alecia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON shared.change_approvals TO alecia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON shared.page_versions TO alecia_app;

-- ============================================================================
-- End of V011
-- ============================================================================
