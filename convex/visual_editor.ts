import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

/**
 * Visual Website Editor - Convex Mutations and Queries
 *
 * Features:
 * - Page content management
 * - Approval workflow
 * - Version history
 * - Diff generation
 */

// ============================================
// QUERIES
// ============================================

/**
 * Get all editable pages
 */
export const getEditablePages = query({
	args: {
		locale: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		let pages = await ctx.db.query("page_content").collect();

		if (args.locale) {
			pages = pages.filter((p) => p.locale === args.locale);
		}

		return pages.map((p) => ({
			_id: p._id,
			path: p.path,
			locale: p.locale,
			version: p.version,
			publishedAt: p.publishedAt,
			updatedAt: p.updatedAt,
		}));
	},
});

/**
 * Get page content by path and locale
 */
export const getPageContent = query({
	args: {
		path: v.string(),
		locale: v.string(),
	},
	handler: async (ctx, args) => {
		const page = await ctx.db
			.query("page_content")
			.withIndex("by_path", (q) =>
				q.eq("path", args.path).eq("locale", args.locale),
			)
			.first();

		return page;
	},
});

/**
 * Get published page content for public display
 * Returns only published content (where publishedAt exists)
 */
export const getPublishedPageContent = query({
	args: {
		path: v.string(),
		locale: v.string(),
	},
	handler: async (ctx, args) => {
		const page = await ctx.db
			.query("page_content")
			.withIndex("by_path", (q) =>
				q.eq("path", args.path).eq("locale", args.locale),
			)
			.first();

		// Return null if page doesn't exist or hasn't been published
		if (!page || !page.publishedAt) {
			return null;
		}

		// Return only the sections and basic metadata needed for rendering
		return {
			_id: page._id,
			path: page.path,
			locale: page.locale,
			sections: page.sections,
			version: page.version,
			publishedAt: page.publishedAt,
		};
	},
});

/**
 * Get pending changes for a page
 */
export const getPendingChanges = query({
	args: {
		pageContentId: v.optional(v.id("page_content")),
		status: v.optional(
			v.union(
				v.literal("pending"),
				v.literal("approved"),
				v.literal("rejected"),
				v.literal("cancelled"),
			),
		),
	},
	handler: async (ctx, args) => {
		let changes: Doc<"pending_changes">[];

		if (args.pageContentId) {
			const pageContentId = args.pageContentId;
			changes = await ctx.db
				.query("pending_changes")
				.withIndex("by_page", (q) => q.eq("pageContentId", pageContentId))
				.collect();
		} else if (args.status) {
			const status = args.status;
			changes = await ctx.db
				.query("pending_changes")
				.withIndex("by_status", (q) => q.eq("status", status))
				.collect();
		} else {
			changes = await ctx.db.query("pending_changes").collect();
		}

		// Enrich with approval count
		const enriched = await Promise.all(
			changes.map(async (change) => {
				const approvals = await ctx.db
					.query("change_approvals")
					.withIndex("by_change", (q) => q.eq("changeId", change._id))
					.collect();

				return {
					...change,
					approvalCount: approvals.filter((a) => a.approved).length,
					rejectionCount: approvals.filter((a) => !a.approved).length,
					approvals: approvals,
				};
			}),
		);

		return enriched;
	},
});

/**
 * Get version history for a page
 */
export const getPageVersions = query({
	args: {
		pageContentId: v.id("page_content"),
	},
	handler: async (ctx, args) => {
		const versions = await ctx.db
			.query("page_versions")
			.withIndex("by_page", (q) => q.eq("pageContentId", args.pageContentId))
			.order("desc")
			.take(20); // Last 20 versions

		return versions;
	},
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Initialize a page for editing (create if doesn't exist)
 */
export const initializePage = mutation({
	args: {
		path: v.string(),
		locale: v.string(),
		initialSections: v.optional(v.any()),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("page_content")
			.withIndex("by_path", (q) =>
				q.eq("path", args.path).eq("locale", args.locale),
			)
			.first();

		if (existing) {
			return existing._id;
		}

		// Create new page
		const pageId = await ctx.db.insert("page_content", {
			path: args.path,
			locale: args.locale,
			sections: args.initialSections || [],
			version: 1,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		return pageId;
	},
});

/**
 * Submit changes for approval
 */
export const submitChanges = mutation({
	args: {
		pageContentId: v.id("page_content"),
		changedBy: v.id("users"),
		changedByName: v.string(),
		changeType: v.string(),
		description: v.optional(v.string()),
		visualDiff: v.object({
			before: v.string(),
			after: v.string(),
			changesSummary: v.array(v.string()),
		}),
		codeDiff: v.object({
			before: v.any(),
			after: v.any(),
			delta: v.optional(v.any()),
		}),
		requiredApprovals: v.number(),
	},
	handler: async (ctx, args) => {
		const page = await ctx.db.get(args.pageContentId);
		if (!page) throw new Error("Page not found");

		const changeId = await ctx.db.insert("pending_changes", {
			pageContentId: args.pageContentId,
			pagePath: page.path,
			pageLocale: page.locale,
			changedBy: args.changedBy,
			changedByName: args.changedByName,
			changeType: args.changeType,
			description: args.description,
			visualDiff: args.visualDiff,
			codeDiff: args.codeDiff,
			status: "pending",
			requiredApprovals: args.requiredApprovals,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		return changeId;
	},
});

/**
 * Approve or reject a change
 */
export const reviewChange = mutation({
	args: {
		changeId: v.id("pending_changes"),
		userId: v.id("users"),
		userName: v.string(),
		approved: v.boolean(),
		comment: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// Check if user already reviewed
		const existing = await ctx.db
			.query("change_approvals")
			.withIndex("by_user_change", (q) =>
				q.eq("userId", args.userId).eq("changeId", args.changeId),
			)
			.first();

		if (existing) {
			throw new Error("You have already reviewed this change");
		}

		// Record approval
		await ctx.db.insert("change_approvals", {
			changeId: args.changeId,
			userId: args.userId,
			userName: args.userName,
			approved: args.approved,
			comment: args.comment,
			createdAt: Date.now(),
		});

		// Check if we have enough approvals or rejections
		const change = await ctx.db.get(args.changeId);
		if (!change) throw new Error("Change not found");

		const allApprovals = await ctx.db
			.query("change_approvals")
			.withIndex("by_change", (q) => q.eq("changeId", args.changeId))
			.collect();

		const approvalCount = allApprovals.filter((a) => a.approved).length;
		const rejectionCount = allApprovals.filter((a) => !a.approved).length;

		// Auto-approve if threshold met
		if (approvalCount >= change.requiredApprovals) {
			await ctx.db.patch(args.changeId, {
				status: "approved",
				approvedAt: Date.now(),
				updatedAt: Date.now(),
			});

			// Auto-publish approved changes
			const page = await ctx.db.get(change.pageContentId);
			if (!page) throw new Error("Page not found");

			// Create version snapshot BEFORE applying changes
			await ctx.db.insert("page_versions", {
				pageContentId: change.pageContentId,
				pagePath: page.path,
				version: page.version,
				sections: page.sections,
				theme: page.theme,
				publishedBy: args.userId,
				publishedByName: args.userName,
				publishedAt: Date.now(),
				changeDescription: change.description,
			});

			// Apply changes to page
			const newVersion = page.version + 1;
			await ctx.db.patch(change.pageContentId, {
				sections: change.codeDiff.after,
				version: newVersion,
				publishedAt: Date.now(),
				publishedBy: args.userId,
				updatedAt: Date.now(),
			});

			// Mark change as published
			await ctx.db.patch(args.changeId, {
				publishedAt: Date.now(),
			});
		}

		// Auto-reject if more rejections than approvals possible
		const totalReviewers = approvalCount + rejectionCount;
		if (rejectionCount > totalReviewers - change.requiredApprovals) {
			await ctx.db.patch(args.changeId, {
				status: "rejected",
				updatedAt: Date.now(),
			});
		}

		return { approvalCount, rejectionCount };
	},
});

/**
 * Publish approved changes
 */
export const publishChanges = mutation({
	args: {
		changeId: v.id("pending_changes"),
		publishedBy: v.id("users"),
		publishedByName: v.string(),
	},
	handler: async (ctx, args) => {
		const change = await ctx.db.get(args.changeId);
		if (!change) throw new Error("Change not found");

		if (change.status !== "approved") {
			throw new Error("Only approved changes can be published");
		}

		const page = await ctx.db.get(change.pageContentId);
		if (!page) throw new Error("Page not found");

		// Create version snapshot BEFORE applying changes
		await ctx.db.insert("page_versions", {
			pageContentId: change.pageContentId,
			pagePath: page.path,
			version: page.version,
			sections: page.sections,
			theme: page.theme,
			publishedBy: args.publishedBy,
			publishedByName: args.publishedByName,
			publishedAt: Date.now(),
			changeDescription: change.description,
		});

		// Apply changes to page
		const newVersion = page.version + 1;
		await ctx.db.patch(change.pageContentId, {
			sections: change.codeDiff.after,
			version: newVersion,
			publishedAt: Date.now(),
			publishedBy: args.publishedBy,
			updatedAt: Date.now(),
		});

		// Mark change as published
		await ctx.db.patch(args.changeId, {
			status: "approved",
			publishedAt: Date.now(),
			updatedAt: Date.now(),
		});

		return { newVersion };
	},
});

/**
 * Rollback to a previous version
 */
export const rollbackToVersion = mutation({
	args: {
		versionId: v.id("page_versions"),
		publishedBy: v.id("users"),
		publishedByName: v.string(),
	},
	handler: async (ctx, args) => {
		const version = await ctx.db.get(args.versionId);
		if (!version) throw new Error("Version not found");

		const page = await ctx.db.get(version.pageContentId);
		if (!page) throw new Error("Page not found");

		// Create snapshot of current state before rollback
		await ctx.db.insert("page_versions", {
			pageContentId: version.pageContentId,
			pagePath: page.path,
			version: page.version,
			sections: page.sections,
			theme: page.theme,
			publishedBy: args.publishedBy,
			publishedByName: args.publishedByName,
			publishedAt: Date.now(),
			changeDescription: `Rollback to version ${version.version}`,
		});

		// Restore old version
		const newVersion = page.version + 1;
		await ctx.db.patch(version.pageContentId, {
			sections: version.sections,
			theme: version.theme,
			version: newVersion,
			publishedAt: Date.now(),
			publishedBy: args.publishedBy,
			updatedAt: Date.now(),
		});

		return { newVersion };
	},
});

/**
 * Update page sections (draft - not submitted for approval)
 */
export const updatePageSections = mutation({
	args: {
		pageContentId: v.id("page_content"),
		sections: v.any(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.pageContentId, {
			sections: args.sections,
			updatedAt: Date.now(),
		});
	},
});

/**
 * Delete a pending change
 */
export const deletePendingChange = mutation({
	args: {
		changeId: v.id("pending_changes"),
	},
	handler: async (ctx, args) => {
		// Delete all approvals first
		const approvals = await ctx.db
			.query("change_approvals")
			.withIndex("by_change", (q) => q.eq("changeId", args.changeId))
			.collect();

		for (const approval of approvals) {
			await ctx.db.delete(approval._id);
		}

		// Delete the change
		await ctx.db.delete(args.changeId);
	},
});
