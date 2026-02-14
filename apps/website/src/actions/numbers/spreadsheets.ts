/**
 * Numbers Spreadsheets Server Actions
 *
 * Handles FortuneSheet-based spreadsheet management for M&A financial tools
 */

"use server";

import { db, numbers, eq, desc } from "@alepanel/db";
import { revalidatePath } from "next/cache";
import { auth } from "@alepanel/auth";

// ============================================
// AUTHENTICATION HELPER
// ============================================

async function getAuthenticatedUser() {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((mod) => mod.headers()),
  });

  if (!session?.user) {
    throw new Error("Unauthorized: Please sign in to continue");
  }

  return session.user;
}

// ============================================
// TYPES
// ============================================

export interface SaveSpreadsheetInput {
  id?: string;
  dealId?: string;
  title: string;
  sheetData: Record<string, any>; // FortuneSheet JSON data
  isTemplate?: boolean;
}

// ============================================
// SPREADSHEET ACTIONS
// ============================================

/**
 * Save a spreadsheet (create or update)
 */
export async function saveSpreadsheet(data: SaveSpreadsheetInput) {
  const user = await getAuthenticatedUser();

  const now = new Date();

  // Update existing spreadsheet
  if (data.id) {
    const existing = await db.query.spreadsheets.findFirst({
      where: eq(numbers.spreadsheets.id, data.id),
    });

    if (!existing || existing.ownerId !== user.id) {
      throw new Error("Spreadsheet not found or access denied");
    }

    const [updated] = await db
      .update(numbers.spreadsheets)
      .set({
        title: data.title,
        dealId: data.dealId,
        sheetData: data.sheetData,
        isTemplate: data.isTemplate || false,
        updatedAt: now,
      })
      .where(eq(numbers.spreadsheets.id, data.id))
      .returning();

    revalidatePath("/admin/numbers/spreadsheets");
    if (data.dealId) {
      revalidatePath(`/deals/${data.dealId}/spreadsheets`);
    }

    return updated;
  }

  // Create new spreadsheet
  const [spreadsheet] = await db
    .insert(numbers.spreadsheets)
    .values({
      ownerId: user.id,
      dealId: data.dealId,
      title: data.title,
      sheetData: data.sheetData,
      isTemplate: data.isTemplate || false,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  revalidatePath("/admin/numbers/spreadsheets");
  if (data.dealId) {
    revalidatePath(`/deals/${data.dealId}/spreadsheets`);
  }

  return spreadsheet;
}

/**
 * Get user's spreadsheets
 */
export async function getUserSpreadsheets(limit: number = 50) {
  const user = await getAuthenticatedUser();

  const spreadsheets = await db.query.spreadsheets.findMany({
    where: eq(numbers.spreadsheets.ownerId, user.id),
    orderBy: [desc(numbers.spreadsheets.updatedAt)],
    limit,
    with: {
      owner: {
        columns: {
          id: true,
          fullName: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  return spreadsheets;
}

/**
 * Get a specific spreadsheet by ID
 */
export async function getSpreadsheet(id: string) {
  const user = await getAuthenticatedUser();

  const spreadsheet = await db.query.spreadsheets.findFirst({
    where: eq(numbers.spreadsheets.id, id),
    with: {
      owner: {
        columns: {
          id: true,
          fullName: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!spreadsheet || spreadsheet.ownerId !== user.id) {
    throw new Error("Spreadsheet not found or access denied");
  }

  return spreadsheet;
}

/**
 * Get spreadsheets for a specific deal
 */
export async function getDealSpreadsheets(dealId: string) {
  const user = await getAuthenticatedUser();

  const spreadsheets = await db.query.spreadsheets.findMany({
    where: eq(numbers.spreadsheets.dealId, dealId),
    orderBy: [desc(numbers.spreadsheets.updatedAt)],
    with: {
      owner: {
        columns: {
          id: true,
          fullName: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  return spreadsheets;
}

/**
 * Delete a spreadsheet
 */
export async function deleteSpreadsheet(id: string) {
  const user = await getAuthenticatedUser();

  const spreadsheet = await db.query.spreadsheets.findFirst({
    where: eq(numbers.spreadsheets.id, id),
  });

  if (!spreadsheet || spreadsheet.ownerId !== user.id) {
    throw new Error("Spreadsheet not found or access denied");
  }

  await db.delete(numbers.spreadsheets).where(eq(numbers.spreadsheets.id, id));

  revalidatePath("/admin/numbers/spreadsheets");
  if (spreadsheet.dealId) {
    revalidatePath(`/deals/${spreadsheet.dealId}/spreadsheets`);
  }

  return true;
}

/**
 * Get spreadsheet templates
 */
export async function getSpreadsheetTemplates() {
  const user = await getAuthenticatedUser();

  const templates = await db.query.spreadsheets.findMany({
    where: eq(numbers.spreadsheets.isTemplate, true),
    orderBy: [desc(numbers.spreadsheets.createdAt)],
    with: {
      owner: {
        columns: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  return templates;
}
