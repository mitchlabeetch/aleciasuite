"use server";

/**
 * Google Integration - Server Actions
 * Ported from convex/actions/google.ts and google_db.ts
 *
 * Features:
 * - OAuth flow (getAuthUrl, exchangeCodeForToken)
 * - Token storage and refresh (using BetterAuth account table)
 * - Calendar integration
 */

import { db, shared } from "@alepanel/db";
import { getAuthenticatedUser } from "../lib/auth";
import { revalidatePath } from "next/cache";

// ============================================
// OAUTH CONFIGURATION
// ============================================

function getGoogleConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri:
      (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000") +
      "/api/auth/google/callback",
  };
}

// ============================================
// OAUTH FLOW ACTIONS
// ============================================

/**
 * Get Google OAuth authorization URL
 */
export async function getGoogleAuthUrl() {
  const config = getGoogleConfig();
  if (!config.clientId) {
    throw new Error("Google OAuth is not configured");
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

  return authUrl.toString();
}

/**
 * Exchange authorization code for access token
 * Stores tokens in BetterAuth account table
 */
export async function exchangeGoogleCode(code: string) {
  const user = await getAuthenticatedUser();
  const config = getGoogleConfig();

  if (!config.clientId || !config.clientSecret) {
    throw new Error("Google OAuth credentials are not configured");
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
        code,
        redirect_uri: config.redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      throw new Error(
        `OAuth error: ${errorData.error_description || "Authentication failed"}`
      );
    }

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      throw new Error("Invalid OAuth response");
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
        }
      );
      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();
        email = userInfo.email;
        googleUserId = userInfo.id;
      }
    } catch (e) {
      console.warn("[Google] Failed to fetch user info:", e);
    }

    // Store tokens in BetterAuth account table
    // TODO: Use BetterAuth API to store OAuth tokens
    // For now using direct DB access
    await db.execute(sql`
      INSERT INTO shared.account (
        id, user_id, account_id, provider_id,
        access_token, refresh_token,
        access_token_expires_at, scope,
        created_at, updated_at
      )
      VALUES (
        gen_random_uuid(), ${user.id}, ${googleUserId || 'google'}, 'google',
        ${tokens.access_token}, ${tokens.refresh_token || ""},
        ${new Date(Date.now() + (tokens.expires_in || 3600) * 1000)},
        ${tokens.scope},
        NOW(), NOW()
      )
      ON CONFLICT (user_id, provider_id)
      DO UPDATE SET
        access_token = ${tokens.access_token},
        refresh_token = COALESCE(${tokens.refresh_token}, account.refresh_token),
        access_token_expires_at = ${new Date(Date.now() + (tokens.expires_in || 3600) * 1000)},
        scope = ${tokens.scope},
        updated_at = NOW()
    `);

    revalidatePath("/settings/integrations");
    return { success: true, email };
  } catch (error) {
    console.error("[Google] Token exchange failed:", error);
    throw new Error(
      `Google authentication failed: ${(error as Error).message}`
    );
  }
}

/**
 * Check if connected to Google
 */
export async function isGoogleConnected() {
  try {
    const user = await getAuthenticatedUser();

    // TODO: Query BetterAuth account table
    const result = await db.execute(sql`
      SELECT access_token_expires_at
      FROM shared.account
      WHERE user_id = ${user.id} AND provider_id = 'google'
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return { connected: false };
    }

    const expiresAt = new Date(String(result.rows[0].access_token_expires_at));
    const connected = expiresAt > new Date();

    return { connected };
  } catch {
    return { connected: false };
  }
}

/**
 * Disconnect from Google
 */
export async function disconnectGoogle() {
  const user = await getAuthenticatedUser();

  await db.execute(sql`
    DELETE FROM shared.account
    WHERE user_id = ${user.id} AND provider_id = 'google'
  `);

  revalidatePath("/settings/integrations");
  return { success: true };
}

/**
 * Get stored access token (refreshes if expired)
 */
export async function getGoogleAccessToken() {
  const user = await getAuthenticatedUser();

  // TODO: Query BetterAuth account table
  const result = await db.execute(sql`
    SELECT access_token, refresh_token, access_token_expires_at
    FROM shared.account
    WHERE user_id = ${user.id} AND provider_id = 'google'
    LIMIT 1
  `);

  if (result.rows.length === 0) {
    throw new Error("Not connected to Google. Please authenticate first.");
  }

  const tokenRow = result.rows[0];
  const expiresAt = new Date(String(tokenRow.access_token_expires_at));

  // Check if token needs refresh (with 60 second buffer)
  if (expiresAt < new Date(Date.now() + 60000)) {
    if (!tokenRow.refresh_token) {
      throw new Error("Google session expired. Please reconnect.");
    }

    // Refresh the token
    const config = getGoogleConfig();
    if (!config.clientId || !config.clientSecret) {
      throw new Error("Google OAuth credentials are not configured");
    }

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: String(tokenRow.refresh_token),
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh Google token. Please reconnect.");
    }

    const newTokens = await response.json();

    await db.execute(sql`
      UPDATE shared.account
      SET access_token = ${newTokens.access_token},
          refresh_token = COALESCE(${newTokens.refresh_token}, refresh_token),
          access_token_expires_at = ${new Date(Date.now() + (newTokens.expires_in || 3600) * 1000)},
          updated_at = NOW()
      WHERE user_id = ${user.id} AND provider_id = 'google'
    `);

    return newTokens.access_token;
  }

  return tokenRow.access_token;
}

// ============================================
// CALENDAR ACTIONS
// ============================================

/**
 * Fetch calendar events from Google Calendar API
 */
export async function fetchGoogleCalendarEvents(args: {
  startDate: number;
  endDate: number;
  calendarId?: string;
}) {
  const accessToken = await getGoogleAccessToken();
  const calendarId = args.calendarId || "primary";

  const timeMin = new Date(args.startDate).toISOString();
  const timeMax = new Date(args.endDate).toISOString();

  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
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
    throw new Error(
      `Failed to fetch calendar events: ${errorData.error?.message || "Unknown error"}`
    );
  }

  const data = await response.json();
  const events = data.items.map(parseGoogleEvent);

  return {
    success: true,
    events,
    nextSyncToken: data.nextSyncToken,
  };
}

/**
 * Create a calendar event in Google Calendar
 */
export async function createGoogleCalendarEvent(args: {
  summary: string;
  description?: string;
  startDateTime: number;
  endDateTime: number;
  isAllDay?: boolean;
  location?: string;
  attendees?: Array<{ email: string; name?: string }>;
  addConference?: boolean;
  dealId?: string;
}) {
  const accessToken = await getGoogleAccessToken();

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
    "https://www.googleapis.com/calendar/v3/calendars/primary/events"
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
    throw new Error(
      `Failed to create event: ${errorData.error?.message || "Unknown error"}`
    );
  }

  const event = await response.json();

  revalidatePath("/calendar");
  return {
    success: true,
    eventId: event.id,
    htmlLink: event.htmlLink,
  };
}

/**
 * Delete a calendar event from Google Calendar
 */
export async function deleteGoogleCalendarEvent(args: {
  eventId: string;
  calendarId?: string;
}) {
  const accessToken = await getGoogleAccessToken();
  const calendarId = args.calendarId || "primary";

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(args.eventId)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 410) {
    // 410 = already deleted
    const errorData = await response.json();
    throw new Error(
      `Failed to delete event: ${errorData.error?.message || "Unknown error"}`
    );
  }

  revalidatePath("/calendar");
  return { success: true };
}

// ============================================
// HELPERS
// ============================================

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
    (e) => e.entryPointType === "video"
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

function mapResponseStatus(
  status?: string
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

function mapEventStatus(
  status?: string
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
