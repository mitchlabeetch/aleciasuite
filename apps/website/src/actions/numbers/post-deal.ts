/**
 * Numbers Post-Deal Integration Server Actions
 *
 * Handles post-acquisition integration planning and tracking
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

export interface IntegrationTask {
  id: string;
  workstream: string;
  description: string;
  owner?: string;
  dueDate?: string;
  status: "not_started" | "in_progress" | "completed" | "blocked";
  priority: "low" | "medium" | "high" | "critical";
  dependencies?: string[];
  notes?: string;
}

export interface SavePostDealInput {
  id?: string;
  dealId?: string;
  workstream: string;
  ownerId?: string;
  tasks: IntegrationTask[];
  status: "planning" | "in_progress" | "completed";
  startDate?: Date;
  endDate?: Date;
}

// ============================================
// POST-DEAL INTEGRATION ACTIONS
// ============================================

/**
 * Save a post-deal integration plan (create or update)
 */
export async function savePostDealIntegration(data: SavePostDealInput) {
  const _user = await getAuthenticatedUser();

  const now = new Date();

  // Update existing plan
  if (data.id) {
    const existing = await db.query.postDealIntegration.findFirst({
      where: eq(numbers.postDealIntegration.id, data.id),
    });

    if (!existing) {
      throw new Error("Post-deal integration plan not found");
    }

    const [updated] = await db
      .update(numbers.postDealIntegration)
      .set({
        workstream: data.workstream,
        ownerId: data.ownerId,
        tasks: data.tasks,
        status: data.status,
        startDate: data.startDate,
        endDate: data.endDate,
        updatedAt: now,
      })
      .where(eq(numbers.postDealIntegration.id, data.id))
      .returning();

    revalidatePath("/admin/numbers/post-deal");
    if (data.dealId) {
      revalidatePath(`/deals/${data.dealId}/integration`);
    }

    return updated;
  }

  // Create new plan
  const [plan] = await db
    .insert(numbers.postDealIntegration)
    .values({
      dealId: data.dealId,
      workstream: data.workstream,
      ownerId: data.ownerId,
      tasks: data.tasks,
      status: data.status,
      startDate: data.startDate,
      endDate: data.endDate,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  revalidatePath("/admin/numbers/post-deal");
  if (data.dealId) {
    revalidatePath(`/deals/${data.dealId}/integration`);
  }

  return plan;
}

/**
 * Get all post-deal integration plans (with optional limit)
 */
export async function getAllPostDealIntegration(limit: number = 50) {
  const _user = await getAuthenticatedUser();

  const plans = await db.query.postDealIntegration.findMany({
    orderBy: [desc(numbers.postDealIntegration.updatedAt)],
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

  return plans;
}

/**
 * Get a specific post-deal integration plan
 */
export async function getPostDealIntegration(id: string) {
  const _user = await getAuthenticatedUser();

  const plan = await db.query.postDealIntegration.findFirst({
    where: eq(numbers.postDealIntegration.id, id),
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

  if (!plan) {
    throw new Error("Post-deal integration plan not found");
  }

  return plan;
}

/**
 * Get post-deal integration plans for a specific deal
 */
export async function getDealPostDealIntegration(dealId: string) {
  const _user = await getAuthenticatedUser();

  const plans = await db.query.postDealIntegration.findMany({
    where: eq(numbers.postDealIntegration.dealId, dealId),
    orderBy: [desc(numbers.postDealIntegration.createdAt)],
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

  return plans;
}

/**
 * Delete a post-deal integration plan
 */
export async function deletePostDealIntegration(id: string) {
  const _user = await getAuthenticatedUser();

  const plan = await db.query.postDealIntegration.findFirst({
    where: eq(numbers.postDealIntegration.id, id),
  });

  if (!plan) {
    throw new Error("Post-deal integration plan not found");
  }

  await db
    .delete(numbers.postDealIntegration)
    .where(eq(numbers.postDealIntegration.id, id));

  revalidatePath("/admin/numbers/post-deal");
  if (plan.dealId) {
    revalidatePath(`/deals/${plan.dealId}/integration`);
  }

  return true;
}

/**
 * Update a single task within a post-deal integration plan
 */
export async function updateIntegrationTask(
  planId: string,
  taskId: string,
  updates: Partial<IntegrationTask>
) {
  const _user = await getAuthenticatedUser();

  const plan = await db.query.postDealIntegration.findFirst({
    where: eq(numbers.postDealIntegration.id, planId),
  });

  if (!plan) {
    throw new Error("Post-deal integration plan not found");
  }

  // Update the specific task
  const tasks = plan.tasks as IntegrationTask[];
  const taskIndex = tasks.findIndex((t) => t.id === taskId);

  if (taskIndex === -1) {
    throw new Error("Task not found");
  }

  tasks[taskIndex] = {
    ...tasks[taskIndex],
    ...updates,
  };

  const [updated] = await db
    .update(numbers.postDealIntegration)
    .set({
      tasks,
      updatedAt: new Date(),
    })
    .where(eq(numbers.postDealIntegration.id, planId))
    .returning();

  revalidatePath("/admin/numbers/post-deal");
  if (plan.dealId) {
    revalidatePath(`/deals/${plan.dealId}/integration`);
  }

  return updated;
}

/**
 * Add a task to a post-deal integration plan
 */
export async function addIntegrationTask(planId: string, task: IntegrationTask) {
  const _user = await getAuthenticatedUser();

  const plan = await db.query.postDealIntegration.findFirst({
    where: eq(numbers.postDealIntegration.id, planId),
  });

  if (!plan) {
    throw new Error("Post-deal integration plan not found");
  }

  const tasks = [...(plan.tasks as IntegrationTask[]), task];

  const [updated] = await db
    .update(numbers.postDealIntegration)
    .set({
      tasks,
      updatedAt: new Date(),
    })
    .where(eq(numbers.postDealIntegration.id, planId))
    .returning();

  revalidatePath("/admin/numbers/post-deal");
  if (plan.dealId) {
    revalidatePath(`/deals/${plan.dealId}/integration`);
  }

  return updated;
}

/**
 * Remove a task from a post-deal integration plan
 */
export async function removeIntegrationTask(planId: string, taskId: string) {
  const _user = await getAuthenticatedUser();

  const plan = await db.query.postDealIntegration.findFirst({
    where: eq(numbers.postDealIntegration.id, planId),
  });

  if (!plan) {
    throw new Error("Post-deal integration plan not found");
  }

  const tasks = (plan.tasks as IntegrationTask[]).filter((t) => t.id !== taskId);

  const [updated] = await db
    .update(numbers.postDealIntegration)
    .set({
      tasks,
      updatedAt: new Date(),
    })
    .where(eq(numbers.postDealIntegration.id, planId))
    .returning();

  revalidatePath("/admin/numbers/post-deal");
  if (plan.dealId) {
    revalidatePath(`/deals/${plan.dealId}/integration`);
  }

  return updated;
}

/**
 * Update plan status
 */
export async function updatePostDealStatus(
  planId: string,
  status: "planning" | "in_progress" | "completed"
) {
  const _user = await getAuthenticatedUser();

  const plan = await db.query.postDealIntegration.findFirst({
    where: eq(numbers.postDealIntegration.id, planId),
  });

  if (!plan) {
    throw new Error("Post-deal integration plan not found");
  }

  const [updated] = await db
    .update(numbers.postDealIntegration)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(numbers.postDealIntegration.id, planId))
    .returning();

  revalidatePath("/admin/numbers/post-deal");
  if (plan.dealId) {
    revalidatePath(`/deals/${plan.dealId}/integration`);
  }

  return updated;
}
