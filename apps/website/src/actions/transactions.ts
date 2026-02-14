/**
 * Transaction Management Server Actions
 *
 * Replaces Convex transactions.ts with PostgreSQL + Drizzle
 * Handles M&A track record (completed deals/mandates for marketing)
 */

"use server";

import { db, shared, eq, desc, sql, max } from "@alepanel/db";
import { getAuthenticatedUser } from "./lib/auth";
import { revalidatePath } from "next/cache";

// ============================================
// TYPES
// ============================================

export interface CreateTransactionInput {
  slug: string;
  clientName: string;
  clientLogo?: string;
  acquirerName?: string;
  acquirerLogo?: string;
  sector: string;
  region?: string;
  year: number;
  mandateType: string;
  description?: string;
  isConfidential: boolean;
  isClientConfidential?: boolean;
  isAcquirerConfidential?: boolean;
  isPriorExperience: boolean;
  context?: string;
  intervention?: string;
  result?: string;
  testimonialText?: string;
  testimonialAuthor?: string;
  roleType?: string;
  dealSize?: string;
  dealId?: string;
  keyMetrics?: Record<string, string | number | boolean | null>;
}

export interface UpdateTransactionInput extends Partial<CreateTransactionInput> {
  id: string;
}

// ============================================
// QUERIES
// ============================================

/**
 * List all transactions, sorted by display order and year
 */
export async function listTransactions() {
  // Public data - no auth required
  const transactions = await db
    .select()
    .from(shared.transactions)
    .orderBy(shared.transactions.displayOrder, desc(shared.transactions.year));

  return transactions;
}

/**
 * Get a single transaction by ID
 */
export async function getTransactionById(id: string) {
  const results = await db
    .select()
    .from(shared.transactions)
    .where(eq(shared.transactions.id, id))
    .limit(1);

  return results[0] ?? null;
}

/**
 * Get transaction linked to a deal
 */
export async function getTransactionByDeal(dealId: string) {
  const results = await db
    .select()
    .from(shared.transactions)
    .where(eq(shared.transactions.dealId, dealId))
    .limit(1);

  return results[0] ?? null;
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new transaction
 */
export async function createTransaction(input: CreateTransactionInput) {
  const _user = await getAuthenticatedUser();

  // Get max display order
  const maxOrderResult = await db
    .select({ maxOrder: max(shared.transactions.displayOrder) })
    .from(shared.transactions);

  const maxOrder = maxOrderResult[0]?.maxOrder ?? -1;

  const [newTransaction] = await db
    .insert(shared.transactions)
    .values({
      slug: input.slug,
      clientName: input.clientName,
      clientLogo: input.clientLogo ?? null,
      acquirerName: input.acquirerName ?? null,
      acquirerLogo: input.acquirerLogo ?? null,
      sector: input.sector,
      region: input.region ?? null,
      year: input.year,
      mandateType: input.mandateType,
      description: input.description ?? null,
      isConfidential: input.isConfidential,
      isClientConfidential: input.isClientConfidential ?? false,
      isAcquirerConfidential: input.isAcquirerConfidential ?? false,
      isPriorExperience: input.isPriorExperience,
      context: input.context ?? null,
      intervention: input.intervention ?? null,
      result: input.result ?? null,
      testimonialText: input.testimonialText ?? null,
      testimonialAuthor: input.testimonialAuthor ?? null,
      roleType: input.roleType ?? null,
      dealSize: input.dealSize ?? null,
      dealId: input.dealId ?? null,
      keyMetrics: input.keyMetrics ?? {},
      displayOrder: maxOrder + 1,
    })
    .returning();

  revalidatePath("/references");
  revalidatePath("/admin/transactions");

  return newTransaction;
}

/**
 * Update an existing transaction
 */
export async function updateTransaction(input: UpdateTransactionInput) {
  const _user = await getAuthenticatedUser();

  const { id, ...updates } = input;

  // Build update object dynamically, only including defined fields
  const updateData: Partial<typeof shared.transactions.$inferInsert> = {};

  if (updates.slug !== undefined) updateData.slug = updates.slug;
  if (updates.clientName !== undefined) updateData.clientName = updates.clientName;
  if (updates.clientLogo !== undefined) updateData.clientLogo = updates.clientLogo;
  if (updates.acquirerName !== undefined) updateData.acquirerName = updates.acquirerName;
  if (updates.acquirerLogo !== undefined) updateData.acquirerLogo = updates.acquirerLogo;
  if (updates.sector !== undefined) updateData.sector = updates.sector;
  if (updates.region !== undefined) updateData.region = updates.region;
  if (updates.year !== undefined) updateData.year = updates.year;
  if (updates.mandateType !== undefined) updateData.mandateType = updates.mandateType;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.isConfidential !== undefined) updateData.isConfidential = updates.isConfidential;
  if (updates.isClientConfidential !== undefined) updateData.isClientConfidential = updates.isClientConfidential;
  if (updates.isAcquirerConfidential !== undefined) updateData.isAcquirerConfidential = updates.isAcquirerConfidential;
  if (updates.isPriorExperience !== undefined) updateData.isPriorExperience = updates.isPriorExperience;
  if (updates.context !== undefined) updateData.context = updates.context;
  if (updates.intervention !== undefined) updateData.intervention = updates.intervention;
  if (updates.result !== undefined) updateData.result = updates.result;
  if (updates.testimonialText !== undefined) updateData.testimonialText = updates.testimonialText;
  if (updates.testimonialAuthor !== undefined) updateData.testimonialAuthor = updates.testimonialAuthor;
  if (updates.roleType !== undefined) updateData.roleType = updates.roleType;
  if (updates.dealSize !== undefined) updateData.dealSize = updates.dealSize;
  if (updates.dealId !== undefined) updateData.dealId = updates.dealId;
  if (updates.keyMetrics !== undefined) updateData.keyMetrics = updates.keyMetrics;

  if (Object.keys(updateData).length === 0) {
    return id; // No updates
  }

  // Always update updatedAt
  updateData.updatedAt = new Date();

  await db
    .update(shared.transactions)
    .set(updateData)
    .where(eq(shared.transactions.id, id));

  revalidatePath("/references");
  revalidatePath("/admin/transactions");

  return id;
}

/**
 * Delete a transaction
 */
export async function removeTransaction(id: string) {
  const _user = await getAuthenticatedUser();

  await db
    .delete(shared.transactions)
    .where(eq(shared.transactions.id, id));

  revalidatePath("/references");
  revalidatePath("/admin/transactions");
}

/**
 * Reorder transactions
 */
export async function reorderTransactions(orderedIds: string[]) {
  const _user = await getAuthenticatedUser();

  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(shared.transactions)
      .set({ displayOrder: i, updatedAt: new Date() })
      .where(eq(shared.transactions.id, orderedIds[i]));
  }

  revalidatePath("/references");
  revalidatePath("/admin/transactions");
}

/**
 * Duplicate a transaction
 */
export async function duplicateTransaction(id: string) {
  const _user = await getAuthenticatedUser();

  // Get original transaction
  const original = await getTransactionById(id);

  if (!original) {
    throw new Error("Transaction not found");
  }

  // Get max display order
  const maxOrderResult = await db
    .select({ maxOrder: max(shared.transactions.displayOrder) })
    .from(shared.transactions);

  const maxOrder = maxOrderResult[0]?.maxOrder ?? -1;

  // Create duplicate with modified slug
  const [duplicate] = await db
    .insert(shared.transactions)
    .values({
      slug: `${original.slug}-copy`,
      clientName: original.clientName,
      clientLogo: original.clientLogo,
      acquirerName: original.acquirerName,
      acquirerLogo: original.acquirerLogo,
      sector: original.sector,
      region: original.region,
      year: original.year,
      mandateType: original.mandateType,
      description: original.description,
      isConfidential: original.isConfidential,
      isClientConfidential: original.isClientConfidential,
      isAcquirerConfidential: original.isAcquirerConfidential,
      isPriorExperience: original.isPriorExperience,
      context: original.context,
      intervention: original.intervention,
      result: original.result,
      testimonialText: original.testimonialText,
      testimonialAuthor: original.testimonialAuthor,
      roleType: original.roleType,
      dealSize: original.dealSize,
      dealId: original.dealId,
      keyMetrics: original.keyMetrics,
      displayOrder: maxOrder + 1,
    })
    .returning();

  revalidatePath("/references");
  revalidatePath("/admin/transactions");

  return duplicate;
}
