/**
 * User Preferences - Cross-App Sync
 *
 * Unified user settings that sync between Panel and Colab.
 * Provides CRUD operations for user preferences.
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser, getOptionalUser } from "./auth_utils";

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get user preferences for the authenticated user
 */
export const get = query({
	args: {},
	handler: async (ctx) => {
		const user = await getOptionalUser(ctx);
		if (!user) return null;

		const preferences = await ctx.db
			.query("user_preferences")
			.withIndex("by_userId", (q) => q.eq("userId", user._id))
			.first();

		return preferences;
	},
});

/**
 * Get specific preference value
 */
export const getValue = query({
	args: {
		key: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await getOptionalUser(ctx);
		if (!user) return null;

		const preferences = await ctx.db
			.query("user_preferences")
			.withIndex("by_userId", (q) => q.eq("userId", user._id))
			.first();

		if (!preferences) return null;

		// Return specific key value
		return (preferences as Record<string, unknown>)[args.key] ?? null;
	},
});

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Create or update user preferences (upsert)
 */
export const upsert = mutation({
	args: {
		theme: v.optional(
			v.union(v.literal("light"), v.literal("dark"), v.literal("system")),
		),
		accentColor: v.optional(v.string()),
		sidebarCollapsed: v.optional(v.boolean()),
		compactMode: v.optional(v.boolean()),
		notifications: v.optional(
			v.object({
				emailEnabled: v.boolean(),
				pushEnabled: v.boolean(),
				digestFrequency: v.union(
					v.literal("realtime"),
					v.literal("hourly"),
					v.literal("daily"),
					v.literal("weekly"),
					v.literal("none"),
				),
				mentionsOnly: v.optional(v.boolean()),
				dealUpdates: v.optional(v.boolean()),
				calendarReminders: v.optional(v.boolean()),
				approvalRequests: v.optional(v.boolean()),
			}),
		),
		locale: v.optional(v.union(v.literal("fr"), v.literal("en"))),
		timezone: v.optional(v.string()),
		dateFormat: v.optional(v.string()),
		numberFormat: v.optional(v.string()),
		defaultDashboard: v.optional(v.string()),
		pinnedDeals: v.optional(v.array(v.id("deals"))),
		favoriteViews: v.optional(v.array(v.string())),
		editorFontSize: v.optional(v.number()),
		editorLineHeight: v.optional(v.number()),
		editorWordWrap: v.optional(v.boolean()),
		spellCheckEnabled: v.optional(v.boolean()),
		defaultCalendarProvider: v.optional(
			v.union(v.literal("microsoft"), v.literal("google"), v.literal("none")),
		),
		autoLinkEmails: v.optional(v.boolean()),
		keyboardShortcuts: v.optional(v.record(v.string(), v.string())),
		lastActiveApp: v.optional(v.union(v.literal("panel"), v.literal("colab"))),
		lastActiveRoute: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);
		const now = Date.now();

		// Check if preferences already exist
		const existing = await ctx.db
			.query("user_preferences")
			.withIndex("by_userId", (q) => q.eq("userId", user._id))
			.first();

		// Build update object, only including defined values
		const updates: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(args)) {
			if (value !== undefined) {
				updates[key] = value;
			}
		}
		updates.updatedAt = now;

		if (existing) {
			// Update existing preferences
			await ctx.db.patch(existing._id, updates);
			return existing._id;
		} else {
			// Create new preferences
			const preferencesId = await ctx.db.insert("user_preferences", {
				userId: user._id,
				createdAt: now,
				updatedAt: now,
				...updates,
			});
			return preferencesId;
		}
	},
});

/**
 * Update a single preference value
 */
export const updateValue = mutation({
	args: {
		key: v.string(),
		value: v.any(),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);
		const now = Date.now();

		// Validate key is a valid preference field
		const validKeys = [
			"theme",
			"accentColor",
			"sidebarCollapsed",
			"compactMode",
			"notifications",
			"locale",
			"timezone",
			"dateFormat",
			"numberFormat",
			"defaultDashboard",
			"pinnedDeals",
			"favoriteViews",
			"editorFontSize",
			"editorLineHeight",
			"editorWordWrap",
			"spellCheckEnabled",
			"defaultCalendarProvider",
			"autoLinkEmails",
			"keyboardShortcuts",
			"lastActiveApp",
			"lastActiveRoute",
		];

		if (!validKeys.includes(args.key)) {
			throw new Error(`Invalid preference key: ${args.key}`);
		}

		// Check if preferences already exist
		const existing = await ctx.db
			.query("user_preferences")
			.withIndex("by_userId", (q) => q.eq("userId", user._id))
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, {
				[args.key]: args.value,
				updatedAt: now,
			});
			return existing._id;
		} else {
			// Create new preferences with just this value
			const preferencesId = await ctx.db.insert("user_preferences", {
				userId: user._id,
				[args.key]: args.value,
				createdAt: now,
				updatedAt: now,
			});
			return preferencesId;
		}
	},
});

/**
 * Update last active state for cross-app sync
 */
export const updateLastActive = mutation({
	args: {
		app: v.union(v.literal("panel"), v.literal("colab")),
		route: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);
		const now = Date.now();

		const existing = await ctx.db
			.query("user_preferences")
			.withIndex("by_userId", (q) => q.eq("userId", user._id))
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, {
				lastActiveApp: args.app,
				lastActiveRoute: args.route,
				updatedAt: now,
			});
			return existing._id;
		} else {
			const preferencesId = await ctx.db.insert("user_preferences", {
				userId: user._id,
				lastActiveApp: args.app,
				lastActiveRoute: args.route,
				createdAt: now,
				updatedAt: now,
			});
			return preferencesId;
		}
	},
});

/**
 * Toggle a boolean preference
 */
export const toggle = mutation({
	args: {
		key: v.union(
			v.literal("sidebarCollapsed"),
			v.literal("compactMode"),
			v.literal("editorWordWrap"),
			v.literal("spellCheckEnabled"),
			v.literal("autoLinkEmails"),
		),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);
		const now = Date.now();

		const existing = await ctx.db
			.query("user_preferences")
			.withIndex("by_userId", (q) => q.eq("userId", user._id))
			.first();

		if (existing) {
			const currentValue = (existing as Record<string, unknown>)[args.key];
			await ctx.db.patch(existing._id, {
				[args.key]: !currentValue,
				updatedAt: now,
			});
			return existing._id;
		} else {
			// Create with toggled value (default is false, so toggle to true)
			const preferencesId = await ctx.db.insert("user_preferences", {
				userId: user._id,
				[args.key]: true,
				createdAt: now,
				updatedAt: now,
			});
			return preferencesId;
		}
	},
});

/**
 * Pin or unpin a deal
 */
export const togglePinnedDeal = mutation({
	args: {
		dealId: v.id("deals"),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);
		const now = Date.now();

		const existing = await ctx.db
			.query("user_preferences")
			.withIndex("by_userId", (q) => q.eq("userId", user._id))
			.first();

		if (existing) {
			const pinnedDeals = existing.pinnedDeals || [];
			const index = pinnedDeals.findIndex((id) => id === args.dealId);

			if (index >= 0) {
				// Remove from pinned
				pinnedDeals.splice(index, 1);
			} else {
				// Add to pinned
				pinnedDeals.push(args.dealId);
			}

			await ctx.db.patch(existing._id, {
				pinnedDeals,
				updatedAt: now,
			});
			return { pinned: index < 0, dealId: args.dealId };
		} else {
			// Create with this deal pinned
			await ctx.db.insert("user_preferences", {
				userId: user._id,
				pinnedDeals: [args.dealId],
				createdAt: now,
				updatedAt: now,
			});
			return { pinned: true, dealId: args.dealId };
		}
	},
});

/**
 * Reset preferences to defaults
 */
export const reset = mutation({
	args: {},
	handler: async (ctx) => {
		const user = await getAuthenticatedUser(ctx);

		const existing = await ctx.db
			.query("user_preferences")
			.withIndex("by_userId", (q) => q.eq("userId", user._id))
			.first();

		if (existing) {
			await ctx.db.delete(existing._id);
		}

		// Return confirmation
		return { success: true, message: "Preferences reset to defaults" };
	},
});
