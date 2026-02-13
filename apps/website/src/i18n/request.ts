import { getRequestConfig } from "next-intl/server";

// Simple, serializable fallback messages
const FALLBACK_MESSAGES = {
	Common: { firstName: "First Name", lastName: "Last Name", email: "Email" },
	Metadata: { title: "Alecia", description: "M&A Advisory" },
	NotFound: { title: "Not Found", description: "Page not found", back: "Back" },
};

export default getRequestConfig(async ({ requestLocale }) => {
	// Get locale from request, with fallback for SSG of error pages
	let locale: string = "fr";

	try {
		const resolved = await requestLocale;
		if (resolved && ["en", "fr"].includes(resolved)) {
			locale = resolved;
		}
	} catch {
		// During SSG of /404 and /500, requestLocale may not be available
		locale = "fr";
	}

	// Safely load messages with fallback
	let messages: Record<string, unknown>;
	try {
		messages = (await import(`../messages/${locale}.json`)).default;
	} catch {
		// Fallback to minimal messages if file can't be loaded
		messages = FALLBACK_MESSAGES;
	}

	return {
		locale,
		messages,
	};
});
