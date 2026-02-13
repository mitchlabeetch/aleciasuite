"use client";

import { motion } from "framer-motion";

interface CardItem {
	id?: string;
	title?: string;
	description?: string;
}

interface CardsSectionProps {
	content: Record<string, unknown>;
	className?: string;
}

const staggerContainer = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { staggerChildren: 0.15 },
	},
} as const;

const cardVariant = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.5, ease: "backOut" as const },
	},
} as const;

/**
 * CardsSection - Renders a grid of cards
 */
export function CardsSection({ content, className = "" }: CardsSectionProps) {
	const sectionTitle = content.sectionTitle as string | undefined;
	const cards = (content.cards as CardItem[] | undefined) || [];

	if (cards.length === 0) return null;

	return (
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
					className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
				>
					{cards.map((card: CardItem, index: number) => (
						<motion.div
							key={card.id || index}
							variants={cardVariant}
							className="group bg-white dark:bg-slate-800/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-[var(--border)] hover:border-[var(--alecia-blue-light)]/50"
						>
							<div className="flex items-center gap-3 mb-4">
								<div className="w-10 h-10 rounded-full bg-[var(--alecia-blue-midnight)]/10 flex items-center justify-center text-alecia-midnight font-semibold">
									{index + 1}
								</div>
								{card.title && (
									<h3 className="font-bold text-[var(--foreground)] text-lg">
										{card.title}
									</h3>
								)}
							</div>
							{card.description && (
								<p className="text-muted-foreground text-sm leading-relaxed">
									{card.description}
								</p>
							)}
						</motion.div>
					))}
				</motion.div>
			</div>
		</section>
	);
}
