/**
 * Colab Server Actions - Centralized Exports
 * Note: "use server" is in each sub-module, not here (barrel re-exports can't use it)
 *
 * All collaboration-related server actions for:
 * - Boards (Kanban)
 * - Documents (TipTap/Novel)
 * - Document Versions
 * - Presentations
 * - Files
 * - Presence
 * - Property Definitions
 * - Yjs (CRDT sync)
 */

// Boards
export {
  createBoard,
  getBoard,
  listBoards,
  deleteBoard,
  createList,
  reorderList,
  updateList,
  deleteList,
  createCard,
  moveCard,
  getCard,
  updateCard,
  deleteCard,
  getLabels,
  addLabel,
  getChecklists,
  addChecklist,
  deleteChecklist,
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
} from "./boards";

// Documents
export {
  listDocuments,
  getDocument,
  getDocumentsByDeal,
  createDocument,
  updateDocument,
  archiveDocument,
  deleteDocument,
} from "./documents";

// Document Versions
export {
  saveVersion,
  listVersions,
  getVersion,
  restoreVersion,
  getVersionCount,
} from "./document-versions";

// Presentations
export {
  listPresentations,
  getPresentation,
  createPresentation,
  updatePresentation,
  deletePresentation,
} from "./presentations";

// Files
export {
  generateUploadUrl,
  saveFile,
  listFiles,
  getFileUrl,
  deleteFile,
} from "./files";

// Presence
export {
  heartbeat,
  getActiveUsers,
  leaveDocument,
  cleanupStalePresence,
} from "./presence";

// Property Definitions
export {
  createProperty,
  listProperties,
  updateProperty,
  deleteProperty,
  reorderProperties,
  addPropertyOption,
} from "./property-definitions";

// Yjs
export {
  getYjsState,
  saveYjsState,
  deleteYjsState,
  listYjsDocuments,
  getYjsUpdates,
  pushYjsUpdate,
  getYjsAwareness,
  updateYjsAwareness,
  removeYjsAwareness,
} from "./yjs";
