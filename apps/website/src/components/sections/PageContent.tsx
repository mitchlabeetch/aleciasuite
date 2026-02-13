"use client";

import { useState, useEffect } from "react";
import { getPublishedPageContent } from "@/actions";
import { useLocale } from "next-intl";
import { SectionRenderer } from "./SectionRenderer";
import type { Section } from "./types";
import { ReactNode } from "react";

interface PageContentProps {
	/**
	 * The page path (e.g., "/expertises", "/contact")
	 */
	path: string;

	/**
	 * Static fallback content to show if no database content exists
	 * This allows pages to have default content before any visual editor changes
	 */
	fallback?: ReactNode;

	/**
	 * Optional className for the container
	 */
	className?: string;

	/**
	 * Whether to show a loading skeleton while fetching
	 */
	showLoading?: boolean;
}

/**
 * PageContent - Fetches and renders page sections from the database
 *
 * This component connects pages to the visual editor system. It:
 * 1. Fetches published page content from the database
 * 2. Renders sections using the SectionRenderer
 * 3. Falls back to static content if no database content exists
 *
 * Usage:
 * ```tsx
 * <PageContent
 *   path="/expertises"
 *   fallback={<StaticExpertisesContent />}
 * />
 * ```
 */
export function PageContent({
	path,
	fallback,
	className = "",
	showLoading = false,
}: PageContentProps) {
	const locale = useLocale();

	const [pageContent, setPageContent] = useState<any>(undefined);

	useEffect(() => {
		getPublishedPageContent(path, locale).then((data) => {
			setPageContent(data);
		});
	}, [path, locale]);

	// Loading state
	if (pageContent === undefined) {
		if (showLoading) {
			return (
				<div className={`animate-pulse space-y-8 py-16 ${className}`}>
					<div className="max-w-4xl mx-auto px-4">
						<div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/2 mb-6" />
						<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-3" />
						<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-3" />
						<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
					</div>
				</div>
			);
		}
		// Return fallback immediately if not showing loading
		return <>{fallback}</>;
	}

	// No published content - show fallback
	if (pageContent === null) {
		return <>{fallback}</>;
	}

	// Render sections from database
	const sections = pageContent.sections as Section[];

	if (!sections || sections.length === 0) {
		return <>{fallback}</>;
	}

	return <SectionRenderer sections={sections} className={className} />;
}

/**
 * Hook to get page content for more complex use cases
 */
export function usePageContent(path: string) {
	const locale = useLocale();

	const [pageContent, setPageContent] = useState<any>(undefined);

	useEffect(() => {
		getPublishedPageContent(path, locale).then((data) => {
			setPageContent(data);
		});
	}, [path, locale]);

	return {
		isLoading: pageContent === undefined,
		hasContent: pageContent !== null && pageContent !== undefined,
		sections: (pageContent?.sections as Section[]) || [],
		version: pageContent?.version,
		publishedAt: pageContent?.publishedAt,
	};
}
