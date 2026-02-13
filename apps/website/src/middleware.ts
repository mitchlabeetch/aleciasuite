import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/navigation";
import { NextRequest, NextResponse } from "next/server";

// Create the internationalization middleware
const intlMiddleware = createIntlMiddleware(routing);

/**
 * Hybrid Middleware: next-intl + BetterAuth
 *
 * 1. API routes pass through without i18n processing
 * 2. All other routes go through next-intl for locale handling
 * 3. Admin routes (/admin/*) require BetterAuth session cookie
 */
export default async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Skip intl middleware for API routes
	if (pathname.startsWith("/api")) {
		return NextResponse.next();
	}

	// For admin routes, check for auth session cookie
	const isAdminRoute = /^\/(en|fr)\/admin/.test(pathname) || pathname.startsWith("/admin");
	if (isAdminRoute) {
		// Check for BetterAuth session cookie
		const sessionCookie = request.cookies.get("alecia.session_token") || request.cookies.get("better-auth.session_token");
		if (!sessionCookie) {
			// Redirect to sign-in page
			const locale = pathname.match(/^\/(en|fr)\//)?.[1] || "fr";
			const signInUrl = new URL(`/${locale}/connexion`, request.url);
			signInUrl.searchParams.set("redirect", pathname);
			return NextResponse.redirect(signInUrl);
		}
	}

	// Apply internationalization middleware to all non-API routes
	return intlMiddleware(request);
}

export const config = {
	matcher: [
		"/((?!_next|_vercel|api/webhooks|404|500|monitoring|.*\\..*).*)",
		"/(api|trpc)(.*)",
	],
};
