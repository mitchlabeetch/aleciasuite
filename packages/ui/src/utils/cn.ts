import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility for merging Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Check if we're in an embedded/iframe context
 */
export function isEmbedded(): boolean {
	if (typeof window === "undefined") return false;

	// Check URL parameters
	const params = new URLSearchParams(window.location.search);
	if (params.get("embed") === "true" || params.get("embedded") === "true") {
		return true;
	}

	// Check if in iframe
	try {
		return window.self !== window.top;
	} catch {
		return true; // If we can't access window.top, we're likely in a cross-origin iframe
	}
}

/**
 * Generate a unique ID for components
 */
export function generateId(prefix = "ui"): string {
	return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}
