"use client";

import { Skeleton } from "@/components/tailwind/ui/skeleton";
import dynamicImport from "next/dynamic";

// Force dynamic rendering to avoid SSG issues with Clerk
export const dynamic = "force-dynamic";

// Dynamically import Dashboard to avoid SSR issues with Clerk hooks
const Dashboard = dynamicImport(() => import("./Dashboard"), {
	ssr: false,
	loading: () => {
		const skeletonId = `dashboard-${Date.now()}`;
		return (
			<div className="container mx-auto p-6 space-y-6">
				<Skeleton className="h-32 w-full" />
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{[...Array(6)].map((_, i) => (
						<Skeleton key={`${skeletonId}-${i}`} className="h-48 w-full" />
					))}
				</div>
			</div>
		);
	},
});

export default function DashboardPage() {
	return <Dashboard />;
}
