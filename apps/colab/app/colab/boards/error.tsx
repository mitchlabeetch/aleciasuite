"use client";

import { RouteError } from "@/components/errors/RouteError";

export default function BoardsError({
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
			title="Erreur des tableaux Kanban"
			description="Une erreur s'est produite lors du chargement des tableaux."
		/>
	);
}
