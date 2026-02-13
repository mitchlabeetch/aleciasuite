// Sentry configuration for the client
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
	dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

	// Performance monitoring
	tracesSampleRate: 0.1,

	debug: false,

	// Only enable Sentry in production
	enabled: process.env.NODE_ENV === "production",

	// Replay configuration for session recording
	replaysOnErrorSampleRate: 1.0,
	replaysSessionSampleRate: 0.1,

	integrations: [
		Sentry.replayIntegration({
			maskAllText: true,
			blockAllMedia: true,
		}),
	],

	// Filter out common noise
	ignoreErrors: [
		"window.webkit",
		"ResizeObserver loop",
		"Failed to fetch",
		"NetworkError",
		"Load failed",
		"AbortError",
		// Yjs/collaboration errors that are expected
		"Yjs",
		"y-protocols",
	],

	beforeSend(event) {
		if (process.env.NODE_ENV !== "production") {
			return null;
		}
		return event;
	},
});
