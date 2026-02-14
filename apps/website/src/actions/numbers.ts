/**
 * M&A Financial Tools Server Actions
 *
 * Handles valuation models, comparables, DD checklists, fee calculations
 * Core functionality for alecia numbers product
 */

"use server";

import { db, shared, eq, desc, and } from "@alepanel/db";
import { numbers as aleciaNumbers } from "@alepanel/db";
import { auth } from "@alepanel/auth";
import { revalidatePath } from "next/cache";

// ============================================
// TYPES
// ============================================

export interface CreateValuationInput {
  dealId: string;
  method: "multiples" | "dcf" | "asset_based" | "comparable";
  enterpriseValue?: string;
  equityValue?: string;
  parameters?: Record<string, any>;
  notes?: string;
}

export interface CreateComparableInput {
  dealId: string;
  companyName: string;
  siren?: string;
  sector?: string;
  revenue?: string;
  ebitda?: string;
  evEbitda?: string;
  evRevenue?: string;
  source?: string;
  dataYear?: number;
}

export interface CreateDDChecklistInput {
  dealId: string;
  name: string;
  category:
    | "financial"
    | "legal"
    | "tax"
    | "commercial"
    | "social"
    | "it"
    | "environmental";
  assignedTo?: string;
  dueDate?: Date;
}

export interface CreateDDChecklistItemInput {
  checklistId: string;
  label: string;
  sortOrder?: number;
}

export interface CreateFeeCalculationInput {
  dealId: string;
  clientName?: string;
  mandateType: "sell_side" | "buy_side" | "dual";
  retainerMonthly?: string;
  successFeePct?: string;
  minFee?: string;
  dealValue?: string;
  notes?: string;
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
// VALUATIONS
// ============================================

/**
 * Get all valuations for a deal
 */
export async function getValuations(dealId: string) {
  const _user = await getAuthenticatedUser();

  const valuations = await db.query.valuations.findMany({
    where: eq(aleciaNumbers.valuations.dealId, dealId),
    with: {
      createdBy: {
        columns: {
          id: true,
          fullName: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: [desc(aleciaNumbers.valuations.createdAt)],
  });

  return valuations;
}

/**
 * Create a new valuation
 */
export async function createValuation(data: CreateValuationInput) {
  const user = await getAuthenticatedUser();

  // Verify deal exists
  const deal = await db.query.deals.findFirst({
    where: eq(shared.deals.id, data.dealId),
  });

  if (!deal) {
    throw new Error("Deal not found");
  }

  const [valuation] = await db
    .insert(aleciaNumbers.valuations)
    .values({
      dealId: data.dealId,
      method: data.method,
      enterpriseValue: data.enterpriseValue,
      equityValue: data.equityValue,
      parameters: data.parameters || {},
      notes: data.notes,
      createdBy: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  revalidatePath(`/deals/${data.dealId}/valuations`);

  return valuation;
}

/**
 * Update a valuation
 */
export async function updateValuation(
  id: string,
  data: Partial<CreateValuationInput>
) {
  const _user = await getAuthenticatedUser();

  const [updatedValuation] = await db
    .update(aleciaNumbers.valuations)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(aleciaNumbers.valuations.id, id))
    .returning();

  const valuation = await db.query.valuations.findFirst({
    where: eq(aleciaNumbers.valuations.id, id),
  });

  if (valuation) {
    revalidatePath(`/deals/${valuation.dealId}/valuations`);
  }

  return updatedValuation;
}

// ============================================
// COMPARABLES
// ============================================

/**
 * Get all comparables for a deal
 */
export async function getComparables(dealId: string) {
  const _user = await getAuthenticatedUser();

  const comparables = await db.query.comparables.findMany({
    where: eq(aleciaNumbers.comparables.dealId, dealId),
    orderBy: [desc(aleciaNumbers.comparables.createdAt)],
  });

  return comparables;
}

/**
 * Create a new comparable company
 */
export async function createComparable(data: CreateComparableInput) {
  const _user = await getAuthenticatedUser();

  const [comparable] = await db
    .insert(aleciaNumbers.comparables)
    .values({
      dealId: data.dealId,
      companyName: data.companyName,
      siren: data.siren,
      sector: data.sector,
      revenue: data.revenue,
      ebitda: data.ebitda,
      evEbitda: data.evEbitda,
      evRevenue: data.evRevenue,
      source: data.source || "manual",
      dataYear: data.dataYear || new Date().getFullYear(),
      createdAt: new Date(),
    })
    .returning();

  revalidatePath(`/deals/${data.dealId}/comparables`);

  return comparable;
}

/**
 * Bulk create comparables (for import from Excel/API)
 */
export async function bulkCreateComparables(comparables: CreateComparableInput[]) {
  const _user = await getAuthenticatedUser();

  const insertedComparables = await db
    .insert(aleciaNumbers.comparables)
    .values(
      comparables.map((c) => ({
        dealId: c.dealId,
        companyName: c.companyName,
        siren: c.siren,
        sector: c.sector,
        revenue: c.revenue,
        ebitda: c.ebitda,
        evEbitda: c.evEbitda,
        evRevenue: c.evRevenue,
        source: c.source || "import",
        dataYear: c.dataYear || new Date().getFullYear(),
        createdAt: new Date(),
      }))
    )
    .returning();

  if (comparables.length > 0) {
    revalidatePath(`/deals/${comparables[0].dealId}/comparables`);
  }

  return insertedComparables;
}

// ============================================
// DUE DILIGENCE CHECKLISTS
// ============================================

/**
 * Get DD checklist for a deal
 */
export async function getDDChecklist(dealId: string) {
  const _user = await getAuthenticatedUser();

  const checklists = await db.query.ddChecklists.findMany({
    where: eq(aleciaNumbers.ddChecklists.dealId, dealId),
    with: {
      assignedTo: {
        columns: {
          id: true,
          fullName: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: [desc(aleciaNumbers.ddChecklists.createdAt)],
  });

  return checklists;
}

/**
 * Create a new DD checklist
 */
export async function createDDChecklist(data: CreateDDChecklistInput) {
  const _user = await getAuthenticatedUser();

  const [checklist] = await db
    .insert(aleciaNumbers.ddChecklists)
    .values({
      dealId: data.dealId,
      name: data.name,
      category: data.category,
      status: "not_started",
      progressPct: 0,
      assignedTo: data.assignedTo,
      dueDate: data.dueDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  revalidatePath(`/deals/${data.dealId}/dd`);

  return checklist;
}

/**
 * Get checklist items
 */
export async function getDDChecklistItems(checklistId: string) {
  const _user = await getAuthenticatedUser();

  const items = await db.query.ddChecklistItems.findMany({
    where: eq(aleciaNumbers.ddChecklistItems.checklistId, checklistId),
    with: {
      completedBy: {
        columns: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  return items;
}

/**
 * Create a DD checklist item
 */
export async function createDDChecklistItem(data: CreateDDChecklistItemInput) {
  const _user = await getAuthenticatedUser();

  const [item] = await db
    .insert(aleciaNumbers.ddChecklistItems)
    .values({
      checklistId: data.checklistId,
      label: data.label,
      isCompleted: false,
      sortOrder: data.sortOrder || 0,
      createdAt: new Date(),
    })
    .returning();

  // Update checklist progress
  await updateChecklistProgress(data.checklistId);

  return item;
}

/**
 * Toggle DD checklist item completion
 */
export async function toggleDDChecklistItem(itemId: string, isCompleted: boolean) {
  const user = await getAuthenticatedUser();

  const item = await db.query.ddChecklistItems.findFirst({
    where: eq(aleciaNumbers.ddChecklistItems.id, itemId),
  });

  if (!item) {
    throw new Error("Checklist item not found");
  }

  const [updatedItem] = await db
    .update(aleciaNumbers.ddChecklistItems)
    .set({
      isCompleted,
      completedBy: isCompleted ? user.id : null,
      completedAt: isCompleted ? new Date() : null,
    })
    .where(eq(aleciaNumbers.ddChecklistItems.id, itemId))
    .returning();

  // Update checklist progress
  await updateChecklistProgress(item.checklistId);

  return updatedItem;
}

/**
 * Update checklist progress percentage
 * (Internal helper function)
 */
async function updateChecklistProgress(checklistId: string) {
  const items = await db.query.ddChecklistItems.findMany({
    where: eq(aleciaNumbers.ddChecklistItems.checklistId, checklistId),
  });

  const totalItems = items.length;
  const completedItems = items.filter((i) => i.isCompleted).length;

  const progressPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const status =
    progressPct === 0
      ? "not_started"
      : progressPct === 100
        ? "completed"
        : "in_progress";

  await db
    .update(aleciaNumbers.ddChecklists)
    .set({
      progressPct,
      status,
      updatedAt: new Date(),
    })
    .where(eq(aleciaNumbers.ddChecklists.id, checklistId));
}

// ============================================
// FEE CALCULATIONS
// ============================================

/**
 * Get fee calculation for a deal
 */
export async function getFeeCalculation(dealId: string) {
  const _user = await getAuthenticatedUser();

  const feeCalc = await db.query.feeCalculations.findFirst({
    where: eq(aleciaNumbers.feeCalculations.dealId, dealId),
    with: {
      createdBy: {
        columns: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  return feeCalc;
}

/**
 * Create or update fee calculation
 */
export async function saveFeeCalculation(data: CreateFeeCalculationInput) {
  const user = await getAuthenticatedUser();

  // Check if calculation already exists
  const existing = await db.query.feeCalculations.findFirst({
    where: eq(aleciaNumbers.feeCalculations.dealId, data.dealId),
  });

  // Calculate fee based on deal value and success fee %
  let calculatedFee = "0";
  if (data.dealValue && data.successFeePct) {
    const dealValue = parseFloat(data.dealValue);
    const successFeePct = parseFloat(data.successFeePct);
    const fee = (dealValue * successFeePct) / 100;

    // Apply minimum fee if specified
    const minFee = data.minFee ? parseFloat(data.minFee) : 0;
    calculatedFee = Math.max(fee, minFee).toFixed(2);
  }

  if (existing) {
    // Update existing
    const [updated] = await db
      .update(aleciaNumbers.feeCalculations)
      .set({
        mandateType: data.mandateType,
        retainerMonthly: data.retainerMonthly,
        successFeePct: data.successFeePct,
        minFee: data.minFee,
        dealValue: data.dealValue,
        calculatedFee,
        notes: data.notes,
        updatedAt: new Date(),
      })
      .where(eq(aleciaNumbers.feeCalculations.id, existing.id))
      .returning();

    revalidatePath(`/deals/${data.dealId}/fees`);
    return updated;
  } else {
    // Create new
    const [feeCalc] = await db
      .insert(aleciaNumbers.feeCalculations)
      .values({
        dealId: data.dealId,
        mandateType: data.mandateType,
        retainerMonthly: data.retainerMonthly,
        successFeePct: data.successFeePct,
        minFee: data.minFee,
        dealValue: data.dealValue,
        calculatedFee,
        notes: data.notes,
        createdBy: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    revalidatePath(`/deals/${data.dealId}/fees`);
    return feeCalc;
  }
}
