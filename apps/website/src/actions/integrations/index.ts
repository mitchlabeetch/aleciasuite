/**
 * Integrations - Re-exports
 * All integration-related Server Actions
 * Note: "use server" is in each sub-module, not here (barrel re-exports can't use it)
 */

// Microsoft
export {
  getMicrosoftAuthUrl,
  exchangeMicrosoftCode,
  isMicrosoftConnected,
  getMicrosoftAccessToken,
  fetchMicrosoftCalendarEvents,
  createMicrosoftCalendarEvent,
  getOneDriveFiles,
  readExcelRange,
} from "./microsoft";

// Google
export {
  getGoogleAuthUrl,
  exchangeGoogleCode,
  isGoogleConnected,
  disconnectGoogle,
  getGoogleAccessToken,
  fetchGoogleCalendarEvents,
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
} from "./google";

// Pipedrive
export {
  getPipedriveAuthUrl,
  exchangePipedriveCode,
  isPipedriveConnected,
  upsertCompanyFromPipedrive,
  upsertContactFromPipedrive,
  upsertDealFromPipedrive,
  linkDealToPipedrive,
  getCompanyByPipedriveId,
  getDealById,
  syncFromPipedrive,
} from "./pipedrive-sync";

// Slack
export {
  getSlackStatus,
  getSlackNotificationPrefs,
  configureSlack,
  toggleSlack,
  sendTestSlackMessage,
  postDealUpdate,
  postDealClosed,
  postSignatureRequest,
} from "./slack";

// Token Refresh
export {
  refreshAllTokens,
} from "./token-refresh";
