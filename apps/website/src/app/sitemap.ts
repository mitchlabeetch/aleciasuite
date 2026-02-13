import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = "https://alecia.markets";

	// Pages classiques statiques
	const routes = [
		"",
		"/expertises",
		"/operations",
		"/equipe",
		"/nous-rejoindre",
		"/actualites",
		"/connexion",
		"/contact",
		"/ceder",
		"/acquerir",
	];

	// Use build date for static pages to avoid unnecessary SEO churn
	// This will update automatically on each deployment
	const LAST_UPDATE = new Date();

	const staticEntries = routes.flatMap((route) => {
		return ["fr", "en"].map((locale) => ({
			url: `${baseUrl}/${locale}${route}`,
			lastModified: LAST_UPDATE,
			changeFrequency: "weekly" as const,
			priority: route === "" ? 1 : 0.8,
		}));
	});

	// Note: Dynamic blog post URLs will be indexed as they are discovered by crawlers
	// For better SEO, consider fetching blog posts from Convex in a server component
	// and generating dynamic sitemap entries at build time

	return staticEntries;
}
