/**
 * Application Constants
 * 
 * Centralized constants used across the application
 */

/**
 * Default locale for the application
 * Used as fallback when locale cannot be determined from URL params
 */
export const DEFAULT_LOCALE = 'fr';

/**
 * Extract locale from Next.js route params
 * Handles both string and array return types from useParams
 * 
 * @param params - Route params from useParams() hook
 * @returns Locale string (e.g., 'fr', 'en')
 */
export function getLocaleFromParams(params: { locale?: string | string[] } | null): string {
	if (!params?.locale) {
		return DEFAULT_LOCALE;
	}
	return Array.isArray(params.locale) ? params.locale[0] : params.locale;
}
