"use server";

/**
 * Microsoft Integration - Server Actions
 * Ported from convex/actions/microsoft.ts, microsoftCalendar.ts, and microsoft_db.ts
 *
 * Features:
 * - OAuth flow (getAuthUrl, exchangeCodeForToken)
 * - Token storage and refresh (using BetterAuth account table)
 * - OneDrive file operations
 * - Excel read/write operations
 * - Calendar integration
 */

import { db, shared, eq, and, sql } from "@alepanel/db";
import { getAuthenticatedUser } from "../lib/auth";
import { revalidatePath } from "next/cache";
import { microsoft, createGraphClient } from "@alepanel/integrations";

// ============================================
// OAUTH CONFIGURATION
// ============================================

function getMicrosoftConfig() {
  return {
    clientId: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    tenantId: process.env.MICROSOFT_TENANT_ID || "common",
    redirectUri:
      (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000") +
      "/api/auth/microsoft/callback",
  };
}

// ============================================
// OAUTH FLOW ACTIONS
// ============================================

/**
 * Get Microsoft OAuth authorization URL
 */
export async function getMicrosoftAuthUrl() {
  const config = getMicrosoftConfig();
  if (!config.clientId) {
    throw new Error("Microsoft OAuth is not configured");
  }

  const scopes = [
    "openid",
    "profile",
    "email",
    "offline_access", // For refresh token
    "User.Read",
    "Files.Read",
    "Files.ReadWrite",
    "Calendars.Read",
    "Calendars.ReadWrite",
  ].join(" ");

  const authUrl = new URL(
    `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/authorize`
  );
  authUrl.searchParams.set("client_id", config.clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", config.redirectUri);
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("response_mode", "query");
  authUrl.searchParams.set("state", crypto.randomUUID());

  return authUrl.toString();
}

/**
 * Exchange authorization code for access token
 * Stores tokens in BetterAuth account table
 */
export async function exchangeMicrosoftCode(code: string) {
  const user = await getAuthenticatedUser();
  const config = getMicrosoftConfig();

  if (!config.clientId || !config.clientSecret) {
    throw new Error("Microsoft OAuth credentials are not configured");
  }

  try {
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`,
      {
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
      }
    );

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
        gen_random_uuid(), ${user.id}, 'microsoft', 'microsoft',
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
    return { success: true, userId: undefined };
  } catch (error) {
    console.error("[Microsoft] Token exchange failed:", error);
    throw new Error(
      `Microsoft authentication failed: ${(error as Error).message}`
    );
  }
}

/**
 * Check if connected to Microsoft
 */
export async function isMicrosoftConnected() {
  try {
    const user = await getAuthenticatedUser();

    // TODO: Query BetterAuth account table
    const result = await db.execute(sql`
      SELECT access_token_expires_at
      FROM shared.account
      WHERE user_id = ${user.id} AND provider_id = 'microsoft'
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
 * Get stored access token (refreshes if expired)
 */
export async function getMicrosoftAccessToken() {
  const user = await getAuthenticatedUser();

  // TODO: Query BetterAuth account table
  const result = await db.execute(sql`
    SELECT access_token, refresh_token, access_token_expires_at
    FROM shared.account
    WHERE user_id = ${user.id} AND provider_id = 'microsoft'
    LIMIT 1
  `);

  if (result.rows.length === 0) {
    throw new Error("Not connected to Microsoft. Please authenticate first.");
  }

  const tokenRow = result.rows[0];
  const expiresAt = new Date(String(tokenRow.access_token_expires_at));

  // Check if token needs refresh (with 60 second buffer)
  if (expiresAt < new Date(Date.now() + 60000)) {
    if (!tokenRow.refresh_token) {
      throw new Error("Microsoft session expired. Please reconnect.");
    }

    // Refresh the token
    const config = getMicrosoftConfig();
    if (!config.clientId || !config.clientSecret) {
      throw new Error("Microsoft OAuth credentials are not configured");
    }

    const response = await fetch(
      `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`,
      {
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
      }
    );

    if (!response.ok) {
      throw new Error("Failed to refresh Microsoft token. Please reconnect.");
    }

    const newTokens = await response.json();

    await db.execute(sql`
      UPDATE shared.account
      SET access_token = ${newTokens.access_token},
          refresh_token = COALESCE(${newTokens.refresh_token}, refresh_token),
          access_token_expires_at = ${new Date(Date.now() + (newTokens.expires_in || 3600) * 1000)},
          updated_at = NOW()
      WHERE user_id = ${user.id} AND provider_id = 'microsoft'
    `);

    return newTokens.access_token;
  }

  return tokenRow.access_token;
}

// ============================================
// CALENDAR ACTIONS
// ============================================

/**
 * Fetch calendar events from Microsoft Graph API
 */
export async function fetchMicrosoftCalendarEvents(args: {
  startDate: number;
  endDate: number;
}) {
  const accessToken = await getMicrosoftAccessToken();

  const startDateTime = new Date(args.startDate).toISOString();
  const endDateTime = new Date(args.endDate).toISOString();

  // Use @alepanel/integrations
  const client = createGraphClient(accessToken);

  try {
    const response = await client
      .api("/me/calendarView")
      .query({
        startDateTime,
        endDateTime,
      })
      .select(
        "id,subject,bodyPreview,start,end,isAllDay,location,organizer,attendees,isOnlineMeeting,onlineMeeting,onlineMeetingProvider,showAs,iCalUId,changeKey,recurrence,seriesMasterId"
      )
      .orderby("start/dateTime")
      .top(250)
      .get();

    const events = response.value.map(parseGraphEvent);

    return {
      success: true,
      events,
      deltaLink: response["@odata.deltaLink"],
    };
  } catch (error) {
    console.error("[Microsoft Calendar] Fetch failed:", error);
    throw new Error(
      `Failed to fetch calendar events: ${(error as Error).message}`
    );
  }
}

/**
 * Create a calendar event in Microsoft 365
 */
export async function createMicrosoftCalendarEvent(args: {
  subject: string;
  body?: string;
  startDateTime: number;
  endDateTime: number;
  isAllDay?: boolean;
  location?: string;
  attendees?: Array<{ email: string; name?: string }>;
  isOnlineMeeting?: boolean;
  dealId?: string;
}) {
  const accessToken = await getMicrosoftAccessToken();
  const client = createGraphClient(accessToken);

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

    revalidatePath("/calendar");
    return {
      success: true,
      eventId: response.id,
      webLink: response.webLink,
    };
  } catch (error) {
    console.error("[Microsoft Calendar] Create event failed:", error);
    throw new Error(
      `Failed to create calendar event: ${(error as Error).message}`
    );
  }
}

// ============================================
// ONEDRIVE ACTIONS
// ============================================

/**
 * List files in OneDrive root or a specific folder
 */
export async function getOneDriveFiles(folderId?: string) {
  const accessToken = await getMicrosoftAccessToken();
  const client = createGraphClient(accessToken);

  const endpoint = folderId
    ? `/me/drive/items/${folderId}/children`
    : "/me/drive/root/children";

  const response = await client
    .api(endpoint)
    .select(
      "id,name,webUrl,size,lastModifiedDateTime,folder,file,parentReference"
    )
    .orderby("name")
    .get();

  return response.value.map((item: Record<string, unknown>) => ({
    id: item.id,
    name: item.name,
    webUrl: item.webUrl,
    size: item.size || 0,
    lastModified: item.lastModifiedDateTime,
    type: item.folder ? "folder" : "file",
    mimeType: (item.file as Record<string, string>)?.mimeType,
    driveId: (item.parentReference as Record<string, string>)?.driveId,
  }));
}

/**
 * Read data from an Excel file range
 */
export async function readExcelRange(args: {
  driveId: string;
  fileId: string;
  sheetName: string;
  range: string;
}) {
  const accessToken = await getMicrosoftAccessToken();
  const client = createGraphClient(accessToken);

  const response = await client
    .api(
      `/drives/${args.driveId}/items/${args.fileId}/workbook/worksheets/${encodeURIComponent(args.sheetName)}/range(address='${args.range}')`
    )
    .get();

  return {
    values: response.values,
    address: response.address,
    rowCount: response.rowCount,
    columnCount: response.columnCount,
    formulas: response.formulas,
  };
}

// ============================================
// HELPERS
// ============================================

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
      responseStatus: mapResponseStatus(a.status?.response),
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

function mapResponseStatus(
  response?: string
): "accepted" | "declined" | "tentative" | "needsAction" | "none" {
  switch (response) {
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

function mapEventStatus(
  showAs?: string
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
