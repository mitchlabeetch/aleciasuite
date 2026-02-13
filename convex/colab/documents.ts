/**
 * Colab Documents Module
 *
 * CRUD operations for colab_documents table.
 * Part of the unified Convex backend (Phase 2 migration).
 */

import { v } from "convex/values";
import { mutation, query, internalQuery } from "../_generated/server";
import type { QueryCtx, MutationCtx } from "../_generated/server";

// Helper to get authenticated user ID
async function getUserId(ctx: QueryCtx | MutationCtx) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new Error("Unauthorized");
	}
	return identity.subject;
}

// Get all documents for a user
export const list = query({
	args: {
		userId: v.optional(v.string()), // Kept for backward compatibility but ignored/verified
	},
	handler: async (ctx, _args) => {
		// Return empty array if not authenticated (for sidebar counts, etc.)
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return [];
		}

		const userId = identity.subject;

		return await ctx.db
			.query("colab_documents")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.order("desc")
			.collect();
	},
});

// Get a single document by ID
export const get = query({
	args: { id: v.id("colab_documents") },
	handler: async (ctx, args) => {
		const userId = await getUserId(ctx);
		const doc = await ctx.db.get(args.id);

		if (!doc) {
			return null;
		}

		// Only allow access if the document belongs to the user
		// In the future, we might check for shared access (e.g., workspaces/deals)
		if (doc.userId !== userId) {
			throw new Error("Unauthorized");
		}

		return doc;
	},
});

// Internal query for getting document (for export actions)
export const getInternal = internalQuery({
	args: { id: v.id("colab_documents") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

// Get documents for a specific deal
export const getByDeal = query({
	args: { dealId: v.id("deals") },
	handler: async (ctx, args) => {
		// Ensure user is authenticated
		// Ideally, we should also check if the user has access to the deal
		await getUserId(ctx);

		return await ctx.db
			.query("colab_documents")
			.withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
			.collect();
	},
});

// Create a new document
export const create = mutation({
	args: {
		title: v.string(),
		content: v.string(),
		markdown: v.optional(v.string()),
		userId: v.optional(v.string()), // Kept but ignored to enforce auth
		dealId: v.optional(v.id("deals")),
	},
	handler: async (ctx, args) => {
		const userId = await getUserId(ctx);
		const now = Date.now();

		return await ctx.db.insert("colab_documents", {
			title: args.title,
			content: args.content,
			markdown: args.markdown,
			userId: userId, // Always use authenticated user
			dealId: args.dealId,
			createdAt: now,
			updatedAt: now,
		});
	},
});

// Update a document
export const update = mutation({
	args: {
		id: v.id("colab_documents"),
		title: v.optional(v.string()),
		content: v.optional(v.string()),
		markdown: v.optional(v.string()),
		dealId: v.optional(v.id("deals")),
	},
	handler: async (ctx, args) => {
		const userId = await getUserId(ctx);
		const { id, ...updates } = args;

		const doc = await ctx.db.get(id);
		if (!doc) {
			throw new Error("Document not found");
		}

		if (doc.userId !== userId) {
			throw new Error("Unauthorized");
		}

		return await ctx.db.patch(id, {
			...updates,
			updatedAt: Date.now(),
		});
	},
});

// Archive a document (soft delete)
export const archive = mutation({
	args: { id: v.id("colab_documents") },
	handler: async (ctx, args) => {
		const userId = await getUserId(ctx);

		const doc = await ctx.db.get(args.id);
		if (!doc) {
			throw new Error("Document not found");
		}

		if (doc.userId !== userId) {
			throw new Error("Unauthorized");
		}

		return await ctx.db.patch(args.id, {
			isArchived: true,
			updatedAt: Date.now(),
		});
	},
});

// Permanently delete a document
export const remove = mutation({
	args: { id: v.id("colab_documents") },
	handler: async (ctx, args) => {
		const userId = await getUserId(ctx);

		const doc = await ctx.db.get(args.id);
		if (!doc) {
			throw new Error("Document not found");
		}

		if (doc.userId !== userId) {
			throw new Error("Unauthorized");
		}

		return await ctx.db.delete(args.id);
	},
});
