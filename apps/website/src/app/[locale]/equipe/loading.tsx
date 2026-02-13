import { Skeleton } from "@/components/ui/skeleton";

export default function TeamLoading() {
	return (
		<main className="min-h-screen bg-background pt-24">
			{/* Header Skeleton */}
			<section className="py-16 px-6">
				<div className="max-w-6xl mx-auto text-center">
					<Skeleton className="h-12 w-64 mx-auto mb-8" />
					<Skeleton className="h-6 w-96 mx-auto" />
				</div>
			</section>

			{/* Team Grid Skeleton */}
			<section className="py-8 px-6 pb-24">
				<div className="max-w-6xl mx-auto">
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
						{Array.from({ length: 8 }).map((_, i) => (
							<div key={`team-skeleton-${i}`} className="space-y-3">
								<Skeleton className="aspect-square w-full rounded-xl" />
								<Skeleton className="h-5 w-3/4 mx-auto" />
								<Skeleton className="h-4 w-1/2 mx-auto" />
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Hiring CTA Skeleton */}
			<section className="py-16 px-6 bg-secondary">
				<div className="max-w-4xl mx-auto text-center">
					<Skeleton className="h-10 w-48 mx-auto mb-4" />
					<Skeleton className="h-5 w-64 mx-auto mb-6" />
					<Skeleton className="h-6 w-40 mx-auto" />
				</div>
			</section>
		</main>
	);
}
