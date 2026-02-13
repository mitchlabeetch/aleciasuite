/**
 * Convex Environment Configuration
 *
 * Centralized configuration for feature flags, limits, and integrations.
 * Uses env utilities for safe, graceful access to environment variables.
 *
 * @see Batch 7: Backend Schema Perfection
 */

import {
	isIntegrationEnabled,
	getIntegrationStatus,
	getEnabledIntegrations,
	type IntegrationName,
} from "./lib/env";

// =============================================================================
// Environment Detection
// =============================================================================

const isProduction = process.env.NODE_ENV === "production";
const convexUrl =
	process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL || "";

// =============================================================================
// Configuration
// =============================================================================

export const config = {
	// Environment
	env: {
		isProduction,
		isDevelopment: !isProduction,
		convexUrl,
	},

	// Feature Flags
	features: {
		// Real-time presence indicators
		enablePresence: true,

		// OAuth data synchronization
		enableSync: true,

		// Activity audit logging
		enableAuditLog: true,

		// AI features (summarization, embedding) - enabled if either AI provider is configured
		enableAI: isIntegrationEnabled("openai") || isIntegrationEnabled("groq"),

		// Document signing
		enableSigning: true,
	},

	// Rate Limits (per user per minute)
	limits: {
		maxDealsPerPage: 100,
		maxContactsPerPage: 500,
		maxCompaniesPerPage: 200,
		maxDocumentSizeMB: 10,
		maxSyncItemsPerBatch: 50,
		maxSearchResults: 25,
	},

	// Pipeline Configuration
	pipeline: {
		stages: [
			{ id: "qualification", label: "Qualification", order: 0 },
			{ id: "initial_meeting", label: "Premier RDV", order: 1 },
			{ id: "analysis", label: "Analyse", order: 2 },
			{ id: "valuation", label: "Valorisation", order: 3 },
			{ id: "negotiation", label: "Négociation", order: 4 },
			{ id: "due_diligence", label: "Due Diligence", order: 5 },
			{ id: "closing", label: "Closing", order: 6 },
			{ id: "completed", label: "Terminé", order: 7 },
		],
		defaultStage: "qualification",
	},

	// External Integrations - uses centralized env checks
	integrations: {
		microsoft: {
			enabled: isIntegrationEnabled("microsoft"),
			scopes: ["User.Read", "Calendars.Read", "Contacts.Read"],
		},
		pipedrive: {
			enabled: isIntegrationEnabled("pipedrive"),
			scopes: ["deals:read", "persons:read", "organizations:read"],
		},
		pappers: {
			enabled: isIntegrationEnabled("pappers"),
		},
		groq: {
			enabled: isIntegrationEnabled("groq"),
			model: "llama-3.3-70b-versatile",
		},
		openai: {
			enabled: isIntegrationEnabled("openai"),
			model: "gpt-4o-mini",
			embeddingModel: "text-embedding-3-small",
		},
	},

	// Defaults
	defaults: {
		currency: "EUR",
		locale: "fr-FR",
		timezone: "Europe/Paris",
	},
};

// =============================================================================
// Integration Helpers (re-exported for convenience)
// =============================================================================

export { isIntegrationEnabled, getIntegrationStatus, getEnabledIntegrations };
export type { IntegrationName };

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get effective limit with optional override
 */
export function getLimit(
	limitKey: keyof typeof config.limits,
	override?: number,
): number {
	const configLimit = config.limits[limitKey];
	if (override === undefined) return configLimit;
	return Math.min(override, configLimit);
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(
	featureKey: keyof typeof config.features,
): boolean {
	return config.features[featureKey];
}

/**
 * Get pipeline stage by ID
 */
export function getStageConfig(stageId: string) {
	return config.pipeline.stages.find((s) => s.id === stageId);
}
