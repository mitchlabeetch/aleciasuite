"use client";

import { Link } from "@/i18n/navigation";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { DealFlipCard } from "@/components/features/DealFlipCard";
import { useState, useCallback, memo } from "react";

interface TransactionsCarouselProps {
	deals: any[];
}

export const TransactionsCarousel = memo(function TransactionsCarousel({
	deals,
}: TransactionsCarouselProps) {
	const t = useTranslations("Transactions");
	const [flippedCardId, setFlippedCardId] = useState<string | null>(null);

	const handleFlip = useCallback((id: string) => {
		setFlippedCardId((prev) => (prev === id ? null : id));
	}, []);

	return (
		<section className="py-8 md:py-16 bg-background">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<Carousel
					opts={{
						align: "start",
						loop: true,
					}}
					className="w-full"
				>
					<div className="flex flex-col md:flex-row justify-between items-end mb-6 md:mb-12 gap-4 md:gap-6">
						<div className="max-w-xl">
							<h2 className="text-3xl md:text-4xl font-semibold mb-4 text-gradient-alecia">
								{t("carouselTitle")}
							</h2>
							<p className="text-muted-foreground text-lg">
								{t("carouselSubtitle")}
							</p>
						</div>
						<div className="flex items-center gap-6">
							<Link
								href="/operations"
								className="hidden md:inline-flex items-center text-alecia-corporate hover:text-alecia-midnight transition-colors font-medium border-b border-transparent hover:border-current"
							>
								{t("viewAll")} <ArrowRight className="ml-2 w-4 h-4" />
							</Link>

							<div className="hidden md:flex gap-2">
								<CarouselPrevious className="static translate-y-0 h-10 w-10 text-foreground border-border hover:bg-alecia-midnight hover:text-white transition-all shadow-sm" />
								<CarouselNext className="static translate-y-0 h-10 w-10 text-foreground border-border hover:bg-alecia-midnight hover:text-white transition-all shadow-sm" />
							</div>
						</div>
					</div>

					{/* Wrapper with padding to prevent shadow clipping */}
					<div className="relative px-1 py-8 -mx-1">
						<CarouselContent className="-ml-4 md:-ml-6">
							{deals.map((deal) => (
								<CarouselItem
									key={deal.id}
									className="pl-4 md:pl-6 md:basis-1/2 lg:basis-1/4"
								>
									<div className="aspect-square">
										<DealFlipCard
											id={deal.id}
											slug={deal.slug}
											clientName={deal.clientName}
											clientLogo={deal.clientLogo}
											acquirerName={deal.acquirerName}
											acquirerLogo={deal.acquirerLogo}
											sector={deal.sector}
											year={deal.year}
											mandateType={deal.mandateType}
											region={deal.region || ""}
											isFlipped={flippedCardId === deal.id}
											onFlip={() => handleFlip(deal.id)}
											disableFlip={false}
											noShadow={true}
										/>
									</div>
								</CarouselItem>
							))}
						</CarouselContent>
					</div>
				</Carousel>

				<div className="mt-8 text-center md:hidden">
					<Link
						href="/operations"
						className="inline-flex items-center text-accent hover:underline font-medium"
					>
						{t("viewAll")} <ArrowRight className="ml-2 w-4 h-4" />
					</Link>
				</div>
			</div>
		</section>
	);
});
