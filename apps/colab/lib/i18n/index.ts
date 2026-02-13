/**
 * i18n utilities for Alecia Colab
 * Simple translation system for French-first interface
 */

import { fr } from "./fr";

// For Phase 1, we only support French
export const translations = {
	fr,
};

// Default language
export const defaultLanguage = "fr";

/**
 * Get translation by path
 * Example: t("actions.newDeal") => "Nouveau Deal"
 */
export function t(path: string): string {
	const keys = path.split(".");
	let value: Record<string, unknown> | string = translations[defaultLanguage];

	for (const key of keys) {
		if (value && typeof value === "object" && key in value) {
			value = value[key] as Record<string, unknown> | string;
		} else {
			console.warn(`Translation key not found: ${path}`);
			return path;
		}
	}

	return typeof value === "string" ? value : path;
}

/**
 * Get nested translation object
 */
export function getTranslations(path?: string): Record<string, unknown> | null {
	if (!path) return translations[defaultLanguage];

	const keys = path.split(".");
	let value: Record<string, unknown> | string = translations[defaultLanguage];

	for (const key of keys) {
		if (value && typeof value === "object" && key in value) {
			value = value[key] as Record<string, unknown> | string;
		} else {
			return null;
		}
	}

	return typeof value === "object" ? value : null;
}

// Export translations for direct use
export { fr };
export default translations;
