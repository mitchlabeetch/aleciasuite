// packages/db/src/schema/numbers.ts
// Drizzle ORM schema definitions for the alecia_numbers schema
// Maps to: infrastructure/postgres/migrations/V003__numbers_tables.sql

import {
  pgSchema,
  uuid,
  text,
  numeric,
  integer,
  boolean,
  timestamp,
  date,
  jsonb,
  bigint,
} from "drizzle-orm/pg-core";
import { deals, users } from "./shared";

export const aleciaNumbers = pgSchema("alecia_numbers");

export const financialModels = aleciaNumbers.table("financial_models", {
  id: uuid("id").primaryKey().defaultRandom(),
  dealId: uuid("deal_id").references(() => deals.id),
  name: text("name"),
  modelType: text("model_type"), // dcf, lbo, comparable
  assumptions: jsonb("assumptions"),
  results: jsonb("results"),
  version: integer("version").default(1),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const valuations = aleciaNumbers.table("valuations", {
  id: uuid("id").primaryKey().defaultRandom(),
  dealId: uuid("deal_id").references(() => deals.id),
  method: text("method"), // multiples, dcf, asset_based, comparable
  enterpriseValue: numeric("enterprise_value", { precision: 15, scale: 2 }),
  equityValue: numeric("equity_value", { precision: 15, scale: 2 }),
  parameters: jsonb("parameters"),
  notes: text("notes"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const comparables = aleciaNumbers.table("comparables", {
  id: uuid("id").primaryKey().defaultRandom(),
  dealId: uuid("deal_id").references(() => deals.id),
  companyName: text("company_name"),
  siren: text("siren"),
  sector: text("sector"),
  revenue: numeric("revenue", { precision: 15, scale: 2 }),
  ebitda: numeric("ebitda", { precision: 15, scale: 2 }),
  evEbitda: numeric("ev_ebitda", { precision: 8, scale: 2 }),
  evRevenue: numeric("ev_revenue", { precision: 8, scale: 2 }),
  source: text("source"),
  dataYear: integer("data_year"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const ddChecklists = aleciaNumbers.table("dd_checklists", {
  id: uuid("id").primaryKey().defaultRandom(),
  dealId: uuid("deal_id").references(() => deals.id),
  name: text("name"),
  category: text("category"), // financial, legal, tax, commercial, social, IT, environmental
  status: text("status").default("not_started"),
  progressPct: integer("progress_pct").default(0),
  assignedTo: uuid("assigned_to").references(() => users.id),
  dueDate: timestamp("due_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const ddChecklistItems = aleciaNumbers.table("dd_checklist_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  checklistId: uuid("checklist_id")
    .references(() => ddChecklists.id, { onDelete: "cascade" })
    .notNull(),
  label: text("label"),
  isCompleted: boolean("is_completed").default(false),
  notes: text("notes"),
  documentUrl: text("document_url"),
  completedBy: uuid("completed_by").references(() => users.id),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  sortOrder: integer("sort_order"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const feeCalculations = aleciaNumbers.table("fee_calculations", {
  id: uuid("id").primaryKey().defaultRandom(),
  dealId: uuid("deal_id").references(() => deals.id),
  mandateType: text("mandate_type"), // sell_side, buy_side, dual
  retainerMonthly: numeric("retainer_monthly", { precision: 10, scale: 2 }),
  successFeePct: numeric("success_fee_pct", { precision: 5, scale: 2 }),
  minFee: numeric("min_fee", { precision: 10, scale: 2 }),
  dealValue: numeric("deal_value", { precision: 15, scale: 2 }),
  calculatedFee: numeric("calculated_fee", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const timelines = aleciaNumbers.table("timelines", {
  id: uuid("id").primaryKey().defaultRandom(),
  dealId: uuid("deal_id").references(() => deals.id),
  name: text("name"),
  milestones: jsonb("milestones"), // [{label, target_date, actual_date, status}]
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const teaserTracking = aleciaNumbers.table("teaser_tracking", {
  id: uuid("id").primaryKey().defaultRandom(),
  dealId: uuid("deal_id").references(() => deals.id),
  recipientCompany: text("recipient_company"),
  recipientContact: text("recipient_contact"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  openedAt: timestamp("opened_at", { withTimezone: true }),
  ndaSignedAt: timestamp("nda_signed_at", { withTimezone: true }),
  imSentAt: timestamp("im_sent_at", { withTimezone: true }),
  status: text("status"), // sent, opened, nda_signed, im_sent, declined
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const postDealIntegration = aleciaNumbers.table(
  "post_deal_integration",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dealId: uuid("deal_id").references(() => deals.id),
    workstream: text("workstream"),
    ownerId: uuid("owner_id").references(() => users.id),
    tasks: jsonb("tasks"),
    status: text("status").default("planning"),
    startDate: timestamp("start_date", { withTimezone: true }),
    endDate: timestamp("end_date", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
);

export const pipelineSnapshots = aleciaNumbers.table("pipeline_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  snapshotDate: date("snapshot_date").notNull(),
  data: jsonb("data"), // deals by stage + amounts
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const spreadsheets = aleciaNumbers.table("spreadsheets", {
  id: uuid("id").primaryKey().defaultRandom(),
  dealId: uuid("deal_id").references(() => deals.id),
  title: text("title").notNull(),
  sheetData: jsonb("sheet_data"), // FortuneSheet format
  ownerId: uuid("owner_id").references(() => users.id),
  isTemplate: boolean("is_template").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
