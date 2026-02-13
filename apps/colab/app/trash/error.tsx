"use client";

import { RouteError } from "@/components/errors/RouteError";

export default function TrashError({
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
			title="Erreur de la corbeille"
			description="Une erreur s'est produite lors du chargement de la corbeille."
		/>
	);
}
