"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function IntegrationsError({
	error: _error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 p-6">
			<div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
				<AlertTriangle className="h-8 w-8 text-destructive" />
			</div>
			<h2 className="text-xl font-semibold">Erreur de chargement</h2>
			<p className="text-center text-muted-foreground max-w-md">
				Impossible de charger la page des intégrations. Veuillez réessayer.
			</p>
			<Button onClick={reset} variant="outline">
				<RefreshCw className="mr-2 h-4 w-4" />
				Réessayer
			</Button>
		</div>
	);
}
