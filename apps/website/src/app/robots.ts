import { MetadataRoute } from "next";

/**
 * Robots.txt configuration
 * - Allows crawling of public pages
 * - Blocks admin, authentication, and API routes
 */
export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: "*",
				allow: "/",
				disallow: [
					"/admin",
					"/admin/*",
					"/connexion",
					"/sign-in",
					"/sign-up",
					"/api/*",
					"/_next/*",
				],
			},
			// Block aggressive crawlers
			{
				userAgent: "GPTBot",
				disallow: "/",
			},
			{
				userAgent: "ChatGPT-User",
				disallow: "/",
			},
		],
		sitemap: "https://alecia.markets/sitemap.xml",
	};
}
