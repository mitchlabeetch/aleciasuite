-- ============================================================================
-- V004: Alecia Colab Schema - Collaboration & Document Management Tables
-- ============================================================================
-- Description: Creates alecia_colab schema for TipTap documents, Kanban boards,
--              Yjs state, presentations, comments, and presence tracking
-- Dependencies: V001 (shared schema)
-- Author: Alecia Suite
-- Date: 2026-02-08
-- ============================================================================

-- Create alecia_colab schema
CREATE SCHEMA IF NOT EXISTS alecia_colab;

-- ============================================================================
-- Documents (TipTap/Novel editor)
-- ============================================================================
CREATE TABLE alecia_colab.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content JSONB DEFAULT '{}',
    parent_id UUID REFERENCES alecia_colab.documents(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES shared.deals(id) ON DELETE SET NULL,
    icon TEXT,
    cover_image_url TEXT,
    is_template BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_parent_id ON alecia_colab.documents(parent_id);
CREATE INDEX idx_documents_owner_id ON alecia_colab.documents(owner_id);
CREATE INDEX idx_documents_deal_id ON alecia_colab.documents(deal_id);
CREATE INDEX idx_documents_is_template ON alecia_colab.documents(is_template);
CREATE INDEX idx_documents_is_archived ON alecia_colab.documents(is_archived);
CREATE INDEX idx_documents_created_at ON alecia_colab.documents(created_at);

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON alecia_colab.documents
    FOR EACH ROW
    EXECUTE FUNCTION shared.update_updated_at();

-- ============================================================================
-- Document Versions (version history)
-- ============================================================================
CREATE TABLE alecia_colab.document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES alecia_colab.documents(id) ON DELETE CASCADE,
    version INT NOT NULL,
    content JSONB DEFAULT '{}',
    edited_by UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_document_versions_document_id ON alecia_colab.document_versions(document_id);
CREATE INDEX idx_document_versions_edited_by ON alecia_colab.document_versions(edited_by);
CREATE INDEX idx_document_versions_created_at ON alecia_colab.document_versions(created_at);
CREATE UNIQUE INDEX idx_document_versions_unique ON alecia_colab.document_versions(document_id, version);

-- ============================================================================
-- Boards (Kanban/Plane-style boards)
-- ============================================================================
CREATE TABLE alecia_colab.boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    deal_id UUID REFERENCES shared.deals(id) ON DELETE SET NULL,
    owner_id UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
    is_template BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_boards_deal_id ON alecia_colab.boards(deal_id);
CREATE INDEX idx_boards_owner_id ON alecia_colab.boards(owner_id);
CREATE INDEX idx_boards_is_template ON alecia_colab.boards(is_template);
CREATE INDEX idx_boards_created_at ON alecia_colab.boards(created_at);

CREATE TRIGGER update_boards_updated_at
    BEFORE UPDATE ON alecia_colab.boards
    FOR EACH ROW
    EXECUTE FUNCTION shared.update_updated_at();

-- ============================================================================
-- Lists (Board columns)
-- ============================================================================
CREATE TABLE alecia_colab.lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES alecia_colab.boards(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    sort_order INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lists_board_id ON alecia_colab.lists(board_id);
CREATE INDEX idx_lists_sort_order ON alecia_colab.lists(sort_order);
CREATE INDEX idx_lists_created_at ON alecia_colab.lists(created_at);

-- ============================================================================
-- Cards (Board tasks/items)
-- ============================================================================
CREATE TABLE alecia_colab.cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES alecia_colab.lists(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    assignee_id UUID REFERENCES shared.users(id) ON DELETE SET NULL,
    due_date TIMESTAMPTZ,
    labels JSONB DEFAULT '[]',
    attachments JSONB DEFAULT '[]',
    sort_order INT NOT NULL,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cards_list_id ON alecia_colab.cards(list_id);
CREATE INDEX idx_cards_assignee_id ON alecia_colab.cards(assignee_id);
CREATE INDEX idx_cards_due_date ON alecia_colab.cards(due_date);
CREATE INDEX idx_cards_sort_order ON alecia_colab.cards(sort_order);
CREATE INDEX idx_cards_is_archived ON alecia_colab.cards(is_archived);
CREATE INDEX idx_cards_created_at ON alecia_colab.cards(created_at);

CREATE TRIGGER update_cards_updated_at
    BEFORE UPDATE ON alecia_colab.cards
    FOR EACH ROW
    EXECUTE FUNCTION shared.update_updated_at();

-- ============================================================================
-- Labels (Board labels)
-- ============================================================================
CREATE TABLE alecia_colab.labels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES alecia_colab.boards(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_labels_board_id ON alecia_colab.labels(board_id);
CREATE INDEX idx_labels_created_at ON alecia_colab.labels(created_at);

-- ============================================================================
-- Checklists (Card checklists)
-- ============================================================================
CREATE TABLE alecia_colab.checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES alecia_colab.cards(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    sort_order INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_checklists_card_id ON alecia_colab.checklists(card_id);
CREATE INDEX idx_checklists_sort_order ON alecia_colab.checklists(sort_order);
CREATE INDEX idx_checklists_created_at ON alecia_colab.checklists(created_at);

-- ============================================================================
-- Checklist Items
-- ============================================================================
CREATE TABLE alecia_colab.checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id UUID NOT NULL REFERENCES alecia_colab.checklists(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    sort_order INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_checklist_items_checklist_id ON alecia_colab.checklist_items(checklist_id);
CREATE INDEX idx_checklist_items_is_completed ON alecia_colab.checklist_items(is_completed);
CREATE INDEX idx_checklist_items_sort_order ON alecia_colab.checklist_items(sort_order);
CREATE INDEX idx_checklist_items_created_at ON alecia_colab.checklist_items(created_at);

-- ============================================================================
-- Yjs State (Hocuspocus real-time sync)
-- ============================================================================
CREATE TABLE alecia_colab.yjs_state (
    document_name TEXT PRIMARY KEY,
    state BYTEA NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_yjs_state_updated_at ON alecia_colab.yjs_state(updated_at);

-- ============================================================================
-- Presentations (slide decks)
-- ============================================================================
CREATE TABLE alecia_colab.presentations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slides JSONB DEFAULT '[]',
    deal_id UUID REFERENCES shared.deals(id) ON DELETE SET NULL,
    owner_id UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_presentations_deal_id ON alecia_colab.presentations(deal_id);
CREATE INDEX idx_presentations_owner_id ON alecia_colab.presentations(owner_id);
CREATE INDEX idx_presentations_created_at ON alecia_colab.presentations(created_at);

CREATE TRIGGER update_presentations_updated_at
    BEFORE UPDATE ON alecia_colab.presentations
    FOR EACH ROW
    EXECUTE FUNCTION shared.update_updated_at();

-- ============================================================================
-- Comments (universal commenting system)
-- ============================================================================
CREATE TABLE alecia_colab.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('document', 'card', 'board')),
    entity_id UUID NOT NULL,
    author_id UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    mentions UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_entity ON alecia_colab.comments(entity_type, entity_id);
CREATE INDEX idx_comments_author_id ON alecia_colab.comments(author_id);
CREATE INDEX idx_comments_created_at ON alecia_colab.comments(created_at);

CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON alecia_colab.comments
    FOR EACH ROW
    EXECUTE FUNCTION shared.update_updated_at();

-- ============================================================================
-- Presence (real-time user presence)
-- ============================================================================
CREATE TABLE alecia_colab.presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
    document_name TEXT NOT NULL,
    cursor_position JSONB DEFAULT '{}',
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_presence_user_id ON alecia_colab.presence(user_id);
CREATE INDEX idx_presence_document_name ON alecia_colab.presence(document_name);
CREATE INDEX idx_presence_last_seen_at ON alecia_colab.presence(last_seen_at);
CREATE UNIQUE INDEX idx_presence_unique ON alecia_colab.presence(user_id, document_name);

-- ============================================================================
-- Grant permissions
-- ============================================================================
GRANT USAGE ON SCHEMA alecia_colab TO alecia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA alecia_colab TO alecia_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA alecia_colab TO alecia_app;

-- ============================================================================
-- End of V004
-- ============================================================================
