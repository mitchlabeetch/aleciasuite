// packages/integrations/src/pipedrive.ts
// Pipedrive CRM — Bidirectional sync via official OAuth connection using the official Pipedrive SDK
// Uses Pipedrive's OAuth2 flow (github.com/pipedrive/client-nodejs)
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

import * as pipedrive from "pipedrive";

// Re-export types for convenience
export type DealsApi = pipedrive.v1.DealsApi;
export type PersonsApi = pipedrive.v1.PersonsApi;
export type OrganizationsApi = pipedrive.v1.OrganizationsApi;
export type Configuration = pipedrive.v1.Configuration;
export type OAuth2Configuration = pipedrive.v1.OAuth2Configuration;

// ============================================
// TYPES
// ============================================

export interface PipedriveDeal {
  id: number;
  title: string;
  value: number;
  currency: string;
  status: "open" | "won" | "lost" | "deleted";
  stage_id: number;
  person_id: number | null;
  org_id: number | null;
  org_name?: string;
  person_name?: string;
  add_time: string;
  update_time: string;
}

export interface PipedrivePerson {
  id: number;
  name: string;
  email: Array<{ value: string; primary: boolean }> | null;
  phone: Array<{ value: string; primary: boolean }> | null;
  org_id: number | null;
  org_name?: string;
  add_time: string;
  update_time: string;
}

export interface PipedriveOrganization {
  id: number;
  name: string;
  address?: string;
  people_count?: number;
  open_deals_count?: number;
  add_time: string;
  update_time: string;
}

export interface PipedriveClient {
  deals: DealsApi;
  persons: PersonsApi;
  organizations: OrganizationsApi;
}

// ============================================
// OAUTH HELPERS
// ============================================

/** Generate the Pipedrive OAuth authorization URL */
export function getPipedriveAuthUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.PIPEDRIVE_CLIENT_ID!,
    redirect_uri: redirectUri,
  });
  return `https://oauth.pipedrive.com/oauth/authorize?${params}`;
}

/** Exchange authorization code for access + refresh tokens */
export async function exchangeCodeForTokens(
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

  if (!response.ok) {
    throw new Error(`Pipedrive token exchange failed: ${response.status}`);
  }

  return response.json();
}

/** Refresh an expired access token */
export async function refreshAccessToken(
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

  if (!response.ok) {
    throw new Error(`Pipedrive token refresh failed: ${response.status}`);
  }

  return response.json();
}

// ============================================
// SDK CLIENT FACTORY
// ============================================

/**
 * Create a Pipedrive API client with OAuth2 authentication
 *
 * @param accessToken - The OAuth2 access token
 * @returns Typed API client instances for deals, persons, and organizations
 */
export function createPipedriveClient(accessToken: string): PipedriveClient {
  // Create configuration with OAuth2 access token
  const config = new pipedrive.v1.Configuration({
    accessToken,
  });

  // Create API instances with the configured client
  const deals = new pipedrive.v1.DealsApi(config);
  const persons = new pipedrive.v1.PersonsApi(config);
  const organizations = new pipedrive.v1.OrganizationsApi(config);

  return {
    deals,
    persons,
    organizations,
  };
}
