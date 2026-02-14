/**
 * Approval Workflow Server Actions
 *
 * Replaces Convex approvals.ts with PostgreSQL + Drizzle
 * Generic approval system for documents, teasers, LOIs, emails, data rooms, etc.
 * Supports single/multi-reviewer, sequential/any/all approval types
 */

"use server";

import { db, shared, bi, eq, and, desc, sql } from "@alepanel/db";
import { getAuthenticatedUser } from "./lib/auth";
import { revalidatePath } from "next/cache";

// ============================================
// TYPES
// ============================================

export type EntityType =
  | "deal"
  | "document"
  | "page"
  | "expense";

export type Priority = "low" | "medium" | "high" | "urgent";

export type ApprovalType = "any" | "all" | "sequential";

export type ApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "expired";

export type ReviewDecision = "approved" | "rejected";

export interface CreateApprovalRequestInput {
  entityType: EntityType;
  entityId: string;
  dealId?: string;
  title: string;
  description?: string;
  requiredApprovals: number;
  approvalType: ApprovalType;
  assignedReviewers: string[];
  priority: Priority;
  dueDate?: number;
  entitySnapshot?: string;
  templateId?: string;
}

export interface CreateFromTemplateInput {
  templateId: string;
  entityType: EntityType;
  entityId: string;
  dealId?: string;
  title: string;
  description?: string;
  assignedReviewers?: string[];
  entitySnapshot?: string;
}

export interface SubmitReviewInput {
  requestId: string;
  decision: ReviewDecision;
  comment?: string;
}

export interface UpdateRequestInput {
  requestId: string;
  title?: string;
  description?: string;
  priority?: Priority;
  dueDate?: number;
  assignedReviewers?: string[];
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  entityType: EntityType;
  requiredApprovals: number;
  approvalType: ApprovalType;
  defaultReviewers: string[];
  autoAssignRules?: {
    defaultPriority?: Priority;
    defaultDueDays?: number;
    autoExpireDays?: number;
  };
  isDefault: boolean;
}

export interface UpdateTemplateInput extends Partial<CreateTemplateInput> {
  templateId: string;
  isActive?: boolean;
}

// ============================================
// QUERIES - Approval Requests
// ============================================

/**
 * Get a single approval request with all reviews
 */
export async function getApprovalRequest(requestId: string) {
  const user = await getAuthenticatedUser();

  // Get request
  const requests = await db
    .select()
    .from(bi.approvalRequests)
    .where(eq(bi.approvalRequests.id, requestId));

  const request = requests[0];
  if (!request) return null;

  // Check access: user is requester, reviewer, or has elevated role
  const metadata = request.metadata as { assignedReviewers?: string[] } | null;
  const assignedReviewers = metadata?.assignedReviewers ?? [];
  const isRequester = request.requestedBy === user.id;
  const isReviewer = assignedReviewers.includes(user.id);
  const hasElevatedRole = ["sudo", "partner"].includes(user.role ?? "");

  if (!isRequester && !isReviewer && !hasElevatedRole) {
    throw new Error("Not authorized to view this approval request");
  }

  // Get all reviews with reviewer info using raw SQL for JOIN
  const reviewsResult = await db.execute(sql`
    SELECT
      r.*,
      u.full_name as reviewer_name,
      u.email as reviewer_email
    FROM alecia_bi.approval_reviews r
    LEFT JOIN shared.users u ON r.reviewer_id = u.id
    WHERE r.request_id = ${requestId}
    ORDER BY r.decided_at DESC
  `);

  // Get requester info
  const requesterResult = await db.execute(sql`
    SELECT full_name, email FROM shared.users WHERE id = ${request.requestedBy}
  `);

  const requester = requesterResult.rows[0];

  // Get assigned reviewers info
  const reviewersResult = await db.execute(sql`
    SELECT id, full_name as name, email
    FROM shared.users
    WHERE id = ANY(${assignedReviewers})
  `);

  const reviews = reviewsResult.rows;
  const reviewerMap = new Map(
    reviewersResult.rows.map((r: any) => [r.id, r])
  );

  const reviewers = assignedReviewers.map((id: string) => {
    const reviewer = reviewerMap.get(id);
    const hasReviewed = reviews.some((r: any) => r.reviewer_id === id);
    const review = reviews.find((r: any) => r.reviewer_id === id);

    return {
      _id: id,
      name: reviewer?.name ?? "Unknown",
      email: reviewer?.email,
      hasReviewed,
      review,
    };
  });

  return {
    ...request,
    requesterName: requester?.full_name ?? "Unknown",
    requesterEmail: requester?.email,
    reviews,
    reviewers,
    approvalCount: reviews.filter((r: any) => r.decision === "approved").length,
    rejectionCount: reviews.filter((r: any) => r.decision === "rejected").length,
  };
}

/**
 * List pending approval requests assigned to the current user
 */
export async function listPendingForUser(limit = 50) {
  const user = await getAuthenticatedUser();

  const result = await db.execute(sql`
    SELECT
      ar.*,
      u.full_name as requester_name
    FROM alecia_bi.approval_requests ar
    LEFT JOIN shared.users u ON ar.requested_by = u.id
    WHERE
      ar.status = 'pending'
      AND ${user.id} = ANY(
        COALESCE((ar.metadata->'assignedReviewers')::jsonb, '[]'::jsonb)::text[]
      )
      AND NOT EXISTS (
        SELECT 1 FROM alecia_bi.approval_reviews
        WHERE request_id = ar.id AND reviewer_id = ${user.id}
      )
    ORDER BY
      CASE ar.priority
        WHEN 'urgent' THEN 0
        WHEN 'high' THEN 1
        WHEN 'medium' THEN 2
        WHEN 'low' THEN 3
      END,
      ar.due_date ASC NULLS LAST,
      ar.created_at DESC
    LIMIT ${limit}
  `);

  return result.rows;
}

/**
 * List approval requests created by the current user
 */
export async function listMyRequests(status?: ApprovalStatus, limit = 50) {
  const user = await getAuthenticatedUser();

  const conditions = [eq(bi.approvalRequests.requestedBy, user.id)];

  if (status) {
    conditions.push(eq(bi.approvalRequests.status, status));
  }

  const result = await db.execute(sql`
    SELECT
      ar.*,
      (SELECT COUNT(*) FROM alecia_bi.approval_reviews WHERE request_id = ar.id AND decision = 'approved') as approval_count,
      (SELECT COUNT(*) FROM alecia_bi.approval_reviews WHERE request_id = ar.id AND decision = 'rejected') as rejection_count,
      (SELECT COUNT(*) FROM alecia_bi.approval_reviews WHERE request_id = ar.id) as total_reviews
    FROM alecia_bi.approval_requests ar
    WHERE ${and(...conditions)}
    ORDER BY ar.created_at DESC
    LIMIT ${limit}
  `);

  return result.rows;
}

/**
 * List approval requests for a specific deal
 */
export async function listByDeal(dealId: string, status?: ApprovalStatus) {
  const _user = await getAuthenticatedUser();

  const conditions = [eq(bi.approvalRequests.dealId, dealId)];

  if (status) {
    conditions.push(eq(bi.approvalRequests.status, status));
  }

  const result = await db.execute(sql`
    SELECT
      ar.*,
      u.full_name as requester_name,
      (SELECT COUNT(*) FROM alecia_bi.approval_reviews WHERE request_id = ar.id AND decision = 'approved') as approval_count,
      (SELECT COUNT(*) FROM alecia_bi.approval_reviews WHERE request_id = ar.id AND decision = 'rejected') as rejection_count,
      (SELECT COUNT(*) FROM alecia_bi.approval_reviews WHERE request_id = ar.id) as total_reviews
    FROM alecia_bi.approval_requests ar
    LEFT JOIN shared.users u ON ar.requested_by = u.id
    WHERE ${and(...conditions)}
    ORDER BY ar.created_at DESC
  `);

  return result.rows;
}

/**
 * List approval requests for a specific entity
 */
export async function listByEntity(entityType: EntityType, entityId: string) {
  const _user = await getAuthenticatedUser();

  const requests = await db
    .select()
    .from(bi.approvalRequests)
    .where(
      and(
        eq(bi.approvalRequests.entityType, entityType),
        eq(bi.approvalRequests.entityId, entityId)
      )
    )
    .orderBy(desc(bi.approvalRequests.createdAt));

  return requests;
}

// ============================================
// QUERIES - Templates
// ============================================

/**
 * Get all available approval templates
 */
export async function getTemplates(entityType?: EntityType, activeOnly = true) {
  const _user = await getAuthenticatedUser();

  const conditions = [];

  if (activeOnly) {
    conditions.push(eq(bi.approvalTemplates.isActive, true));
  }

  if (entityType) {
    conditions.push(eq(bi.approvalTemplates.entityType, entityType));
  }

  const templates = await db
    .select()
    .from(bi.approvalTemplates)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(bi.approvalTemplates.name);

  return templates;
}

/**
 * Get the default template for an entity type
 */
export async function getDefaultTemplate(entityType: EntityType) {
  const templates = await db
    .select()
    .from(bi.approvalTemplates)
    .where(
      and(
        eq(bi.approvalTemplates.isActive, true),
        eq(bi.approvalTemplates.isDefault, true),
        eq(bi.approvalTemplates.entityType, entityType)
      )
    )
    .limit(1);

  return templates[0] ?? null;
}

// ============================================
// MUTATIONS - Approval Requests
// ============================================

/**
 * Create a new approval request
 */
export async function createApprovalRequest(input: CreateApprovalRequestInput) {
  const _user = await getAuthenticatedUser();
  const _now = Date.now();

  // Validate reviewers exist
  for (const reviewerId of input.assignedReviewers) {
    const reviewers = await db
      .select({ id: shared.users.id })
      .from(shared.users)
      .where(eq(shared.users.id, reviewerId));

    if (reviewers.length === 0) {
      throw new Error(`Reviewer ${reviewerId} not found`);
    }
  }

  // Validate required approvals
  if (input.approvalType === "all") {
    if (input.requiredApprovals !== input.assignedReviewers.length) {
      throw new Error(
        "For 'all' approval type, required approvals must equal reviewer count"
      );
    }
  } else if (input.requiredApprovals > input.assignedReviewers.length) {
    throw new Error(
      "Required approvals cannot exceed the number of assigned reviewers"
    );
  }

  // Check for existing pending request on same entity
  const existing = await db
    .select({ id: bi.approvalRequests.id })
    .from(bi.approvalRequests)
    .where(
      and(
        eq(bi.approvalRequests.entityType, input.entityType),
        eq(bi.approvalRequests.entityId, input.entityId),
        eq(bi.approvalRequests.status, "pending")
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw new Error(
      "An active approval request already exists for this entity"
    );
  }

  const [request] = await db
    .insert(bi.approvalRequests)
    .values({
      entityType: input.entityType,
      entityId: input.entityId,
      dealId: input.dealId ?? null,
      title: input.title,
      description: input.description ?? null,
      requestedBy: user.id,
      requiredApprovals: input.requiredApprovals,
      approvalType: input.approvalType,
      status: "pending",
      priority: input.priority,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      currentStep: input.approvalType === "sequential" ? 1 : null,
      templateId: input.templateId ?? null,
      metadata: {
        assignedReviewers: input.assignedReviewers,
        entitySnapshot: input.entitySnapshot,
      },
    })
    .returning();

  revalidatePath("/approvals");
  revalidatePath("/deals");

  return request.id;
}

/**
 * Create approval request from a template
 */
export async function createFromTemplate(input: CreateFromTemplateInput) {
  const user = await getAuthenticatedUser();
  const now = Date.now();

  // Get template
  const templates = await db
    .select()
    .from(bi.approvalTemplates)
    .where(eq(bi.approvalTemplates.id, input.templateId));

  const template = templates[0];

  if (!template) {
    throw new Error("Template not found");
  }

  if (!template.isActive) {
    throw new Error("Template is not active");
  }

  if (template.entityType !== input.entityType) {
    throw new Error("Template does not support this entity type");
  }

  // Get reviewers - use provided or find by role
  const reviewers = input.assignedReviewers ?? [];

  const defaultReviewers = (template.defaultReviewers as string[]) ?? [];
  const autoAssignRules = template.autoAssignRules as {
    defaultPriority?: Priority;
    defaultDueDays?: number;
    autoExpireDays?: number;
  } | null;

  if (reviewers.length === 0 && defaultReviewers.length > 0) {
    // defaultReviewers can be user IDs or role names
    // Check if they are valid user IDs first
    const userIds = [];
    const roleNames = [];

    for (const reviewer of defaultReviewers) {
      // Try to check if it's a valid UUID (user ID)
      if (reviewer.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        userIds.push(reviewer);
      } else {
        roleNames.push(reviewer);
      }
    }

    // Add direct user IDs
    reviewers.push(...userIds);

    // Find users by role
    if (roleNames.length > 0) {
      const rolesResult = await db.execute(sql`
        SELECT id FROM shared.users
        WHERE role = ANY(${roleNames})
          AND is_active = true
      `);
      reviewers.push(...rolesResult.rows.map((r: any) => r.id));
    }
  }

  if (reviewers.length === 0) {
    throw new Error("No reviewers assigned and no default reviewers found");
  }

  // Calculate dates
  const dueDate = autoAssignRules?.defaultDueDays
    ? new Date(now + autoAssignRules.defaultDueDays * 24 * 60 * 60 * 1000)
    : null;

  const [request] = await db
    .insert(bi.approvalRequests)
    .values({
      entityType: input.entityType,
      entityId: input.entityId,
      dealId: input.dealId ?? null,
      title: input.title,
      description: input.description ?? null,
      requestedBy: user.id,
      requiredApprovals: template.requiredApprovals,
      approvalType: template.approvalType,
      status: "pending",
      priority: autoAssignRules?.defaultPriority ?? "medium",
      dueDate: dueDate,
      currentStep: template.approvalType === "sequential" ? 1 : null,
      templateId: input.templateId,
      metadata: {
        assignedReviewers: reviewers,
        entitySnapshot: input.entitySnapshot,
      },
    })
    .returning();

  revalidatePath("/approvals");

  return request.id;
}

/**
 * Submit a review (approve/reject/request changes)
 */
export async function submitReview(input: SubmitReviewInput) {
  const _user = await getAuthenticatedUser();
  const _now = Date.now();

  // Get request
  const requests = await db
    .select()
    .from(bi.approvalRequests)
    .where(eq(bi.approvalRequests.id, input.requestId));

  const request = requests[0];

  if (!request) {
    throw new Error("Approval request not found");
  }

  // Check if request is still actionable
  if (!["pending"].includes(request.status)) {
    throw new Error(`Cannot review a ${request.status} request`);
  }

  // Get assigned reviewers from metadata
  const metadata = request.metadata as { assignedReviewers?: string[] } | null;
  const assignedReviewers = metadata?.assignedReviewers ?? [];

  // Check if user is an assigned reviewer
  if (!assignedReviewers.includes(user.id)) {
    throw new Error("You are not an assigned reviewer for this request");
  }

  // Check for sequential approval order
  if (request.approvalType === "sequential") {
    const currentIndex = (request.currentStep ?? 1) - 1;
    const userIndex = assignedReviewers.indexOf(user.id);

    if (userIndex !== currentIndex) {
      throw new Error("It is not your turn to review in this sequence");
    }
  }

  // Check if user has already reviewed
  const existingReview = await db
    .select({ id: bi.approvalReviews.id })
    .from(bi.approvalReviews)
    .where(
      and(
        eq(bi.approvalReviews.requestId, input.requestId),
        eq(bi.approvalReviews.reviewerId, user.id)
      )
    );

  if (existingReview.length > 0) {
    throw new Error("You have already reviewed this request");
  }

  // Create the review
  await db
    .insert(bi.approvalReviews)
    .values({
      requestId: input.requestId,
      reviewerId: user.id,
      decision: input.decision,
      comment: input.comment ?? null,
      step: request.approvalType === "sequential" ? request.currentStep : null,
      decidedAt: new Date(),
    });

  // Get all reviews to determine final status
  const allReviews = await db
    .select({ decision: bi.approvalReviews.decision })
    .from(bi.approvalReviews)
    .where(eq(bi.approvalReviews.requestId, input.requestId));

  const approvalCount = allReviews.filter((r) => r.decision === "approved").length;
  const rejectionCount = allReviews.filter((r) => r.decision === "rejected").length;

  // Check for final decision
  let finalStatus: ApprovalStatus | null = null;

  // Approved if we have enough approvals
  if (approvalCount >= request.requiredApprovals) {
    finalStatus = "approved";
  }

  // Rejected logic depends on approval type
  if (!finalStatus) {
    if (request.approvalType === "all") {
      // Any rejection means rejected
      if (rejectionCount > 0) {
        finalStatus = "rejected";
      }
    } else if (request.approvalType === "any") {
      // Rejected if impossible to reach required approvals
      const remainingReviewers =
        assignedReviewers.length - allReviews.length;
      if (approvalCount + remainingReviewers < request.requiredApprovals) {
        finalStatus = "rejected";
      }
    } else if (request.approvalType === "sequential") {
      // Rejection at any point means rejected
      if (input.decision === "rejected") {
        finalStatus = "rejected";
      }
    }
  }

  // Apply final status if determined
  if (finalStatus) {
    await db
      .update(bi.approvalRequests)
      .set({
        status: finalStatus,
        decidedBy: user.id,
        decidedAt: new Date(),
      })
      .where(eq(bi.approvalRequests.id, input.requestId));
  } else if (request.approvalType === "sequential") {
    // Advance to next reviewer in sequence
    await db
      .update(bi.approvalRequests)
      .set({
        currentStep: (request.currentStep ?? 1) + 1,
      })
      .where(eq(bi.approvalRequests.id, input.requestId));
  }

  revalidatePath("/approvals");
  revalidatePath("/deals");

  return {
    approvalCount,
    rejectionCount,
    finalStatus,
  };
}

/**
 * Cancel an approval request (only requester or admin)
 */
export async function cancelRequest(requestId: string, _reason?: string) {
  const user = await getAuthenticatedUser();

  // Get request
  const requests = await db
    .select({ requestedBy: bi.approvalRequests.requestedBy })
    .from(bi.approvalRequests)
    .where(eq(bi.approvalRequests.id, requestId));

  const request = requests[0];

  if (!request) {
    throw new Error("Approval request not found");
  }

  // Check authorization
  const isRequester = request.requestedBy === user.id;
  const isAdmin = ["sudo", "partner"].includes(user.role ?? "");

  if (!isRequester && !isAdmin) {
    throw new Error("Only the requester or an admin can cancel this request");
  }

  await db
    .update(bi.approvalRequests)
    .set({
      status: "cancelled",
      decidedAt: new Date(),
    })
    .where(
      and(
        eq(bi.approvalRequests.id, requestId),
        eq(bi.approvalRequests.status, "pending")
      )
    );

  revalidatePath("/approvals");

  return { success: true };
}

/**
 * Update an approval request (only requester, before any reviews)
 */
export async function updateRequest(input: UpdateRequestInput) {
  const user = await getAuthenticatedUser();

  // Get request
  const requests = await db
    .select({
      requestedBy: bi.approvalRequests.requestedBy,
      status: bi.approvalRequests.status,
    })
    .from(bi.approvalRequests)
    .where(eq(bi.approvalRequests.id, input.requestId));

  const request = requests[0];

  if (!request) {
    throw new Error("Approval request not found");
  }

  // Check authorization
  if (request.requestedBy !== user.id && user.role !== "sudo") {
    throw new Error("Only the requester can update this request");
  }

  // Check if request can be updated
  if (request.status !== "pending") {
    throw new Error("Can only update pending requests");
  }

  // Check if any reviews exist
  const existingReviews = await db
    .select({ id: bi.approvalReviews.id })
    .from(bi.approvalReviews)
    .where(eq(bi.approvalReviews.requestId, input.requestId))
    .limit(1);

  if (existingReviews.length > 0) {
    throw new Error("Cannot update request after reviews have been submitted");
  }

  // Build update object
  const updateData: any = {};

  if (input.title) {
    updateData.title = input.title;
  }
  if (input.description !== undefined) {
    updateData.description = input.description;
  }
  if (input.priority) {
    updateData.priority = input.priority;
  }
  if (input.dueDate !== undefined) {
    updateData.dueDate = input.dueDate ? new Date(input.dueDate) : null;
  }
  if (input.assignedReviewers) {
    // Validate new reviewers
    for (const reviewerId of input.assignedReviewers) {
      const reviewers = await db
        .select({ id: shared.users.id })
        .from(shared.users)
        .where(eq(shared.users.id, reviewerId));

      if (reviewers.length === 0) {
        throw new Error(`Reviewer ${reviewerId} not found`);
      }
    }

    // Get current metadata and update assignedReviewers
    const currentRequest = await db
      .select({ metadata: bi.approvalRequests.metadata })
      .from(bi.approvalRequests)
      .where(eq(bi.approvalRequests.id, input.requestId))
      .limit(1);

    const currentMetadata = (currentRequest[0]?.metadata ?? {}) as Record<string, any>;
    updateData.metadata = {
      ...currentMetadata,
      assignedReviewers: input.assignedReviewers,
    };
  }

  await db
    .update(bi.approvalRequests)
    .set(updateData)
    .where(eq(bi.approvalRequests.id, input.requestId));

  revalidatePath("/approvals");

  return { success: true };
}

// ============================================
// MUTATIONS - Templates
// ============================================

/**
 * Create an approval template (sudo/partner only)
 */
export async function createTemplate(input: CreateTemplateInput) {
  const user = await getAuthenticatedUser();

  // Check role
  if (!["sudo", "partner"].includes(user.role ?? "")) {
    throw new Error("Only sudo or partner can create templates");
  }

  // If setting as default, unset other defaults for same entity type
  if (input.isDefault) {
    await db.execute(sql`
      UPDATE alecia_bi.approval_templates
      SET is_default = false
      WHERE is_default = true
        AND entity_type = ${input.entityType}
    `);
  }

  const [template] = await db
    .insert(bi.approvalTemplates)
    .values({
      name: input.name,
      description: input.description ?? null,
      entityType: input.entityType,
      requiredApprovals: input.requiredApprovals,
      approvalType: input.approvalType,
      defaultReviewers: input.defaultReviewers,
      autoAssignRules: input.autoAssignRules ?? null,
      isDefault: input.isDefault,
      isActive: true,
      createdBy: user.id,
    })
    .returning();

  revalidatePath("/admin/approvals");

  return template.id;
}

/**
 * Update an approval template (sudo/partner only)
 */
export async function updateTemplate(input: UpdateTemplateInput) {
  const user = await getAuthenticatedUser();

  // Check role
  if (!["sudo", "partner"].includes(user.role ?? "")) {
    throw new Error("Only sudo or partner can update templates");
  }

  // If setting as default, unset other defaults
  if (input.isDefault && input.entityType) {
    await db.execute(sql`
      UPDATE alecia_bi.approval_templates
      SET is_default = false
      WHERE id != ${input.templateId}
        AND is_default = true
        AND entity_type = ${input.entityType}
    `);
  }

  // Build update object
  const updateData: any = {};

  if (input.name) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.entityType) updateData.entityType = input.entityType;
  if (input.requiredApprovals !== undefined) updateData.requiredApprovals = input.requiredApprovals;
  if (input.approvalType) updateData.approvalType = input.approvalType;
  if (input.defaultReviewers) updateData.defaultReviewers = input.defaultReviewers;
  if (input.autoAssignRules !== undefined) updateData.autoAssignRules = input.autoAssignRules;
  if (input.isDefault !== undefined) updateData.isDefault = input.isDefault;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;

  await db
    .update(bi.approvalTemplates)
    .set(updateData)
    .where(eq(bi.approvalTemplates.id, input.templateId));

  revalidatePath("/admin/approvals");

  return { success: true };
}

/**
 * Delete an approval template (sudo/partner only)
 */
export async function deleteTemplate(templateId: string) {
  const user = await getAuthenticatedUser();

  // Check role
  if (!["sudo", "partner"].includes(user.role ?? "")) {
    throw new Error("Only sudo or partner can delete templates");
  }

  await db
    .delete(bi.approvalTemplates)
    .where(eq(bi.approvalTemplates.id, templateId));

  revalidatePath("/admin/approvals");

  return { success: true };
}

// ============================================
// INTERNAL HELPERS (for cron jobs)
// ============================================

/**
 * Get pending requests that have expired (for cron job)
 */
export async function getExpiredRequests() {
  const now = new Date();

  const requests = await db
    .select()
    .from(bi.approvalRequests)
    .where(
      and(
        eq(bi.approvalRequests.status, "pending"),
        sql`${bi.approvalRequests.dueDate} IS NOT NULL`,
        sql`${bi.approvalRequests.dueDate} < ${now}`
      )
    );

  return requests;
}

/**
 * Mark expired requests (for cron job)
 */
export async function markExpired(requestId: string) {
  await db
    .update(bi.approvalRequests)
    .set({
      status: "expired",
      decidedAt: new Date(),
    })
    .where(eq(bi.approvalRequests.id, requestId));

  revalidatePath("/approvals");
}

/**
 * Get user's pending approval count (for notifications)
 */
export async function getPendingCountForUser(userId: string) {
  const result = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM alecia_bi.approval_requests ar
    WHERE ar.status = 'pending'
      AND ${userId} = ANY(
        COALESCE((ar.metadata->'assignedReviewers')::jsonb, '[]'::jsonb)::text[]
      )
      AND NOT EXISTS (
        SELECT 1 FROM alecia_bi.approval_reviews
        WHERE request_id = ar.id AND reviewer_id = ${userId}
      )
  `);

  return Number(result.rows[0]?.count ?? 0);
}
