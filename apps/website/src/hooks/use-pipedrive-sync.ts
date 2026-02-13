"use client";

/**
 * Pipedrive Sync Hook for Alecia Website
 *
 * Integrates with Pipedrive API via BetterAuth Custom OAuth to:
 * - Fetch deals
 * - Fetch contacts (persons)
 * - Fetch organizations
 * - Sync to database
 *
 * @see Batch 4: Authentication & Data Sync
 */

import { useSession } from "@alepanel/auth/client";
import { useState, useCallback } from "react";
import { createLogger } from "@/lib/logger";

const log = createLogger("PipedriveSync");

// ============================================================================
// Types
// ============================================================================

export interface PipedriveDeal {
	id: number;
	title: string;
	value: number;
	currency: string;
	status: "open" | "won" | "lost" | "deleted";
	stage_id: number;
	stage_name?: string; // Added from API enrichment
	pipeline_id: number;
	person_id: number | null;
	org_id: number | null;
	user_id: number;
	expected_close_date: string | null;
	add_time: string;
	update_time: string;
	probability: number | null;
	weighted_value: number | null;
	notes_count?: number;
	activities_count?: number;
	next_activity_date?: string | null;
}

export interface PipedrivePerson {
	id: number;
	name: string;
	first_name?: string;
	last_name?: string;
	email: Array<{ value: string; primary: boolean; label?: string }>;
	phone: Array<{ value: string; primary: boolean; label?: string }>;
	org_id?: number | null;
	org_name?: string;
	owner_id: number;
	add_time: string;
	update_time: string;
	visible_to: string;
	notes_count?: number;
}

export interface PipedriveOrganization {
	id: number;
	name: string;
	address?: string;
	people_count?: number;
	open_deals_count?: number;
	closed_deals_count?: number;
	won_deals_count?: number;
	related_won_deals_count?: number;
	owner_id: number;
	add_time: string;
	update_time: string;
}

export interface PipedriveStage {
	id: number;
	name: string;
	pipeline_id: number;
	order_nr: number;
	active_flag: boolean;
}

interface SyncResult {
	synced: number;
	failed: number;
	skipped: number;
}

// ============================================================================
// Stage Mapping
// ============================================================================

/**
 * Map Pipedrive stage IDs to Alecia M&A stages
 * These should be configured based on the client's Pipedrive setup
 */
const STAGE_MAP: Record<number, string> = {
	1: "qualification",
	2: "initial_meeting",
	3: "analysis",
	4: "valuation",
	5: "negotiation",
	6: "due_diligence",
	7: "closing",
	8: "signed",
};

function mapPipedriveStage(stageId: number): string {
	return STAGE_MAP[stageId] || "qualification";
}

// ============================================================================
// Hook
// ============================================================================

export function usePipedriveSync() {
	const { data: authSession, isPending } = useSession();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

	/**
	 * Get Pipedrive access token from BetterAuth
	 *
	 * TODO: In BetterAuth, OAuth tokens are stored in the shared.account table.
	 * This should call a server action that retrieves the token from the database
	 * instead of getting it from the client session.
	 */
	const getPipedriveToken = useCallback(async (): Promise<string | null> => {
		if (!authSession) {
			setError("No active session");
			return null;
		}

		try {
			// TODO: Replace with server action call to get Pipedrive token from shared.account table
			// Example: const token = await getPipedriveAccessToken();
			log.error("getPipedriveToken not yet implemented for BetterAuth");
			setError(
				"Pipedrive connection not available. Token retrieval needs to be implemented via server action.",
			);
			return null;
		} catch (err) {
			log.error("Failed to get Pipedrive token:", err);
			setError(
				"Pipedrive connection not available. Please connect your Pipedrive account.",
			);
			return null;
		}
	}, [authSession]);

	/**
	 * Check if Pipedrive account is connected
	 */
	const isPipedriveConnected = useCallback(async (): Promise<boolean> => {
		const token = await getPipedriveToken();
		return !!token;
	}, [getPipedriveToken]);

	/**
	 * Make authenticated request to Pipedrive API
	 */
	const pipedriveRequest = useCallback(
		async <T>(endpoint: string, options?: RequestInit): Promise<T | null> => {
			const token = await getPipedriveToken();
			if (!token) return null;

			try {
				const response = await fetch(
					`https://api.pipedrive.com/v1${endpoint}`,
					{
						...options,
						headers: {
							Authorization: `Bearer ${token}`,
							"Content-Type": "application/json",
							...options?.headers,
						},
					},
				);

				if (!response.ok) {
					throw new Error(
						`Pipedrive API error: ${response.status} ${response.statusText}`,
					);
				}

				const json = await response.json();

				// Pipedrive wraps data in a "data" property when successful
				if (json.success === false) {
					throw new Error(json.error || "Pipedrive API error");
				}

				return json.data;
			} catch (err) {
				log.error(`Pipedrive API request failed: ${endpoint}`, err);
				throw err;
			}
		},
		[getPipedriveToken],
	);

	/**
	 * Fetch deals from Pipedrive
	 */
	const fetchDeals = useCallback(
		async (
			status: "open" | "won" | "lost" | "all" = "all",
		): Promise<{ data: PipedriveDeal[]; error: string | null }> => {
			setIsLoading(true);
			setError(null);

			try {
				const statusParam = status !== "all" ? `&status=${status}` : "";
				const deals = await pipedriveRequest<PipedriveDeal[]>(
					`/deals?limit=100&sort=update_time DESC${statusParam}`,
				);

				setLastSyncTime(new Date());
				return { data: deals || [], error: null };
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Failed to fetch deals";
				setError(errorMessage);
				return { data: [], error: errorMessage };
			} finally {
				setIsLoading(false);
			}
		},
		[pipedriveRequest],
	);

	/**
	 * Fetch persons (contacts) from Pipedrive
	 */
	const fetchPersons = useCallback(async (): Promise<{
		data: PipedrivePerson[];
		error: string | null;
	}> => {
		setIsLoading(true);
		setError(null);

		try {
			const persons = await pipedriveRequest<PipedrivePerson[]>(
				"/persons?limit=100&sort=update_time DESC",
			);

			setLastSyncTime(new Date());
			return { data: persons || [], error: null };
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to fetch contacts";
			setError(errorMessage);
			return { data: [], error: errorMessage };
		} finally {
			setIsLoading(false);
		}
	}, [pipedriveRequest]);

	/**
	 * Fetch organizations from Pipedrive
	 */
	const fetchOrganizations = useCallback(async (): Promise<{
		data: PipedriveOrganization[];
		error: string | null;
	}> => {
		setIsLoading(true);
		setError(null);

		try {
			const orgs = await pipedriveRequest<PipedriveOrganization[]>(
				"/organizations?limit=100&sort=update_time DESC",
			);

			setLastSyncTime(new Date());
			return { data: orgs || [], error: null };
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to fetch organizations";
			setError(errorMessage);
			return { data: [], error: errorMessage };
		} finally {
			setIsLoading(false);
		}
	}, [pipedriveRequest]);

	/**
	 * Fetch pipeline stages from Pipedrive
	 * Useful for mapping stage IDs to names
	 */
	const fetchStages = useCallback(async (): Promise<PipedriveStage[]> => {
		setIsLoading(true);
		setError(null);

		try {
			const stages = await pipedriveRequest<PipedriveStage[]>("/stages");
			return stages || [];
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch stages");
			return [];
		} finally {
			setIsLoading(false);
		}
	}, [pipedriveRequest]);

	/**
	 * Sync Pipedrive deals to database
	 */
	const syncDealsToConvex = useCallback(
		async (
			pipedriveDeals: PipedriveDeal[],
			createDealMutation: (deal: {
				company: string;
				value?: number;
				stage: string;
				priority?: string;
				source: string;
				externalId: string;
				metadata?: Record<string, unknown>;
			}) => Promise<unknown>,
		): Promise<SyncResult> => {
			const results: SyncResult = { synced: 0, failed: 0, skipped: 0 };

			for (const deal of pipedriveDeals) {
				try {
					await createDealMutation({
						company: deal.title,
						value: deal.value > 0 ? deal.value : undefined,
						stage: mapPipedriveStage(deal.stage_id),
						priority:
							deal.probability && deal.probability > 50 ? "high" : "medium",
						source: "pipedrive",
						externalId: `pipedrive_${deal.id}`,
						metadata: {
							pipedriveId: deal.id,
							pipelineId: deal.pipeline_id,
							stageId: deal.stage_id,
							currency: deal.currency,
							status: deal.status,
							expectedCloseDate: deal.expected_close_date,
						},
					});
					results.synced++;
				} catch (_err) {
					// Likely duplicate or validation error
					results.failed++;
				}
			}

			return results;
		},
		[],
	);

	/**
	 * Sync Pipedrive persons to database CRM contacts
	 */
	const syncPersonsToConvex = useCallback(
		async (
			persons: PipedrivePerson[],
			createContactMutation: (contact: {
				name: string;
				email?: string;
				phone?: string;
				company?: string;
				source: string;
				externalId: string;
			}) => Promise<unknown>,
		): Promise<SyncResult> => {
			const results: SyncResult = { synced: 0, failed: 0, skipped: 0 };

			for (const person of persons) {
				try {
					const primaryEmail =
						person.email?.find((e) => e.primary)?.value ||
						person.email?.[0]?.value;
					const primaryPhone =
						person.phone?.find((p) => p.primary)?.value ||
						person.phone?.[0]?.value;

					await createContactMutation({
						name: person.name,
						email: primaryEmail,
						phone: primaryPhone,
						company: person.org_name,
						source: "pipedrive",
						externalId: `pipedrive_${person.id}`,
					});
					results.synced++;
				} catch (_err) {
					results.failed++;
				}
			}

			return results;
		},
		[],
	);

	/**
	 * Sync Pipedrive organizations to database CRM companies
	 */
	const syncOrganizationsToConvex = useCallback(
		async (
			organizations: PipedriveOrganization[],
			createCompanyMutation: (company: {
				name: string;
				address?: string;
				source: string;
				externalId: string;
				metadata?: Record<string, unknown>;
			}) => Promise<unknown>,
		): Promise<SyncResult> => {
			const results: SyncResult = { synced: 0, failed: 0, skipped: 0 };

			for (const org of organizations) {
				try {
					await createCompanyMutation({
						name: org.name,
						address: org.address,
						source: "pipedrive",
						externalId: `pipedrive_${org.id}`,
						metadata: {
							pipedriveId: org.id,
							peopleCount: org.people_count,
							openDealsCount: org.open_deals_count,
							wonDealsCount: org.won_deals_count,
						},
					});
					results.synced++;
				} catch (_err) {
					results.failed++;
				}
			}

			return results;
		},
		[],
	);

	return {
		// Authentication
		getPipedriveToken,
		isPipedriveConnected,

		// Data fetching
		fetchDeals,
		fetchPersons,
		fetchOrganizations,
		fetchStages,

		// Sync to database
		syncDealsToConvex,
		syncPersonsToConvex,
		syncOrganizationsToConvex,

		// State
		isLoading,
		error,
		lastSyncTime,
		isReady: !isPending && !!authSession,
	};
}

// Export stage mapping for external use
export { mapPipedriveStage, STAGE_MAP };
