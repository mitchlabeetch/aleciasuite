import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

/**
 * Google OAuth Token Storage
 *
 * Stores and manages Google OAuth tokens (similar to microsoft_db.ts)
 *
 * SECURITY NOTE: Tokens should be encrypted before storage when
 * TOKEN_ENCRYPTION_KEY is set. The encryption/decryption happens
 * in the action layer (google.ts) before calling these mutations.
 *
 * For production, ensure TOKEN_ENCRYPTION_KEY is set in environment
 * variables (64 hex characters = 32 bytes).
 */

// Token encryption is handled at the action layer
// See: convex/lib/crypto.ts for encryption utilities
// See: convex/actions/google.ts for encrypted token handling

/**
 * Store Google OAuth tokens
 * Note: Tokens should be pre-encrypted if TOKEN_ENCRYPTION_KEY is set
 */
export const storeTokens = internalMutation({
	args: {
		accessToken: v.string(),
		refreshToken: v.string(),
		expiresAt: v.number(),
		userId: v.optional(v.string()),
		email: v.optional(v.string()),
		scope: v.optional(v.string()),
		// Flag to indicate if tokens are encrypted (for migration purposes)
		isEncrypted: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const now = Date.now();

		// Check for existing tokens (singleton pattern)
		const existing = await ctx.db.query("google_tokens").first();

		if (existing) {
			await ctx.db.patch(existing._id, {
				accessToken: args.accessToken,
				refreshToken: args.refreshToken || existing.refreshToken,
				expiresAt: args.expiresAt,
				userId: args.userId || existing.userId,
				email: args.email || existing.email,
				scope: args.scope || existing.scope,
				updatedAt: now,
			});
			return existing._id;
		}

		return await ctx.db.insert("google_tokens", {
			accessToken: args.accessToken,
			refreshToken: args.refreshToken,
			expiresAt: args.expiresAt,
			userId: args.userId,
			email: args.email,
			scope: args.scope,
			createdAt: now,
			updatedAt: now,
		});
	},
});

/**
 * Get stored Google tokens
 * Note: Tokens should be decrypted after retrieval if encrypted
 */
export const getStoredTokens = internalQuery({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("google_tokens").first();
	},
});

/**
 * Clear Google tokens (on disconnect)
 */
export const clearTokens = internalMutation({
	args: {},
	handler: async (ctx) => {
		const tokens = await ctx.db.query("google_tokens").collect();
		for (const token of tokens) {
			await ctx.db.delete(token._id);
		}
	},
});
