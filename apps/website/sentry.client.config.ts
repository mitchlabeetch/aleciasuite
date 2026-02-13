// Sentry configuration options
// This file is used to configure the initialization of Sentry on the browser.
// The config you add here will be used whenever a page is visited.
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

	// Replay configuration for session recording
	replaysOnErrorSampleRate: 1.0,
	replaysSessionSampleRate: 0.1,

	integrations: [
		Sentry.replayIntegration({
			// Additional Replay configuration
			maskAllText: true,
			blockAllMedia: true,
		}),
	],

	// Filter out common noise
	ignoreErrors: [
		// Browser extensions
		"window.webkit",
		"ResizeObserver loop",
		// Network errors
		"Failed to fetch",
		"NetworkError",
		"Load failed",
		// User-cancelled requests
		"AbortError",
	],

	// Add user context when available
	beforeSend(event) {
		// Prevent sending events in development
		if (process.env.NODE_ENV !== "production") {
			return null;
		}
		return event;
	},
});
