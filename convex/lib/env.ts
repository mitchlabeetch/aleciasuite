/**
 * Environment Variable Utilities
 *
 * Provides safe, typed access to environment variables with graceful degradation.
 * Use these utilities instead of directly accessing process.env to avoid crashes.
 *
 * @example
 * // In an action:
 * const result = requireEnv("OPENAI_API_KEY");
 * if (!result.ok) {
 *   return { success: false, error: result.error };
 * }
 * const apiKey = result.value;
 */

import { logger } from "./logger";

// =============================================================================
// Types
// =============================================================================

/**
 * Result type for operations that can fail gracefully
 */
export type Result<T, E = string> =
	| { ok: true; value: T }
	| { ok: false; error: E };

/**
 * Standard error response for actions
 */
export interface ActionError {
	success: false;
	error: string;
	code:
		| "MISSING_CONFIG"
		| "INTEGRATION_DISABLED"
		| "API_ERROR"
		| "NOT_FOUND"
		| "UNAUTHORIZED"
		| "EXPORT_ERROR";
}

/**
 * Standard success response for actions
 */
export interface ActionSuccess<T> {
	success: true;
	data: T;
}

export type ActionResult<T> = ActionSuccess<T> | ActionError;

// =============================================================================
// Environment Variable Registry
// =============================================================================

/**
 * Known environment variables and their purposes
 */
export const ENV_REGISTRY = {
	// AI Providers
	OPENAI_API_KEY: {
		description: "OpenAI API key for embeddings and transcription",
		required: false,
		integration: "openai",
	},
	GROQ_API_KEY: {
		description: "Groq API key for fast LLM inference",
		required: false,
		integration: "groq",
	},

	// External APIs
	PAPPERS_API_KEY: {
		description: "Pappers API key for French company data",
		required: false,
		integration: "pappers",
	},

	// OAuth - Microsoft
	MICROSOFT_CLIENT_ID: {
		description: "Microsoft OAuth client ID",
		required: false,
		integration: "microsoft",
	},
	MICROSOFT_CLIENT_SECRET: {
		description: "Microsoft OAuth client secret",
		required: false,
		integration: "microsoft",
	},
	MICROSOFT_TENANT_ID: {
		description: "Microsoft Azure AD tenant ID (use 'common' for multi-tenant)",
		required: false,
		integration: "microsoft",
	},

	// OAuth - Pipedrive
	PIPEDRIVE_CLIENT_ID: {
		description: "Pipedrive OAuth client ID",
		required: false,
		integration: "pipedrive",
	},
	PIPEDRIVE_CLIENT_SECRET: {
		description: "Pipedrive OAuth client secret",
		required: false,
		integration: "pipedrive",
	},

	// OAuth - Google
	GOOGLE_CLIENT_ID: {
		description: "Google OAuth client ID",
		required: false,
		integration: "google",
	},
	GOOGLE_CLIENT_SECRET: {
		description: "Google OAuth client secret",
		required: false,
		integration: "google",
	},

	// App URLs
	NEXT_PUBLIC_APP_URL: {
		description: "Public app URL for OAuth callbacks",
		required: false,
		integration: null,
	},
	CONVEX_SITE_URL: {
		description: "Convex HTTP endpoint URL",
		required: false,
		integration: null,
	},
} as const;

export type EnvKey = keyof typeof ENV_REGISTRY;

// =============================================================================
// Safe Environment Access
// =============================================================================

/**
 * Get an environment variable value, returning undefined if not set
 */
export function getEnv(key: EnvKey): string | undefined {
	return process.env[key];
}

/**
 * Get an environment variable with a default fallback
 */
export function getEnvOrDefault(key: EnvKey, defaultValue: string): string {
	return process.env[key] || defaultValue;
}

/**
 * Check if an environment variable is configured
 */
export function hasEnv(key: EnvKey): boolean {
	const value = process.env[key];
	return value !== undefined && value !== "";
}

/**
 * Require an environment variable, returning a Result type
 * Use this in actions to avoid throwing errors
 */
export function requireEnv(key: EnvKey): Result<string> {
	const value = process.env[key];
	if (!value) {
		const info = ENV_REGISTRY[key];
		logger.warn(`Missing environment variable: ${key}`, {
			description: info.description,
			integration: info.integration,
		});
		return {
			ok: false,
			error: `${key} is not configured. ${info.description}`,
		};
	}
	return { ok: true, value };
}

/**
 * Require multiple environment variables at once
 */
export function requireEnvs<K extends EnvKey>(
	keys: K[],
): Result<Record<K, string>> {
	const result: Partial<Record<K, string>> = {};
	const missing: string[] = [];

	for (const key of keys) {
		const value = process.env[key];
		if (!value) {
			missing.push(key);
		} else {
			result[key] = value;
		}
	}

	if (missing.length > 0) {
		return {
			ok: false,
			error: `Missing environment variables: ${missing.join(", ")}`,
		};
	}

	return { ok: true, value: result as Record<K, string> };
}

// =============================================================================
// Integration Status
// =============================================================================

export type IntegrationName =
	| "openai"
	| "groq"
	| "pappers"
	| "microsoft"
	| "pipedrive"
	| "google";

/**
 * Check if an integration is fully configured
 */
export function isIntegrationEnabled(integration: IntegrationName): boolean {
	switch (integration) {
		case "openai":
			return hasEnv("OPENAI_API_KEY");
		case "groq":
			return hasEnv("GROQ_API_KEY");
		case "pappers":
			return hasEnv("PAPPERS_API_KEY");
		case "microsoft":
			return hasEnv("MICROSOFT_CLIENT_ID") && hasEnv("MICROSOFT_CLIENT_SECRET");
		case "pipedrive":
			return hasEnv("PIPEDRIVE_CLIENT_ID") && hasEnv("PIPEDRIVE_CLIENT_SECRET");
		case "google":
			return hasEnv("GOOGLE_CLIENT_ID") && hasEnv("GOOGLE_CLIENT_SECRET");
		default:
			return false;
	}
}

/**
 * Get all integration statuses
 */
export function getIntegrationStatus(): Record<IntegrationName, boolean> {
	return {
		openai: isIntegrationEnabled("openai"),
		groq: isIntegrationEnabled("groq"),
		pappers: isIntegrationEnabled("pappers"),
		microsoft: isIntegrationEnabled("microsoft"),
		pipedrive: isIntegrationEnabled("pipedrive"),
		google: isIntegrationEnabled("google"),
	};
}

/**
 * Get list of enabled integrations
 */
export function getEnabledIntegrations(): IntegrationName[] {
	const status = getIntegrationStatus();
	return (Object.keys(status) as IntegrationName[]).filter(
		(key) => status[key],
	);
}

// =============================================================================
// Action Helpers
// =============================================================================

/**
 * Create a standardized error response for actions
 */
export function actionError(
	error: string,
	code: ActionError["code"] = "API_ERROR",
): ActionError {
	return { success: false, error, code };
}

/**
 * Create a standardized success response for actions
 */
export function actionSuccess<T>(data: T): ActionSuccess<T> {
	return { success: true, data };
}

/**
 * Wrap an action handler to catch errors and return graceful responses
 */
export function withGracefulErrors<Args, Result>(
	handler: (args: Args) => Promise<Result>,
): (args: Args) => Promise<ActionResult<Result>> {
	return async (args: Args) => {
		try {
			const result = await handler(args);
			return actionSuccess(result);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			logger.error("Action failed", { error: message });
			return actionError(message);
		}
	};
}

/**
 * Check integration before running an action
 * Returns an error result if the integration is not configured
 */
export function checkIntegration(
	integration: IntegrationName,
): ActionError | null {
	if (!isIntegrationEnabled(integration)) {
		const names: Record<IntegrationName, string> = {
			openai: "OpenAI",
			groq: "Groq",
			pappers: "Pappers",
			microsoft: "Microsoft",
			pipedrive: "Pipedrive",
			google: "Google",
		};
		return actionError(
			`${names[integration]} integration is not configured. Please add the required API keys.`,
			"INTEGRATION_DISABLED",
		);
	}
	return null;
}
