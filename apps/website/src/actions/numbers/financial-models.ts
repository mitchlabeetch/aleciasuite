/**
 * Numbers Financial Models Server Actions
 *
 * Handles 3-statement financial models (DCF, LBO, Comparables)
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

export interface SaveFinancialModelInput {
  id?: string;
  dealId?: string;
  name: string;
  modelType: "dcf" | "lbo" | "comparable";
  assumptions?: {
    projectionYears?: number;
    growthRate?: number;
    marginImprovement?: number;
    [key: string]: unknown;
  };
  results?: {
    [key: string]: unknown;
  };
  version?: number;
}

// ============================================
// FINANCIAL MODEL ACTIONS
// ============================================

/**
 * Save a financial model (create or update)
 */
export async function saveFinancialModel(data: SaveFinancialModelInput) {
  const user = await getAuthenticatedUser();

  const now = new Date();

  // Update existing model
  if (data.id) {
    const existing = await db.query.financialModels.findFirst({
      where: eq(numbers.financialModels.id, data.id),
    });

    if (!existing) {
      throw new Error("Financial model not found");
    }

    // Check if user owns the model or has access to the deal
    if (existing.createdBy !== user.id) {
      // TODO: Add team/deal access check here
      throw new Error("Access denied");
    }

    const [updated] = await db
      .update(numbers.financialModels)
      .set({
        name: data.name,
        modelType: data.modelType,
        assumptions: data.assumptions || {},
        results: data.results || {},
        version: (existing.version || 1) + 1,
        updatedAt: now,
      })
      .where(eq(numbers.financialModels.id, data.id))
      .returning();

    revalidatePath("/admin/numbers/financial-models");
    if (data.dealId) {
      revalidatePath(`/deals/${data.dealId}/models`);
    }

    return updated;
  }

  // Create new model
  const [model] = await db
    .insert(numbers.financialModels)
    .values({
      dealId: data.dealId,
      name: data.name,
      modelType: data.modelType,
      assumptions: data.assumptions || {},
      results: data.results || {},
      version: 1,
      createdBy: user.id,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  revalidatePath("/admin/numbers/financial-models");
  if (data.dealId) {
    revalidatePath(`/deals/${data.dealId}/models`);
  }

  return model;
}

/**
 * Get user's financial models
 */
export async function getUserFinancialModels(limit: number = 50) {
  const user = await getAuthenticatedUser();

  const models = await db.query.financialModels.findMany({
    where: eq(numbers.financialModels.createdBy, user.id),
    orderBy: [desc(numbers.financialModels.updatedAt)],
    limit,
  });

  return models;
}

/**
 * Get a specific financial model by ID
 */
export async function getFinancialModel(id: string) {
  const user = await getAuthenticatedUser();

  const model = await db.query.financialModels.findFirst({
    where: eq(numbers.financialModels.id, id),
  });

  if (!model) {
    throw new Error("Financial model not found");
  }

  // Check access
  if (model.createdBy !== user.id) {
    // TODO: Add team/deal access check here
    throw new Error("Access denied");
  }

  return model;
}

/**
 * Get financial models for a specific deal
 */
export async function getDealFinancialModels(dealId: string) {
  const _user = await getAuthenticatedUser();

  const models = await db.query.financialModels.findMany({
    where: eq(numbers.financialModels.dealId, dealId),
    orderBy: [desc(numbers.financialModels.version), desc(numbers.financialModels.updatedAt)],
  });

  return models;
}

/**
 * Delete a financial model
 */
export async function deleteFinancialModel(id: string) {
  const user = await getAuthenticatedUser();

  const model = await db.query.financialModels.findFirst({
    where: eq(numbers.financialModels.id, id),
  });

  if (!model) {
    throw new Error("Financial model not found");
  }

  // Check ownership
  if (model.createdBy !== user.id) {
    throw new Error("Not authorized");
  }

  await db.delete(numbers.financialModels).where(eq(numbers.financialModels.id, id));

  revalidatePath("/admin/numbers/financial-models");
  if (model.dealId) {
    revalidatePath(`/deals/${model.dealId}/models`);
  }

  return true;
}

/**
 * Duplicate a financial model (create a new version)
 */
export async function duplicateFinancialModel(id: string, newName?: string) {
  const user = await getAuthenticatedUser();

  const original = await db.query.financialModels.findFirst({
    where: eq(numbers.financialModels.id, id),
  });

  if (!original) {
    throw new Error("Financial model not found");
  }

  const now = new Date();

  const [duplicate] = await db
    .insert(numbers.financialModels)
    .values({
      dealId: original.dealId,
      name: newName || `${original.name} (copie)`,
      modelType: original.modelType,
      assumptions: original.assumptions,
      results: original.results,
      version: 1, // New model starts at version 1
      createdBy: user.id,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  revalidatePath("/admin/numbers/financial-models");
  if (original.dealId) {
    revalidatePath(`/deals/${original.dealId}/models`);
  }

  return duplicate;
}
