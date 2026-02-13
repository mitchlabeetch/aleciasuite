"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Linkedin, Mail } from "lucide-react";

interface TeamMember {
	id?: string;
	name: string;
	role?: string;
	photo?: string;
	bio?: string;
	linkedin?: string;
	email?: string;
}

interface TeamSectionProps {
	content: Record<string, unknown>;
	className?: string;
}

const staggerContainer = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { staggerChildren: 0.15 },
	},
} as const;

const memberVariant = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.5, ease: "backOut" as const },
	},
} as const;

/**
 * TeamSection - Renders a grid of team members
 */
export function TeamSection({ content, className = "" }: TeamSectionProps) {
	const sectionTitle = content.sectionTitle as string | undefined;
	const subtitle = content.subtitle as string | undefined;
	const members = (content.members as TeamMember[] | undefined) || [];

	if (members.length === 0) return null;

	return (
		<section className={`py-16 ${className}`}>
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
				{(sectionTitle || subtitle) && (
					<div className="text-center mb-12">
						{sectionTitle && (
							<motion.h2
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								className="font-playfair text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-4"
							>
								{sectionTitle}
							</motion.h2>
						)}
						{subtitle && (
							<motion.p
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ delay: 0.1 }}
								className="text-lg text-muted-foreground max-w-2xl mx-auto"
							>
								{subtitle}
							</motion.p>
						)}
					</div>
				)}

				<motion.div
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, margin: "-50px" }}
					variants={staggerContainer}
					className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
				>
					{members.map((member, index) => (
						<motion.div
							key={member.id || index}
							variants={memberVariant}
							className="group text-center"
						>
							{/* Photo */}
							<div className="relative w-40 h-40 mx-auto mb-4 rounded-full overflow-hidden border-4 border-[var(--border)] group-hover:border-[var(--alecia-gold)] transition-colors duration-300">
								{member.photo ? (
									<Image
										src={member.photo}
										alt={member.name}
										fill
										className="object-cover"
									/>
								) : (
									<div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-4xl font-bold text-gray-400">
										{member.name.charAt(0)}
									</div>
								)}
							</div>

							{/* Info */}
							<h3 className="font-bold text-lg text-[var(--foreground)] mb-1">
								{member.name}
							</h3>
							{member.role && (
								<p className="text-sm text-[var(--alecia-gold)] font-medium mb-2">
									{member.role}
								</p>
							)}
							{member.bio && (
								<p className="text-sm text-muted-foreground mb-3 line-clamp-3">
									{member.bio}
								</p>
							)}

							{/* Social links */}
							{(member.linkedin || member.email) && (
								<div className="flex justify-center gap-3">
									{member.linkedin && (
										<a
											href={member.linkedin}
											target="_blank"
											rel="noopener noreferrer"
											className="text-muted-foreground hover:text-[var(--alecia-blue-light)] transition-colors"
										>
											<Linkedin className="w-5 h-5" />
										</a>
									)}
									{member.email && (
										<a
											href={`mailto:${member.email}`}
											className="text-muted-foreground hover:text-[var(--alecia-blue-light)] transition-colors"
										>
											<Mail className="w-5 h-5" />
										</a>
									)}
								</div>
							)}
						</motion.div>
					))}
				</motion.div>
			</div>
		</section>
	);
}
