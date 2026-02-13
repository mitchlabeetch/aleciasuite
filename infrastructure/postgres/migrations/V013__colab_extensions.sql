-- ============================================================================
-- V013: Alecia Colab Schema Extensions - Files, Property Definitions, Yjs
-- ============================================================================
-- Description: Extends alecia_colab schema with file management, custom
--              property definitions, and Yjs incremental updates/awareness
-- Dependencies: V004 (colab schema)
-- Author: Alecia Suite
-- Date: 2026-02-08
-- ============================================================================

-- ============================================================================
-- Files (Minio-backed file storage)
-- ============================================================================
CREATE TABLE alecia_colab.files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES alecia_colab.documents(id) ON DELETE SET NULL,
    board_id UUID REFERENCES alecia_colab.boards(id) ON DELETE SET NULL,
    owner_id UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    mime_type TEXT,
    file_size BIGINT,
    minio_key TEXT NOT NULL UNIQUE,
    thumbnail_url TEXT,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_files_document_id ON alecia_colab.files(document_id);
CREATE INDEX idx_files_board_id ON alecia_colab.files(board_id);
CREATE INDEX idx_files_owner_id ON alecia_colab.files(owner_id);
CREATE INDEX idx_files_minio_key ON alecia_colab.files(minio_key);
CREATE INDEX idx_files_created_at ON alecia_colab.files(created_at);

CREATE TRIGGER update_files_updated_at
    BEFORE UPDATE ON alecia_colab.files
    FOR EACH ROW
    EXECUTE FUNCTION shared.update_updated_at();

-- ============================================================================
-- Property Definitions (Notion-style custom properties)
-- ============================================================================
CREATE TABLE alecia_colab.property_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES alecia_colab.boards(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    property_type TEXT NOT NULL CHECK (property_type IN (
        'text', 'number', 'select', 'multi_select', 'date',
        'checkbox', 'url', 'email', 'person'
    )),
    options JSONB DEFAULT '[]',
    default_value TEXT,
    is_required BOOLEAN DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_property_definitions_board_id ON alecia_colab.property_definitions(board_id);
CREATE INDEX idx_property_definitions_property_type ON alecia_colab.property_definitions(property_type);

CREATE TRIGGER update_property_definitions_updated_at
    BEFORE UPDATE ON alecia_colab.property_definitions
    FOR EACH ROW
    EXECUTE FUNCTION shared.update_updated_at();

-- ============================================================================
-- Yjs Updates (incremental Yjs updates for Hocuspocus)
-- ============================================================================
CREATE TABLE alecia_colab.yjs_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_name TEXT NOT NULL,
    update_data BYTEA NOT NULL,
    client_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_yjs_updates_document_created ON alecia_colab.yjs_updates(document_name, created_at);

-- ============================================================================
-- Yjs Awareness (real-time cursor/selection awareness)
-- ============================================================================
CREATE TABLE alecia_colab.yjs_awareness (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_name TEXT NOT NULL,
    client_id TEXT NOT NULL,
    user_id UUID REFERENCES shared.users(id) ON DELETE SET NULL,
    awareness_data JSONB NOT NULL DEFAULT '{}',
    last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_yjs_awareness_unique ON alecia_colab.yjs_awareness(document_name, client_id);
CREATE INDEX idx_yjs_awareness_document_name ON alecia_colab.yjs_awareness(document_name);
CREATE INDEX idx_yjs_awareness_last_seen_at ON alecia_colab.yjs_awareness(last_seen_at);

-- ============================================================================
-- Grant permissions
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA alecia_colab TO alecia_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA alecia_colab TO alecia_app;

-- ============================================================================
-- End of V013
-- ============================================================================
