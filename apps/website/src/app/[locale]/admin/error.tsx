"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";
import Link from "next/link";
import { createLogger } from "@/lib/logger";

const log = createLogger("AdminError");

/**
 * Admin Error Boundary
 *
 * Catches errors in admin routes and displays a user-friendly error page
 * with options to retry or navigate to safety.
 */
export default function AdminError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// Log the error for debugging (production-safe)
		log.error("Error caught:", error);

		// Note: Sentry integration planned for Batch 11
	}, [error]);

	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center p-6">
			<div className="w-full max-w-md">
				{/* Error Icon */}
				<div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
					<AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
				</div>

				{/* Title */}
				<h2 className="mb-2 text-center text-2xl font-bold text-foreground">
					Une erreur est survenue
				</h2>

				{/* Message */}
				<p className="mb-6 text-center text-muted-foreground">
					{error.message ||
						"Une erreur inattendue s'est produite dans le panel admin."}
				</p>

				{/* Error Details (Development only) */}
				{process.env.NODE_ENV === "development" && (
					<details className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
						<summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-red-700 dark:text-red-400">
							<Bug className="h-4 w-4" />
							Détails techniques
						</summary>
						<pre className="mt-3 overflow-auto whitespace-pre-wrap text-xs text-red-600 dark:text-red-300">
							{error.stack || error.message}
						</pre>
						{error.digest && (
							<p className="mt-2 text-xs text-red-500">
								Digest: {error.digest}
							</p>
						)}
					</details>
				)}

				{/* Actions */}
				<div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
					<button
						onClick={reset}
						className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--alecia-midnight)] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--alecia-corporate)]"
					>
						<RefreshCw className="h-4 w-4" />
						Réessayer
					</button>
					<Link
						href="/admin/dashboard"
						className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
					>
						<Home className="h-4 w-4" />
						Retour au Dashboard
					</Link>
				</div>
			</div>
		</div>
	);
}
