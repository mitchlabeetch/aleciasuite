"use client";

import { FileEdit, ExternalLink, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";

const COLAB_URL =
	process.env.NEXT_PUBLIC_ALECIA_COLAB_URL || "https://colab.alecia.markets";

/**
 * Colab Page
 *
 * Embeds the Alecia Colab application via iframe.
 * Colab is deployed separately on colab.alecia.markets
 */
export default function ColabPage() {
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		// Timeout for loading state
		const timeout = setTimeout(() => setIsLoading(false), 2000);
		return () => clearTimeout(timeout);
	}, []);

	const handleReload = () => {
		setIsLoading(true);
		setError(null);
		// Force iframe reload by updating key
		setTimeout(() => setIsLoading(false), 2000);
	};

	return (
		<div className="h-full flex flex-col">
			{/* Header */}
			<div className="px-6 py-4 border-b border-border bg-card flex items-center justify-between rounded-t-lg">
				<div className="flex items-center gap-3">
					<div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
						<FileEdit className="w-5 h-5" />
					</div>
					<div>
						<h1 className="font-semibold text-[var(--alecia-midnight)] dark:text-white">
							Alecia Colab
						</h1>
						<p className="text-xs text-muted-foreground">Espace collaboratif</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={handleReload}
						className="p-2 rounded-lg hover:bg-muted transition-colors"
						title="Recharger"
					>
						<RefreshCw className="w-4 h-4 text-muted-foreground" />
					</button>
					<a
						href={COLAB_URL}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-2 px-3 py-1.5 text-sm bg-muted rounded-lg hover:bg-muted/80 transition-colors"
					>
						<ExternalLink className="w-4 h-4" />
						Ouvrir dans un nouvel onglet
					</a>
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 relative bg-muted/50 rounded-b-lg overflow-hidden">
				{/* Loading Skeleton */}
				{isLoading && (
					<div className="absolute inset-0 z-10 flex items-center justify-center bg-card">
						<div className="text-center space-y-4">
							<div className="w-12 h-12 border-4 border-[var(--alecia-mid-blue)] border-t-transparent rounded-full animate-spin mx-auto" />
							<p className="text-sm text-muted-foreground">
								Chargement de Colab...
							</p>
						</div>
					</div>
				)}

				{/* Error State */}
				{error && (
					<div className="absolute inset-0 z-10 flex items-center justify-center bg-card">
						<div className="text-center space-y-4 px-6">
							<div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 text-red-500 flex items-center justify-center mx-auto">
								<FileEdit className="w-8 h-8" />
							</div>
							<h3 className="text-lg font-semibold text-[var(--alecia-midnight)] dark:text-white">
								Impossible de charger Colab
							</h3>
							<p className="text-sm text-muted-foreground max-w-md">
								La connexion au sous-domaine colab.alecia.markets a échoué.
								Vérifiez votre connexion ou essayez d&apos;ouvrir dans un nouvel
								onglet.
							</p>
							<div className="flex items-center justify-center gap-3">
								<button
									type="button"
									onClick={handleReload}
									className="px-4 py-2 bg-[var(--alecia-midnight)] text-white rounded-lg hover:opacity-90"
								>
									Réessayer
								</button>
								<a
									href={COLAB_URL}
									target="_blank"
									rel="noopener noreferrer"
									className="px-4 py-2 border border-border rounded-lg hover:bg-muted"
								>
									Ouvrir externe
								</a>
							</div>
						</div>
					</div>
				)}

				{/* Iframe */}
				<iframe
					src={`${COLAB_URL}/dashboard?embedded=true`}
					className="w-full h-[calc(100vh-12rem)] border-0"
					title="Alecia Colab"
					allow="clipboard-write; clipboard-read"
					onLoad={() => setIsLoading(false)}
					onError={() => setError("Failed to load Colab")}
				/>
			</div>
		</div>
	);
}
