import { Card, CardContent, CardHeader } from "@/components/tailwind/ui/card";
import { Skeleton } from "@/components/tailwind/ui/skeleton";

export function DashboardSkeleton() {
	return (
		<div className="space-y-8">
			{/* Welcome skeleton */}
			<div className="space-y-2">
				<Skeleton className="h-10 w-64" />
				<Skeleton className="h-5 w-96" />
			</div>

			{/* Stats grid skeleton */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Card key={i}>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-4" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-16 mb-1" />
							<Skeleton className="h-3 w-32" />
						</CardContent>
					</Card>
				))}
			</div>

			{/* Content grid skeleton */}
			<div className="grid gap-6 lg:grid-cols-3">
				<Card className="lg:col-span-2">
					<CardHeader>
						<Skeleton className="h-6 w-40" />
					</CardHeader>
					<CardContent className="space-y-4">
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i} className="flex items-start gap-3">
								<Skeleton className="h-10 w-10 rounded" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-4 w-3/4" />
									<Skeleton className="h-3 w-1/2" />
								</div>
							</div>
						))}
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-32" />
					</CardHeader>
					<CardContent className="space-y-3">
						{Array.from({ length: 5 }).map((_, i) => (
							<div key={i} className="flex items-center gap-3">
								<Skeleton className="h-8 w-8 rounded-full" />
								<div className="flex-1 space-y-1">
									<Skeleton className="h-3 w-full" />
									<Skeleton className="h-2 w-16" />
								</div>
							</div>
						))}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

export function DocumentListSkeleton({ count = 5 }: { count?: number }) {
	return (
		<div className="space-y-2">
			{Array.from({ length: count }).map((_, i) => (
				<div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
					<Skeleton className="h-10 w-10 rounded" />
					<div className="flex-1 space-y-2">
						<Skeleton className="h-4 w-3/4" />
						<Skeleton className="h-3 w-1/4" />
					</div>
					<Skeleton className="h-8 w-8" />
				</div>
			))}
		</div>
	);
}

export function SidebarSkeleton() {
	return (
		<div className="p-4 space-y-6">
			<Skeleton className="h-10 w-full" />
			<div className="space-y-2">
				{Array.from({ length: 5 }).map((_, i) => (
					<Skeleton key={i} className="h-9 w-full" />
				))}
			</div>
			<Skeleton className="h-px w-full" />
			<div className="space-y-2">
				<Skeleton className="h-4 w-24" />
				{Array.from({ length: 3 }).map((_, i) => (
					<Skeleton key={i} className="h-8 w-full" />
				))}
			</div>
		</div>
	);
}
