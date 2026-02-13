"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Quote } from "lucide-react";

interface TestimonialSectionProps {
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
 * TestimonialSection - Renders a testimonial quote with author info
 */
export function TestimonialSection({
	content,
	className = "",
}: TestimonialSectionProps) {
	const quote = content.quote as string | undefined;
	const author = content.author as string | undefined;
	const role = content.role as string | undefined;
	const photo = content.photo as string | undefined;

	if (!quote) return null;

	return (
		<motion.section
			initial="hidden"
			whileInView="visible"
			viewport={{ once: true, margin: "-100px" }}
			variants={fadeInUp}
			className={`py-20 bg-secondary ${className}`}
		>
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 md:p-12 shadow-xl">
					<Quote className="absolute top-6 left-6 w-12 h-12 text-[var(--alecia-blue-light)]/20" />

					<blockquote className="relative z-10">
						<p className="text-xl md:text-2xl text-[var(--foreground)] font-medium leading-relaxed italic mb-8">
							&ldquo;{quote}&rdquo;
						</p>

						<footer className="flex items-center gap-4">
							{photo && (
								<div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[var(--alecia-gold)]">
									<Image
										src={photo}
										alt={author || ""}
										fill
										className="object-cover"
									/>
								</div>
							)}
							<div>
								{author && (
									<cite className="not-italic font-bold text-[var(--foreground)]">
										{author}
									</cite>
								)}
								{role && (
									<p className="text-sm text-muted-foreground">{role}</p>
								)}
							</div>
						</footer>
					</blockquote>
				</div>
			</div>
		</motion.section>
	);
}
