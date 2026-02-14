/**
 * Pipeline Management Server Actions
 *
 * Replaces Convex pipeline.ts with PostgreSQL + Drizzle
 * Handles Kanban columns and project event timeline
 */

"use server";

import { db, shared, bi, eq, and, desc, sql, inArray, or, asc } from "@alepanel/db";
import { getAuthenticatedUser } from "./lib/auth";
import { revalidatePath } from "next/cache";

// ============================================
// TYPES
// ============================================

export type EventType =
  | "status_change"
  | "note_added"
  | "document_uploaded"
  | "meeting_scheduled"
  | "email_sent"
  | "call_logged";

export interface CreateKanbanColumnInput {
  dealId: string;
  name: string;
  color?: string;
}

export interface LogEventInput {
  dealId: string;
  contactId?: string;
  eventType: EventType;
  title: string;
  description?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface EventFilters {
  dealId?: string;
  userId?: string;
  eventTypes?: EventType[];
  limit?: number;
  offset?: number;
}

// ============================================
// KANBAN COLUMNS
// ============================================

/**
 * Get Kanban columns for a deal, sorted by order
 */
export async function getKanbanColumns(dealId?: string) {
  const _user = await getAuthenticatedUser();

  const columns = await db
    .select()
    .from(bi.kanbanColumns)
    .where(
      dealId
        ? eq(bi.kanbanColumns.dealId, dealId)
        : sql`${bi.kanbanColumns.dealId} IS NULL`
    )
    .orderBy(asc(bi.kanbanColumns.sortOrder));

  return columns;
}

/**
 * Create a new Kanban column
 */
export async function createKanbanColumn(input: CreateKanbanColumnInput) {
  const _user = await getAuthenticatedUser();

  // Get max order for this deal
  const maxOrderResult = await db
    .select({ maxOrder: sql<number>`COALESCE(MAX(${bi.kanbanColumns.sortOrder}), -1)` })
    .from(bi.kanbanColumns)
    .where(
      input.dealId
        ? eq(bi.kanbanColumns.dealId, input.dealId)
        : sql`${bi.kanbanColumns.dealId} IS NULL`
    );

  const maxOrder = maxOrderResult[0]?.maxOrder ?? -1;

  // Insert new column
  const [newColumn] = await db
    .insert(bi.kanbanColumns)
    .values({
      dealId: input.dealId,
      title: input.name,
      color: input.color ?? null,
      sortOrder: maxOrder + 1,
    })
    .returning();

  revalidatePath("/pipeline");
  return newColumn;
}

/**
 * Reorder Kanban columns
 */
export async function reorderKanbanColumns(columnIds: string[]) {
  const _user = await getAuthenticatedUser();

  // Build CASE statement for batch update
  const cases = columnIds
    .map((id, index) => sql`WHEN ${id} THEN ${index}`)
    .reduce((acc, curr) => sql`${acc} ${curr}`);

  await db
    .update(bi.kanbanColumns)
    .set({ sortOrder: sql`CASE ${bi.kanbanColumns.id} ${cases} END` })
    .where(inArray(bi.kanbanColumns.id, columnIds));

  revalidatePath("/pipeline");
}

/**
 * Delete a Kanban column
 */
export async function deleteKanbanColumn(columnId: string) {
  const _user = await getAuthenticatedUser();

  await db
    .delete(bi.kanbanColumns)
    .where(eq(bi.kanbanColumns.id, columnId));

  revalidatePath("/pipeline");
}

// ============================================
// PROJECT EVENTS (Activity Timeline)
// ============================================

/**
 * Get events with optional filtering
 */
export async function getEvents(filters?: EventFilters) {
  const _user = await getAuthenticatedUser();

  const limit = filters?.limit ?? 20;
  const offset = filters?.offset ?? 0;

  // Build WHERE conditions
  const conditions = [];

  if (filters?.dealId) {
    conditions.push(eq(bi.projectEvents.dealId, filters.dealId));
  }


  if (filters?.userId) {
    conditions.push(eq(bi.projectEvents.userId, filters.userId));
  }

  if (filters?.eventTypes && filters.eventTypes.length > 0) {
    conditions.push(inArray(bi.projectEvents.eventType, filters.eventTypes));
  }

  // Get events with enriched data using raw SQL for JOINs
  const result = await db.execute(sql`
    SELECT
      e.*,
      u.full_name as user_name,
      u.avatar_url as user_avatar,
      d.title as deal_title
    FROM bi.project_events e
    LEFT JOIN shared.users u ON e.user_id = u.id
    LEFT JOIN shared.deals d ON e.deal_id = d.id
    WHERE ${conditions.length > 0 ? and(...conditions) : sql`1=1`}
    ORDER BY e.created_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `);

  return result.rows;
}

/**
 * Get all events with advanced filtering for Activity Hub
 */
export async function getAllEvents(filters?: EventFilters) {
  const _user = await getAuthenticatedUser();

  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  // Build WHERE conditions
  const conditions = [];
  const countConditions = [];

  if (filters?.dealId) {
    conditions.push(sql`e.deal_id = ${filters.dealId}`);
    countConditions.push(eq(bi.projectEvents.dealId, filters.dealId));
  }


  if (filters?.userId) {
    conditions.push(sql`e.user_id = ${filters.userId}`);
    countConditions.push(eq(bi.projectEvents.userId, filters.userId));
  }

  if (filters?.eventTypes && filters.eventTypes.length > 0) {
    conditions.push(sql`e.event_type IN (${sql.join(filters.eventTypes.map(t => sql`${t}`), sql`, `)})`);
    countConditions.push(inArray(bi.projectEvents.eventType, filters.eventTypes));
  }

  // Get total count
  const countResult = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(bi.projectEvents)
    .where(countConditions.length > 0 ? and(...countConditions) : undefined);

  const total = countResult[0]?.total ?? 0;

  // Get events with enriched data
  const result = await db.execute(sql`
    SELECT
      e.*,
      u.full_name as user_name,
      u.avatar_url as user_avatar,
      d.title as deal_title
    FROM bi.project_events e
    LEFT JOIN shared.users u ON e.user_id = u.id
    LEFT JOIN shared.deals d ON e.deal_id = d.id
    WHERE ${conditions.length > 0 ? and(...conditions.map(c => c)) : sql`1=1`}
    ORDER BY e.created_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `);

  return {
    events: result.rows,
    total,
  };
}

/**
 * Get active users who have logged events (for filter dropdown)
 */
export async function getActiveUsers() {
  const _user = await getAuthenticatedUser();

  const result = await db.execute(sql`
    SELECT DISTINCT
      u.id as _id,
      u.full_name as name,
      u.avatar_url as avatar_url
    FROM bi.project_events e
    INNER JOIN shared.users u ON e.user_id = u.id
    ORDER BY u.full_name ASC
  `);

  return result.rows;
}

/**
 * Log a new event
 */
export async function logEvent(input: LogEventInput) {
  const user = await getAuthenticatedUser();

  const [event] = await db
    .insert(bi.projectEvents)
    .values({
      dealId: input.dealId,
      eventType: input.eventType,
      title: input.title,
      description: input.description ?? null,
      userId: user.id,
      metadata: input.metadata ? input.metadata : null,
    })
    .returning();

  revalidatePath("/pipeline");
  revalidatePath("/deals");
  revalidatePath("/companies");

  return event;
}

/**
 * Log event internally (for automated triggers)
 * Called from other server actions like deal stage changes
 */
export async function logEventInternal(
  userId: string,
  input: Omit<LogEventInput, "userId">
) {
  // Note: This is an internal function, no auth check needed
  // The calling function should have already authenticated

  const [event] = await db
    .insert(bi.projectEvents)
    .values({
      dealId: input.dealId,
      eventType: input.eventType,
      title: input.title,
      description: input.description ?? null,
      userId: userId,
      metadata: input.metadata ? input.metadata : null,
    })
    .returning();

  revalidatePath("/pipeline");
  return event;
}
