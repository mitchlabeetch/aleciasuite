/**
 * Numbers Module - Server Actions Index
 *
 * Central export point for all Numbers-related server actions
 * Includes M&A financial tools, spreadsheets, models, timelines, tracking
 */

// Dashboard & Activity
export {
  getDealsForNumbers,
  getDealById,
  getDealNumbersData,
  getRecentActivity,
  getToolStats,
  type DealSummary,
  type DealNumbersData,
  type ActivityItem,
} from "./dashboard";

// Spreadsheets
export {
  saveSpreadsheet,
  getUserSpreadsheets,
  getSpreadsheet,
  getDealSpreadsheets,
  deleteSpreadsheet,
  getSpreadsheetTemplates,
  type SaveSpreadsheetInput,
} from "./spreadsheets";

// Financial Models
export {
  saveFinancialModel,
  getUserFinancialModels,
  getFinancialModel,
  getDealFinancialModels,
  deleteFinancialModel,
  duplicateFinancialModel,
  type SaveFinancialModelInput,
} from "./financial-models";

// Timelines
export {
  saveTimeline,
  getUserTimelines,
  getTimeline,
  getDealTimelines,
  deleteTimeline,
  updateMilestone,
  addMilestone,
  removeMilestone,
  type Milestone,
  type SaveTimelineInput,
} from "./timelines";

// Teaser Tracking
export {
  createTeaserTracking,
  updateTeaserTracking,
  getDealTeaserTracking,
  getAllTeaserTracking,
  getTeaserTracking,
  deleteTeaserTracking,
  markTeaserOpened,
  markNdaSigned,
  markImSent,
  bulkCreateTeaserTracking,
  type CreateTeaserTrackingInput,
  type UpdateTeaserTrackingInput,
} from "./teaser-tracking";

// Post-Deal Integration
export {
  savePostDealIntegration,
  getAllPostDealIntegration,
  getPostDealIntegration,
  getDealPostDealIntegration,
  deletePostDealIntegration,
  updateIntegrationTask,
  addIntegrationTask,
  removeIntegrationTask,
  updatePostDealStatus,
  type IntegrationTask,
  type SavePostDealInput,
} from "./post-deal";

// Comparable Companies Analysis
export {
  createComparableAnalysis,
  getUserComparables,
  getComparableAnalysis,
  getDealComparables,
  updateComparableAnalysis,
  deleteComparableAnalysis,
  type CreateComparableAnalysisInput,
} from "./comparables";
