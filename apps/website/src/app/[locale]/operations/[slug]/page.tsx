import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { getTransactionBySlug } from "@/lib/actions/convex-marketing";

interface Props {
	params: Promise<{
		slug: string;
		locale: string;
	}>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug, locale } = await params;
	const deal = await getTransactionBySlug(slug);
	const t = await getTranslations({ locale, namespace: "DealPage" });

	if (!deal) {
		return {
			title: t("notFound"),
		};
	}

	return {
		title: `${deal.clientName} - ${deal.mandateType} | Alecia`,
		description: `${t("operationOf")} ${deal.mandateType.toLowerCase()} pour ${deal.clientName} dans le secteur ${deal.sector}.`,
		openGraph: {
			title: `${deal.clientName} - ${deal.mandateType}`,
			description: `${t("operationOf")} ${deal.mandateType.toLowerCase()} pour ${deal.clientName} dans le secteur ${deal.sector}.`,
			images: ["/assets/Alecia/HERO_p800.png"],
			type: "article",
			locale: locale,
		},
	};
}

export default async function DealPage({ params }: Props) {
	const { slug, locale } = await params;
	const deal = await getTransactionBySlug(slug);
	const t = await getTranslations({ locale, namespace: "DealPage" });

	if (!deal) {
		notFound();
	}

	return (
		<>
			<Navbar />
			<main className="min-h-screen bg-background pt-24 pb-16">
				<div className="max-w-4xl mx-auto px-6">
					<Breadcrumbs />
					<Link
						href="/operations"
						className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8 font-medium"
					>
						<ArrowLeft className="w-4 h-4 mr-2" />
						{t("backToOperations")}
					</Link>

					<div className="bg-card border border-border rounded-2xl p-8 md:p-12 shadow-sm">
						<div className="flex flex-col md:flex-row items-center gap-8 mb-8">
							<div className="h-40 w-40 flex items-center justify-center bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-transform hover:scale-105 duration-300">
								{deal.clientLogo ? (
									<Image
										src={deal.clientLogo}
										alt={deal.clientName}
										width={120}
										height={120}
										className="object-contain max-h-full"
									/>
								) : (
									<span className="text-4xl font-bold text-gray-300">
										{deal.clientName.charAt(0)}
									</span>
								)}
							</div>
							<div className="text-center md:text-left">
								<h1 className="text-3xl md:text-5xl font-playfair font-bold text-foreground mb-2">
									{deal.clientName}
								</h1>
								<div className="flex items-center justify-center md:justify-start gap-2">
									<Badge
										variant="outline"
										className="text-alecia-gold border-alecia-gold/30"
									>
										{deal.mandateType}
									</Badge>
									<span className="text-muted-foreground">•</span>
									<span className="text-muted-foreground">{deal.sector}</span>
								</div>
							</div>
						</div>

						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
							<div className="bg-secondary p-6 rounded-xl border border-border text-center transition-colors hover:border-alecia-mid-blue/50">
								<p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-2 font-bold">
									{t("year")}
								</p>
								<p className="font-bold text-lg">{deal.year}</p>
							</div>
							<div className="bg-secondary p-6 rounded-xl border border-border text-center transition-colors hover:border-alecia-mid-blue/50">
								<p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-2 font-bold">
									{t("region")}
								</p>
								<p className="font-bold text-lg">{deal.region || "-"}</p>
							</div>
							<div className="bg-secondary p-6 rounded-xl border border-border text-center transition-colors hover:border-alecia-mid-blue/50">
								<p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-2 font-bold">
									{t("type")}
								</p>
								<p className="font-bold text-lg">{deal.mandateType}</p>
							</div>
							<div className="bg-secondary p-6 rounded-xl border border-border text-center transition-colors hover:border-alecia-mid-blue/50">
								<p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-2 font-bold">
									Cabinet
								</p>
								<p className="font-bold text-lg">Alecia Partners</p>
							</div>
						</div>

						{deal.acquirerName && (
							<div className="relative p-8 bg-linear-to-br from-gray-50 to-white dark:from-white/5 dark:to-transparent rounded-2xl border border-dashed border-gray-200 dark:border-white/10 overflow-hidden">
								<div className="absolute top-0 right-0 p-4 opacity-10">
									<Image
										src="/assets/Alecia/LOGO_BLEU_CORPORATE.svg"
										alt="Alecia"
										width={100}
										height={40}
									/>
								</div>
								<div className="flex flex-col md:flex-row items-center gap-8">
									<div className="h-32 w-32 flex items-center justify-center bg-white rounded-xl p-4 shadow-sm border border-gray-100 shrink-0">
										{deal.acquirerLogo ? (
											<Image
												src={deal.acquirerLogo}
												alt={deal.acquirerName}
												width={90}
												height={90}
												className="object-contain max-h-full"
											/>
										) : (
											<span className="text-3xl font-bold text-gray-200">
												{deal.acquirerName.charAt(0)}
											</span>
										)}
									</div>
									<div className="text-center md:text-left">
										<p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] mb-1 font-bold">
											{deal.mandateType === "Levée de fonds"
												? "Investisseurs"
												: t("acquirer")}
										</p>
										<p className="text-2xl font-bold text-foreground">
											{deal.acquirerName}
										</p>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</main>
		</>
	);
}
