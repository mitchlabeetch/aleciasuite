"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface Office {
	id: string;
	name: string;
	region: string;
	// Coordinates based on 1920x1920 reference image size
	baseCoords: { x: number; y: number };
}

// The 5 actual alecia offices - positions based on geographic accuracy
// Reference coordinates for 1920x1920 map PNG
const offices: Office[] = [
	{
		id: "lorient",
		name: "Lorient",
		region: "Bretagne",
		baseCoords: { x: 287, y: 697 },
	},
	{
		id: "paris",
		name: "Paris",
		region: "Île-de-France",
		baseCoords: { x: 935, y: 521 },
	},
	{
		id: "aix",
		name: "Aix-en-Provence",
		region: "Provence",
		baseCoords: { x: 1246, y: 1348 },
	},
	{
		id: "nice",
		name: "Nice",
		region: "Côte d'Azur",
		baseCoords: { x: 1494, y: 1338 },
	},
	{
		id: "annecy",
		name: "Annecy",
		region: "Rhône-Alpes",
		baseCoords: { x: 1350, y: 1015 },
	},
];

// Reference size of the original PNG image
const REFERENCE_SIZE = 1920;

export const InteractiveMap = memo(function InteractiveMap() {
	const t = useTranslations("InteractiveMap");
	const [activeOffice, setActiveOffice] = useState<string | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [containerSize, setContainerSize] = useState(0);

	// Track the container size (since it's 1:1 aspect ratio, width = height)
	const updateContainerSize = useCallback(() => {
		if (containerRef.current) {
			const rect = containerRef.current.getBoundingClientRect();
			// Container is aspect-square, so we just need one dimension
			setContainerSize(rect.width);
		}
	}, []);

	// Update dimensions on mount and resize with debouncing
	useEffect(() => {
		updateContainerSize();

		let resizeTimeout: NodeJS.Timeout;
		const debouncedUpdate = () => {
			clearTimeout(resizeTimeout);
			resizeTimeout = setTimeout(updateContainerSize, 150);
		};

		const resizeObserver = new ResizeObserver(debouncedUpdate);

		if (containerRef.current) {
			resizeObserver.observe(containerRef.current);
		}

		window.addEventListener("resize", debouncedUpdate);

		return () => {
			clearTimeout(resizeTimeout);
			resizeObserver.disconnect();
			window.removeEventListener("resize", debouncedUpdate);
		};
	}, [updateContainerSize]);

	// Calculate scaled position using simple percentage-based positioning
	// Since container is 1:1 and image fills it completely, just scale proportionally
	const getScaledPosition = useCallback(
		(office: Office) => {
			if (containerSize === 0) {
				return { x: 0, y: 0 };
			}

			// Simple proportional scaling: (baseCoord / 1920) * currentSize
			const scale = containerSize / REFERENCE_SIZE;

			return {
				x: office.baseCoords.x * scale,
				y: office.baseCoords.y * scale,
			};
		},
		[containerSize],
	);

	return (
		<section className="py-16 bg-gradient-to-b from-white to-slate-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					className="text-center mb-8"
				>
					<h2 className="font-playfair text-4xl md:text-5xl font-semibold mb-4 text-gradient-alecia">
						{t("title")}
					</h2>
					<p className="text-lg text-slate-600 max-w-2xl mx-auto">
						{t("subtitle")}
					</p>
				</motion.div>

				{/* Desktop: Map Center + Cards Right | Mobile: Map then Cards Below */}
				<div className="flex flex-col lg:flex-row lg:items-center lg:justify-center gap-8 lg:gap-12">
					{/* France Map Container - 1:1 aspect ratio to match 1920x1920 PNG */}
					<div className="flex-shrink-0 w-full lg:w-5/12 lg:max-w-xl">
						<div
							ref={containerRef}
							className="relative aspect-square w-full mx-auto"
						>
							{/* France Map PNG Image */}
							<Image
								src="/assets/france-map-solid.png"
								alt="Carte de France - Bureaux Alecia"
								fill
								className="object-contain"
								priority
								sizes="(max-width: 768px) 100vw, 50vw"
							/>

							{/* Pins with dynamic responsive positioning */}
							{offices.map((office, index) => {
								const position = getScaledPosition(office);

								// Don't render pins until dimensions are calculated
								if (position.x === 0 && position.y === 0) return null;

								return (
									<motion.button
										key={office.id}
										initial={{ scale: 0, opacity: 0 }}
										animate={{ scale: 1, opacity: 1 }}
										transition={{
											delay: 0.2 + index * 0.05,
											type: "spring",
											duration: 0.4,
										}}
										style={{
											position: "absolute",
											left: `${position.x}px`,
											top: `${position.y}px`,
											transform: "translate(-50%, -50%)",
										}}
										className="group z-10"
										onMouseEnter={() => setActiveOffice(office.id)}
										onMouseLeave={() => setActiveOffice(null)}
										onClick={() =>
											setActiveOffice(
												activeOffice === office.id ? null : office.id,
											)
										}
										aria-label={`Bureau ${office.name}`}
									>
										<div
											className={`relative flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300 cursor-pointer ${
												activeOffice === office.id
													? "bg-emerald-500 shadow-lg scale-125"
													: "bg-[#061A40] hover:bg-emerald-500 hover:scale-110"
											}`}
										>
											<MapPin className="w-3 h-3 text-white" />
											<span
												className={`absolute inset-0 rounded-full animate-ping ${
													activeOffice === office.id
														? "bg-emerald-400/50"
														: "bg-[#061A40]/30"
												}`}
											/>
										</div>
									</motion.button>
								);
							})}
						</div>
					</div>

					{/* Office Cards - Right of map on desktop, below on mobile */}
					<div className="flex-shrink-0 w-full lg:w-5/12 lg:max-w-sm">
						<div className="flex flex-col gap-2.5">
							{offices.map((office, index) => (
								<motion.button
									key={office.id}
									initial={{ opacity: 0, x: 20 }}
									whileInView={{ opacity: 1, x: 0 }}
									viewport={{ once: true }}
									transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
									onMouseEnter={() => setActiveOffice(office.id)}
									onMouseLeave={() => setActiveOffice(null)}
									onClick={() =>
										setActiveOffice(
											activeOffice === office.id ? null : office.id,
										)
									}
									className={`relative p-3 rounded-lg border-2 transition-all duration-300 text-left ${
										activeOffice === office.id
											? "border-emerald-500 bg-emerald-50 shadow-lg scale-105"
											: "border-slate-200 bg-white hover:border-[#061A40] hover:shadow-md"
									}`}
								>
									<div className="flex items-center gap-3">
										<div
											className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
												activeOffice === office.id
													? "bg-emerald-500"
													: "bg-[#061A40]"
											}`}
										>
											<MapPin className="w-4 h-4 text-white" />
										</div>
										<div className="flex-grow">
											<h3
												className={`font-semibold text-base transition-colors ${
													activeOffice === office.id
														? "text-emerald-700"
														: "text-[#061A40]"
												}`}
											>
												{office.name}
											</h3>
											<p className="text-xs text-slate-600">{office.region}</p>
										</div>
									</div>
								</motion.button>
							))}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
});
