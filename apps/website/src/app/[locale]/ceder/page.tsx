import { Navbar } from "@/components/layout/Navbar";
import { SellWizard } from "@/components/features/wizards/SellWizard";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

interface Props {
	params: Promise<{
		locale: string;
	}>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "CederPage" });

	return {
		title: t("title"),
		description: t("description"),
	};
}

export default async function CederPage({ params }: Props) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "CederPage" });

	return (
		<>
			<Navbar />

			<main className="min-h-screen bg-[var(--background)] pt-24 pb-24">
				<section className="py-12 px-6">
					<div className="max-w-4xl mx-auto text-center mb-12">
						<h1 className="font-playfair text-4xl md:text-5xl font-semibold mb-6 text-gradient-alecia">
							{t("heading")}
						</h1>
						<p className="text-muted-foreground max-w-2xl mx-auto text-lg">
							{t("subtitle")}
						</p>
					</div>

					<SellWizard />
				</section>
			</main>
		</>
	);
}
