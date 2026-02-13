import React from 'react';

/**
 * Root Layout - Minimal passthrough for Next.js 15 App Router
 *
 * This layout exists at the root level to provide a fallback for error pages
 * that don't go through the [locale] segment. This prevents React Error #31
 * during static generation because it doesn't use any context providers
 * (next-intl, Clerk, etc.) that might inject non-serializable React elements.
 *
 * The actual i18n layout is in [locale]/layout.tsx.
 */

// Force children to be rendered - this is just a passthrough
export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
