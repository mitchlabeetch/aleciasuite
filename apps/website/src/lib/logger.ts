/**
 * Production-Safe Logger with Sentry Integration
 *
 * Provides logging capabilities that behave differently in development vs production.
 * In development: All logs are visible in the console.
 * In production: Only errors are logged and sent to Sentry.
 *
 * @module lib/logger
 * @usage Replace all console.log/error/warn with logger.debug/error/warn
 */

type _LogLevel = "debug" | "info" | "warn" | "error";

interface Logger {
	debug: (...args: unknown[]) => void;
	info: (...args: unknown[]) => void;
	warn: (...args: unknown[]) => void;
	error: (...args: unknown[]) => void;
}

const isDevelopment = process.env.NODE_ENV === "development";
const isBrowser = typeof window !== "undefined";
const noop = () => {};

/**
 * Safely get Sentry (dynamic import to avoid SSR issues)
 */
const getSentry = async () => {
	try {
		return await import("@sentry/nextjs");
	} catch {
		return null;
	}
};

/**
 * Development logger - all levels visible
 */
const devLogger: Logger = {
	debug: (...args) => console.debug("[DEBUG]", ...args),
	info: (...args) => console.info("[INFO]", ...args),
	warn: (...args) => console.warn("[WARN]", ...args),
	error: (...args) => console.error("[ERROR]", ...args),
};

/**
 * Production logger - errors sent to Sentry
 */
const prodLogger: Logger = {
	debug: noop,
	info: noop,
	warn: (...args) => {
		// Only send to Sentry in browser to avoid SSR issues
		if (isBrowser) {
			void getSentry()
				.then((Sentry) => {
					if (Sentry) {
						Sentry.addBreadcrumb({
							category: "console",
							message: args.map((a) => String(a)).join(" "),
							level: "warning",
						});
					}
				})
				.catch(() => {
					// Sentry import failed, but already logged to console
				});
		}
	},
	error: (...args) => {
		// Always log to console
		console.error("[PROD ERROR]", ...args);

		// Only send to Sentry in browser to avoid SSR issues
		if (isBrowser) {
			void getSentry()
				.then((Sentry) => {
					if (Sentry) {
						const [first, ...rest] = args;
						if (first instanceof Error) {
							Sentry.captureException(first, {
								extra: { context: rest },
							});
						} else {
							Sentry.captureMessage(
								args
									.map((a) =>
										typeof a === "object" ? JSON.stringify(a) : String(a),
									)
									.join(" "),
								"error",
							);
						}
					}
				})
				.catch(() => {
					// Sentry import failed, but already logged to console
				});
		}
	},
};

/**
 * Main logger instance
 *
 * @example
 * ```typescript
 * import { logger } from '@/lib/logger';
 *
 * // Debug logs (only in development)
 * logger.debug('Processing data:', data);
 *
 * // Info logs (only in development)
 * logger.info('User logged in');
 *
 * // Warning logs (breadcrumbs in Sentry, console in dev)
 * logger.warn('Deprecated API used');
 *
 * // Error logs (Sentry in prod, console in dev)
 * logger.error('Failed to fetch:', error);
 * ```
 */
export const logger: Logger = isDevelopment ? devLogger : prodLogger;

/**
 * Create a namespaced logger for specific modules
 *
 * @param namespace - The module namespace (e.g., 'UserSync', 'Convex')
 * @returns Logger instance with prefixed messages
 *
 * @example
 * ```typescript
 * const log = createLogger('UserSync');
 * log.debug('Syncing user...'); // [DEBUG] [UserSync] Syncing user...
 * log.error(new Error('Sync failed')); // Sent to Sentry with [UserSync] tag
 * ```
 */
export function createLogger(namespace: string): Logger {
	const prefix = `[${namespace}]`;

	// Set Sentry tag for this namespace in production
	if (!isDevelopment && isBrowser) {
		void getSentry()
			.then((Sentry) => {
				if (Sentry) {
					Sentry.setTag("logger.namespace", namespace);
				}
			})
			.catch(() => {
				// Sentry import failed
			});
	}

	return {
		debug: (...args) => logger.debug(prefix, ...args),
		info: (...args) => logger.info(prefix, ...args),
		warn: (...args) => logger.warn(prefix, ...args),
		error: (...args) => {
			// Add namespace as a breadcrumb before capturing error
			if (!isDevelopment && isBrowser) {
				void getSentry()
					.then((Sentry) => {
						if (Sentry) {
							Sentry.addBreadcrumb({
								category: namespace,
								message: "Error in " + namespace,
								level: "error",
							});
						}
					})
					.catch(() => {
						// Sentry import failed
					});
			}
			logger.error(prefix, ...args);
		},
	};
}

/**
 * Set user context for Sentry tracking
 * Call this after user authentication
 *
 * @param user - User information object
 */
export function setUserContext(
	user: { id: string; email?: string; name?: string } | null,
): void {
	if (isDevelopment || !isBrowser) return;

	void getSentry()
		.then((Sentry) => {
			if (Sentry) {
				if (user) {
					Sentry.setUser({
						id: user.id,
						email: user.email,
						username: user.name,
					});
				} else {
					Sentry.setUser(null);
				}
			}
		})
		.catch(() => {
			// Sentry import failed
		});
}

/**
 * Add custom context to Sentry for debugging
 *
 * @param key - Context key
 * @param context - Context data object
 */
export function setContext(
	key: string,
	context: Record<string, unknown>,
): void {
	if (isDevelopment || !isBrowser) return;

	void getSentry()
		.then((Sentry) => {
			if (Sentry) {
				Sentry.setContext(key, context);
			}
		})
		.catch(() => {
			// Sentry import failed
		});
}
