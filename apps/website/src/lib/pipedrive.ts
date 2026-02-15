import { db } from "@alepanel/db";

interface PipedriveTokens {
  access_token: string;
  refresh_token: string;
  expires_at: Date;
  api_domain: string;
}

export async function getPipedriveTokens(): Promise<PipedriveTokens | null> {
  const result = await db.execute(
    `SELECT access_token, refresh_token, expires_at, api_domain FROM shared.oauth_tokens WHERE provider = 'pipedrive'`
  );
  if (!result.rows.length) return null;
  const row = result.rows[0] as any;
  
  // Check if token is expired
  if (new Date(row.expires_at) < new Date()) {
    // Refresh the token
    return refreshPipedriveToken(row.refresh_token);
  }
  
  return row;
}

async function refreshPipedriveToken(refreshToken: string): Promise<PipedriveTokens | null> {
  const clientId = process.env.PIPEDRIVE_CLIENT_ID!;
  const clientSecret = process.env.PIPEDRIVE_CLIENT_SECRET!;

  const response = await fetch("https://oauth.pipedrive.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    console.error("Failed to refresh Pipedrive token");
    return null;
  }

  const tokens = await response.json();
  
  await db.execute(
    `UPDATE shared.oauth_tokens SET 
      access_token = $1, refresh_token = $2, 
      expires_at = NOW() + INTERVAL '${tokens.expires_in || 3600} seconds',
      api_domain = $3, updated_at = NOW()
     WHERE provider = 'pipedrive'`,
    [tokens.access_token, tokens.refresh_token, tokens.api_domain || null]
  );

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000),
    api_domain: tokens.api_domain,
  };
}

export async function isPipedriveConnected(): Promise<boolean> {
  const tokens = await getPipedriveTokens();
  return tokens !== null;
}
