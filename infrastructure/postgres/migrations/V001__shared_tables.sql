-- infrastructure/postgres/migrations/V001__shared_tables.sql
-- Shared schema: cross-tool entities referenced by all services

-- Custom types
CREATE TYPE shared.deal_stage AS ENUM (
    'sourcing', 'qualification', 'initial_meeting', 'analysis',
    'valuation', 'due_diligence', 'negotiation', 'closing',
    'closed_won', 'closed_lost'
);

CREATE TYPE shared.deal_priority AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TYPE shared.user_role AS ENUM ('sudo', 'partner', 'advisor', 'user');

-- Users table (synced from Keycloak)
CREATE TABLE shared.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keycloak_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role shared.user_role NOT NULL DEFAULT 'user',
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companies table (CRM, Pappers-enriched)
CREATE TABLE shared.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    siren CHAR(9),
    siret CHAR(14),
    naf_code TEXT,
    vat_number TEXT,
    website TEXT,
    logo_url TEXT,
    address JSONB, -- {street, city, zip, country, lat, lng}
    financials JSONB, -- {revenue, ebitda, netDebt, employees, year, currency}
    pappers_data JSONB, -- Full Pappers enrichment cache
    pipedrive_id TEXT,
    source TEXT DEFAULT 'manual',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_companies_siren ON shared.companies(siren);
CREATE INDEX idx_companies_name_trgm ON shared.companies USING gin(name gin_trgm_ops);

-- Contacts table
CREATE TABLE shared.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES shared.companies(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT,
    tags TEXT[] DEFAULT '{}',
    external_id TEXT,
    source TEXT DEFAULT 'manual',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_contacts_company ON shared.contacts(company_id);
CREATE INDEX idx_contacts_email ON shared.contacts(email);

-- Deals table (M&A pipeline)
CREATE TABLE shared.deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    stage shared.deal_stage NOT NULL DEFAULT 'sourcing',
    amount NUMERIC(15,2),
    currency TEXT DEFAULT 'EUR',
    probability INTEGER CHECK (probability BETWEEN 0 AND 100),
    owner_id UUID REFERENCES shared.users(id) ON DELETE SET NULL,
    company_id UUID REFERENCES shared.companies(id) ON DELETE SET NULL,
    priority shared.deal_priority DEFAULT 'medium',
    tags TEXT[] DEFAULT '{}',
    expected_close_date TIMESTAMPTZ,
    source TEXT DEFAULT 'manual',
    pipedrive_id BIGINT,
    external_id TEXT,
    is_archived BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_deals_stage ON shared.deals(stage);
CREATE INDEX idx_deals_owner ON shared.deals(owner_id);
CREATE INDEX idx_deals_company ON shared.deals(company_id);
CREATE INDEX idx_deals_created ON shared.deals(created_at DESC);

-- Deal stage history
CREATE TABLE shared.deal_stage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES shared.deals(id) ON DELETE CASCADE,
    from_stage shared.deal_stage,
    to_stage shared.deal_stage NOT NULL,
    changed_by UUID REFERENCES shared.users(id),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_deal_history_deal ON shared.deal_stage_history(deal_id);

-- Cross-service audit log
CREATE TABLE shared.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES shared.users(id),
    service TEXT NOT NULL, -- 'bi', 'numbers', 'sign', 'colab', 'flows'
    action TEXT NOT NULL, -- 'create', 'update', 'delete', 'view', 'sign'
    entity_type TEXT NOT NULL, -- 'deal', 'company', 'document'
    entity_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_user ON shared.audit_log(user_id);
CREATE INDEX idx_audit_entity ON shared.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_created ON shared.audit_log(created_at DESC);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION shared.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON shared.users
    FOR EACH ROW EXECUTE FUNCTION shared.update_updated_at();
CREATE TRIGGER trg_companies_updated_at BEFORE UPDATE ON shared.companies
    FOR EACH ROW EXECUTE FUNCTION shared.update_updated_at();
CREATE TRIGGER trg_contacts_updated_at BEFORE UPDATE ON shared.contacts
    FOR EACH ROW EXECUTE FUNCTION shared.update_updated_at();
CREATE TRIGGER trg_deals_updated_at BEFORE UPDATE ON shared.deals
    FOR EACH ROW EXECUTE FUNCTION shared.update_updated_at();
