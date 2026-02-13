import { NextResponse } from "next/server";

/**
 * Google OAuth Callback - DEPRECATED
 *
 * OAuth callbacks are now handled by BetterAuth at /api/auth/callback/google
 * This route redirects there for backwards compatibility.
 */
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const baseUrl = new URL(request.url).origin;

	const betterAuthCallback = new URL("/api/auth/callback/google", baseUrl);
	searchParams.forEach((value, key) => {
		betterAuthCallback.searchParams.set(key, value);
	});

	return NextResponse.redirect(betterAuthCallback);
}
