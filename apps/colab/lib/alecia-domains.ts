/**
 * Cross-App Domain Configuration
 *
 * This file centralizes all cross-application URLs for the Alecia ecosystem.
 * Using environment variables allows different configurations for:
 * - Local development (localhost:3000, localhost:3001)
 * - Staging (staging.alecia.markets)
 * - Production (alecia.markets, colab.alecia.markets)
 */

export const ALECIA_DOMAINS = {
	/**
	 * Main marketing website and admin panel
	 * Routes: /, /admin/*, /expertises, /operations, etc.
	 */
	marketing:
		process.env.NEXT_PUBLIC_ALECIA_MARKETING_URL || "https://alecia.markets",

	/**
	 * Colab collaboration workspace
	 * Routes: /dashboard, /documents, /pipeline, /presentations
	 */
	colab:
		process.env.NEXT_PUBLIC_ALECIA_COLAB_URL || "https://colab.alecia.markets",

	/**
	 * Clerk authentication domain
	 */
	auth: "https://clerk.alecia.markets",
} as const;

/**
 * Admin Panel Routes (accessed from main marketing domain)
 */
export const ADMIN_ROUTES = {
	dashboard: `${ALECIA_DOMAINS.marketing}/admin/dashboard`,
	deals: `${ALECIA_DOMAINS.marketing}/admin/deals`,
	crm: {
		root: `${ALECIA_DOMAINS.marketing}/admin/crm`,
		contacts: `${ALECIA_DOMAINS.marketing}/admin/crm/contacts`,
		companies: `${ALECIA_DOMAINS.marketing}/admin/crm/companies`,
	},
	documents: `${ALECIA_DOMAINS.marketing}/admin/documents`,
	settings: `${ALECIA_DOMAINS.marketing}/admin/settings`,
	colab: `${ALECIA_DOMAINS.marketing}/admin/colab`,
} as const;

/**
 * Colab Routes (accessed from colab subdomain)
 */
export const COLAB_ROUTES = {
	dashboard: `${ALECIA_DOMAINS.colab}/dashboard`,
	documents: `${ALECIA_DOMAINS.colab}/documents`,
	pipeline: `${ALECIA_DOMAINS.colab}/pipeline`,
	presentations: `${ALECIA_DOMAINS.colab}/presentations`,
	calendar: `${ALECIA_DOMAINS.colab}/calendar`,
} as const;

/**
 * Check if we're in embedded mode (iframe within admin panel)
 */
export function isEmbeddedMode(): boolean {
	if (typeof window === "undefined") return false;

	const urlParams = new URLSearchParams(window.location.search);
	return (
		urlParams.get("embedded") === "true" || urlParams.get("embed") === "true"
	);
}

/**
 * Get the appropriate link behavior based on context
 * - If embedded: open in new tab (escape iframe)
 * - If standalone: same tab navigation
 */
export function getExternalLinkProps(isExternal: boolean) {
	if (isExternal) {
		return {
			target: "_blank" as const,
			rel: "noopener noreferrer",
		};
	}
	return {};
}
