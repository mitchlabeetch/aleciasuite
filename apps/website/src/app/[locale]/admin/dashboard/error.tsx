"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// Log the error to an error reporting service
		console.error("Dashboard error:", error);
	}, [error]);

	return (
		<div className="flex flex-col items-center justify-center min-h-[400px] p-6">
			<div className="text-center space-y-4 max-w-md">
				<div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
					<AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
				</div>
				<h2 className="text-2xl font-bold text-[var(--alecia-midnight)] dark:text-white">
					Erreur de chargement
				</h2>
				<p className="text-muted-foreground">
					Une erreur s&apos;est produite lors du chargement du tableau de bord.
				</p>
				{error.message && (
					<p className="text-sm text-red-600 dark:text-red-400 font-mono bg-red-50 dark:bg-red-900/20 p-3 rounded">
						{error.message}
					</p>
				)}
				<div className="flex gap-3 justify-center">
					<Button onClick={reset} variant="default">
						Réessayer
					</Button>
					<Button
						onClick={() => {
							window.location.href = "/admin";
						}}
						variant="outline"
					>
						Retour à l&apos;accueil
					</Button>
				</div>
			</div>
		</div>
	);
}
