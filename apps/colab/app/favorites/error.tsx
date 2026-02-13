"use client";

import { RouteError } from "@/components/errors/RouteError";

export default function FavoritesError({
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
			title="Erreur des favoris"
			description="Une erreur s'est produite lors du chargement de vos favoris."
		/>
	);
}
