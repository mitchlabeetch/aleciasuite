"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { DEFAULT_LOCALE } from "@/lib/constants";

/**
 * Documents Management Page - Redirects to Colab
 *
 * The real documents feature is in the Colab app.
 * This page redirects to prevent duplication.
 */
export default function DocumentsPage() {
	const router = useRouter();
	const params = useParams();
	const locale = params?.locale || DEFAULT_LOCALE;

	useEffect(() => {
		// Redirect to Colab documents page
		router.replace(`/${locale}/admin/colab?view=documents`);
	}, [router, locale]);

	return (
		<div className="flex items-center justify-center min-h-screen">
			<div className="text-center">
				<p className="text-muted-foreground">Redirection vers Documents...</p>
			</div>
		</div>
	);
}
