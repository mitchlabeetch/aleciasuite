import { useTranslations } from "next-intl";

export default function MentionsLegales() {
	const t = useTranslations("LegalPage");

	// Handling sections as a structured map or array
	// Since next-intl keys can be nested, we can iterate if we define them carefully
	// For now, I'll use the specific indices as it's a fixed length legal doc.

	return (
		<div className="min-h-screen bg-white dark:bg-gray-900 pt-24 pb-16">
			<div className="max-w-3xl mx-auto px-4 sm:px-6">
				<h1 className="text-4xl font-bold text-[#061A40] dark:text-white mb-8 font-serif">
					{t("title")}
				</h1>

				<div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-serif prose-headings:text-[#061A40] dark:prose-headings:text-white">
					<p>{t("lastUpdate")}</p>

					<p>{t("intro")}</p>

					<h3>{t("sections.0.title")}</h3>
					<p>{t("sections.0.content")}</p>

					<h3>{t("sections.1.title")}</h3>
					<p>{t("sections.1.content")}</p>

					<h3>{t("sections.2.title")}</h3>
					<p>{t("sections.2.content")}</p>
				</div>
			</div>
		</div>
	);
}
