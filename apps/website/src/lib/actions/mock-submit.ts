"use server";

import { createLogger } from "@/lib/logger";

const log = createLogger("FormSubmit");

/**
 * Mock form submission for development/demo purposes.
 * Accepts any form data structure and simulates a successful submission.
 */
export async function submitMockForm(data: Record<string, unknown>) {
	// Simulate network delay
	await new Promise((resolve) => setTimeout(resolve, 1000));

	// Log submission in development only
	log.debug("Form submitted:", data);
	return { success: true, message: "Demande envoyée avec succès" };
}
