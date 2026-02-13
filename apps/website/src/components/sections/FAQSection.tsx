"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface FAQItem {
	id?: string;
	question: string;
	answer: string;
}

interface FAQSectionProps {
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
 * FAQSection - Renders an accordion of frequently asked questions
 */
export function FAQSection({ content, className = "" }: FAQSectionProps) {
	const sectionTitle = content.sectionTitle as string | undefined;
	const items = (content.items as FAQItem[] | undefined) || [];
	const [openIndex, setOpenIndex] = useState<number | null>(null);

	if (items.length === 0) return null;

	return (
		<motion.section
			initial="hidden"
			whileInView="visible"
			viewport={{ once: true, margin: "-100px" }}
			variants={fadeInUp}
			className={`py-16 ${className}`}
		>
			<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
				{sectionTitle && (
					<h2 className="font-playfair text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-12 text-center">
						{sectionTitle}
					</h2>
				)}

				<div className="space-y-4">
					{items.map((item, index) => (
						<div
							key={item.id || index}
							className="border border-[var(--border)] rounded-xl overflow-hidden bg-white dark:bg-slate-800/50"
						>
							<button
								type="button"
								onClick={() => setOpenIndex(openIndex === index ? null : index)}
								className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
							>
								<span className="font-semibold text-[var(--foreground)] pr-4">
									{item.question}
								</span>
								<ChevronDown
									className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${
										openIndex === index ? "rotate-180" : ""
									}`}
								/>
							</button>

							<AnimatePresence>
								{openIndex === index && (
									<motion.div
										initial={{ height: 0, opacity: 0 }}
										animate={{ height: "auto", opacity: 1 }}
										exit={{ height: 0, opacity: 0 }}
										transition={{ duration: 0.3, ease: "easeInOut" }}
										className="overflow-hidden"
									>
										<div className="px-6 pb-5 text-muted-foreground leading-relaxed border-t border-[var(--border)]">
											<p className="pt-4 whitespace-pre-line">{item.answer}</p>
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					))}
				</div>
			</div>
		</motion.section>
	);
}
