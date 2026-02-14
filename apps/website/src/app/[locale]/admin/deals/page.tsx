"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { DEFAULT_LOCALE } from "@/lib/constants";

/**
 * Deals Pipeline Page - Redirects to Colab
 *
 * The real deal pipeline is in the Colab app.
 * This page redirects to prevent duplication.
 */
export default function DealsPage() {
	const router = useRouter();
	const params = useParams();
	const locale = Array.isArray(params?.locale) ? params.locale[0] : (params?.locale || DEFAULT_LOCALE);

	useEffect(() => {
		// Redirect to Colab pipeline page
		router.replace(`/${locale}/admin/colab?view=pipeline`);
	}, [router, locale]);

	return (
		<div className="flex items-center justify-center min-h-screen">
			<div className="text-center">
				<p className="text-muted-foreground">Redirection vers Pipeline...</p>
			</div>
		</div>
	);
}
