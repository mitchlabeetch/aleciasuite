"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";

interface HeroSectionProps {
	content: Record<string, unknown>;
	className?: string;
}

const fadeInUp = {
	hidden: { opacity: 0, y: 30 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.6, ease: "easeOut" as const },
	},
} as const;

/**
 * HeroSection - Renders a hero banner with background image and CTA
 */
export function HeroSection({ content, className = "" }: HeroSectionProps) {
	const heading = content.heading as string | undefined;
	const subheading = content.subheading as string | undefined;
	const backgroundImage = content.backgroundImage as string | undefined;
	const ctaText = content.ctaText as string | undefined;
	const ctaLink = content.ctaLink as string | undefined;

	if (!heading && !subheading) return null;

	return (
		<motion.section
			initial="hidden"
			whileInView="visible"
			viewport={{ once: true }}
			variants={fadeInUp}
			className={`relative py-24 md:py-32 ${className}`}
		>
			{backgroundImage && (
				<div className="absolute inset-0 z-0">
					<Image
						src={backgroundImage}
						alt=""
						fill
						className="object-cover"
						priority
					/>
					<div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50" />
				</div>
			)}

			<div
				className={`relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 ${backgroundImage ? "text-white" : ""}`}
			>
				{heading && (
					<h1
						className={`font-playfair text-4xl md:text-6xl font-bold mb-6 ${backgroundImage ? "text-white" : "text-[var(--foreground)] text-gradient-alecia"}`}
					>
						{heading}
					</h1>
				)}
				{subheading && (
					<p
						className={`text-xl md:text-2xl max-w-3xl mb-8 ${backgroundImage ? "text-white/90" : "text-muted-foreground"}`}
					>
						{subheading}
					</p>
				)}
				{ctaText && ctaLink && (
					<Button asChild className="btn-gold group" size="lg">
						<Link href={ctaLink}>
							{ctaText}
							<ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
						</Link>
					</Button>
				)}
			</div>
		</motion.section>
	);
}
