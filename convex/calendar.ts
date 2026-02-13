import { v } from "convex/values";
import {
	mutation,
	query,
	internalMutation,
	internalQuery,
} from "./_generated/server";
import { getAuthenticatedUser, getOptionalUser } from "./auth_utils";
import type { Doc, Id } from "./_generated/dataModel";

/**
 * Calendar Events - Phase 2.3
 *
 * Queries and mutations for calendar event management
 */

// ============================================
// QUERIES
// ============================================

/**
 * Get calendar events for the current user within a date range
 */
export const getEvents = query({
	args: {
		startDate: v.number(),
		endDate: v.number(),
		source: v.optional(
			v.union(v.literal("microsoft"), v.literal("google"), v.literal("manual")),
		),
		dealId: v.optional(v.id("deals")),
	},
	handler: async (ctx, args) => {
		const user = await getOptionalUser(ctx);
		if (!user) return [];

		let events = await ctx.db
			.query("calendar_events")
			.withIndex("by_date_range", (q) =>
				q.eq("ownerId", user._id).gte("startDateTime", args.startDate),
			)
			.filter((q) => q.lte(q.field("startDateTime"), args.endDate))
			.collect();

		// Filter by source if specified
		if (args.source) {
			events = events.filter((e) => e.source === args.source);
		}

		// Filter by deal if specified
		if (args.dealId) {
			events = events.filter((e) => e.dealId === args.dealId);
		}

		// Sort by start time
		events.sort((a, b) => a.startDateTime - b.startDateTime);

		return events;
	},
});

/**
 * Get a single calendar event
 */
export const getEvent = query({
	args: {
		eventId: v.id("calendar_events"),
	},
	handler: async (ctx, args) => {
		const user = await getOptionalUser(ctx);
		if (!user) return null;

		const event = await ctx.db.get(args.eventId);
		if (!event || event.ownerId !== user._id) return null;

		return event;
	},
});

/**
 * Get calendar events for a specific deal
 */
export const getEventsForDeal = query({
	args: {
		dealId: v.id("deals"),
	},
	handler: async (ctx, args) => {
		const user = await getOptionalUser(ctx);
		if (!user) return [];

		const events = await ctx.db
			.query("calendar_events")
			.withIndex("by_dealId", (q) => q.eq("dealId", args.dealId))
			.collect();

		// Sort by start time
		events.sort((a, b) => a.startDateTime - b.startDateTime);

		return events;
	},
});

/**
 * Get upcoming events (next 7 days)
 */
export const getUpcomingEvents = query({
	args: {
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const user = await getOptionalUser(ctx);
		if (!user) return [];

		const now = Date.now();
		const weekFromNow = now + 7 * 24 * 60 * 60 * 1000;
		const limit = args.limit ?? 10;

		const events = await ctx.db
			.query("calendar_events")
			.withIndex("by_date_range", (q) =>
				q.eq("ownerId", user._id).gte("startDateTime", now),
			)
			.filter((q) => q.lte(q.field("startDateTime"), weekFromNow))
			.take(limit);

		return events;
	},
});

/**
 * Get sync state for a provider
 */
export const getSyncState = query({
	args: {
		provider: v.union(v.literal("microsoft"), v.literal("google")),
	},
	handler: async (ctx, args) => {
		const user = await getOptionalUser(ctx);
		if (!user) return null;

		const state = await ctx.db
			.query("calendar_sync_state")
			.withIndex("by_userId_provider", (q) =>
				q.eq("userId", user._id).eq("provider", args.provider),
			)
			.first();

		return state;
	},
});

/**
 * Get all sync states for the current user
 */
export const getAllSyncStates = query({
	args: {},
	handler: async (ctx) => {
		const user = await getOptionalUser(ctx);
		if (!user) return [];

		const states = await ctx.db
			.query("calendar_sync_state")
			.withIndex("by_userId", (q) => q.eq("userId", user._id))
			.collect();

		return states;
	},
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a manual calendar event
 */
export const createEvent = mutation({
	args: {
		title: v.string(),
		description: v.optional(v.string()),
		startDateTime: v.number(),
		endDateTime: v.number(),
		isAllDay: v.optional(v.boolean()),
		location: v.optional(v.string()),
		dealId: v.optional(v.id("deals")),
		companyId: v.optional(v.id("companies")),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);
		const now = Date.now();

		const eventId = await ctx.db.insert("calendar_events", {
			title: args.title,
			description: args.description,
			startDateTime: args.startDateTime,
			endDateTime: args.endDateTime,
			isAllDay: args.isAllDay,
			location: args.location,
			source: "manual",
			externalId: `manual_${now}_${Math.random().toString(36).slice(2)}`,
			ownerId: user._id,
			dealId: args.dealId,
			companyId: args.companyId,
			lastSyncedAt: now,
			createdAt: now,
			updatedAt: now,
		});

		return eventId;
	},
});

/**
 * Update a calendar event
 */
export const updateEvent = mutation({
	args: {
		eventId: v.id("calendar_events"),
		title: v.optional(v.string()),
		description: v.optional(v.string()),
		startDateTime: v.optional(v.number()),
		endDateTime: v.optional(v.number()),
		isAllDay: v.optional(v.boolean()),
		location: v.optional(v.string()),
		dealId: v.optional(v.id("deals")),
		companyId: v.optional(v.id("companies")),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);

		const event = await ctx.db.get(args.eventId);
		if (!event) {
			throw new Error("Event not found");
		}

		if (event.ownerId !== user._id) {
			throw new Error("Not authorized to update this event");
		}

		const updates: Partial<Doc<"calendar_events">> = {
			updatedAt: Date.now(),
		};

		if (args.title !== undefined) updates.title = args.title;
		if (args.description !== undefined) updates.description = args.description;
		if (args.startDateTime !== undefined)
			updates.startDateTime = args.startDateTime;
		if (args.endDateTime !== undefined) updates.endDateTime = args.endDateTime;
		if (args.isAllDay !== undefined) updates.isAllDay = args.isAllDay;
		if (args.location !== undefined) updates.location = args.location;
		if (args.dealId !== undefined) updates.dealId = args.dealId;
		if (args.companyId !== undefined) updates.companyId = args.companyId;

		await ctx.db.patch(args.eventId, updates);

		return { success: true };
	},
});

/**
 * Delete a calendar event
 */
export const deleteEvent = mutation({
	args: {
		eventId: v.id("calendar_events"),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);

		const event = await ctx.db.get(args.eventId);
		if (!event) {
			throw new Error("Event not found");
		}

		if (event.ownerId !== user._id) {
			throw new Error("Not authorized to delete this event");
		}

		await ctx.db.delete(args.eventId);

		return { success: true };
	},
});

/**
 * Link an event to a deal
 */
export const linkEventToDeal = mutation({
	args: {
		eventId: v.id("calendar_events"),
		dealId: v.id("deals"),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);

		const event = await ctx.db.get(args.eventId);
		if (!event || event.ownerId !== user._id) {
			throw new Error("Event not found or not authorized");
		}

		await ctx.db.patch(args.eventId, {
			dealId: args.dealId,
			updatedAt: Date.now(),
		});

		return { success: true };
	},
});

/**
 * Enable/disable calendar sync
 */
export const toggleSync = mutation({
	args: {
		provider: v.union(v.literal("microsoft"), v.literal("google")),
		isEnabled: v.boolean(),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);
		const now = Date.now();

		const existing = await ctx.db
			.query("calendar_sync_state")
			.withIndex("by_userId_provider", (q) =>
				q.eq("userId", user._id).eq("provider", args.provider),
			)
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, {
				isEnabled: args.isEnabled,
				updatedAt: now,
			});
		} else {
			await ctx.db.insert("calendar_sync_state", {
				userId: user._id,
				provider: args.provider,
				isEnabled: args.isEnabled,
				syncDirection: "import_only",
				syncPastDays: 30,
				syncFutureDays: 90,
				createdAt: now,
				updatedAt: now,
			});
		}

		return { success: true };
	},
});

// ============================================
// INTERNAL QUERIES/MUTATIONS
// ============================================

/**
 * Internal: Get current user for actions
 */
export const getCurrentUser = internalQuery({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const user = await ctx.db
			.query("users")
			.withIndex("by_token", (q) =>
				q.eq("tokenIdentifier", identity.tokenIdentifier),
			)
			.unique();

		return user;
	},
});

/**
 * Internal: Upsert calendar events from sync
 */
export const upsertEvents = internalMutation({
	args: {
		events: v.array(
			v.object({
				externalId: v.string(),
				title: v.string(),
				description: v.optional(v.string()),
				startDateTime: v.number(),
				endDateTime: v.number(),
				isAllDay: v.optional(v.boolean()),
				location: v.optional(v.string()),
				source: v.union(
					v.literal("microsoft"),
					v.literal("google"),
					v.literal("manual"),
				),
				ownerId: v.id("users"),
				dealId: v.optional(v.id("deals")),
				organizer: v.optional(
					v.object({
						name: v.optional(v.string()),
						email: v.string(),
					}),
				),
				attendees: v.optional(
					v.array(
						v.object({
							name: v.optional(v.string()),
							email: v.string(),
							responseStatus: v.optional(
								v.union(
									v.literal("accepted"),
									v.literal("declined"),
									v.literal("tentative"),
									v.literal("needsAction"),
									v.literal("none"),
								),
							),
						}),
					),
				),
				isOnlineMeeting: v.optional(v.boolean()),
				onlineMeetingUrl: v.optional(v.string()),
				onlineMeetingProvider: v.optional(v.string()),
				status: v.optional(
					v.union(
						v.literal("confirmed"),
						v.literal("tentative"),
						v.literal("cancelled"),
					),
				),
				iCalUId: v.optional(v.string()),
				changeKey: v.optional(v.string()),
				recurrence: v.optional(v.string()),
				recurringEventId: v.optional(v.string()),
			}),
		),
		source: v.union(v.literal("microsoft"), v.literal("google")),
		ownerId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const now = Date.now();
		let created = 0;
		let updated = 0;

		for (const event of args.events) {
			// Check if event already exists
			const existing = await ctx.db
				.query("calendar_events")
				.withIndex("by_externalId", (q) =>
					q.eq("source", args.source).eq("externalId", event.externalId),
				)
				.first();

			if (existing) {
				// Update existing event
				await ctx.db.patch(existing._id, {
					title: event.title,
					description: event.description,
					startDateTime: event.startDateTime,
					endDateTime: event.endDateTime,
					isAllDay: event.isAllDay,
					location: event.location,
					organizer: event.organizer,
					attendees: event.attendees,
					isOnlineMeeting: event.isOnlineMeeting,
					onlineMeetingUrl: event.onlineMeetingUrl,
					onlineMeetingProvider: event.onlineMeetingProvider,
					status: event.status,
					iCalUId: event.iCalUId,
					changeKey: event.changeKey,
					recurrence: event.recurrence,
					recurringEventId: event.recurringEventId,
					lastSyncedAt: now,
					updatedAt: now,
				});
				updated++;
			} else {
				// Create new event
				await ctx.db.insert("calendar_events", {
					...event,
					lastSyncedAt: now,
					createdAt: now,
					updatedAt: now,
				});
				created++;
			}
		}

		return {
			synced: args.events.length,
			created,
			updated,
			deleted: 0,
		};
	},
});

/**
 * Internal: Update sync state
 */
export const updateSyncState = internalMutation({
	args: {
		userId: v.id("users"),
		provider: v.union(v.literal("microsoft"), v.literal("google")),
		lastSyncedAt: v.number(),
		deltaLink: v.optional(v.string()),
		error: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const now = Date.now();

		const existing = await ctx.db
			.query("calendar_sync_state")
			.withIndex("by_userId_provider", (q) =>
				q.eq("userId", args.userId).eq("provider", args.provider),
			)
			.first();

		if (existing) {
			const updates: Partial<Doc<"calendar_sync_state">> = {
				lastSyncedAt: args.lastSyncedAt,
				updatedAt: now,
			};

			if (args.deltaLink) {
				updates.syncToken = args.deltaLink;
			}

			if (args.error) {
				updates.lastError = args.error;
				updates.lastErrorAt = now;
				updates.consecutiveErrors = (existing.consecutiveErrors ?? 0) + 1;
			} else {
				updates.lastError = undefined;
				updates.lastErrorAt = undefined;
				updates.consecutiveErrors = 0;
			}

			await ctx.db.patch(existing._id, updates);
		} else {
			await ctx.db.insert("calendar_sync_state", {
				userId: args.userId,
				provider: args.provider,
				isEnabled: true,
				syncDirection: "import_only",
				lastSyncedAt: args.lastSyncedAt,
				syncToken: args.deltaLink,
				lastError: args.error,
				lastErrorAt: args.error ? now : undefined,
				consecutiveErrors: args.error ? 1 : 0,
				createdAt: now,
				updatedAt: now,
			});
		}
	},
});

/**
 * Internal: Delete event by external ID
 */
export const deleteEventByExternalId = internalMutation({
	args: {
		source: v.union(v.literal("microsoft"), v.literal("google")),
		externalId: v.string(),
	},
	handler: async (ctx, args) => {
		const event = await ctx.db
			.query("calendar_events")
			.withIndex("by_externalId", (q) =>
				q.eq("source", args.source).eq("externalId", args.externalId),
			)
			.first();

		if (event) {
			await ctx.db.delete(event._id);
		}
	},
});

/**
 * Internal: Get all enabled sync states (for scheduled sync)
 */
export const getEnabledSyncStates = internalQuery({
	args: {},
	handler: async (ctx) => {
		const states = await ctx.db
			.query("calendar_sync_state")
			.filter((q) => q.eq(q.field("isEnabled"), true))
			.collect();

		return states;
	},
});

/**
 * Internal: Delete events by IDs (for delta sync)
 */
export const deleteEventsByExternalIds = internalMutation({
	args: {
		source: v.union(v.literal("microsoft"), v.literal("google")),
		externalIds: v.array(v.string()),
	},
	handler: async (ctx, args) => {
		let deleted = 0;

		for (const externalId of args.externalIds) {
			const event = await ctx.db
				.query("calendar_events")
				.withIndex("by_externalId", (q) =>
					q.eq("source", args.source).eq("externalId", externalId),
				)
				.first();

			if (event) {
				await ctx.db.delete(event._id);
				deleted++;
			}
		}

		return { deleted };
	},
});
