import { v } from "convex/values";
import { query } from "./_generated/server";
import { getOptionalUser } from "./auth_utils";

/**
 * Global Search API
 *
 * Cross-entity search across deals, companies, contacts, documents, and more.
 * Returns unified search results with type indicators and relevance scoring.
 */

export type SearchResultType =
	| "deal"
	| "company"
	| "contact"
	| "document"
	| "presentation"
	| "calendar_event"
	| "blog_post";

export interface SearchResult {
	id: string;
	type: SearchResultType;
	title: string;
	subtitle?: string;
	description?: string;
	url?: string;
	score: number;
	metadata?: Record<string, unknown>;
}

/**
 * Global search across all entities
 */
export const globalSearch = query({
	args: {
		query: v.string(),
		types: v.optional(
			v.array(
				v.union(
					v.literal("deal"),
					v.literal("company"),
					v.literal("contact"),
					v.literal("document"),
					v.literal("presentation"),
					v.literal("calendar_event"),
					v.literal("blog_post"),
				),
			),
		),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args): Promise<SearchResult[]> => {
		const user = await getOptionalUser(ctx);
		if (!user) return [];

		const searchQuery = args.query.toLowerCase().trim();
		if (!searchQuery || searchQuery.length < 2) return [];

		const limit = args.limit ?? 20;
		const searchTypes = args.types ?? [
			"deal",
			"company",
			"contact",
			"document",
			"presentation",
			"calendar_event",
			"blog_post",
		];

		const results: SearchResult[] = [];

		// Search Deals
		if (searchTypes.includes("deal")) {
			const deals = await ctx.db.query("deals").collect();
			for (const deal of deals) {
				const titleMatch = deal.title?.toLowerCase().includes(searchQuery);
				const descMatch = deal.description?.toLowerCase().includes(searchQuery);
				const leadMatch = deal.leadName?.toLowerCase().includes(searchQuery);

				if (titleMatch || descMatch || leadMatch) {
					results.push({
						id: deal._id,
						type: "deal",
						title: deal.title || "Untitled Deal",
						subtitle: deal.leadName,
						description: deal.description?.slice(0, 150),
						score: titleMatch ? 100 : leadMatch ? 80 : 60,
						metadata: {
							stage: deal.stage,
							amount: deal.amount,
							priority: deal.priority,
						},
					});
				}
			}
		}

		// Search Companies
		if (searchTypes.includes("company")) {
			const companies = await ctx.db.query("companies").collect();
			for (const company of companies) {
				const nameMatch = company.name?.toLowerCase().includes(searchQuery);
				const descMatch = company.description
					?.toLowerCase()
					.includes(searchQuery);
				const sirenMatch = company.siren?.toLowerCase().includes(searchQuery);

				if (nameMatch || descMatch || sirenMatch) {
					results.push({
						id: company._id,
						type: "company",
						title: company.name || "Unnamed Company",
						subtitle: company.siren,
						description: company.description?.slice(0, 150),
						score: nameMatch ? 100 : sirenMatch ? 70 : 50,
						metadata: {
							website: company.website,
							siren: company.siren,
							financials: company.financials,
						},
					});
				}
			}
		}

		// Search Contacts
		if (searchTypes.includes("contact")) {
			const contacts = await ctx.db.query("contacts").collect();
			for (const contact of contacts) {
				const nameMatch = contact.fullName?.toLowerCase().includes(searchQuery);
				const emailMatch = contact.email?.toLowerCase().includes(searchQuery);
				const roleMatch = contact.role?.toLowerCase().includes(searchQuery);

				if (nameMatch || emailMatch || roleMatch) {
					results.push({
						id: contact._id,
						type: "contact",
						title: contact.fullName || contact.email || "Unknown Contact",
						subtitle: contact.role,
						description: contact.email,
						score: nameMatch ? 100 : emailMatch ? 90 : 60,
						metadata: {
							email: contact.email,
							phone: contact.phone,
							role: contact.role,
						},
					});
				}
			}
		}

		// Search Documents
		if (searchTypes.includes("document")) {
			const documents = await ctx.db.query("colab_documents").collect();
			for (const doc of documents) {
				const titleMatch = doc.title?.toLowerCase().includes(searchQuery);

				if (titleMatch) {
					results.push({
						id: doc._id,
						type: "document",
						title: doc.title || "Untitled Document",
						subtitle: "Document",
						score: 90,
						metadata: {
							updatedAt: doc.updatedAt,
							createdAt: doc.createdAt,
						},
					});
				}
			}
		}

		// Search Presentations
		if (searchTypes.includes("presentation")) {
			const presentations = await ctx.db.query("colab_presentations").collect();
			for (const pres of presentations) {
				const titleMatch = pres.title?.toLowerCase().includes(searchQuery);

				if (titleMatch) {
					results.push({
						id: pres._id,
						type: "presentation",
						title: pres.title || "Untitled Presentation",
						subtitle: `${pres.slides?.length || 0} slides`,
						score: titleMatch ? 95 : 65,
						metadata: {
							slideCount: pres.slides?.length,
							theme: pres.theme,
						},
					});
				}
			}
		}

		// Search Calendar Events
		if (searchTypes.includes("calendar_event")) {
			// Only search future events and recent past events (30 days)
			const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
			const events = await ctx.db
				.query("calendar_events")
				.filter((q) => q.gte(q.field("startDateTime"), thirtyDaysAgo))
				.collect();

			for (const event of events) {
				// Only search user's own events
				if (event.ownerId !== user._id) continue;

				const titleMatch = event.title?.toLowerCase().includes(searchQuery);
				const descMatch = event.description
					?.toLowerCase()
					.includes(searchQuery);
				const locationMatch = event.location
					?.toLowerCase()
					.includes(searchQuery);

				if (titleMatch || descMatch || locationMatch) {
					results.push({
						id: event._id,
						type: "calendar_event",
						title: event.title || "Untitled Event",
						subtitle: new Date(event.startDateTime).toLocaleDateString("fr-FR"),
						description: event.location,
						score: titleMatch ? 85 : 55,
						metadata: {
							startDateTime: event.startDateTime,
							endDateTime: event.endDateTime,
							source: event.source,
							isOnlineMeeting: event.isOnlineMeeting,
						},
					});
				}
			}
		}

		// Search Blog Posts (published only)
		if (searchTypes.includes("blog_post")) {
			const posts = await ctx.db
				.query("blog_posts")
				.filter((q) => q.eq(q.field("status"), "published"))
				.collect();

			for (const post of posts) {
				const titleMatch = post.title?.toLowerCase().includes(searchQuery);
				const excerptMatch = post.excerpt?.toLowerCase().includes(searchQuery);

				if (titleMatch || excerptMatch) {
					results.push({
						id: post._id,
						type: "blog_post",
						title: post.title || "Untitled Post",
						subtitle: post.category,
						description: post.excerpt?.slice(0, 150),
						url: `/blog/${post.slug}`,
						score: titleMatch ? 80 : 50,
						metadata: {
							slug: post.slug,
							publishedAt: post.publishedAt,
							category: post.category,
						},
					});
				}
			}
		}

		// Sort by score and limit results
		results.sort((a, b) => b.score - a.score);
		return results.slice(0, limit);
	},
});

/**
 * Quick search for command palette / autocomplete
 * Returns minimal data for fast response
 */
export const quickSearch = query({
	args: {
		query: v.string(),
		limit: v.optional(v.number()),
	},
	handler: async (
		ctx,
		args,
	): Promise<
		Array<{
			id: string;
			type: SearchResultType;
			title: string;
			subtitle?: string;
		}>
	> => {
		const user = await getOptionalUser(ctx);
		if (!user) return [];

		const searchQuery = args.query.toLowerCase().trim();
		if (!searchQuery || searchQuery.length < 2) return [];

		const limit = args.limit ?? 10;
		const results: Array<{
			id: string;
			type: SearchResultType;
			title: string;
			subtitle?: string;
			score: number;
		}> = [];

		// Quick search deals
		const deals = await ctx.db.query("deals").take(100);
		for (const deal of deals) {
			if (deal.title?.toLowerCase().includes(searchQuery)) {
				results.push({
					id: deal._id,
					type: "deal",
					title: deal.title || "Untitled",
					subtitle: deal.leadName,
					score: 100,
				});
			}
		}

		// Quick search companies
		const companies = await ctx.db.query("companies").take(100);
		for (const company of companies) {
			if (company.name?.toLowerCase().includes(searchQuery)) {
				results.push({
					id: company._id,
					type: "company",
					title: company.name || "Unnamed",
					subtitle: company.siren,
					score: 90,
				});
			}
		}

		// Quick search contacts
		const contacts = await ctx.db.query("contacts").take(100);
		for (const contact of contacts) {
			if (
				contact.fullName?.toLowerCase().includes(searchQuery) ||
				contact.email?.toLowerCase().includes(searchQuery)
			) {
				results.push({
					id: contact._id,
					type: "contact",
					title: contact.fullName || contact.email || "Unknown",
					subtitle: contact.role,
					score: 85,
				});
			}
		}

		// Quick search documents
		const documents = await ctx.db.query("colab_documents").take(100);
		for (const doc of documents) {
			if (doc.title?.toLowerCase().includes(searchQuery)) {
				results.push({
					id: doc._id,
					type: "document",
					title: doc.title || "Untitled",
					subtitle: "Document",
					score: 80,
				});
			}
		}

		// Sort and return
		results.sort((a, b) => b.score - a.score);
		return results.slice(0, limit).map(({ score: _score, ...rest }) => rest);
	},
});

/**
 * Get recent items for dashboard/quick access
 */
export const getRecentItems = query({
	args: {
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const user = await getOptionalUser(ctx);
		if (!user) return [];

		const limit = args.limit ?? 10;
		const results: Array<{
			id: string;
			type: SearchResultType;
			title: string;
			subtitle?: string;
			updatedAt: number;
		}> = [];

		// Recent deals
		const deals = await ctx.db
			.query("deals")
			.order("desc")
			.take(Math.ceil(limit / 3));

		for (const deal of deals) {
			results.push({
				id: deal._id,
				type: "deal",
				title: deal.title || "Untitled",
				subtitle: deal.leadName,
				updatedAt: deal.updatedAt || deal.createdAt || Date.now(),
			});
		}

		// Recent documents
		const documents = await ctx.db
			.query("colab_documents")
			.order("desc")
			.take(Math.ceil(limit / 3));

		for (const doc of documents) {
			results.push({
				id: doc._id,
				type: "document",
				title: doc.title || "Untitled",
				subtitle: "Document",
				updatedAt: doc.updatedAt || doc.createdAt || Date.now(),
			});
		}

		// Recent companies
		const companies = await ctx.db
			.query("companies")
			.order("desc")
			.take(Math.ceil(limit / 3));

		for (const company of companies) {
			results.push({
				id: company._id,
				type: "company",
				title: company.name || "Unnamed",
				subtitle: company.siren,
				updatedAt: company.updatedAt || company.createdAt || Date.now(),
			});
		}

		// Sort by updated time and limit
		results.sort((a, b) => b.updatedAt - a.updatedAt);
		return results.slice(0, limit);
	},
});
