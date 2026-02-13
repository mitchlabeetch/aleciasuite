import { cn } from "@/lib/utils";

/**
 * Skeleton components for loading states
 *
 * @see Batch 10: UI/UX Refinement - Task 10.5
 */

function Skeleton({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("animate-pulse rounded-md bg-muted", className)}
			{...props}
		/>
	);
}

/**
 * Skeleton for card components
 */
function SkeletonCard({ className }: { className?: string }) {
	return (
		<div
			className={cn("rounded-xl border border-border bg-card p-6", className)}
		>
			<div className="animate-pulse space-y-4">
				<Skeleton className="h-4 w-1/3" />
				<Skeleton className="h-3 w-full" />
				<Skeleton className="h-3 w-2/3" />
			</div>
		</div>
	);
}

/**
 * Skeleton for stat widgets
 */
function SkeletonStat({ className }: { className?: string }) {
	return (
		<div
			className={cn("rounded-xl border border-border bg-card p-6", className)}
		>
			<div className="animate-pulse">
				<div className="flex items-center justify-between mb-4">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-10 w-10 rounded-full" />
				</div>
				<Skeleton className="h-8 w-16 mb-2" />
				<Skeleton className="h-3 w-20" />
			</div>
		</div>
	);
}

/**
 * Skeleton for table rows
 */
function SkeletonTableRow({ columns = 4 }: { columns?: number }) {
	const rowId = `table-row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	return (
		<tr className="border-b border-border">
			{Array.from({ length: columns }).map((_, i) => (
				<td key={`${rowId}-${i}`} className="p-4">
					<Skeleton className="h-4 w-full" />
				</td>
			))}
		</tr>
	);
}

/**
 * Skeleton for a list item
 */
function SkeletonListItem({ className }: { className?: string }) {
	return (
		<div className={cn("flex items-center gap-3 p-3", className)}>
			<Skeleton className="h-10 w-10 rounded-full" />
			<div className="flex-1 space-y-2">
				<Skeleton className="h-4 w-3/4" />
				<Skeleton className="h-3 w-1/2" />
			</div>
		</div>
	);
}

/**
 * Full page skeleton grid
 */
function SkeletonGrid({
	count = 4,
	className,
}: {
	count?: number;
	className?: string;
}) {
	const gridId = `skeleton-grid-${Date.now()}`;
	return (
		<div className={cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-4", className)}>
			{Array.from({ length: count }).map((_, i) => (
				<SkeletonStat key={`${gridId}-${i}`} />
			))}
		</div>
	);
}

export {
	Skeleton,
	SkeletonCard,
	SkeletonStat,
	SkeletonTableRow,
	SkeletonListItem,
	SkeletonGrid,
};
