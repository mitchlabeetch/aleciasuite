"use client";

import { RouteError } from "@/components/errors/RouteError";

export default function SettingsError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<RouteError
			error={error}
			reset={reset}
			title="Erreur des parametres"
			description="Une erreur s'est produite lors du chargement des parametres."
		/>
	);
}
