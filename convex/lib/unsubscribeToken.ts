/**
 * Unsubscribe Token Generation
 *
 * Generates cryptographically secure tokens for email unsubscribe links.
 * Implements CAN-SPAM/GDPR compliance requirements.
 */

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// Token expiry: 90 days from creation
const TOKEN_EXPIRY_DAYS = 90;

/**
 * Generate a cryptographically secure unsubscribe token
 *
 * @param userId - User ID from users table
 * @param email - User's email address
 * @returns Secure token string
 */
export const generateUnsubscribeToken = mutation({
	args: {
		userId: v.id("users"),
		email: v.string(),
	},
	handler: async (ctx, args) => {
		const now = Date.now();
		const expiresAt = now + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

		// Generate cryptographically secure random token
		// Note: In Node.js/Convex environment, we use crypto.randomBytes
		// For browser compatibility, you can use Web Crypto API
		const randomBytes = new Uint8Array(32);
		crypto.getRandomValues(randomBytes);

		// Convert to base64url (URL-safe base64)
		const token = base64UrlEncode(randomBytes);

		// Check if a valid token already exists for this user
		const existingToken = await ctx.db
			.query("email_unsubscribe_tokens")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.filter((q) => q.gt(q.field("expiresAt"), now))
			.first();

		if (existingToken) {
			// Return existing valid token
			return existingToken.token;
		}

		// Store token in database
		await ctx.db.insert("email_unsubscribe_tokens", {
			userId: args.userId,
			email: args.email,
			token,
			createdAt: now,
			expiresAt,
		});

		return token;
	},
});

/**
 * Validate an unsubscribe token
 *
 * @param token - Token to validate
 * @returns Token data if valid, null otherwise
 */
export const validateUnsubscribeToken = query({
	args: {
		token: v.string(),
	},
	handler: async (ctx, args) => {
		const now = Date.now();

		// Find token in database
		const tokenRecord = await ctx.db
			.query("email_unsubscribe_tokens")
			.withIndex("by_token", (q) => q.eq("token", args.token))
			.first();

		if (!tokenRecord) {
			return null;
		}

		// Check if token is expired
		if (tokenRecord.expiresAt && tokenRecord.expiresAt < now) {
			return null;
		}

		// Fetch user details
		const user = await ctx.db.get(tokenRecord.userId);
		if (!user) {
			return null;
		}

		return {
			userId: tokenRecord.userId,
			email: tokenRecord.email,
			userName: user.name,
			createdAt: tokenRecord.createdAt,
			expiresAt: tokenRecord.expiresAt,
		};
	},
});

/**
 * Cleanup expired tokens (maintenance function)
 * Should be called periodically via cron
 */
export const cleanupExpiredTokens = mutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();

		// Find all expired tokens
		const expiredTokens = await ctx.db
			.query("email_unsubscribe_tokens")
			.filter((q) => q.lt(q.field("expiresAt"), now))
			.collect();

		// Delete expired tokens
		let deletedCount = 0;
		for (const token of expiredTokens) {
			await ctx.db.delete(token._id);
			deletedCount++;
		}

		return {
			success: true,
			deletedCount,
			message: `Cleaned up ${deletedCount} expired tokens`,
		};
	},
});

/**
 * Get all tokens for a specific user (admin function)
 */
export const getUserTokens = query({
	args: {
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const tokens = await ctx.db
			.query("email_unsubscribe_tokens")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.collect();

		return tokens;
	},
});

/**
 * Revoke a specific token (admin function)
 */
export const revokeToken = mutation({
	args: {
		token: v.string(),
	},
	handler: async (ctx, args) => {
		const tokenRecord = await ctx.db
			.query("email_unsubscribe_tokens")
			.withIndex("by_token", (q) => q.eq("token", args.token))
			.first();

		if (!tokenRecord) {
			throw new Error("Token not found");
		}

		await ctx.db.delete(tokenRecord._id);

		return {
			success: true,
			message: "Token revoked successfully",
		};
	},
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Convert Uint8Array to base64url encoding (URL-safe)
 */
function base64UrlEncode(bytes: Uint8Array): string {
	// Convert bytes to binary string
	let binary = "";
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}

	// Base64 encode
	const base64 = btoa(binary);

	// Make URL-safe: replace +/= with -_~ and remove padding
	return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
