"use server";

/**
 * Presence Module - Real-time Collaboration Tracking
 *
 * Ported from Convex to Next.js Server Actions with Drizzle ORM.
 * Shows who's online and what page they're viewing.
 */

import { db, shared, eq, gt } from "@alepanel/db";
import { getAuthenticatedUser } from "./lib/auth";
import { revalidatePath } from "next/cache";

// =============================================================================
// Constants
// =============================================================================

// Presence timeout in milliseconds (2 minutes)
const PRESENCE_TIMEOUT_MS = 2 * 60 * 1000;

// =============================================================================
// Types
// =============================================================================

export interface ActiveUser {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  currentPage: string;
  lastSeen: Date;
  isOnline: true;
}

// =============================================================================
// Queries
// =============================================================================

/**
 * Get all currently active users
 * Filters out stale presence data (older than 2 minutes)
 */
export async function getActiveUsers(): Promise<ActiveUser[]> {
  try {
    await getAuthenticatedUser(); // Verify authentication

    const now = new Date();
    const cutoffTime = new Date(now.getTime() - PRESENCE_TIMEOUT_MS);

    // Query presence records, filter by lastSeen
    const allPresence = await db
      .select()
      .from(shared.presence)
      .where(gt(shared.presence.lastSeen, cutoffTime));

    // Fetch user information for each presence record
    const activeUsers: ActiveUser[] = [];

    for (const presence of allPresence) {
      const [user] = await db
        .select({
          id: shared.users.id,
          fullName: shared.users.fullName,
          email: shared.users.email,
          avatarUrl: shared.users.avatarUrl,
        })
        .from(shared.users)
        .where(eq(shared.users.id, presence.userId));

      if (user) {
        activeUsers.push({
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          avatarUrl: user.avatarUrl,
          currentPage: presence.currentPage,
          lastSeen: presence.lastSeen,
          isOnline: true,
        });
      }
    }

    return activeUsers;
  } catch {
    return [];
  }
}

// =============================================================================
// Mutations
// =============================================================================

/**
 * Update current user's presence
 * Called periodically by the client (every 30 seconds)
 */
export async function updatePresence(currentPage: string): Promise<{
  success: boolean;
}> {
  try {
    const authUser = await getAuthenticatedUser();

    // Find the user
    const [user] = await db
      .select()
      .from(shared.users)
      .where(eq(shared.users.authProviderId, authUser.id));

    if (!user) {
      return { success: false };
    }

    // Check if presence record exists
    const [existingPresence] = await db
      .select()
      .from(shared.presence)
      .where(eq(shared.presence.userId, user.id));

    const now = new Date();

    if (existingPresence) {
      // Update existing presence
      await db
        .update(shared.presence)
        .set({
          currentPage,
          lastSeen: now,
        })
        .where(eq(shared.presence.id, existingPresence.id));
    } else {
      // Create new presence record
      await db.insert(shared.presence).values({
        userId: user.id,
        currentPage,
        lastSeen: now,
      });
    }

    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false };
  }
}

/**
 * Remove user presence on logout
 */
export async function removePresence(): Promise<{
  success: boolean;
}> {
  try {
    const authUser = await getAuthenticatedUser();

    // Find the user
    const [user] = await db
      .select()
      .from(shared.users)
      .where(eq(shared.users.authProviderId, authUser.id));

    if (!user) {
      return { success: false };
    }

    // Find and delete presence record
    const [existingPresence] = await db
      .select()
      .from(shared.presence)
      .where(eq(shared.presence.userId, user.id));

    if (existingPresence) {
      await db
        .delete(shared.presence)
        .where(eq(shared.presence.id, existingPresence.id));
    }

    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false };
  }
}

/**
 * Cleanup stale presence records
 * Called periodically by a cron job or manually
 */
export async function cleanupStalePresence(): Promise<{
  cleaned: number;
}> {
  const now = new Date();
  const cutoffTime = new Date(now.getTime() - PRESENCE_TIMEOUT_MS);

  // Get all presence records
  const allPresence = await db
    .select()
    .from(shared.presence);

  // Filter stale records
  const stalePresence = allPresence.filter(
    (p) => p.lastSeen <= cutoffTime
  );

  // Delete stale records
  for (const presence of stalePresence) {
    await db
      .delete(shared.presence)
      .where(eq(shared.presence.id, presence.id));
  }

  revalidatePath("/");
  return { cleaned: stalePresence.length };
}
