"use client";

import { motion } from "framer-motion";

interface VideoSectionProps {
	content: Record<string, unknown>;
	className?: string;
}

const fadeInUp = {
	hidden: { opacity: 0, y: 30 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.6, ease: "easeOut" as const },
	},
} as const;

/**
 * VideoSection - Renders an embedded video (YouTube, Vimeo, or direct URL)
 */
export function VideoSection({ content, className = "" }: VideoSectionProps) {
	const url = content.url as string | undefined;
	const title = content.title as string | undefined;
	const description = content.description as string | undefined;
	const thumbnail = content.thumbnail as string | undefined;

	if (!url) return null;

	// Determine video type and get embed URL
	const getEmbedUrl = (videoUrl: string): string | null => {
		// YouTube
		const youtubeMatch = videoUrl.match(
			/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/,
		);
		if (youtubeMatch) {
			return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
		}

		// Vimeo
		const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/);
		if (vimeoMatch) {
			return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
		}

		// Direct video URL (mp4, webm)
		if (videoUrl.match(/\.(mp4|webm|ogg)$/i)) {
			return videoUrl;
		}

		return null;
	};

	const embedUrl = getEmbedUrl(url);
	const isDirectVideo = url.match(/\.(mp4|webm|ogg)$/i);

	return (
		<motion.section
			initial="hidden"
			whileInView="visible"
			viewport={{ once: true, margin: "-100px" }}
			variants={fadeInUp}
			className={`py-16 ${className}`}
		>
			<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
				{title && (
					<h2 className="font-playfair text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-4 text-center">
						{title}
					</h2>
				)}
				{description && (
					<p className="text-lg text-muted-foreground mb-8 text-center max-w-3xl mx-auto">
						{description}
					</p>
				)}

				<div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black">
					{isDirectVideo ? (
						<video
							src={url}
							poster={thumbnail}
							controls
							className="w-full h-full object-cover"
						>
							<track kind="captions" srcLang="fr" label="Français" />
							Your browser does not support the video tag.
						</video>
					) : embedUrl ? (
						<iframe
							src={embedUrl}
							title={title || "Video"}
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
							allowFullScreen
							className="absolute inset-0 w-full h-full"
						/>
					) : (
						<div className="absolute inset-0 flex items-center justify-center text-white">
							Video format not supported
						</div>
					)}
				</div>
			</div>
		</motion.section>
	);
}
