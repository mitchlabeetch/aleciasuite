// packages/db/src/schema/bi.ts
// Drizzle ORM schema definitions for the alecia_bi schema
// Maps to: infrastructure/postgres/migrations/V002__bi_tables.sql

import {
  pgSchema,
  uuid,
  text,
  numeric,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { deals, users } from "./shared";

export const aleciaBi = pgSchema("alecia_bi");

export const embeddings = aleciaBi.table("embeddings", {
  id: uuid("id").primaryKey().defaultRandom(),
  dealId: uuid("deal_id").references(() => deals.id),
  documentName: text("document_name"),
  chunkText: text("chunk_text"),
  // Note: vector(1536) requires custom type — use raw SQL for vector column
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const researchFeeds = aleciaBi.table("research_feeds", {
  id: uuid("id").primaryKey().defaultRandom(),
  minifluxFeedId: integer("miniflux_feed_id"),
  name: text("name"),
  url: text("url"),
  category: text("category"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const researchArticles = aleciaBi.table("research_articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  feedId: uuid("feed_id").references(() => researchFeeds.id),
  title: text("title"),
  url: text("url"),
  content: text("content"),
  summary: text("summary"),
  relevanceScore: numeric("relevance_score"),
  dealId: uuid("deal_id").references(() => deals.id),
  isRead: boolean("is_read").default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const researchTasks = aleciaBi.table("research_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  dealId: uuid("deal_id").references(() => deals.id),
  assignedTo: uuid("assigned_to").references(() => users.id),
  title: text("title"),
  description: text("description"),
  status: text("status").default("pending"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const buyerCriteria = aleciaBi.table("buyer_criteria", {
  id: uuid("id").primaryKey().defaultRandom(),
  dealId: uuid("deal_id").references(() => deals.id),
  criteriaType: text("criteria_type"),
  description: text("description"),
  weight: numeric("weight"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const marketStudies = aleciaBi.table("market_studies", {
  id: uuid("id").primaryKey().defaultRandom(),
  dealId: uuid("deal_id").references(() => deals.id),
  title: text("title"),
  sector: text("sector"),
  geography: text("geography"),
  data: jsonb("data"),
  status: text("status").default("draft"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ============================================================================
// Pipeline & Approval Workflow Tables (V012)
// Maps to: infrastructure/postgres/migrations/V012__bi_pipeline_approvals.sql
// ============================================================================

export const kanbanColumns = aleciaBi.table("kanban_columns", {
  id: uuid("id").primaryKey().defaultRandom(),
  dealId: uuid("deal_id")
    .notNull()
    .references(() => deals.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  sortOrder: integer("sort_order").notNull(),
  color: text("color"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const projectEvents = aleciaBi.table("project_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  dealId: uuid("deal_id")
    .notNull()
    .references(() => deals.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  eventType: text("event_type", {
    enum: [
      "status_change",
      "note_added",
      "document_uploaded",
      "meeting_scheduled",
      "email_sent",
      "call_logged",
    ],
  }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const approvalRequests = aleciaBi.table("approval_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityType: text("entity_type", {
    enum: ["deal", "document", "page", "expense"],
  }).notNull(),
  entityId: uuid("entity_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  requestedBy: uuid("requested_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  dealId: uuid("deal_id").references(() => deals.id, { onDelete: "set null" }),
  approvalType: text("approval_type", {
    enum: ["any", "all", "sequential"],
  })
    .notNull()
    .default("any"),
  requiredApprovals: integer("required_approvals").notNull().default(1),
  status: text("status", {
    enum: ["pending", "approved", "rejected", "cancelled", "expired"],
  })
    .notNull()
    .default("pending"),
  priority: text("priority", {
    enum: ["low", "medium", "high", "urgent"],
  }).default("medium"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  currentStep: integer("current_step").default(1),
  templateId: uuid("template_id"),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  decidedBy: uuid("decided_by").references(() => users.id, {
    onDelete: "set null",
  }),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const approvalReviews = aleciaBi.table("approval_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => approvalRequests.id, { onDelete: "cascade" }),
  reviewerId: uuid("reviewer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  step: integer("step").default(1),
  decision: text("decision", {
    enum: ["pending", "approved", "rejected"],
  })
    .notNull()
    .default("pending"),
  comment: text("comment"),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const approvalTemplates = aleciaBi.table("approval_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  entityType: text("entity_type", {
    enum: ["deal", "document", "page", "expense"],
  }).notNull(),
  approvalType: text("approval_type", {
    enum: ["any", "all", "sequential"],
  })
    .notNull()
    .default("any"),
  requiredApprovals: integer("required_approvals").notNull().default(1),
  defaultReviewers: jsonb("default_reviewers").default([]),
  autoAssignRules: jsonb("auto_assign_rules"),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
