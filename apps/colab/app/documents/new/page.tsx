"use client";

import { Loader2 } from "lucide-react";
import dynamicImport from "next/dynamic";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NewDocumentContent = dynamicImport(() => import("./NewDocumentContent"), {
	ssr: false,
	loading: () => (
		<div className="flex h-screen items-center justify-center">
			<div className="flex flex-col items-center gap-4">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				<p className="text-sm text-muted-foreground">Création du document...</p>
			</div>
		</div>
	),
});

export default function NewDocumentPage() {
	return <NewDocumentContent />;
}
