import dynamic from "next/dynamic";
import { HeroVideo } from "@/components/home/HeroVideo";
import { KPIBand } from "@/components/home/KPIBand";
import { InteractiveMap } from "@/components/features/InteractiveMap";
import { TransactionsCarousel } from "@/components/home/TransactionsCarousel";
import { FloatingActionButtons } from "@/components/layout/FloatingActionButtons";
import { getTransactions } from "@/lib/actions/convex-marketing";
import { logger } from "@/lib/logger";
import { getHDLogoUrl } from "@/lib/hd-logos";

// Lazy load below-the-fold components
const ContactSection = dynamic(
	() =>
		import("@/components/home/ContactSection").then((mod) => ({
			default: mod.ContactSection,
		})),
	{
		loading: () => <div className="min-h-100" />,
	},
);
const Testimonials = dynamic(
	() =>
		import("@/components/home/Testimonials").then((mod) => ({
			default: mod.Testimonials,
		})),
	{
		loading: () => <div className="min-h-100" />,
	},
);

export default async function Home() {
	// Fetch transactions for the carousel with proper error handling
	const transactionsData = await getTransactions({ limit: 12 }).catch(
		(error) => {
			logger.error("Failed to fetch transactions in home page:", error);
			return [];
		},
	);

	const recentDeals = transactionsData.map((t) => ({
		id: t._id,
		slug: t.slug,
		clientName: t.clientName,
		sector: t.sector,
		year: t.year,
		mandateType: t.mandateType,
		acquirerName: t.acquirerName,
		clientLogo: getHDLogoUrl(t.clientName, "white") || t.clientLogo,
		acquirerLogo: t.acquirerName
			? getHDLogoUrl(t.acquirerName, "white") || t.acquirerLogo
			: t.acquirerLogo,
		region: t.region || "",
	}));

	return (
		<>
			<main className="min-h-screen bg-background flex flex-col">
				{/* Hero Section - No top gap, handles its own height */}
				<HeroVideo />

				{/* KPIBand outside the padded container to remove gaps */}
				<KPIBand />

				{/* Content Wrapper with tighter spacing */}
				<div className="flex flex-col gap-0 pb-0 pt-0">
					{recentDeals.length > 0 && (
						<TransactionsCarousel deals={recentDeals as any} />
					)}

					<InteractiveMap />

					<ContactSection />

					{/* Testimonials moved to bottom before footer */}
					<Testimonials />
				</div>
			</main>

			{/* Floating Action Buttons (Desktop) */}
			<FloatingActionButtons />
		</>
	);
}
