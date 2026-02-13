import { NextResponse } from "next/server";

/**
 * Microsoft OAuth Callback - DEPRECATED
 *
 * OAuth callbacks are now handled by BetterAuth at /api/auth/callback/microsoft
 * This route redirects there for backwards compatibility.
 */
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const baseUrl = new URL(request.url).origin;

	// Forward to BetterAuth's OAuth callback handler
	const betterAuthCallback = new URL("/api/auth/callback/microsoft", baseUrl);
	// Forward all query params (code, state, error, etc.)
	searchParams.forEach((value, key) => {
		betterAuthCallback.searchParams.set(key, value);
	});

	return NextResponse.redirect(betterAuthCallback);
}
