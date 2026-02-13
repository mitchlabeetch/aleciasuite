"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DealFlipCard } from "@/components/features/DealFlipCard";
import { useDealFilter } from "@/hooks/useDealFilter";
import { OperationsFilter } from "@/components/features/OperationsFilter";
import { useTranslations } from "next-intl";
import type { Transaction } from "@/lib/types";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getHDLogoUrl } from "@/lib/hd-logos";

interface OperationsContentProps {
	initialDeals: Transaction[];
}

// Card animation variants
const cardVariants = {
	hidden: {
		opacity: 0,
		scale: 0.85,
		y: 30,
	},
	visible: (i: number) => ({
		opacity: 1,
		scale: 1,
		y: 0,
		transition: {
			delay: i * 0.06,
			type: "spring" as const,
			stiffness: 260,
			damping: 20,
		},
	}),
	exit: {
		opacity: 0,
		scale: 0.9,
		transition: {
			duration: 0.15,
			ease: "easeOut" as const,
		},
	},
} as const;

export function OperationsContent({ initialDeals }: OperationsContentProps) {
	const t = useTranslations("OperationsPage");
	const {
		selectedSector,
		setSelectedSector,
		selectedType,
		setSelectedType,
		selectedRegion,
		setSelectedRegion,
		filteredDeals,
		sectors,
		types,
		regions,
	} = useDealFilter(initialDeals);

	// Search state
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

	// Debounce search query
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchQuery(searchQuery);
		}, 300);

		return () => clearTimeout(timer);
	}, [searchQuery]);

	// State to manage which card is flipped (mutex behavior)
	const [flippedCardId, setFlippedCardId] = useState<string | null>(null);

	// State to control when layout animation should happen
	const [isAnimating, setIsAnimating] = useState(false);
	const prevFilteredDealsRef = useRef<string[]>(
		filteredDeals.map((d) => d._id),
	);

	// Update displayed deals with animation sequencing
	useEffect(() => {
		const currentIds = filteredDeals.map((d) => d._id);
		const prevIds = prevFilteredDealsRef.current;

		// Check if deals changed
		const hasChanged =
			currentIds.length !== prevIds.length ||
			currentIds.some((id, i) => id !== prevIds[i]);

		if (hasChanged) {
			// Trigger animation
			setIsAnimating(true);

			// Reset animation flag after a short delay
			setTimeout(() => setIsAnimating(false), 300);
		}

		prevFilteredDealsRef.current = currentIds;
	}, [filteredDeals]);

	// Handle exit animation complete
	const handleExitComplete = () => {
		// Animation complete callback - not needed anymore
	};

	const handleFlip = (id: string) => {
		setFlippedCardId((prev) => (prev === id ? null : id));
	};

	// Listen for hashtag filter events from deal cards
	useEffect(() => {
		const handleFilterDeals = (event: CustomEvent) => {
			const { type, value } = event.detail;
			if (type === "sector") {
				setSelectedSector(value);
			} else if (type === "region") {
				setSelectedRegion(value);
			}
		};

		window.addEventListener("filterDeals", handleFilterDeals as EventListener);
		return () => {
			window.removeEventListener(
				"filterDeals",
				handleFilterDeals as EventListener,
			);
		};
	}, [setSelectedSector, setSelectedRegion]);

	// Reset all filters
	const handleResetFilters = () => {
		setSelectedSector("All");
		setSelectedType("All");
		setSelectedRegion("All");
		setSearchQuery("");
	};

	// Apply search filter on top of existing filters
	const searchFilteredDeals = debouncedSearchQuery
		? filteredDeals.filter((deal) => {
				const query = debouncedSearchQuery.toLowerCase();
				return (
					deal.clientName.toLowerCase().includes(query) ||
					deal.acquirerName?.toLowerCase().includes(query) ||
					deal.sector.toLowerCase().includes(query) ||
					deal.region?.toLowerCase().includes(query)
				);
			})
		: filteredDeals;

	// Apply HD logo mapping to deals - use white variant for dark card backgrounds
	const dealsWithHDLogos = useMemo(
		() =>
			searchFilteredDeals.map((deal) => ({
				...deal,
				clientLogo:
					getHDLogoUrl(deal.clientName, "white") || deal.clientLogo,
				acquirerLogo: deal.acquirerName
					? getHDLogoUrl(deal.acquirerName, "white") || deal.acquirerLogo
					: deal.acquirerLogo,
			})),
		[searchFilteredDeals],
	);

	// Use deals with HD logos applied
	const dealsToRender = dealsWithHDLogos;

	return (
		<>
			{/* Filters - Sticky only on desktop */}
			<section className="px-6 pb-8 md:sticky md:top-[65px] z-10 bg-[var(--background)]/95 backdrop-blur-sm py-4 border-b border-[var(--border)]">
				<div className="max-w-6xl mx-auto space-y-4">
					{/* Search Bar */}
					<div className="max-w-md mx-auto">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
							<Input
								type="text"
								placeholder="Rechercher par entreprise, secteur, région..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10 pr-10"
							/>
							{searchQuery && (
								<button
									type="button"
									onClick={() => setSearchQuery("")}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[var(--foreground)] transition-colors"
									aria-label="Effacer la recherche"
								>
									<X className="w-4 h-4" />
								</button>
							)}
						</div>
					</div>

					{/* Filters */}
					<div className="flex flex-col md:flex-row gap-6 justify-center items-center md:items-start">
						<OperationsFilter
							label={t("filters.sectors")}
							options={sectors}
							selected={selectedSector}
							onChange={setSelectedSector}
						/>
						<OperationsFilter
							label={t("filters.type")}
							options={types}
							selected={selectedType}
							onChange={setSelectedType}
						/>
						<OperationsFilter
							label={t("filters.regions")}
							options={regions}
							selected={selectedRegion}
							onChange={setSelectedRegion}
						/>
					</div>
				</div>
			</section>

			{/* Deal Grid with FlipCards */}
			<section className="py-8 px-6 pb-24">
				<div className="max-w-6xl mx-auto">
					{/* Warning text for prior experience indicator */}
					<p className="text-[var(--foreground-faint)] text-center mt-2 text-sm mb-8">
						{t("disclaimer")}
					</p>

					{/* Animated Grid - layout disabled during exit animation */}
					<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
						<AnimatePresence
							mode="popLayout"
							onExitComplete={handleExitComplete}
						>
							{dealsToRender.map((deal, index) => (
								<motion.div
									key={deal._id}
									className="aspect-square"
									variants={cardVariants}
									initial="hidden"
									animate="visible"
									exit="exit"
									custom={index}
									layout={!isAnimating}
								>
									<DealFlipCard
										id={deal._id}
										slug={deal.slug}
										clientName={deal.clientName}
										clientLogo={deal.clientLogo}
										acquirerName={deal.acquirerName}
										acquirerLogo={deal.acquirerLogo}
										sector={deal.sector}
										year={deal.year}
										mandateType={deal.mandateType}
										region={deal.region || ""}
										isPriorExperience={deal.isPriorExperience}
										isConfidential={deal.isConfidential}
										isClientConfidential={deal.isClientConfidential}
										isAcquirerConfidential={deal.isAcquirerConfidential}
										isFlipped={flippedCardId === deal._id}
										onFlip={() => handleFlip(deal._id)}
									/>
								</motion.div>
							))}
						</AnimatePresence>
					</div>

					{/* Empty State */}
					<AnimatePresence>
						{dealsToRender.length === 0 && !isAnimating && (
							<motion.div
								className="text-center py-20 px-6"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -20 }}
							>
								<div className="max-w-md mx-auto">
									<div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
										<svg
											className="w-8 h-8 text-[var(--accent)]"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											aria-hidden="true"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
											/>
										</svg>
									</div>
									<h3 className="text-xl font-semibold mb-2 text-[var(--foreground)]">
										{searchQuery
											? "Aucun résultat pour votre recherche"
											: t("empty")}
									</h3>
									<p className="text-muted-foreground mb-6">
										{searchQuery
											? "Essayez d&apos;utiliser des termes différents ou élargissez vos critères de recherche."
											: "Essayez d&apos;élargir vos critères de recherche pour voir plus de résultats."}
									</p>
									<button
										type="button"
										onClick={handleResetFilters}
										className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent)]/90 transition-colors"
									>
										<svg
											className="w-4 h-4"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											aria-hidden="true"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
											/>
										</svg>
										{t("reset")}
									</button>
								</div>
							</motion.div>
						)}
					</AnimatePresence>

					{/* Results count */}
					<motion.p
						className="text-center text-sm text-muted-foreground mt-12"
						key={dealsToRender.length}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.3 }}
					>
						{t("count", { count: dealsToRender.length })}
					</motion.p>
				</div>
			</section>
		</>
	);
}
