/**
 * Admin Skeleton Components
 *
 * Provides consistent loading skeleton UI for admin pages.
 * Uses pulse animation to indicate loading state.
 */

// Stat Card Skeleton
export function StatCardSkeleton() {
	return (
		<div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
			<div className="flex items-center justify-between mb-4">
				<div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
				<div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
			</div>
			<div className="h-10 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700 mb-3" />
			<div className="h-3 w-32 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
		</div>
	);
}

// Dashboard Skeleton
export function DashboardSkeleton() {
	return (
		<div className="p-6 space-y-8">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
				<div className="h-10 w-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
			</div>

			{/* Stats Grid */}
			<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
				{[...Array(4)].map((_, i) => (
					<StatCardSkeleton key={i} />
				))}
			</div>

			{/* Two Column Layout */}
			<div className="grid gap-6 lg:grid-cols-2">
				<div className="h-72 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
				<div className="h-72 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
			</div>
		</div>
	);
}

// Kanban Column Skeleton
export function KanbanColumnSkeleton() {
	return (
		<div className="flex-shrink-0 w-80 rounded-xl bg-gray-100 dark:bg-gray-800 p-4">
			<div className="flex items-center justify-between mb-4">
				<div className="h-5 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
				<div className="h-6 w-6 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
			</div>
			<div className="space-y-3">
				{[...Array(3)].map((_, i) => (
					<div
						key={i}
						className="h-24 animate-pulse rounded-lg bg-white dark:bg-gray-900"
					/>
				))}
			</div>
		</div>
	);
}

// Deals/Pipeline Skeleton
export function DealsSkeleton() {
	return (
		<div className="p-6 space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="h-8 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
				<div className="h-10 w-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
			</div>

			{/* Kanban Board */}
			<div className="flex gap-4 overflow-x-auto pb-4">
				{[...Array(5)].map((_, i) => (
					<KanbanColumnSkeleton key={i} />
				))}
			</div>
		</div>
	);
}

// Table Row Skeleton
export function TableRowSkeleton() {
	return (
		<div className="flex items-center gap-4 p-4 border-b border-gray-100 dark:border-gray-800">
			<div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
			<div className="flex-1 space-y-2">
				<div className="h-4 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
				<div className="h-3 w-32 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
			</div>
			<div className="h-6 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
		</div>
	);
}

// CRM Skeleton
export function CRMSkeleton() {
	return (
		<div className="p-6 space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="h-8 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
				<div className="flex gap-3">
					<div className="h-10 w-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
					<div className="h-10 w-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
				</div>
			</div>

			{/* Stats */}
			<div className="grid gap-4 sm:grid-cols-3">
				{[...Array(3)].map((_, i) => (
					<StatCardSkeleton key={i} />
				))}
			</div>

			{/* Table */}
			<div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
				{[...Array(5)].map((_, i) => (
					<TableRowSkeleton key={i} />
				))}
			</div>
		</div>
	);
}

// Documents Skeleton
export function DocumentsSkeleton() {
	return (
		<div className="p-6 space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="h-8 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
				<div className="h-10 w-40 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
			</div>

			{/* Breadcrumb */}
			<div className="h-4 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />

			{/* Grid */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{[...Array(8)].map((_, i) => (
					<div
						key={i}
						className="h-40 animate-pulse rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
					/>
				))}
			</div>
		</div>
	);
}

// Settings Skeleton
export function SettingsSkeleton() {
	return (
		<div className="p-6 space-y-6">
			{/* Header */}
			<div className="h-8 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />

			{/* Settings Sections */}
			<div className="space-y-6">
				{[...Array(4)].map((_, i) => (
					<div
						key={i}
						className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
					>
						<div className="h-5 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700 mb-4" />
						<div className="space-y-3">
							<div className="h-10 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
							<div className="h-10 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

// Colab/Iframe Skeleton
export function ColabSkeleton() {
	return (
		<div className="p-6 space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="h-8 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
				<div className="h-10 w-48 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
			</div>

			{/* Iframe placeholder */}
			<div className="h-[calc(100vh-200px)] animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
				<div className="text-center">
					<div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-[var(--alecia-midnight)]" />
					<div className="mt-4 h-4 w-40 mx-auto animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
				</div>
			</div>
		</div>
	);
}

// Generic Admin Skeleton
export function AdminSkeleton() {
	return (
		<div className="p-6 space-y-6">
			<div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{[...Array(6)].map((_, i) => (
					<div
						key={i}
						className="h-40 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"
					/>
				))}
			</div>
		</div>
	);
}
