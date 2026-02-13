import { Skeleton } from "@/components/ui/skeleton";

export default function OperationsLoading() {
	const skeletonId = `operations-${Date.now()}`;
	return (
		<main className="min-h-screen bg-[var(--background)] pt-24">
			{/* Header Skeleton */}
			<section className="py-4 px-6">
				<div className="max-w-6xl mx-auto">
					<Skeleton className="h-12 w-64 mx-auto mb-4" />
					<Skeleton className="h-6 w-96 mx-auto" />
				</div>
			</section>

			{/* Filters Skeleton */}
			<section className="px-6 pb-8 sticky top-[65px] z-10 bg-[var(--background)]/95 backdrop-blur-sm py-4 border-b border-[var(--border)]">
				<div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6 justify-center items-center md:items-start">
					<Skeleton className="h-10 w-40" />
					<Skeleton className="h-10 w-40" />
					<Skeleton className="h-10 w-40" />
				</div>
			</section>

			{/* Grid Skeleton */}
			<section className="py-8 px-6 pb-24">
				<div className="max-w-6xl mx-auto">
					<Skeleton className="h-4 w-64 mx-auto mb-8" />

					<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
						{Array.from({ length: 8 }).map((_, i) => (
							<div key={`${skeletonId}-${i}`} className="aspect-square">
								<Skeleton className="w-full h-full rounded-xl" />
							</div>
						))}
					</div>

					<Skeleton className="h-4 w-48 mx-auto mt-12" />
				</div>
			</section>
		</main>
	);
}
