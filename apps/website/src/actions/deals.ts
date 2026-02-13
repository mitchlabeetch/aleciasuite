/**
 * Deal Management Server Actions
 *
 * Replaces Convex queries/mutations with PostgreSQL + Drizzle
 * Handles CRUD operations for M&A deals with CRM integration
 */

"use server";

import { db, shared, eq, and, desc, sql, isNull, or, ilike } from "@alepanel/db";
import { auth } from "@alepanel/auth";
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

export interface PipelineStats {
  totalDeals: number;
  totalValue: string;
  byStage: Array<{
    stage: DealStage;
    count: number;
    totalValue: string;
  }>;
  winRate: number;
  avgDealSize: string;
}

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
// QUERIES
// ============================================

/**
 * Get all deals with optional filtering and enriched data
 */
export async function getDeals(filters?: DealFilters) {
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
 * Get a single deal by ID with full enrichment
 */
export async function getDealById(id: string) {
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
  revalidatePath("/pipeline");

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

  return updatedDeal;
}

/**
 * Update deal stage with reason tracking
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
  revalidatePath("/pipeline");

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
  revalidatePath("/pipeline");
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
  revalidatePath("/pipeline");
}

/**
 * Get pipeline statistics
 */
export async function getPipelineStats(): Promise<PipelineStats> {
  const user = await getAuthenticatedUser();

  // Get all active deals
  const activeDeals = await db.query.deals.findMany({
    where: eq(shared.deals.isArchived, false),
    columns: {
      stage: true,
      amount: true,
      currency: true,
    },
  });

  // Calculate stats by stage
  const stageGroups = new Map<DealStage, { count: number; totalValue: number }>();

  const stages: DealStage[] = [
    "sourcing",
    "qualification",
    "initial_meeting",
    "analysis",
    "valuation",
    "due_diligence",
    "negotiation",
    "closing",
    "closed_won",
    "closed_lost",
  ];

  stages.forEach((stage) => {
    stageGroups.set(stage, { count: 0, totalValue: 0 });
  });

  let totalValue = 0;
  let closedWonCount = 0;
  let closedLostCount = 0;

  activeDeals.forEach((deal) => {
    const stage = deal.stage as DealStage;
    const group = stageGroups.get(stage);

    if (group) {
      group.count++;

      if (deal.amount) {
        const value = parseFloat(deal.amount);
        group.totalValue += value;
        totalValue += value;
      }
    }

    if (stage === "closed_won") closedWonCount++;
    if (stage === "closed_lost") closedLostCount++;
  });

  const byStage = Array.from(stageGroups.entries()).map(([stage, stats]) => ({
    stage,
    count: stats.count,
    totalValue: stats.totalValue.toFixed(2),
  }));

  const totalClosed = closedWonCount + closedLostCount;
  const winRate = totalClosed > 0 ? (closedWonCount / totalClosed) * 100 : 0;

  const avgDealSize = activeDeals.length > 0 ? totalValue / activeDeals.length : 0;

  return {
    totalDeals: activeDeals.length,
    totalValue: totalValue.toFixed(2),
    byStage,
    winRate: parseFloat(winRate.toFixed(2)),
    avgDealSize: avgDealSize.toFixed(2),
  };
}

/**
 * Get deal stage history
 */
export async function getDealStageHistory(dealId: string) {
  const user = await getAuthenticatedUser();

  const history = await db.query.dealStageHistory.findMany({
    where: eq(shared.dealStageHistory.dealId, dealId),
    with: {
      changedBy: {
        columns: {
          id: true,
          fullName: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: [desc(shared.dealStageHistory.createdAt)],
  });

  return history;
}
