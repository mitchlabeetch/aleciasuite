// Presence tracking for real-time collaboration
// Shows who's online and what page they're viewing - FULLY IMPLEMENTED

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getOptionalUser } from "./auth_utils";
import { batchGet, extractIds } from "./lib/batch";

// Presence timeout in milliseconds (2 minutes)
const PRESENCE_TIMEOUT_MS = 2 * 60 * 1000;

/**
 * Get all currently active users
 * Filters out stale presence data (older than 2 minutes)
 */
export const getActiveUsers = query({
	args: {},
	handler: async (ctx) => {
		const user = await getOptionalUser(ctx);
		if (!user) return [];

		const now = Date.now();
		const cutoffTime = now - PRESENCE_TIMEOUT_MS;

		// Query presence records, filter by lastSeen
		const allPresence = await ctx.db.query("presence").collect();

		// Filter active users (seen within timeout)
		const activePresence = allPresence.filter((p) => p.lastSeen > cutoffTime);

		// Batch fetch users (avoids N+1)
		const userIds = extractIds(activePresence, "userId");
		const users = await batchGet(ctx, userIds);
		const userMap = new Map(userIds.map((id, i) => [id, users[i]]));

		// Enrich with user information (no async)
		const activeUsers = activePresence.map((presence) => {
			const presenceUser = userMap.get(presence.userId);
			if (!presenceUser) return null;

			return {
				id: presenceUser._id,
				name: presenceUser.name,
				email: presenceUser.email,
				avatarUrl: presenceUser.avatarUrl,
				currentPage: presence.currentPage,
				lastSeen: presence.lastSeen,
				isOnline: true,
			};
		});

		// Filter out nulls and return
		return activeUsers.filter((u): u is NonNullable<typeof u> => u !== null);
	},
});

/**
 * Update current user's presence
 * Called periodically by the client (every 30 seconds)
 */
export const updatePresence = mutation({
	args: {
		currentPage: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		// Find the user
		const user = await ctx.db
			.query("users")
			.withIndex("by_token", (q) =>
				q.eq("tokenIdentifier", identity.tokenIdentifier),
			)
			.first();

		if (!user) return null;

		// Check if presence record exists
		const existingPresence = await ctx.db
			.query("presence")
			.withIndex("by_userId", (q) => q.eq("userId", user._id))
			.first();

		const now = Date.now();

		if (existingPresence) {
			// Update existing presence
			await ctx.db.patch(existingPresence._id, {
				currentPage: args.currentPage,
				lastSeen: now,
			});
		} else {
			// Create new presence record
			await ctx.db.insert("presence", {
				userId: user._id,
				currentPage: args.currentPage,
				lastSeen: now,
			});
		}

		return { success: true };
	},
});

/**
 * Remove user presence on logout
 */
export const removePresence = mutation({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		// Find the user
		const user = await ctx.db
			.query("users")
			.withIndex("by_token", (q) =>
				q.eq("tokenIdentifier", identity.tokenIdentifier),
			)
			.first();

		if (!user) return null;

		// Find and delete presence record
		const existingPresence = await ctx.db
			.query("presence")
			.withIndex("by_userId", (q) => q.eq("userId", user._id))
			.first();

		if (existingPresence) {
			await ctx.db.delete(existingPresence._id);
		}

		return { success: true };
	},
});

/**
 * Cleanup stale presence records
 * Called periodically by a cron job or manually
 */
export const cleanupStalePresence = mutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		const cutoffTime = now - PRESENCE_TIMEOUT_MS;

		// Get all stale presence records
		const allPresence = await ctx.db.query("presence").collect();
		const stalePresence = allPresence.filter((p) => p.lastSeen <= cutoffTime);

		// Delete stale records
		for (const presence of stalePresence) {
			await ctx.db.delete(presence._id);
		}

		return { cleaned: stalePresence.length };
	},
});
