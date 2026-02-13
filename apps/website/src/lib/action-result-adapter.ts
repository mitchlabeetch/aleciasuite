/**
 * Action Result Adapter
 *
 * Bridges Convex ActionResult type with the website's Result type.
 * Provides utilities for handling action results with toast notifications.
 *
 * @see convex/lib/env.ts - ActionResult definition
 * @see lib/result.ts - Website Result type
 */

import { ok, err, type Result } from "./result";

/**
 * ActionResult from Convex actions
 * Mirrors the type from convex/lib/env.ts
 */
export interface ActionSuccess<T> {
	success: true;
	data: T;
}

export interface ActionError {
	success: false;
	error: string;
	code: "MISSING_CONFIG" | "INTEGRATION_DISABLED" | "API_ERROR" | "NOT_FOUND";
}

export type ActionResult<T> = ActionSuccess<T> | ActionError;

/**
 * Error codes from Convex actions
 */
export type ActionErrorCode = ActionError["code"];

/**
 * Convert Convex ActionResult to website Result type
 */
export function toResult<T>(actionResult: ActionResult<T>): Result<T, Error> {
	if (actionResult.success) {
		return ok(actionResult.data);
	}
	const error = new Error(actionResult.error);
	(error as Error & { code?: string }).code = actionResult.code;
	return err(error);
}

/**
 * Toast notification parameters
 */
interface ToastParams {
	title: string;
	description?: string;
	variant?: "default" | "destructive";
}

type ToastFn = (params: ToastParams) => void;

/**
 * Options for handleActionResult
 */
interface HandleOptions {
	/** Title shown on success (if provided, shows success toast) */
	successTitle?: string;
	/** Description shown on success */
	successDescription?: string;
	/** Title shown on error (defaults to "Error") */
	errorTitle?: string;
	/** Custom error messages per error code */
	errorMessages?: Partial<Record<ActionErrorCode, string>>;
	/** Whether to show toast on error (default: true) */
	showErrorToast?: boolean;
}

/**
 * Handle ActionResult with optional toast notifications
 *
 * @example
 * const result = await someAction({ ... });
 * const data = handleActionResult(result, toast, {
 *   successTitle: "Operation complete",
 *   errorTitle: "Operation failed"
 * });
 * if (data) {
 *   // Use data
 * }
 */
export function handleActionResult<T>(
	result: ActionResult<T>,
	toast: ToastFn,
	options?: HandleOptions,
): T | null {
	if (result.success) {
		if (options?.successTitle) {
			toast({
				title: options.successTitle,
				description: options.successDescription,
				variant: "default",
			});
		}
		return result.data;
	}

	// Handle error
	if (options?.showErrorToast !== false) {
		const errorMessage = options?.errorMessages?.[result.code] || result.error;

		toast({
			title: options?.errorTitle || "Erreur",
			description: errorMessage,
			variant: "destructive",
		});
	}

	return null;
}

/**
 * Check if an ActionResult indicates a disabled integration
 */
export function isIntegrationDisabled<T>(
	result: ActionResult<T>,
): result is ActionError {
	return !result.success && result.code === "INTEGRATION_DISABLED";
}

/**
 * Check if an ActionResult indicates missing configuration
 */
export function isMissingConfig<T>(
	result: ActionResult<T>,
): result is ActionError {
	return !result.success && result.code === "MISSING_CONFIG";
}

/**
 * Get user-friendly message for error codes
 */
export function getErrorMessage(code: ActionErrorCode): string {
	const messages: Record<ActionErrorCode, string> = {
		MISSING_CONFIG: "Configuration manquante. Contactez un administrateur.",
		INTEGRATION_DISABLED: "Cette intégration n'est pas configurée.",
		API_ERROR: "Une erreur s'est produite. Veuillez réessayer.",
		NOT_FOUND: "Élément non trouvé.",
	};
	return messages[code];
}

/**
 * Async wrapper that handles ActionResult and returns data or throws
 * Useful when you want to use try/catch pattern
 */
export function unwrapActionResult<T>(result: ActionResult<T>): T {
	if (result.success) {
		return result.data;
	}
	const error = new Error(result.error);
	(error as Error & { code?: string }).code = result.code;
	throw error;
}
