// Sentry configuration for the server
// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
	dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

	// Adjust this value in production, or use tracesSampler for greater control
	tracesSampleRate: 0.1,

	// Setting this option to true will print useful information to the console while you're setting up Sentry.
	debug: false,

	// Only enable Sentry in production
	enabled: process.env.NODE_ENV === "production",

	// Filter out common noise
	ignoreErrors: [
		// Known non-issues
		"NEXT_NOT_FOUND",
		"NEXT_REDIRECT",
	],

	// Performance monitoring
	integrations: [Sentry.httpIntegration()],

	beforeSend(event) {
		// Don't send events in development
		if (process.env.NODE_ENV !== "production") {
			return null;
		}
		return event;
	},
});
