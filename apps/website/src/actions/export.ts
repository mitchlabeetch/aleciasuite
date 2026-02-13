/**
 * Data Export Server Actions
 *
 * Export user data for backup or data portability.
 * Ported from convex/actions/dataExport.ts + convex/dataExport.ts
 */

"use server";

import { db, shared, eq } from "@alepanel/db";
import { getAuthenticatedUser } from "./lib/auth";

// ============================================
// TYPES
// ============================================

interface ExportData {
  exportedAt: string;
  version: string;
  user: { id: string; email?: string; name?: string };
  deals: unknown[];
  companies: unknown[];
  contacts: unknown[];
}

type ExportEntityType = "deals" | "companies" | "contacts";
type ExportFormat = "json" | "csv";

// ============================================
// HELPERS
// ============================================

function sanitizeForExport(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (key === "_creationTime") continue;
    if (Array.isArray(value)) {
      result[key] = value.map(sanitizeForExport);
    } else if (typeof value === "object" && value !== null) {
      result[key] = sanitizeForExport(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function convertToCSV(data: unknown[]): string {
  if (data.length === 0) return "";

  const allKeys = new Set<string>();
  for (const item of data) {
    if (item && typeof item === "object") {
      for (const key of Object.keys(item)) allKeys.add(key);
    }
  }

  const headers = Array.from(allKeys);
  const rows: string[] = [headers.map(escapeCSV).join(",")];

  for (const item of data) {
    if (item && typeof item === "object") {
      const obj = item as Record<string, unknown>;
      const values = headers.map((key) => {
        const value = obj[key];
        if (value === null || value === undefined) return "";
        if (typeof value === "object") return escapeCSV(JSON.stringify(value));
        return escapeCSV(String(value));
      });
      rows.push(values.join(","));
    }
  }

  return rows.join("\n");
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

/**
 * Export all user data to JSON
 */
export async function exportAllData(): Promise<{
  base64: string;
  filename: string;
}> {
  const user = await getAuthenticatedUser();

  const [deals, companies, contacts] = await Promise.all([
    db.query.deals.findMany({ where: eq(shared.deals.ownerId, user.id) }),
    db.query.companies.findMany(),
    db.query.contacts.findMany(),
  ]);

  const exportData: ExportData = {
    exportedAt: new Date().toISOString(),
    version: "1.0",
    user: { id: user.id, email: user.email, name: user.name },
    deals: deals.map(sanitizeForExport),
    companies: companies.map(sanitizeForExport),
    contacts: contacts.map(sanitizeForExport),
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const base64 = Buffer.from(jsonString).toString("base64");
  const date = new Date().toISOString().split("T")[0];

  return { base64, filename: `alecia-export-${date}.json` };
}

/**
 * Export a specific entity type
 */
export async function exportEntity(
  entityType: ExportEntityType,
  format: ExportFormat = "json"
): Promise<{ base64: string; filename: string }> {
  const user = await getAuthenticatedUser();

  let data: unknown[] = [];

  switch (entityType) {
    case "deals":
      data = await db.query.deals.findMany({
        where: eq(shared.deals.ownerId, user.id),
      });
      break;
    case "companies":
      data = await db.query.companies.findMany();
      break;
    case "contacts":
      data = await db.query.contacts.findMany();
      break;
  }

  const sanitizedData = data.map(sanitizeForExport);
  let content: string;
  let extension: string;

  if (format === "csv") {
    content = convertToCSV(sanitizedData);
    extension = "csv";
  } else {
    content = JSON.stringify(sanitizedData, null, 2);
    extension = "json";
  }

  const base64 = Buffer.from(content).toString("base64");
  const date = new Date().toISOString().split("T")[0];

  return { base64, filename: `${entityType}-${date}.${extension}` };
}
