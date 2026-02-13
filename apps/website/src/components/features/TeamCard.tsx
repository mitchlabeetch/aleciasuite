"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Linkedin } from "lucide-react";

interface TeamCardProps {
	slug: string;
	name: string;
	role: string;
	photo?: string | null;
	linkedinUrl?: string | null;
	index?: number;
}

export function TeamCard({
	slug,
	name,
	role,
	photo,
	linkedinUrl,
	index = 0,
}: TeamCardProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay: index * 0.1 }}
			className="group"
		>
			<Link href={`/equipe/${slug}`}>
				<div className="relative aspect-3/4 overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-border hover:border-alecia-light/30">
					{/* Photo */}
					{photo ? (
						<Image
							src={photo}
							alt={name}
							fill
							className="object-cover transition-transform duration-500 group-hover:scale-105"
						/>
					) : (
						<div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-alecia-midnight to-gold-400">
							<span className="text-6xl font-bold text-white/80">
								{name.charAt(0)}
							</span>
						</div>
					)}

					{/* Gradient overlay at bottom - always visible */}
					<div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-black/80 via-black/50 to-transparent" />

					{/* Name and role in gradient overlay */}
					<div className="absolute inset-x-0 bottom-0 p-5 z-10">
						<h3 className="text-lg font-bold text-white leading-tight drop-shadow-lg">
							{name}
						</h3>
						<p className="text-sm text-white/90 mt-1 drop-shadow-md">{role}</p>
					</div>

					{/* LinkedIn Icon - Top right, appears on hover */}
					{linkedinUrl && (
						<a
							href={linkedinUrl}
							target="_blank"
							rel="noopener noreferrer"
							onClick={(e) => e.stopPropagation()}
							className="absolute top-3 right-3 p-2 z-10 bg-white/90 dark:bg-slate-900/90 rounded-full text-alecia-midnight hover:text-gold-400 hover:bg-white transition-all opacity-0 group-hover:opacity-100 shadow-lg"
						>
							<Linkedin className="w-4 h-4" />
						</a>
					)}

					{/* Hover overlay for interactivity */}
					<div className="absolute inset-0 bg-alecia-midnight/0 group-hover:bg-alecia-midnight/10 transition-colors duration-300 pointer-events-none" />
				</div>
			</Link>
		</motion.div>
	);
}
