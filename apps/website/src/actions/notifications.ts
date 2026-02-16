/**
 * Notification Server Actions
 *
 * Handles user notification CRUD and email notification triggers.
 * Ported from convex/notifications.ts + convex/actions/notificationService.ts
 */

"use server";

import { db, shared, eq, and, sql } from "@alepanel/db";
import { getAuthenticatedUser } from "./lib/auth";
import { revalidatePath } from "next/cache";

// ============================================
// TYPES
// ============================================

interface NotificationPayload {
  recipientId: string;
  triggerId?: string;
  type: string;
  entityType: string;
  entityId: string;
  payload?: Record<string, unknown>;
}

// ============================================
// QUERIES
// ============================================

/**
 * Get user notifications with trigger user enrichment
 */
export async function getNotifications(args?: { limit?: number }) {
  const user = await getAuthenticatedUser();
  const limit = args?.limit ?? 50;

  // Use raw SQL for LEFT JOIN with users table
  const result = await db.execute(sql`
    SELECT n.*,
           u.full_name as trigger_user_name,
           u.avatar_url as trigger_user_avatar
    FROM shared.notifications n
    LEFT JOIN shared.users u ON n.trigger_id = u.id
    WHERE n.recipient_id = ${user.id}
    ORDER BY n.created_at DESC
    LIMIT ${limit}
  `);

  return result.rows.map((row: Record<string, unknown>) => ({
    id: row.id,
    recipientId: row.recipient_id,
    triggerId: row.trigger_id,
    type: row.type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    isRead: row.is_read,
    payload: row.payload,
    createdAt: row.created_at,
    triggerUserName: row.trigger_user_name ?? "System",
    triggerUserAvatar: row.trigger_user_avatar,
  }));
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<number> {
  const user = await getAuthenticatedUser();

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(shared.notifications)
    .where(
      and(
        eq(shared.notifications.recipientId, user.id),
        eq(shared.notifications.isRead, false)
      )
    );

  return Number(result?.count ?? 0);
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Mark a single notification as read
 */
export async function markAsRead(notificationId: string) {
  const user = await getAuthenticatedUser();

  // Verify ownership
  const result = await db
    .update(shared.notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(shared.notifications.id, notificationId),
        eq(shared.notifications.recipientId, user.id)
      )
    )
    .returning({ id: shared.notifications.id });

  if (result.length === 0) {
    throw new Error("Notification non trouvée");
  }

  revalidatePath("/notifications");
}

/**
 * Mark all notifications as read for the current user
 */
export async function markAllAsRead() {
  const user = await getAuthenticatedUser();

  await db
    .update(shared.notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(shared.notifications.recipientId, user.id),
        eq(shared.notifications.isRead, false)
      )
    );

  revalidatePath("/notifications");
}

// ============================================
// INTERNAL HELPERS
// ============================================

/**
 * Create a notification for a user.
 * Used internally by other server actions (not a server action itself).
 */
export async function notify(args: NotificationPayload) {
  await db.insert(shared.notifications).values({
    recipientId: args.recipientId,
    triggerId: args.triggerId ?? null,
    type: args.type,
    entityType: args.entityType,
    entityId: args.entityId,
    isRead: false,
    payload: args.payload ?? {},
  });
}
