import { Metadata } from "next";

/**
 * Admin Layout Metadata
 *
 * Prevents search engines from indexing admin pages.
 * This is a server component that exports metadata for the admin section.
 */
export const metadata: Metadata = {
	title: {
		template: "%s | alecia Admin",
		default: "Admin Panel | alecia",
	},
	robots: {
		index: false,
		follow: false,
		nocache: true,
		googleBot: {
			index: false,
			follow: false,
			noimageindex: true,
		},
	},
};

export { default } from "./AdminLayoutClient";
