import {
	mutation,
	query,
	MutationCtx,
	internalMutation,
} from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./auth_utils";
import { Id } from "./_generated/dataModel";
import { batchGet, extractIds } from "./lib/batch";

// ============================================
// QUERIES
// ============================================

export const getNotifications = query({
	args: {
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);

		const limit = args.limit ?? 50;

		const notifications = await ctx.db
			.query("notifications")
			.withIndex("by_recipientId", (q) => q.eq("recipientId", user._id))
			.order("desc")
			.take(limit);

		// Batch fetch trigger users (avoids N+1)
		const triggerIds = extractIds(notifications, "triggerId");
		const triggerUsers = await batchGet(ctx, triggerIds);
		const triggerMap = new Map(
			triggerIds.map((id, i) => [id, triggerUsers[i]]),
		);

		// Enrich with trigger user information (no async)
		const enriched = notifications.map((n) => {
			const triggerUser = n.triggerId ? triggerMap.get(n.triggerId) : null;
			return {
				...n,
				triggerUserName: triggerUser?.name ?? "System",
				triggerUserAvatar: triggerUser?.avatarUrl,
			};
		});

		return enriched;
	},
});

export const getUnreadCount = query({
	args: {},
	handler: async (ctx) => {
		const user = await getAuthenticatedUser(ctx);

		const unread = await ctx.db
			.query("notifications")
			.withIndex("by_recipient_read", (q) =>
				q.eq("recipientId", user._id).eq("isRead", false),
			)
			.collect();

		return unread.length;
	},
});

// ============================================
// MUTATIONS
// ============================================

export const markAsRead = mutation({
	args: {
		notificationId: v.id("notifications"),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);
		const notification = await ctx.db.get(args.notificationId);

		if (!notification) {
			throw new Error("Notification not found");
		}

		if (notification.recipientId !== user._id) {
			throw new Error("Unauthorized");
		}

		await ctx.db.patch(args.notificationId, { isRead: true });
	},
});

export const markAllAsRead = mutation({
	args: {},
	handler: async (ctx) => {
		const user = await getAuthenticatedUser(ctx);

		const unread = await ctx.db
			.query("notifications")
			.withIndex("by_recipient_read", (q) =>
				q.eq("recipientId", user._id).eq("isRead", false),
			)
			.collect();

		await Promise.all(unread.map((n) => ctx.db.patch(n._id, { isRead: true })));
	},
});

// ============================================
// INTERNAL HELPERS
// ============================================

/**
 * Trigger a notification for a user.
 * This is an internal helper to be used by other mutations.
 */
export async function notify(
	ctx: MutationCtx,
	args: {
		recipientId: Id<"users">;
		triggerId?: Id<"users">;
		type: string;
		entityType: string;
		entityId: string;
		payload?: any;
	},
) {
	await ctx.db.insert("notifications", {
		recipientId: args.recipientId,
		triggerId: args.triggerId,
		type: args.type,
		entityType: args.entityType,
		entityId: args.entityId,
		isRead: false,
		payload: args.payload,
	});
}

/**
 * Create a notification (internal mutation for actions)
 */
export const createInternal = internalMutation({
	args: {
		recipientId: v.id("users"),
		triggerId: v.optional(v.id("users")),
		type: v.string(),
		entityType: v.string(),
		entityId: v.string(),
		payload: v.optional(v.any()),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("notifications", {
			recipientId: args.recipientId,
			triggerId: args.triggerId,
			type: args.type,
			entityType: args.entityType,
			entityId: args.entityId,
			isRead: false,
			payload: args.payload,
		});
	},
});
