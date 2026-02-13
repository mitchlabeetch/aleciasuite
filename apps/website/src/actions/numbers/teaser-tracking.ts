/**
 * Numbers Teaser Tracking Server Actions
 *
 * Handles tracking of teaser and IM (Information Memorandum) distribution
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

export interface CreateTeaserTrackingInput {
  dealId: string;
  name?: string;
  recipientCompany: string;
  recipientContact?: string;
  sentAt?: Date;
  status: "pending" | "sent" | "opened" | "nda_signed" | "im_sent" | "declined";
  notes?: string;
}

export interface UpdateTeaserTrackingInput {
  recipientCompany?: string;
  recipientContact?: string;
  sentAt?: Date;
  openedAt?: Date;
  ndaSignedAt?: Date;
  imSentAt?: Date;
  status?: "pending" | "sent" | "opened" | "nda_signed" | "im_sent" | "declined";
  notes?: string;
}

// ============================================
// TEASER TRACKING ACTIONS
// ============================================

/**
 * Create a new teaser tracking entry
 */
export async function createTeaserTracking(data: CreateTeaserTrackingInput) {
  const user = await getAuthenticatedUser();

  const [tracking] = await db
    .insert(numbers.teaserTracking)
    .values({
      dealId: data.dealId,
      recipientCompany: data.recipientCompany,
      recipientContact: data.recipientContact,
      sentAt: data.sentAt,
      status: data.status,
      notes: data.notes,
      createdAt: new Date(),
    })
    .returning();

  revalidatePath("/admin/numbers/teaser-tracking");
  revalidatePath(`/deals/${data.dealId}/teaser`);

  return tracking;
}

/**
 * Update a teaser tracking entry
 */
export async function updateTeaserTracking(id: string, data: UpdateTeaserTrackingInput) {
  const user = await getAuthenticatedUser();

  const existing = await db.query.teaserTracking.findFirst({
    where: eq(numbers.teaserTracking.id, id),
  });

  if (!existing) {
    throw new Error("Teaser tracking entry not found");
  }

  const [updated] = await db
    .update(numbers.teaserTracking)
    .set({
      ...data,
    })
    .where(eq(numbers.teaserTracking.id, id))
    .returning();

  revalidatePath("/admin/numbers/teaser-tracking");
  if (existing.dealId) {
    revalidatePath(`/deals/${existing.dealId}/teaser`);
  }

  return updated;
}

/**
 * Get all teaser tracking entries for a deal
 */
export async function getDealTeaserTracking(dealId: string) {
  const user = await getAuthenticatedUser();

  const tracking = await db.query.teaserTracking.findMany({
    where: eq(numbers.teaserTracking.dealId, dealId),
    orderBy: [desc(numbers.teaserTracking.sentAt), desc(numbers.teaserTracking.createdAt)],
  });

  return tracking;
}

/**
 * Get all teaser tracking entries (with optional limit)
 */
export async function getAllTeaserTracking(limit: number = 50) {
  const user = await getAuthenticatedUser();

  const tracking = await db.query.teaserTracking.findMany({
    orderBy: [desc(numbers.teaserTracking.createdAt)],
    limit,
  });

  return tracking;
}

/**
 * Get a specific teaser tracking entry
 */
export async function getTeaserTracking(id: string) {
  const user = await getAuthenticatedUser();

  const tracking = await db.query.teaserTracking.findFirst({
    where: eq(numbers.teaserTracking.id, id),
  });

  if (!tracking) {
    throw new Error("Teaser tracking entry not found");
  }

  return tracking;
}

/**
 * Delete a teaser tracking entry
 */
export async function deleteTeaserTracking(id: string) {
  const user = await getAuthenticatedUser();

  const tracking = await db.query.teaserTracking.findFirst({
    where: eq(numbers.teaserTracking.id, id),
  });

  if (!tracking) {
    throw new Error("Teaser tracking entry not found");
  }

  await db.delete(numbers.teaserTracking).where(eq(numbers.teaserTracking.id, id));

  revalidatePath("/admin/numbers/teaser-tracking");
  if (tracking.dealId) {
    revalidatePath(`/deals/${tracking.dealId}/teaser`);
  }

  return true;
}

/**
 * Mark teaser as opened
 */
export async function markTeaserOpened(id: string) {
  const user = await getAuthenticatedUser();

  const tracking = await db.query.teaserTracking.findFirst({
    where: eq(numbers.teaserTracking.id, id),
  });

  if (!tracking) {
    throw new Error("Teaser tracking entry not found");
  }

  const [updated] = await db
    .update(numbers.teaserTracking)
    .set({
      openedAt: new Date(),
      status: "opened",
    })
    .where(eq(numbers.teaserTracking.id, id))
    .returning();

  revalidatePath("/admin/numbers/teaser-tracking");
  if (tracking.dealId) {
    revalidatePath(`/deals/${tracking.dealId}/teaser`);
  }

  return updated;
}

/**
 * Mark NDA as signed
 */
export async function markNdaSigned(id: string) {
  const user = await getAuthenticatedUser();

  const tracking = await db.query.teaserTracking.findFirst({
    where: eq(numbers.teaserTracking.id, id),
  });

  if (!tracking) {
    throw new Error("Teaser tracking entry not found");
  }

  const [updated] = await db
    .update(numbers.teaserTracking)
    .set({
      ndaSignedAt: new Date(),
      status: "nda_signed",
    })
    .where(eq(numbers.teaserTracking.id, id))
    .returning();

  revalidatePath("/admin/numbers/teaser-tracking");
  if (tracking.dealId) {
    revalidatePath(`/deals/${tracking.dealId}/teaser`);
  }

  return updated;
}

/**
 * Mark IM as sent
 */
export async function markImSent(id: string) {
  const user = await getAuthenticatedUser();

  const tracking = await db.query.teaserTracking.findFirst({
    where: eq(numbers.teaserTracking.id, id),
  });

  if (!tracking) {
    throw new Error("Teaser tracking entry not found");
  }

  const [updated] = await db
    .update(numbers.teaserTracking)
    .set({
      imSentAt: new Date(),
      status: "im_sent",
    })
    .where(eq(numbers.teaserTracking.id, id))
    .returning();

  revalidatePath("/admin/numbers/teaser-tracking");
  if (tracking.dealId) {
    revalidatePath(`/deals/${tracking.dealId}/teaser`);
  }

  return updated;
}

/**
 * Bulk create teaser tracking entries (for importing buyer lists)
 */
export async function bulkCreateTeaserTracking(
  dealId: string,
  recipients: Array<{
    company: string;
    contact?: string;
    notes?: string;
  }>
) {
  const user = await getAuthenticatedUser();

  const now = new Date();

  const inserted = await db
    .insert(numbers.teaserTracking)
    .values(
      recipients.map((r) => ({
        dealId,
        recipientCompany: r.company,
        recipientContact: r.contact,
        status: "pending" as const,
        notes: r.notes,
        createdAt: now,
      }))
    )
    .returning();

  revalidatePath("/admin/numbers/teaser-tracking");
  revalidatePath(`/deals/${dealId}/teaser`);

  return inserted;
}
