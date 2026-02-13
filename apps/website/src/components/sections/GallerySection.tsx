"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { X } from "lucide-react";

interface GalleryItem {
	id?: string;
	url: string;
	alt?: string;
	caption?: string;
}

interface GallerySectionProps {
	content: Record<string, unknown>;
	className?: string;
}

const staggerContainer = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { staggerChildren: 0.1 },
	},
} as const;

const itemVariant = {
	hidden: { opacity: 0, scale: 0.9 },
	visible: {
		opacity: 1,
		scale: 1,
		transition: { duration: 0.4, ease: "easeOut" as const },
	},
} as const;

/**
 * GallerySection - Renders a responsive image gallery with lightbox
 */
export function GallerySection({
	content,
	className = "",
}: GallerySectionProps) {
	const sectionTitle = content.sectionTitle as string | undefined;
	const items = (content.items as GalleryItem[] | undefined) || [];
	const columns = (content.columns as 2 | 3 | 4) || 3;
	const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

	if (items.length === 0) return null;

	const gridCols = {
		2: "md:grid-cols-2",
		3: "md:grid-cols-2 lg:grid-cols-3",
		4: "md:grid-cols-2 lg:grid-cols-4",
	};

	return (
		<>
			<section className={`py-16 ${className}`}>
				<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
					{sectionTitle && (
						<motion.h2
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							className="font-playfair text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-12 text-center"
						>
							{sectionTitle}
						</motion.h2>
					)}

					<motion.div
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true, margin: "-50px" }}
						variants={staggerContainer}
						className={`grid grid-cols-1 ${gridCols[columns]} gap-4`}
					>
						{items.map((item, index) => (
							<motion.button
								key={item.id || index}
								variants={itemVariant}
								onClick={() => setLightboxIndex(index)}
								className="group relative aspect-square rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer"
							>
								<Image
									src={item.url}
									alt={item.alt || ""}
									fill
									className="object-cover transition-transform duration-500 group-hover:scale-110"
								/>
								<div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
								{item.caption && (
									<div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
										<p className="text-white text-sm">{item.caption}</p>
									</div>
								)}
							</motion.button>
						))}
					</motion.div>
				</div>
			</section>

			{/* Lightbox */}
			{lightboxIndex !== null && (
				<div
					role="dialog"
					aria-modal="true"
					aria-label="Image lightbox"
					className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
					onClick={() => setLightboxIndex(null)}
					onKeyDown={(e) => {
						if (e.key === "Escape") setLightboxIndex(null);
						if (e.key === "ArrowLeft" && lightboxIndex > 0)
							setLightboxIndex(lightboxIndex - 1);
						if (e.key === "ArrowRight" && lightboxIndex < items.length - 1)
							setLightboxIndex(lightboxIndex + 1);
					}}
				>
					<button
						type="button"
						onClick={() => setLightboxIndex(null)}
						className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
					>
						<X className="w-8 h-8" />
					</button>

					<div
						role="img"
						aria-label={items[lightboxIndex].alt || "Gallery image"}
						className="relative max-w-5xl max-h-[90vh] w-full h-full"
						onClick={(e) => e.stopPropagation()}
					>
						<Image
							src={items[lightboxIndex].url}
							alt={items[lightboxIndex].alt || ""}
							fill
							className="object-contain"
						/>
					</div>

					{items[lightboxIndex].caption && (
						<p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white text-center max-w-2xl px-4">
							{items[lightboxIndex].caption}
						</p>
					)}

					{/* Navigation arrows */}
					{lightboxIndex > 0 && (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								setLightboxIndex(lightboxIndex - 1);
							}}
							className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 text-4xl"
						>
							‹
						</button>
					)}
					{lightboxIndex < items.length - 1 && (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								setLightboxIndex(lightboxIndex + 1);
							}}
							className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 text-4xl"
						>
							›
						</button>
					)}
				</div>
			)}
		</>
	);
}
