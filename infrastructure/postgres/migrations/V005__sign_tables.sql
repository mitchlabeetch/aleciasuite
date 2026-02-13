-- ============================================================================
-- V005: Alecia Sign Schema - Data Room & E-Signature Tables
-- ============================================================================
-- Description: Creates alecia_sign schema for virtual data rooms, document
--              management, access logs, Q&A, invitations, and signing audit
-- Dependencies: V001 (shared schema)
-- Author: Alecia Suite
-- Date: 2026-02-08
-- ============================================================================

-- Create alecia_sign schema
CREATE SCHEMA IF NOT EXISTS alecia_sign;

-- ============================================================================
-- Deal Rooms (Virtual Data Rooms)
-- ============================================================================
CREATE TABLE alecia_sign.deal_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL UNIQUE REFERENCES shared.deals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    watermark_enabled BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deal_rooms_deal_id ON alecia_sign.deal_rooms(deal_id);
CREATE INDEX idx_deal_rooms_is_active ON alecia_sign.deal_rooms(is_active);
CREATE INDEX idx_deal_rooms_created_by ON alecia_sign.deal_rooms(created_by);
CREATE INDEX idx_deal_rooms_created_at ON alecia_sign.deal_rooms(created_at);

CREATE TRIGGER update_deal_rooms_updated_at
    BEFORE UPDATE ON alecia_sign.deal_rooms
    FOR EACH ROW
    EXECUTE FUNCTION shared.update_updated_at();

-- ============================================================================
-- Deal Room Folders
-- ============================================================================
CREATE TABLE alecia_sign.deal_room_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES alecia_sign.deal_rooms(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES alecia_sign.deal_room_folders(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sort_order INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deal_room_folders_room_id ON alecia_sign.deal_room_folders(room_id);
CREATE INDEX idx_deal_room_folders_parent_id ON alecia_sign.deal_room_folders(parent_id);
CREATE INDEX idx_deal_room_folders_sort_order ON alecia_sign.deal_room_folders(sort_order);
CREATE INDEX idx_deal_room_folders_created_at ON alecia_sign.deal_room_folders(created_at);

-- ============================================================================
-- Deal Room Documents
-- ============================================================================
CREATE TABLE alecia_sign.deal_room_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id UUID NOT NULL REFERENCES alecia_sign.deal_room_folders(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    mime_type TEXT,
    file_size BIGINT,
    minio_key TEXT NOT NULL,
    version INT DEFAULT 1,
    uploaded_by UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
    is_confidential BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deal_room_documents_folder_id ON alecia_sign.deal_room_documents(folder_id);
CREATE INDEX idx_deal_room_documents_uploaded_by ON alecia_sign.deal_room_documents(uploaded_by);
CREATE INDEX idx_deal_room_documents_is_confidential ON alecia_sign.deal_room_documents(is_confidential);
CREATE INDEX idx_deal_room_documents_minio_key ON alecia_sign.deal_room_documents(minio_key);
CREATE INDEX idx_deal_room_documents_created_at ON alecia_sign.deal_room_documents(created_at);

CREATE TRIGGER update_deal_room_documents_updated_at
    BEFORE UPDATE ON alecia_sign.deal_room_documents
    FOR EACH ROW
    EXECUTE FUNCTION shared.update_updated_at();

-- ============================================================================
-- Deal Room Access Log
-- ============================================================================
CREATE TABLE alecia_sign.deal_room_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES alecia_sign.deal_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES shared.users(id) ON DELETE SET NULL,
    document_id UUID REFERENCES alecia_sign.deal_room_documents(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('view', 'download', 'upload', 'delete')),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deal_room_access_log_room_id ON alecia_sign.deal_room_access_log(room_id);
CREATE INDEX idx_deal_room_access_log_user_id ON alecia_sign.deal_room_access_log(user_id);
CREATE INDEX idx_deal_room_access_log_document_id ON alecia_sign.deal_room_access_log(document_id);
CREATE INDEX idx_deal_room_access_log_action ON alecia_sign.deal_room_access_log(action);
CREATE INDEX idx_deal_room_access_log_created_at ON alecia_sign.deal_room_access_log(created_at);

-- ============================================================================
-- Deal Room Questions (Q&A system)
-- ============================================================================
CREATE TABLE alecia_sign.deal_room_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES alecia_sign.deal_rooms(id) ON DELETE CASCADE,
    document_id UUID REFERENCES alecia_sign.deal_room_documents(id) ON DELETE SET NULL,
    asked_by UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT,
    answered_by UUID REFERENCES shared.users(id) ON DELETE SET NULL,
    answered_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deal_room_questions_room_id ON alecia_sign.deal_room_questions(room_id);
CREATE INDEX idx_deal_room_questions_document_id ON alecia_sign.deal_room_questions(document_id);
CREATE INDEX idx_deal_room_questions_asked_by ON alecia_sign.deal_room_questions(asked_by);
CREATE INDEX idx_deal_room_questions_answered_by ON alecia_sign.deal_room_questions(answered_by);
CREATE INDEX idx_deal_room_questions_status ON alecia_sign.deal_room_questions(status);
CREATE INDEX idx_deal_room_questions_created_at ON alecia_sign.deal_room_questions(created_at);

-- ============================================================================
-- Deal Room Invitations
-- ============================================================================
CREATE TABLE alecia_sign.deal_room_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES alecia_sign.deal_rooms(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'contributor', 'admin')),
    token TEXT UNIQUE NOT NULL,
    invited_by UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
    accepted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deal_room_invitations_room_id ON alecia_sign.deal_room_invitations(room_id);
CREATE INDEX idx_deal_room_invitations_email ON alecia_sign.deal_room_invitations(email);
CREATE INDEX idx_deal_room_invitations_token ON alecia_sign.deal_room_invitations(token);
CREATE INDEX idx_deal_room_invitations_invited_by ON alecia_sign.deal_room_invitations(invited_by);
CREATE INDEX idx_deal_room_invitations_expires_at ON alecia_sign.deal_room_invitations(expires_at);
CREATE INDEX idx_deal_room_invitations_created_at ON alecia_sign.deal_room_invitations(created_at);

-- ============================================================================
-- Signing Audit Trail (DocuSeal integration)
-- ============================================================================
CREATE TABLE alecia_sign.signing_audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES shared.deals(id) ON DELETE CASCADE,
    document_id UUID REFERENCES alecia_sign.deal_room_documents(id) ON DELETE SET NULL,
    signer_email TEXT NOT NULL,
    signer_name TEXT,
    action TEXT NOT NULL CHECK (action IN ('sent', 'viewed', 'signed', 'declined', 'expired')),
    ip_address INET,
    signature_hash TEXT,
    signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_signing_audit_trail_deal_id ON alecia_sign.signing_audit_trail(deal_id);
CREATE INDEX idx_signing_audit_trail_document_id ON alecia_sign.signing_audit_trail(document_id);
CREATE INDEX idx_signing_audit_trail_signer_email ON alecia_sign.signing_audit_trail(signer_email);
CREATE INDEX idx_signing_audit_trail_action ON alecia_sign.signing_audit_trail(action);
CREATE INDEX idx_signing_audit_trail_signed_at ON alecia_sign.signing_audit_trail(signed_at);
CREATE INDEX idx_signing_audit_trail_created_at ON alecia_sign.signing_audit_trail(created_at);

-- ============================================================================
-- Grant permissions
-- ============================================================================
GRANT USAGE ON SCHEMA alecia_sign TO alecia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA alecia_sign TO alecia_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA alecia_sign TO alecia_app;

-- ============================================================================
-- End of V005
-- ============================================================================
