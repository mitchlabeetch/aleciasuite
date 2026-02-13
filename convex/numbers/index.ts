/**
 * Alecia Numbers - Convex Functions Index
 *
 * Re-exports all Numbers-related Convex functions
 */

// Dashboard & Activity
export {
  getRecentActivity,
  getToolStats,
  getDealsForNumbers,
  getDealById,
  getDealNumbersData,
} from "./dashboard";

// Fee Calculations
export {
  saveFeeCalculation,
  getUserFeeCalculations,
  getDealFeeCalculations,
} from "./feeCalculations";

// Financial Models
export {
  saveFinancialModel,
  getUserFinancialModels,
  getFinancialModel,
  getDealFinancialModels,
  deleteFinancialModel,
} from "./financialModels";

// Comparables Analysis
export {
  saveComparables,
  getUserComparables,
  getDealComparables,
} from "./comparables";

// Timelines
export { saveTimeline, getUserTimelines, getDealTimelines } from "./timelines";

// Teaser/IM Tracking
export {
  saveTeaserTracking,
  getUserTeaserTracking,
  getDealTeaserTracking,
} from "./teaserTracking";

// Post-Deal Integration
export { savePostDeal, getUserPostDeal, getDealPostDeal } from "./postDeal";
