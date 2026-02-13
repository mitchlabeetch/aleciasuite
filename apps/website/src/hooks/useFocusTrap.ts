/**
 * useFocusTrap Hook
 *
 * WCAG 2.1 AA Compliance: 2.1.2 No Keyboard Trap
 * Traps keyboard focus within a container (for modals, dialogs)
 * Ensures users can navigate with Tab/Shift+Tab within the trapped area
 * Provides Escape key handler to exit the trap
 *
 * Usage:
 * const containerRef = useFocusTrap<HTMLDivElement>(isOpen, onClose);
 * <div ref={containerRef}>...</div>
 */

"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE_ELEMENTS = [
	"a[href]",
	"area[href]",
	'input:not([disabled]):not([type="hidden"])',
	"select:not([disabled])",
	"textarea:not([disabled])",
	"button:not([disabled])",
	"iframe",
	"object",
	"embed",
	"[contenteditable]",
	'[tabindex]:not([tabindex^="-"])',
];

export function useFocusTrap<T extends HTMLElement>(
	isActive: boolean,
	onEscape?: () => void,
) {
	const containerRef = useRef<T>(null);
	const previousActiveElement = useRef<HTMLElement | null>(null);

	useEffect(() => {
		if (!isActive || !containerRef.current) return;

		const container = containerRef.current;

		// Store the previously focused element
		previousActiveElement.current = document.activeElement as HTMLElement;

		// Get all focusable elements
		const getFocusableElements = (): HTMLElement[] => {
			return Array.from(
				container.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS.join(",")),
			).filter((el) => {
				// Additional check for visibility
				return (
					el.offsetWidth > 0 &&
					el.offsetHeight > 0 &&
					!el.hasAttribute("aria-hidden")
				);
			});
		};

		// Focus first element
		const focusableElements = getFocusableElements();
		if (focusableElements.length > 0) {
			focusableElements[0].focus();
		}

		// Handle keyboard events
		const handleKeyDown = (event: KeyboardEvent) => {
			// Handle Escape key
			if (event.key === "Escape" && onEscape) {
				onEscape();
				return;
			}

			// Handle Tab key
			if (event.key === "Tab") {
				const focusableElements = getFocusableElements();
				if (focusableElements.length === 0) return;

				const firstElement = focusableElements[0];
				const lastElement = focusableElements[focusableElements.length - 1];

				// Shift + Tab (backwards)
				if (event.shiftKey) {
					if (document.activeElement === firstElement) {
						event.preventDefault();
						lastElement.focus();
					}
				} else {
					// Tab (forwards)
					if (document.activeElement === lastElement) {
						event.preventDefault();
						firstElement.focus();
					}
				}
			}
		};

		// Attach event listener
		container.addEventListener("keydown", handleKeyDown);

		// Cleanup
		return () => {
			container.removeEventListener("keydown", handleKeyDown);

			// Restore focus to previously focused element
			if (
				previousActiveElement.current &&
				previousActiveElement.current.focus
			) {
				previousActiveElement.current.focus();
			}
		};
	}, [isActive, onEscape]);

	return containerRef;
}
