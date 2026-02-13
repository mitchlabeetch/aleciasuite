import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PressReleaseCardProps {
	title: string;
	date: string;
	image?: string;
	slug: string;
	pdfUrl?: string; // URL to download the PDF
}

export function PressReleaseCard({
	title,
	date,
	image,
	slug,
	pdfUrl,
}: PressReleaseCardProps) {
	return (
		<Link
			href={`/actualites/${slug}`}
			className="group bg-[var(--card)] rounded-xl overflow-hidden border border-[var(--border)] shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full"
		>
			<div className="relative aspect-[16/9] bg-secondary flex items-center justify-center p-6 overflow-hidden">
				{image ? (
					<Image
						src={image}
						alt={title}
						fill
						className="object-cover group-hover:scale-105 transition-transform duration-500"
					/>
				) : (
					<FileText className="w-16 h-16 text-muted-foreground/20" />
				)}
				{/* Tombstone Overlay - fixed position, doesn't scale with image */}
				<div className="absolute inset-0 bg-gradient-to-t from-[var(--background)]/80 to-transparent opacity-60 pointer-events-none" />
				<div className="absolute bottom-4 left-4 right-4 z-10">
					<span className="inline-block px-3 py-1 bg-[var(--accent)] text-white text-xs font-bold uppercase tracking-wider rounded-sm shadow-lg">
						Communiqué
					</span>
				</div>
			</div>

			<div className="flex flex-col flex-grow p-6">
				<div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
					<time dateTime={date}>{date}</time>
				</div>

				<h3 className="text-xl font-bold text-[var(--foreground)] mb-4 line-clamp-2 group-hover:text-[var(--primary)] transition-colors">
					{title}
				</h3>

				<div className="mt-auto flex gap-3 pt-4 border-t border-[var(--border)]/50">
					<span className="text-sm text-[var(--primary)] font-medium">
						Lire le communiqué →
					</span>
					{pdfUrl && (
						<Button
							asChild
							variant="outline"
							size="sm"
							className="ml-auto gap-2"
							onClick={(e) => e.stopPropagation()}
						>
							<a href={pdfUrl} target="_blank" rel="noopener noreferrer">
								<Download className="w-4 h-4" />
								PDF
							</a>
						</Button>
					)}
				</div>
			</div>
		</Link>
	);
}
