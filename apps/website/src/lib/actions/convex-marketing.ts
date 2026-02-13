"use server";

import type {
	Transaction,
	TeamMember,
	BlogPost,
	JobOffer,
	TransactionFilters,
} from "@/lib/types";
import { createLogger } from "@/lib/logger";
import {
	getTransactions as getTransactionsDb,
	getTransactionBySlug as getTransactionBySlugDb,
	getTransactionFilters as getTransactionFiltersDb,
	getTeamMembers as getTeamMembersDb,
	getTeamMemberBySlug as getTeamMemberBySlugDb,
} from "@/actions/marketing";
import {
	getPosts,
	getPostBySlug,
	getBlogCategories as getBlogCategoriesDb,
} from "@/actions/blog";
import {
	listJobOffers,
	getJobOfferBySlug as getJobOfferBySlugDb,
} from "@/actions/careers";

const log = createLogger("Convex Marketing");

// ============================================
// TRANSACTIONS
// ============================================

/**
 * Map PostgreSQL transaction data to Convex-compatible Transaction type
 */
function mapDbTransactionToConvex(dbTransaction: any): Transaction {
	return {
		_id: dbTransaction.id,
		_creationTime: dbTransaction.createdAt
			? new Date(dbTransaction.createdAt).getTime()
			: Date.now(),
		slug: dbTransaction.slug,
		clientName: dbTransaction.clientName,
		clientLogo: dbTransaction.clientLogo,
		acquirerName: dbTransaction.acquirerName,
		acquirerLogo: dbTransaction.acquirerLogo,
		sector: dbTransaction.sector,
		region: dbTransaction.region,
		year: dbTransaction.year,
		mandateType: dbTransaction.mandateType,
		description: dbTransaction.description,
		isConfidential: dbTransaction.isConfidential ?? false,
		isClientConfidential: dbTransaction.isClientConfidential,
		isAcquirerConfidential: dbTransaction.isAcquirerConfidential,
		isPriorExperience: dbTransaction.isPriorExperience ?? false,
		context: dbTransaction.context,
		intervention: dbTransaction.intervention,
		result: dbTransaction.result,
		testimonialText: dbTransaction.testimonialText,
		testimonialAuthor: dbTransaction.testimonialAuthor,
		roleType: dbTransaction.roleType,
		dealSize: dbTransaction.dealSize,
		keyMetrics: dbTransaction.keyMetrics,
		isCaseStudy: dbTransaction.isCaseStudy,
		displayOrder: dbTransaction.displayOrder ?? 0,
	};
}

export async function getTransactions(filters?: {
	sector?: string;
	year?: number;
	mandateType?: string;
	isCaseStudy?: boolean;
	limit?: number;
}): Promise<Transaction[]> {
	try {
		const dbTransactions = await getTransactionsDb({
			sector:
				filters?.sector && filters.sector !== "all"
					? filters.sector
					: undefined,
			year: filters?.year,
			mandateType:
				filters?.mandateType && filters.mandateType !== "all"
					? filters.mandateType
					: undefined,
			limit: filters?.limit,
		});
		return dbTransactions.map(mapDbTransactionToConvex);
	} catch (error) {
		log.error("Error fetching transactions:", error);
		return [];
	}
}

export async function getTransactionBySlug(
	slug: string,
): Promise<Transaction | null> {
	try {
		const dbTransaction = await getTransactionBySlugDb(slug);
		if (!dbTransaction) {
			return null;
		}
		return mapDbTransactionToConvex(dbTransaction);
	} catch (error) {
		log.error("Error fetching transaction:", error);
		return null;
	}
}

export async function getTransactionFilters(): Promise<TransactionFilters> {
	try {
		const filters = await getTransactionFiltersDb();
		return filters || { sectors: [], years: [], mandateTypes: [], regions: [] };
	} catch (error) {
		log.error("Error fetching filters:", error);
		return { sectors: [], years: [], mandateTypes: [], regions: [] };
	}
}

// ============================================
// TEAM MEMBERS
// ============================================

/**
 * Map PostgreSQL team member data to Convex-compatible TeamMember type
 */
function mapDbTeamMemberToConvex(dbMember: any): TeamMember {
	return {
		_id: dbMember.id,
		_creationTime: dbMember.createdAt
			? new Date(dbMember.createdAt).getTime()
			: Date.now(),
		slug: dbMember.slug,
		name: dbMember.name,
		role: dbMember.role,
		photo: dbMember.photo,
		photoUrl: dbMember.photoUrl,
		bioFr: dbMember.bioFr,
		bioEn: dbMember.bioEn,
		passion: dbMember.passion,
		linkedinUrl: dbMember.linkedinUrl,
		email: dbMember.email,
		sectorsExpertise: dbMember.sectorsExpertise || [],
		transactionSlugs: dbMember.transactionSlugs || [],
		displayOrder: dbMember.displayOrder ?? 0,
		isActive: dbMember.isActive ?? true,
	};
}

export async function getTeamMembers(): Promise<TeamMember[]> {
	try {
		const dbMembers = await getTeamMembersDb(true);
		return dbMembers.map(mapDbTeamMemberToConvex);
	} catch (error) {
		log.error("Error fetching team:", error);
		return [];
	}
}

export async function getTeamMemberBySlug(
	slug: string,
): Promise<TeamMember | null> {
	try {
		const dbMember = await getTeamMemberBySlugDb(slug);
		if (!dbMember) {
			return null;
		}
		return mapDbTeamMemberToConvex(dbMember);
	} catch (error) {
		log.error("Error fetching team member:", error);
		return null;
	}
}

// ============================================
// BLOG POSTS
// ============================================

/**
 * Map PostgreSQL blog post data to Convex-compatible BlogPost type
 */
function mapDbBlogPostToConvex(dbPost: any): BlogPost {
	return {
		_id: dbPost.id,
		_creationTime: dbPost.createdAt ?? Date.now(),
		title: dbPost.title,
		slug: dbPost.slug,
		content: dbPost.content,
		excerpt: dbPost.excerpt,
		coverImage: dbPost.featuredImage,
		featuredImage: dbPost.featuredImage,
		category: dbPost.category,
		tags: dbPost.tags,
		authorId: dbPost.authorId,
		authorName: dbPost.author_name,
		authorAvatar: dbPost.author_avatar,
		status: dbPost.status,
		publishedAt: dbPost.publishedAt,
		seoTitle: dbPost.seo?.metaTitle,
		seoDescription: dbPost.seo?.metaDescription,
		seo: dbPost.seo,
	};
}

export async function getBlogPosts(options?: {
	category?: string;
	limit?: number;
}): Promise<BlogPost[]> {
	try {
		const dbPosts = await getPosts({
			status: "published",
		});

		let filteredPosts = dbPosts;

		if (options?.category) {
			filteredPosts = dbPosts.filter(
				(post) => post.category === options.category,
			);
		}

		if (options?.limit) {
			filteredPosts = filteredPosts.slice(0, options.limit);
		}

		return filteredPosts.map(mapDbBlogPostToConvex);
	} catch (error) {
		log.error("Error fetching posts:", error);
		return [];
	}
}

export async function getBlogPostBySlug(
	slug: string,
): Promise<BlogPost | null> {
	try {
		const dbPost = await getPostBySlug(slug);
		if (!dbPost) {
			return null;
		}
		return mapDbBlogPostToConvex(dbPost);
	} catch (error) {
		log.error("Error fetching post:", error);
		return null;
	}
}

export async function getBlogCategories(): Promise<string[]> {
	try {
		const categories = await getBlogCategoriesDb();
		return categories || [];
	} catch (error) {
		log.error("Error fetching categories:", error);
		return [];
	}
}

// ============================================
// JOB OFFERS
// ============================================

/**
 * Map PostgreSQL job offer data to Convex-compatible JobOffer type
 */
function mapDbJobOfferToConvex(dbOffer: any): JobOffer {
	return {
		_id: dbOffer.id,
		_creationTime: dbOffer.createdAt
			? new Date(dbOffer.createdAt).getTime()
			: Date.now(),
		slug: dbOffer.slug,
		title: dbOffer.title,
		type: dbOffer.type,
		location: dbOffer.location,
		description: dbOffer.description,
		requirements: dbOffer.requirements,
		contactEmail: dbOffer.contactEmail,
		pdfUrl: dbOffer.pdfUrl,
		isPublished: dbOffer.isPublished ?? false,
		displayOrder: dbOffer.displayOrder ?? 0,
	};
}

export async function getJobOffers(): Promise<JobOffer[]> {
	try {
		const dbOffers = await listJobOffers(false);
		return dbOffers.map(mapDbJobOfferToConvex);
	} catch (error) {
		log.error("Error fetching jobs:", error);
		return [];
	}
}

export async function getJobOfferBySlug(
	slug: string,
): Promise<JobOffer | null> {
	try {
		const dbOffer = await getJobOfferBySlugDb(slug);
		if (!dbOffer) {
			return null;
		}
		return mapDbJobOfferToConvex(dbOffer);
	} catch (error) {
		log.error("Error fetching job:", error);
		return null;
	}
}
