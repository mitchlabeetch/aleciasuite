-- ============================================================================
-- V009: Content Tables - Blog, Forum, Jobs, Marketing, Locations
-- ============================================================================
-- Description: Creates tables for blog posts, forum discussions, job offers,
--              marketing KPIs, and location images for the website
-- Dependencies: V001 (shared schema, users table)
-- Author: Alecia Suite
-- Date: 2026-02-08
-- ============================================================================

-- ============================================================================
-- Blog Posts
-- ============================================================================
CREATE TABLE shared.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    author_id UUID REFERENCES shared.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image TEXT,
    category TEXT,
    published_at BIGINT,
    seo JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    created_at BIGINT NOT NULL
);

CREATE INDEX idx_blog_posts_status ON shared.blog_posts(status);
CREATE INDEX idx_blog_posts_author_id ON shared.blog_posts(author_id);
CREATE INDEX idx_blog_posts_slug ON shared.blog_posts(slug);
CREATE INDEX idx_blog_posts_category ON shared.blog_posts(category);
CREATE INDEX idx_blog_posts_published_at ON shared.blog_posts(published_at);
CREATE INDEX idx_blog_posts_created_at ON shared.blog_posts(created_at);

-- ============================================================================
-- Forum Categories
-- ============================================================================
CREATE TABLE shared.forum_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT FALSE,
    "order" INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_forum_categories_order ON shared.forum_categories("order");
CREATE INDEX idx_forum_categories_is_private ON shared.forum_categories(is_private);
CREATE INDEX idx_forum_categories_created_at ON shared.forum_categories(created_at);

-- ============================================================================
-- Forum Threads
-- ============================================================================
CREATE TABLE shared.forum_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT,
    deal_id UUID REFERENCES shared.deals(id) ON DELETE SET NULL,
    author_id UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    created_at BIGINT NOT NULL
);

CREATE INDEX idx_forum_threads_category ON shared.forum_threads(category);
CREATE INDEX idx_forum_threads_deal_id ON shared.forum_threads(deal_id);
CREATE INDEX idx_forum_threads_author_id ON shared.forum_threads(author_id);
CREATE INDEX idx_forum_threads_is_pinned ON shared.forum_threads(is_pinned);
CREATE INDEX idx_forum_threads_created_at ON shared.forum_threads(created_at);

-- ============================================================================
-- Forum Posts
-- ============================================================================
CREATE TABLE shared.forum_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES shared.forum_threads(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
    parent_post_id UUID REFERENCES shared.forum_posts(id) ON DELETE SET NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at BIGINT NOT NULL
);

CREATE INDEX idx_forum_posts_thread_id ON shared.forum_posts(thread_id);
CREATE INDEX idx_forum_posts_author_id ON shared.forum_posts(author_id);
CREATE INDEX idx_forum_posts_parent_post_id ON shared.forum_posts(parent_post_id);
CREATE INDEX idx_forum_posts_created_at ON shared.forum_posts(created_at);

-- ============================================================================
-- Job Offers
-- ============================================================================
CREATE TABLE shared.job_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    contact_email TEXT,
    pdf_url TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_job_offers_slug ON shared.job_offers(slug);
CREATE INDEX idx_job_offers_type ON shared.job_offers(type);
CREATE INDEX idx_job_offers_is_published ON shared.job_offers(is_published);
CREATE INDEX idx_job_offers_display_order ON shared.job_offers(display_order);
CREATE INDEX idx_job_offers_created_at ON shared.job_offers(created_at);

CREATE TRIGGER update_job_offers_updated_at
    BEFORE UPDATE ON shared.job_offers
    FOR EACH ROW
    EXECUTE FUNCTION shared.update_updated_at();

-- ============================================================================
-- Marketing KPIs
-- ============================================================================
CREATE TABLE shared.marketing_kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    icon TEXT NOT NULL,
    value NUMERIC NOT NULL,
    suffix TEXT,
    prefix TEXT,
    label_fr TEXT NOT NULL,
    label_en TEXT NOT NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_marketing_kpis_key ON shared.marketing_kpis(key);
CREATE INDEX idx_marketing_kpis_display_order ON shared.marketing_kpis(display_order);
CREATE INDEX idx_marketing_kpis_is_active ON shared.marketing_kpis(is_active);

-- ============================================================================
-- Location Images (for interactive map)
-- ============================================================================
CREATE TABLE shared.location_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id TEXT UNIQUE NOT NULL,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_location_images_location_id ON shared.location_images(location_id);
CREATE INDEX idx_location_images_updated_at ON shared.location_images(updated_at);

-- ============================================================================
-- Grant permissions
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON shared.blog_posts TO alecia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON shared.forum_categories TO alecia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON shared.forum_threads TO alecia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON shared.forum_posts TO alecia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON shared.job_offers TO alecia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON shared.marketing_kpis TO alecia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON shared.location_images TO alecia_app;

-- ============================================================================
-- End of V009
-- ============================================================================
