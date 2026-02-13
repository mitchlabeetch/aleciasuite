// packages/db/src/schema/shared.ts
// Drizzle ORM schema definitions for the shared PostgreSQL schema
// Maps to: infrastructure/postgres/migrations/V001__shared_tables.sql

import {
  pgSchema,
  uuid,
  text,
  numeric,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  inet,
  index,
  bigint,
} from "drizzle-orm/pg-core";

export const shared = pgSchema("shared");

export const dealStageEnum = shared.enum("deal_stage", [
  "sourcing",
  "qualification",
  "initial_meeting",
  "analysis",
  "valuation",
  "due_diligence",
  "negotiation",
  "closing",
  "closed_won",
  "closed_lost",
]);

export const dealPriorityEnum = shared.enum("deal_priority", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const userRoleEnum = shared.enum("user_role", [
  "sudo",
  "partner",
  "advisor",
  "user",
]);

export const users = shared.table("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  authProviderId: text("auth_provider_id").unique(),
  emailVerified: boolean("email_verified").default(false),
  email: text("email").unique().notNull(),
  fullName: text("full_name").notNull(),
  role: userRoleEnum("role").default("user").notNull(),
  avatarUrl: text("avatar_url"),
  preferences: jsonb("preferences").default({}),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const companies = shared.table("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  siren: text("siren"),
  siret: text("siret"),
  nafCode: text("naf_code"),
  vatNumber: text("vat_number"),
  website: text("website"),
  logoUrl: text("logo_url"),
  address: jsonb("address"),
  financials: jsonb("financials"),
  pappersData: jsonb("pappers_data"),
  pipedriveId: text("pipedrive_id"),
  source: text("source").default("manual"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const contacts = shared.table("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id, {
    onDelete: "set null",
  }),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  role: text("role"),
  tags: text("tags").array().default([]),
  externalId: text("external_id"),
  source: text("source").default("manual"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const deals = shared.table("deals", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  stage: dealStageEnum("stage").default("sourcing").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }),
  currency: text("currency").default("EUR"),
  probability: integer("probability"),
  ownerId: uuid("owner_id").references(() => users.id, {
    onDelete: "set null",
  }),
  companyId: uuid("company_id").references(() => companies.id, {
    onDelete: "set null",
  }),
  priority: dealPriorityEnum("priority").default("medium"),
  tags: text("tags").array().default([]),
  expectedCloseDate: timestamp("expected_close_date", {
    withTimezone: true,
  }),
  source: text("source").default("manual"),
  pipedriveId: text("pipedrive_id"),
  externalId: text("external_id"),
  isArchived: boolean("is_archived").default(false),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const dealStageHistory = shared.table("deal_stage_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  dealId: uuid("deal_id")
    .notNull()
    .references(() => deals.id, { onDelete: "cascade" }),
  fromStage: dealStageEnum("from_stage"),
  toStage: dealStageEnum("to_stage").notNull(),
  changedBy: uuid("changed_by").references(() => users.id),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const auditLog = shared.table("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  service: text("service").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id"),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Team Members (for website team page) ──────────────────────────────

export const teamMembers = shared.table("team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").unique().notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  photo: text("photo"),
  photoUrl: text("photo_url"),
  bioFr: text("bio_fr"),
  bioEn: text("bio_en"),
  linkedinUrl: text("linkedin_url"),
  email: text("email"),
  sectorsExpertise: text("sectors_expertise").array().default([]),
  transactionSlugs: text("transaction_slugs").array().default([]),
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ── User Preferences (cross-app sync) ─────────────────────────────────

export const userPreferences = shared.table("user_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  theme: text("theme").default("system"), // 'light' | 'dark' | 'system'
  accentColor: text("accent_color"),
  sidebarCollapsed: boolean("sidebar_collapsed").default(false),
  compactMode: boolean("compact_mode").default(false),
  notifications: jsonb("notifications").default({
    emailEnabled: true,
    pushEnabled: true,
    digestFrequency: "daily",
  }),
  locale: text("locale").default("fr"), // 'fr' | 'en'
  timezone: text("timezone").default("Europe/Paris"),
  dateFormat: text("date_format").default("DD/MM/YYYY"),
  numberFormat: text("number_format").default("fr-FR"),
  defaultDashboard: text("default_dashboard"),
  pinnedDeals: text("pinned_deals").array().default([]),
  favoriteViews: text("favorite_views").array().default([]),
  editorFontSize: integer("editor_font_size").default(14),
  editorLineHeight: numeric("editor_line_height", { precision: 3, scale: 1 }).default("1.5"),
  editorWordWrap: boolean("editor_word_wrap").default(true),
  spellCheckEnabled: boolean("spell_check_enabled").default(true),
  defaultCalendarProvider: text("default_calendar_provider"), // 'microsoft' | 'google' | 'none'
  autoLinkEmails: boolean("auto_link_emails").default(true),
  keyboardShortcuts: jsonb("keyboard_shortcuts").default({}),
  lastActiveApp: text("last_active_app"), // 'panel' | 'colab'
  lastActiveRoute: text("last_active_route"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ── Presence (real-time user activity tracking) ───────────────────────

export const presence = shared.table("presence", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  currentPage: text("current_page").notNull(),
  lastSeen: timestamp("last_seen", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// V008: Business Tables - Transactions, Notifications, Feature Flags, Config
// ============================================================================

export const transactions = shared.table("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").unique().notNull(),
  clientName: text("client_name").notNull(),
  clientLogo: text("client_logo"),
  acquirerName: text("acquirer_name"),
  acquirerLogo: text("acquirer_logo"),
  sector: text("sector").notNull(),
  region: text("region"),
  year: integer("year").notNull(),
  mandateType: text("mandate_type").notNull(),
  description: text("description"),
  isConfidential: boolean("is_confidential").default(false),
  isClientConfidential: boolean("is_client_confidential").default(false),
  isAcquirerConfidential: boolean("is_acquirer_confidential").default(false),
  isPriorExperience: boolean("is_prior_experience").default(false),
  context: text("context"),
  intervention: text("intervention"),
  result: text("result"),
  testimonialText: text("testimonial_text"),
  testimonialAuthor: text("testimonial_author"),
  roleType: text("role_type"),
  dealSize: text("deal_size"),
  dealId: uuid("deal_id").references(() => deals.id, { onDelete: "set null" }),
  keyMetrics: jsonb("key_metrics").default({}),
  displayOrder: integer("display_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const notifications = shared.table("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipientId: uuid("recipient_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  triggerId: uuid("trigger_id").references(() => users.id, { onDelete: "set null" }),
  type: text("type").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  isRead: boolean("is_read").default(false),
  payload: jsonb("payload").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const featureFlags = shared.table("feature_flags", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").unique().notNull(),
  name: text("name").notNull(),
  description: text("description"),
  enabled: boolean("enabled").default(false),
  rolloutStrategy: text("rollout_strategy").notNull(),
  rolloutPercentage: integer("rollout_percentage"),
  allowedUserIds: text("allowed_user_ids").array().default([]),
  allowedRoles: text("allowed_roles").array().default([]),
  allowedDomains: text("allowed_domains").array().default([]),
  environments: text("environments").array().default([]),
  category: text("category"),
  expiresAt: bigint("expires_at", { mode: "number" }),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const featureFlagAssignments = shared.table("feature_flag_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  flagKey: text("flag_key").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  isEnabled: boolean("is_enabled").notNull(),
  assignedBy: uuid("assigned_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const globalConfig = shared.table("global_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").unique().notNull(),
  value: jsonb("value").default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ============================================================================
// V009: Content Tables - Blog, Forum, Jobs, Marketing, Locations
// ============================================================================

export const blogPosts = shared.table("blog_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  status: text("status").default("draft").notNull(),
  authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  slug: text("slug").unique().notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  featuredImage: text("featured_image"),
  category: text("category"),
  publishedAt: bigint("published_at", { mode: "number" }),
  seo: jsonb("seo").default({}),
  tags: text("tags").array().default([]),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export const forumCategories = shared.table("forum_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  isPrivate: boolean("is_private").default(false),
  order: integer("order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const forumThreads = shared.table("forum_threads", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  category: text("category"),
  dealId: uuid("deal_id").references(() => deals.id, { onDelete: "set null" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  isPinned: boolean("is_pinned").default(false),
  isLocked: boolean("is_locked").default(false),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export const forumPosts = shared.table("forum_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  threadId: uuid("thread_id")
    .notNull()
    .references(() => forumThreads.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  parentPostId: uuid("parent_post_id").references((): any => forumPosts.id, { onDelete: "set null" }),
  isEdited: boolean("is_edited").default(false),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export const jobOffers = shared.table("job_offers", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").unique().notNull(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  location: text("location").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements"),
  contactEmail: text("contact_email"),
  pdfUrl: text("pdf_url"),
  isPublished: boolean("is_published").default(false),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const marketingKpis = shared.table("marketing_kpis", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").unique().notNull(),
  icon: text("icon").notNull(),
  value: numeric("value").notNull(),
  suffix: text("suffix"),
  prefix: text("prefix"),
  labelFr: text("label_fr").notNull(),
  labelEn: text("label_en").notNull(),
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
});

export const locationImages = shared.table("location_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  locationId: text("location_id").unique().notNull(),
  imageUrl: text("image_url").notNull(),
  altText: text("alt_text"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ============================================================================
// V010: Calendar & Analytics Tables
// ============================================================================

export const calendarEvents = shared.table("calendar_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  externalId: text("external_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startDateTime: bigint("start_date_time", { mode: "number" }).notNull(),
  endDateTime: bigint("end_date_time", { mode: "number" }).notNull(),
  isAllDay: boolean("is_all_day").default(false),
  location: text("location"),
  source: text("source").notNull(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  dealId: uuid("deal_id").references(() => deals.id, { onDelete: "set null" }),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  organizer: jsonb("organizer"),
  attendees: jsonb("attendees").default([]),
  isOnlineMeeting: boolean("is_online_meeting").default(false),
  onlineMeetingUrl: text("online_meeting_url"),
  onlineMeetingProvider: text("online_meeting_provider"),
  status: text("status"),
  iCalUId: text("ical_uid"),
  changeKey: text("change_key"),
  recurrence: text("recurrence"),
  recurringEventId: text("recurring_event_id"),
  lastSyncedAt: bigint("last_synced_at", { mode: "number" }).notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});

export const calendarSyncState = shared.table("calendar_sync_state", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  isEnabled: boolean("is_enabled").default(false),
  syncDirection: text("sync_direction"),
  lastSyncedAt: bigint("last_synced_at", { mode: "number" }),
  syncToken: text("sync_token"),
  lastError: text("last_error"),
  lastErrorAt: bigint("last_error_at", { mode: "number" }),
  consecutiveErrors: integer("consecutive_errors").default(0),
  syncPastDays: integer("sync_past_days").default(30),
  syncFutureDays: integer("sync_future_days").default(90),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});

export const analyticsEvents = shared.table("analytics_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: text("event_id").unique().notNull(),
  eventType: text("event_type").notNull(),
  path: text("path").notNull(),
  hostname: text("hostname"),
  referrer: text("referrer"),
  referrerHostname: text("referrer_hostname"),
  visitorId: text("visitor_id"),
  sessionId: text("session_id"),
  deviceType: text("device_type"),
  browser: text("browser"),
  os: text("os"),
  country: text("country"),
  countryCode: text("country_code"),
  region: text("region"),
  city: text("city"),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  utmTerm: text("utm_term"),
  utmContent: text("utm_content"),
  eventTimestamp: bigint("event_timestamp", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const analyticsCache = shared.table("analytics_cache", {
  id: uuid("id").primaryKey().defaultRandom(),
  cacheKey: text("cache_key").unique().notNull(),
  data: jsonb("data").notNull(),
  expiresAt: bigint("expires_at", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================================================
// V011: CMS & Visual Editor Tables
// ============================================================================

export const sitePages = shared.table("site_pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").unique().notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const proposals = shared.table("proposals", {
  id: uuid("id").primaryKey().defaultRandom(),
  targetPageId: uuid("target_page_id")
    .notNull()
    .references(() => sitePages.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  diffSnapshot: text("diff_snapshot").notNull(),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  votesFor: text("votes_for").array().default([]),
  votesAgainst: text("votes_against").array().default([]),
  status: text("status").default("voting").notNull(),
  aiSummary: text("ai_summary"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const pageContent = shared.table("page_content", {
  id: uuid("id").primaryKey().defaultRandom(),
  path: text("path").notNull(),
  locale: text("locale").notNull(),
  sections: jsonb("sections").default([]).notNull(),
  theme: jsonb("theme"),
  version: integer("version").default(1).notNull(),
  publishedAt: bigint("published_at", { mode: "number" }),
  publishedBy: uuid("published_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});

export const pendingChanges = shared.table("pending_changes", {
  id: uuid("id").primaryKey().defaultRandom(),
  pageContentId: uuid("page_content_id")
    .notNull()
    .references(() => pageContent.id, { onDelete: "cascade" }),
  pagePath: text("page_path").notNull(),
  pageLocale: text("page_locale").notNull(),
  changedBy: uuid("changed_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  changedByName: text("changed_by_name").notNull(),
  changeType: text("change_type").notNull(),
  description: text("description"),
  visualDiff: jsonb("visual_diff").notNull(),
  codeDiff: jsonb("code_diff").notNull(),
  status: text("status").default("pending").notNull(),
  requiredApprovals: integer("required_approvals").default(2).notNull(),
  approvedAt: bigint("approved_at", { mode: "number" }),
  publishedAt: bigint("published_at", { mode: "number" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});

export const changeApprovals = shared.table("change_approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  changeId: uuid("change_id")
    .notNull()
    .references(() => pendingChanges.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  userName: text("user_name").notNull(),
  approved: boolean("approved").notNull(),
  comment: text("comment"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export const pageVersions = shared.table("page_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  pageContentId: uuid("page_content_id")
    .notNull()
    .references(() => pageContent.id, { onDelete: "cascade" }),
  pagePath: text("page_path").notNull(),
  version: integer("version").notNull(),
  sections: jsonb("sections").notNull(),
  theme: jsonb("theme"),
  publishedBy: uuid("published_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  publishedByName: text("published_by_name").notNull(),
  publishedAt: bigint("published_at", { mode: "number" }).notNull(),
  changeDescription: text("change_description"),
});
