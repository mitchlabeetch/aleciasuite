import { Navbar } from "@/components/layout/Navbar";
import { getTranslations } from "next-intl/server";
import { getTransactions } from "@/lib/actions/convex-marketing";
import { OperationsContent } from "@/components/features/OperationsContent";
import { logger } from "@/lib/logger";
import type { Transaction } from "@/lib/types";

export default async function OperationsPage() {
	const t = await getTranslations("OperationsPage");

	// Fetch from Convex with proper error handling
	const convexDeals = await getTransactions().catch((error) => {
		logger.error("Failed to fetch transactions in operations page:", error);
		return [];
	});

	// Transform Convex deals to match the app's Transaction interface
	const initialDeals: Transaction[] = convexDeals.map((d) => ({
		_id: d._id,
		_creationTime: d._creationTime,
		slug: d.slug,
		clientName: d.clientName,
		clientLogo: d.clientLogo,
		acquirerName: d.acquirerName,
		acquirerLogo: d.acquirerLogo,
		sector: d.sector,
		year: d.year,
		mandateType: d.mandateType,
		region: d.region,
		isPriorExperience: d.isPriorExperience,
		isConfidential: d.isConfidential,
		displayOrder: d.displayOrder,
		description: d.description,
		context: d.context,
		intervention: d.intervention,
		result: d.result,
		testimonialText: d.testimonialText,
		testimonialAuthor: d.testimonialAuthor,
		roleType: d.roleType,
		dealSize: d.dealSize,
		keyMetrics: d.keyMetrics,
		isCaseStudy: d.isCaseStudy,
	}));

	return (
		<>
			<Navbar />

			<main className="min-h-screen bg-background pt-24">
				{/* Header */}
				<section className="py-4 px-6">
					<div className="max-w-6xl mx-auto">
						<h1 className="font-playfair text-4xl md:text-5xl font-semibold text-center mb-4 text-gradient-alecia">
							{t("title")}
						</h1>
						<p className="text-muted-foreground text-center max-w-2xl mx-auto text-lg">
							{t("subtitle")}
						</p>
					</div>
				</section>

				<OperationsContent initialDeals={initialDeals} />
			</main>
		</>
	);
}
