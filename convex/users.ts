/**
 * Users Module - Identity & Profile Management
 *
 * Implements unified user identity across Website and Colab.
 *
 * @see Batch 7: Backend Schema Perfection - Task 7.3
 */

import { mutation, query, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getOptionalUser } from "./auth_utils";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import type { UserIdentity } from "convex/server";

// =============================================================================
// Helper Functions (Extracted to reduce cyclomatic complexity)
// =============================================================================

/**
 * Find existing user by clerkId or tokenIdentifier
 */
async function findExistingUser(
	ctx: MutationCtx,
	clerkId: string,
	tokenIdentifier: string,
): Promise<Doc<"users"> | null> {
	// Try clerkId first (preferred)
	const byClerkId = await ctx.db
		.query("users")
		.withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
		.first();

	if (byClerkId) return byClerkId;

	// Fallback to tokenIdentifier for legacy users
	return ctx.db
		.query("users")
		.withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
		.first();
}

/**
 * Build update payload for existing user
 */
function buildUpdatePayload(
	existingUser: Doc<"users">,
	identity: UserIdentity,
	clerkId: string,
	now: number,
): Partial<Doc<"users">> {
	return {
		clerkId: existingUser.clerkId || clerkId,
		email: identity.email ?? existingUser.email,
		name: identity.name ?? existingUser.name,
		avatarUrl: identity.pictureUrl ?? existingUser.avatarUrl,
		imageUrl: identity.pictureUrl ?? existingUser.imageUrl,
		lastSeen: now,
	};
}

/**
 * Build insert payload for new user
 */
function buildInsertPayload(
	identity: UserIdentity,
	clerkId: string,
	tokenIdentifier: string,
	now: number,
) {
	return {
		tokenIdentifier,
		clerkId,
		email: identity.email ?? "",
		name: identity.name ?? "",
		avatarUrl: identity.pictureUrl ?? "",
		imageUrl: identity.pictureUrl ?? "",
		role: "user" as const,
		createdAt: now,
		lastSeen: now,
	};
}

// =============================================================================
// User Synchronization (Task 7.3)
// =============================================================================

/**
 * Ensure user exists in database
 * Creates new user on first login, updates profile on subsequent logins
 *
 * Call this on app load to maintain user sync
 */
export const ensureUser = mutation({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Unauthorized");

		const clerkId = identity.subject;
		const tokenIdentifier = identity.tokenIdentifier;
		const now = Date.now();

		const existingUser = await findExistingUser(ctx, clerkId, tokenIdentifier);

		if (existingUser) {
			const updatePayload = buildUpdatePayload(
				existingUser,
				identity,
				clerkId,
				now,
			);
			await ctx.db.patch(existingUser._id, updatePayload);
			return { userId: existingUser._id, isNew: false };
		}

		const insertPayload = buildInsertPayload(
			identity,
			clerkId,
			tokenIdentifier,
			now,
		);
		const newUserId = await ctx.db.insert("users", insertPayload);
		return { userId: newUserId, isNew: true };
	},
});

/**
 * Get current authenticated user
 */
export const getCurrent = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const clerkId = identity.subject;

		// Try by clerkId first
		let user = await ctx.db
			.query("users")
			.withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
			.first();

		// Fallback to tokenIdentifier
		if (!user) {
			user = await ctx.db
				.query("users")
				.withIndex("by_token", (q) =>
					q.eq("tokenIdentifier", identity.tokenIdentifier),
				)
				.first();
		}

		if (!user) return null;

		return {
			_id: user._id,
			name: user.name,
			email: user.email,
			role: user.role,
			avatarUrl: user.avatarUrl || user.imageUrl,
		};
	},
});

// =============================================================================
// Internal Queries (for actions)
// =============================================================================

/**
 * Get user by ID (internal - no auth check)
 */
export const internalGetById = internalQuery({
	args: { userId: v.id("users") },
	handler: async (ctx, { userId }) => {
		const user = await ctx.db.get(userId);
		if (!user) return null;

		return {
			_id: user._id,
			name: user.name,
			email: user.email,
			role: user.role,
			avatarUrl: user.avatarUrl || user.imageUrl,
		};
	},
});

/**
 * Get user by Clerk ID (internal - for actions)
 */
export const getByClerkId = internalQuery({
	args: { clerkId: v.string() },
	handler: async (ctx, { clerkId }) => {
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
			.first();

		if (!user) return null;

		return {
			_id: user._id,
			name: user.name,
			email: user.email,
			role: user.role,
			avatarUrl: user.avatarUrl || user.imageUrl,
		};
	},
});

// =============================================================================
// User Queries
// =============================================================================

/**
 * Get all users (for mentions, assignees, etc.)
 */
export const getAllUsers = query({
	args: {},
	handler: async (ctx) => {
		const currentUser = await getOptionalUser(ctx);
		if (!currentUser) return []; // Not authenticated

		const users = await ctx.db.query("users").collect();
		return users.map((u) => ({
			_id: u._id,
			name: u.name,
			email: u.email,
			role: u.role,
			avatarUrl: u.avatarUrl || u.imageUrl,
		}));
	},
});

/**
 * Get user by ID
 */
export const getById = query({
	args: { userId: v.id("users") },
	handler: async (ctx, { userId }) => {
		const currentUser = await getOptionalUser(ctx);
		if (!currentUser) return null;

		const user = await ctx.db.get(userId);
		if (!user) return null;

		return {
			_id: user._id,
			name: user.name,
			email: user.email,
			role: user.role,
			avatarUrl: user.avatarUrl || user.imageUrl,
		};
	},
});
