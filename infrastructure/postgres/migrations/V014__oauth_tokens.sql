-- OAuth tokens for third-party integrations (Pipedrive, etc.)
CREATE TABLE IF NOT EXISTS shared.oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL UNIQUE, -- 'pipedrive', 'microsoft', 'google'
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  api_domain TEXT, -- Pipedrive-specific: company domain
  scopes TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_provider ON shared.oauth_tokens(provider);

-- Grant permissions to alecia_app user
GRANT SELECT, INSERT, UPDATE, DELETE ON shared.oauth_tokens TO alecia_app;
