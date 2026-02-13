"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { memo } from "react";
import { Lock } from "lucide-react";

interface DealFlipCardProps {
	id: string;
	slug: string;
	clientName: string;
	clientLogo?: string;
	acquirerName?: string;
	acquirerLogo?: string;
	sector: string;
	year: number;
	mandateType: string;
	region?: string;
	isFlipped: boolean;
	onFlip: () => void;
	disableFlip?: boolean;
	noShadow?: boolean;
	isPriorExperience?: boolean | null;
	description?: string;
	isConfidential?: boolean;
	isClientConfidential?: boolean;
	isAcquirerConfidential?: boolean;
}

// Check if a name indicates confidentiality
const isConfidentialName = (name?: string): boolean => {
	if (!name) return false;
	const lower = name.toLowerCase();
	return lower === "confidentiel" || lower === "confidential";
};

// Fallback icon component for missing logos
const LogoFallback = ({
	name,
	isConfidential,
	size = "normal",
}: {
	name?: string;
	isConfidential?: boolean;
	size?: "normal" | "small";
}) => {
	const iconSize = size === "small" ? 48 : 64;
	const textSize = size === "small" ? "text-lg" : "text-xl";

	if (isConfidential || isConfidentialName(name)) {
		return (
			<div className="w-full h-full flex flex-col items-center justify-center gap-2">
				<Lock className={cn(`w-${iconSize/4} h-${iconSize/4}`, "text-white/40")} />
				<span className={cn(textSize, "text-white/50 font-medium")}>
					Confidentiel
				</span>
			</div>
		);
	}

	return (
		<div className="w-full h-full flex flex-col items-center justify-center gap-2">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width={iconSize}
				height={iconSize}
				viewBox="0 0 24 24"
				fill="none"
				stroke="#ffffff"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"

			>
				<path d="M12 12h.01" />
				<path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
				<path d="M22 13a18.15 18.15 0 0 1-20 0" />
				<rect width="20" height="14" x="2" y="6" rx="2" />
			</svg>
			{name && (
				<span
					className={cn(
						textSize,
						"text-white/70 font-semibold text-center px-2 line-clamp-2",
					)}
				>
					{name}
				</span>
			)}
		</div>
	);
};

// Gradient backgrounds based on operation type - More distinct colors
const getGradientByType = (mandateType: string) => {
	switch (mandateType) {
		case "Cession":
			return "from-[#0a1628] via-[#162042] to-[#1e3a5f]"; // Deep navy blue
		case "Acquisition":
			return "from-[#0a1a1f] via-[#12303a] to-[#1a4555]"; // Teal-blue tint
		case "Levée de fonds":
			return "from-[#12101f] via-[#1e1a35] to-[#2a2550]"; // Purple-blue tint
		default:
			return "from-[#0a1628] via-[#162042] to-[#1e3a5f]";
	}
};

export const DealFlipCard = memo(function DealFlipCard({
	clientName,
	clientLogo,
	acquirerName,
	acquirerLogo,
	sector,
	year,
	mandateType,
	region = "",
	isFlipped,
	onFlip,
	disableFlip = false,
	noShadow = false,
	isPriorExperience = false,
	description,
	isConfidential = false,
	isClientConfidential: isClientConfidentialProp,
	isAcquirerConfidential: isAcquirerConfidentialProp,
}: DealFlipCardProps) {
	// Check if client or acquirer is confidential
	// Use new separate props if provided, otherwise fall back to legacy isConfidential + name check
	const isClientConfidential =
		isClientConfidentialProp ?? (isConfidential || isConfidentialName(clientName));
	const isAcquirerConfidential =
		isAcquirerConfidentialProp ?? (isConfidential || isConfidentialName(acquirerName));

	// Filter handler for hashtag clicks - accepts filter type (sector or region)
	const handleHashtagClick = (
		filterType: "sector" | "region",
		filterValue: string,
	) => {
		const event = new CustomEvent("filterDeals", {
			detail: { type: filterType, value: filterValue },
		});
		window.dispatchEvent(event);
	};

	// Default description if none provided - handle French elision (d' before vowels)
	const mandateLower = mandateType.toLowerCase();
	const startsWithVowel = /^[aeiouéèêëàâäîïôùûü]/i.test(mandateLower);
	const displayDescription =
		description ||
		`Accompagnement stratégique pour cette opération ${startsWithVowel ? "d'" : "de "}${mandateLower}`;

	// Get gradient based on operation type
	const gradient = getGradientByType(mandateType);

	return (
		<div className="relative w-full h-full">
			<div
				className="relative w-full h-full"
				style={{ perspective: "1000px", containerType: "size" }}
			>
				<motion.div
					className="relative w-full h-full"
					animate={{ rotateY: isFlipped ? 180 : 0 }}
					transition={{ duration: 0.6, ease: "easeInOut" }}
					style={{ transformStyle: "preserve-3d" }}
				>
					{/* ============================================ */}
					{/* FRONT SIDE (Side A) - Logos with big "&"    */}
					{/* ============================================ */}
					<button
						type="button"
						disabled={disableFlip}
						className={cn(
							"absolute inset-0 rounded-2xl overflow-hidden border-0 p-0 w-full h-full text-left bg-transparent",
							noShadow ? "" : "shadow-xl",
							!disableFlip && "cursor-pointer",
						)}
						style={{
							transform: "rotateY(0deg)",
							backfaceVisibility: "hidden",
							WebkitBackfaceVisibility: "hidden",
						}}
						onClick={() => !disableFlip && onFlip()}
						aria-label={
							!disableFlip
								? `Retourner la carte pour voir plus de détails sur ${clientName}`
								: undefined
						}
					>
						{/* Dynamic gradient background based on operation type */}
						<div
							className={cn("absolute inset-0 bg-gradient-to-br", gradient)}
						/>

						{/* Grid overlay with half opacity */}
						<div
							className="absolute inset-0 opacity-50"
							style={{
								backgroundImage: "url(/grid.svg)",
								backgroundSize: "cover",
								backgroundPosition: "center",
							}}
						/>

						{/* Subtle texture overlay */}
						<div
							className="absolute inset-0 opacity-[0.03]"
							style={{
								backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)`,
								backgroundSize: "24px 24px",
							}}
						/>

						{/* Decorative border glow */}
						<div className="absolute inset-0 rounded-2xl border border-white/10" />

						{/* Year Badge - Top of card, flat top, rounded bottom only */}
						<div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
							<div className="bg-[#0a1628] border-x border-b border-white/20 rounded-b-2xl px-5 py-2 shadow-lg">
								<span className="text-white text-sm font-semibold">{year}</span>
							</div>
						</div>

						{/* Prior Experience Indicator - White, light weight, equal distance from top and right */}
						{isPriorExperience && (
							<div
								className="absolute z-20"
								style={{ top: "16px", right: "16px" }}
							>
								<span className="text-white/80 text-xl font-light">*</span>
							</div>
						)}

						{/* Giant "&" - Bottom Left corner, ultra-thin elegant font */}
						<span
							className="absolute pointer-events-none z-0 text-white/10 select-none"
							style={{
								fontFamily: '"Inter", "Helvetica Neue", system-ui, sans-serif',
								fontWeight: 100,
								fontSize: "min(80cqh, 80cqw, 320px)",
								lineHeight: 0.75,
								bottom: "2%",
								left: "5%",
								letterSpacing: "-0.05em",
							}}
						>
							&
						</span>

						{/* Separator line between logos */}
						<div
							className="absolute left-[15%] right-[15%] h-px bg-white/15 z-10"
							style={{ top: "50%" }}
						/>

						{/* Logo 1 (Client) - Top zone: 18% to 48% of card */}
						<div
							className="absolute z-10 pointer-events-none"
							style={{
								top: "18%",
								bottom: "52%",
								left: "15%",
								right: "12%",
							}}
						>
							{clientLogo && !isClientConfidential ? (
								<div className="relative w-full h-full flex items-center justify-end">
									<Image
										src={clientLogo}
										alt={clientName}
										fill
										className="object-contain object-right brightness-0 invert"
										sizes="(max-width: 768px) 40vw, 20vw"
										onError={(e) => {
											// Hide broken image
											const target = e.target as HTMLImageElement;
											target.style.display = "none";
										}}
									/>
								</div>
							) : (
								<LogoFallback
									name={isClientConfidential ? undefined : clientName}
									isConfidential={isClientConfidential}
								/>
							)}
						</div>

						{/* Logo 2 (Acquirer) - Bottom zone: 52% to 82% of card */}
						<div
							className="absolute z-10 pointer-events-none"
							style={{
								top: "52%",
								bottom: "18%",
								left: "15%",
								right: "12%",
							}}
						>
							{acquirerLogo && !isAcquirerConfidential ? (
								<div className="relative w-full h-full flex items-center justify-end">
									<Image
										src={acquirerLogo}
										alt={acquirerName || "Acquirer"}
										fill
										className="object-contain object-right brightness-0 invert"
										sizes="(max-width: 768px) 40vw, 20vw"
										onError={(e) => {
											// Hide broken image
											const target = e.target as HTMLImageElement;
											target.style.display = "none";
										}}
									/>
								</div>
							) : (
								<LogoFallback
									name={isAcquirerConfidential ? undefined : acquirerName}
									isConfidential={isAcquirerConfidential}
									size="small"
								/>
							)}
						</div>
					</button>

					{/* ============================================ */}
					{/* BACK SIDE (Side B) - Info with tags         */}
					{/* ============================================ */}
					<div
						className={cn(
							"absolute inset-0 rounded-2xl overflow-hidden",
							noShadow ? "" : "shadow-xl",
						)}
						style={{
							transform: "rotateY(180deg)",
							backfaceVisibility: "hidden",
							WebkitBackfaceVisibility: "hidden",
						}}
					>
						{/* Same gradient as Side A */}
						<div
							className={cn("absolute inset-0 bg-gradient-to-br", gradient)}
						/>

						{/* Grid overlay with half opacity */}
						<div
							className="absolute inset-0 opacity-50"
							style={{
								backgroundImage: "url(/grid.svg)",
								backgroundSize: "cover",
								backgroundPosition: "center",
							}}
						/>

						{/* Clickable area for flip - covers most of card except bottom tag area */}
						<button
							type="button"
							disabled={disableFlip}
							className={cn(
								"absolute inset-x-0 top-0 bottom-20 z-10 border-0 p-0 bg-transparent",
								!disableFlip && "cursor-pointer",
							)}
							onClick={() => !disableFlip && onFlip()}
							aria-label={
								!disableFlip
									? `Retourner la carte pour voir le recto`
									: undefined
							}
						/>

						{/* Operation Type - Top badge (wider for "LEVÉE DE FONDS") */}
						<div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
							<div className="bg-[#080e1a] border-x border-b border-white/20 rounded-b-2xl px-6 py-2 shadow-lg whitespace-nowrap">
								<span className="text-white text-sm font-semibold uppercase tracking-wide">
									{mandateType}
								</span>
							</div>
						</div>

						{/* Subtle inner border */}
						<div className="absolute inset-0 rounded-2xl border border-white/10 pointer-events-none" />

						{/* Content container - Description below operation type, Tags at bottom */}
						<div className="absolute inset-x-0 top-14 px-4 flex flex-col items-center z-20 pointer-events-none">
							{/* Gap above description - reduced for tighter spacing */}
							<div className="h-1" />

							{/* Description - Positioned relative to top badge */}
							<p className="text-white/80 text-base leading-relaxed font-light text-center px-2">
								{displayDescription}
							</p>
						</div>

						{/* Tags - Bottom with padding */}
						<div className="absolute bottom-4 inset-x-0 px-4 flex flex-col items-center gap-4 z-20">
							<div className="flex flex-wrap justify-center gap-2">
								<button
									type="button"
									onClick={() => handleHashtagClick("sector", sector)}
									className="inline-flex items-center px-3 py-1.5 bg-white/10 hover:bg-white/25 backdrop-blur-sm rounded-full border border-white/20 hover:border-white/40 transition-all duration-200 text-xs group cursor-pointer"
								>
									<span className="text-white/50 mr-1 group-hover:text-white/70">
										#
									</span>
									<span className="text-white/80 group-hover:text-white">
										{sector}
									</span>
								</button>

								{region && (
									<button
										type="button"
										onClick={() => handleHashtagClick("region", region)}
										className="inline-flex items-center px-3 py-1.5 bg-white/10 hover:bg-white/25 backdrop-blur-sm rounded-full border border-white/20 hover:border-white/40 transition-all duration-200 text-xs group cursor-pointer"
									>
										<span className="text-white/50 mr-1 group-hover:text-white/70">
											#
										</span>
										<span className="text-white/80 group-hover:text-white">
											{region}
										</span>
									</button>
								)}
							</div>
						</div>
					</div>
				</motion.div>
			</div>
		</div>
	);
});
