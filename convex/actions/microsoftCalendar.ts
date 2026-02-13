"use node";

import { action, internalAction } from "../_generated/server";
import { v } from "convex/values";
import "isomorphic-fetch";
import { Client } from "@microsoft/microsoft-graph-client";
import { logger } from "../lib/logger";
import { internal, api } from "../_generated/api";
import {
	checkIntegration,
	actionError,
	actionSuccess,
	type ActionResult,
} from "../lib/env";

/**
 * Microsoft Calendar Sync - Phase 2.3
 *
 * Features:
 * - Fetch calendar events from Microsoft 365
 * - Sync events to Convex database
 * - Delta sync for efficient updates
 * - Two-way sync support (future)
 */

// ============================================
// GRAPH API HELPERS
// ============================================

const getGraphClient = (accessToken: string) => {
	return Client.init({
		authProvider: (done) => {
			done(null, accessToken);
		},
	});
};

// Map Microsoft response status to our schema
function mapResponseStatus(response?: {
	response?: { type?: string };
}): "accepted" | "declined" | "tentative" | "needsAction" | "none" {
	const type = response?.response?.type;
	switch (type) {
		case "accepted":
			return "accepted";
		case "declined":
			return "declined";
		case "tentativelyAccepted":
			return "tentative";
		case "notResponded":
			return "needsAction";
		default:
			return "none";
	}
}

// Map Microsoft event status to our schema
function mapEventStatus(
	showAs?: string,
): "confirmed" | "tentative" | "cancelled" {
	switch (showAs) {
		case "tentative":
			return "tentative";
		case "free":
		case "busy":
		case "oof":
		case "workingElsewhere":
			return "confirmed";
		default:
			return "confirmed";
	}
}

// Parse Microsoft Graph event to our schema format
function parseGraphEvent(event: Record<string, unknown>) {
	const start = event.start as { dateTime?: string; timeZone?: string };
	const end = event.end as { dateTime?: string; timeZone?: string };
	const organizer = event.organizer as {
		emailAddress?: { name?: string; address?: string };
	};
	const attendees = event.attendees as Array<{
		emailAddress?: { name?: string; address?: string };
		status?: { response?: string };
	}>;
	const onlineMeeting = event.onlineMeeting as { joinUrl?: string };
	const location = event.location as { displayName?: string };

	return {
		externalId: event.id as string,
		title: (event.subject as string) || "No Title",
		description: event.bodyPreview as string | undefined,
		startDateTime: start?.dateTime
			? new Date(start.dateTime + "Z").getTime()
			: Date.now(),
		endDateTime: end?.dateTime
			? new Date(end.dateTime + "Z").getTime()
			: Date.now(),
		isAllDay: event.isAllDay as boolean | undefined,
		location: location?.displayName,
		organizer: organizer?.emailAddress
			? {
					name: organizer.emailAddress.name,
					email: organizer.emailAddress.address || "",
				}
			: undefined,
		attendees: attendees?.map((a) => ({
			name: a.emailAddress?.name,
			email: a.emailAddress?.address || "",
			responseStatus: mapResponseStatus(a as { response?: { type?: string } }),
		})),
		isOnlineMeeting: !!event.isOnlineMeeting,
		onlineMeetingUrl: onlineMeeting?.joinUrl,
		onlineMeetingProvider: event.onlineMeetingProvider as string | undefined,
		status: mapEventStatus(event.showAs as string),
		iCalUId: event.iCalUId as string | undefined,
		changeKey: event.changeKey as string | undefined,
		recurrence: event.recurrence ? JSON.stringify(event.recurrence) : undefined,
		recurringEventId: event.seriesMasterId as string | undefined,
	};
}

// ============================================
// CALENDAR ACTIONS
// ============================================

/**
 * Fetch calendar events from Microsoft Graph API
 */
export const fetchCalendarEvents = action({
	args: {
		startDate: v.number(), // Timestamp
		endDate: v.number(), // Timestamp
	},
	handler: async (
		ctx,
		args,
	): Promise<
		ActionResult<{
			events: ReturnType<typeof parseGraphEvent>[];
			deltaLink?: string;
		}>
	> => {
		const integrationError = checkIntegration("microsoft");
		if (integrationError) return integrationError;

		// Get access token
		const tokenResult = await ctx.runAction(
			api.actions.microsoft.getAccessToken,
			{},
		);
		if (!tokenResult.success) {
			return actionError(
				tokenResult.error || "Failed to get access token",
				"API_ERROR",
			);
		}

		const accessToken = tokenResult.data;
		const client = getGraphClient(accessToken);

		try {
			const startDateTime = new Date(args.startDate).toISOString();
			const endDateTime = new Date(args.endDate).toISOString();

			const response = await client
				.api("/me/calendarView")
				.query({
					startDateTime,
					endDateTime,
				})
				.select(
					"id,subject,bodyPreview,start,end,isAllDay,location,organizer,attendees,isOnlineMeeting,onlineMeeting,onlineMeetingProvider,showAs,iCalUId,changeKey,recurrence,seriesMasterId",
				)
				.orderby("start/dateTime")
				.top(250)
				.get();

			const events = (response.value as Record<string, unknown>[]).map(
				parseGraphEvent,
			);

			logger.info("[Microsoft Calendar] Fetched events", {
				count: events.length,
				startDate: startDateTime,
				endDate: endDateTime,
			});

			return actionSuccess({
				events,
				deltaLink: response["@odata.deltaLink"],
			});
		} catch (error) {
			logger.error("[Microsoft Calendar] Fetch failed", {
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
 * Fetch calendar events using delta query (for incremental sync)
 */
export const fetchCalendarDelta = action({
	args: {
		deltaLink: v.optional(v.string()),
		startDate: v.optional(v.number()),
		endDate: v.optional(v.number()),
	},
	handler: async (
		ctx,
		args,
	): Promise<
		ActionResult<{
			events: ReturnType<typeof parseGraphEvent>[];
			deletedIds: string[];
			deltaLink?: string;
		}>
	> => {
		const integrationError = checkIntegration("microsoft");
		if (integrationError) return integrationError;

		const tokenResult = await ctx.runAction(
			api.actions.microsoft.getAccessToken,
			{},
		);
		if (!tokenResult.success) {
			return actionError(
				tokenResult.error || "Failed to get access token",
				"API_ERROR",
			);
		}

		const accessToken = tokenResult.data;
		const client = getGraphClient(accessToken);

		try {
			let request;

			if (args.deltaLink) {
				// Use existing delta link for incremental sync
				request = client.api(args.deltaLink);
			} else {
				// Initial delta sync
				const startDateTime = args.startDate
					? new Date(args.startDate).toISOString()
					: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
				const endDateTime = args.endDate
					? new Date(args.endDate).toISOString()
					: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

				request = client
					.api("/me/calendarView/delta")
					.query({
						startDateTime,
						endDateTime,
					})
					.select(
						"id,subject,bodyPreview,start,end,isAllDay,location,organizer,attendees,isOnlineMeeting,onlineMeeting,onlineMeetingProvider,showAs,iCalUId,changeKey,recurrence,seriesMasterId",
					);
			}

			const response = await request.get();

			const events: ReturnType<typeof parseGraphEvent>[] = [];
			const deletedIds: string[] = [];

			for (const item of response.value as Record<string, unknown>[]) {
				if (item["@removed"]) {
					deletedIds.push(item.id as string);
				} else {
					events.push(parseGraphEvent(item));
				}
			}

			logger.info("[Microsoft Calendar] Delta sync", {
				updated: events.length,
				deleted: deletedIds.length,
			});

			return actionSuccess({
				events,
				deletedIds,
				deltaLink: response["@odata.deltaLink"],
			});
		} catch (error) {
			logger.error("[Microsoft Calendar] Delta fetch failed", {
				error: String(error),
			});
			return actionError(
				`Failed to fetch calendar delta: ${(error as Error).message}`,
				"API_ERROR",
			);
		}
	},
});

/**
 * Sync calendar events to Convex database
 */
export const syncCalendarEvents = action({
	args: {
		pastDays: v.optional(v.number()), // Default 30
		futureDays: v.optional(v.number()), // Default 90
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
		const integrationError = checkIntegration("microsoft");
		if (integrationError) return integrationError;

		const pastDays = args.pastDays ?? 30;
		const futureDays = args.futureDays ?? 90;

		const startDate = Date.now() - pastDays * 24 * 60 * 60 * 1000;
		const endDate = Date.now() + futureDays * 24 * 60 * 60 * 1000;

		// Fetch events from Microsoft
		const fetchResult = await ctx.runAction(
			api.actions.microsoftCalendar.fetchCalendarEvents,
			{ startDate, endDate },
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
			events: events.map((e: ReturnType<typeof parseGraphEvent>) => ({
				...e,
				source: "microsoft" as const,
				ownerId: user._id,
			})),
			source: "microsoft",
			ownerId: user._id,
		});

		// Update sync state
		await ctx.runMutation(internal.calendar.updateSyncState, {
			userId: user._id,
			provider: "microsoft",
			lastSyncedAt: Date.now(),
			deltaLink: fetchResult.data.deltaLink,
		});

		logger.info("[Microsoft Calendar] Sync complete", result);

		return actionSuccess(result);
	},
});

/**
 * Create a calendar event in Microsoft 365
 */
export const createCalendarEvent = action({
	args: {
		subject: v.string(),
		body: v.optional(v.string()),
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
		isOnlineMeeting: v.optional(v.boolean()),
		dealId: v.optional(v.id("deals")),
	},
	handler: async (
		ctx,
		args,
	): Promise<ActionResult<{ eventId: string; webLink: string }>> => {
		const integrationError = checkIntegration("microsoft");
		if (integrationError) return integrationError;

		const tokenResult = await ctx.runAction(
			api.actions.microsoft.getAccessToken,
			{},
		);
		if (!tokenResult.success) {
			return actionError(
				tokenResult.error || "Failed to get access token",
				"API_ERROR",
			);
		}

		const accessToken = tokenResult.data;
		const client = getGraphClient(accessToken);

		try {
			const eventPayload: Record<string, unknown> = {
				subject: args.subject,
				body: args.body
					? {
							contentType: "HTML",
							content: args.body,
						}
					: undefined,
				start: {
					dateTime: new Date(args.startDateTime).toISOString(),
					timeZone: "UTC",
				},
				end: {
					dateTime: new Date(args.endDateTime).toISOString(),
					timeZone: "UTC",
				},
				isAllDay: args.isAllDay,
				location: args.location
					? {
							displayName: args.location,
						}
					: undefined,
				attendees: args.attendees?.map((a) => ({
					emailAddress: {
						address: a.email,
						name: a.name,
					},
					type: "required",
				})),
				isOnlineMeeting: args.isOnlineMeeting,
				onlineMeetingProvider: args.isOnlineMeeting
					? "teamsForBusiness"
					: undefined,
			};

			const response = await client.api("/me/events").post(eventPayload);

			// Also save to local database
			const user = await ctx.runQuery(internal.calendar.getCurrentUser);
			if (user) {
				await ctx.runMutation(internal.calendar.upsertEvents, {
					events: [
						{
							...parseGraphEvent(response),
							source: "microsoft" as const,
							ownerId: user._id,
							dealId: args.dealId,
						},
					],
					source: "microsoft",
					ownerId: user._id,
				});
			}

			logger.info("[Microsoft Calendar] Event created", {
				eventId: response.id,
			});

			return actionSuccess({
				eventId: response.id,
				webLink: response.webLink,
			});
		} catch (error) {
			logger.error("[Microsoft Calendar] Create event failed", {
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
 * Update a calendar event in Microsoft 365
 */
export const updateCalendarEvent = action({
	args: {
		eventId: v.string(),
		subject: v.optional(v.string()),
		body: v.optional(v.string()),
		startDateTime: v.optional(v.number()),
		endDateTime: v.optional(v.number()),
		location: v.optional(v.string()),
	},
	handler: async (ctx, args): Promise<ActionResult<{ success: boolean }>> => {
		const integrationError = checkIntegration("microsoft");
		if (integrationError) return integrationError;

		const tokenResult = await ctx.runAction(
			api.actions.microsoft.getAccessToken,
			{},
		);
		if (!tokenResult.success) {
			return actionError(
				tokenResult.error || "Failed to get access token",
				"API_ERROR",
			);
		}

		const accessToken = tokenResult.data;
		const client = getGraphClient(accessToken);

		try {
			const updates: Record<string, unknown> = {};

			if (args.subject) updates.subject = args.subject;
			if (args.body) {
				updates.body = {
					contentType: "HTML",
					content: args.body,
				};
			}
			if (args.startDateTime) {
				updates.start = {
					dateTime: new Date(args.startDateTime).toISOString(),
					timeZone: "UTC",
				};
			}
			if (args.endDateTime) {
				updates.end = {
					dateTime: new Date(args.endDateTime).toISOString(),
					timeZone: "UTC",
				};
			}
			if (args.location) {
				updates.location = {
					displayName: args.location,
				};
			}

			await client.api(`/me/events/${args.eventId}`).patch(updates);

			logger.info("[Microsoft Calendar] Event updated", {
				eventId: args.eventId,
			});

			return actionSuccess({ success: true });
		} catch (error) {
			logger.error("[Microsoft Calendar] Update event failed", {
				error: String(error),
			});
			return actionError(
				`Failed to update calendar event: ${(error as Error).message}`,
				"API_ERROR",
			);
		}
	},
});

/**
 * Delete a calendar event from Microsoft 365
 */
export const deleteCalendarEvent = action({
	args: {
		eventId: v.string(),
	},
	handler: async (ctx, args): Promise<ActionResult<{ success: boolean }>> => {
		const integrationError = checkIntegration("microsoft");
		if (integrationError) return integrationError;

		const tokenResult = await ctx.runAction(
			api.actions.microsoft.getAccessToken,
			{},
		);
		if (!tokenResult.success) {
			return actionError(
				tokenResult.error || "Failed to get access token",
				"API_ERROR",
			);
		}

		const accessToken = tokenResult.data;
		const client = getGraphClient(accessToken);

		try {
			await client.api(`/me/events/${args.eventId}`).delete();

			// Also delete from local database
			await ctx.runMutation(internal.calendar.deleteEventByExternalId, {
				source: "microsoft",
				externalId: args.eventId,
			});

			logger.info("[Microsoft Calendar] Event deleted", {
				eventId: args.eventId,
			});

			return actionSuccess({ success: true });
		} catch (error) {
			logger.error("[Microsoft Calendar] Delete event failed", {
				error: String(error),
			});
			return actionError(
				`Failed to delete calendar event: ${(error as Error).message}`,
				"API_ERROR",
			);
		}
	},
});
