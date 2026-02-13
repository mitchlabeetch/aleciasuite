import React from 'react';
// Locale-specific layout - handles i18n for all pages under [locale]/*
// Root-level error pages (404, 500) are handled by src/app/not-found.tsx and global-error.tsx

import type { Metadata } from "next";
import localFont from "next/font/local";
import { Playfair_Display } from "next/font/google";
import { Providers } from "@/components/providers";
import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import {
	getMessages,
	getTranslations,
	setRequestLocale,
} from "next-intl/server";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MobileFooter } from "@/components/layout/MobileFooter";
import { CookieBanner } from "@/components/layout/CookieBanner";
// ExitIntentModal removed - awaiting board approval

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";

// Supported locales
const locales = ["en", "fr"] as const;

// Bierstadt font (Microsoft-style, loaded locally)
const bierstadt = localFont({
	src: [
		{
			path: "../../assets/fonts/bierstadt.ttf",
			weight: "400",
			style: "normal",
		},
		{
			path: "../../assets/fonts/bierstadt-bold.ttf",
			weight: "700",
			style: "normal",
		},
	],
	variable: "--font-bierstadt",
	display: "swap",
});

// Playfair Display substitute using local Bierstadt assets (avoid build-time fetches)
const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

// Required for static page generation with next-intl
export function generateStaticParams() {
	return [{ locale: "en" }, { locale: "fr" }];
}

export async function generateMetadata({
	params,
}: { params: Promise<{ locale: string }> }): Promise<Metadata> {
	// Default metadata for error pages and fallback
	const defaultMetadata: Metadata = {
		title: "Alecia | M&A Advisory",
		description: "Cabinet de conseil en fusions-acquisitions",
		icons: {
			icon: "/icon.svg",
			apple: "/icon.svg",
		},
	};

	try {
		const { locale } = await params;

		// Validate locale before using translations
		if (!locale || !["en", "fr"].includes(locale)) {
			return defaultMetadata;
		}

		const t = await getTranslations({ locale, namespace: "Metadata" });
		const baseUrl = "https://alecia.markets";
		const canonicalUrl = `${baseUrl}/${locale}`;

		return {
			title: t("title"),
			description: t("description"),
			alternates: {
				canonical: canonicalUrl,
				languages: {
					en: `${baseUrl}/en`,
					fr: `${baseUrl}/fr`,
				},
			},
			openGraph: {
				title: t("title"),
				description: t("description"),
				url: canonicalUrl,
				siteName: "Alecia",
				images: [
					{
						url: `${baseUrl}/assets/Alecia/HERO_p800.png`,
						width: 800,
						height: 600,
						alt: "Alecia - Banque d'affaires",
					},
				],
				type: "website",
				locale: locale,
			},
			twitter: {
				card: "summary_large_image",
				title: t("title"),
				description: t("description"),
				images: [`${baseUrl}/assets/Alecia/HERO_p800.png`],
				site: "@AleciaMarkets",
				creator: "@AleciaMarkets",
			},
			icons: {
				icon: "/icon.svg",
				apple: "/icon.svg",
			},
		};
	} catch {
		// Return default metadata if translations fail (e.g., during SSG of /404)
		return defaultMetadata;
	}
}

export default async function RootLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}) {
	let locale: string;

	try {
		const resolvedParams = await params;
		locale = resolvedParams.locale;
	} catch {
		// During SSG of error pages, params may not be available
		locale = "fr";
	}

	// Validate locale
	if (!locales.includes(locale as (typeof locales)[number])) {
		notFound();
	}

	// Enable static rendering - wrap in try-catch for error pages
	try {
		setRequestLocale(locale);
	} catch {
		// Ignore - this can fail during SSG of /404 and /500
	}

	// Providing all messages to the client
	// Use JSON.parse/stringify to ensure plain object (no React elements)
	let messages: Record<string, unknown> = {};
	try {
		const rawMessages = await getMessages();
		// Ensure it's a plain serializable object
		messages = JSON.parse(JSON.stringify(rawMessages));
	} catch {
		// Fallback to empty messages - translations will use keys
		messages = {};
	}

	return (
		<html
			lang={locale}
			suppressHydrationWarning
			className={`${bierstadt.variable} ${playfair.variable}`}
		>
			<body className={`${bierstadt.className} antialiased`}>
				<NextIntlClientProvider messages={messages}>
					<Providers
						attribute="class"
						defaultTheme="light"
						enableSystem={false}
						forcedTheme="light"
						disableTransitionOnChange
					>
						{/* Skip to content link for accessibility - WCAG 2.4.1 */}
						<a
							href="#main-content"
							className="
                  sr-only focus:not-sr-only
                  focus:fixed focus:top-4 focus:left-4 focus:z-9999
                  focus:px-6 focus:py-3
                  focus:bg-alecia-midnight focus:text-white
                  focus:rounded-lg focus:shadow-2xl
                  focus:outline-none focus:ring-4 focus:ring-gold-400 focus:ring-offset-2
                  transition-all duration-200
                  font-semibold text-base
                "
							aria-label={
								locale === "fr"
									? "Aller au contenu principal"
									: "Skip to main content"
							}
						>
							{locale === "fr"
								? "Aller au contenu principal"
								: "Skip to main content"}
						</a>
						<Navbar />
						<main id="main-content" tabIndex={-1} className="outline-none">
							{children}
						</main>
						<Footer />
						<MobileFooter />
						<CookieBanner />
						{/* <ExitIntentModal /> */}
						<Analytics />
						<SpeedInsights />
						{/* Plausible Analytics */}
						<Script
							defer
							data-domain="alecia.fr"
							src="https://analytics.alecia.fr/js/script.js"
							strategy="afterInteractive"
						/>
					</Providers>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
