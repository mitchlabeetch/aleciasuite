import { NextRequest, NextResponse } from "next/server";

// Public routes that don't require authentication
const publicPaths = ["/api/auth", "/api/health", "/sign-in", "/sign-up", "/embed"];

export default function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Allow public routes
	if (publicPaths.some((p) => pathname.startsWith(p))) {
		return NextResponse.next();
	}

	// Allow static assets and Next.js internals
	if (pathname.startsWith("/_next") || pathname.includes(".")) {
		return NextResponse.next();
	}

	// Check for BetterAuth session cookie
	const sessionCookie =
		request.cookies.get("alecia.session_token") ||
		request.cookies.get("better-auth.session_token");

	if (!sessionCookie) {
		const signInUrl = new URL("/sign-in", request.url);
		signInUrl.searchParams.set("redirect", pathname);
		return NextResponse.redirect(signInUrl);
	}

	// Setup CORS headers for allowed origins
	const origin = request.headers.get("origin");
	const allowedOrigins = [
		"https://alecia.markets",
		"https://panel.alecia.markets",
		"https://colab.alecia.markets",
	];

	const response = NextResponse.next();

	if (origin && allowedOrigins.includes(origin)) {
		response.headers.set("Access-Control-Allow-Origin", origin);
		response.headers.set("Access-Control-Allow-Credentials", "true");
		response.headers.set(
			"Access-Control-Allow-Methods",
			"GET, POST, PUT, DELETE, OPTIONS",
		);
		response.headers.set(
			"Access-Control-Allow-Headers",
			"Content-Type, Authorization",
		);
	}

	return response;
}

export const config = {
	matcher: [
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		"/(api|trpc)(.*)",
	],
};
