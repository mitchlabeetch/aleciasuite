"use client";

import { motion } from "framer-motion";

interface TextSectionProps {
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
 * TextSection - Renders a text block with optional title
 */
export function TextSection({ content, className = "" }: TextSectionProps) {
	const title = content.title as string | undefined;
	const text = content.text as string | undefined;

	if (!title && !text) return null;

	return (
		<motion.section
			initial="hidden"
			whileInView="visible"
			viewport={{ once: true, margin: "-100px" }}
			variants={fadeInUp}
			className={`py-16 ${className}`}
		>
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
				{title && (
					<h2 className="font-playfair text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-6">
						{title}
					</h2>
				)}
				{text && (
					<p className="prose prose-lg max-w-none text-muted-foreground whitespace-pre-line">
						{text}
					</p>
				)}
			</div>
		</motion.section>
	);
}
