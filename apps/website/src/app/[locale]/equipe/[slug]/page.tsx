import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, Linkedin, Mail, MapPin, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import {
	getTeamMemberBySlug,
	getTeamMembers,
} from "@/lib/actions/convex-marketing";

interface PageProps {
	params: Promise<{ slug: string; locale: string }>;
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { slug } = await params;
	const t = await getTranslations("TeamPage");

	const member = await getTeamMemberBySlug(slug);

	if (!member) {
		return { title: t("memberNotFound") || "Membre non trouvé | Alecia" };
	}

	return {
		title: `${member.name} - ${member.role} | Alecia`,
		description:
			(member as any).bio?.slice(0, 160) ||
			`${member.name}, ${member.role} chez Alecia. Découvrez son parcours et son expertise en fusion-acquisition.`,
	};
}

export async function generateStaticParams() {
	const teamMembers = await getTeamMembers();
	return teamMembers.map((member) => ({
		slug: member.slug,
	}));
}

export default async function TeamMemberPage({ params }: PageProps) {
	const { slug } = await params;
	const t = await getTranslations("TeamPage");

	// Get member from Convex
	const memberData = await getTeamMemberBySlug(slug);

	if (!memberData) {
		notFound();
	}

	// Cast to any to work around type definition issues
	const member = memberData as any;

	return (
		<>
			<main className="min-h-screen bg-background pt-24 pb-24">
				<div className="max-w-5xl mx-auto px-6">
					{/* Back Button */}
					<Button
						asChild
						variant="ghost"
						className="mb-8 pl-0 hover:bg-transparent hover:text-accent text-muted-foreground"
					>
						<Link href="/equipe">
							<ArrowLeft className="w-4 h-4 mr-2" />
							{t("backToTeam") || "Retour à l'équipe"}
						</Link>
					</Button>

					<div className="grid md:grid-cols-[350px_1fr] gap-12 items-start">
						{/* Photo Card */}
						<div className="space-y-6">
							<div className="relative aspect-3/4 md:aspect-3/4 max-h-[300px] md:max-h-none rounded-2xl overflow-hidden bg-card shadow-xl">
								{member.photoUrl || member.photo ? (
									<Image
										src={member.photoUrl || member.photo}
										alt={member.name}
										fill
										className="object-cover"
										priority
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center bg-linear-to-br from-alecia-midnight to-gold-400">
										<span className="text-6xl font-bold text-white/80">
											{member.name
												.split(" ")
												.map((n: string) => n[0])
												.join("")}
										</span>
									</div>
								)}
							</div>

							{/* Contact Card */}
							<div className="bg-white dark:bg-slate-800/50 rounded-xl p-5 shadow-lg border border-border space-y-4">
								{member.email && (
									<a
										href={`mailto:${member.email}`}
										className="flex items-center gap-3 text-muted-foreground hover:text-accent transition-colors"
									>
										<Mail className="w-5 h-5 text-accent" />
										<span className="text-sm">{member.email}</span>
									</a>
								)}
								{member.region && (
									<div className="flex items-center gap-3 text-muted-foreground">
										<MapPin className="w-5 h-5 text-accent" />
										<span className="text-sm">{member.region}</span>
									</div>
								)}
								{member.linkedinUrl && (
									<Button asChild variant="outline" className="w-full gap-2">
										<a
											href={member.linkedinUrl}
											target="_blank"
											rel="noopener noreferrer"
										>
											<Linkedin className="w-4 h-4" />
											{t("viewLinkedIn") || "Voir le profil LinkedIn"}
										</a>
									</Button>
								)}
							</div>
						</div>

						{/* Info Section */}
						<div className="space-y-8">
							{/* Name & Role */}
							<div>
								<h1 className="font-playfair text-4xl md:text-5xl font-bold text-foreground mb-3">
									{member.name}
								</h1>
								<p className="text-xl text-accent font-semibold">
									{member.role}
								</p>
							</div>

							{/* Biography - without title */}
							{(member.bioFr || member.bio) && (
								<>
									<div className="prose prose-lg dark:prose-invert max-w-none">
										<p className="text-muted-foreground leading-relaxed text-base">
											{member.bioFr || member.bio}
										</p>
									</div>

									{/* Separator before operations */}
									{member.transactionSlugs &&
										member.transactionSlugs.length > 0 && (
											<div className="my-8 border-t border-border" />
										)}
								</>
							)}

							{/* Last Operations - Only shown if member has deals */}
							{member.transactionSlugs &&
								member.transactionSlugs.length > 0 && (
									<div>
										<h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
											<Briefcase className="w-5 h-5 text-accent" />
											Opérations réalisées ({member.transactionSlugs.length})
										</h3>
										<div className="grid gap-4 md:grid-cols-2">
											{member.transactionSlugs
												.slice(0, 6)
												.map((slug: string, _idx: number) => (
													<Link
														key={slug}
														href="/operations"
														className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-border hover:border-accent/50 transition-colors hover:shadow-md"
													>
														<div className="flex items-start gap-3">
															<div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
																<Briefcase className="w-5 h-5 text-accent" />
															</div>
															<div className="flex-1 min-w-0">
																<h4 className="font-semibold text-sm text-foreground mb-1 capitalize">
																	{slug.replace(/-/g, " ")}
																</h4>
																<p className="text-xs text-muted-foreground">
																	Transaction M&A
																</p>
															</div>
														</div>
													</Link>
												))}
										</div>
									</div>
								)}
						</div>
					</div>
				</div>
			</main>
		</>
	);
}
