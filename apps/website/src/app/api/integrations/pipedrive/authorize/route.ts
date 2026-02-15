// Generates the Pipedrive OAuth authorization URL and redirects the user
import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.PIPEDRIVE_CLIENT_ID;
  const redirectUri = process.env.PIPEDRIVE_REDIRECT_URI || "https://alecia.markets/api/integrations/pipedrive/callback";
  
  if (!clientId) {
    return NextResponse.json({ error: "Pipedrive not configured" }, { status: 500 });
  }

  const authUrl = `https://oauth.pipedrive.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  return NextResponse.redirect(authUrl);
}
