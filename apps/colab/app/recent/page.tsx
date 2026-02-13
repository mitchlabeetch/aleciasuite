"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/tailwind/ui/skeleton";
import { fr } from "@/lib/i18n";
import { Clock } from "lucide-react";
import dynamicImport from "next/dynamic";

// Prevent static generation
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Dynamically import RecentFiles to avoid SSR issues with Clerk
const RecentFiles = dynamicImport(
	() =>
		import("@/components/recent-files/RecentFiles").then((mod) => ({
			default: mod.RecentFiles,
		})),
	{
		ssr: false,
		loading: () => (
			<div className="space-y-4">
				{[...Array(5)].map((_, i) => (
					<Skeleton key={i} className="h-16 w-full" />
				))}
			</div>
		),
	},
);

export default function RecentPage() {
	return (
		<AppShell>
			<div className="space-y-6">
				<div className="flex items-center gap-2">
					<Clock className="h-8 w-8" />
					<div>
						<h1 className="text-3xl font-bold tracking-tight">
							{fr.nav.recent}
						</h1>
						<p className="text-muted-foreground">
							Vos documents récemment consultés
						</p>
					</div>
				</div>
				<RecentFiles limit={20} showCreateButton />
			</div>
		</AppShell>
	);
}
