"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/tailwind/ui/skeleton";
import dynamicImport from "next/dynamic";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DocumentsContent = dynamicImport(() => import("./DocumentsContent"), {
	ssr: false,
	loading: () => {
		return (
			<AppShell>
				<div className="space-y-6">
					<Skeleton className="h-12 w-64" />
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{Array.from({ length: 6 }, (_, i) => (
							<Skeleton
								key={`doc-skeleton-${i.toString()}`}
								className="h-48 w-full"
							/>
						))}
					</div>
				</div>
			</AppShell>
		);
	},
});

export default function DocumentsPage() {
	return <DocumentsContent />;
}
