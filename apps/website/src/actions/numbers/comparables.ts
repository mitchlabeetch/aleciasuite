"use server";

/**
 * Comparable Companies Analysis - Server Actions
 *
 * Manages comparable company analysis data for valuation purposes.
 */

import { db, numbers, eq, desc } from "@alepanel/db";
import { getAuthenticatedUser } from "../lib/auth";
import { revalidatePath } from "next/cache";

// ============================================
// TYPES
// ============================================

export interface CreateComparableAnalysisInput {
  name: string;
  targetName?: string;
  dealId?: string;
  comparables: any[];
  targetMetrics?: any;
  notes?: string;
}

// ============================================
// CRUD ACTIONS
// ============================================

/**
 * Create a new comparable companies analysis
 */
export async function createComparableAnalysis(data: CreateComparableAnalysisInput) {
  const user = await getAuthenticatedUser();

  const [analysis] = await db
    .insert(numbers.spreadsheets)
    .values({
      title: `COMP: ${data.name}`,
      ownerId: user.id,
      dealId: data.dealId || null,
      sheetData: {
        targetName: data.targetName,
        comparables: data.comparables,
        targetMetrics: data.targetMetrics || null,
        notes: data.notes || null,
      },
      isTemplate: false,
    })
    .returning({ id: numbers.spreadsheets.id });

  revalidatePath("/admin/numbers/comparables");
  return analysis.id;
}

/**
 * Get all comparable analyses for current user
 */
export async function getUserComparables(limit: number = 50) {
  const user = await getAuthenticatedUser();

  const analyses = await db
    .select()
    .from(numbers.spreadsheets)
    .where(eq(numbers.spreadsheets.ownerId, user.id))
    .orderBy(desc(numbers.spreadsheets.updatedAt))
    .limit(limit);

  // Filter for comparable analyses (title starts with "COMP: ")
  return analyses.filter(a => a.title.startsWith("COMP: "));
}

/**
 * Get a specific comparable analysis by ID
 */
export async function getComparableAnalysis(id: string) {
  const user = await getAuthenticatedUser();

  const results = await db
    .select()
    .from(numbers.spreadsheets)
    .where(eq(numbers.spreadsheets.id, id))
    .limit(1);

  const analysis = results[0];

  if (!analysis) {
    throw new Error("Comparable analysis not found");
  }

  if (analysis.ownerId !== user.id) {
    throw new Error("Access denied");
  }

  return analysis;
}

/**
 * Get all comparable analyses for a specific deal
 */
export async function getDealComparables(dealId: string) {
  const _user = await getAuthenticatedUser();

  const analyses = await db
    .select()
    .from(numbers.spreadsheets)
    .where(eq(numbers.spreadsheets.dealId, dealId))
    .orderBy(desc(numbers.spreadsheets.updatedAt));

  // Filter for comparable analyses (title starts with "COMP: ")
  return analyses.filter(a => a.title.startsWith("COMP: "));
}

/**
 * Update a comparable analysis
 */
export async function updateComparableAnalysis(id: string, data: Partial<CreateComparableAnalysisInput>) {
  const user = await getAuthenticatedUser();

  // Verify ownership
  const results = await db
    .select()
    .from(numbers.spreadsheets)
    .where(eq(numbers.spreadsheets.id, id))
    .limit(1);

  const existing = results[0];

  if (!existing || existing.ownerId !== user.id) {
    throw new Error("Access denied");
  }

  // Merge new data into existing sheetData
  const currentSheetData = (existing.sheetData as any) || {};
  const newSheetData = {
    ...currentSheetData,
    targetName: data.targetName ?? currentSheetData.targetName,
    comparables: data.comparables ?? currentSheetData.comparables,
    targetMetrics: data.targetMetrics ?? currentSheetData.targetMetrics,
    notes: data.notes ?? currentSheetData.notes,
  };

  const updateValues: any = {
    sheetData: newSheetData,
    updatedAt: new Date(),
  };

  if (data.name) {
    updateValues.title = `COMP: ${data.name}`;
  }

  await db
    .update(numbers.spreadsheets)
    .set(updateValues)
    .where(eq(numbers.spreadsheets.id, id));

  revalidatePath("/admin/numbers/comparables");
  revalidatePath(`/admin/numbers/comparables/${id}`);
}

/**
 * Delete a comparable analysis
 */
export async function deleteComparableAnalysis(id: string) {
  const user = await getAuthenticatedUser();

  // Verify ownership
  const results = await db
    .select()
    .from(numbers.spreadsheets)
    .where(eq(numbers.spreadsheets.id, id))
    .limit(1);

  const existing = results[0];

  if (!existing || existing.ownerId !== user.id) {
    throw new Error("Access denied");
  }

  await db
    .delete(numbers.spreadsheets)
    .where(eq(numbers.spreadsheets.id, id));

  revalidatePath("/admin/numbers/comparables");
}
