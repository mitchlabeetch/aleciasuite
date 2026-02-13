"use client";

import { RouteError } from "@/components/errors/RouteError";

export default function RecentError({
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
			title="Erreur des fichiers recents"
			description="Une erreur s'est produite lors du chargement des fichiers recents."
		/>
	);
}
