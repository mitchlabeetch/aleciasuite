"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, ExternalLink, Home } from "lucide-react";
import Link from "next/link";
import { createLogger } from "@/lib/logger";

const log = createLogger("ColabError");

/**
 * Colab-specific error boundary
 *
 * Handles iframe loading errors and provides fallback options
 */
export default function ColabError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		log.error("Colab iframe error:", error);
	}, [error]);

	const colabUrl =
		process.env.NEXT_PUBLIC_COLAB_APP_URL || "https://colab.alecia.markets";

	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center p-6">
			<div className="w-full max-w-md text-center">
				{/* Error Icon */}
				<div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
					<AlertTriangle className="h-10 w-10 text-orange-600 dark:text-orange-400" />
				</div>

				{/* Title */}
				<h2 className="mb-2 text-2xl font-bold text-foreground">
					Alecia Colab indisponible
				</h2>

				{/* Message */}
				<p className="mb-6 text-muted-foreground">
					L&apos;application Colab n&apos;a pas pu être chargée. Vous pouvez
					réessayer ou l&apos;ouvrir directement.
				</p>

				{/* Actions */}
				<div className="flex flex-col gap-3">
					<button
						onClick={reset}
						className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--alecia-midnight)] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--alecia-corporate)]"
					>
						<RefreshCw className="h-4 w-4" />
						Réessayer
					</button>
					<a
						href={colabUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
					>
						<ExternalLink className="h-4 w-4" />
						Ouvrir Colab dans un nouvel onglet
					</a>
					<Link
						href="/admin/dashboard"
						className="inline-flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
					>
						<Home className="h-4 w-4" />
						Retour au Dashboard
					</Link>
				</div>
			</div>
		</div>
	);
}
