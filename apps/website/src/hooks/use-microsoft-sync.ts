"use client";

/**
 * Microsoft 365 Sync Hook for Alecia Website
 *
 * Integrates with Microsoft Graph API via BetterAuth OAuth to:
 * - Fetch calendar events
 * - Fetch contacts
 * - Sync to database
 *
 * @see Batch 4: Authentication & Data Sync
 */

import { useSession } from "@alepanel/auth/client";
import { useState, useCallback } from "react";
import { createLogger } from "@/lib/logger";

const log = createLogger("MicrosoftSync");

// ============================================================================
// Types
// ============================================================================

export interface MicrosoftCalendarEvent {
	id: string;
	subject: string;
	bodyPreview?: string;
	start: { dateTime: string; timeZone: string };
	end: { dateTime: string; timeZone: string };
	location?: { displayName: string };
	organizer?: { emailAddress: { name: string; address: string } };
	attendees?: Array<{
		emailAddress: { name: string; address: string };
		status?: { response: string };
	}>;
	webLink?: string;
	isOnlineMeeting?: boolean;
	onlineMeetingUrl?: string;
}

export interface MicrosoftContact {
	id: string;
	displayName: string;
	givenName?: string;
	surname?: string;
	emailAddresses?: Array<{ address: string; name?: string }>;
	businessPhones?: string[];
	mobilePhone?: string;
	companyName?: string;
	jobTitle?: string;
	department?: string;
}

export interface MicrosoftProfile {
	id: string;
	displayName: string;
	mail: string;
	jobTitle?: string;
	officeLocation?: string;
	mobilePhone?: string;
	businessPhones?: string[];
}

interface SyncResult {
	synced: number;
	failed: number;
	skipped: number;
}

// ============================================================================
// Hook
// ============================================================================

export function useMicrosoftSync() {
	const { data: authSession, isPending } = useSession();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

	/**
	 * Get Microsoft access token from BetterAuth
	 *
	 * TODO: In BetterAuth, OAuth tokens are stored in the shared.account table.
	 * This should call a server action that retrieves the token from the database
	 * instead of getting it from the client session.
	 */
	const getMicrosoftToken = useCallback(async (): Promise<string | null> => {
		if (!authSession) {
			setError("No active session");
			return null;
		}

		try {
			// TODO: Replace with server action call to get Microsoft token from shared.account table
			// Example: const token = await getMicrosoftAccessToken();
			log.error("getMicrosoftToken not yet implemented for BetterAuth");
			setError(
				"Microsoft connection not available. Token retrieval needs to be implemented via server action.",
			);
			return null;
		} catch (err) {
			log.error("Failed to get Microsoft token:", err);
			setError(
				"Microsoft connection not available. Please sign in with Microsoft.",
			);
			return null;
		}
	}, [authSession]);

	/**
	 * Check if Microsoft account is connected
	 */
	const isMicrosoftConnected = useCallback(async (): Promise<boolean> => {
		const token = await getMicrosoftToken();
		return !!token;
	}, [getMicrosoftToken]);

	/**
	 * Make authenticated request to Microsoft Graph API
	 */
	const graphRequest = useCallback(
		async <T>(endpoint: string, options?: RequestInit): Promise<T | null> => {
			const token = await getMicrosoftToken();
			if (!token) return null;

			try {
				const response = await fetch(
					`https://graph.microsoft.com/v1.0${endpoint}`,
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
						`Microsoft Graph API error: ${response.status} ${response.statusText}`,
					);
				}

				return response.json();
			} catch (err) {
				log.error(`Graph API request failed: ${endpoint}`, err);
				throw err;
			}
		},
		[getMicrosoftToken],
	);

	/**
	 * Fetch user profile from Microsoft
	 */
	const fetchProfile = useCallback(async (): Promise<{
		data: MicrosoftProfile | null;
		error: string | null;
	}> => {
		setIsLoading(true);
		setError(null);

		try {
			const profile = await graphRequest<MicrosoftProfile>("/me");
			return { data: profile, error: null };
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to fetch profile";
			setError(errorMessage);
			return { data: null, error: errorMessage };
		} finally {
			setIsLoading(false);
		}
	}, [graphRequest]);

	/**
	 * Fetch calendar events from Microsoft 365
	 */
	const fetchCalendarEvents = useCallback(
		async (
			startDate: Date,
			endDate: Date,
		): Promise<{ data: MicrosoftCalendarEvent[]; error: string | null }> => {
			setIsLoading(true);
			setError(null);

			try {
				const response = await graphRequest<{
					value: MicrosoftCalendarEvent[];
				}>(
					`/me/calendarView?` +
						`startDateTime=${startDate.toISOString()}&` +
						`endDateTime=${endDate.toISOString()}&` +
						`$orderby=start/dateTime&` +
						`$top=100`,
				);

				setLastSyncTime(new Date());
				return { data: response?.value || [], error: null };
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Calendar sync failed";
				setError(errorMessage);
				return { data: [], error: errorMessage };
			} finally {
				setIsLoading(false);
			}
		},
		[graphRequest],
	);

	/**
	 * Fetch contacts from Microsoft 365
	 */
	const fetchContacts = useCallback(async (): Promise<{
		data: MicrosoftContact[];
		error: string | null;
	}> => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await graphRequest<{ value: MicrosoftContact[] }>(
				"/me/contacts?$top=100&$orderby=displayName",
			);

			setLastSyncTime(new Date());
			return { data: response?.value || [], error: null };
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Contact sync failed";
			setError(errorMessage);
			return { data: [], error: errorMessage };
		} finally {
			setIsLoading(false);
		}
	}, [graphRequest]);

	/**
	 * Sync calendar events to database
	 */
	const syncCalendarToConvex = useCallback(
		async (
			events: MicrosoftCalendarEvent[],
			createEventMutation: (event: {
				title: string;
				startDate: Date;
				endDate: Date;
				location?: string;
				attendees?: string[];
				source: string;
				externalId: string;
			}) => Promise<unknown>,
		): Promise<SyncResult> => {
			const results: SyncResult = { synced: 0, failed: 0, skipped: 0 };

			for (const event of events) {
				try {
					await createEventMutation({
						title: event.subject,
						startDate: new Date(event.start.dateTime),
						endDate: new Date(event.end.dateTime),
						location: event.location?.displayName,
						attendees: event.attendees?.map((a) => a.emailAddress.address),
						source: "microsoft",
						externalId: `ms_${event.id}`,
					});
					results.synced++;
				} catch (_err) {
					// Likely duplicate - could check for externalId conflict
					results.failed++;
				}
			}

			return results;
		},
		[],
	);

	/**
	 * Sync contacts to database CRM
	 */
	const syncContactsToConvex = useCallback(
		async (
			contacts: MicrosoftContact[],
			createContactMutation: (contact: {
				name: string;
				email?: string;
				phone?: string;
				company?: string;
				jobTitle?: string;
				source: string;
				externalId: string;
			}) => Promise<unknown>,
		): Promise<SyncResult> => {
			const results: SyncResult = { synced: 0, failed: 0, skipped: 0 };

			for (const contact of contacts) {
				try {
					const primaryEmail = contact.emailAddresses?.[0]?.address;
					const primaryPhone =
						contact.businessPhones?.[0] || contact.mobilePhone;

					await createContactMutation({
						name: contact.displayName,
						email: primaryEmail,
						phone: primaryPhone,
						company: contact.companyName,
						jobTitle: contact.jobTitle,
						source: "microsoft",
						externalId: `ms_${contact.id}`,
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
		getMicrosoftToken,
		isMicrosoftConnected,

		// Data fetching
		fetchProfile,
		fetchCalendarEvents,
		fetchContacts,

		// Sync to database
		syncCalendarToConvex,
		syncContactsToConvex,

		// State
		isLoading,
		error,
		lastSyncTime,
		isReady: !isPending && !!authSession,
	};
}
