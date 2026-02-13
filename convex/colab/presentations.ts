/**
 * Colab Presentations Module
 *
 * AI-powered presentation management.
 * Part of the unified Convex backend (Phase 2 migration).
 */

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

export const list = query({
	args: { userId: v.optional(v.string()) },
	handler: async (ctx, args) => {
		// If userId is provided, filter by it. Otherwise, return all (or handle auth)
		if (args.userId) {
			const userId = args.userId;
			return await ctx.db
				.query("colab_presentations")
				.withIndex("by_user", (q) => q.eq("userId", userId))
				.order("desc")
				.collect();
		}
		return await ctx.db.query("colab_presentations").order("desc").collect();
	},
});

export const get = query({
	args: { id: v.id("colab_presentations") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

export const create = mutation({
	args: {
		title: v.string(),
		userId: v.string(),
		workspaceId: v.optional(v.string()),
		theme: v.string(),
		language: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("colab_presentations", {
			title: args.title,
			userId: args.userId,
			workspaceId: args.workspaceId,
			theme: args.theme,
			language: args.language,
			slides: [],
			status: "draft",
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
	},
});

export const update = mutation({
	args: {
		id: v.id("colab_presentations"),
		slides: v.optional(
			v.array(
				v.object({
					id: v.string(),
					title: v.string(),
					content: v.any(),
					notes: v.optional(v.string()),
					rootImage: v.optional(
						v.object({
							url: v.string(),
							query: v.string(),
						}),
					),
				}),
			),
		),
		status: v.optional(
			v.union(
				v.literal("draft"),
				v.literal("generating"),
				v.literal("complete"),
			),
		),
		title: v.optional(v.string()),
		theme: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { id, ...updates } = args;
		await ctx.db.patch(id, {
			...updates,
			updatedAt: Date.now(),
		});
	},
});

export const deletePresentation = mutation({
	args: { id: v.id("colab_presentations") },
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
	},
});
