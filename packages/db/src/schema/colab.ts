// packages/db/src/schema/colab.ts
// Drizzle ORM schema definitions for the alecia_colab schema
// Maps to: infrastructure/postgres/migrations/V004__colab_tables.sql

import {
  pgSchema,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  customType,
  uniqueIndex,
  bigint,
} from "drizzle-orm/pg-core";
import { deals, users } from "./shared";

export const aleciaColab = pgSchema("alecia_colab");

// Custom type for BYTEA (Yjs binary state)
const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});

// ── Documents (TipTap/Novel editor) ──────────────────────────────────

export const documents = aleciaColab.table("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  content: jsonb("content").default({}),
  parentId: uuid("parent_id"), // self-referencing, set via SQL FK
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  dealId: uuid("deal_id").references(() => deals.id, {
    onDelete: "set null",
  }),
  icon: text("icon"),
  coverImageUrl: text("cover_image_url"),
  isTemplate: boolean("is_template").default(false),
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ── Document Versions ────────────────────────────────────────────────

export const documentVersions = aleciaColab.table("document_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  content: jsonb("content").default({}),
  editedBy: uuid("edited_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Boards (Kanban/Plane-style) ──────────────────────────────────────

export const boards = aleciaColab.table("boards", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  dealId: uuid("deal_id").references(() => deals.id, {
    onDelete: "set null",
  }),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  isTemplate: boolean("is_template").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ── Lists (Board columns) ────────────────────────────────────────────

export const lists = aleciaColab.table("lists", {
  id: uuid("id").primaryKey().defaultRandom(),
  boardId: uuid("board_id")
    .notNull()
    .references(() => boards.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  sortOrder: integer("sort_order").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Cards (Board tasks/items) ────────────────────────────────────────

export const cards = aleciaColab.table("cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  listId: uuid("list_id")
    .notNull()
    .references(() => lists.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  assigneeId: uuid("assignee_id").references(() => users.id, {
    onDelete: "set null",
  }),
  dueDate: timestamp("due_date", { withTimezone: true }),
  labels: jsonb("labels").default([]),
  attachments: jsonb("attachments").default([]),
  sortOrder: integer("sort_order").notNull(),
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ── Labels ───────────────────────────────────────────────────────────

export const labels = aleciaColab.table("labels", {
  id: uuid("id").primaryKey().defaultRandom(),
  boardId: uuid("board_id")
    .notNull()
    .references(() => boards.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Checklists ───────────────────────────────────────────────────────

export const checklists = aleciaColab.table("checklists", {
  id: uuid("id").primaryKey().defaultRandom(),
  cardId: uuid("card_id")
    .notNull()
    .references(() => cards.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  sortOrder: integer("sort_order").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Checklist Items ──────────────────────────────────────────────────

export const checklistItems = aleciaColab.table("checklist_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  checklistId: uuid("checklist_id")
    .notNull()
    .references(() => checklists.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  isCompleted: boolean("is_completed").default(false),
  sortOrder: integer("sort_order").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Yjs State (Hocuspocus real-time sync) ────────────────────────────

export const yjsState = aleciaColab.table("yjs_state", {
  documentName: text("document_name").primaryKey(),
  state: bytea("state").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ── Presentations ────────────────────────────────────────────────────

export const presentations = aleciaColab.table("presentations", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slides: jsonb("slides").default([]),
  dealId: uuid("deal_id").references(() => deals.id, {
    onDelete: "set null",
  }),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ── Comments (universal commenting system) ───────────────────────────

export const comments = aleciaColab.table("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityType: text("entity_type").notNull(), // 'document' | 'card' | 'board'
  entityId: uuid("entity_id").notNull(),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  mentions: text("mentions").array().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ── Presence (real-time user presence) ───────────────────────────────

export const presence = aleciaColab.table("presence", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  documentName: text("document_name").notNull(),
  cursorPosition: jsonb("cursor_position").default({}),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow(),
});

// ── Files (Minio-backed file storage) ────────────────────────────────

export const files = aleciaColab.table("files", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").references(() => documents.id, {
    onDelete: "set null",
  }),
  boardId: uuid("board_id").references(() => boards.id, {
    onDelete: "set null",
  }),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  mimeType: text("mime_type"),
  fileSize: bigint("file_size", { mode: "number" }),
  minioKey: text("minio_key").notNull().unique(),
  thumbnailUrl: text("thumbnail_url"),
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ── Property Definitions (Notion-style custom properties) ────────────

export const propertyDefinitions = aleciaColab.table("property_definitions", {
  id: uuid("id").primaryKey().defaultRandom(),
  boardId: uuid("board_id")
    .notNull()
    .references(() => boards.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  propertyType: text("property_type").notNull(), // text, number, select, multi_select, date, checkbox, url, email, person
  options: jsonb("options").default([]),
  defaultValue: text("default_value"),
  isRequired: boolean("is_required").default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ── Yjs Updates (incremental updates for Hocuspocus) ─────────────────

export const yjsUpdates = aleciaColab.table("yjs_updates", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentName: text("document_name").notNull(),
  updateData: bytea("update_data").notNull(),
  clientId: text("client_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Yjs Awareness (real-time cursor/selection awareness) ─────────────

export const yjsAwareness = aleciaColab.table("yjs_awareness", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentName: text("document_name").notNull(),
  clientId: text("client_id").notNull(),
  userId: uuid("user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  awarenessData: jsonb("awareness_data").notNull().default({}),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow(),
});
