/**
 * Section type definitions for the visual editor
 */

export type SectionType =
	| "text"
	| "image"
	| "hero"
	| "cards"
	| "testimonial"
	| "video"
	| "faq"
	| "cta"
	| "gallery"
	| "team";

/**
 * Base section interface - content is typed loosely to match Convex's v.any()
 * The actual content structure is validated at runtime based on section type
 */
export interface Section {
	id: string;
	type: SectionType;
	// Using Record type to match Convex's flexible content structure
	// Each section type has its own content shape validated at render time
	content: Record<string, unknown>;
	order: number;
	visible?: boolean;
}

export interface TextContent {
	title?: string;
	text?: string;
}

export interface ImageContent {
	url?: string;
	alt?: string;
	caption?: string;
}

export interface HeroContent {
	heading?: string;
	subheading?: string;
	backgroundImage?: string;
	ctaText?: string;
	ctaLink?: string;
}

export interface CardItem {
	id: string;
	title?: string;
	description?: string;
	icon?: string;
	link?: string;
}

export interface CardsContent {
	sectionTitle?: string;
	cards?: CardItem[];
}

export interface TestimonialContent {
	quote?: string;
	author?: string;
	role?: string;
	photo?: string;
}

export interface VideoContent {
	url?: string;
	title?: string;
	description?: string;
	autoplay?: boolean;
	thumbnail?: string;
}

export interface FAQItem {
	id: string;
	question: string;
	answer: string;
}

export interface FAQContent {
	sectionTitle?: string;
	items?: FAQItem[];
}

export interface CTAContent {
	heading?: string;
	subheading?: string;
	primaryButtonText?: string;
	primaryButtonLink?: string;
	secondaryButtonText?: string;
	secondaryButtonLink?: string;
	variant?: "default" | "dark" | "gradient";
}

export interface GalleryItem {
	id: string;
	url: string;
	alt?: string;
	caption?: string;
}

export interface GalleryContent {
	sectionTitle?: string;
	items?: GalleryItem[];
	columns?: 2 | 3 | 4;
}

export interface TeamMember {
	id: string;
	name: string;
	role?: string;
	photo?: string;
	bio?: string;
	linkedin?: string;
	email?: string;
}

export interface TeamContent {
	sectionTitle?: string;
	subtitle?: string;
	members?: TeamMember[];
}
