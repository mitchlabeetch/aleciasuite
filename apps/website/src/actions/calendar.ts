"use server";

/**
 * Calendar Events - Server Actions
 * Ported from convex/calendar.ts
 *
 * Features:
 * - Local calendar event management
 * - Microsoft/Google calendar sync
 * - Deal-linked events
 */

import { db, shared, eq, and, gte, lte, inArray } from "@alepanel/db";
import { getAuthenticatedUser } from "./lib/auth";
import { revalidatePath } from "next/cache";

type CalendarEvent = {
  id: string;
  externalId: string;
  title: string;
  description?: string;
  startDateTime: number;
  endDateTime: number;
  isAllDay?: boolean;
  location?: string;
  source: "microsoft" | "google" | "manual";
  ownerId: string;
  dealId?: string;
  companyId?: string;
  organizer?: {
    name?: string;
    email: string;
  };
  attendees?: Array<{
    name?: string;
    email: string;
    responseStatus?: "accepted" | "declined" | "tentative" | "needsAction" | "none";
  }>;
  isOnlineMeeting?: boolean;
  onlineMeetingUrl?: string;
  onlineMeetingProvider?: string;
  status?: "confirmed" | "tentative" | "cancelled";
  iCalUId?: string;
  changeKey?: string;
  recurrence?: string;
  recurringEventId?: string;
  lastSyncedAt: number;
  createdAt: number;
  updatedAt: number;
};

type CalendarSyncState = {
  id: string;
  userId: string;
  provider: "microsoft" | "google";
  isEnabled: boolean;
  syncDirection?: "import_only" | "export_only" | "bidirectional";
  lastSyncedAt?: number;
  syncToken?: string;
  lastError?: string;
  lastErrorAt?: number;
  consecutiveErrors?: number;
  syncPastDays?: number;
  syncFutureDays?: number;
  createdAt: number;
  updatedAt: number;
};

// ============================================
// QUERIES
// ============================================

/**
 * Get calendar events within a date range
 */
export async function getEvents(args: {
  startDate: number;
  endDate: number;
  source?: "microsoft" | "google" | "manual";
  dealId?: string;
}) {
  const user = await getAuthenticatedUser();

  const conditions = [
    eq(shared.calendarEvents.ownerId, user.id),
    gte(shared.calendarEvents.startDateTime, args.startDate),
    lte(shared.calendarEvents.startDateTime, args.endDate),
  ];

  if (args.source) {
    conditions.push(eq(shared.calendarEvents.source, args.source));
  }

  if (args.dealId) {
    conditions.push(eq(shared.calendarEvents.dealId, args.dealId));
  }

  const events = await db
    .select()
    .from(shared.calendarEvents)
    .where(and(...conditions))
    .orderBy(shared.calendarEvents.startDateTime);

  return events as CalendarEvent[];
}

/**
 * Get a single calendar event
 */
export async function getEvent(eventId: string) {
  const user = await getAuthenticatedUser();

  const [event] = await db
    .select()
    .from(shared.calendarEvents)
    .where(
      and(
        eq(shared.calendarEvents.id, eventId),
        eq(shared.calendarEvents.ownerId, user.id)
      )
    )
    .limit(1);

  return (event as CalendarEvent) || null;
}

/**
 * Get calendar events for a specific deal
 */
export async function getEventsForDeal(dealId: string) {
  const user = await getAuthenticatedUser();

  const events = await db
    .select()
    .from(shared.calendarEvents)
    .where(
      and(
        eq(shared.calendarEvents.ownerId, user.id),
        eq(shared.calendarEvents.dealId, dealId)
      )
    )
    .orderBy(shared.calendarEvents.startDateTime);

  return events as CalendarEvent[];
}

/**
 * Get upcoming events (next 7 days)
 */
export async function getUpcomingEvents(_limit: number = 10) {
  const user = await getAuthenticatedUser();
  const now = Date.now();
  const weekFromNow = now + 7 * 24 * 60 * 60 * 1000;

  return getEvents({
    startDate: now,
    endDate: weekFromNow,
  });
}

/**
 * Get sync state for a provider
 */
export async function getSyncState(provider: "microsoft" | "google") {
  const user = await getAuthenticatedUser();

  const [syncState] = await db
    .select()
    .from(shared.calendarSyncState)
    .where(
      and(
        eq(shared.calendarSyncState.userId, user.id),
        eq(shared.calendarSyncState.provider, provider)
      )
    )
    .limit(1);

  return (syncState as CalendarSyncState) || null;
}

/**
 * Get all sync states for the current user
 */
export async function getAllSyncStates() {
  const user = await getAuthenticatedUser();

  const syncStates = await db
    .select()
    .from(shared.calendarSyncState)
    .where(eq(shared.calendarSyncState.userId, user.id));

  return syncStates as CalendarSyncState[];
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a manual calendar event
 */
export async function createEvent(args: {
  title: string;
  description?: string;
  startDateTime: number;
  endDateTime: number;
  isAllDay?: boolean;
  location?: string;
  dealId?: string;
  companyId?: string;
}) {
  const user = await getAuthenticatedUser();
  const now = Date.now();

  const [event] = await db
    .insert(shared.calendarEvents)
    .values({
      title: args.title,
      description: args.description,
      startDateTime: args.startDateTime,
      endDateTime: args.endDateTime,
      isAllDay: args.isAllDay,
      location: args.location,
      source: "manual",
      externalId: `manual_${now}_${Math.random().toString(36).slice(2)}`,
      ownerId: user.id,
      dealId: args.dealId,
      companyId: args.companyId,
      lastSyncedAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  revalidatePath("/calendar");
  return { id: event.id };
}

/**
 * Update a calendar event
 */
export async function updateEvent(args: {
  eventId: string;
  title?: string;
  description?: string;
  startDateTime?: number;
  endDateTime?: number;
  isAllDay?: boolean;
  location?: string;
  dealId?: string;
  companyId?: string;
}) {
  const user = await getAuthenticatedUser();
  const now = Date.now();

  const updateData: Record<string, any> = {
    updatedAt: now,
  };

  if (args.title !== undefined) updateData.title = args.title;
  if (args.description !== undefined) updateData.description = args.description;
  if (args.startDateTime !== undefined) updateData.startDateTime = args.startDateTime;
  if (args.endDateTime !== undefined) updateData.endDateTime = args.endDateTime;
  if (args.isAllDay !== undefined) updateData.isAllDay = args.isAllDay;
  if (args.location !== undefined) updateData.location = args.location;
  if (args.dealId !== undefined) updateData.dealId = args.dealId;
  if (args.companyId !== undefined) updateData.companyId = args.companyId;

  await db
    .update(shared.calendarEvents)
    .set(updateData)
    .where(
      and(
        eq(shared.calendarEvents.id, args.eventId),
        eq(shared.calendarEvents.ownerId, user.id)
      )
    );

  revalidatePath("/calendar");
  return { success: true };
}

/**
 * Delete a calendar event
 */
export async function deleteEvent(eventId: string) {
  const user = await getAuthenticatedUser();

  await db
    .delete(shared.calendarEvents)
    .where(
      and(
        eq(shared.calendarEvents.id, eventId),
        eq(shared.calendarEvents.ownerId, user.id)
      )
    );

  revalidatePath("/calendar");
  return { success: true };
}

/**
 * Link an event to a deal
 */
export async function linkEventToDeal(args: {
  eventId: string;
  dealId: string;
}) {
  const user = await getAuthenticatedUser();
  const now = Date.now();

  await db
    .update(shared.calendarEvents)
    .set({
      dealId: args.dealId,
      updatedAt: now,
    })
    .where(
      and(
        eq(shared.calendarEvents.id, args.eventId),
        eq(shared.calendarEvents.ownerId, user.id)
      )
    );

  revalidatePath("/calendar");
  revalidatePath(`/deals/${args.dealId}`);
  return { success: true };
}

/**
 * Enable/disable calendar sync
 */
export async function toggleSync(args: {
  provider: "microsoft" | "google";
  isEnabled: boolean;
}) {
  const user = await getAuthenticatedUser();
  const now = Date.now();

  await db
    .insert(shared.calendarSyncState)
    .values({
      userId: user.id,
      provider: args.provider,
      isEnabled: args.isEnabled,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [shared.calendarSyncState.userId, shared.calendarSyncState.provider],
      set: {
        isEnabled: args.isEnabled,
        updatedAt: now,
      },
    });

  revalidatePath("/settings/integrations");
  return { success: true };
}

// ============================================
// INTERNAL HELPERS (for calendar sync)
// ============================================

/**
 * Upsert calendar events from sync (called by integration actions)
 */
export async function upsertEventsFromSync(args: {
  events: Array<Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">>;
  source: "microsoft" | "google";
  ownerId: string;
}) {
  const now = Date.now();
  let created = 0;
  let updated = 0;

  for (const event of args.events) {
    const [existing] = await db
      .select()
      .from(shared.calendarEvents)
      .where(
        and(
          eq(shared.calendarEvents.source, args.source),
          eq(shared.calendarEvents.externalId, event.externalId)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(shared.calendarEvents)
        .set({
          title: event.title,
          description: event.description,
          startDateTime: event.startDateTime,
          endDateTime: event.endDateTime,
          isAllDay: event.isAllDay,
          location: event.location,
          dealId: event.dealId,
          companyId: event.companyId,
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
        })
        .where(eq(shared.calendarEvents.id, existing.id));
      updated++;
    } else {
      await db.insert(shared.calendarEvents).values({
        externalId: event.externalId,
        title: event.title,
        description: event.description,
        startDateTime: event.startDateTime,
        endDateTime: event.endDateTime,
        isAllDay: event.isAllDay,
        location: event.location,
        source: args.source,
        ownerId: event.ownerId,
        dealId: event.dealId,
        companyId: event.companyId,
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
        createdAt: now,
        updatedAt: now,
      });
      created++;
    }
  }

  revalidatePath("/calendar");

  return {
    synced: args.events.length,
    created,
    updated,
    deleted: 0,
  };
}

/**
 * Update sync state (called by integration actions)
 */
export async function updateSyncStateInternal(args: {
  userId: string;
  provider: "microsoft" | "google";
  lastSyncedAt: number;
  deltaLink?: string;
  error?: string;
}) {
  const now = Date.now();

  const updateData: Record<string, any> = {
    lastSyncedAt: args.lastSyncedAt,
    updatedAt: now,
  };

  if (args.deltaLink !== undefined) {
    updateData.syncToken = args.deltaLink;
  }

  if (args.error) {
    updateData.lastError = args.error;
    updateData.lastErrorAt = now;
    // Increment consecutive errors
    const [current] = await db
      .select()
      .from(shared.calendarSyncState)
      .where(
        and(
          eq(shared.calendarSyncState.userId, args.userId),
          eq(shared.calendarSyncState.provider, args.provider)
        )
      )
      .limit(1);

    updateData.consecutiveErrors = (current?.consecutiveErrors || 0) + 1;
  } else {
    // Reset consecutive errors on success
    updateData.consecutiveErrors = 0;
    updateData.lastError = null;
  }

  await db
    .insert(shared.calendarSyncState)
    .values({
      userId: args.userId,
      provider: args.provider,
      lastSyncedAt: args.lastSyncedAt,
      syncToken: args.deltaLink,
      createdAt: now,
      updatedAt: now,
      consecutiveErrors: 0,
    })
    .onConflictDoUpdate({
      target: [shared.calendarSyncState.userId, shared.calendarSyncState.provider],
      set: updateData,
    });

  revalidatePath("/settings/integrations");
}

/**
 * Delete event by external ID (for delta sync)
 */
export async function deleteEventByExternalId(args: {
  source: "microsoft" | "google";
  externalId: string;
}) {
  await db
    .delete(shared.calendarEvents)
    .where(
      and(
        eq(shared.calendarEvents.source, args.source),
        eq(shared.calendarEvents.externalId, args.externalId)
      )
    );

  revalidatePath("/calendar");
}

/**
 * Delete multiple events by external IDs (for delta sync)
 */
export async function deleteEventsByExternalIds(args: {
  source: "microsoft" | "google";
  externalIds: string[];
}) {
  if (args.externalIds.length === 0) {
    return { deleted: 0 };
  }

  const _result = await db
    .delete(shared.calendarEvents)
    .where(
      and(
        eq(shared.calendarEvents.source, args.source),
        inArray(shared.calendarEvents.externalId, args.externalIds)
      )
    );

  revalidatePath("/calendar");

  return { deleted: args.externalIds.length };
}
