"use client";

import { TextSection } from "./TextSection";
import { ImageSection } from "./ImageSection";
import { HeroSection } from "./HeroSection";
import { CardsSection } from "./CardsSection";
import { TestimonialSection } from "./TestimonialSection";
import { VideoSection } from "./VideoSection";
import { FAQSection } from "./FAQSection";
import { CTASection } from "./CTASection";
import { GallerySection } from "./GallerySection";
import { TeamSection } from "./TeamSection";
import type { Section } from "./types";

interface SectionRendererProps {
	sections: Section[];
	className?: string;
}

/**
 * SectionRenderer - Renders an array of sections from the database
 *
 * This component takes sections from the page_content table and renders
 * the appropriate component for each section type.
 */
export function SectionRenderer({
	sections,
	className = "",
}: SectionRendererProps) {
	// Filter out hidden sections and sort by order
	const visibleSections = sections
		.filter((section) => section.visible !== false)
		.sort((a, b) => a.order - b.order);

	if (visibleSections.length === 0) {
		return null;
	}

	return (
		<div className={className}>
			{visibleSections.map((section, index) => {
				const isAlternate = index % 2 === 1;
				const bgClass = isAlternate ? "bg-secondary" : "";

				switch (section.type) {
					case "text":
						return (
							<TextSection
								key={section.id}
								content={section.content}
								className={bgClass}
							/>
						);

					case "image":
						return (
							<ImageSection
								key={section.id}
								content={section.content}
								className={bgClass}
							/>
						);

					case "hero":
						return <HeroSection key={section.id} content={section.content} />;

					case "cards":
						return (
							<CardsSection
								key={section.id}
								content={section.content}
								className={bgClass}
							/>
						);

					case "testimonial":
						return (
							<TestimonialSection key={section.id} content={section.content} />
						);

					case "video":
						return (
							<VideoSection
								key={section.id}
								content={section.content}
								className={bgClass}
							/>
						);

					case "faq":
						return (
							<FAQSection
								key={section.id}
								content={section.content}
								className={bgClass}
							/>
						);

					case "cta":
						return <CTASection key={section.id} content={section.content} />;

					case "gallery":
						return (
							<GallerySection
								key={section.id}
								content={section.content}
								className={bgClass}
							/>
						);

					case "team":
						return (
							<TeamSection
								key={section.id}
								content={section.content}
								className={bgClass}
							/>
						);

					default:
						console.warn(`Unknown section type: ${section.type}`);
						return null;
				}
			})}
		</div>
	);
}
