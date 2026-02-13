/** @type {import('next').NextConfig} */
const nextConfig = {
	// Docker deployment - generate standalone output
	output: "standalone",

	// Transpile packages from the monorepo
	transpilePackages: ["novel", "@alepanel/ui"],

	// Enable following symlinks (for convex symlink) - moved from experimental in Next.js 16
	outputFileTracingRoot: require("path").join(__dirname, "../../"),

	// Asset prefix for proper static file serving in multi-zone deployment
	assetPrefix:
		process.env.NODE_ENV === "production"
			? process.env.NEXT_PUBLIC_ASSET_PREFIX || "https://colab.alecia.markets"
			: undefined,

	// Enable source maps for debugging
	productionBrowserSourceMaps: true,

	// Redirects
	redirects: async () => {
		return [
			{
				source: "/github",
				destination: "https://github.com/alecia-markets/alepanel",
				permanent: true,
			},
		];
	},

	// Headers for cross-origin embedding and security
	headers: async () => {
		return [
			{
				source: "/:path*",
				headers: [
					{
						key: "X-Frame-Options",
						value:
							"ALLOW-FROM https://alecia.fr https://alecia.markets https://panel.alecia.markets",
					},
					{
						key: "Content-Security-Policy",
						value:
							"frame-ancestors 'self' https://alecia.fr https://*.alecia.fr https://alecia.markets https://*.alecia.markets",
					},
					{
						key: "Access-Control-Allow-Origin",
						value: "https://alecia.markets",
					},
					{
						key: "Access-Control-Allow-Credentials",
						value: "true",
					},
				],
			},
		];
	},
};

module.exports = nextConfig;
