/**
 * Convex Logger Utility
 *
 * Production-safe logging for Convex backend functions.
 * Prevents sensitive information leakage in production logs.
 *
 * @module convex/lib/logger
 * @security SEC-007 - Logging Hygiene
 */

const isProduction = process.env.NODE_ENV === "production";

export const logger = {
	/**
	 * Debug logs - only shown in development
	 */
	debug: (...args: unknown[]) => {
		if (!isProduction) {
			console.debug("[DEBUG]", ...args);
		}
	},

	/**
	 * Info logs - only shown in development
	 */
	info: (...args: unknown[]) => {
		if (!isProduction) {
			console.info("[INFO]", ...args);
		}
	},

	/**
	 * Warning logs - shown in all environments
	 */
	warn: (...args: unknown[]) => {
		console.warn("[WARN]", ...args);
	},

	/**
	 * Error logs - shown in all environments
	 * TODO: Integrate with Sentry/error tracking
	 */
	error: (...args: unknown[]) => {
		console.error("[ERROR]", ...args);
	},

	/**
	 * Audit logs - always logged for security/compliance
	 * Use for: role changes, data exports, sensitive operations
	 */
	audit: (
		action: string,
		userId: string | null,
		details: Record<string, unknown>,
	) => {
		console.log(
			JSON.stringify({
				type: "AUDIT",
				action,
				userId,
				details,
				timestamp: new Date().toISOString(),
				ts: Date.now(),
			}),
		);
	},

	/**
	 * Security event logs - always logged
	 * Use for: failed auth, rate limits, suspicious activity
	 */
	security: (event: string, details: Record<string, unknown>) => {
		console.log(
			JSON.stringify({
				type: "SECURITY",
				event,
				details,
				timestamp: new Date().toISOString(),
				ts: Date.now(),
			}),
		);
	},
};
