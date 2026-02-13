-- ============================================================================
-- V003: Alecia Numbers Schema - M&A Financial Tools Tables
-- ============================================================================
-- Description: Creates alecia_numbers schema for financial models, valuations,
--              due diligence checklists, fee calculations, and deal timelines
-- Dependencies: V001 (shared schema)
-- Author: Alecia Suite
-- Date: 2026-02-08
-- ============================================================================

-- Create alecia_numbers schema
CREATE SCHEMA IF NOT EXISTS alecia_numbers;

-- ============================================================================
-- Financial Models
-- ============================================================================
CREATE TABLE alecia_numbers.financial_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES shared.deals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    model_type TEXT NOT NULL CHECK (model_type IN ('dcf', 'lbo', 'comparable')),
    assumptions JSONB DEFAULT '{}',
    results JSONB DEFAULT '{}',
    version INT NOT NULL DEFAULT 1,
    created_by UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_financial_models_deal_id ON alecia_numbers.financial_models(deal_id);
CREATE INDEX idx_financial_models_model_type ON alecia_numbers.financial_models(model_type);
CREATE INDEX idx_financial_models_created_by ON alecia_numbers.financial_models(created_by);
CREATE INDEX idx_financial_models_created_at ON alecia_numbers.financial_models(created_at);

CREATE TRIGGER update_financial_models_updated_at
    BEFORE UPDATE ON alecia_numbers.financial_models
    FOR EACH ROW
    EXECUTE FUNCTION shared.update_updated_at();

-- ============================================================================
-- Valuations
-- ============================================================================
CREATE TABLE alecia_numbers.valuations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES shared.deals(id) ON DELETE CASCADE,
    method TEXT NOT NULL CHECK (method IN ('multiples', 'dcf', 'asset_based', 'comparable')),
    enterprise_value NUMERIC(15,2),
    equity_value NUMERIC(15,2),
    parameters JSONB DEFAULT '{}',
    notes TEXT,
    created_by UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_valuations_deal_id ON alecia_numbers.valuations(deal_id);
CREATE INDEX idx_valuations_method ON alecia_numbers.valuations(method);
CREATE INDEX idx_valuations_created_by ON alecia_numbers.valuations(created_by);
CREATE INDEX idx_valuations_created_at ON alecia_numbers.valuations(created_at);

CREATE TRIGGER update_valuations_updated_at
    BEFORE UPDATE ON alecia_numbers.valuations
    FOR EACH ROW
    EXECUTE FUNCTION shared.update_updated_at();

-- ============================================================================
-- Comparables
-- ============================================================================
CREATE TABLE alecia_numbers.comparables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES shared.deals(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    siren CHAR(9),
    sector TEXT,
    revenue NUMERIC(15,2),
    ebitda NUMERIC(15,2),
    ev_ebitda NUMERIC(8,2),
    ev_revenue NUMERIC(8,2),
    source TEXT,
    data_year INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comparables_deal_id ON alecia_numbers.comparables(deal_id);
CREATE INDEX idx_comparables_sector ON alecia_numbers.comparables(sector);
CREATE INDEX idx_comparables_siren ON alecia_numbers.comparables(siren);
CREATE INDEX idx_comparables_created_at ON alecia_numbers.comparables(created_at);

-- ============================================================================
-- Due Diligence Checklists
-- ============================================================================
CREATE TABLE alecia_numbers.dd_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES shared.deals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('financial', 'legal', 'tax', 'commercial', 'social', 'IT', 'environmental')),
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    progress_pct INT DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
    assigned_to UUID REFERENCES shared.users(id) ON DELETE SET NULL,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dd_checklists_deal_id ON alecia_numbers.dd_checklists(deal_id);
CREATE INDEX idx_dd_checklists_category ON alecia_numbers.dd_checklists(category);
CREATE INDEX idx_dd_checklists_status ON alecia_numbers.dd_checklists(status);
CREATE INDEX idx_dd_checklists_assigned_to ON alecia_numbers.dd_checklists(assigned_to);
CREATE INDEX idx_dd_checklists_due_date ON alecia_numbers.dd_checklists(due_date);
CREATE INDEX idx_dd_checklists_created_at ON alecia_numbers.dd_checklists(created_at);

CREATE TRIGGER update_dd_checklists_updated_at
    BEFORE UPDATE ON alecia_numbers.dd_checklists
    FOR EACH ROW
    EXECUTE FUNCTION shared.update_updated_at();

-- ============================================================================
-- Due Diligence Checklist Items
-- ============================================================================
CREATE TABLE alecia_numbers.dd_checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id UUID NOT NULL REFERENCES alecia_numbers.dd_checklists(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    document_url TEXT,
    completed_by UUID REFERENCES shared.users(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    sort_order INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dd_checklist_items_checklist_id ON alecia_numbers.dd_checklist_items(checklist_id);
CREATE INDEX idx_dd_checklist_items_completed_by ON alecia_numbers.dd_checklist_items(completed_by);
CREATE INDEX idx_dd_checklist_items_is_completed ON alecia_numbers.dd_checklist_items(is_completed);
CREATE INDEX idx_dd_checklist_items_sort_order ON alecia_numbers.dd_checklist_items(sort_order);
CREATE INDEX idx_dd_checklist_items_created_at ON alecia_numbers.dd_checklist_items(created_at);

-- ============================================================================
-- Fee Calculations
-- ============================================================================
CREATE TABLE alecia_numbers.fee_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES shared.deals(id) ON DELETE CASCADE,
    mandate_type TEXT NOT NULL CHECK (mandate_type IN ('sell_side', 'buy_side', 'dual')),
    retainer_monthly NUMERIC(10,2),
    success_fee_pct NUMERIC(5,2),
    min_fee NUMERIC(10,2),
    deal_value NUMERIC(15,2),
    calculated_fee NUMERIC(10,2),
    notes TEXT,
    created_by UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fee_calculations_deal_id ON alecia_numbers.fee_calculations(deal_id);
CREATE INDEX idx_fee_calculations_mandate_type ON alecia_numbers.fee_calculations(mandate_type);
CREATE INDEX idx_fee_calculations_created_by ON alecia_numbers.fee_calculations(created_by);
CREATE INDEX idx_fee_calculations_created_at ON alecia_numbers.fee_calculations(created_at);

CREATE TRIGGER update_fee_calculations_updated_at
    BEFORE UPDATE ON alecia_numbers.fee_calculations
    FOR EACH ROW
    EXECUTE FUNCTION shared.update_updated_at();

-- ============================================================================
-- Timelines
-- ============================================================================
CREATE TABLE alecia_numbers.timelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES shared.deals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    milestones JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_timelines_deal_id ON alecia_numbers.timelines(deal_id);
CREATE INDEX idx_timelines_created_at ON alecia_numbers.timelines(created_at);

CREATE TRIGGER update_timelines_updated_at
    BEFORE UPDATE ON alecia_numbers.timelines
    FOR EACH ROW
    EXECUTE FUNCTION shared.update_updated_at();

-- ============================================================================
-- Teaser Tracking
-- ============================================================================
CREATE TABLE alecia_numbers.teaser_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES shared.deals(id) ON DELETE CASCADE,
    recipient_company TEXT NOT NULL,
    recipient_contact TEXT,
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    nda_signed_at TIMESTAMPTZ,
    im_sent_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'nda_signed', 'im_sent', 'declined')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_teaser_tracking_deal_id ON alecia_numbers.teaser_tracking(deal_id);
CREATE INDEX idx_teaser_tracking_status ON alecia_numbers.teaser_tracking(status);
CREATE INDEX idx_teaser_tracking_sent_at ON alecia_numbers.teaser_tracking(sent_at);
CREATE INDEX idx_teaser_tracking_created_at ON alecia_numbers.teaser_tracking(created_at);

-- ============================================================================
-- Post-Deal Integration
-- ============================================================================
CREATE TABLE alecia_numbers.post_deal_integration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES shared.deals(id) ON DELETE CASCADE,
    workstream TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
    tasks JSONB DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'completed')),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_post_deal_integration_deal_id ON alecia_numbers.post_deal_integration(deal_id);
CREATE INDEX idx_post_deal_integration_owner_id ON alecia_numbers.post_deal_integration(owner_id);
CREATE INDEX idx_post_deal_integration_status ON alecia_numbers.post_deal_integration(status);
CREATE INDEX idx_post_deal_integration_created_at ON alecia_numbers.post_deal_integration(created_at);

CREATE TRIGGER update_post_deal_integration_updated_at
    BEFORE UPDATE ON alecia_numbers.post_deal_integration
    FOR EACH ROW
    EXECUTE FUNCTION shared.update_updated_at();

-- ============================================================================
-- Pipeline Snapshots
-- ============================================================================
CREATE TABLE alecia_numbers.pipeline_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE NOT NULL,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pipeline_snapshots_snapshot_date ON alecia_numbers.pipeline_snapshots(snapshot_date);
CREATE INDEX idx_pipeline_snapshots_created_at ON alecia_numbers.pipeline_snapshots(created_at);

-- ============================================================================
-- Spreadsheets (FortuneSheet)
-- ============================================================================
CREATE TABLE alecia_numbers.spreadsheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES shared.deals(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    sheet_data JSONB DEFAULT '{}',
    owner_id UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
    is_template BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_spreadsheets_deal_id ON alecia_numbers.spreadsheets(deal_id);
CREATE INDEX idx_spreadsheets_owner_id ON alecia_numbers.spreadsheets(owner_id);
CREATE INDEX idx_spreadsheets_is_template ON alecia_numbers.spreadsheets(is_template);
CREATE INDEX idx_spreadsheets_created_at ON alecia_numbers.spreadsheets(created_at);

CREATE TRIGGER update_spreadsheets_updated_at
    BEFORE UPDATE ON alecia_numbers.spreadsheets
    FOR EACH ROW
    EXECUTE FUNCTION shared.update_updated_at();

-- ============================================================================
-- Grant permissions
-- ============================================================================
GRANT USAGE ON SCHEMA alecia_numbers TO alecia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA alecia_numbers TO alecia_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA alecia_numbers TO alecia_app;

-- ============================================================================
-- End of V003
-- ============================================================================
