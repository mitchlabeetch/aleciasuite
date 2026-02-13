import { v } from "convex/values";
import {
	mutation,
	query,
	internalQuery,
	internalMutation,
} from "./_generated/server";
import { getAuthenticatedUser, checkRole } from "./auth_utils";
import type { Id, Doc } from "./_generated/dataModel";

/**
 * Approval Workflows - Phase 2.2
 *
 * Generic approval system for documents, teasers, LOIs, emails, data rooms, etc.
 * Supports:
 * - Single or multi-reviewer approvals
 * - Sequential, any, or all approval types
 * - Templates for recurring approval patterns
 * - Notifications and audit trail
 */

// Entity type validator
const entityTypeValidator = v.union(
	v.literal("document"),
	v.literal("teaser"),
	v.literal("loi"),
	v.literal("email"),
	v.literal("data_room"),
	v.literal("deal_stage"),
);

const priorityValidator = v.union(
	v.literal("low"),
	v.literal("medium"),
	v.literal("high"),
	v.literal("urgent"),
);

const approvalTypeValidator = v.union(
	v.literal("any"),
	v.literal("all"),
	v.literal("sequential"),
);

// ============================================
// QUERIES
// ============================================

/**
 * Get a single approval request with all reviews
 */
export const getApprovalRequest = query({
	args: {
		requestId: v.id("approval_requests"),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);

		const request = await ctx.db.get(args.requestId);
		if (!request) return null;

		// Check access: user is requester, reviewer, or has elevated role
		const isRequester = request.requesterId === user._id;
		const isReviewer = request.assignedReviewers.includes(user._id);
		const hasElevatedRole = user.role === "sudo" || user.role === "partner";

		if (!isRequester && !isReviewer && !hasElevatedRole) {
			throw new Error("Not authorized to view this approval request");
		}

		// Fetch all reviews
		const reviews = await ctx.db
			.query("approval_reviews")
			.withIndex("by_request", (q) => q.eq("requestId", args.requestId))
			.collect();

		// Enrich reviews with reviewer info
		const enrichedReviews = await Promise.all(
			reviews.map(async (review) => {
				const reviewer = await ctx.db.get(review.reviewerId);
				return {
					...review,
					reviewerName: reviewer?.name ?? "Unknown",
					reviewerEmail: reviewer?.email,
				};
			}),
		);

		// Get requester info
		const requester = await ctx.db.get(request.requesterId);

		// Get assigned reviewer info
		const reviewerInfos = await Promise.all(
			request.assignedReviewers.map(async (reviewerId) => {
				const reviewer = await ctx.db.get(reviewerId);
				const hasReviewed = reviews.some((r) => r.reviewerId === reviewerId);
				return {
					_id: reviewerId,
					name: reviewer?.name ?? "Unknown",
					email: reviewer?.email,
					hasReviewed,
					review: reviews.find((r) => r.reviewerId === reviewerId),
				};
			}),
		);

		return {
			...request,
			requesterName: requester?.name ?? "Unknown",
			requesterEmail: requester?.email,
			reviews: enrichedReviews,
			reviewers: reviewerInfos,
			approvalCount: reviews.filter((r) => r.decision === "approved").length,
			rejectionCount: reviews.filter((r) => r.decision === "rejected").length,
			changesRequestedCount: reviews.filter(
				(r) => r.decision === "request_changes",
			).length,
		};
	},
});

/**
 * List pending approval requests assigned to the current user
 */
export const listPendingForUser = query({
	args: {
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);
		const limit = args.limit ?? 50;

		// Get all pending/in_review requests
		const pendingRequests = await ctx.db
			.query("approval_requests")
			.withIndex("by_status", (q) => q.eq("status", "pending"))
			.collect();

		const inReviewRequests = await ctx.db
			.query("approval_requests")
			.withIndex("by_status", (q) => q.eq("status", "in_review"))
			.collect();

		const allRequests = [...pendingRequests, ...inReviewRequests];

		// Filter to ones assigned to this user
		const assignedToUser = allRequests.filter((req) =>
			req.assignedReviewers.includes(user._id),
		);

		// Check if user has already reviewed
		const withReviewStatus = await Promise.all(
			assignedToUser.map(async (request) => {
				const existingReview = await ctx.db
					.query("approval_reviews")
					.withIndex("by_request_reviewer", (q) =>
						q.eq("requestId", request._id).eq("reviewerId", user._id),
					)
					.first();

				// Get requester info
				const requester = await ctx.db.get(request.requesterId);

				return {
					...request,
					hasReviewed: !!existingReview,
					myReview: existingReview,
					requesterName: requester?.name ?? "Unknown",
				};
			}),
		);

		// Filter out already reviewed (unless sequential and waiting for this user)
		const needsAction = withReviewStatus.filter((req) => {
			if (req.hasReviewed) return false;

			// For sequential approvals, check if it's this user's turn
			if (req.approvalType === "sequential") {
				const currentIndex = req.currentSequenceIndex ?? 0;
				const assignedIndex = req.assignedReviewers.indexOf(user._id);
				return assignedIndex === currentIndex;
			}

			return true;
		});

		// Sort by priority and due date
		const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
		needsAction.sort((a, b) => {
			const priorityDiff =
				priorityOrder[a.priority] - priorityOrder[b.priority];
			if (priorityDiff !== 0) return priorityDiff;

			// Then by due date
			if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;
			if (a.dueDate) return -1;
			if (b.dueDate) return 1;
			return 0;
		});

		return needsAction.slice(0, limit);
	},
});

/**
 * List approval requests created by the current user
 */
export const listMyRequests = query({
	args: {
		status: v.optional(
			v.union(
				v.literal("pending"),
				v.literal("in_review"),
				v.literal("approved"),
				v.literal("rejected"),
				v.literal("cancelled"),
				v.literal("expired"),
			),
		),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);
		const limit = args.limit ?? 50;

		let requests: Doc<"approval_requests">[];

		if (args.status) {
			requests = await ctx.db
				.query("approval_requests")
				.withIndex("by_requester", (q) => q.eq("requesterId", user._id))
				.filter((q) => q.eq(q.field("status"), args.status))
				.order("desc")
				.take(limit);
		} else {
			requests = await ctx.db
				.query("approval_requests")
				.withIndex("by_requester", (q) => q.eq("requesterId", user._id))
				.order("desc")
				.take(limit);
		}

		// Enrich with review counts
		const enriched = await Promise.all(
			requests.map(async (request) => {
				const reviews = await ctx.db
					.query("approval_reviews")
					.withIndex("by_request", (q) => q.eq("requestId", request._id))
					.collect();

				return {
					...request,
					approvalCount: reviews.filter((r) => r.decision === "approved")
						.length,
					rejectionCount: reviews.filter((r) => r.decision === "rejected")
						.length,
					totalReviews: reviews.length,
				};
			}),
		);

		return enriched;
	},
});

/**
 * List approval requests for a specific deal
 */
export const listByDeal = query({
	args: {
		dealId: v.id("deals"),
		status: v.optional(
			v.union(
				v.literal("pending"),
				v.literal("in_review"),
				v.literal("approved"),
				v.literal("rejected"),
				v.literal("cancelled"),
				v.literal("expired"),
			),
		),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);

		let requests = await ctx.db
			.query("approval_requests")
			.withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
			.collect();

		if (args.status) {
			requests = requests.filter((r) => r.status === args.status);
		}

		// Sort by creation date desc
		requests.sort((a, b) => b.createdAt - a.createdAt);

		// Enrich with review info
		const enriched = await Promise.all(
			requests.map(async (request) => {
				const reviews = await ctx.db
					.query("approval_reviews")
					.withIndex("by_request", (q) => q.eq("requestId", request._id))
					.collect();

				const requester = await ctx.db.get(request.requesterId);

				return {
					...request,
					requesterName: requester?.name ?? "Unknown",
					approvalCount: reviews.filter((r) => r.decision === "approved")
						.length,
					rejectionCount: reviews.filter((r) => r.decision === "rejected")
						.length,
					totalReviews: reviews.length,
				};
			}),
		);

		return enriched;
	},
});

/**
 * List approval requests for a specific entity
 */
export const listByEntity = query({
	args: {
		entityType: entityTypeValidator,
		entityId: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);

		const requests = await ctx.db
			.query("approval_requests")
			.withIndex("by_entity", (q) =>
				q.eq("entityType", args.entityType).eq("entityId", args.entityId),
			)
			.collect();

		// Sort by creation date desc
		requests.sort((a, b) => b.createdAt - a.createdAt);

		return requests;
	},
});

/**
 * Get all available approval templates
 */
export const getTemplates = query({
	args: {
		entityType: v.optional(entityTypeValidator),
		activeOnly: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);

		let templates = await ctx.db.query("approval_templates").collect();

		// Filter by active status
		if (args.activeOnly !== false) {
			templates = templates.filter((t) => t.isActive);
		}

		// Filter by entity type
		if (args.entityType) {
			templates = templates.filter((t) =>
				t.entityTypes.includes(args.entityType!),
			);
		}

		return templates;
	},
});

/**
 * Get the default template for an entity type
 */
export const getDefaultTemplate = query({
	args: {
		entityType: entityTypeValidator,
	},
	handler: async (ctx, args) => {
		const templates = await ctx.db.query("approval_templates").collect();

		// Find default active template for this entity type
		const defaultTemplate = templates.find(
			(t) =>
				t.isActive && t.isDefault && t.entityTypes.includes(args.entityType),
		);

		return defaultTemplate ?? null;
	},
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new approval request
 */
export const createApprovalRequest = mutation({
	args: {
		entityType: entityTypeValidator,
		entityId: v.string(),
		dealId: v.optional(v.id("deals")),
		title: v.string(),
		description: v.optional(v.string()),
		requiredApprovals: v.number(),
		approvalType: approvalTypeValidator,
		assignedReviewers: v.array(v.id("users")),
		priority: priorityValidator,
		dueDate: v.optional(v.number()),
		expiresAt: v.optional(v.number()),
		entitySnapshot: v.optional(v.string()),
		templateId: v.optional(v.id("approval_templates")),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);
		const now = Date.now();

		// Validate reviewers exist
		for (const reviewerId of args.assignedReviewers) {
			const reviewer = await ctx.db.get(reviewerId);
			if (!reviewer) {
				throw new Error(`Reviewer ${reviewerId} not found`);
			}
		}

		// Validate required approvals doesn't exceed reviewer count
		if (args.approvalType === "all") {
			if (args.requiredApprovals !== args.assignedReviewers.length) {
				throw new Error(
					"For 'all' approval type, required approvals must equal reviewer count",
				);
			}
		} else if (args.requiredApprovals > args.assignedReviewers.length) {
			throw new Error(
				"Required approvals cannot exceed the number of assigned reviewers",
			);
		}

		// Check for existing pending request on same entity
		const existingRequest = await ctx.db
			.query("approval_requests")
			.withIndex("by_entity", (q) =>
				q.eq("entityType", args.entityType).eq("entityId", args.entityId),
			)
			.filter((q) =>
				q.or(
					q.eq(q.field("status"), "pending"),
					q.eq(q.field("status"), "in_review"),
				),
			)
			.first();

		if (existingRequest) {
			throw new Error(
				"An active approval request already exists for this entity",
			);
		}

		const requestId = await ctx.db.insert("approval_requests", {
			entityType: args.entityType,
			entityId: args.entityId,
			dealId: args.dealId,
			title: args.title,
			description: args.description,
			requesterId: user._id,
			requiredApprovals: args.requiredApprovals,
			approvalType: args.approvalType,
			assignedReviewers: args.assignedReviewers,
			currentSequenceIndex: args.approvalType === "sequential" ? 0 : undefined,
			status: "pending",
			priority: args.priority,
			dueDate: args.dueDate,
			expiresAt: args.expiresAt,
			createdAt: now,
			updatedAt: now,
			entitySnapshot: args.entitySnapshot,
		});

		// TODO: Send notifications to reviewers
		// This would be handled by a notification action/trigger

		return requestId;
	},
});

/**
 * Create approval request from a template
 */
export const createFromTemplate = mutation({
	args: {
		templateId: v.id("approval_templates"),
		entityType: entityTypeValidator,
		entityId: v.string(),
		dealId: v.optional(v.id("deals")),
		title: v.string(),
		description: v.optional(v.string()),
		assignedReviewers: v.optional(v.array(v.id("users"))),
		entitySnapshot: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);
		const now = Date.now();

		const template = await ctx.db.get(args.templateId);
		if (!template) {
			throw new Error("Template not found");
		}

		if (!template.isActive) {
			throw new Error("Template is not active");
		}

		if (!template.entityTypes.includes(args.entityType)) {
			throw new Error("Template does not support this entity type");
		}

		// Get reviewers - use provided or find by role
		let reviewers: Id<"users">[] = args.assignedReviewers ?? [];

		if (reviewers.length === 0 && template.defaultReviewerRoles.length > 0) {
			// Find users with the required roles
			const allUsers = await ctx.db.query("users").collect();
			reviewers = allUsers
				.filter((u) => template.defaultReviewerRoles.includes(u.role as string))
				.map((u) => u._id);
		}

		if (reviewers.length === 0) {
			throw new Error("No reviewers assigned and no default reviewers found");
		}

		// Calculate due date and expiry
		let dueDate: number | undefined;
		let expiresAt: number | undefined;

		if (template.defaultDueDays) {
			dueDate = now + template.defaultDueDays * 24 * 60 * 60 * 1000;
		}

		if (template.autoExpireDays) {
			expiresAt = now + template.autoExpireDays * 24 * 60 * 60 * 1000;
		}

		const requestId = await ctx.db.insert("approval_requests", {
			entityType: args.entityType,
			entityId: args.entityId,
			dealId: args.dealId,
			title: args.title,
			description: args.description,
			requesterId: user._id,
			requiredApprovals: template.requiredApprovals,
			approvalType: template.approvalType,
			assignedReviewers: reviewers,
			currentSequenceIndex:
				template.approvalType === "sequential" ? 0 : undefined,
			status: "pending",
			priority: template.defaultPriority,
			dueDate,
			expiresAt,
			createdAt: now,
			updatedAt: now,
			entitySnapshot: args.entitySnapshot,
		});

		return requestId;
	},
});

/**
 * Submit a review (approve/reject/request changes)
 */
export const submitReview = mutation({
	args: {
		requestId: v.id("approval_requests"),
		decision: v.union(
			v.literal("approved"),
			v.literal("rejected"),
			v.literal("request_changes"),
		),
		comment: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);
		const now = Date.now();

		const request = await ctx.db.get(args.requestId);
		if (!request) {
			throw new Error("Approval request not found");
		}

		// Check if request is still actionable
		if (!["pending", "in_review"].includes(request.status)) {
			throw new Error(`Cannot review a ${request.status} request`);
		}

		// Check if user is an assigned reviewer
		if (!request.assignedReviewers.includes(user._id)) {
			throw new Error("You are not an assigned reviewer for this request");
		}

		// Check for sequential approval order
		if (request.approvalType === "sequential") {
			const currentIndex = request.currentSequenceIndex ?? 0;
			const userIndex = request.assignedReviewers.indexOf(user._id);

			if (userIndex !== currentIndex) {
				throw new Error("It is not your turn to review in this sequence");
			}
		}

		// Check if user has already reviewed
		const existingReview = await ctx.db
			.query("approval_reviews")
			.withIndex("by_request_reviewer", (q) =>
				q.eq("requestId", args.requestId).eq("reviewerId", user._id),
			)
			.first();

		if (existingReview) {
			throw new Error("You have already reviewed this request");
		}

		// Create the review
		await ctx.db.insert("approval_reviews", {
			requestId: args.requestId,
			reviewerId: user._id,
			decision: args.decision,
			comment: args.comment,
			sequenceIndex:
				request.approvalType === "sequential"
					? request.currentSequenceIndex
					: undefined,
			reviewedAt: now,
		});

		// Update request status
		await ctx.db.patch(args.requestId, {
			status: "in_review",
			updatedAt: now,
		});

		// Get all reviews to determine final status
		const allReviews = await ctx.db
			.query("approval_reviews")
			.withIndex("by_request", (q) => q.eq("requestId", args.requestId))
			.collect();

		const approvalCount = allReviews.filter(
			(r) => r.decision === "approved",
		).length;
		const rejectionCount = allReviews.filter(
			(r) => r.decision === "rejected",
		).length;

		// Check for final decision
		let finalStatus: typeof request.status | null = null;
		let finalDecision: "approved" | "rejected" | undefined;

		// Approved if we have enough approvals
		if (approvalCount >= request.requiredApprovals) {
			finalStatus = "approved";
			finalDecision = "approved";
		}

		// Rejected logic depends on approval type
		if (!finalStatus) {
			if (request.approvalType === "all") {
				// Any rejection means rejected
				if (rejectionCount > 0) {
					finalStatus = "rejected";
					finalDecision = "rejected";
				}
			} else if (request.approvalType === "any") {
				// Rejected if impossible to reach required approvals
				const remainingReviewers =
					request.assignedReviewers.length - allReviews.length;
				if (approvalCount + remainingReviewers < request.requiredApprovals) {
					finalStatus = "rejected";
					finalDecision = "rejected";
				}
			} else if (request.approvalType === "sequential") {
				// Rejection at any point means rejected
				if (args.decision === "rejected") {
					finalStatus = "rejected";
					finalDecision = "rejected";
				}
			}
		}

		// Apply final status if determined
		if (finalStatus) {
			await ctx.db.patch(args.requestId, {
				status: finalStatus,
				finalDecision,
				finalDecisionBy: user._id,
				completedAt: now,
				updatedAt: now,
			});
		} else if (request.approvalType === "sequential") {
			// Advance to next reviewer in sequence
			await ctx.db.patch(args.requestId, {
				currentSequenceIndex: (request.currentSequenceIndex ?? 0) + 1,
				updatedAt: now,
			});
		}

		// TODO: Trigger notifications for final decision or next sequential reviewer

		return {
			approvalCount,
			rejectionCount,
			finalStatus,
			finalDecision,
		};
	},
});

/**
 * Cancel an approval request (only requester or admin)
 */
export const cancelRequest = mutation({
	args: {
		requestId: v.id("approval_requests"),
		reason: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);
		const now = Date.now();

		const request = await ctx.db.get(args.requestId);
		if (!request) {
			throw new Error("Approval request not found");
		}

		// Check authorization
		const isRequester = request.requesterId === user._id;
		const isAdmin = user.role === "sudo" || user.role === "partner";

		if (!isRequester && !isAdmin) {
			throw new Error("Only the requester or an admin can cancel this request");
		}

		// Check if request can be cancelled
		if (!["pending", "in_review"].includes(request.status)) {
			throw new Error(`Cannot cancel a ${request.status} request`);
		}

		await ctx.db.patch(args.requestId, {
			status: "cancelled",
			updatedAt: now,
			completedAt: now,
		});

		// TODO: Notify reviewers of cancellation

		return { success: true };
	},
});

/**
 * Update an approval request (only requester, before any reviews)
 */
export const updateRequest = mutation({
	args: {
		requestId: v.id("approval_requests"),
		title: v.optional(v.string()),
		description: v.optional(v.string()),
		priority: v.optional(priorityValidator),
		dueDate: v.optional(v.number()),
		assignedReviewers: v.optional(v.array(v.id("users"))),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);
		const now = Date.now();

		const request = await ctx.db.get(args.requestId);
		if (!request) {
			throw new Error("Approval request not found");
		}

		// Check authorization
		if (request.requesterId !== user._id && user.role !== "sudo") {
			throw new Error("Only the requester can update this request");
		}

		// Check if request can be updated
		if (request.status !== "pending") {
			throw new Error("Can only update pending requests");
		}

		// Check if any reviews exist
		const existingReviews = await ctx.db
			.query("approval_reviews")
			.withIndex("by_request", (q) => q.eq("requestId", args.requestId))
			.first();

		if (existingReviews) {
			throw new Error(
				"Cannot update request after reviews have been submitted",
			);
		}

		// Build update object
		const updates: Partial<Doc<"approval_requests">> = {
			updatedAt: now,
		};

		if (args.title) updates.title = args.title;
		if (args.description !== undefined) updates.description = args.description;
		if (args.priority) updates.priority = args.priority;
		if (args.dueDate !== undefined) updates.dueDate = args.dueDate;

		if (args.assignedReviewers) {
			// Validate new reviewers
			for (const reviewerId of args.assignedReviewers) {
				const reviewer = await ctx.db.get(reviewerId);
				if (!reviewer) {
					throw new Error(`Reviewer ${reviewerId} not found`);
				}
			}
			updates.assignedReviewers = args.assignedReviewers;
		}

		await ctx.db.patch(args.requestId, updates);

		return { success: true };
	},
});

// ============================================
// TEMPLATE MANAGEMENT
// ============================================

/**
 * Create an approval template
 */
export const createTemplate = mutation({
	args: {
		name: v.string(),
		description: v.optional(v.string()),
		entityTypes: v.array(entityTypeValidator),
		requiredApprovals: v.number(),
		approvalType: approvalTypeValidator,
		defaultReviewerRoles: v.array(v.string()),
		defaultPriority: priorityValidator,
		defaultDueDays: v.optional(v.number()),
		autoExpireDays: v.optional(v.number()),
		isDefault: v.boolean(),
	},
	handler: async (ctx, args) => {
		const user = await checkRole(ctx, ["sudo", "partner"]);

		const now = Date.now();

		// If setting as default, unset other defaults for same entity types
		if (args.isDefault) {
			const existingTemplates = await ctx.db
				.query("approval_templates")
				.collect();

			for (const template of existingTemplates) {
				if (
					template.isDefault &&
					template.entityTypes.some((t) => args.entityTypes.includes(t))
				) {
					await ctx.db.patch(template._id, { isDefault: false });
				}
			}
		}

		const templateId = await ctx.db.insert("approval_templates", {
			name: args.name,
			description: args.description,
			entityTypes: args.entityTypes,
			requiredApprovals: args.requiredApprovals,
			approvalType: args.approvalType,
			defaultReviewerRoles: args.defaultReviewerRoles,
			defaultPriority: args.defaultPriority,
			defaultDueDays: args.defaultDueDays,
			autoExpireDays: args.autoExpireDays,
			isDefault: args.isDefault,
			isActive: true,
			createdBy: user._id,
			createdAt: now,
			updatedAt: now,
		});

		return templateId;
	},
});

/**
 * Update an approval template
 */
export const updateTemplate = mutation({
	args: {
		templateId: v.id("approval_templates"),
		name: v.optional(v.string()),
		description: v.optional(v.string()),
		entityTypes: v.optional(v.array(entityTypeValidator)),
		requiredApprovals: v.optional(v.number()),
		approvalType: v.optional(approvalTypeValidator),
		defaultReviewerRoles: v.optional(v.array(v.string())),
		defaultPriority: v.optional(priorityValidator),
		defaultDueDays: v.optional(v.number()),
		autoExpireDays: v.optional(v.number()),
		isDefault: v.optional(v.boolean()),
		isActive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const user = await checkRole(ctx, ["sudo", "partner"]);

		const template = await ctx.db.get(args.templateId);
		if (!template) {
			throw new Error("Template not found");
		}

		const now = Date.now();

		// Build update object
		const updates: Partial<Doc<"approval_templates">> = {
			updatedAt: now,
		};

		if (args.name) updates.name = args.name;
		if (args.description !== undefined) updates.description = args.description;
		if (args.entityTypes) updates.entityTypes = args.entityTypes;
		if (args.requiredApprovals)
			updates.requiredApprovals = args.requiredApprovals;
		if (args.approvalType) updates.approvalType = args.approvalType;
		if (args.defaultReviewerRoles)
			updates.defaultReviewerRoles = args.defaultReviewerRoles;
		if (args.defaultPriority) updates.defaultPriority = args.defaultPriority;
		if (args.defaultDueDays !== undefined)
			updates.defaultDueDays = args.defaultDueDays;
		if (args.autoExpireDays !== undefined)
			updates.autoExpireDays = args.autoExpireDays;
		if (args.isActive !== undefined) updates.isActive = args.isActive;

		if (args.isDefault !== undefined) {
			updates.isDefault = args.isDefault;

			// If setting as default, unset other defaults
			if (args.isDefault) {
				const entityTypes = args.entityTypes ?? template.entityTypes;
				const existingTemplates = await ctx.db
					.query("approval_templates")
					.collect();

				for (const t of existingTemplates) {
					if (
						t._id !== args.templateId &&
						t.isDefault &&
						t.entityTypes.some((et) => entityTypes.includes(et))
					) {
						await ctx.db.patch(t._id, { isDefault: false });
					}
				}
			}
		}

		await ctx.db.patch(args.templateId, updates);

		return { success: true };
	},
});

/**
 * Delete an approval template
 */
export const deleteTemplate = mutation({
	args: {
		templateId: v.id("approval_templates"),
	},
	handler: async (ctx, args) => {
		await checkRole(ctx, ["sudo", "partner"]);

		const template = await ctx.db.get(args.templateId);
		if (!template) {
			throw new Error("Template not found");
		}

		await ctx.db.delete(args.templateId);

		return { success: true };
	},
});

// ============================================
// INTERNAL QUERIES/MUTATIONS
// ============================================

/**
 * Internal: Get pending requests that have expired
 */
export const getExpiredRequests = internalQuery({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();

		const pendingRequests = await ctx.db
			.query("approval_requests")
			.withIndex("by_status", (q) => q.eq("status", "pending"))
			.collect();

		const inReviewRequests = await ctx.db
			.query("approval_requests")
			.withIndex("by_status", (q) => q.eq("status", "in_review"))
			.collect();

		const allActive = [...pendingRequests, ...inReviewRequests];

		return allActive.filter((req) => req.expiresAt && req.expiresAt < now);
	},
});

/**
 * Internal: Mark expired requests
 */
export const markExpired = internalMutation({
	args: {
		requestId: v.id("approval_requests"),
	},
	handler: async (ctx, args) => {
		const now = Date.now();

		await ctx.db.patch(args.requestId, {
			status: "expired",
			completedAt: now,
			updatedAt: now,
		});
	},
});

/**
 * Internal: Get request for notification service
 */
export const getRequestInternal = internalQuery({
	args: {
		requestId: v.id("approval_requests"),
	},
	handler: async (ctx, args) => {
		return await ctx.db.get(args.requestId);
	},
});

/**
 * Internal: Get user's pending approval count
 */
export const getPendingCountForUser = internalQuery({
	args: {
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const pendingRequests = await ctx.db
			.query("approval_requests")
			.withIndex("by_status", (q) => q.eq("status", "pending"))
			.collect();

		const inReviewRequests = await ctx.db
			.query("approval_requests")
			.withIndex("by_status", (q) => q.eq("status", "in_review"))
			.collect();

		const allActive = [...pendingRequests, ...inReviewRequests];

		// Count ones assigned to this user that haven't been reviewed yet
		let count = 0;
		for (const request of allActive) {
			if (!request.assignedReviewers.includes(args.userId)) continue;

			const existingReview = await ctx.db
				.query("approval_reviews")
				.withIndex("by_request_reviewer", (q) =>
					q.eq("requestId", request._id).eq("reviewerId", args.userId),
				)
				.first();

			if (!existingReview) {
				count++;
			}
		}

		return count;
	},
});
