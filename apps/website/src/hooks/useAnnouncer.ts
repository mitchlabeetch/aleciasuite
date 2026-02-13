/**
 * useAnnouncer Hook
 *
 * WCAG 2.1 AA Compliance: 4.1.3 Status Messages
 * Provides live region announcements for screen readers
 * Useful for dynamic content updates, form validation, loading states
 *
 * Usage:
 * const announce = useAnnouncer();
 * announce('Form submitted successfully', 'polite');
 */

"use client";

import { useCallback, useEffect, useRef } from "react";

type AriaLive = "polite" | "assertive" | "off";

export function useAnnouncer() {
	const announcerRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		// Create announcer element if it doesn't exist
		if (!announcerRef.current) {
			const announcer = document.createElement("div");
			announcer.setAttribute("role", "status");
			announcer.setAttribute("aria-live", "polite");
			announcer.setAttribute("aria-atomic", "true");
			announcer.className = "sr-only";
			document.body.appendChild(announcer);
			announcerRef.current = announcer;
		}

		// Cleanup on unmount
		return () => {
			if (
				announcerRef.current &&
				document.body.contains(announcerRef.current)
			) {
				document.body.removeChild(announcerRef.current);
				announcerRef.current = null;
			}
		};
	}, []);

	const announce = useCallback(
		(message: string, priority: AriaLive = "polite") => {
			if (!announcerRef.current) return;

			// Clear previous message
			announcerRef.current.textContent = "";

			// Update aria-live attribute
			announcerRef.current.setAttribute("aria-live", priority);

			// Set new message after a brief delay to ensure screen readers pick it up
			setTimeout(() => {
				if (announcerRef.current) {
					announcerRef.current.textContent = message;
				}
			}, 100);
		},
		[],
	);

	return announce;
}
