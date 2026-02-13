// Microsoft Database Operations (V8 Runtime)
// These internal queries/mutations run in V8 (not Node.js)

import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// TOKEN STORAGE (Internal)
// Uses dedicated microsoft_tokens table
// ============================================

export const storeTokens = internalMutation({
	args: {
		accessToken: v.string(),
		refreshToken: v.string(),
		expiresAt: v.number(),
		userId: v.optional(v.string()), // Microsoft user ID
		scope: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const now = Date.now();

		// Check for existing token record (singleton pattern)
		const existing = await ctx.db.query("microsoft_tokens").first();

		if (existing) {
			// Update existing tokens
			await ctx.db.patch(existing._id, {
				accessToken: args.accessToken,
				refreshToken: args.refreshToken,
				expiresAt: args.expiresAt,
				userId: args.userId,
				scope: args.scope,
				updatedAt: now,
			});
		} else {
			// Create new token record
			await ctx.db.insert("microsoft_tokens", {
				accessToken: args.accessToken,
				refreshToken: args.refreshToken,
				expiresAt: args.expiresAt,
				userId: args.userId,
				scope: args.scope,
				createdAt: now,
				updatedAt: now,
			});
		}
	},
});

export const getStoredTokens = internalQuery({
	args: {},
	handler: async (ctx) => {
		const tokens = await ctx.db.query("microsoft_tokens").first();
		if (!tokens) return null;

		return {
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
			expiresAt: tokens.expiresAt,
			userId: tokens.userId,
			scope: tokens.scope,
		};
	},
});

export const clearTokens = internalMutation({
	args: {},
	handler: async (ctx) => {
		const existing = await ctx.db.query("microsoft_tokens").first();
		if (existing) {
			await ctx.db.delete(existing._id);
		}
	},
});
