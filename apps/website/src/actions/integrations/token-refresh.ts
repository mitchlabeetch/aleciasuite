"use server";

/**
 * Token Refresh - Server Actions
 * Ported from convex/tokenRefresh.ts
 *
 * Features:
 * - Automated OAuth token refresh
 * - Scheduled refresh for Google, Microsoft, Pipedrive
 * - Uses BetterAuth account table for token storage
 */

import { db, shared, sql } from "@alepanel/db";

// Buffer time: refresh tokens 10 minutes before expiry
const REFRESH_BUFFER_MS = 10 * 60 * 1000;

// =============================================================================
// MAIN REFRESH JOB
// =============================================================================

/**
 * Refresh all OAuth tokens that are about to expire
 * Called by cron job every 30 minutes
 */
export async function refreshAllTokens() {
  const results = {
    google: {
      checked: false,
      refreshed: false,
      error: null as string | null,
    },
    microsoft: {
      checked: false,
      refreshed: false,
      error: null as string | null,
    },
    pipedrive: {
      checked: false,
      refreshed: false,
      error: null as string | null,
    },
  };

  // Refresh Google tokens
  try {
    results.google.checked = true;
    const googleRefreshed = await refreshGoogleTokens();
    results.google.refreshed = googleRefreshed;
  } catch (error) {
    results.google.error = String(error);
    console.error("[TokenRefresh] Google refresh failed:", error);
  }

  // Refresh Microsoft tokens
  try {
    results.microsoft.checked = true;
    const msRefreshed = await refreshMicrosoftTokens();
    results.microsoft.refreshed = msRefreshed;
  } catch (error) {
    results.microsoft.error = String(error);
    console.error("[TokenRefresh] Microsoft refresh failed:", error);
  }

  // Refresh Pipedrive tokens
  try {
    results.pipedrive.checked = true;
    const pdRefreshed = await refreshPipedriveTokens();
    results.pipedrive.refreshed = pdRefreshed;
  } catch (error) {
    results.pipedrive.error = String(error);
    console.error("[TokenRefresh] Pipedrive refresh failed:", error);
  }

  console.log("[TokenRefresh] Completed:", JSON.stringify(results));
  return results;
}

// =============================================================================
// GOOGLE TOKEN REFRESH
// =============================================================================

async function refreshGoogleTokens(): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT user_id, access_token, refresh_token, access_token_expires_at
    FROM shared.account
    WHERE provider_id = 'google'
      AND access_token_expires_at < ${new Date(Date.now() + REFRESH_BUFFER_MS)}
      AND refresh_token IS NOT NULL
      AND refresh_token != ''
    LIMIT 1
  `);

  if (result.rows.length === 0) {
    console.log("[TokenRefresh] No Google tokens to refresh");
    return false;
  }

  const tokenRow = result.rows[0];

  // Get OAuth config
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("[TokenRefresh] Google OAuth credentials not configured");
    return false;
  }

  // Refresh the token
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: String(tokenRow.refresh_token),
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Google token refresh failed: ${errorData.error_description || errorData.error}`
    );
  }

  const newTokens = await response.json();

  // Store refreshed tokens
  await db.execute(sql`
    UPDATE shared.account
    SET access_token = ${newTokens.access_token},
        refresh_token = COALESCE(${newTokens.refresh_token}, refresh_token),
        access_token_expires_at = ${new Date(Date.now() + (newTokens.expires_in || 3600) * 1000)},
        updated_at = NOW()
    WHERE user_id = ${tokenRow.user_id} AND provider_id = 'google'
  `);

  console.log("[TokenRefresh] Google token refreshed successfully");
  return true;
}

// =============================================================================
// MICROSOFT TOKEN REFRESH
// =============================================================================

async function refreshMicrosoftTokens(): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT user_id, access_token, refresh_token, access_token_expires_at
    FROM shared.account
    WHERE provider_id = 'microsoft'
      AND access_token_expires_at < ${new Date(Date.now() + REFRESH_BUFFER_MS)}
      AND refresh_token IS NOT NULL
      AND refresh_token != ''
    LIMIT 1
  `);

  if (result.rows.length === 0) {
    console.log("[TokenRefresh] No Microsoft tokens to refresh");
    return false;
  }

  const tokenRow = result.rows[0];

  // Get OAuth config
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const tenantId = process.env.MICROSOFT_TENANT_ID || "common";

  if (!clientId || !clientSecret) {
    console.error("[TokenRefresh] Microsoft OAuth credentials not configured");
    return false;
  }

  // Refresh the token
  const response = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: String(tokenRow.refresh_token),
        grant_type: "refresh_token",
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Microsoft token refresh failed: ${errorData.error_description || errorData.error}`
    );
  }

  const newTokens = await response.json();

  // Store refreshed tokens
  await db.execute(sql`
    UPDATE shared.account
    SET access_token = ${newTokens.access_token},
        refresh_token = COALESCE(${newTokens.refresh_token}, refresh_token),
        access_token_expires_at = ${new Date(Date.now() + (newTokens.expires_in || 3600) * 1000)},
        updated_at = NOW()
    WHERE user_id = ${tokenRow.user_id} AND provider_id = 'microsoft'
  `);

  console.log("[TokenRefresh] Microsoft token refreshed successfully");
  return true;
}

// =============================================================================
// PIPEDRIVE TOKEN REFRESH
// =============================================================================

async function refreshPipedriveTokens(): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT user_id, access_token, refresh_token, access_token_expires_at
    FROM shared.account
    WHERE provider_id = 'pipedrive'
      AND access_token_expires_at < ${new Date(Date.now() + REFRESH_BUFFER_MS)}
      AND refresh_token IS NOT NULL
      AND refresh_token != ''
    LIMIT 1
  `);

  if (result.rows.length === 0) {
    console.log("[TokenRefresh] No Pipedrive tokens to refresh");
    return false;
  }

  const tokenRow = result.rows[0];

  // Get OAuth config
  const clientId = process.env.PIPEDRIVE_CLIENT_ID;
  const clientSecret = process.env.PIPEDRIVE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("[TokenRefresh] Pipedrive OAuth credentials not configured");
    return false;
  }

  // Refresh the token
  const response = await fetch("https://oauth.pipedrive.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      refresh_token: String(tokenRow.refresh_token),
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Pipedrive token refresh failed: ${errorData.error_description || errorData.error}`
    );
  }

  const newTokens = await response.json();

  // Store refreshed tokens
  await db.execute(sql`
    UPDATE shared.account
    SET access_token = ${newTokens.access_token},
        refresh_token = COALESCE(${newTokens.refresh_token}, refresh_token),
        access_token_expires_at = ${new Date(Date.now() + (newTokens.expires_in || 3600) * 1000)},
        updated_at = NOW()
    WHERE user_id = ${tokenRow.user_id} AND provider_id = 'pipedrive'
  `);

  console.log("[TokenRefresh] Pipedrive token refreshed successfully");
  return true;
}
