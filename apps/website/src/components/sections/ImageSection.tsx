"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface ImageSectionProps {
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
 * ImageSection - Renders an image with optional caption
 */
export function ImageSection({ content, className = "" }: ImageSectionProps) {
	const url = content.url as string | undefined;
	const alt = content.alt as string | undefined;
	const caption = content.caption as string | undefined;

	if (!url) return null;

	return (
		<motion.section
			initial="hidden"
			whileInView="visible"
			viewport={{ once: true, margin: "-100px" }}
			variants={fadeInUp}
			className={`py-16 ${className}`}
		>
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
				<figure className="relative">
					<div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-[var(--border)]">
						<Image src={url} alt={alt || ""} fill className="object-cover" />
					</div>
					{caption && (
						<figcaption className="mt-4 text-center text-sm text-muted-foreground italic">
							{caption}
						</figcaption>
					)}
				</figure>
			</div>
		</motion.section>
	);
}
