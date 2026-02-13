-- ============================================================================
-- V002: Alecia BI Schema - Business Intelligence & Research Tables
-- ============================================================================
-- Description: Creates alecia_bi schema for AI embeddings, research feeds,
--              market studies, and buyer criteria management
-- Dependencies: V001 (shared schema)
-- Author: Alecia Suite
-- Date: 2026-02-08
-- ============================================================================

-- Create alecia_bi schema
CREATE SCHEMA IF NOT EXISTS alecia_bi;

-- ============================================================================
-- AI Embeddings Table (Haystack integration)
-- ============================================================================
CREATE TABLE alecia_bi.embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES shared.deals(id) ON DELETE CASCADE,
    document_name TEXT NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- HNSW index for fast cosine similarity search
CREATE INDEX idx_embeddings_vector ON alecia_bi.embeddings
    USING hnsw (embedding vector_cosine_ops);

CREATE INDEX idx_embeddings_deal_id ON alecia_bi.embeddings(deal_id);
CREATE INDEX idx_embeddings_created_at ON alecia_bi.embeddings(created_at);

-- ============================================================================
-- Research Feeds (Miniflux integration)
-- ============================================================================
CREATE TABLE alecia_bi.research_feeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    miniflux_feed_id INT UNIQUE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('M&A', 'Sector', 'Legal', 'Finance')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_research_feeds_category ON alecia_bi.research_feeds(category);
CREATE INDEX idx_research_feeds_is_active ON alecia_bi.research_feeds(is_active);

-- ============================================================================
-- Research Articles
-- ============================================================================
CREATE TABLE alecia_bi.research_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feed_id UUID NOT NULL REFERENCES alecia_bi.research_feeds(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    content TEXT,
    summary TEXT,
    relevance_score NUMERIC(4,2),
    deal_id UUID REFERENCES shared.deals(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_research_articles_feed_id ON alecia_bi.research_articles(feed_id);
CREATE INDEX idx_research_articles_deal_id ON alecia_bi.research_articles(deal_id);
CREATE INDEX idx_research_articles_is_read ON alecia_bi.research_articles(is_read);
CREATE INDEX idx_research_articles_published_at ON alecia_bi.research_articles(published_at);
CREATE INDEX idx_research_articles_created_at ON alecia_bi.research_articles(created_at);

-- ============================================================================
-- Research Tasks
-- ============================================================================
CREATE TABLE alecia_bi.research_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES shared.deals(id) ON DELETE CASCADE,
    assigned_to UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_research_tasks_deal_id ON alecia_bi.research_tasks(deal_id);
CREATE INDEX idx_research_tasks_assigned_to ON alecia_bi.research_tasks(assigned_to);
CREATE INDEX idx_research_tasks_status ON alecia_bi.research_tasks(status);
CREATE INDEX idx_research_tasks_due_date ON alecia_bi.research_tasks(due_date);
CREATE INDEX idx_research_tasks_created_at ON alecia_bi.research_tasks(created_at);

CREATE TRIGGER update_research_tasks_updated_at
    BEFORE UPDATE ON alecia_bi.research_tasks
    FOR EACH ROW
    EXECUTE FUNCTION shared.update_updated_at();

-- ============================================================================
-- Buyer Criteria
-- ============================================================================
CREATE TABLE alecia_bi.buyer_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES shared.deals(id) ON DELETE CASCADE,
    criteria_type TEXT NOT NULL CHECK (criteria_type IN ('sector', 'size', 'geography', 'strategic')),
    description TEXT NOT NULL,
    weight NUMERIC(4,2) CHECK (weight >= 0 AND weight <= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_buyer_criteria_deal_id ON alecia_bi.buyer_criteria(deal_id);
CREATE INDEX idx_buyer_criteria_type ON alecia_bi.buyer_criteria(criteria_type);
CREATE INDEX idx_buyer_criteria_created_at ON alecia_bi.buyer_criteria(created_at);

-- ============================================================================
-- Market Studies
-- ============================================================================
CREATE TABLE alecia_bi.market_studies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES shared.deals(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    sector TEXT NOT NULL,
    geography TEXT,
    data JSONB DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    created_by UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_market_studies_deal_id ON alecia_bi.market_studies(deal_id);
CREATE INDEX idx_market_studies_sector ON alecia_bi.market_studies(sector);
CREATE INDEX idx_market_studies_status ON alecia_bi.market_studies(status);
CREATE INDEX idx_market_studies_created_by ON alecia_bi.market_studies(created_by);
CREATE INDEX idx_market_studies_created_at ON alecia_bi.market_studies(created_at);

CREATE TRIGGER update_market_studies_updated_at
    BEFORE UPDATE ON alecia_bi.market_studies
    FOR EACH ROW
    EXECUTE FUNCTION shared.update_updated_at();

-- ============================================================================
-- Grant permissions
-- ============================================================================
GRANT USAGE ON SCHEMA alecia_bi TO alecia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA alecia_bi TO alecia_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA alecia_bi TO alecia_app;

-- ============================================================================
-- End of V002
-- ============================================================================
