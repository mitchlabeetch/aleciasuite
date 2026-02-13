// Marketing Website Public Queries
// No authentication required - for public website pages

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { logger } from "./lib/logger";

// ============================================
// TRANSACTIONS (Track Record)
// ============================================

export const getTransactions = query({
	args: {
		sector: v.optional(v.string()),
		year: v.optional(v.number()),
		mandateType: v.optional(v.string()),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		let transactions = await ctx.db.query("transactions").collect();

		// Filter by sector
		if (args.sector) {
			transactions = transactions.filter((t) => t.sector === args.sector);
		}

		// Filter by year
		if (args.year) {
			transactions = transactions.filter((t) => t.year === args.year);
		}

		// Filter by mandate type
		if (args.mandateType) {
			transactions = transactions.filter(
				(t) => t.mandateType === args.mandateType,
			);
		}

		// Sort by display order, then by year descending
		transactions.sort((a, b) => {
			if (a.displayOrder !== b.displayOrder) {
				return a.displayOrder - b.displayOrder;
			}
			return b.year - a.year;
		});

		// Limit results
		if (args.limit) {
			transactions = transactions.slice(0, args.limit);
		}

		return transactions;
	},
});

export const getTransactionBySlug = query({
	args: { slug: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("transactions")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.first();
	},
});

export const getTransactionFilters = query({
	args: {},
	handler: async (ctx) => {
		const transactions = await ctx.db.query("transactions").collect();

		// Extract unique values for filters
		const sectors = [...new Set(transactions.map((t) => t.sector))].sort();
		const years = [...new Set(transactions.map((t) => t.year))].sort(
			(a, b) => b - a,
		);
		const mandateTypes = [
			...new Set(transactions.map((t) => t.mandateType)),
		].sort();
		const regions = [
			...new Set(transactions.map((t) => t.region).filter(Boolean)),
		].sort();

		return { sectors, years, mandateTypes, regions };
	},
});

// ============================================
// TEAM MEMBERS
// ============================================

export const getTeamMembers = query({
	args: { activeOnly: v.optional(v.boolean()) },
	handler: async (ctx, args) => {
		let members = await ctx.db.query("team_members").collect();

		// Filter active only (default: true)
		if (args.activeOnly !== false) {
			members = members.filter((m) => m.isActive);
		}

		// Sort by display order
		members.sort((a, b) => a.displayOrder - b.displayOrder);

		return members;
	},
});

export const getTeamMemberBySlug = query({
	args: { slug: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("team_members")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.first();
	},
});

// ============================================
// BLOG POSTS
// ============================================

export const getBlogPosts = query({
	args: {
		status: v.optional(v.string()),
		category: v.optional(v.string()),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		let posts = await ctx.db.query("blog_posts").collect();

		// Filter by status (default: published)
		const targetStatus = args.status || "published";
		posts = posts.filter((p) => p.status === targetStatus);

		// Filter by category
		if (args.category) {
			posts = posts.filter((p) => p.category === args.category);
		}

		// Sort by published date descending
		posts.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0));

		// Limit results
		if (args.limit) {
			posts = posts.slice(0, args.limit);
		}

		return posts;
	},
});

export const getBlogPostBySlug = query({
	args: { slug: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("blog_posts")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.first();
	},
});

export const getBlogCategories = query({
	args: {},
	handler: async (ctx) => {
		const posts = await ctx.db.query("blog_posts").collect();
		return [...new Set(posts.map((p) => p.category).filter(Boolean))].sort();
	},
});

// ============================================
// JOB OFFERS (Careers)
// ============================================

export const getJobOffers = query({
	args: { publishedOnly: v.optional(v.boolean()) },
	handler: async (ctx, args) => {
		let offers = await ctx.db.query("job_offers").collect();

		// Filter published only (default: true for public site)
		if (args.publishedOnly !== false) {
			offers = offers.filter((o) => o.isPublished);
		}

		// Sort by display order
		offers.sort((a, b) => a.displayOrder - b.displayOrder);

		return offers;
	},
});

export const getJobOfferBySlug = query({
	args: { slug: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("job_offers")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.first();
	},
});

// ============================================
// MARKETING TILES (Gallery)
// ============================================

// ============================================
// FORUM CATEGORIES (Public)
// ============================================

export const getForumCategories = query({
	args: { includePrivate: v.optional(v.boolean()) },
	handler: async (ctx, args) => {
		let categories = await ctx.db.query("forum_categories").collect();

		// Filter out private (default: exclude private)
		if (!args.includePrivate) {
			categories = categories.filter((c) => !c.isPrivate);
		}

		// Sort by order
		categories.sort((a, b) => a.order - b.order);

		return categories;
	},
});

// ============================================
// GLOBAL CONFIG
// ============================================

export const getConfig = query({
	args: { key: v.string() },
	handler: async (ctx, args) => {
		const config = await ctx.db
			.query("global_config")
			.withIndex("by_key", (q) => q.eq("key", args.key))
			.first();
		return config?.value;
	},
});

export const getAllConfig = query({
	args: {},
	handler: async (ctx) => {
		const configs = await ctx.db.query("global_config").collect();
		const result: Record<string, unknown> = {};
		for (const c of configs) {
			result[c.key] = c.value;
		}
		return result;
	},
});

// ============================================
// MARKETING KPIS (Admin Configurable) - Board Requirement
// ============================================

export const getMarketingKPIs = query({
	args: { locale: v.optional(v.string()) },
	handler: async (ctx, args) => {
		const kpis = await ctx.db.query("marketing_kpis").collect();

		// Filter active only and sort by display order
		const activeKpis = kpis
			.filter((k) => k.isActive)
			.sort((a, b) => a.displayOrder - b.displayOrder);

		// Map to include localized labels
		const locale = args.locale || "fr";
		return activeKpis.map((kpi) => ({
			...kpi,
			label: locale === "en" ? kpi.labelEn : kpi.labelFr,
		}));
	},
});

export const getAllMarketingKPIs = query({
	args: {},
	handler: async (ctx) => {
		const kpis = await ctx.db.query("marketing_kpis").collect();
		return kpis.sort((a, b) => a.displayOrder - b.displayOrder);
	},
});

export const upsertMarketingKPI = mutation({
	args: {
		key: v.string(),
		icon: v.string(),
		value: v.number(),
		suffix: v.optional(v.string()),
		prefix: v.optional(v.string()),
		labelFr: v.string(),
		labelEn: v.string(),
		displayOrder: v.number(),
		isActive: v.boolean(),
	},
	handler: async (ctx, args) => {
		// Check if KPI with this key exists
		const existing = await ctx.db
			.query("marketing_kpis")
			.withIndex("by_key", (q) => q.eq("key", args.key))
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, args);
			logger.info("Updated marketing KPI", { key: args.key });
			return existing._id;
		} else {
			const id = await ctx.db.insert("marketing_kpis", args);
			logger.info("Created marketing KPI", { key: args.key });
			return id;
		}
	},
});

export const deleteMarketingKPI = mutation({
	args: { key: v.string() },
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("marketing_kpis")
			.withIndex("by_key", (q) => q.eq("key", args.key))
			.first();

		if (existing) {
			await ctx.db.delete(existing._id);
			logger.info("Deleted marketing KPI", { key: args.key });
		}
	},
});

// Seed default KPIs if none exist
export const seedMarketingKPIs = mutation({
	args: {},
	handler: async (ctx) => {
		const existing = await ctx.db.query("marketing_kpis").collect();

		if (existing.length > 0) {
			logger.info("Marketing KPIs already exist, skipping seed");
			return;
		}

		const defaultKPIs = [
			{
				key: "valuations",
				icon: "TrendingUp",
				value: 50,
				suffix: " m€+",
				labelFr: "Valorisations conseillées",
				labelEn: "Advised Valuations",
				displayOrder: 1,
				isActive: true,
			},
			{
				key: "operations",
				icon: "Briefcase",
				value: 45,
				suffix: "+",
				labelFr: "Opérations réalisées",
				labelEn: "Completed Transactions",
				displayOrder: 2,
				isActive: true,
			},
			{
				key: "sectors",
				icon: "Building2",
				value: 9,
				labelFr: "Secteurs d'activité",
				labelEn: "Business Sectors",
				displayOrder: 3,
				isActive: true,
			},
			{
				key: "offices",
				icon: "MapPin",
				value: 5,
				labelFr: "Bureaux en France",
				labelEn: "Offices in France",
				displayOrder: 4,
				isActive: true,
			},
		];

		for (const kpi of defaultKPIs) {
			await ctx.db.insert("marketing_kpis", kpi);
		}

		logger.info("Seeded default marketing KPIs", { count: defaultKPIs.length });
	},
});

// ============================================
// LOCATION IMAGES (Interactive Map) - Board Requirement
// ============================================

export const getLocationImages = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("location_images").collect();
	},
});

export const upsertLocationImage = mutation({
	args: {
		locationId: v.string(),
		imageUrl: v.string(),
		altText: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("location_images")
			.withIndex("by_locationId", (q) => q.eq("locationId", args.locationId))
			.first();

		const data = {
			locationId: args.locationId,
			imageUrl: args.imageUrl,
			altText: args.altText,
			updatedAt: Date.now(),
		};

		if (existing) {
			await ctx.db.patch(existing._id, data);
			return existing._id;
		} else {
			return await ctx.db.insert("location_images", data);
		}
	},
});

// ============================================
// SEED V3 DATA (One-off migration)
// ============================================
export const seedV3Data = mutation({
	args: {},
	handler: async (ctx) => {
		// 1. UPDATE TEAM MEMBERS - Link transaction slugs
		const teamUpdates = [
			{ slug: "christophe-berthon" },
			{ slug: "gregory-colin" },
			{ slug: "martin-egasse" },
			{ slug: "tristan-cossec" },
			{ slug: "serge-de-fay" },
			{ slug: "jerome-berthiau" },
			{ slug: "louise-pini" },
			{ slug: "mickael-furet" },
		];

		for (const update of teamUpdates) {
			const member = await ctx.db
				.query("team_members")
				.withIndex("by_slug", (q) => q.eq("slug", update.slug))
				.first();

			if (member) {
				// Link some sample deals based on sector or just random selection for enrichment
				const deals = await ctx.db.query("transactions").collect();
				const memberDeals = deals
					.filter((d) => d.displayOrder % 4 === teamUpdates.indexOf(update) % 4)
					.slice(0, 5)
					.map((d) => d.slug);

				await ctx.db.patch(member._id, {
					transactionSlugs: memberDeals,
				});
				logger.info("Updated team member", {
					slug: update.slug,
					dealCount: memberDeals.length,
				});
			}
		}

		// 2. TAG TRANSACTIONS AS CASE STUDIES
		const caseStudySectors = [
			"Industrie",
			"TMT",
			"Agroalimentaire",
			"Santé",
			"Immobilier",
			"Services",
		];

		for (const sectorName of caseStudySectors) {
			const deal = await ctx.db
				.query("transactions")
				.withIndex("by_sector", (q) => q.eq("sector", sectorName))
				.first();

			if (deal) {
				await ctx.db.patch(deal._id, {
					isCaseStudy: true,
					context:
						"Accompagnement stratégique dans un contexte de consolidation sectorielle.",
					intervention:
						"Pilotage complet du process : mémorandum, dataroom, négociation finale.",
					result:
						"Cession réalisée avec succès auprès d'un acteur majeur du secteur.",
				});
				logger.info("Marked deal as Case Study", {
					clientName: deal.clientName,
					sector: sectorName,
				});
			}
		}
	},
});
