"use client";

/**
 * SkipToContent - Accessibility component
 *
 * Provides a skip link for keyboard users to bypass navigation
 * and jump directly to main content. Hidden by default,
 * becomes visible on focus.
 *
 * @accessibility WCAG 2.1 - 2.4.1: Bypass Blocks
 */

import { useTranslations } from "next-intl";

export function SkipToContent() {
	const t = useTranslations("Accessibility");

	return (
		<a
			href="#main-content"
			className="
        sr-only focus:not-sr-only
        focus:fixed focus:top-4 focus:left-4 focus:z-[9999]
        focus:px-4 focus:py-2
        focus:bg-corporate focus:text-white
        focus:rounded-md focus:shadow-lg
        focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-corporate
        transition-all duration-200
      "
		>
			{t("skipToContent")}
		</a>
	);
}
