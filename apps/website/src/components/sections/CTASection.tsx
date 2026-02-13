"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";

interface CTASectionProps {
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
 * CTASection - Renders a call-to-action block with buttons
 */
export function CTASection({ content, className = "" }: CTASectionProps) {
	const heading = content.heading as string | undefined;
	const subheading = content.subheading as string | undefined;
	const primaryButtonText = content.primaryButtonText as string | undefined;
	const primaryButtonLink = content.primaryButtonLink as string | undefined;
	const secondaryButtonText = content.secondaryButtonText as string | undefined;
	const secondaryButtonLink = content.secondaryButtonLink as string | undefined;
	const variant =
		(content.variant as "default" | "dark" | "gradient") || "default";

	if (!heading && !primaryButtonText) return null;

	const getVariantClasses = () => {
		switch (variant) {
			case "dark":
				return "bg-[#0a1628] text-white";
			case "gradient":
				return "bg-gradient-to-br from-[#0a1628] via-[#0f2847] to-[#1a3a5c] text-white";
			default:
				return "bg-secondary";
		}
	};

	const isLightVariant = variant === "default";

	return (
		<motion.section
			initial="hidden"
			whileInView="visible"
			viewport={{ once: true, margin: "-100px" }}
			variants={fadeInUp}
			className={`py-20 ${className}`}
		>
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
				<div
					className={`rounded-3xl p-12 md:p-16 text-center shadow-xl ${getVariantClasses()}`}
				>
					{heading && (
						<h2
							className={`font-playfair text-3xl md:text-4xl font-bold mb-4 ${isLightVariant ? "text-[var(--foreground)]" : "text-white"}`}
						>
							{heading}
						</h2>
					)}
					{subheading && (
						<p
							className={`text-lg mb-8 max-w-2xl mx-auto ${isLightVariant ? "text-muted-foreground" : "text-white/80"}`}
						>
							{subheading}
						</p>
					)}

					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						{primaryButtonText && primaryButtonLink && (
							<Button asChild size="lg" className="btn-gold group">
								<Link href={primaryButtonLink}>
									{primaryButtonText}
									<ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
								</Link>
							</Button>
						)}
						{secondaryButtonText && secondaryButtonLink && (
							<Button
								asChild
								size="lg"
								variant="outline"
								className={
									isLightVariant
										? ""
										: "border-white/30 text-white hover:bg-white/10"
								}
							>
								<Link href={secondaryButtonLink}>{secondaryButtonText}</Link>
							</Button>
						)}
					</div>
				</div>
			</div>
		</motion.section>
	);
}
