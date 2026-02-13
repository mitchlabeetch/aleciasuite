import { Navbar } from "@/components/layout/Navbar";
import { Link } from "@/i18n/navigation";
import { MapPin, Briefcase, Award, Users, Zap, Heart } from "lucide-react";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { getJobOffers } from "@/lib/actions/convex-marketing";
import { logger } from "@/lib/logger";
import type { JobOffer } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("CareersPage");
	return {
		title: t("title"),
		description: t("subtitle"),
	};
}

export default async function NousRejoindrePage() {
	const t = await getTranslations("CareersPage");

	// Fetch from Convex with proper error handling
	const jobs = await getJobOffers().catch((error) => {
		logger.error("Failed to fetch job offers in nous-rejoindre page:", error);
		return [];
	});

	const values = [
		{
			icon: Award,
			title: t("values.excellence"),
			desc: t("values.excellenceDesc"),
		},
		{
			icon: Heart,
			title: t("values.integrity"),
			desc: t("values.integrityDesc"),
		},
		{
			icon: Zap,
			title: t("values.entrepreneurship"),
			desc: t("values.entrepreneurshipDesc"),
		},
		{
			icon: Users,
			title: t("values.collective"),
			desc: t("values.collectiveDesc"),
		},
	];

	return (
		<>
			<Navbar />

			<main className="min-h-screen bg-background">
				{/* Hero & Manifesto Section */}
				<section className="pt-32 pb-20 px-6">
					<div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
						{/* Left: Text */}
						<div className="space-y-8">
							<span className="text-accent font-semibold tracking-wider uppercase text-sm">
								{t("manifestoTitle")}
							</span>
							<h1 className="font-playfair text-4xl md:text-5xl lg:text-6xl font-bold text-gradient-alecia leading-tight">
								{t("manifestoHeading")}
							</h1>
							<p className="text-muted-foreground text-lg leading-relaxed">
								{t("manifestoText")}
							</p>
						</div>

						{/* Right: Image */}
						<div className="relative h-100 lg:h-150 w-full rounded-2xl overflow-hidden shadow-2xl border border-border">
							<Image
								src="/assets/Expertises_Alecia/1_p1600.webp"
								alt="Bureaux Alecia"
								fill
								className="object-cover"
								priority
							/>
							<div className="absolute inset-0 bg-linear-to-t from-alecia-midnight/50 to-transparent" />
						</div>
					</div>
				</section>

				{/* Job Board - moved before Values */}
				<section className="py-8 px-6">
					<div className="max-w-4xl mx-auto">
						<div className="flex items-center justify-between mb-12">
							<h2 className="text-3xl font-playfair font-bold text-foreground">
								{t("jobsTitle")}
							</h2>
						</div>

						{jobs.length > 0 ? (
							<div className="space-y-6">
								{jobs.map((job: JobOffer) => (
									<div
										key={job._id}
										className="group bg-card p-8 rounded-xl border border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-lg hover:border-accent transition-all duration-300"
									>
										<div className="space-y-3">
											<div className="flex items-center gap-3">
												<h3 className="font-bold text-2xl text-foreground group-hover:text-accent transition-colors">
													{job.title}
												</h3>
											</div>
											<p className="text-muted-foreground max-w-xl">
												{job.description}
											</p>
											<div className="flex gap-6 text-sm text-muted-foreground pt-2">
												<span className="flex items-center gap-2">
													<MapPin className="w-4 h-4 text-accent" />{" "}
													{job.location}
												</span>
												{job.type && (
													<span className="flex items-center gap-2">
														<Briefcase className="w-4 h-4 text-accent" />{" "}
														{job.type}
													</span>
												)}
											</div>
										</div>
										<Button
											asChild
											className="shrink-0 bg-alecia-midnight text-white hover:bg-accent transition-colors"
										>
											<Link
												href={`mailto:recrutement@alecia.markets?subject=Candidature - ${job.title}`}
											>
												{t("apply")}
											</Link>
										</Button>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-16 bg-secondary rounded-xl border border-border border-dashed">
								<p className="text-muted-foreground text-lg">{t("noJobs")}</p>
							</div>
						)}
					</div>
				</section>

				{/* Values Matrix - moved after Job Board */}
				<section className="py-12 md:py-20 bg-secondary px-6 border-y border-border">
					<div className="max-w-7xl mx-auto">
						<h2 className="text-2xl md:text-3xl font-playfair font-bold text-center mb-8 md:mb-16 text-foreground">
							{t("valuesTitle")}
						</h2>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 lg:gap-12">
							{values.map((val, idx) => (
								<div
									key={`value-${val.title}-${idx}`}
									className="flex gap-4 md:gap-6 p-4 md:p-6 rounded-xl bg-card border border-border hover:border-accent transition-colors duration-300"
								>
									<div className="shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
										<val.icon className="w-5 h-5 md:w-6 md:h-6" />
									</div>
									<div>
										<h3 className="text-lg md:text-xl font-bold text-foreground mb-1 md:mb-2">
											{val.title}
										</h3>
										<p className="text-sm md:text-base text-muted-foreground">
											{val.desc}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</section>
			</main>
		</>
	);
}
