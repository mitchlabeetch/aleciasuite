// Sentry configuration for edge runtime
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
	dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

	tracesSampleRate: 0.1,

	debug: false,

	enabled: process.env.NODE_ENV === "production",

	beforeSend(event) {
		if (process.env.NODE_ENV !== "production") {
			return null;
		}
		return event;
	},
});
