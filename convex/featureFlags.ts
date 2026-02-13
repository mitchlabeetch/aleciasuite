/**
 * Feature Flags - Gradual Rollout System
 *
 * Server-side feature flag management with:
 * - Multiple rollout strategies (all, percentage, users, roles, domains)
 * - Consistent assignment for percentage rollouts
 * - Environment targeting
 * - Expiration dates
 */

import { mutation, query, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser, getOptionalUser } from "./auth_utils";
import type { Id, Doc } from "./_generated/dataModel";

// =============================================================================
// TYPES
// =============================================================================

type RolloutStrategy =
	| "all"
	| "none"
	| "percentage"
	| "users"
	| "roles"
	| "domains";

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get all feature flags
 */
export const list = query({
	args: {
		category: v.optional(
			v.union(
				v.literal("feature"),
				v.literal("experiment"),
				v.literal("ops"),
				v.literal("release"),
			),
		),
		enabledOnly: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const user = await getOptionalUser(ctx);
		if (!user) return [];

		let flags;
		if (args.enabledOnly) {
			flags = await ctx.db
				.query("feature_flags")
				.withIndex("by_enabled", (q) => q.eq("enabled", true))
				.collect();
		} else {
			flags = await ctx.db.query("feature_flags").collect();
		}

		if (args.category) {
			flags = flags.filter((f) => f.category === args.category);
		}

		return flags;
	},
});

/**
 * Get a single feature flag by key
 */
export const getByKey = query({
	args: { key: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("feature_flags")
			.withIndex("by_key", (q) => q.eq("key", args.key))
			.first();
	},
});

/**
 * Check if a feature flag is enabled for the current user
 */
export const isEnabled = query({
	args: { key: v.string() },
	handler: async (ctx, args) => {
		const user = await getOptionalUser(ctx);

		const flag = await ctx.db
			.query("feature_flags")
			.withIndex("by_key", (q) => q.eq("key", args.key))
			.first();

		if (!flag) return false;
		if (!flag.enabled) return false;

		// Check expiration
		if (flag.expiresAt && flag.expiresAt < Date.now()) {
			return false;
		}

		// Check environment (if specified)
		if (flag.environments && flag.environments.length > 0) {
			const currentEnv =
				process.env.NODE_ENV === "production"
					? "production"
					: process.env.NODE_ENV === "development"
						? "development"
						: "staging";

			if (
				!flag.environments.includes(
					currentEnv as "development" | "staging" | "production",
				)
			) {
				return false;
			}
		}

		// Evaluate rollout strategy
		switch (flag.rolloutStrategy) {
			case "all":
				return true;

			case "none":
				return false;

			case "percentage":
				if (!user) return false;
				return await evaluatePercentageRollout(ctx, flag, user._id);

			case "users":
				if (!user) return false;
				return flag.allowedUserIds?.includes(user._id) ?? false;

			case "roles":
				if (!user) return false;
				return flag.allowedRoles?.includes(user.role) ?? false;

			case "domains":
				if (!user) return false;
				const userDomain = user.email.split("@")[1];
				return flag.allowedDomains?.includes(userDomain) ?? false;

			default:
				return false;
		}
	},
});

/**
 * Get all enabled flags for the current user
 * Returns a map of flag keys to boolean values
 */
export const getEnabledFlags = query({
	args: {},
	handler: async (ctx) => {
		const user = await getOptionalUser(ctx);

		const flags = await ctx.db
			.query("feature_flags")
			.withIndex("by_enabled", (q) => q.eq("enabled", true))
			.collect();

		const result: Record<string, boolean> = {};

		for (const flag of flags) {
			// Check expiration
			if (flag.expiresAt && flag.expiresAt < Date.now()) {
				result[flag.key] = false;
				continue;
			}

			// Check environment
			if (flag.environments && flag.environments.length > 0) {
				const currentEnv =
					process.env.NODE_ENV === "production"
						? "production"
						: process.env.NODE_ENV === "development"
							? "development"
							: "staging";

				if (
					!flag.environments.includes(
						currentEnv as "development" | "staging" | "production",
					)
				) {
					result[flag.key] = false;
					continue;
				}
			}

			// Evaluate strategy
			switch (flag.rolloutStrategy) {
				case "all":
					result[flag.key] = true;
					break;

				case "none":
					result[flag.key] = false;
					break;

				case "percentage":
					if (!user) {
						result[flag.key] = false;
					} else {
						result[flag.key] = await evaluatePercentageRollout(
							ctx,
							flag,
							user._id,
						);
					}
					break;

				case "users":
					result[flag.key] = user
						? (flag.allowedUserIds?.includes(user._id) ?? false)
						: false;
					break;

				case "roles":
					result[flag.key] = user
						? (flag.allowedRoles?.includes(user.role) ?? false)
						: false;
					break;

				case "domains":
					if (!user) {
						result[flag.key] = false;
					} else {
						const userDomain = user.email.split("@")[1];
						result[flag.key] =
							flag.allowedDomains?.includes(userDomain) ?? false;
					}
					break;

				default:
					result[flag.key] = false;
			}
		}

		return result;
	},
});

// Helper function to evaluate percentage-based rollout
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function evaluatePercentageRollout(
	ctx: any,
	flag: Doc<"feature_flags">,
	userId: Id<"users">,
): Promise<boolean> {
	// Check if we already have an assignment for this user
	const existingAssignment = await ctx.db
		.query("feature_flag_assignments")
		.withIndex("by_flag_user", (q: any) =>
			q.eq("flagKey", flag.key).eq("userId", userId),
		)
		.first();

	if (existingAssignment) {
		return existingAssignment.assigned;
	}

	// Generate consistent assignment based on user ID hash
	const percentage = flag.rolloutPercentage ?? 0;
	const hash = simpleHash(userId + flag.key);
	const bucket = hash % 100;

	return bucket < percentage;
}

// Simple hash function for consistent bucketing
function simpleHash(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return Math.abs(hash);
}

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Create a new feature flag
 */
export const create = mutation({
	args: {
		key: v.string(),
		name: v.string(),
		description: v.optional(v.string()),
		enabled: v.boolean(),
		rolloutStrategy: v.union(
			v.literal("all"),
			v.literal("none"),
			v.literal("percentage"),
			v.literal("users"),
			v.literal("roles"),
			v.literal("domains"),
		),
		rolloutPercentage: v.optional(v.number()),
		allowedUserIds: v.optional(v.array(v.id("users"))),
		allowedRoles: v.optional(v.array(v.string())),
		allowedDomains: v.optional(v.array(v.string())),
		environments: v.optional(
			v.array(
				v.union(
					v.literal("development"),
					v.literal("staging"),
					v.literal("production"),
				),
			),
		),
		category: v.optional(
			v.union(
				v.literal("feature"),
				v.literal("experiment"),
				v.literal("ops"),
				v.literal("release"),
			),
		),
		expiresAt: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);

		// Check if flag already exists
		const existing = await ctx.db
			.query("feature_flags")
			.withIndex("by_key", (q) => q.eq("key", args.key))
			.first();

		if (existing) {
			throw new Error(`Feature flag with key "${args.key}" already exists`);
		}

		const now = Date.now();

		const flagId = await ctx.db.insert("feature_flags", {
			key: args.key,
			name: args.name,
			description: args.description,
			enabled: args.enabled,
			rolloutStrategy: args.rolloutStrategy,
			rolloutPercentage: args.rolloutPercentage,
			allowedUserIds: args.allowedUserIds,
			allowedRoles: args.allowedRoles,
			allowedDomains: args.allowedDomains,
			environments: args.environments,
			category: args.category,
			expiresAt: args.expiresAt,
			createdBy: user._id,
			createdAt: now,
			updatedAt: now,
		});

		return flagId;
	},
});

/**
 * Update a feature flag
 */
export const update = mutation({
	args: {
		id: v.id("feature_flags"),
		name: v.optional(v.string()),
		description: v.optional(v.string()),
		enabled: v.optional(v.boolean()),
		rolloutStrategy: v.optional(
			v.union(
				v.literal("all"),
				v.literal("none"),
				v.literal("percentage"),
				v.literal("users"),
				v.literal("roles"),
				v.literal("domains"),
			),
		),
		rolloutPercentage: v.optional(v.number()),
		allowedUserIds: v.optional(v.array(v.id("users"))),
		allowedRoles: v.optional(v.array(v.string())),
		allowedDomains: v.optional(v.array(v.string())),
		environments: v.optional(
			v.array(
				v.union(
					v.literal("development"),
					v.literal("staging"),
					v.literal("production"),
				),
			),
		),
		category: v.optional(
			v.union(
				v.literal("feature"),
				v.literal("experiment"),
				v.literal("ops"),
				v.literal("release"),
			),
		),
		expiresAt: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);

		const { id, ...updates } = args;

		// Filter out undefined values
		const cleanUpdates: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(updates)) {
			if (value !== undefined) {
				cleanUpdates[key] = value;
			}
		}
		cleanUpdates.updatedAt = Date.now();

		await ctx.db.patch(id, cleanUpdates);
		return id;
	},
});

/**
 * Toggle a feature flag on/off
 */
export const toggle = mutation({
	args: { id: v.id("feature_flags") },
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);

		const flag = await ctx.db.get(args.id);
		if (!flag) throw new Error("Feature flag not found");

		await ctx.db.patch(args.id, {
			enabled: !flag.enabled,
			updatedAt: Date.now(),
		});

		return { id: args.id, enabled: !flag.enabled };
	},
});

/**
 * Delete a feature flag
 */
export const remove = mutation({
	args: { id: v.id("feature_flags") },
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);

		const flag = await ctx.db.get(args.id);
		if (!flag) throw new Error("Feature flag not found");

		// Delete all assignments for this flag
		const assignments = await ctx.db
			.query("feature_flag_assignments")
			.withIndex("by_flag_user", (q) => q.eq("flagKey", flag.key))
			.collect();

		for (const assignment of assignments) {
			await ctx.db.delete(assignment._id);
		}

		await ctx.db.delete(args.id);
		return args.id;
	},
});

/**
 * Update rollout percentage (convenience method)
 */
export const updatePercentage = mutation({
	args: {
		id: v.id("feature_flags"),
		percentage: v.number(),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);

		if (args.percentage < 0 || args.percentage > 100) {
			throw new Error("Percentage must be between 0 and 100");
		}

		await ctx.db.patch(args.id, {
			rolloutPercentage: args.percentage,
			rolloutStrategy: "percentage",
			updatedAt: Date.now(),
		});

		return args.id;
	},
});

/**
 * Add user to flag's allowed list
 */
export const addUser = mutation({
	args: {
		flagId: v.id("feature_flags"),
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);

		const flag = await ctx.db.get(args.flagId);
		if (!flag) throw new Error("Feature flag not found");

		const allowedUserIds = flag.allowedUserIds || [];
		if (!allowedUserIds.includes(args.userId)) {
			allowedUserIds.push(args.userId);
		}

		await ctx.db.patch(args.flagId, {
			allowedUserIds,
			updatedAt: Date.now(),
		});

		return args.flagId;
	},
});

/**
 * Remove user from flag's allowed list
 */
export const removeUser = mutation({
	args: {
		flagId: v.id("feature_flags"),
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);

		const flag = await ctx.db.get(args.flagId);
		if (!flag) throw new Error("Feature flag not found");

		const allowedUserIds = (flag.allowedUserIds || []).filter(
			(id) => id !== args.userId,
		);

		await ctx.db.patch(args.flagId, {
			allowedUserIds,
			updatedAt: Date.now(),
		});

		return args.flagId;
	},
});

// =============================================================================
// INTERNAL QUERIES
// =============================================================================

/**
 * Check flag status (internal - no auth check)
 */
export const isEnabledInternal = internalQuery({
	args: {
		key: v.string(),
		userId: v.optional(v.id("users")),
	},
	handler: async (ctx, args) => {
		const flag = await ctx.db
			.query("feature_flags")
			.withIndex("by_key", (q) => q.eq("key", args.key))
			.first();

		if (!flag || !flag.enabled) return false;

		// Check expiration
		if (flag.expiresAt && flag.expiresAt < Date.now()) {
			return false;
		}

		// For strategies that don't need a user
		if (flag.rolloutStrategy === "all") return true;
		if (flag.rolloutStrategy === "none") return false;

		// For user-specific strategies, need user ID
		if (!args.userId) return false;

		const user = await ctx.db.get(args.userId);
		if (!user) return false;

		switch (flag.rolloutStrategy) {
			case "percentage":
				const hash = simpleHash(args.userId + flag.key);
				const bucket = hash % 100;
				return bucket < (flag.rolloutPercentage ?? 0);

			case "users":
				return flag.allowedUserIds?.includes(args.userId) ?? false;

			case "roles":
				return flag.allowedRoles?.includes(user.role) ?? false;

			case "domains":
				const userDomain = user.email.split("@")[1];
				return flag.allowedDomains?.includes(userDomain) ?? false;

			default:
				return false;
		}
	},
});
