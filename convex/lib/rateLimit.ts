/**
 * Rate Limiting Utility for Convex
 *
 * Provides rate limiting for sensitive operations like:
 * - OAuth callbacks
 * - Login attempts
 * - API mutations
 * - File uploads
 *
 * Uses a sliding window algorithm with configurable limits.
 */

import { mutation, query, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";

// =============================================================================
// TYPES
// =============================================================================

export interface RateLimitConfig {
	/** Maximum number of requests allowed in the window */
	maxRequests: number;
	/** Window size in milliseconds */
	windowMs: number;
	/** Optional key prefix for namespacing */
	keyPrefix?: string;
}

// Preset configurations for common use cases
export const RATE_LIMIT_PRESETS = {
	// OAuth operations - strict limits
	oauth: {
		maxRequests: 10,
		windowMs: 60 * 1000, // 10 requests per minute
		keyPrefix: "oauth",
	},
	// Login attempts - very strict
	login: {
		maxRequests: 5,
		windowMs: 15 * 60 * 1000, // 5 attempts per 15 minutes
		keyPrefix: "login",
	},
	// API mutations - moderate limits
	mutation: {
		maxRequests: 100,
		windowMs: 60 * 1000, // 100 requests per minute
		keyPrefix: "mutation",
	},
	// File uploads - moderate limits
	upload: {
		maxRequests: 20,
		windowMs: 60 * 1000, // 20 uploads per minute
		keyPrefix: "upload",
	},
	// Data room access - moderate limits
	dataRoom: {
		maxRequests: 50,
		windowMs: 60 * 1000, // 50 requests per minute
		keyPrefix: "dataroom",
	},
	// Email sending - strict limits
	email: {
		maxRequests: 10,
		windowMs: 60 * 60 * 1000, // 10 emails per hour
		keyPrefix: "email",
	},
} as const;

// =============================================================================
// IN-MEMORY RATE LIMITING (for edge/middleware)
// =============================================================================

// In-memory store for rate limiting (resets on server restart)
// For production, consider using Redis or Convex's built-in rate limiting
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Check rate limit (in-memory, for use in actions)
 */
export function checkRateLimitInMemory(
	key: string,
	config: RateLimitConfig,
): { allowed: boolean; remaining: number; resetAt: number } {
	const now = Date.now();
	const fullKey = config.keyPrefix ? `${config.keyPrefix}:${key}` : key;

	const entry = rateLimitStore.get(fullKey);

	// No entry or window expired - create new window
	if (!entry || now >= entry.resetAt) {
		const resetAt = now + config.windowMs;
		rateLimitStore.set(fullKey, { count: 1, resetAt });
		return {
			allowed: true,
			remaining: config.maxRequests - 1,
			resetAt,
		};
	}

	// Within window - check limit
	if (entry.count >= config.maxRequests) {
		return {
			allowed: false,
			remaining: 0,
			resetAt: entry.resetAt,
		};
	}

	// Increment count
	entry.count++;
	return {
		allowed: true,
		remaining: config.maxRequests - entry.count,
		resetAt: entry.resetAt,
	};
}

/**
 * Reset rate limit for a key (e.g., after successful verification)
 */
export function resetRateLimitInMemory(key: string, keyPrefix?: string): void {
	const fullKey = keyPrefix ? `${keyPrefix}:${key}` : key;
	rateLimitStore.delete(fullKey);
}

// =============================================================================
// CONVEX-BACKED RATE LIMITING (persistent)
// =============================================================================

// Note: This requires a rate_limit_entries table in the schema
// Add this to schema.ts if not present:
// rate_limit_entries: defineTable({
//   key: v.string(),
//   count: v.number(),
//   windowStart: v.number(),
//   windowEnd: v.number(),
// })
//   .index("by_key", ["key"])
//   .index("by_window_end", ["windowEnd"]),

/**
 * Check and increment rate limit (persistent)
 * Returns whether the request is allowed
 */
export const checkRateLimit = mutation({
	args: {
		key: v.string(),
		maxRequests: v.number(),
		windowMs: v.number(),
		keyPrefix: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const now = Date.now();
		const fullKey = args.keyPrefix ? `${args.keyPrefix}:${args.key}` : args.key;

		// Try to find existing entry
		const existing = await ctx.db
			.query("rate_limit_entries")
			.withIndex("by_key", (q) => q.eq("key", fullKey))
			.first();

		// No entry or window expired - create new window
		if (!existing || now >= existing.windowEnd) {
			// Delete old entry if exists
			if (existing) {
				await ctx.db.delete(existing._id);
			}

			// Create new entry
			await ctx.db.insert("rate_limit_entries", {
				key: fullKey,
				count: 1,
				windowStart: now,
				windowEnd: now + args.windowMs,
			});

			return {
				allowed: true,
				remaining: args.maxRequests - 1,
				resetAt: now + args.windowMs,
			};
		}

		// Within window - check limit
		if (existing.count >= args.maxRequests) {
			return {
				allowed: false,
				remaining: 0,
				resetAt: existing.windowEnd,
				retryAfter: existing.windowEnd - now,
			};
		}

		// Increment count
		await ctx.db.patch(existing._id, {
			count: existing.count + 1,
		});

		return {
			allowed: true,
			remaining: args.maxRequests - existing.count - 1,
			resetAt: existing.windowEnd,
		};
	},
});

/**
 * Get current rate limit status without incrementing
 */
export const getRateLimitStatus = query({
	args: {
		key: v.string(),
		maxRequests: v.number(),
		windowMs: v.number(),
		keyPrefix: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const now = Date.now();
		const fullKey = args.keyPrefix ? `${args.keyPrefix}:${args.key}` : args.key;

		const existing = await ctx.db
			.query("rate_limit_entries")
			.withIndex("by_key", (q) => q.eq("key", fullKey))
			.first();

		if (!existing || now >= existing.windowEnd) {
			return {
				count: 0,
				remaining: args.maxRequests,
				resetAt: now + args.windowMs,
				isLimited: false,
			};
		}

		return {
			count: existing.count,
			remaining: Math.max(0, args.maxRequests - existing.count),
			resetAt: existing.windowEnd,
			isLimited: existing.count >= args.maxRequests,
		};
	},
});

/**
 * Reset rate limit for a specific key
 */
export const resetRateLimit = mutation({
	args: {
		key: v.string(),
		keyPrefix: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const fullKey = args.keyPrefix ? `${args.keyPrefix}:${args.key}` : args.key;

		const existing = await ctx.db
			.query("rate_limit_entries")
			.withIndex("by_key", (q) => q.eq("key", fullKey))
			.first();

		if (existing) {
			await ctx.db.delete(existing._id);
		}

		return { success: true };
	},
});

/**
 * Clean up expired rate limit entries (run periodically)
 */
export const cleanupExpiredEntries = internalMutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();

		// Find and delete expired entries
		const expired = await ctx.db
			.query("rate_limit_entries")
			.withIndex("by_window_end")
			.filter((q) => q.lt(q.field("windowEnd"), now))
			.collect();

		for (const entry of expired) {
			await ctx.db.delete(entry._id);
		}

		return { deleted: expired.length };
	},
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create a rate limit key from IP address (or fallback)
 */
export function createRateLimitKey(
	identifier: string,
	operation: string,
): string {
	return `${operation}:${identifier}`;
}

/**
 * Format rate limit headers for HTTP response
 */
export function formatRateLimitHeaders(result: {
	remaining: number;
	resetAt: number;
}): Record<string, string> {
	return {
		"X-RateLimit-Remaining": String(result.remaining),
		"X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
		"Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
	};
}

/**
 * Throw a rate limit error with proper formatting
 */
export function throwRateLimitError(resetAt: number): never {
	const retryAfterSeconds = Math.ceil((resetAt - Date.now()) / 1000);
	throw new Error(
		`Rate limit exceeded. Please try again in ${retryAfterSeconds} seconds.`,
	);
}
