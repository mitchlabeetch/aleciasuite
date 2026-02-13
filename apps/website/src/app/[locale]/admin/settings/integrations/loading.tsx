import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function IntegrationsLoading() {
	return (
		<div className="space-y-8 p-6">
			{/* Header */}
			<div className="space-y-2">
				<Skeleton className="h-9 w-48" />
				<Skeleton className="h-5 w-96" />
			</div>

			{/* Integration Cards */}
			<div className="grid gap-6 md:grid-cols-2">
				{[1, 2].map((i) => (
					<Card key={i} className="border-2">
						<CardHeader className="pb-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<Skeleton className="h-12 w-12 rounded-lg" />
									<div className="space-y-2">
										<Skeleton className="h-5 w-32" />
										<Skeleton className="h-4 w-48" />
									</div>
								</div>
								<Skeleton className="h-6 w-24" />
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-px w-full" />
							<div className="space-y-3">
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
