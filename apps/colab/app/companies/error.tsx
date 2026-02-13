"use client";

import { RouteError } from "@/components/errors/RouteError";

export default function CompaniesError({
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
			title="Erreur des entreprises"
			description="Une erreur s'est produite lors du chargement des entreprises."
		/>
	);
}
