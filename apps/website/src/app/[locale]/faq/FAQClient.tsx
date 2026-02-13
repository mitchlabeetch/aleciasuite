"use client";

import { useState } from "react";
import {
	Accordion as _Accordion,
	AccordionItem,
} from "@/components/ui/Accordion";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

interface Question {
	id: string;
	category: string;
	questionKey: string;
	answerKey: string;
}

export default function FAQClient({ questions }: { questions: Question[] }) {
	const t = useTranslations("FAQPage");
	// We need to access nested keys. Since next-intl types are strict, we might need a workaround or specific namespace.
	// Ideally, we pass the translated strings from the server, but for interactivity (filtering),
	// keeping the logic here is fine if we use `useTranslations` for the content too.
	// BUT `useTranslations("FAQPage")` might not have the "questions" namespace if I didn't add it.
	// I will assume I will add `questions` object to `fr.json`.

	const tQuestions = useTranslations("FAQPage.questions");

	const [activeCategory, setActiveCategory] = useState<string>("all");
	const [openItem, setOpenItem] = useState<string | null>(null);

	const categories = ["all", "cession", "acquisition", "honoraires"];

	const filteredQuestions =
		activeCategory === "all"
			? questions
			: questions.filter((q) => q.category === activeCategory);

	return (
		<div>
			{/* Category Filter */}
			<div className="flex flex-wrap justify-center gap-4 mb-12">
				{categories.map((cat) => (
					<button
						key={cat}
						onClick={() => {
							setActiveCategory(cat);
							setOpenItem(null); // Close accordion on filter change
						}}
						className={cn(
							"px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 border",
							activeCategory === cat
								? "bg-[var(--alecia-midnight)] text-white border-[var(--alecia-midnight)]"
								: "bg-transparent text-muted-foreground border-[var(--border)] hover:border-[var(--foreground)]",
						)}
					>
						{t(`categories.${cat}`)}
					</button>
				))}
			</div>

			{/* Accordion List */}
			<motion.div layout className="space-y-4">
				{filteredQuestions.length > 0 ? (
					filteredQuestions.map((q) => (
						<motion.div
							layout
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 10 }}
							key={q.id}
						>
							<AccordionItem
								title={tQuestions(`${q.questionKey}`)}
								isOpen={openItem === q.id}
								onToggle={() => setOpenItem(openItem === q.id ? null : q.id)}
							>
								{tQuestions(`${q.answerKey}`)}
							</AccordionItem>
						</motion.div>
					))
				) : (
					<div className="text-center py-12 text-muted-foreground">
						No questions found.
					</div>
				)}
			</motion.div>
		</div>
	);
}
