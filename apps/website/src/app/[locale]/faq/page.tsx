import { Navbar } from "@/components/layout/Navbar";
import {
	Accordion as _Accordion,
	AccordionItem as _AccordionItem,
} from "@/components/ui/Accordion";
import { useTranslations as _useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import FAQClient from "./FAQClient";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("FAQPage");
	return {
		title: t("title"),
		description: t("subtitle"),
	};
}

export default async function FAQPage() {
	const t = await getTranslations("FAQPage");

	// Mock data structure, ideally this comes from a CMS or strictly typed separate file
	// but for translation purposes we pull from keys
	const _faqCategories = [
		"cession",
		"acquisition",
		"honoraires",
		"process",
	] as const;

	// We will build a structured object to pass to the client component
	// Since we are server-side, we can just fetch translations and format them
	// However, t() is synchronous here.

	// I'll create a hardcoded list of questions mapped to translation keys for now
	// to simulate the data source.

	const questions = [
		{
			id: "q1",
			category: "cession",
			questionKey: "q1.question",
			answerKey: "q1.answer",
		},
		{
			id: "q2",
			category: "cession",
			questionKey: "q2.question",
			answerKey: "q2.answer",
		},
		{
			id: "q3",
			category: "acquisition",
			questionKey: "q3.question",
			answerKey: "q3.answer",
		},
		{
			id: "q4",
			category: "honoraires",
			questionKey: "q4.question",
			answerKey: "q4.answer",
		},
		{
			id: "q5",
			category: "concept",
			questionKey: "q5.question",
			answerKey: "q5.answer",
		},
	];

	return (
		<>
			<Navbar />
			<main className="min-h-screen bg-[var(--background)] pt-24 pb-20">
				<div className="max-w-4xl mx-auto px-6">
					<div className="text-center mb-16">
						<h1 className="font-playfair text-4xl md:text-5xl font-bold text-gradient-alecia mb-6">
							{t("heading")}
						</h1>
						<p className="text-muted-foreground text-lg">{t("subtitle")}</p>
					</div>

					<FAQClient questions={questions} />
				</div>
			</main>
		</>
	);
}
