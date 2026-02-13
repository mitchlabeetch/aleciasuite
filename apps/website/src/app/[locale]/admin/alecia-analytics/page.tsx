import { Suspense } from "react";
import { getAnalyticsSummary, type AnalyticsSummary } from "@/lib/analytics";
import { AnalyticsDashboard } from "./AnalyticsDashboard";

/**
 * Alecia Analytics Page
 *
 * Server component that fetches analytics data with 1-hour caching
 * and renders the dashboard.
 */

// Force dynamic rendering to allow server-side caching
export const dynamic = "force-dynamic";

// Revalidate every hour
export const revalidate = 3600;

async function AnalyticsData() {
	let data: AnalyticsSummary;

	try {
		data = await getAnalyticsSummary(30); // Last 30 days
	} catch (error) {
		console.error("Failed to fetch analytics:", error);
		// Return empty data on error
		data = {
			visitors: 0,
			pageViews: 0,
			bounceRate: 0,
			topPages: [],
			countries: [],
			devices: { desktop: 0, mobile: 0, tablet: 0 },
			operatingSystems: [],
			referrers: [],
			dailyData: [],
		};
	}

	return <AnalyticsDashboard data={data} />;
}

function AnalyticsSkeleton() {
	return (
		<div className="p-6 space-y-8 animate-pulse">
			{/* Header skeleton */}
			<div>
				<div className="h-8 w-64 bg-muted rounded" />
				<div className="h-4 w-96 bg-muted rounded mt-2" />
			</div>

			{/* Stats grid skeleton */}
			<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
				{[...Array(4)].map((_, i) => (
					<div
						key={`stat-${i}`}
						className="rounded-2xl border border-border bg-card p-6 h-36"
					>
						<div className="h-4 w-24 bg-muted rounded mb-4" />
						<div className="h-10 w-20 bg-muted rounded" />
					</div>
				))}
			</div>

			{/* Chart skeleton */}
			<div className="rounded-2xl border border-border bg-card p-6 h-80">
				<div className="h-4 w-32 bg-muted rounded mb-6" />
				<div className="h-60 bg-muted rounded" />
			</div>

			{/* Tables skeleton */}
			<div className="grid gap-6 lg:grid-cols-2">
				{[...Array(2)].map((_, i) => (
					<div
						key={`table-${i}`}
						className="rounded-2xl border border-border bg-card p-6 h-64"
					>
						<div className="h-4 w-32 bg-muted rounded mb-4" />
						<div className="space-y-3">
							{[...Array(5)].map((_, j) => (
								<div key={`row-${i}-${j}`} className="h-8 bg-muted rounded" />
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

export default function AleciAnalyticsPage() {
	return (
		<Suspense fallback={<AnalyticsSkeleton />}>
			<AnalyticsData />
		</Suspense>
	);
}
