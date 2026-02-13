// packages/db/src/schema/sign.ts
// Drizzle ORM schema definitions for the alecia_sign schema
// Maps to: infrastructure/postgres/migrations/V005__sign_tables.sql

import {
  pgSchema,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  bigint,
  inet,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { deals, users } from "./shared";

export const aleciaSign = pgSchema("alecia_sign");

// ── Deal Rooms (Virtual Data Rooms) ──────────────────────────────────

export const dealRooms = aleciaSign.table("deal_rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  dealId: uuid("deal_id")
    .notNull()
    .unique()
    .references(() => deals.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  watermarkEnabled: boolean("watermark_enabled").default(true),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ── Deal Room Folders ────────────────────────────────────────────────

export const dealRoomFolders = aleciaSign.table("deal_room_folders", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: uuid("room_id")
    .notNull()
    .references(() => dealRooms.id, { onDelete: "cascade" }),
  parentId: uuid("parent_id"), // self-referencing, set via SQL FK
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Deal Room Documents ──────────────────────────────────────────────

export const dealRoomDocuments = aleciaSign.table("deal_room_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  folderId: uuid("folder_id")
    .notNull()
    .references(() => dealRoomFolders.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  mimeType: text("mime_type"),
  fileSize: bigint("file_size", { mode: "number" }),
  minioKey: text("minio_key").notNull(),
  version: integer("version").default(1),
  uploadedBy: uuid("uploaded_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  isConfidential: boolean("is_confidential").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ── Deal Room Access Log ─────────────────────────────────────────────

export const dealRoomAccessLog = aleciaSign.table("deal_room_access_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: uuid("room_id")
    .notNull()
    .references(() => dealRooms.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  documentId: uuid("document_id").references(() => dealRoomDocuments.id, {
    onDelete: "set null",
  }),
  action: text("action").notNull(), // 'view' | 'download' | 'upload' | 'delete'
  ipAddress: inet("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Deal Room Questions (Q&A system) ─────────────────────────────────

export const dealRoomQuestions = aleciaSign.table("deal_room_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: uuid("room_id")
    .notNull()
    .references(() => dealRooms.id, { onDelete: "cascade" }),
  documentId: uuid("document_id").references(() => dealRoomDocuments.id, {
    onDelete: "set null",
  }),
  askedBy: uuid("asked_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer"),
  answeredBy: uuid("answered_by").references(() => users.id, {
    onDelete: "set null",
  }),
  answeredAt: timestamp("answered_at", { withTimezone: true }),
  status: text("status").notNull().default("pending"), // 'pending' | 'answered' | 'closed'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Deal Room Invitations ────────────────────────────────────────────

export const dealRoomInvitations = aleciaSign.table("deal_room_invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: uuid("room_id")
    .notNull()
    .references(() => dealRooms.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role").notNull().default("viewer"), // 'viewer' | 'contributor' | 'admin'
  token: text("token").unique().notNull(),
  invitedBy: uuid("invited_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Signing Audit Trail (DocuSeal integration) ───────────────────────

export const signingAuditTrail = aleciaSign.table("signing_audit_trail", {
  id: uuid("id").primaryKey().defaultRandom(),
  dealId: uuid("deal_id")
    .notNull()
    .references(() => deals.id, { onDelete: "cascade" }),
  documentId: uuid("document_id").references(() => dealRoomDocuments.id, {
    onDelete: "set null",
  }),
  signerEmail: text("signer_email").notNull(),
  signerName: text("signer_name"),
  action: text("action").notNull(), // 'sent' | 'viewed' | 'signed' | 'declined' | 'expired'
  ipAddress: inet("ip_address"),
  signatureHash: text("signature_hash"),
  signedAt: timestamp("signed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Relations ────────────────────────────────────────────────────────

export const dealRoomFoldersRelations = relations(dealRoomFolders, ({ one }) => ({
  room: one(dealRooms, {
    fields: [dealRoomFolders.roomId],
    references: [dealRooms.id],
  }),
}));

export const dealRoomDocumentsRelations = relations(dealRoomDocuments, ({ one }) => ({
  folder: one(dealRoomFolders, {
    fields: [dealRoomDocuments.folderId],
    references: [dealRoomFolders.id],
  }),
  uploadedBy: one(users, {
    fields: [dealRoomDocuments.uploadedBy],
    references: [users.id],
  }),
}));

export const dealRoomQuestionsRelations = relations(dealRoomQuestions, ({ one }) => ({
  askedBy: one(users, {
    fields: [dealRoomQuestions.askedBy],
    references: [users.id],
  }),
  answeredBy: one(users, {
    fields: [dealRoomQuestions.answeredBy],
    references: [users.id],
  }),
  document: one(dealRoomDocuments, {
    fields: [dealRoomQuestions.documentId],
    references: [dealRoomDocuments.id],
  }),
}));
