import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";
import { resolve } from "path";
import { withSentryConfig } from "@sentry/nextjs";

// Use no path argument - let next-intl auto-discover the config
const withNextIntl = createNextIntlPlugin();

/**
 * Content Security Policy
 * @security SEC-002 - Prevents XSS, clickjacking, and data injection attacks
 */
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.sentry.io;
  worker-src 'self' blob:;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' data: blob: https: https://logo.clearbit.com https://images.unsplash.com;
  connect-src 'self' https://*.sentry.io https://*.ingest.sentry.io;
  frame-src 'self' https://colab.alecia.markets https://dataroom.viapazon.com;
  frame-ancestors 'self' https://alecia.markets https://colab.alecia.markets;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
`
	.replace(/\s{2,}/g, " ")
	.trim();

/**
 * Security Headers applied to all routes
 */
const securityHeaders = [
	{
		key: "Content-Security-Policy",
		value: ContentSecurityPolicy,
	},
	{
		key: "X-Frame-Options",
		value: "SAMEORIGIN",
	},
	{
		key: "X-Content-Type-Options",
		value: "nosniff",
	},
	{
		key: "Referrer-Policy",
		value: "strict-origin-when-cross-origin",
	},
	{
		key: "Permissions-Policy",
		value: "camera=(), microphone=(), geolocation=()",
	},
	{
		key: "X-DNS-Prefetch-Control",
		value: "on",
	},
];

const nextConfig: NextConfig = {
	reactStrictMode: true,
	transpilePackages: ["@alepanel/ui"],

	// Use standalone output for deployment
	output: "standalone",

	// FIX: SEC-001 - Removed ignoreBuildErrors flags
	// Builds should fail on TypeScript errors to prevent broken deployments
	typescript: {
		ignoreBuildErrors: false,
	},

	// FIX: SEC-001 - Removed ignoreDuringBuilds flag
	// Builds should fail on ESLint errors to catch issues early
	eslint: {
		ignoreDuringBuilds: false,
	},

	// Skip middleware for internal routes
	skipMiddlewareUrlNormalize: true,
	skipTrailingSlashRedirect: true,

	// Fix monorepo lockfile detection by specifying workspace root
	outputFileTracingRoot: resolve(__dirname, "../../"),

	// Configure webpack
	webpack: (config) => {
		return config;
	},

	// Security Headers
	async headers() {
		return [
			{
				// Apply security headers to all routes
				source: "/:path*",
				headers: securityHeaders,
			},
		];
	},

	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "logo.clearbit.com",
			},
			{
				protocol: "https",
				hostname: "images.unsplash.com",
			},
		],
	},
};

// Sentry configuration options
const sentryWebpackPluginOptions = {
	org: process.env.SENTRY_ORG,
	project: process.env.SENTRY_PROJECT,
	silent: process.env.NODE_ENV !== "production",
	widenClientFileUpload: true,
	disableLogger: true,
	hideSourceMaps: true,
	reactComponentAnnotation: { enabled: true },
	tunnelRoute: "/monitoring",
};

// Apply next-intl wrapper
const finalConfig = withNextIntl(nextConfig);

export default process.env.NEXT_PUBLIC_SENTRY_DSN
	? withSentryConfig(finalConfig, sentryWebpackPluginOptions)
	: finalConfig;
