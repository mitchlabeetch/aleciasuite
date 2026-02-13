"use client";

import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function HeroVideo() {
	const t = useTranslations("HeroVideo");
	const prefersReducedMotion = useReducedMotion();

	// Simplified variants for reduced motion
	const cardVariant = prefersReducedMotion
		? { opacity: 1, y: 0 }
		: { opacity: 0, y: 20 };

	const cardAnimate = { opacity: 1, y: 0 };
	const cardTransition = prefersReducedMotion
		? { duration: 0 }
		: { duration: 0.8 };

	return (
		<section
			className="relative h-screen w-full overflow-hidden flex flex-col justify-center"
			aria-label={t("banqueAffaires")}
		>
			{/* Video Background */}
			<div className="absolute inset-0 z-0">
				<video
					autoPlay
					loop
					muted
					playsInline
					className="h-full w-full object-cover"
					preload="none"
					aria-hidden="true"
					tabIndex={-1}
				>
					<source src="/assets/video/herovideo.mp4" type="video/mp4" />
					{/* Fallback */}
					<div className="h-full w-full bg-[#061A40]" />
				</video>
			</div>

			{/* Clean white overlay - no grid pattern */}
			<div
				className="absolute inset-0 z-[1] bg-gradient-to-b from-white/65 to-white/55"
				aria-hidden="true"
			/>

			{/* Content Container */}
			<div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
				{/* Investment Bank Text - i18n compliant */}
				<div className="flex justify-center mb-6">
					<span className="text-[#061A40] font-black uppercase tracking-[0.4em] text-[10px] md:text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
						{t("banqueAffaires")}
					</span>
				</div>

				{/* Main Title */}
				<div className="mb-12 text-center max-w-5xl mx-auto">
					<h1 className="font-playfair text-5xl md:text-7xl font-bold tracking-tight mb-6 text-gradient-alecia leading-[1.1] drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">
						{t("title")}
					</h1>

					{/* Simplified subtitle - plain text without gradient tags */}
					<p className="text-lg md:text-xl font-medium text-[#061A40] max-w-4xl mx-auto leading-[1.6] text-center mt-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
						{t("subtitle")}
					</p>
				</div>

				{/* 3 Expertise Blocks - without title */}
				<nav aria-label="Navigation rapide vers nos expertises">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
						{[
							{
								title: t("cessionTitle"),
								desc: t("cessionDesc"),
								href: "/expertises#cession",
							},
							{
								title: t("leveeTitle"),
								desc: t("leveeDesc"),
								href: "/expertises#levee-de-fonds",
							},
							{
								title: t("acquisitionTitle"),
								desc: t("acquisitionDesc"),
								href: "/expertises#acquisition",
							},
						].map((item, index) => (
							<motion.div
								key={item.title}
								initial={cardVariant}
								animate={cardAnimate}
								transition={{
									...cardTransition,
									delay: prefersReducedMotion ? 0 : 0.2 + index * 0.1,
								}}
								className="group"
							>
								<Link
									href={item.href}
									className="flex flex-col h-full p-6 rounded-xl transition-all duration-300
                      bg-white/60
                      border border-[var(--alecia-blue-midnight)]/20
                      hover:bg-white/80
                      hover:border-[var(--alecia-blue-midnight)]/30
                      backdrop-blur-sm shadow-lg hover:shadow-xl min-h-[160px]
                      focus-visible:ring-4 focus-visible:ring-[var(--alecia-blue-light)] focus-visible:ring-offset-2"
									aria-label={`${item.title}: ${item.desc}`}
								>
									<h3 className="text-lg font-semibold mb-2 text-alecia-midnight">
										{item.title}
									</h3>
									{/* Flex-grow to push link to bottom, paragraph remains in place */}
									<p className="text-sm text-black/80 flex-grow">{item.desc}</p>
									{/* Link always at bottom */}
									<span
										className="inline-flex items-center text-sm font-medium text-alecia-corporate group-hover:translate-x-1 transition-transform mt-3"
										aria-hidden="true"
									>
										{t("learnMore")} <ArrowRight className="ml-2 h-4 w-4" />
									</span>
								</Link>
							</motion.div>
						))}
					</div>
				</nav>
			</div>

			{/* Scroll Nudge */}
			<motion.button
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{
					duration: prefersReducedMotion ? 0 : 1,
					delay: prefersReducedMotion ? 0 : 1.5,
				}}
				className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 cursor-pointer text-[#061A40]/70 p-2 rounded-full hover:bg-white/20 transition-colors focus-visible:ring-4 focus-visible:ring-[var(--alecia-blue-light)] focus-visible:ring-offset-2"
				onClick={() =>
					window.scrollTo({ top: window.innerHeight, behavior: "smooth" })
				}
				aria-label="Défiler vers le bas"
			>
				<ChevronDown className="w-10 h-10 animate-bounce" aria-hidden="true" />
			</motion.button>
		</section>
	);
}
