"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import "isomorphic-fetch";
import { logger } from "../lib/logger";
import { internal, api } from "../_generated/api";
import {
	actionError,
	actionSuccess,
	getEnvOrDefault,
	hasEnv,
	type ActionResult,
} from "../lib/env";
import { encryptToken, decryptToken } from "../lib/crypto";

/**
 * Google Calendar Sync - Phase 2.3
 *
 * Features:
 * - OAuth 2.0 authentication with Google
 * - Fetch calendar events from Google Calendar
 * - Sync events to Convex database
 */

// ============================================
// OAUTH CONFIGURATION
// ============================================

function getGoogleConfig() {
	return {
		clientId: process.env.GOOGLE_CLIENT_ID,
		clientSecret: process.env.GOOGLE_CLIENT_SECRET,
		redirectUri:
			getEnvOrDefault("NEXT_PUBLIC_APP_URL", "http://localhost:3000") +
			"/api/auth/google/callback",
	};
}

function checkGoogleIntegration(): ActionResult<never> | null {
	if (!hasEnv("GOOGLE_CLIENT_ID") || !hasEnv("GOOGLE_CLIENT_SECRET")) {
		return actionError(
			"Google integration is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
			"INTEGRATION_DISABLED",
		);
	}
	return null;
}

// ============================================
// OAUTH FLOW ACTIONS
// ============================================

/**
 * Get Google OAuth authorization URL
 */
export const getAuthUrl = action({
	args: {},
	handler: async (): Promise<ActionResult<string>> => {
		const integrationError = checkGoogleIntegration();
		if (integrationError) return integrationError;

		const config = getGoogleConfig();
		if (!config.clientId) {
			return actionError(
				"Google OAuth is not configured",
				"INTEGRATION_DISABLED",
			);
		}

		const scopes = [
			"openid",
			"profile",
			"email",
			"https://www.googleapis.com/auth/calendar.readonly",
			"https://www.googleapis.com/auth/calendar.events",
		].join(" ");

		const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
		authUrl.searchParams.set("client_id", config.clientId);
		authUrl.searchParams.set("response_type", "code");
		authUrl.searchParams.set("redirect_uri", config.redirectUri);
		authUrl.searchParams.set("scope", scopes);
		authUrl.searchParams.set("access_type", "offline"); // For refresh token
		authUrl.searchParams.set("prompt", "consent"); // Force consent to get refresh token
		authUrl.searchParams.set("state", crypto.randomUUID());

		return actionSuccess(authUrl.toString());
	},
});

/**
 * Exchange authorization code for access token
 */
export const exchangeCodeForToken = action({
	args: { code: v.string() },
	handler: async (ctx, args): Promise<ActionResult<{ email?: string }>> => {
		const integrationError = checkGoogleIntegration();
		if (integrationError) return integrationError;

		const config = getGoogleConfig();
		if (!config.clientId || !config.clientSecret) {
			logger.error("[Google] OAuth credentials missing");
			return actionError(
				"Google OAuth credentials are not configured",
				"INTEGRATION_DISABLED",
			);
		}

		try {
			const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: new URLSearchParams({
					client_id: config.clientId,
					client_secret: config.clientSecret,
					code: args.code,
					redirect_uri: config.redirectUri,
					grant_type: "authorization_code",
				}),
			});

			if (!tokenResponse.ok) {
				const errorData = await tokenResponse.json();
				logger.error("[Google] Token exchange failed", {
					status: tokenResponse.status,
					error: errorData.error_description || errorData.error,
				});
				return actionError(
					`OAuth error: ${errorData.error_description || "Authentication failed"}`,
					"API_ERROR",
				);
			}

			const tokens = await tokenResponse.json();

			if (!tokens.access_token) {
				logger.error("[Google] Invalid token response - missing access_token");
				return actionError("Invalid OAuth response", "API_ERROR");
			}

			// Get user info to store email
			let email: string | undefined;
			let googleUserId: string | undefined;
			try {
				const userInfoResponse = await fetch(
					"https://www.googleapis.com/oauth2/v2/userinfo",
					{
						headers: {
							Authorization: `Bearer ${tokens.access_token}`,
						},
					},
				);
				if (userInfoResponse.ok) {
					const userInfo = await userInfoResponse.json();
					email = userInfo.email;
					googleUserId = userInfo.id;
				}
			} catch (e) {
				logger.warn("[Google] Failed to fetch user info", { error: String(e) });
			}

			// Use email as user identifier for per-user encryption
			// This ensures each user's tokens are encrypted with a unique derived key
			const userIdentifier = email || googleUserId || "global";

			// Encrypt tokens before storage using per-user key
			const encryptedAccessToken = await encryptToken(
				tokens.access_token,
				userIdentifier,
			);
			const encryptedRefreshToken = tokens.refresh_token
				? await encryptToken(tokens.refresh_token, userIdentifier)
				: "";

			// Store tokens securely (encrypted if TOKEN_ENCRYPTION_KEY is set)
			await ctx.runMutation(internal.google_db.storeTokens, {
				accessToken: encryptedAccessToken,
				refreshToken: encryptedRefreshToken,
				expiresAt: Date.now() + (tokens.expires_in || 3600) * 1000,
				email,
				userId: googleUserId,
				scope: tokens.scope,
				isEncrypted: !!process.env.TOKEN_ENCRYPTION_KEY,
			});

			logger.info("[Google] OAuth tokens stored", {
				email,
				encrypted: !!process.env.TOKEN_ENCRYPTION_KEY,
				perUserKey: !!email,
			});
			return actionSuccess({ email });
		} catch (error) {
			logger.error("[Google] Unexpected error in token exchange", {
				error: String(error),
			});
			return actionError(
				`Google authentication failed: ${(error as Error).message}`,
				"API_ERROR",
			);
		}
	},
});

/**
 * Check if connected to Google
 */
export const isConnected = action({
	args: {},
	handler: async (
		ctx,
	): Promise<ActionResult<{ connected: boolean; email?: string }>> => {
		if (!hasEnv("GOOGLE_CLIENT_ID")) {
			return actionSuccess({ connected: false });
		}

		const tokens = await ctx.runQuery(internal.google_db.getStoredTokens);
		const connected = !!tokens && Date.now() < tokens.expiresAt;
		return actionSuccess({ connected, email: tokens?.email });
	},
});

/**
 * Disconnect from Google
 */
export const disconnect = action({
	args: {},
	handler: async (ctx): Promise<ActionResult<{ success: boolean }>> => {
		await ctx.runMutation(internal.google_db.clearTokens);
		logger.info("[Google] Disconnected");
		return actionSuccess({ success: true });
	},
});

/**
 * Get stored access token (refreshes if expired)
 */
export const getAccessToken = action({
	args: {},
	handler: async (ctx): Promise<ActionResult<string>> => {
		const integrationError = checkGoogleIntegration();
		if (integrationError) return integrationError;

		const tokens = await ctx.runQuery(internal.google_db.getStoredTokens);
		if (!tokens) {
			return actionError(
				"Not connected to Google. Please authenticate first.",
				"MISSING_CONFIG",
			);
		}

		// Use email as user identifier for per-user decryption (must match encryption)
		const userIdentifier = tokens.email || tokens.userId || "global";

		// Decrypt the stored tokens using per-user key
		const accessToken = await decryptToken(tokens.accessToken, userIdentifier);
		const refreshToken = tokens.refreshToken
			? await decryptToken(tokens.refreshToken, userIdentifier)
			: null;

		// Check if token needs refresh (with 60 second buffer)
		if (Date.now() > tokens.expiresAt - 60000) {
			if (!refreshToken) {
				return actionError(
					"Google session expired. Please reconnect.",
					"API_ERROR",
				);
			}

			// Refresh the token
			const config = getGoogleConfig();
			if (!config.clientId || !config.clientSecret) {
				return actionError(
					"Google OAuth credentials are not configured",
					"INTEGRATION_DISABLED",
				);
			}

			try {
				const response = await fetch("https://oauth2.googleapis.com/token", {
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					body: new URLSearchParams({
						client_id: config.clientId,
						client_secret: config.clientSecret,
						refresh_token: refreshToken,
						grant_type: "refresh_token",
					}),
				});

				if (!response.ok) {
					return actionError(
						"Failed to refresh Google token. Please reconnect.",
						"API_ERROR",
					);
				}

				const newTokens = await response.json();

				// Encrypt new tokens before storage using per-user key
				const encryptedAccessToken = await encryptToken(
					newTokens.access_token,
					userIdentifier,
				);
				const encryptedRefreshToken = newTokens.refresh_token
					? await encryptToken(newTokens.refresh_token, userIdentifier)
					: tokens.refreshToken; // Keep existing encrypted refresh token

				await ctx.runMutation(internal.google_db.storeTokens, {
					accessToken: encryptedAccessToken,
					refreshToken: encryptedRefreshToken,
					expiresAt: Date.now() + (newTokens.expires_in || 3600) * 1000,
					email: tokens.email,
					userId: tokens.userId,
					isEncrypted: !!process.env.TOKEN_ENCRYPTION_KEY,
				});

				return actionSuccess(newTokens.access_token);
			} catch (error) {
				logger.error("[Google] Token refresh failed", {
					error: String(error),
				});
				return actionError(
					"Google session expired. Please reconnect.",
					"API_ERROR",
				);
			}
		}

		return actionSuccess(accessToken);
	},
});

// ============================================
// CALENDAR API HELPERS
// ============================================

// Map Google response status to our schema
function mapResponseStatus(
	status?: string,
): "accepted" | "declined" | "tentative" | "needsAction" | "none" {
	switch (status) {
		case "accepted":
			return "accepted";
		case "declined":
			return "declined";
		case "tentative":
			return "tentative";
		case "needsAction":
			return "needsAction";
		default:
			return "none";
	}
}

// Map Google event status to our schema
function mapEventStatus(
	status?: string,
): "confirmed" | "tentative" | "cancelled" {
	switch (status) {
		case "confirmed":
			return "confirmed";
		case "tentative":
			return "tentative";
		case "cancelled":
			return "cancelled";
		default:
			return "confirmed";
	}
}

// Parse Google Calendar event to our schema format
function parseGoogleEvent(event: Record<string, unknown>) {
	const start = event.start as { dateTime?: string; date?: string };
	const end = event.end as { dateTime?: string; date?: string };
	const organizer = event.organizer as {
		displayName?: string;
		email?: string;
	};
	const attendees = event.attendees as Array<{
		displayName?: string;
		email?: string;
		responseStatus?: string;
	}>;
	const conferenceData = event.conferenceData as {
		entryPoints?: Array<{ entryPointType?: string; uri?: string }>;
		conferenceSolution?: { name?: string };
	};

	// Determine if all-day event
	const isAllDay = !!start?.date;
	const startDateTime = start?.dateTime
		? new Date(start.dateTime).getTime()
		: start?.date
			? new Date(start.date).getTime()
			: Date.now();
	const endDateTime = end?.dateTime
		? new Date(end.dateTime).getTime()
		: end?.date
			? new Date(end.date).getTime()
			: Date.now();

	// Find video conference URL
	const videoEntry = conferenceData?.entryPoints?.find(
		(e) => e.entryPointType === "video",
	);

	return {
		externalId: event.id as string,
		title: (event.summary as string) || "No Title",
		description: event.description as string | undefined,
		startDateTime,
		endDateTime,
		isAllDay,
		location: event.location as string | undefined,
		organizer: organizer
			? {
					name: organizer.displayName,
					email: organizer.email || "",
				}
			: undefined,
		attendees: attendees?.map((a) => ({
			name: a.displayName,
			email: a.email || "",
			responseStatus: mapResponseStatus(a.responseStatus),
		})),
		isOnlineMeeting: !!conferenceData,
		onlineMeetingUrl: videoEntry?.uri,
		onlineMeetingProvider: conferenceData?.conferenceSolution?.name,
		status: mapEventStatus(event.status as string),
		htmlLink: event.htmlLink as string | undefined,
		recurrence: event.recurrence
			? (event.recurrence as string[]).join("\n")
			: undefined,
		recurringEventId: event.recurringEventId as string | undefined,
	};
}

// ============================================
// CALENDAR ACTIONS
// ============================================

/**
 * Fetch calendar events from Google Calendar API
 */
export const fetchCalendarEvents = action({
	args: {
		startDate: v.number(),
		endDate: v.number(),
		calendarId: v.optional(v.string()), // Default "primary"
	},
	handler: async (
		ctx,
		args,
	): Promise<
		ActionResult<{
			events: ReturnType<typeof parseGoogleEvent>[];
			nextSyncToken?: string;
		}>
	> => {
		const integrationError = checkGoogleIntegration();
		if (integrationError) return integrationError;

		const tokenResult = await ctx.runAction(
			api.actions.google.getAccessToken,
			{},
		);
		if (!tokenResult.success) {
			return actionError(
				tokenResult.error || "Failed to get access token",
				"API_ERROR",
			);
		}

		const accessToken = tokenResult.data;
		const calendarId = args.calendarId || "primary";

		try {
			const timeMin = new Date(args.startDate).toISOString();
			const timeMax = new Date(args.endDate).toISOString();

			const url = new URL(
				`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
			);
			url.searchParams.set("timeMin", timeMin);
			url.searchParams.set("timeMax", timeMax);
			url.searchParams.set("singleEvents", "true");
			url.searchParams.set("orderBy", "startTime");
			url.searchParams.set("maxResults", "250");

			const response = await fetch(url.toString(), {
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			});

			if (!response.ok) {
				const errorData = await response.json();
				logger.error("[Google Calendar] Fetch failed", {
					status: response.status,
					error: errorData.error?.message,
				});
				return actionError(
					`Failed to fetch calendar events: ${errorData.error?.message || "Unknown error"}`,
					"API_ERROR",
				);
			}

			const data = await response.json();
			const events = (data.items as Record<string, unknown>[]).map(
				parseGoogleEvent,
			);

			logger.info("[Google Calendar] Fetched events", {
				count: events.length,
				startDate: timeMin,
				endDate: timeMax,
			});

			return actionSuccess({
				events,
				nextSyncToken: data.nextSyncToken,
			});
		} catch (error) {
			logger.error("[Google Calendar] Fetch failed", {
				error: String(error),
			});
			return actionError(
				`Failed to fetch calendar events: ${(error as Error).message}`,
				"API_ERROR",
			);
		}
	},
});

/**
 * Sync Google Calendar events to Convex database
 */
export const syncCalendarEvents = action({
	args: {
		pastDays: v.optional(v.number()),
		futureDays: v.optional(v.number()),
	},
	handler: async (
		ctx,
		args,
	): Promise<
		ActionResult<{
			synced: number;
			created: number;
			updated: number;
			deleted: number;
		}>
	> => {
		const integrationError = checkGoogleIntegration();
		if (integrationError) return integrationError;

		const pastDays = args.pastDays ?? 30;
		const futureDays = args.futureDays ?? 90;

		const startDate = Date.now() - pastDays * 24 * 60 * 60 * 1000;
		const endDate = Date.now() + futureDays * 24 * 60 * 60 * 1000;

		// Fetch events from Google
		const fetchResult = await ctx.runAction(
			api.actions.google.fetchCalendarEvents,
			{
				startDate,
				endDate,
			},
		);

		if (!fetchResult.success) {
			return fetchResult;
		}

		const { events } = fetchResult.data;

		// Get current user
		const user = await ctx.runQuery(internal.calendar.getCurrentUser);
		if (!user) {
			return actionError("User not authenticated", "MISSING_CONFIG");
		}

		// Sync to database
		const result = await ctx.runMutation(internal.calendar.upsertEvents, {
			events: events.map((e: ReturnType<typeof parseGoogleEvent>) => ({
				...e,
				source: "google" as const,
				ownerId: user._id,
			})),
			source: "google",
			ownerId: user._id,
		});

		// Update sync state
		await ctx.runMutation(internal.calendar.updateSyncState, {
			userId: user._id,
			provider: "google",
			lastSyncedAt: Date.now(),
			deltaLink: fetchResult.data.nextSyncToken,
		});

		logger.info("[Google Calendar] Sync complete", result);

		return actionSuccess(result);
	},
});

/**
 * Create a calendar event in Google Calendar
 */
export const createCalendarEvent = action({
	args: {
		summary: v.string(),
		description: v.optional(v.string()),
		startDateTime: v.number(),
		endDateTime: v.number(),
		isAllDay: v.optional(v.boolean()),
		location: v.optional(v.string()),
		attendees: v.optional(
			v.array(
				v.object({
					email: v.string(),
					name: v.optional(v.string()),
				}),
			),
		),
		addConference: v.optional(v.boolean()),
		dealId: v.optional(v.id("deals")),
	},
	handler: async (
		ctx,
		args,
	): Promise<ActionResult<{ eventId: string; htmlLink: string }>> => {
		const integrationError = checkGoogleIntegration();
		if (integrationError) return integrationError;

		const tokenResult = await ctx.runAction(
			api.actions.google.getAccessToken,
			{},
		);
		if (!tokenResult.success) {
			return actionError(
				tokenResult.error || "Failed to get access token",
				"API_ERROR",
			);
		}

		const accessToken = tokenResult.data;

		try {
			const eventPayload: Record<string, unknown> = {
				summary: args.summary,
				description: args.description,
				location: args.location,
				start: args.isAllDay
					? { date: new Date(args.startDateTime).toISOString().split("T")[0] }
					: { dateTime: new Date(args.startDateTime).toISOString() },
				end: args.isAllDay
					? { date: new Date(args.endDateTime).toISOString().split("T")[0] }
					: { dateTime: new Date(args.endDateTime).toISOString() },
				attendees: args.attendees?.map((a) => ({
					email: a.email,
					displayName: a.name,
				})),
			};

			// Add Google Meet if requested
			if (args.addConference) {
				eventPayload.conferenceData = {
					createRequest: {
						requestId: crypto.randomUUID(),
						conferenceSolutionKey: { type: "hangoutsMeet" },
					},
				};
			}

			const url = new URL(
				"https://www.googleapis.com/calendar/v3/calendars/primary/events",
			);
			if (args.addConference) {
				url.searchParams.set("conferenceDataVersion", "1");
			}

			const response = await fetch(url.toString(), {
				method: "POST",
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(eventPayload),
			});

			if (!response.ok) {
				const errorData = await response.json();
				logger.error("[Google Calendar] Create event failed", {
					status: response.status,
					error: errorData.error?.message,
				});
				return actionError(
					`Failed to create event: ${errorData.error?.message || "Unknown error"}`,
					"API_ERROR",
				);
			}

			const event = await response.json();

			// Also save to local database
			const user = await ctx.runQuery(internal.calendar.getCurrentUser);
			if (user) {
				await ctx.runMutation(internal.calendar.upsertEvents, {
					events: [
						{
							...parseGoogleEvent(event),
							source: "google" as const,
							ownerId: user._id,
							dealId: args.dealId,
						},
					],
					source: "google",
					ownerId: user._id,
				});
			}

			logger.info("[Google Calendar] Event created", { eventId: event.id });

			return actionSuccess({
				eventId: event.id,
				htmlLink: event.htmlLink,
			});
		} catch (error) {
			logger.error("[Google Calendar] Create event failed", {
				error: String(error),
			});
			return actionError(
				`Failed to create calendar event: ${(error as Error).message}`,
				"API_ERROR",
			);
		}
	},
});

/**
 * Delete a calendar event from Google Calendar
 */
export const deleteCalendarEvent = action({
	args: {
		eventId: v.string(),
		calendarId: v.optional(v.string()),
	},
	handler: async (ctx, args): Promise<ActionResult<{ success: boolean }>> => {
		const integrationError = checkGoogleIntegration();
		if (integrationError) return integrationError;

		const tokenResult = await ctx.runAction(
			api.actions.google.getAccessToken,
			{},
		);
		if (!tokenResult.success) {
			return actionError(
				tokenResult.error || "Failed to get access token",
				"API_ERROR",
			);
		}

		const accessToken = tokenResult.data;
		const calendarId = args.calendarId || "primary";

		try {
			const response = await fetch(
				`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(args.eventId)}`,
				{
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				},
			);

			if (!response.ok && response.status !== 410) {
				// 410 = already deleted
				const errorData = await response.json();
				logger.error("[Google Calendar] Delete event failed", {
					status: response.status,
					error: errorData.error?.message,
				});
				return actionError(
					`Failed to delete event: ${errorData.error?.message || "Unknown error"}`,
					"API_ERROR",
				);
			}

			// Also delete from local database
			await ctx.runMutation(internal.calendar.deleteEventByExternalId, {
				source: "google",
				externalId: args.eventId,
			});

			logger.info("[Google Calendar] Event deleted", { eventId: args.eventId });

			return actionSuccess({ success: true });
		} catch (error) {
			logger.error("[Google Calendar] Delete event failed", {
				error: String(error),
			});
			return actionError(
				`Failed to delete calendar event: ${(error as Error).message}`,
				"API_ERROR",
			);
		}
	},
});
