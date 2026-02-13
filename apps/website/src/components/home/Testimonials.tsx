"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Quote } from "lucide-react";

interface Testimonial {
	quote: string;
	author: string;
	role: string;
	company: string;
}

export function Testimonials() {
	const t = useTranslations("Testimonials");

	const testimonials: Testimonial[] = [
		{
			quote: t("testimonial1.quote"),
			author: t("testimonial1.author"),
			role: t("testimonial1.role"),
			company: t("testimonial1.company"),
		},
		{
			quote: t("testimonial2.quote"),
			author: t("testimonial2.author"),
			role: t("testimonial2.role"),
			company: t("testimonial2.company"),
		},
		{
			quote: t("testimonial3.quote"),
			author: t("testimonial3.author"),
			role: t("testimonial3.role"),
			company: t("testimonial3.company"),
		},
	];

	return (
		<section className="py-12 md:py-20 px-6 bg-secondary dark:bg-[var(--alecia-midnight)]">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="text-center mb-8 md:mb-16">
					<h2 className="font-playfair text-3xl md:text-4xl font-semibold mb-4 text-gradient-alecia">
						{t("title")}
					</h2>
					<p className="text-muted-foreground max-w-2xl mx-auto">
						{t("subtitle")}
					</p>
				</div>

				{/* Testimonials Grid */}
				<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
					{testimonials.map((testimonial, index) => (
						<motion.div
							key={`testimonial-${testimonial.author}-${index}`}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.5, delay: index * 0.1 }}
							className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 hover:shadow-lg transition-shadow"
						>
							<div className="flex flex-col h-full">
								{/* Quote Icon */}
								<div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center mb-4">
									<Quote className="w-5 h-5 text-[var(--accent)]" />
								</div>

								{/* Quote */}
								<blockquote className="flex-1 mb-6">
									<p className="text-muted-foreground italic leading-relaxed">
										&ldquo;{testimonial.quote}&rdquo;
									</p>
								</blockquote>

								{/* Author */}
								<div className="border-t border-[var(--border)] pt-4">
									<p className="font-semibold text-[var(--foreground)]">
										{testimonial.author}
									</p>
									<p className="text-sm text-muted-foreground">
										{testimonial.role}
									</p>
									<p className="text-sm text-[var(--accent)] font-medium">
										{testimonial.company}
									</p>
								</div>
							</div>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
