import { NextRequest, NextResponse } from "next/server";
import { db } from "@alepanel/db";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/fr/admin/settings?error=no_code", request.url));
  }

  const clientId = process.env.PIPEDRIVE_CLIENT_ID!;
  const clientSecret = process.env.PIPEDRIVE_CLIENT_SECRET!;
  const redirectUri = process.env.PIPEDRIVE_REDIRECT_URI || "https://alecia.markets/api/integrations/pipedrive/callback";

  // Exchange code for tokens
  const tokenResponse = await fetch("https://oauth.pipedrive.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    console.error("Pipedrive token exchange failed:", error);
    return NextResponse.redirect(new URL("/fr/admin/settings?error=token_exchange_failed", request.url));
  }

  const tokens = await tokenResponse.json();
  
  // Store tokens in DB — use raw SQL to INSERT/UPDATE into a simple table
  // The table shared.oauth_tokens should be created by the migration V014
  try {
    await db.execute(
      `INSERT INTO shared.oauth_tokens (provider, access_token, refresh_token, expires_at, api_domain, created_at, updated_at)
       VALUES ('pipedrive', $1, $2, NOW() + INTERVAL '${tokens.expires_in || 3600} seconds', $3, NOW(), NOW())
       ON CONFLICT (provider) DO UPDATE SET
         access_token = EXCLUDED.access_token,
         refresh_token = EXCLUDED.refresh_token,
         expires_at = EXCLUDED.expires_at,
         api_domain = EXCLUDED.api_domain,
         updated_at = NOW()`,
      [tokens.access_token, tokens.refresh_token, tokens.api_domain || null]
    );
  } catch (err) {
    console.error("Failed to store Pipedrive tokens:", err);
  }

  return NextResponse.redirect(new URL("/fr/admin/settings?pipedrive=connected", request.url));
}
