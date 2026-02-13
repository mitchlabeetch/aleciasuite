"use client";

import AdminError from "../error";

/**
 * Settings-specific error boundary
 */
export default function SettingsError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	const contextualError = {
		...error,
		message: error.message || "Erreur lors du chargement des paramètres.",
	};

	return <AdminError error={contextualError} reset={reset} />;
}
