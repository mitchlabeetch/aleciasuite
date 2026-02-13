"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Deals Pipeline Page - Redirects to Colab
 *
 * The real deal pipeline is in the Colab app.
 * This page redirects to prevent duplication.
 */
export default function DealsPage() {
	const router = useRouter();

	useEffect(() => {
		// Redirect to Colab pipeline page
		router.replace("/admin/colab?view=pipeline");
	}, [router]);

	return (
		<div className="flex items-center justify-center min-h-screen">
			<div className="text-center">
				<p className="text-muted-foreground">Redirection vers Pipeline...</p>
			</div>
		</div>
	);
}
