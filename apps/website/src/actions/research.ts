/**
 * Research Task Server Actions
 *
 * Task management for M&A research and due diligence.
 * Ported from convex/research.ts (313 lines)
 */

"use server";

import { db, shared, bi, eq, and, desc, sql, inArray } from "@alepanel/db";
import { getAuthenticatedUser } from "./lib/auth";
import { revalidatePath } from "next/cache";
import { notify } from "./notifications";

// ============================================
// TYPES
// ============================================

type TaskStatus = "todo" | "in_progress" | "review" | "done";
type TaskPriority = "low" | "medium" | "high";

export interface CreateTaskInput {
  title: string;
  description?: string;
  dealId?: string;
  assigneeId?: string;
  dueDate?: number;
  tags?: string[];
}

// ============================================
// QUERIES
// ============================================

/**
 * Get research tasks with optional filtering and enrichment
 */
export async function getTasks(args?: {
  status?: TaskStatus;
  assigneeId?: string;
  dealId?: string;
}) {
  const _user = await getAuthenticatedUser();

  const conditions = [];

  if (args?.status) {
    conditions.push(eq(bi.researchTasks.status, args.status));
  }
  if (args?.assigneeId) {
    conditions.push(eq(bi.researchTasks.assignedTo, args.assigneeId));
  }
  if (args?.dealId) {
    conditions.push(eq(bi.researchTasks.dealId, args.dealId));
  }

  const tasks = await db.query.researchTasks.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(bi.researchTasks.createdAt)],
  });

  // Batch fetch related data to avoid N+1
  const dealIds = [...new Set(tasks.map((t) => t.dealId).filter(Boolean))] as string[];
  const assigneeIds = [...new Set(tasks.map((t) => t.assignedTo).filter(Boolean))] as string[];

  const [deals, assignees] = await Promise.all([
    dealIds.length > 0
      ? db.query.deals.findMany({
          where: inArray(shared.deals.id, dealIds),
          columns: { id: true, title: true },
        })
      : [],
    assigneeIds.length > 0
      ? db.query.users.findMany({
          where: inArray(shared.users.id, assigneeIds),
          columns: { id: true, fullName: true, avatarUrl: true },
        })
      : [],
  ]);

  const dealsMap = new Map(deals.map((d) => [d.id, d]));
  const assigneesMap = new Map(assignees.map((a) => [a.id, a]));

  return tasks.map((task) => ({
    ...task,
    assigneeName: task.assignedTo
      ? assigneesMap.get(task.assignedTo)?.fullName ?? "Non assigné"
      : "Non assigné",
    assigneeAvatar: task.assignedTo
      ? assigneesMap.get(task.assignedTo)?.avatarUrl
      : undefined,
    dealTitle: task.dealId ? dealsMap.get(task.dealId)?.title : undefined,
  }));
}

/**
 * Get current user's tasks
 */
export async function getMyTasks() {
  const user = await getAuthenticatedUser();

  const tasks = await db.query.researchTasks.findMany({
    where: eq(bi.researchTasks.assignedTo, user.id),
    orderBy: [desc(bi.researchTasks.createdAt)],
  });

  // Enrich with deal titles
  const dealIds = [...new Set(tasks.map((t) => t.dealId).filter(Boolean))] as string[];
  const deals = dealIds.length > 0
    ? await db.query.deals.findMany({
        where: inArray(shared.deals.id, dealIds),
        columns: { id: true, title: true },
      })
    : [];
  const dealsMap = new Map(deals.map((d) => [d.id, d]));

  return tasks.map((task) => ({
    ...task,
    dealTitle: task.dealId ? dealsMap.get(task.dealId)?.title : undefined,
  }));
}

/**
 * Get task statistics
 */
export async function getTaskStats() {
  const _user = await getAuthenticatedUser();

  const tasks = await db.query.researchTasks.findMany();

  return {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "todo").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    review: tasks.filter((t) => t.status === "review").length,
    done: tasks.filter((t) => t.status === "done").length,
    overdue: tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done"
    ).length,
  };
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new research task
 */
export async function createTask(data: CreateTaskInput) {
  const user = await getAuthenticatedUser();

  const [task] = await db
    .insert(bi.researchTasks)
    .values({
      title: data.title,
      description: data.description,
      dealId: data.dealId,
      assignedTo: data.assigneeId,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      status: "todo",
      createdAt: new Date(),
    })
    .returning();

  // Notify assignee if different from creator
  if (data.assigneeId && data.assigneeId !== user.id) {
    await notify({
      recipientId: data.assigneeId,
      triggerId: user.id,
      type: "task_assigned",
      entityType: "task",
      entityId: task.id,
      payload: { title: data.title },
    });
  }

  revalidatePath("/research/tasks");
  return task;
}

/**
 * Update a research task
 */
export async function updateTask(
  taskId: string,
  data: Partial<{
    title: string;
    description: string;
    assigneeId: string;
    status: TaskStatus;
    dueDate: number;
    tags: string[];
  }>
) {
  const user = await getAuthenticatedUser();

  const task = await db.query.researchTasks.findFirst({
    where: eq(bi.researchTasks.id, taskId),
  });
  if (!task) throw new Error("Tâche non trouvée");

  const updates: Record<string, any> = { ...data };

  if (data.dueDate) {
    updates.dueDate = new Date(data.dueDate);
  }

  if (data.assigneeId !== undefined) {
    updates.assignedTo = data.assigneeId;
    delete updates.assigneeId;
  }

  await db
    .update(bi.researchTasks)
    .set(updates)
    .where(eq(bi.researchTasks.id, taskId));

  // Notify assignee if changed
  if (
    data.assigneeId &&
    data.assigneeId !== task.assignedTo &&
    data.assigneeId !== user.id
  ) {
    await notify({
      recipientId: data.assigneeId,
      triggerId: user.id,
      type: "task_assigned",
      entityType: "task",
      entityId: taskId,
      payload: { title: task.title },
    });
  }

  revalidatePath("/research/tasks");
}

/**
 * Delete a research task (sudo only)
 */
export async function deleteTask(taskId: string) {
  const user = await getAuthenticatedUser();

  const task = await db.query.researchTasks.findFirst({
    where: eq(bi.researchTasks.id, taskId),
  });
  if (!task) throw new Error("Tâche non trouvée");

  if ((user as any).role !== "sudo") {
    throw new Error("Permission refusée");
  }

  await db.delete(bi.researchTasks).where(eq(bi.researchTasks.id, taskId));
  revalidatePath("/research/tasks");
}

/**
 * Quick status change for a task
 */
export async function moveTask(taskId: string, newStatus: TaskStatus) {
  await getAuthenticatedUser();

  const task = await db.query.researchTasks.findFirst({
    where: eq(bi.researchTasks.id, taskId),
  });
  if (!task) throw new Error("Tâche non trouvée");

  await db
    .update(bi.researchTasks)
    .set({ status: newStatus })
    .where(eq(bi.researchTasks.id, taskId));

  revalidatePath("/research/tasks");
}
