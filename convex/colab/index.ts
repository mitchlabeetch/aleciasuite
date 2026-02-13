/**
 * Colab Module Index
 *
 * Re-exports all Colab-specific Convex functions.
 * Part of the unified Convex backend (Phase 2 migration).
 *
 * Usage in apps:
 * - api.colab.documents.list
 * - api.colab.boards.createBoard
 * - etc.
 */

// Note: Convex doesn't use index re-exports in the traditional sense.
// Each file is automatically registered based on file name.
// This file serves as documentation of available modules.

/**
 * Available Colab Modules:
 *
 * - colab/boards.ts       - Kanban boards, lists, cards, labels, checklists
 * - colab/documents.ts    - Notion-like documents
 * - colab/documentVersions.ts - Document version history
 * - colab/files.ts        - File storage
 * - colab/presence.ts     - Real-time presence tracking
 * - colab/presentations.ts - AI-powered presentations
 * - colab/propertyDefinitions.ts - Custom property schemas
 *
 * API Access Pattern:
 * ```typescript
 * import { api } from "../convex/_generated/api";
 *
 * // Documents
 * const docs = useQuery(api.colab.documents.list);
 * const createDoc = useMutation(api.colab.documents.create);
 *
 * // Boards
 * const boards = useQuery(api.colab.boards.listBoards, { userId });
 * const createBoard = useMutation(api.colab.boards.createBoard);
 *
 * // Presence
 * const activeUsers = useQuery(api.colab.presence.getActiveUsers, { resourceType: "document", resourceId });
 * ```
 */

export const COLAB_VERSION = "2.0.0";
export const MIGRATION_DATE = "2026-01-22";
