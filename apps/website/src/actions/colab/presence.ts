"use server";

/**
 * Colab Presence Server Actions
 *
 * Real-time presence tracking for collaborative editing.
 * Ported from Convex to Drizzle ORM + PostgreSQL.
 */

import { db, colab, eq, and, gt } from "@alepanel/db";
import { getAuthenticatedUser } from "../lib/auth";
import { revalidatePath } from "next/cache";

// Update presence (called periodically by clients)
export async function heartbeat(args: {
  documentName: string;
  cursorPosition?: any;
}) {
  const user = await getAuthenticatedUser();

  // Find existing presence entry
  const existing = await db.query.presence.findFirst({
    where: and(
      eq(colab.presence.userId, user.id),
      eq(colab.presence.documentName, args.documentName)
    ),
  });

  const now = new Date();

  if (existing) {
    // Update existing presence
    await db
      .update(colab.presence)
      .set({
        cursorPosition: args.cursorPosition || existing.cursorPosition,
        lastSeenAt: now,
      })
      .where(eq(colab.presence.id, existing.id));
  } else {
    // Create new presence entry
    await db.insert(colab.presence).values({
      userId: user.id,
      documentName: args.documentName,
      cursorPosition: args.cursorPosition || {},
      lastSeenAt: now,
    });
  }

  revalidatePath(`/colab/documents/${args.documentName}`);
}

// Get active users for a document (active within last 30 seconds)
export async function getActiveUsers(documentName: string) {
  const user = await getAuthenticatedUser();

  const cutoff = new Date(Date.now() - 30000); // 30 seconds ago

  const presences = await db.query.presence.findMany({
    where: and(
      eq(colab.presence.documentName, documentName),
      gt(colab.presence.lastSeenAt, cutoff)
    ),
  });

  return presences;
}

// Leave a document (explicit disconnect)
export async function leaveDocument(documentName: string) {
  const user = await getAuthenticatedUser();

  const existing = await db.query.presence.findFirst({
    where: and(
      eq(colab.presence.userId, user.id),
      eq(colab.presence.documentName, documentName)
    ),
  });

  if (existing) {
    await db.delete(colab.presence).where(eq(colab.presence.id, existing.id));
  }

  revalidatePath(`/colab/documents/${documentName}`);
}

// Cleanup stale presence entries (called by cron or admin)
export async function cleanupStalePresence() {
  const _user = await getAuthenticatedUser();

  // TODO: Add admin check here
  // For now, anyone can call this (should be restricted to cron/admin)

  const cutoff = new Date(Date.now() - 60000); // 1 minute ago

  const staleEntries = await db.query.presence.findMany({
    where: gt(colab.presence.lastSeenAt, cutoff),
  });

  let cleaned = 0;
  for (const entry of staleEntries) {
    // Double-check the timestamp (query might not have filtered correctly)
    if (entry.lastSeenAt && entry.lastSeenAt < cutoff) {
      await db.delete(colab.presence).where(eq(colab.presence.id, entry.id));
      cleaned++;
    }
  }

  return { cleaned };
}
