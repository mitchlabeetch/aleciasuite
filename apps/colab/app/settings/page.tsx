"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/tailwind/ui/skeleton";
import dynamicImport from "next/dynamic";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SettingsContent = dynamicImport(() => import("./SettingsContent"), {
	ssr: false,
	loading: () => {
		const skeletonId = `settings-${Date.now()}`;
		return (
			<AppShell>
				<div className="space-y-6">
					<Skeleton className="h-12 w-64" />
					<div className="space-y-4">
						{[...Array(4)].map((_, i) => (
							<Skeleton key={`${skeletonId}-${i}`} className="h-32 w-full" />
						))}
					</div>
				</div>
			</AppShell>
		);
	},
});

export default function SettingsPage() {
	return <SettingsContent />;
}
