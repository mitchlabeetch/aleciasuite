/**
 * E-Signature Server Actions
 *
 * Manages signature requests and integrates with DocuSeal for e-signatures.
 * Tracks all signing activity in the audit trail.
 */

"use server";

import { db, sign, shared, eq, and, desc } from "@alepanel/db";
import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "./lib/auth";

// ============================================
// TYPES
// ============================================

export interface CreateSignRequestInput {
  dealId?: string;
  documentId?: string;
  signerEmail: string;
  signerName: string;
  title: string;
  message?: string;
  expiresInDays?: number;
}

export interface RecordSignatureInput {
  dealId?: string;
  documentId?: string;
  signerEmail: string;
  signerName: string;
  action:
    | "sent"
    | "opened"
    | "signed"
    | "declined"
    | "expired"
    | "completed"
    | "voided";
  ipAddress?: string;
  signatureHash?: string;
}

// ============================================
// SIGNATURE REQUESTS (Internal tracking)
// ============================================

/**
 * Get all signature requests for a deal
 */
export async function getSignRequests(dealId?: string) {
  const _user = await getAuthenticatedUser();

  if (dealId) {
    // Get requests for a specific deal
    const requests = await db.query.signingAuditTrail.findMany({
      where: eq(sign.signingAuditTrail.dealId, dealId),
      orderBy: [desc(sign.signingAuditTrail.createdAt)],
    });

    return requests;
  }

  // Get all requests (admin view)
  const requests = await db.query.signingAuditTrail.findMany({
    orderBy: [desc(sign.signingAuditTrail.createdAt)],
    limit: 100,
  });

  return requests;
}

/**
 * Get signature requests by signer email
 */
export async function getSignRequestsBySigner(signerEmail: string) {
  const _user = await getAuthenticatedUser();

  const requests = await db.query.signingAuditTrail.findMany({
    where: eq(sign.signingAuditTrail.signerEmail, signerEmail),
    orderBy: [desc(sign.signingAuditTrail.createdAt)],
  });

  return requests;
}

/**
 * Create a signature request
 * Note: This creates an audit trail entry. The actual DocuSeal integration
 * would be done separately via API calls.
 */
export async function createSignRequest(data: CreateSignRequestInput) {
  const _user = await getAuthenticatedUser();

  // Require dealId
  if (!data.dealId) {
    throw new Error("dealId is required");
  }

  // If dealId provided, verify it exists
  const deal = await db.query.deals.findFirst({
    where: eq(shared.deals.id, data.dealId),
  });

  if (!deal) {
    throw new Error("Deal not found");
  }

  // Record the signature request in audit trail
  const [auditEntry] = await db
    .insert(sign.signingAuditTrail)
    .values({
      dealId: data.dealId,
      documentId: data.documentId,
      signerEmail: data.signerEmail,
      signerName: data.signerName,
      action: "sent",
      createdAt: new Date(),
    })
    .returning();

  revalidatePath(`/deals/${data.dealId}/signatures`);

  return auditEntry;
}

/**
 * Record a signature event (signed, declined, etc.)
 */
export async function recordSignatureEvent(data: RecordSignatureInput) {
  const _user = await getAuthenticatedUser();

  // Require dealId
  if (!data.dealId) {
    throw new Error("dealId is required");
  }

  // Get headers for IP if not provided
  let ipAddress = data.ipAddress;
  if (!ipAddress) {
    const headersList = await import("next/headers").then((mod) =>
      mod.headers()
    );
    ipAddress =
      headersList.get("x-forwarded-for") ||
      headersList.get("x-real-ip") ||
      undefined;
  }

  // Record in audit trail
  const [auditEntry] = await db
    .insert(sign.signingAuditTrail)
    .values({
      dealId: data.dealId,
      documentId: data.documentId,
      signerEmail: data.signerEmail,
      signerName: data.signerName,
      action: data.action,
      ipAddress,
      signatureHash: data.signatureHash,
      signedAt: data.action === "signed" ? new Date() : undefined,
      createdAt: new Date(),
    })
    .returning();

  revalidatePath(`/deals/${data.dealId}/signatures`);

  return auditEntry;
}

/**
 * Get signature audit trail for a deal
 */
export async function getSignatureAuditTrail(dealId: string) {
  const _user = await getAuthenticatedUser();

  const trail = await db.query.signingAuditTrail.findMany({
    where: eq(sign.signingAuditTrail.dealId, dealId),
    orderBy: [desc(sign.signingAuditTrail.createdAt)],
  });

  return trail;
}

/**
 * Get signature audit trail for a document
 */
export async function getDocumentSignatureTrail(documentId: string) {
  const _user = await getAuthenticatedUser();

  const trail = await db.query.signingAuditTrail.findMany({
    where: eq(sign.signingAuditTrail.documentId, documentId),
    orderBy: [desc(sign.signingAuditTrail.createdAt)],
  });

  return trail;
}

// ============================================
// DOCUSEAL INTEGRATION HELPERS
// ============================================

/**
 * Webhook handler for DocuSeal events
 * Call this from your API route that receives DocuSeal webhooks
 */
export async function handleDocuSealWebhook(
  dealId: string,
  payload: {
    event_type: string;
    submission?: {
      id: string;
      email: string;
      name: string;
      completed_at?: string;
      declined_at?: string;
      opened_at?: string;
      ip?: string;
    };
    template?: {
      id: string;
      name: string;
    };
  }
) {
  // Map DocuSeal events to our audit trail actions
  let action:
    | "sent"
    | "opened"
    | "signed"
    | "declined"
    | "expired"
    | "completed"
    | "voided" = "sent";

  switch (payload.event_type) {
    case "submission.created":
      action = "sent";
      break;
    case "submission.viewed":
      action = "opened";
      break;
    case "submission.completed":
      action = "completed";
      break;
    case "submission.signed":
      action = "signed";
      break;
    case "submission.declined":
      action = "declined";
      break;
    case "submission.expired":
      action = "expired";
      break;
    case "submission.archived":
      action = "voided";
      break;
    default:
      console.warn(`Unknown DocuSeal event type: ${payload.event_type}`);
      return null;
  }

  if (!payload.submission) {
    return null;
  }

  // Record in audit trail
  const [auditEntry] = await db
    .insert(sign.signingAuditTrail)
    .values({
      dealId,
      signerEmail: payload.submission.email,
      signerName: payload.submission.name,
      action,
      ipAddress: payload.submission.ip,
      signedAt:
        action === "signed" && payload.submission.completed_at
          ? new Date(payload.submission.completed_at)
          : undefined,
      createdAt: new Date(),
    })
    .returning();

  return auditEntry;
}

/**
 * Get signature statistics for a deal
 */
export async function getSignatureStats(dealId: string) {
  const _user = await getAuthenticatedUser();

  const trail = await db.query.signingAuditTrail.findMany({
    where: eq(sign.signingAuditTrail.dealId, dealId),
  });

  const stats = {
    total: trail.length,
    sent: 0,
    opened: 0,
    signed: 0,
    declined: 0,
    expired: 0,
    completed: 0,
    voided: 0,
    pending: 0,
  };

  // Count by action
  const actionCounts = new Map<string, number>();
  for (const entry of trail) {
    actionCounts.set(entry.action, (actionCounts.get(entry.action) || 0) + 1);
  }

  stats.sent = actionCounts.get("sent") || 0;
  stats.opened = actionCounts.get("opened") || 0;
  stats.signed = actionCounts.get("signed") || 0;
  stats.declined = actionCounts.get("declined") || 0;
  stats.expired = actionCounts.get("expired") || 0;
  stats.completed = actionCounts.get("completed") || 0;
  stats.voided = actionCounts.get("voided") || 0;

  // Pending = sent but not signed/declined/expired/completed
  stats.pending =
    stats.sent - (stats.signed + stats.declined + stats.expired + stats.completed);

  return stats;
}

/**
 * Get all signers for a deal (unique emails)
 */
export async function getDealSigners(dealId: string) {
  const _user = await getAuthenticatedUser();

  const trail = await db.query.signingAuditTrail.findMany({
    where: eq(sign.signingAuditTrail.dealId, dealId),
  });

  // Group by signer email
  const signerMap = new Map<
    string,
    {
      email: string;
      name: string;
      lastAction: string;
      lastActionAt: Date;
      signed: boolean;
    }
  >();

  for (const entry of trail) {
    const existing = signerMap.get(entry.signerEmail);

    if (
      !existing ||
      (entry.createdAt && existing.lastActionAt && entry.createdAt.getTime() > existing.lastActionAt.getTime())
    ) {
      signerMap.set(entry.signerEmail, {
        email: entry.signerEmail,
        name: entry.signerName ?? "",
        lastAction: entry.action,
        lastActionAt: entry.createdAt ?? new Date(),
        signed: entry.action === "signed" || entry.action === "completed",
      });
    }
  }

  return Array.from(signerMap.values());
}
