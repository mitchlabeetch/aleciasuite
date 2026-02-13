"use client";

import { motion } from "framer-motion";
import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Building2 } from "lucide-react";
import Image from "next/image";

// Coordinates based on 1920x1920 reference image size
// These match the InteractiveMap component exactly
const locations = [
	{
		name: "Lorient",
		region: "Bretagne",
		x: 287,
		y: 697,
		address: "Port de Lorient",
	},
	{
		name: "Paris (Siège)",
		region: "Île-de-France",
		x: 935,
		y: 521,
		address: "35 Bd Haussmann",
	},
	{
		name: "Aix-en-Provence",
		region: "Provence-Alpes-Côte d'Azur",
		x: 1246,
		y: 1348,
		address: "Cours Mirabeau",
	},
	{
		name: "Nice",
		region: "Provence-Alpes-Côte d'Azur",
		x: 1494,
		y: 1338,
		address: "Promenade des Anglais",
	},
	{
		name: "Annecy",
		region: "Auvergne-Rhône-Alpes",
		x: 1350,
		y: 1015,
		address: "Le lac",
	},
];

// Reference size of the original PNG image
const REFERENCE_SIZE = 1920;

export function RegionalMap() {
	const [hovered, setHovered] = useState<string | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [containerSize, setContainerSize] = useState(0);

	// Track container size (1:1 aspect ratio, so width = height)
	const updateContainerSize = useCallback(() => {
		if (containerRef.current) {
			const rect = containerRef.current.getBoundingClientRect();
			setContainerSize(rect.width);
		}
	}, []);

	useEffect(() => {
		updateContainerSize();

		const resizeObserver = new ResizeObserver(updateContainerSize);
		if (containerRef.current) {
			resizeObserver.observe(containerRef.current);
		}

		window.addEventListener("resize", updateContainerSize);

		return () => {
			resizeObserver.disconnect();
			window.removeEventListener("resize", updateContainerSize);
		};
	}, [updateContainerSize]);

	// Simple proportional scaling: (baseCoord / 1920) * currentSize
	const getScaledPosition = useCallback(
		(x: number, y: number) => {
			if (containerSize === 0) return { x: 0, y: 0 };

			const scale = containerSize / REFERENCE_SIZE;
			return {
				x: x * scale,
				y: y * scale,
			};
		},
		[containerSize],
	);

	return (
		<div className="w-full">
			{/* Responsive Layout: Side by side on large screens, stacked on small */}
			<div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
				{/* Map Section */}
				<div
					ref={containerRef}
					className="relative w-full max-w-2xl mx-auto lg:mx-0 aspect-square"
				>
					{/* France map image */}
					<Image
						src="/assets/france-map-solid.png"
						alt="Carte de France"
						fill
						className="object-contain"
						priority
					/>

					{/* Map pins positioned absolutely */}
					{locations.map((loc, index) => {
						const position = getScaledPosition(loc.x, loc.y);

						if (position.x === 0 && position.y === 0) return null;

						const isHovered = hovered === loc.name;

						return (
							<div
								key={loc.name}
								className="absolute cursor-pointer"
								style={{
									left: `${position.x}px`,
									top: `${position.y}px`,
									transform: "translate(-50%, -50%)",
								}}
								onMouseEnter={() => setHovered(loc.name)}
								onMouseLeave={() => setHovered(null)}
							>
								<motion.div
									initial={{ scale: 0 }}
									animate={{ scale: isHovered ? 1.2 : 1 }}
									transition={{
										type: "spring",
										stiffness: 260,
										damping: 20,
										delay: index * 0.1,
									}}
									className="relative"
								>
									{/* Pin circle */}
									<div
										className={`w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-colors ${
											isHovered
												? "bg-[var(--accent)] scale-110"
												: "bg-[#061a40]"
										}`}
									>
										<svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
											<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
										</svg>
									</div>
								</motion.div>

								{/* Tooltip - Now shows region instead of city */}
								<div
									className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-3 transition-opacity duration-200 pointer-events-none z-20 ${
										isHovered ? "opacity-100" : "opacity-0"
									}`}
								>
									<div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl p-3 rounded-lg text-center whitespace-nowrap">
										<p className="font-bold text-sm text-gray-900 dark:text-white">
											{loc.region}
										</p>
										<p className="text-xs text-gray-500 dark:text-gray-400">
											{loc.name}
										</p>
									</div>
									<div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white dark:border-t-gray-900" />
								</div>
							</div>
						);
					})}
				</div>

				{/* Office Cards Section */}
				<div className="w-full lg:w-80 space-y-3">
					<h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
						<Building2 className="w-5 h-5 text-[var(--accent)]" />
						Nos bureaux
					</h3>
					{locations.map((loc, index) => {
						const isHovered = hovered === loc.name;

						return (
							<motion.div
								key={loc.name}
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: index * 0.1 }}
								onMouseEnter={() => setHovered(loc.name)}
								onMouseLeave={() => setHovered(null)}
								className={`group relative overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer ${
									isHovered
										? "border-[var(--accent)] bg-[var(--accent)]/5 shadow-lg scale-105"
										: "border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/50"
								}`}
							>
								<div className="p-4">
									<div className="flex items-start gap-3">
										<div
											className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
												isHovered
													? "bg-[var(--accent)]"
													: "bg-[var(--accent)]/10"
											}`}
										>
											<MapPin
												className={`w-5 h-5 transition-colors ${
													isHovered ? "text-white" : "text-[var(--accent)]"
												}`}
											/>
										</div>
										<div className="flex-1 min-w-0">
											<h4
												className={`font-semibold text-sm mb-1 transition-colors ${
													isHovered
														? "text-[var(--accent)]"
														: "text-[var(--foreground)]"
												}`}
											>
												{loc.name}
											</h4>
											<p className="text-xs text-muted-foreground mb-1">
												{loc.region}
											</p>
											<p className="text-xs text-muted-foreground/80">
												{loc.address}
											</p>
										</div>
									</div>
								</div>

								{/* Animated border on hover */}
								<motion.div
									className="absolute inset-0 border-2 border-[var(--accent)] rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none"
									initial={false}
									animate={isHovered ? { opacity: 1 } : { opacity: 0 }}
									transition={{ duration: 0.2 }}
								/>
							</motion.div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
