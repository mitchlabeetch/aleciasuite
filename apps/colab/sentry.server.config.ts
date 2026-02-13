// Sentry configuration for the server
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
	dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

	// Performance monitoring - adjust in production
	tracesSampleRate: 0.1,

	// Disable debug in production
	debug: false,

	// Only enable Sentry in production
	enabled: process.env.NODE_ENV === "production",

	// Filter out common noise
	ignoreErrors: ["NEXT_NOT_FOUND", "NEXT_REDIRECT"],

	// Performance monitoring
	integrations: [Sentry.httpIntegration()],

	beforeSend(event) {
		if (process.env.NODE_ENV !== "production") {
			return null;
		}
		return event;
	},
});
