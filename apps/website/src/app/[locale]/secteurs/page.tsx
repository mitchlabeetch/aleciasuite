import { Navbar } from "@/components/layout/Navbar";
import { SectorGrid } from "@/components/features/SectorGrid";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

interface Props {
	params: Promise<{
		locale: string;
	}>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "SecteursPage" });

	return {
		title: t("title"),
		description: t("description"),
	};
}

export default async function SecteursPage({ params }: Props) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "SecteursPage" });

	return (
		<>
			<Navbar />

			<main className="min-h-screen bg-[var(--background)] pt-24">
				{/* Header */}
				<section className="py-16 px-6">
					<div className="max-w-6xl mx-auto text-center">
						<h1 className="font-playfair text-4xl md:text-5xl font-semibold mb-6 text-gradient-alecia">
							{t("heading")}
						</h1>
						<p className="text-muted-foreground max-w-2xl mx-auto text-lg">
							{t("subtitle")}
						</p>
					</div>
				</section>

				{/* Grid */}
				<section className="py-8 px-6 pb-24">
					<div className="max-w-6xl mx-auto">
						<SectorGrid />
					</div>
				</section>

				{/* CTA */}
				<section className="py-16 px-6 bg-secondary">
					<div className="max-w-4xl mx-auto text-center">
						<h2 className="font-playfair text-3xl font-semibold mb-4 text-[var(--alecia-midnight)]">
							{t("ctaHeading")}
						</h2>
						<p className="text-muted-foreground mb-8">{t("ctaText")}</p>
					</div>
				</section>
			</main>
		</>
	);
}
