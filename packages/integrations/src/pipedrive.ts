// packages/integrations/src/pipedrive.ts
// Pipedrive CRM — Bidirectional sync via official OAuth connection
// Uses Pipedrive's OAuth2 flow (github.com/pipedrive/client-nodejs)
// No custom API wrapper — connect via their standard OAuth dance
//
// OAuth flow:
// 1. User clicks "Connect Pipedrive" in Alecia BI
// 2. Redirect to Pipedrive authorization URL
// 3. User approves, Pipedrive redirects back with auth code
// 4. Exchange code for access/refresh tokens
// 5. Store tokens in shared.account or encrypted column
// 6. Use tokens for API calls, auto-refresh when expired
//
// Register your app: https://developers.pipedrive.com/docs/api/v1
// TODO: Port sync logic from convex/pipedrive.ts

const PIPEDRIVE_API_BASE = "https://api.pipedrive.com/v1";

/** Generate the Pipedrive OAuth authorization URL */
export function getPipedriveAuthUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.PIPEDRIVE_CLIENT_ID!,
    redirect_uri: redirectUri,
  });
  return `https://oauth.pipedrive.com/oauth/authorize?${params}`;
}

/** Exchange authorization code for access + refresh tokens */
export async function exchangePipedriveCode(
  code: string,
  redirectUri: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const response = await fetch("https://oauth.pipedrive.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.PIPEDRIVE_CLIENT_ID}:${process.env.PIPEDRIVE_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!response.ok) throw new Error(`Pipedrive token exchange failed: ${response.status}`);
  return response.json();
}

/** Refresh an expired access token */
export async function refreshPipedriveToken(
  refreshToken: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const response = await fetch("https://oauth.pipedrive.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.PIPEDRIVE_CLIENT_ID}:${process.env.PIPEDRIVE_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!response.ok) throw new Error(`Pipedrive token refresh failed: ${response.status}`);
  return response.json();
}

export const pipedrive = {
  /** Fetch all deals from Pipedrive */
  async getDeals(accessToken: string, start = 0, limit = 100) {
    const response = await fetch(
      `${PIPEDRIVE_API_BASE}/deals?start=${start}&limit=${limit}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`);
    return response.json();
  },

  /** Fetch all contacts (persons) from Pipedrive */
  async getPersons(accessToken: string, start = 0, limit = 100) {
    const response = await fetch(
      `${PIPEDRIVE_API_BASE}/persons?start=${start}&limit=${limit}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`);
    return response.json();
  },

  /** Push a deal to Pipedrive */
  async createDeal(
    deal: { title: string; value?: number; currency?: string; org_id?: number },
    accessToken: string
  ) {
    const response = await fetch(`${PIPEDRIVE_API_BASE}/deals`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(deal),
    });
    if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`);
    return response.json();
  },

  /** Update an existing deal in Pipedrive */
  async updateDeal(
    dealId: number,
    updates: Record<string, unknown>,
    accessToken: string
  ) {
    const response = await fetch(`${PIPEDRIVE_API_BASE}/deals/${dealId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`);
    return response.json();
  },

  /** Get recent changes (for incremental sync) */
  async getRecentChanges(accessToken: string, sinceTimestamp: string) {
    const response = await fetch(
      `${PIPEDRIVE_API_BASE}/recents?since_timestamp=${sinceTimestamp}&items=deal,person,organization`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`);
    return response.json();
  },
};
