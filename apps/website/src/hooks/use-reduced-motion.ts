"use client";

/**
 * useReducedMotion - Respects user's motion preferences
 *
 * Returns true if the user has enabled "reduce motion" in their OS settings.
 * Use this to conditionally disable animations for accessibility.
 *
 * @see Batch 9: Accessibility Excellence
 * @see https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html
 */

import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function getInitialState(): boolean {
	if (typeof window === "undefined") return false;
	return window.matchMedia(QUERY).matches;
}

export function useReducedMotion(): boolean {
	const [reducedMotion, setReducedMotion] = useState(getInitialState);

	useEffect(() => {
		const mediaQuery = window.matchMedia(QUERY);
		setReducedMotion(mediaQuery.matches);

		const handler = (event: MediaQueryListEvent) => {
			setReducedMotion(event.matches);
		};

		mediaQuery.addEventListener("change", handler);
		return () => mediaQuery.removeEventListener("change", handler);
	}, []);

	return reducedMotion;
}
