"use node";

import { internalAction } from "../_generated/server";
import { internal, api } from "../_generated/api";
import { logger } from "../lib/logger";
import type { Id } from "../_generated/dataModel";
import type { ActionCtx } from "../_generated/server";

/**
 * Calendar Sync Scheduled Job
 *
 * Internal action that syncs calendars for all users with enabled sync.
 * Called by cron job every 15 minutes.
 */

interface SyncState {
	_id: Id<"calendar_sync_state">;
	userId: Id<"users">;
	provider: "google" | "microsoft";
	isEnabled: boolean;
	lastSyncedAt?: number;
	consecutiveErrors?: number;
	syncToken?: string;
}

/**
 * Sync all calendars for users with enabled sync
 */
export const syncAllCalendars = internalAction({
	args: {},
	handler: async (
		ctx,
	): Promise<{
		synced: number;
		errors: number;
		skipped: number;
	}> => {
		logger.info("[Calendar Sync] Starting scheduled sync");

		// Get all enabled sync states
		const syncStates = await ctx.runQuery(
			internal.calendar.getEnabledSyncStates,
		);

		let synced = 0;
		let errors = 0;
		let skipped = 0;

		for (const state of syncStates) {
			// Skip if too many consecutive errors (back off)
			if ((state.consecutiveErrors ?? 0) >= 5) {
				logger.warn("[Calendar Sync] Skipping due to consecutive errors", {
					userId: state.userId,
					provider: state.provider,
					errors: state.consecutiveErrors,
				});
				skipped++;
				continue;
			}

			try {
				if (state.provider === "google") {
					await syncGoogleCalendar(ctx, state);
				} else if (state.provider === "microsoft") {
					await syncMicrosoftCalendar(ctx, state);
				}
				synced++;
			} catch (error) {
				logger.error("[Calendar Sync] Sync failed", {
					userId: state.userId,
					provider: state.provider,
					error: String(error),
				});

				// Update sync state with error
				await ctx.runMutation(internal.calendar.updateSyncState, {
					userId: state.userId,
					provider: state.provider,
					lastSyncedAt: Date.now(),
					error: String(error),
				});

				errors++;
			}
		}

		logger.info("[Calendar Sync] Scheduled sync complete", {
			synced,
			errors,
			skipped,
		});

		return { synced, errors, skipped };
	},
});

/**
 * Sync Google Calendar for a specific user
 */
async function syncGoogleCalendar(
	ctx: ActionCtx,
	state: SyncState,
): Promise<void> {
	// Get user's Google tokens
	const tokens = await ctx.runQuery(internal.google_db.getStoredTokens);
	if (!tokens || !tokens.accessToken) {
		logger.warn("[Calendar Sync] No Google tokens found", {
			userId: state.userId,
		});
		return;
	}

	// Check if token is expired and refresh if needed
	const now = Date.now();
	const isExpired = tokens.expiresAt < now + 60000; // 1 minute buffer

	if (isExpired && tokens.refreshToken) {
		// Refresh token using the token refresh action
		await ctx.runAction(internal.tokenRefresh.refreshGoogleToken);
	}

	// Sync events
	const pastDays = 30;
	const futureDays = 90;
	const startDate = now - pastDays * 24 * 60 * 60 * 1000;
	const endDate = now + futureDays * 24 * 60 * 60 * 1000;

	// Fetch events from Google
	const fetchResult = await ctx.runAction(
		api.actions.google.fetchCalendarEvents,
		{
			startDate,
			endDate,
		},
	);

	if (!fetchResult.success) {
		throw new Error(fetchResult.error || "Failed to fetch Google events");
	}

	const { events, nextSyncToken } = fetchResult.data;

	// Upsert events to database
	await ctx.runMutation(internal.calendar.upsertEvents, {
		events: events.map((e: (typeof events)[number]) => ({
			...e,
			source: "google" as const,
			ownerId: state.userId,
		})),
		source: "google",
		ownerId: state.userId,
	});

	// Update sync state
	await ctx.runMutation(internal.calendar.updateSyncState, {
		userId: state.userId,
		provider: "google",
		lastSyncedAt: Date.now(),
		deltaLink: nextSyncToken,
	});

	logger.info("[Calendar Sync] Google sync complete", {
		userId: state.userId,
		eventCount: events.length,
	});
}

/**
 * Sync Microsoft Calendar for a specific user
 */
async function syncMicrosoftCalendar(
	ctx: ActionCtx,
	state: SyncState,
): Promise<void> {
	// Get user's Microsoft tokens
	const tokens = await ctx.runQuery(internal.microsoft_db.getStoredTokens);
	if (!tokens || !tokens.accessToken) {
		logger.warn("[Calendar Sync] No Microsoft tokens found", {
			userId: state.userId,
		});
		return;
	}

	// Check if token is expired and refresh if needed
	const now = Date.now();
	const isExpired = tokens.expiresAt < now + 60000; // 1 minute buffer

	if (isExpired && tokens.refreshToken) {
		// Refresh token using the token refresh action
		await ctx.runAction(internal.tokenRefresh.refreshMicrosoftToken);
	}

	// Try delta sync first if we have a sync token
	if (state.syncToken) {
		try {
			const deltaResult = await ctx.runAction(
				api.actions.microsoftCalendar.fetchCalendarDelta,
				{ deltaLink: state.syncToken },
			);

			if (deltaResult.success) {
				const { events, deletedIds, deltaLink } = deltaResult.data;

				// Upsert updated events
				if (events.length > 0) {
					await ctx.runMutation(internal.calendar.upsertEvents, {
						events: events.map((e: (typeof events)[number]) => ({
							...e,
							source: "microsoft" as const,
							ownerId: state.userId,
						})),
						source: "microsoft",
						ownerId: state.userId,
					});
				}

				// Delete removed events
				if (deletedIds.length > 0) {
					await ctx.runMutation(internal.calendar.deleteEventsByExternalIds, {
						source: "microsoft",
						externalIds: deletedIds,
					});
				}

				// Update sync state
				await ctx.runMutation(internal.calendar.updateSyncState, {
					userId: state.userId,
					provider: "microsoft",
					lastSyncedAt: Date.now(),
					deltaLink,
				});

				logger.info("[Calendar Sync] Microsoft delta sync complete", {
					userId: state.userId,
					updated: events.length,
					deleted: deletedIds.length,
				});

				return;
			}
		} catch {
			// Delta sync failed, fall back to full sync
			logger.warn(
				"[Calendar Sync] Delta sync failed, falling back to full sync",
			);
		}
	}

	// Full sync
	const pastDays = 30;
	const futureDays = 90;
	const startDate = now - pastDays * 24 * 60 * 60 * 1000;
	const endDate = now + futureDays * 24 * 60 * 60 * 1000;

	const fetchResult = await ctx.runAction(
		api.actions.microsoftCalendar.fetchCalendarEvents,
		{ startDate, endDate },
	);

	if (!fetchResult.success) {
		throw new Error(fetchResult.error || "Failed to fetch Microsoft events");
	}

	const { events, deltaLink } = fetchResult.data;

	// Upsert events to database
	await ctx.runMutation(internal.calendar.upsertEvents, {
		events: events.map((e: (typeof events)[number]) => ({
			...e,
			source: "microsoft" as const,
			ownerId: state.userId,
		})),
		source: "microsoft",
		ownerId: state.userId,
	});

	// Update sync state
	await ctx.runMutation(internal.calendar.updateSyncState, {
		userId: state.userId,
		provider: "microsoft",
		lastSyncedAt: Date.now(),
		deltaLink,
	});

	logger.info("[Calendar Sync] Microsoft full sync complete", {
		userId: state.userId,
		eventCount: events.length,
	});
}
