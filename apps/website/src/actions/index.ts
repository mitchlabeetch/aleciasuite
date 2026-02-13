/**
 * Server Actions Index
 *
 * Central export point for all Next.js Server Actions
 * Replaces Convex queries/mutations with PostgreSQL + Drizzle
 *
 * Usage in Client Components:
 *   import { getDeals, createDeal } from "@/actions"
 *   const deals = await getDeals({ stage: "valuation" })
 *
 * For namespaced modules (to avoid name collisions):
 *   import { colab, integrations, forum } from "@/actions"
 *   const boards = await colab.listBoards()
 *
 * Or import directly from the specific module:
 *   import { listBoards } from "@/actions/colab/boards"
 */

// ============================================
// DEALS
// ============================================

export {
  getDeals,
  getDealById,
  createDeal,
  updateDeal,
  updateDealStage,
  archiveDeal,
  restoreDeal,
  getPipelineStats,
  getDealStageHistory,
  type DealStage,
  type DealPriority,
  type CreateDealInput,
  type DealFilters,
  type PipelineStats,
} from "./deals";

// ============================================
// COMPANIES
// ============================================

export {
  getCompanies,
  getCompanyById,
  getCompanyBySiren,
  createCompany,
  updateCompany,
  deleteCompany,
  enrichCompany,
  searchCompanies,
  getCompaniesForUser,
  type CreateCompanyInput,
  type CompanyFilters,
} from "./companies";

// ============================================
// CONTACTS
// ============================================

export {
  getContacts,
  getContactById,
  getContactByEmail,
  getContactByExternalId,
  createContact,
  updateContact,
  deleteContact,
  searchContacts,
  getContactsForCompany,
  bulkCreateContacts,
  type CreateContactInput,
  type ContactFilters,
} from "./contacts";

// ============================================
// USERS & TEAM
// ============================================

export {
  ensureUser,
  getCurrentUser,
  getAllUsers,
  getUserById,
  getUserByAuthProviderId,
  type UserProfile,
  type EnsureUserResult,
} from "./users";

export {
  listTeamMembers,
  getTeamMemberById,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  toggleTeamMemberActive,
  reorderTeamMembers,
  syncTeamMemberPhotos,
  type TeamMember,
  type CreateTeamMemberInput,
  type UpdateTeamMemberInput,
} from "./team";

// ============================================
// USER PREFERENCES
// ============================================

export {
  getUserPreferences,
  getPreferenceValue,
  upsertUserPreferences,
  updatePreferenceValue,
  updateLastActive,
  togglePreference,
  togglePinnedDeal,
  resetUserPreferences,
  type NotificationSettings,
  type UserPreferences,
  type UpsertPreferencesInput,
} from "./user-preferences";

// ============================================
// TRANSACTIONS (Marketing site)
// ============================================

export {
  listTransactions,
  getTransactionById,
  getTransactionByDeal,
  createTransaction,
  updateTransaction,
  removeTransaction,
  reorderTransactions,
  duplicateTransaction,
  type CreateTransactionInput,
  type UpdateTransactionInput,
} from "./transactions";

// ============================================
// APPROVALS
// ============================================

export {
  getApprovalRequest,
  listPendingForUser,
  listMyRequests,
  listByDeal,
  listByEntity,
  getTemplates,
  getDefaultTemplate,
  createApprovalRequest,
  createFromTemplate,
  submitReview,
  cancelRequest,
  updateRequest,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getExpiredRequests,
  markExpired,
  getPendingCountForUser,
  type EntityType,
  type Priority,
  type ApprovalType,
  type ApprovalStatus,
  type ReviewDecision,
  type CreateApprovalRequestInput,
  type CreateFromTemplateInput,
  type SubmitReviewInput,
  type UpdateRequestInput,
  type CreateTemplateInput,
  type UpdateTemplateInput,
} from "./approvals";

// ============================================
// M&A NUMBERS & FINANCIAL TOOLS (core)
// ============================================

export {
  getValuations,
  createValuation,
  updateValuation,
  getComparables,
  createComparable,
  bulkCreateComparables,
  getDDChecklist,
  createDDChecklist,
  getDDChecklistItems,
  createDDChecklistItem,
  toggleDDChecklistItem,
  getFeeCalculation,
  saveFeeCalculation,
  type CreateValuationInput,
  type CreateComparableInput,
  type CreateDDChecklistInput,
  type CreateDDChecklistItemInput,
  type CreateFeeCalculationInput,
} from "./numbers";

// ============================================
// DATA ROOMS (authenticated)
// ============================================

export {
  getDealRoom,
  createDealRoom,
  updateDealRoom,
  getFolders,
  createFolder,
  getDocuments,
  uploadDocument,
  deleteDocument,
  logAccess,
  getAccessLog,
  getQuestions,
  createQuestion,
  answerQuestion,
  inviteToRoom,
  getRoomInvitations,
  type CreateDealRoomInput,
  type CreateFolderInput,
  type UploadDocumentInput,
  type CreateQuestionInput,
  type AnswerQuestionInput,
  type InviteToRoomInput,
} from "./data-rooms";

// ============================================
// SIGNING (DocuSeal e-signatures)
// ============================================

export {
  getSignRequests,
  getSignRequestsBySigner,
  createSignRequest,
  recordSignatureEvent,
  getSignatureAuditTrail,
  getDocumentSignatureTrail,
  handleDocuSealWebhook,
  getSignatureStats,
  getDealSigners,
  type CreateSignRequestInput,
  type RecordSignatureInput,
} from "./signing";

// ============================================
// DD CHECKLISTS & TEMPLATES
// ============================================

export {
  listChecklists,
  getChecklist,
  createChecklist,
  updateChecklist,
  deleteChecklist,
  recalculateProgress,
  listItems,
  getItem,
  addItem,
  updateItem,
  deleteItem,
  bulkUpdateStatus,
  getChecklistStats,
  getOverdueChecklists,
  getDealChecklistSummary,
  getItemsByAssignee,
  type CreateChecklistInput,
  type UpdateChecklistInput,
  type CreateChecklistItemInput,
  type UpdateChecklistItemInput,
} from "./dd-checklists";

export {
  listTemplates,
  getTemplate,
  createChecklistFromTemplate,
  createStandardDDPackage,
  findTemplateByName,
  getTemplateStats,
  type DDTemplateItem,
  type DDTemplate,
} from "./dd-templates";

// ============================================
// CALENDAR
// ============================================

export {
  getEvents,
  getEvent,
  getEventsForDeal,
  getUpcomingEvents,
  getSyncState,
  getAllSyncStates,
  createEvent,
  updateEvent,
  deleteEvent,
  linkEventToDeal,
  toggleSync,
} from "./calendar";

// ============================================
// MARKETING (public website data)
// ============================================

export {
  getTransactions as getMarketingTransactions,
  getTransactionBySlug,
  getTransactionFilters,
  getTeamMembers,
  getTeamMemberBySlug,
  getForumCategories,
  getConfig,
  getAllConfig,
  getMarketingKPIs,
  getAllMarketingKPIs,
  upsertMarketingKPI,
  deleteMarketingKPI,
  getLocationImages,
  upsertLocationImage,
} from "./marketing";

// ============================================
// CMS (content management)
// ============================================

export {
  getPage,
  getProposals,
  getProposalById,
  updatePage,
  createProposal,
  voteOnProposal,
  mergeProposal,
} from "./cms";

// ============================================
// COMMENTS
// ============================================

export {
  getComments,
  getCommentCount,
  addComment,
  editComment,
  deleteComment,
} from "./comments";

// ============================================
// CAREERS
// ============================================

export {
  listJobOffers,
  getJobOfferById,
  getJobOfferBySlug,
  createJobOffer,
  updateJobOffer,
  deleteJobOffer,
  toggleJobOfferPublished,
} from "./careers";

// ============================================
// VISUAL EDITOR
// ============================================

export {
  getEditablePages,
  getPageContent,
  getPublishedPageContent,
  getPendingChanges,
  getPageVersions,
  initializePage,
  submitChanges,
  reviewChange,
  publishChanges,
  rollbackToVersion,
  updatePageSections,
  deletePendingChange,
} from "./visual-editor";

// ============================================
// THEME
// ============================================

export {
  getThemeSettings,
  updateThemeSettings,
  resetThemeSettings,
} from "./theme";

// ============================================
// ANALYTICS & DASHBOARD
// ============================================

export {
  ingestEvent,
  ingestBatch,
  getSummary,
  getCache,
  setCache,
  cleanupOldEvents,
  cleanupExpiredCache,
  getDashboardStats,
  getUnifiedActivityFeed,
} from "./analytics";

// ============================================
// SEARCH
// ============================================

export {
  globalSearch,
  quickSearch,
  getRecentItems,
  type SearchResultType,
  type SearchResult,
} from "./search";

// ============================================
// NOTIFICATIONS
// ============================================

export {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  // Note: `notify` is an internal helper — import directly from "./notifications"
} from "./notifications";

// ============================================
// DIGEST (email summaries)
// ============================================

export {
  getDigestPreferences,
  getActivitySummary,
  updateDigestPreferences,
  sendTestDigest,
  generateDigestHtml,
} from "./digest";

// ============================================
// UNSUBSCRIBE (GDPR-compliant)
// ============================================

export {
  handleUnsubscribe,
  disableEmailNotifications,
  resubscribe,
  enableEmailNotifications,
  checkUnsubscribeStatus,
} from "./unsubscribe";

// ============================================
// RESEARCH TASKS
// ============================================

export {
  getTasks,
  getMyTasks,
  getTaskStats,
  createTask,
  updateTask,
  deleteTask,
  moveTask,
  type CreateTaskInput,
} from "./research";

// ============================================
// FEATURE FLAGS
// ============================================

export {
  listFlags,
  getFlagByKey,
  isFlagEnabled,
  getEnabledFlags,
  createFlag,
  updateFlag,
  toggleFlag,
  removeFlag,
  updatePercentage,
  addUserToFlag,
  removeUserFromFlag,
} from "./feature-flags";

// ============================================
// AI, INTELLIGENCE & FINANCE
// ============================================

export {
  generateSummary,
  generateDiffSummary,
  generateDealEmbedding,
  explainMatch,
  scoreDealRisk,
  summarizeDocument,
  generateTeaser,
  suggestValuation,
  extractKeyTerms,
  translateDocument,
  searchCompanyPappers,
  getCompanyBySirenPappers,
  calculateValuation,
  calculateMultiples,
  calculateDCF,
  parseFinancialUpload,
} from "./ai";

// ============================================
// NAMESPACED EXPORTS
// Modules with conflicting function names or
// reserved identifiers — use as:
//   import { colab, forum, pipeline } from "@/actions"
//   await colab.listBoards()
//   await forum.getThreads()
// ============================================

/** Collaboration: boards, documents, versions, presentations, files, presence, Yjs */
export * as colab from "./colab";

/** Third-party integrations: Microsoft, Google, Pipedrive, Slack */
export * as integrations from "./integrations";

/** Extended Numbers tools: dashboard, spreadsheets, financial models, timelines, teaser tracking, post-deal */
export * as numbersTools from "./numbers/index";

/** Blog posts — namespaced to avoid conflict with forum.getPosts */
export * as blog from "./blog";

/** Forum threads & posts — namespaced to avoid conflict with blog.getPosts */
export * as forum from "./forum";

/** Global presence tracking — namespaced to avoid conflict with pipeline.getActiveUsers */
export * as presence from "./presence";

/** Pipeline events & kanban — namespaced to avoid conflict with calendar.getEvents */
export * as pipeline from "./pipeline";

/** File storage (S3/Minio + logos) — namespaced to avoid conflict with colab.files */
export * as files from "./files";

/** Analytics namespace - advanced analytics functions */
export * as analyticsActions from "./analytics";

/** Data rooms public access (unauthenticated) */
export * as dataRoomsPublic from "./data-rooms-public";

/** Data export (JSON/CSV) — "export" is a reserved word */
export * as dataExport from "./export";

/** Data import (bulk upsert) — "import" is a reserved word */
export * as dataImport from "./import";
