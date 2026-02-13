"use client";

import AdminError from "../error";

/**
 * Deals-specific error boundary
 */
export default function DealsError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	const contextualError = {
		...error,
		message: error.message || "Erreur lors du chargement du pipeline M&A.",
	};

	return <AdminError error={contextualError} reset={reset} />;
}
