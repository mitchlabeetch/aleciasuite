import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TeamCard } from "@/components/features/TeamCard";
import { Link } from "@/i18n/navigation";
import { getTeamMembers } from "@/lib/actions/convex-marketing";
import { logger } from "@/lib/logger";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("TeamPage");
	return {
		title: t("title"),
		description: t("subtitle"),
	};
}

export default async function EquipePage() {
	const t = await getTranslations("TeamPage");

	// Fetch from Convex with proper error handling
	const teamMembers = await getTeamMembers().catch((error) => {
		logger.error("Failed to fetch team members in equipe page:", error);
		return [];
	});

	// Sort by id or displayOrder if available
	const sortedTeamMembers = [...teamMembers].sort((a: any, b: any) => {
		return parseInt(a.id) - parseInt(b.id);
	});

	return (
		<>
			<main className="min-h-screen bg-background pt-24">
				{/* Header */}
				<section className="py-4 px-6">
					<div className="max-w-6xl mx-auto text-center">
						<h1 className="font-playfair text-4xl md:text-5xl font-semibold mb-3 text-gradient-alecia">
							{t("title")}
						</h1>
						<p className="text-muted-foreground max-w-2xl mx-auto text-lg">
							{t("subtitle")}
						</p>
					</div>
				</section>

				{/* Team Grid */}
				<section className="py-6 px-6 pb-24">
					<div className="max-w-6xl mx-auto">
						{sortedTeamMembers.length === 0 ? (
							<div className="text-center py-20 text-muted-foreground">
								<p>
									{t("noMembers") || "Notre équipe sera bientôt disponible."}
								</p>
							</div>
						) : (
							<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
								{sortedTeamMembers.map((member: any, index: number) => (
									<TeamCard
										key={member.id || member._id}
										slug={member.slug}
										name={member.name}
										role={member.role}
										photo={member.photoUrl || member.photo || null}
										linkedinUrl={member.linkedinUrl || null}
										index={index}
									/>
								))}
							</div>
						)}
					</div>
				</section>

				{/* Hiring CTA */}
				<section className="py-16 px-6 bg-secondary">
					<div className="max-w-4xl mx-auto text-center">
						<h2 className="font-playfair text-3xl font-semibold mb-4 text-gradient-alecia">
							{t("hiringTitle")}
						</h2>
						<p className="text-muted-foreground mb-6">{t("hiringText")}</p>
						<Link
							href="/nous-rejoindre"
							className="inline-flex items-center gap-2 text-accent hover:underline"
						>
							{t("hiringLink")}
						</Link>
					</div>
				</section>
			</main>
		</>
	);
}
