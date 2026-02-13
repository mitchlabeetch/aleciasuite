"use client";

import { RouteError } from "@/components/errors/RouteError";

export default function DashboardError({
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
			title="Erreur du tableau de bord"
			description="Une erreur s'est produite lors du chargement du tableau de bord."
		/>
	);
}
