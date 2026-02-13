// Types for marketing data from Convex

export interface Transaction {
	_id: string;
	_creationTime: number;
	slug: string;
	clientName: string;
	clientLogo?: string;
	acquirerName?: string;
	acquirerLogo?: string;
	sector: string;
	region?: string;
	year: number;
	mandateType: string;
	description?: string;
	isConfidential: boolean;
	isClientConfidential?: boolean;
	isAcquirerConfidential?: boolean;
	isPriorExperience: boolean;
	context?: string;
	intervention?: string;
	result?: string;
	testimonialText?: string;
	testimonialAuthor?: string;
	roleType?: string;
	dealSize?: string;
	keyMetrics?: Record<string, unknown>;
	isCaseStudy?: boolean;
	displayOrder: number;
}

export interface TeamMember {
	_id: string;
	_creationTime: number;
	slug: string;
	name: string;
	role: string;
	photo?: string;
	photoUrl?: string;
	bioFr?: string;
	bioEn?: string;
	passion?: string;
	linkedinUrl?: string;
	email?: string;
	sectorsExpertise: string[];
	transactionSlugs: string[];
	displayOrder: number;
	isActive: boolean;
}

export interface BlogPost {
	_id: string;
	_creationTime: number;
	title: string;
	slug: string;
	content: string;
	excerpt?: string;
	coverImage?: string;
	featuredImage?: string; // Added: alias for coverImage
	category?: string;
	tags?: string[]; // Added: missing from interface
	authorId?: string; // Added: for blog post author
	authorName?: string; // Added: enriched by query
	authorAvatar?: string; // Added: enriched by query
	status: "draft" | "published" | "archived";
	publishedAt?: number;
	seoTitle?: string;
	seoDescription?: string;
	seo?: {
		// Added: nested SEO object
		metaTitle?: string;
		metaDescription?: string;
	};
}

export interface JobOffer {
	_id: string;
	_creationTime: number;
	slug: string;
	title: string;
	type: string;
	location: string;
	description: string;
	requirements?: string | string[];
	contactEmail?: string;
	pdfUrl?: string;
	isPublished: boolean;
	displayOrder: number;
}

export interface TransactionFilters {
	sectors: string[];
	years: number[];
	mandateTypes: string[];
	regions: string[];
}
