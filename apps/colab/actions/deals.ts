/**
 * Deal Management Server Actions (Colab App)
 *
 * Simplified deal CRUD operations for the Colab app.
 * This is a subset of the full deals.ts from the website app,
 * containing only the essential functions needed by colab components.
 */

"use server";

import { db, shared, eq, and, desc, or, ilike } from "@alepanel/db";
import { getAuthenticatedUser } from "./lib/auth";
import { revalidatePath } from "next/cache";

// ============================================
// TYPES
// ============================================

export type DealStage =
  | "sourcing"
  | "qualification"
  | "initial_meeting"
  | "analysis"
  | "valuation"
  | "due_diligence"
  | "negotiation"
  | "closing"
  | "closed_won"
  | "closed_lost";

export type DealPriority = "low" | "medium" | "high" | "critical";

export interface CreateDealInput {
  title: string;
  description?: string;
  stage?: DealStage;
  amount?: string;
  currency?: string;
  probability?: number;
  companyId?: string;
  priority?: DealPriority;
  tags?: string[];
  expectedCloseDate?: Date;
  source?: string;
}

export interface DealFilters {
  stage?: DealStage;
  ownerId?: string;
  companyId?: string;
  search?: string;
  priority?: DealPriority;
  includeArchived?: boolean;
}

// ============================================
// QUERIES
// ============================================

/**
 * Get all deals with optional filtering
 */
export async function listDeals(filters?: DealFilters) {
  const user = await getAuthenticatedUser();

  // Build where conditions
  const conditions = [];

  if (filters?.stage) {
    conditions.push(eq(shared.deals.stage, filters.stage));
  }

  if (filters?.ownerId) {
    conditions.push(eq(shared.deals.ownerId, filters.ownerId));
  }

  if (filters?.companyId) {
    conditions.push(eq(shared.deals.companyId, filters.companyId));
  }

  if (filters?.priority) {
    conditions.push(eq(shared.deals.priority, filters.priority));
  }

  if (!filters?.includeArchived) {
    conditions.push(eq(shared.deals.isArchived, false));
  }

  if (filters?.search) {
    conditions.push(
      or(
        ilike(shared.deals.title, `%${filters.search}%`),
        ilike(shared.deals.description, `%${filters.search}%`)
      )
    );
  }

  const deals = await db.query.deals.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: {
      owner: {
        columns: {
          id: true,
          fullName: true,
          email: true,
          avatarUrl: true,
        },
      },
      company: {
        columns: {
          id: true,
          name: true,
          logoUrl: true,
          siren: true,
          website: true,
        },
      },
    },
    orderBy: [desc(shared.deals.updatedAt)],
  });

  return deals;
}

/**
 * Get a single deal by ID
 */
export async function getDeal(id: string) {
  const user = await getAuthenticatedUser();

  const deal = await db.query.deals.findFirst({
    where: eq(shared.deals.id, id),
    with: {
      owner: {
        columns: {
          id: true,
          fullName: true,
          email: true,
          avatarUrl: true,
          role: true,
        },
      },
      company: true,
    },
  });

  if (!deal) {
    return null;
  }

  return deal;
}

/**
 * Create a new deal
 */
export async function createDeal(data: CreateDealInput) {
  const user = await getAuthenticatedUser();

  const [deal] = await db
    .insert(shared.deals)
    .values({
      title: data.title,
      description: data.description,
      stage: data.stage || "sourcing",
      amount: data.amount,
      currency: data.currency || "EUR",
      probability: data.probability,
      ownerId: user.id,
      companyId: data.companyId,
      priority: data.priority || "medium",
      tags: data.tags || [],
      expectedCloseDate: data.expectedCloseDate,
      source: data.source || "manual",
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  // Log initial stage in history
  await db.insert(shared.dealStageHistory).values({
    dealId: deal.id,
    fromStage: null,
    toStage: deal.stage,
    changedBy: user.id,
    createdAt: new Date(),
  });

  revalidatePath("/deals");
  revalidatePath("/colab/boards");

  return deal;
}

/**
 * Update an existing deal
 */
export async function updateDeal(id: string, data: Partial<CreateDealInput>) {
  const user = await getAuthenticatedUser();

  // Check if deal exists
  const existingDeal = await db.query.deals.findFirst({
    where: eq(shared.deals.id, id),
  });

  if (!existingDeal) {
    throw new Error("Deal not found");
  }

  const [updatedDeal] = await db
    .update(shared.deals)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(shared.deals.id, id))
    .returning();

  revalidatePath("/deals");
  revalidatePath(`/deals/${id}`);
  revalidatePath("/colab/boards");

  return updatedDeal;
}

/**
 * Update deal stage
 */
export async function updateDealStage(
  id: string,
  stage: DealStage,
  reason?: string
) {
  const user = await getAuthenticatedUser();

  const existingDeal = await db.query.deals.findFirst({
    where: eq(shared.deals.id, id),
  });

  if (!existingDeal) {
    throw new Error("Deal not found");
  }

  const [updatedDeal] = await db
    .update(shared.deals)
    .set({
      stage,
      updatedAt: new Date(),
    })
    .where(eq(shared.deals.id, id))
    .returning();

  // Log stage change
  await db.insert(shared.dealStageHistory).values({
    dealId: id,
    fromStage: existingDeal.stage,
    toStage: stage,
    changedBy: user.id,
    reason,
    createdAt: new Date(),
  });

  revalidatePath("/deals");
  revalidatePath(`/deals/${id}`);
  revalidatePath("/colab/boards");

  return updatedDeal;
}

/**
 * Archive a deal (soft delete)
 */
export async function archiveDeal(id: string) {
  const user = await getAuthenticatedUser();

  await db
    .update(shared.deals)
    .set({
      isArchived: true,
      updatedAt: new Date(),
    })
    .where(eq(shared.deals.id, id));

  revalidatePath("/deals");
  revalidatePath("/colab/boards");
}

/**
 * Restore an archived deal
 */
export async function restoreDeal(id: string) {
  const user = await getAuthenticatedUser();

  await db
    .update(shared.deals)
    .set({
      isArchived: false,
      updatedAt: new Date(),
    })
    .where(eq(shared.deals.id, id));

  revalidatePath("/deals");
  revalidatePath("/colab/boards");
}
