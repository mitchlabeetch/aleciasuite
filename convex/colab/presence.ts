/**
 * Colab Presence Module
 *
 * Real-time presence tracking for collaborative editing.
 * Part of the unified Convex backend (Phase 2 migration).
 */

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Presence System
 *
 * Tracks active users viewing/editing documents and deals.
 * Uses Convex's real-time capabilities for live updates.
 */

// Update presence (called periodically by clients)
export const heartbeat = mutation({
	args: {
		resourceType: v.union(v.literal("document"), v.literal("deal")),
		resourceId: v.string(),
		userId: v.string(),
		userName: v.optional(v.string()),
		userColor: v.optional(v.string()),
		cursorPosition: v.optional(
			v.object({
				x: v.number(),
				y: v.number(),
			}),
		),
	},
	handler: async (ctx, args) => {
		// Find existing presence entry
		const existing = await ctx.db
			.query("colab_presence")
			.withIndex("by_resource_user", (q) =>
				q
					.eq("resourceType", args.resourceType)
					.eq("resourceId", args.resourceId)
					.eq("userId", args.userId),
			)
			.first();

		const now = Date.now();

		if (existing) {
			// Update existing presence
			await ctx.db.patch(existing._id, {
				userName: args.userName,
				userColor: args.userColor,
				cursorPosition: args.cursorPosition,
				lastActiveAt: now,
			});
		} else {
			// Create new presence entry
			await ctx.db.insert("colab_presence", {
				resourceType: args.resourceType,
				resourceId: args.resourceId,
				userId: args.userId,
				userName: args.userName,
				userColor: args.userColor,
				cursorPosition: args.cursorPosition,
				lastActiveAt: now,
			});
		}
	},
});

// Get active users for a resource (active within last 30 seconds)
export const getActiveUsers = query({
	args: {
		resourceType: v.union(v.literal("document"), v.literal("deal")),
		resourceId: v.string(),
	},
	handler: async (ctx, args) => {
		const cutoff = Date.now() - 30000; // 30 seconds ago

		const presences = await ctx.db
			.query("colab_presence")
			.withIndex("by_resource", (q) =>
				q
					.eq("resourceType", args.resourceType)
					.eq("resourceId", args.resourceId),
			)
			.collect();

		// Filter to only active users
		return presences.filter((p) => p.lastActiveAt > cutoff);
	},
});

// Leave a resource (explicit disconnect)
export const leave = mutation({
	args: {
		resourceType: v.union(v.literal("document"), v.literal("deal")),
		resourceId: v.string(),
		userId: v.string(),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("colab_presence")
			.withIndex("by_resource_user", (q) =>
				q
					.eq("resourceType", args.resourceType)
					.eq("resourceId", args.resourceId)
					.eq("userId", args.userId),
			)
			.first();

		if (existing) {
			await ctx.db.delete(existing._id);
		}
	},
});

// Cleanup stale presence entries (called by cron or admin)
export const cleanupStale = mutation({
	args: {},
	handler: async (ctx) => {
		const cutoff = Date.now() - 60000; // 1 minute ago

		const staleEntries = await ctx.db.query("colab_presence").collect();

		let cleaned = 0;
		for (const entry of staleEntries) {
			if (entry.lastActiveAt < cutoff) {
				await ctx.db.delete(entry._id);
				cleaned++;
			}
		}

		return { cleaned };
	},
});
