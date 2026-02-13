/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_ai from "../actions/ai.js";
import type * as actions_calendarSync from "../actions/calendarSync.js";
import type * as actions_dataExport from "../actions/dataExport.js";
import type * as actions_documentExport from "../actions/documentExport.js";
import type * as actions_email from "../actions/email.js";
import type * as actions_finance from "../actions/finance.js";
import type * as actions_google from "../actions/google.js";
import type * as actions_intelligence from "../actions/intelligence.js";
import type * as actions_microsoft from "../actions/microsoft.js";
import type * as actions_microsoftCalendar from "../actions/microsoftCalendar.js";
import type * as actions_notificationService from "../actions/notificationService.js";
import type * as analytics from "../analytics.js";
import type * as approvals from "../approvals.js";
import type * as auth_utils from "../auth_utils.js";
import type * as blog from "../blog.js";
import type * as calendar from "../calendar.js";
import type * as careers from "../careers.js";
import type * as cms from "../cms.js";
import type * as colab_boards from "../colab/boards.js";
import type * as colab_documentVersions from "../colab/documentVersions.js";
import type * as colab_documents from "../colab/documents.js";
import type * as colab_files from "../colab/files.js";
import type * as colab_index from "../colab/index.js";
import type * as colab_presence from "../colab/presence.js";
import type * as colab_presentations from "../colab/presentations.js";
import type * as colab_propertyDefinitions from "../colab/propertyDefinitions.js";
import type * as comments from "../comments.js";
import type * as config from "../config.js";
import type * as crm from "../crm.js";
import type * as crons from "../crons.js";
import type * as dashboard from "../dashboard.js";
import type * as dataExport from "../dataExport.js";
import type * as dataRooms from "../dataRooms.js";
import type * as dataRoomsPublic from "../dataRoomsPublic.js";
import type * as ddChecklists from "../ddChecklists.js";
import type * as ddTemplates from "../ddTemplates.js";
import type * as deals from "../deals.js";
import type * as digest from "../digest.js";
import type * as featureFlags from "../featureFlags.js";
import type * as files from "../files.js";
import type * as forum from "../forum.js";
import type * as google_db from "../google_db.js";
import type * as http from "../http.js";
import type * as import_ from "../import.js";
import type * as importBackup from "../importBackup.js";
import type * as importData from "../importData.js";
import type * as lib_batch from "../lib/batch.js";
import type * as lib_crypto from "../lib/crypto.js";
import type * as lib_emailTemplates from "../lib/emailTemplates.js";
import type * as lib_env from "../lib/env.js";
import type * as lib_errors from "../lib/errors.js";
import type * as lib_logger from "../lib/logger.js";
import type * as lib_pagination from "../lib/pagination.js";
import type * as lib_pdfWatermark from "../lib/pdfWatermark.js";
import type * as lib_rateLimit from "../lib/rateLimit.js";
import type * as lib_sanitizeEmail from "../lib/sanitizeEmail.js";
import type * as lib_unsubscribeToken from "../lib/unsubscribeToken.js";
import type * as lib_validation from "../lib/validation.js";
import type * as logos from "../logos.js";
import type * as maintenance from "../maintenance.js";
import type * as marketing from "../marketing.js";
import type * as matchmaker from "../matchmaker.js";
import type * as microsoft_db from "../microsoft_db.js";
import type * as migrations from "../migrations.js";
import type * as migrations_convertBlogToHtml from "../migrations/convertBlogToHtml.js";
import type * as mutations from "../mutations.js";
import type * as notifications from "../notifications.js";
import type * as numbers_comparables from "../numbers/comparables.js";
import type * as numbers_dashboard from "../numbers/dashboard.js";
import type * as numbers_ddChecklists from "../numbers/ddChecklists.js";
import type * as numbers_feeCalculations from "../numbers/feeCalculations.js";
import type * as numbers_financialModels from "../numbers/financialModels.js";
import type * as numbers_index from "../numbers/index.js";
import type * as numbers_postDeal from "../numbers/postDeal.js";
import type * as numbers_spreadsheets from "../numbers/spreadsheets.js";
import type * as numbers_teaserTracking from "../numbers/teaserTracking.js";
import type * as numbers_timelines from "../numbers/timelines.js";
import type * as numbers_valuations from "../numbers/valuations.js";
import type * as pipedrive from "../pipedrive.js";
import type * as pipedrive_db from "../pipedrive_db.js";
import type * as pipeline from "../pipeline.js";
import type * as presence from "../presence.js";
import type * as queries from "../queries.js";
import type * as research from "../research.js";
import type * as search from "../search.js";
import type * as seed from "../seed.js";
import type * as seed_cms from "../seed_cms.js";
import type * as signing from "../signing.js";
import type * as slack from "../slack.js";
import type * as team from "../team.js";
import type * as team_import from "../team_import.js";
import type * as theme from "../theme.js";
import type * as tokenRefresh from "../tokenRefresh.js";
import type * as transactions from "../transactions.js";
import type * as unsubscribe from "../unsubscribe.js";
import type * as updateTeamPhotos from "../updateTeamPhotos.js";
import type * as update_transaction_logos from "../update_transaction_logos.js";
import type * as userPreferences from "../userPreferences.js";
import type * as users from "../users.js";
import type * as visual_editor from "../visual_editor.js";
import type * as voice from "../voice.js";
import type * as voice_db from "../voice_db.js";
import type * as yjs from "../yjs.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/ai": typeof actions_ai;
  "actions/calendarSync": typeof actions_calendarSync;
  "actions/dataExport": typeof actions_dataExport;
  "actions/documentExport": typeof actions_documentExport;
  "actions/email": typeof actions_email;
  "actions/finance": typeof actions_finance;
  "actions/google": typeof actions_google;
  "actions/intelligence": typeof actions_intelligence;
  "actions/microsoft": typeof actions_microsoft;
  "actions/microsoftCalendar": typeof actions_microsoftCalendar;
  "actions/notificationService": typeof actions_notificationService;
  analytics: typeof analytics;
  approvals: typeof approvals;
  auth_utils: typeof auth_utils;
  blog: typeof blog;
  calendar: typeof calendar;
  careers: typeof careers;
  cms: typeof cms;
  "colab/boards": typeof colab_boards;
  "colab/documentVersions": typeof colab_documentVersions;
  "colab/documents": typeof colab_documents;
  "colab/files": typeof colab_files;
  "colab/index": typeof colab_index;
  "colab/presence": typeof colab_presence;
  "colab/presentations": typeof colab_presentations;
  "colab/propertyDefinitions": typeof colab_propertyDefinitions;
  comments: typeof comments;
  config: typeof config;
  crm: typeof crm;
  crons: typeof crons;
  dashboard: typeof dashboard;
  dataExport: typeof dataExport;
  dataRooms: typeof dataRooms;
  dataRoomsPublic: typeof dataRoomsPublic;
  ddChecklists: typeof ddChecklists;
  ddTemplates: typeof ddTemplates;
  deals: typeof deals;
  digest: typeof digest;
  featureFlags: typeof featureFlags;
  files: typeof files;
  forum: typeof forum;
  google_db: typeof google_db;
  http: typeof http;
  import: typeof import_;
  importBackup: typeof importBackup;
  importData: typeof importData;
  "lib/batch": typeof lib_batch;
  "lib/crypto": typeof lib_crypto;
  "lib/emailTemplates": typeof lib_emailTemplates;
  "lib/env": typeof lib_env;
  "lib/errors": typeof lib_errors;
  "lib/logger": typeof lib_logger;
  "lib/pagination": typeof lib_pagination;
  "lib/pdfWatermark": typeof lib_pdfWatermark;
  "lib/rateLimit": typeof lib_rateLimit;
  "lib/sanitizeEmail": typeof lib_sanitizeEmail;
  "lib/unsubscribeToken": typeof lib_unsubscribeToken;
  "lib/validation": typeof lib_validation;
  logos: typeof logos;
  maintenance: typeof maintenance;
  marketing: typeof marketing;
  matchmaker: typeof matchmaker;
  microsoft_db: typeof microsoft_db;
  migrations: typeof migrations;
  "migrations/convertBlogToHtml": typeof migrations_convertBlogToHtml;
  mutations: typeof mutations;
  notifications: typeof notifications;
  "numbers/comparables": typeof numbers_comparables;
  "numbers/dashboard": typeof numbers_dashboard;
  "numbers/ddChecklists": typeof numbers_ddChecklists;
  "numbers/feeCalculations": typeof numbers_feeCalculations;
  "numbers/financialModels": typeof numbers_financialModels;
  "numbers/index": typeof numbers_index;
  "numbers/postDeal": typeof numbers_postDeal;
  "numbers/spreadsheets": typeof numbers_spreadsheets;
  "numbers/teaserTracking": typeof numbers_teaserTracking;
  "numbers/timelines": typeof numbers_timelines;
  "numbers/valuations": typeof numbers_valuations;
  pipedrive: typeof pipedrive;
  pipedrive_db: typeof pipedrive_db;
  pipeline: typeof pipeline;
  presence: typeof presence;
  queries: typeof queries;
  research: typeof research;
  search: typeof search;
  seed: typeof seed;
  seed_cms: typeof seed_cms;
  signing: typeof signing;
  slack: typeof slack;
  team: typeof team;
  team_import: typeof team_import;
  theme: typeof theme;
  tokenRefresh: typeof tokenRefresh;
  transactions: typeof transactions;
  unsubscribe: typeof unsubscribe;
  updateTeamPhotos: typeof updateTeamPhotos;
  update_transaction_logos: typeof update_transaction_logos;
  userPreferences: typeof userPreferences;
  users: typeof users;
  visual_editor: typeof visual_editor;
  voice: typeof voice;
  voice_db: typeof voice_db;
  yjs: typeof yjs;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
