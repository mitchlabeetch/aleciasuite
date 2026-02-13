"use client";

import AdminError from "../error";

/**
 * Documents-specific error boundary
 */
export default function DocumentsError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	const contextualError = {
		...error,
		message: error.message || "Erreur lors du chargement des documents.",
	};

	return <AdminError error={contextualError} reset={reset} />;
}
