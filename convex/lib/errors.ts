/**
 * Error Tracking Utility for Convex Functions
 *
 * Provides structured error handling and logging for Convex actions and mutations.
 * In production, these errors can be forwarded to Sentry via the client.
 *
 * Usage:
 *   import { trackError, wrapAction, ConvexError } from "./lib/errors";
 *
 *   // Track an error
 *   trackError(error, { context: "processPayment", userId: "123" });
 *
 *   // Throw a typed error
 *   throw new ConvexError("NOT_FOUND", "Deal not found");
 */

import { logger } from "./logger";

// =============================================================================
// ERROR TYPES
// =============================================================================

export type ErrorCode =
	| "NOT_FOUND"
	| "UNAUTHORIZED"
	| "FORBIDDEN"
	| "VALIDATION_ERROR"
	| "CONFLICT"
	| "RATE_LIMITED"
	| "EXTERNAL_API_ERROR"
	| "INTERNAL_ERROR"
	| "MISSING_CONFIG"
	| "TIMEOUT";

export interface ErrorContext {
	/** The operation or function name */
	context?: string;
	/** User ID if available */
	userId?: string;
	/** Additional metadata */
	metadata?: Record<string, unknown>;
	/** The error severity */
	severity?: "error" | "warning" | "info";
}

export interface TrackedError {
	code: ErrorCode;
	message: string;
	context?: ErrorContext;
	timestamp: number;
	stack?: string;
}

// =============================================================================
// CONVEX ERROR CLASS
// =============================================================================

/**
 * Typed error class for Convex functions
 * Use this for errors that should be returned to the client
 */
export class ConvexError extends Error {
	public readonly code: ErrorCode;
	public readonly statusCode: number;
	public readonly isOperational: boolean;

	constructor(code: ErrorCode, message: string, statusCode?: number) {
		super(message);
		this.name = "ConvexError";
		this.code = code;
		this.statusCode = statusCode || codeToStatus(code);
		this.isOperational = true;

		// Capture stack trace
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, ConvexError);
		}
	}

	toJSON(): { code: ErrorCode; message: string; statusCode: number } {
		return {
			code: this.code,
			message: this.message,
			statusCode: this.statusCode,
		};
	}
}

function codeToStatus(code: ErrorCode): number {
	const statusMap: Record<ErrorCode, number> = {
		NOT_FOUND: 404,
		UNAUTHORIZED: 401,
		FORBIDDEN: 403,
		VALIDATION_ERROR: 400,
		CONFLICT: 409,
		RATE_LIMITED: 429,
		EXTERNAL_API_ERROR: 502,
		INTERNAL_ERROR: 500,
		MISSING_CONFIG: 500,
		TIMEOUT: 504,
	};
	return statusMap[code] || 500;
}

// =============================================================================
// ERROR TRACKING
// =============================================================================

// In-memory error buffer for aggregation (cleared periodically)
const errorBuffer: TrackedError[] = [];
const MAX_BUFFER_SIZE = 100;

/**
 * Track an error for monitoring
 */
export function trackError(
	error: unknown,
	context?: ErrorContext,
): TrackedError {
	const trackedError = normalizeError(error, context);

	// Log the error
	const logFn = context?.severity === "warning" ? logger.warn : logger.error;
	logFn(`[${trackedError.code}] ${trackedError.message}`, {
		context: trackedError.context,
		stack: trackedError.stack,
	});

	// Add to buffer for potential aggregation
	errorBuffer.push(trackedError);
	if (errorBuffer.length > MAX_BUFFER_SIZE) {
		errorBuffer.shift(); // Remove oldest
	}

	return trackedError;
}

/**
 * Normalize any error to a TrackedError
 */
function normalizeError(error: unknown, context?: ErrorContext): TrackedError {
	if (error instanceof ConvexError) {
		return {
			code: error.code,
			message: error.message,
			context,
			timestamp: Date.now(),
			stack: error.stack,
		};
	}

	if (error instanceof Error) {
		return {
			code: determineErrorCode(error),
			message: error.message,
			context,
			timestamp: Date.now(),
			stack: error.stack,
		};
	}

	return {
		code: "INTERNAL_ERROR",
		message: String(error),
		context,
		timestamp: Date.now(),
	};
}

/**
 * Determine error code from error message/type
 */
function determineErrorCode(error: Error): ErrorCode {
	const message = error.message.toLowerCase();

	if (message.includes("not found") || message.includes("does not exist")) {
		return "NOT_FOUND";
	}
	if (message.includes("unauthorized") || message.includes("authentication")) {
		return "UNAUTHORIZED";
	}
	if (message.includes("forbidden") || message.includes("permission")) {
		return "FORBIDDEN";
	}
	if (message.includes("validation") || message.includes("invalid")) {
		return "VALIDATION_ERROR";
	}
	if (message.includes("rate limit") || message.includes("too many")) {
		return "RATE_LIMITED";
	}
	if (message.includes("timeout") || message.includes("timed out")) {
		return "TIMEOUT";
	}
	if (message.includes("config") || message.includes("not configured")) {
		return "MISSING_CONFIG";
	}

	return "INTERNAL_ERROR";
}

// =============================================================================
// ACTION WRAPPER
// =============================================================================

/**
 * Wrap an action handler with error tracking
 *
 * @example
 * export const myAction = action({
 *   args: { ... },
 *   handler: wrapAction("myAction", async (ctx, args) => {
 *     // Your action logic
 *   }),
 * });
 */
export function wrapAction<TArgs, TResult>(
	name: string,
	handler: (ctx: unknown, args: TArgs) => Promise<TResult>,
): (ctx: unknown, args: TArgs) => Promise<TResult> {
	return async (ctx: unknown, args: TArgs): Promise<TResult> => {
		const startTime = Date.now();

		try {
			const result = await handler(ctx, args);

			// Log successful completion for slow operations
			const duration = Date.now() - startTime;
			if (duration > 5000) {
				logger.warn(`[Performance] ${name} took ${duration}ms`);
			}

			return result;
		} catch (error) {
			trackError(error, {
				context: name,
				metadata: { args: sanitizeArgs(args) },
			});
			throw error;
		}
	};
}

/**
 * Sanitize args for logging (remove sensitive data)
 */
function sanitizeArgs(args: unknown): unknown {
	if (!args || typeof args !== "object") {
		return args;
	}

	const sensitiveKeys = [
		"password",
		"token",
		"accessToken",
		"refreshToken",
		"secret",
		"key",
		"apiKey",
	];

	const sanitized = { ...args } as Record<string, unknown>;
	for (const key of sensitiveKeys) {
		if (key in sanitized) {
			sanitized[key] = "[REDACTED]";
		}
	}

	return sanitized;
}

// =============================================================================
// ERROR HELPERS
// =============================================================================

/**
 * Assert a condition, throwing a ConvexError if false
 */
export function assertOrThrow(
	condition: unknown,
	code: ErrorCode,
	message: string,
): asserts condition {
	if (!condition) {
		throw new ConvexError(code, message);
	}
}

/**
 * Create common error responses
 */
export const Errors = {
	notFound: (resource: string) =>
		new ConvexError("NOT_FOUND", `${resource} not found`),

	unauthorized: (message = "Authentication required") =>
		new ConvexError("UNAUTHORIZED", message),

	forbidden: (message = "Access denied") =>
		new ConvexError("FORBIDDEN", message),

	validation: (message: string) => new ConvexError("VALIDATION_ERROR", message),

	rateLimited: (retryAfter?: number) =>
		new ConvexError(
			"RATE_LIMITED",
			retryAfter
				? `Rate limit exceeded. Retry after ${retryAfter} seconds`
				: "Rate limit exceeded",
		),

	externalApi: (service: string, message: string) =>
		new ConvexError("EXTERNAL_API_ERROR", `${service} error: ${message}`),

	missingConfig: (configName: string) =>
		new ConvexError("MISSING_CONFIG", `${configName} is not configured`),

	internal: (message = "An internal error occurred") =>
		new ConvexError("INTERNAL_ERROR", message),
};

// =============================================================================
// BUFFER ACCESS (for monitoring)
// =============================================================================

/**
 * Get recent errors from the buffer
 */
export function getRecentErrors(limit = 10): TrackedError[] {
	return errorBuffer.slice(-limit);
}

/**
 * Clear the error buffer
 */
export function clearErrorBuffer(): void {
	errorBuffer.length = 0;
}

/**
 * Get error statistics
 */
export function getErrorStats(): Record<ErrorCode, number> {
	const stats: Record<string, number> = {};
	for (const error of errorBuffer) {
		stats[error.code] = (stats[error.code] || 0) + 1;
	}
	return stats as Record<ErrorCode, number>;
}
