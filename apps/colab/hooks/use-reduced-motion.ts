"use client";

/**
 * useReducedMotion - Respects user's motion preferences
 *
 * Returns true if the user has enabled "reduce motion" in their OS settings.
 * Use this to conditionally disable animations for accessibility.
 *
 * @see Batch 9: Accessibility Excellence - Task 9.2
 * @see https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html
 *
 * @example
 * ```tsx
 * const reducedMotion = useReducedMotion();
 *
 * <motion.div
 *   initial={reducedMotion ? false : { opacity: 0 }}
 *   animate={{ opacity: 1 }}
 *   transition={reducedMotion ? { duration: 0 } : { duration: 0.3 }}
 * />
 * ```
 */

import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

// Check SSR
function getInitialState(): boolean {
	if (typeof window === "undefined") return false;
	return window.matchMedia(QUERY).matches;
}

export function useReducedMotion(): boolean {
	const [reducedMotion, setReducedMotion] = useState(getInitialState);

	useEffect(() => {
		const mediaQuery = window.matchMedia(QUERY);

		// Set initial value (handles hydration mismatch)
		setReducedMotion(mediaQuery.matches);

		// Listen for changes
		const handler = (event: MediaQueryListEvent) => {
			setReducedMotion(event.matches);
		};

		mediaQuery.addEventListener("change", handler);
		return () => mediaQuery.removeEventListener("change", handler);
	}, []);

	return reducedMotion;
}

/**
 * Get motion props for Framer Motion based on reduced motion preference
 */
export function getMotionProps(reducedMotion: boolean) {
	if (reducedMotion) {
		return {
			initial: false,
			animate: undefined,
			exit: undefined,
			transition: { duration: 0 },
		};
	}
	return {};
}
