"use server";

/**
 * Colab Yjs Server Actions
 *
 * Real-time collaborative editing backend using Yjs CRDT.
 * Ported from Convex to Drizzle ORM + PostgreSQL.
 *
 * This provides the backend for Hocuspocus to sync Yjs state.
 */

import { db, colab, eq, gt, and, gte, asc } from "@alepanel/db";
import { getAuthenticatedUser } from "../lib/auth";
import { revalidatePath } from "next/cache";

// Get the current Yjs document state for initial sync
export async function getYjsState(documentName: string) {
  const user = await getAuthenticatedUser();

  // TODO: Verify user has access to this document
  // For now, just check authentication

  const yjsDoc = await db.query.yjsState.findFirst({
    where: eq(colab.yjsState.documentName, documentName),
  });

  if (!yjsDoc) {
    return null;
  }

  return {
    state: yjsDoc.state,
    updatedAt: yjsDoc.updatedAt,
  };
}

// Save the full Yjs document state (for persistence)
export async function saveYjsState(args: {
  documentName: string;
  state: Buffer;
}) {
  const user = await getAuthenticatedUser();

  // TODO: Verify user has write access to this document
  // For now, just check authentication

  const existing = await db.query.yjsState.findFirst({
    where: eq(colab.yjsState.documentName, args.documentName),
  });

  if (existing) {
    // Update existing
    await db
      .update(colab.yjsState)
      .set({
        state: args.state,
        updatedAt: new Date(),
      })
      .where(eq(colab.yjsState.documentName, args.documentName));
  } else {
    // Create new
    await db.insert(colab.yjsState).values({
      documentName: args.documentName,
      state: args.state,
      updatedAt: new Date(),
    });
  }

  revalidatePath(`/colab/documents/${args.documentName}`);
}

// Delete Yjs state for a document
export async function deleteYjsState(documentName: string) {
  const user = await getAuthenticatedUser();

  // TODO: Verify user has delete access to this document
  // For now, just check authentication

  await db
    .delete(colab.yjsState)
    .where(eq(colab.yjsState.documentName, documentName));

  revalidatePath(`/colab/documents/${documentName}`);
}

// List all Yjs documents (for admin/debugging)
export async function listYjsDocuments() {
  const user = await getAuthenticatedUser();

  // TODO: Add admin check here

  const documents = await db.query.yjsState.findMany();

  return documents.map((doc) => ({
    documentName: doc.documentName,
    updatedAt: doc.updatedAt,
    stateSize: doc.state ? doc.state.length : 0,
  }));
}

// ============================================================================
// Yjs Incremental Updates & Awareness (Hocuspocus integration)
// ============================================================================

// Get Yjs incremental updates since a specific time
export async function getYjsUpdates(args: {
  documentName: string;
  since?: Date;
}) {
  const user = await getAuthenticatedUser();

  // TODO: Verify user has access to this document
  // For now, just check authentication

  const query = db
    .select()
    .from(colab.yjsUpdates)
    .where(eq(colab.yjsUpdates.documentName, args.documentName))
    .orderBy(asc(colab.yjsUpdates.createdAt));

  if (args.since) {
    const updates = await db
      .select()
      .from(colab.yjsUpdates)
      .where(
        and(
          eq(colab.yjsUpdates.documentName, args.documentName),
          gte(colab.yjsUpdates.createdAt, args.since)
        )
      )
      .orderBy(asc(colab.yjsUpdates.createdAt));

    return updates.map((u) => ({
      id: u.id,
      updateData: u.updateData,
      clientId: u.clientId,
      createdAt: u.createdAt,
    }));
  }

  const updates = await query;

  return updates.map((u) => ({
    id: u.id,
    updateData: u.updateData,
    clientId: u.clientId,
    createdAt: u.createdAt,
  }));
}

// Push a Yjs incremental update
export async function pushYjsUpdate(args: {
  documentName: string;
  updateData: Buffer;
  clientId?: string;
}) {
  const user = await getAuthenticatedUser();

  // TODO: Verify user has write access to this document
  // For now, just check authentication

  const [update] = await db
    .insert(colab.yjsUpdates)
    .values({
      documentName: args.documentName,
      updateData: args.updateData,
      clientId: args.clientId || null,
    })
    .returning();

  return { id: update.id, createdAt: update.createdAt };
}

// Get Yjs awareness states for a document (active users/cursors)
export async function getYjsAwareness(documentName: string) {
  const user = await getAuthenticatedUser();

  // TODO: Verify user has access to this document
  // For now, just check authentication

  // Filter out stale awareness (older than 30 seconds)
  const staleThreshold = new Date(Date.now() - 30000);

  const awareness = await db
    .select()
    .from(colab.yjsAwareness)
    .where(
      and(
        eq(colab.yjsAwareness.documentName, documentName),
        gte(colab.yjsAwareness.lastSeenAt, staleThreshold)
      )
    );

  return awareness.map((a) => ({
    id: a.id,
    clientId: a.clientId,
    userId: a.userId,
    awarenessData: a.awarenessData,
    lastSeenAt: a.lastSeenAt,
  }));
}

// Update or create Yjs awareness state (upsert by document_name + client_id)
export async function updateYjsAwareness(args: {
  documentName: string;
  clientId: string;
  awarenessData: any;
}) {
  const user = await getAuthenticatedUser();

  // TODO: Verify user has access to this document
  // For now, just check authentication

  // Upsert: insert or update if (documentName, clientId) already exists
  await db
    .insert(colab.yjsAwareness)
    .values({
      documentName: args.documentName,
      clientId: args.clientId,
      userId: user.id,
      awarenessData: args.awarenessData,
      lastSeenAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [colab.yjsAwareness.documentName, colab.yjsAwareness.clientId],
      set: {
        userId: user.id,
        awarenessData: args.awarenessData,
        lastSeenAt: new Date(),
      },
    });
}

// Remove Yjs awareness state (user disconnected)
export async function removeYjsAwareness(args: {
  documentName: string;
  clientId: string;
}) {
  const user = await getAuthenticatedUser();

  // TODO: Verify user has access to this document
  // For now, just check authentication

  await db
    .delete(colab.yjsAwareness)
    .where(
      and(
        eq(colab.yjsAwareness.documentName, args.documentName),
        eq(colab.yjsAwareness.clientId, args.clientId)
      )
    );
}
