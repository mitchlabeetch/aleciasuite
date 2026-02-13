"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Documents Management Page - Redirects to Colab
 *
 * The real documents feature is in the Colab app.
 * This page redirects to prevent duplication.
 */
export default function DocumentsPage() {
	const router = useRouter();

	useEffect(() => {
		// Redirect to Colab documents page
		router.replace("/admin/colab?view=documents");
	}, [router]);

	return (
		<div className="flex items-center justify-center min-h-screen">
			<div className="text-center">
				<p className="text-muted-foreground">Redirection vers Documents...</p>
			</div>
		</div>
	);
}
