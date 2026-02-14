import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Linkedin } from "lucide-react";
import Image from "next/image";

interface TeamMemberModalProps {
	member: any;
}

export function TeamMemberModal({ member }: TeamMemberModalProps) {
	// Filter deals based on member's dealIds
	// TODO: Restore deal data from database when team member deals are implemented
	const memberDeals: any[] = [];

	return (
		<Dialog>
			<DialogTrigger asChild>
				<button className="px-4 py-2 bg-[var(--alecia-light-blue)] text-white text-sm font-medium rounded-full hover:bg-[var(--alecia-mid-blue)] transition-colors">
					Voir le profil
				</button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-[var(--background)] border-[var(--border)]">
				<div className="grid grid-cols-1 md:grid-cols-2">
					{/* Photo Side (Hidden on Mobile) */}
					<div className="relative h-64 md:h-full bg-secondary hidden md:block">
						{member.photo ? (
							<Image
								src={member.photo}
								alt={member.name}
								fill
								className="object-cover"
							/>
						) : (
							<div className="w-full h-full flex items-center justify-center bg-secondary text-muted-foreground">
								<span className="opacity-50 text-6xl">
									{member.name.charAt(0)}
								</span>
							</div>
						)}
					</div>

					{/* Content Side */}
					<div className="p-8 overflow-y-auto max-h-[80vh]">
						<div className="flex justify-between items-start mb-1">
							<h2 className="text-3xl font-bold">{member.name}</h2>
							{member.linkedinUrl && (
								<a
									href={member.linkedinUrl}
									target="_blank"
									rel="noopener"
									className="p-2 text-muted-foreground hover:text-alecia-mid-blue transition-colors"
								>
									<Linkedin className="w-5 h-5" />
								</a>
							)}
						</div>

						<p className="text-[var(--accent)] font-medium mb-6">
							{member.role}
						</p>

						{member.bio && (
							<p className="text-sm text-muted-foreground mb-6 leading-relaxed">
								{member.bio}
							</p>
						)}

						{member.formation && (
							<div className="mb-4">
								<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
									Formation
								</p>
								<p className="text-sm">{member.formation}</p>
							</div>
						)}

						{member.region && (
							<div className="mb-6">
								<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
									Région
								</p>
								<p className="text-sm">{member.region}</p>
							</div>
						)}

						{/* Related Deals Section */}
						{memberDeals.length > 0 && (
							<div className="space-y-3 mt-8 pt-6 border-t border-[var(--border)]">
								<h3 className="font-semibold text-sm uppercase tracking-wide mb-3">
									Track Record
								</h3>
								{memberDeals.map((deal) => (
									<div
										key={deal.id}
										className="flex items-center justify-between p-3 rounded-lg bg-secondary"
									>
										<div>
											<div className="font-medium text-sm">
												{deal.clientName}
											</div>
											<div className="text-xs text-muted-foreground">
												{deal.mandateType}
											</div>
										</div>
										<Badge variant="outline" className="text-xs">
											{deal.year}
										</Badge>
									</div>
								))}
							</div>
						)}

						{memberDeals.length === 0 && (
							<div className="mt-8 pt-6 border-t border-[var(--border)] text-center text-sm text-muted-foreground">
								Expertise sectorielle transverse
							</div>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
