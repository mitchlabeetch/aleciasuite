/**
 * Due Diligence Checklists Server Actions
 *
 * Comprehensive DD tracking for M&A transactions.
 * Manages checklists, items, progress tracking, and statistics.
 */

"use server";

import { db, numbers, shared, eq, and, desc, lt } from "@alepanel/db";
import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "./lib/auth";

// ============================================
// TYPES
// ============================================

export interface CreateChecklistInput {
  dealId: string;
  name: string;
  category: "legal" | "financial" | "tax" | "hr" | "ip" | "commercial" | "it" | "environmental" | "regulatory" | "other";
  assignedTo?: string;
  dueDate?: Date;
}

export interface UpdateChecklistInput {
  name?: string;
  status?: "not_started" | "in_progress" | "review" | "complete";
  assignedTo?: string;
  dueDate?: Date;
}

export interface CreateChecklistItemInput {
  checklistId: string;
  label: string;
  notes?: string;
  documentUrl?: string;
  sortOrder: number;
}

export interface UpdateChecklistItemInput {
  label?: string;
  isCompleted?: boolean;
  notes?: string;
  documentUrl?: string;
  sortOrder?: number;
}

// ============================================
// CHECKLISTS (Per Deal)
// ============================================

/**
 * List checklists for a deal
 */
export async function listChecklists(dealId?: string) {
  const _user = await getAuthenticatedUser();

  if (dealId) {
    const checklists = await db.query.ddChecklists.findMany({
      where: eq(numbers.ddChecklists.dealId, dealId),
      orderBy: [desc(numbers.ddChecklists.createdAt)],
    });

    return checklists;
  }

  // Get all checklists
  const checklists = await db.query.ddChecklists.findMany({
    orderBy: [desc(numbers.ddChecklists.createdAt)],
    limit: 100,
  });

  return checklists;
}

/**
 * Get a single checklist with its items
 */
export async function getChecklist(id: string) {
  const _user = await getAuthenticatedUser();

  const checklist = await db.query.ddChecklists.findFirst({
    where: eq(numbers.ddChecklists.id, id),
  });

  if (!checklist) {
    return null;
  }

  const items = await db.query.ddChecklistItems.findMany({
    where: eq(numbers.ddChecklistItems.checklistId, id),
  });

  // Sort items by sortOrder
  const sortedItems = items.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return {
    ...checklist,
    items: sortedItems,
  };
}

/**
 * Create a new checklist
 */
export async function createChecklist(data: CreateChecklistInput) {
  const _user = await getAuthenticatedUser();

  // Verify deal exists
  const deal = await db.query.deals.findFirst({
    where: eq(shared.deals.id, data.dealId),
  });

  if (!deal) {
    throw new Error("Deal not found");
  }

  const [checklist] = await db
    .insert(numbers.ddChecklists)
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
 * Update checklist status/progress
 */
export async function updateChecklist(id: string, data: UpdateChecklistInput) {
  const _user = await getAuthenticatedUser();

  const [checklist] = await db
    .update(numbers.ddChecklists)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(numbers.ddChecklists.id, id))
    .returning();

  if (checklist) {
    revalidatePath(`/deals/${checklist.dealId}/dd`);
  }

  return checklist;
}

/**
 * Delete a checklist and its items
 */
export async function deleteChecklist(id: string) {
  const _user = await getAuthenticatedUser();

  const checklist = await db.query.ddChecklists.findFirst({
    where: eq(numbers.ddChecklists.id, id),
  });

  if (!checklist) {
    throw new Error("Checklist not found");
  }

  // Delete all items first
  await db
    .delete(numbers.ddChecklistItems)
    .where(eq(numbers.ddChecklistItems.checklistId, id));

  // Delete the checklist
  await db.delete(numbers.ddChecklists).where(eq(numbers.ddChecklists.id, id));

  revalidatePath(`/deals/${checklist.dealId}/dd`);

  return { success: true };
}

/**
 * Recalculate checklist progress based on completed items
 */
export async function recalculateProgress(id: string) {
  const _user = await getAuthenticatedUser();

  const items = await db.query.ddChecklistItems.findMany({
    where: eq(numbers.ddChecklistItems.checklistId, id),
  });

  if (items.length === 0) {
    await db
      .update(numbers.ddChecklists)
      .set({ progressPct: 0, updatedAt: new Date() })
      .where(eq(numbers.ddChecklists.id, id));

    return { progressPct: 0, status: "not_started" };
  }

  const completed = items.filter((i) => i.isCompleted).length;
  const progressPct = Math.round((completed / items.length) * 100);

  // Update status based on progress
  let status: "not_started" | "in_progress" | "review" | "complete" =
    "not_started";
  if (progressPct === 100) {
    status = "complete";
  } else if (progressPct > 0) {
    status = "in_progress";
  }

  await db
    .update(numbers.ddChecklists)
    .set({ progressPct, status, updatedAt: new Date() })
    .where(eq(numbers.ddChecklists.id, id));

  return { progressPct, status };
}

// ============================================
// CHECKLIST ITEMS
// ============================================

/**
 * Get items for a checklist
 */
export async function listItems(checklistId: string) {
  const _user = await getAuthenticatedUser();

  const items = await db.query.ddChecklistItems.findMany({
    where: eq(numbers.ddChecklistItems.checklistId, checklistId),
  });

  return items.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

/**
 * Get a single item
 */
export async function getItem(id: string) {
  const _user = await getAuthenticatedUser();

  const item = await db.query.ddChecklistItems.findFirst({
    where: eq(numbers.ddChecklistItems.id, id),
  });

  return item;
}

/**
 * Add an item to a checklist
 */
export async function addItem(data: CreateChecklistItemInput) {
  const _user = await getAuthenticatedUser();

  // Verify checklist exists
  const checklist = await db.query.ddChecklists.findFirst({
    where: eq(numbers.ddChecklists.id, data.checklistId),
  });

  if (!checklist) {
    throw new Error("Checklist not found");
  }

  const [item] = await db
    .insert(numbers.ddChecklistItems)
    .values({
      checklistId: data.checklistId,
      label: data.label,
      isCompleted: false,
      notes: data.notes,
      documentUrl: data.documentUrl,
      sortOrder: data.sortOrder,
      createdAt: new Date(),
    })
    .returning();

  // Recalculate progress
  await recalculateProgress(data.checklistId);

  revalidatePath(`/deals/${checklist.dealId}/dd`);

  return item;
}

/**
 * Update an item
 */
export async function updateItem(id: string, data: UpdateChecklistItemInput) {
  const user = await getAuthenticatedUser();

  const existingItem = await db.query.ddChecklistItems.findFirst({
    where: eq(numbers.ddChecklistItems.id, id),
  });

  if (!existingItem) {
    throw new Error("Item not found");
  }

  // If marking as completed, record who completed it and when
  const updates: any = { ...data };
  if (data.isCompleted && !existingItem.isCompleted) {
    updates.completedBy = user.id;
    updates.completedAt = new Date();
  } else if (data.isCompleted === false && existingItem.isCompleted) {
    // If uncompleting, clear completion data
    updates.completedBy = null;
    updates.completedAt = null;
  }

  const [item] = await db
    .update(numbers.ddChecklistItems)
    .set(updates)
    .where(eq(numbers.ddChecklistItems.id, id))
    .returning();

  // Recalculate progress
  await recalculateProgress(existingItem.checklistId);

  const checklist = await db.query.ddChecklists.findFirst({
    where: eq(numbers.ddChecklists.id, existingItem.checklistId),
  });

  if (checklist) {
    revalidatePath(`/deals/${checklist.dealId}/dd`);
  }

  return item;
}

/**
 * Delete an item
 */
export async function deleteItem(id: string) {
  const _user = await getAuthenticatedUser();

  const item = await db.query.ddChecklistItems.findFirst({
    where: eq(numbers.ddChecklistItems.id, id),
  });

  if (!item) {
    throw new Error("Item not found");
  }

  await db
    .delete(numbers.ddChecklistItems)
    .where(eq(numbers.ddChecklistItems.id, id));

  // Recalculate progress
  await recalculateProgress(item.checklistId);

  const checklist = await db.query.ddChecklists.findFirst({
    where: eq(numbers.ddChecklists.id, item.checklistId),
  });

  if (checklist) {
    revalidatePath(`/deals/${checklist.dealId}/dd`);
  }

  return { success: true };
}

/**
 * Bulk update item statuses
 */
export async function bulkUpdateStatus(
  itemIds: string[],
  isCompleted: boolean
) {
  const _user = await getAuthenticatedUser();

  let checklistId: string | null = null;

  for (const itemId of itemIds) {
    const item = await db.query.ddChecklistItems.findFirst({
      where: eq(numbers.ddChecklistItems.id, itemId),
    });

    if (!item) continue;

    checklistId = item.checklistId;

    const updates: any = { isCompleted };
    if (isCompleted && !item.isCompleted) {
      updates.completedBy = user.id;
      updates.completedAt = new Date();
    } else if (!isCompleted && item.isCompleted) {
      updates.completedBy = null;
      updates.completedAt = null;
    }

    await db
      .update(numbers.ddChecklistItems)
      .set(updates)
      .where(eq(numbers.ddChecklistItems.id, itemId));
  }

  // Recalculate progress once at the end
  if (checklistId) {
    await recalculateProgress(checklistId);

    const checklist = await db.query.ddChecklists.findFirst({
      where: eq(numbers.ddChecklists.id, checklistId),
    });

    if (checklist) {
      revalidatePath(`/deals/${checklist.dealId}/dd`);
    }
  }

  return { success: true };
}

// ============================================
// STATISTICS & REPORTING
// ============================================

/**
 * Get checklist statistics
 */
export async function getChecklistStats(id: string) {
  const _user = await getAuthenticatedUser();

  const items = await db.query.ddChecklistItems.findMany({
    where: eq(numbers.ddChecklistItems.checklistId, id),
  });

  const stats = {
    total: items.length,
    completed: 0,
    pending: 0,
    overdue: 0,
  };

  const _now = new Date();

  for (const item of items) {
    if (item.isCompleted) {
      stats.completed++;
    } else {
      stats.pending++;
    }

    // Note: Items don't have due dates in the schema, only checklists do
    // If you want per-item due dates, you'd need to add that to the schema
  }

  return stats;
}

/**
 * Get overdue checklists
 */
export async function getOverdueChecklists(dealId?: string) {
  const _user = await getAuthenticatedUser();

  const now = new Date();

  let checklists;
  if (dealId) {
    checklists = await db.query.ddChecklists.findMany({
      where: and(
        eq(numbers.ddChecklists.dealId, dealId),
        lt(numbers.ddChecklists.dueDate, now)
      ),
    });
  } else {
    checklists = await db.query.ddChecklists.findMany({
      where: lt(numbers.ddChecklists.dueDate, now),
    });
  }

  // Filter out completed ones
  return checklists.filter((c) => c.status !== "complete");
}

/**
 * Get checklist summary for a deal
 */
export async function getDealChecklistSummary(dealId: string) {
  const _user = await getAuthenticatedUser();

  const checklists = await db.query.ddChecklists.findMany({
    where: eq(numbers.ddChecklists.dealId, dealId),
  });

  const summary = {
    total: checklists.length,
    notStarted: 0,
    inProgress: 0,
    review: 0,
    complete: 0,
    overallProgress: 0,
    overdue: 0,
  };

  const now = new Date();
  let totalProgress = 0;

  for (const checklist of checklists) {
    switch (checklist.status) {
      case "not_started":
        summary.notStarted++;
        break;
      case "in_progress":
        summary.inProgress++;
        break;
      case "review":
        summary.review++;
        break;
      case "complete":
        summary.complete++;
        break;
    }

    totalProgress += checklist.progressPct || 0;

    if (
      checklist.dueDate &&
      checklist.dueDate < now &&
      checklist.status !== "complete"
    ) {
      summary.overdue++;
    }
  }

  if (checklists.length > 0) {
    summary.overallProgress = Math.round(totalProgress / checklists.length);
  }

  return summary;
}

/**
 * Get items by assignee (if you want to add assignee to items)
 * Note: Current schema has assignedTo on checklists, not items
 * This is a placeholder for future enhancement
 */
export async function getItemsByAssignee(userId: string, dealId?: string) {
  const _user = await getAuthenticatedUser();

  // Get checklists assigned to this user
  const checklists = await db.query.ddChecklists.findMany({
    where: dealId
      ? and(eq(numbers.ddChecklists.assignedTo, userId), eq(numbers.ddChecklists.dealId, dealId))
      : eq(numbers.ddChecklists.assignedTo, userId),
  });

  const checklistIds = checklists.map((c) => c.id);

  if (checklistIds.length === 0) {
    return [];
  }

  // Get all items from these checklists
  const _items = await db.query.ddChecklistItems.findMany({
    where: eq(numbers.ddChecklistItems.checklistId, checklistIds[0]), // Need to use inArray for multiple
  });

  // TODO: Use inArray when available in Drizzle
  // For now, fetch all items and filter in memory
  const allItems = await db.query.ddChecklistItems.findMany();
  return allItems.filter((item) => checklistIds.includes(item.checklistId));
}
