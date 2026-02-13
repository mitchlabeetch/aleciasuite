/**
 * Rate Limiting Utility
 *
 * Protects API routes from abuse by limiting request frequency.
 * Uses Upstash Redis for distributed rate limiting.
 *
 * @module lib/rate-limit
 * @security SEC-003 - Prevents API abuse and DDoS attacks
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { logger } from "@/lib/logger";

/**
 * Redis instance for rate limiting.
 * Only initialized if credentials are available.
 * Falls back gracefully in development without Redis.
 */
const redis =
	process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
		? new Redis({
				url: process.env.UPSTASH_REDIS_REST_URL,
				token: process.env.UPSTASH_REDIS_REST_TOKEN,
			})
		: null;

/**
 * Rate limiters for different use cases.
 * Each limiter has different thresholds based on the sensitivity of the endpoint.
 */

/**
 * Standard API rate limiter: 10 requests per 10 seconds per IP
 * Use for general API endpoints like contact forms
 */
export const apiRateLimiter = redis
	? new Ratelimit({
			redis,
			limiter: Ratelimit.slidingWindow(10, "10 s"),
			analytics: true,
			prefix: "alecia:api:ratelimit",
		})
	: null;

/**
 * Strict rate limiter: 5 requests per minute per IP
 * Use for sensitive operations like authentication, password reset
 */
export const strictRateLimiter = redis
	? new Ratelimit({
			redis,
			limiter: Ratelimit.slidingWindow(5, "60 s"),
			analytics: true,
			prefix: "alecia:strict:ratelimit",
		})
	: null;

/**
 * Generous rate limiter: 100 requests per minute per IP
 * Use for read-heavy endpoints like search, list views
 */
export const generousRateLimiter = redis
	? new Ratelimit({
			redis,
			limiter: Ratelimit.slidingWindow(100, "60 s"),
			analytics: true,
			prefix: "alecia:generous:ratelimit",
		})
	: null;

/**
 * Rate limit check result
 */
export interface RateLimitResult {
	success: boolean;
	limit: number;
	remaining: number;
	reset: number; // Unix timestamp in seconds
}

/**
 * Check rate limit for a given identifier.
 * Returns null if rate limiting is not configured (graceful fallback).
 *
 * @param identifier - Unique identifier (typically IP address or user ID)
 * @param limiter - Which rate limiter to use (default: apiRateLimiter)
 * @returns Rate limit result or null if not configured
 *
 * @example
 * ```typescript
 * import { checkRateLimit } from '@/lib/rate-limit';
 *
 * const ip = request.headers.get('x-forwarded-for') || 'anonymous';
 * const result = await checkRateLimit(ip);
 *
 * if (result && !result.success) {
 *   return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 * }
 * ```
 */
export async function checkRateLimit(
	identifier: string,
	limiter: Ratelimit | null = apiRateLimiter,
): Promise<RateLimitResult | null> {
	if (!limiter) {
		// Rate limiting not configured - allow request (development mode)
		return null;
	}

	try {
		const { success, limit, remaining, reset } =
			await limiter.limit(identifier);
		return {
			success,
			limit,
			remaining,
			reset: Math.floor(reset / 1000), // Convert to seconds
		};
	} catch (error) {
		// If Redis fails, allow the request but log the error
		logger.error("Redis rate limit error:", error);
		return null;
	}
}

/**
 * Generate rate limit response headers.
 * Include these headers in your API responses for client transparency.
 *
 * @param result - Rate limit check result
 * @returns Headers object with rate limit information
 */
export function getRateLimitHeaders(
	result: RateLimitResult,
): Record<string, string> {
	return {
		"X-RateLimit-Limit": result.limit.toString(),
		"X-RateLimit-Remaining": result.remaining.toString(),
		"X-RateLimit-Reset": result.reset.toString(),
	};
}

/**
 * Get client IP address from request headers.
 * Handles various proxy configurations.
 *
 * @param headers - Request headers
 * @returns IP address string
 */
export function getClientIp(headers: Headers): string {
	// Check common proxy headers in order of preference
	const forwardedFor = headers.get("x-forwarded-for");
	if (forwardedFor) {
		// x-forwarded-for can contain multiple IPs, take the first one
		return forwardedFor.split(",")[0].trim();
	}

	const realIp = headers.get("x-real-ip");
	if (realIp) {
		return realIp;
	}

	// Vercel-specific header
	const vercelForwardedFor = headers.get("x-vercel-forwarded-for");
	if (vercelForwardedFor) {
		return vercelForwardedFor;
	}

	return "anonymous";
}
