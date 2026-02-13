/**
 * Data Import Script
 *
 * Imports data from JSONL files in /data directory to Convex tables:
 * - team_members.jsonl → team_members table
 * - transactions.jsonl → transactions table
 * - blog_posts.jsonl → blog_posts table
 * - job_offers.jsonl → job_offers table
 *
 * Run with: npx convex run importData:importAll
 */

import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Team Members Import
export const importTeamMembers = internalMutation({
	args: {
		members: v.array(
			v.object({
				slug: v.string(),
				name: v.string(),
				role: v.string(),
				photo: v.optional(v.string()),
				bioFr: v.optional(v.string()),
				bioEn: v.optional(v.string()),
				linkedinUrl: v.optional(v.string()),
				email: v.optional(v.string()),
				sectorsExpertise: v.optional(v.array(v.string())),
				transactionSlugs: v.optional(v.array(v.string())),
				displayOrder: v.number(),
				isActive: v.boolean(),
			}),
		),
	},
	handler: async (ctx, { members }) => {
		let imported = 0;
		let skipped = 0;

		for (const member of members) {
			// Check if already exists
			const existing = await ctx.db
				.query("team_members")
				.withIndex("by_slug", (q) => q.eq("slug", member.slug))
				.first();

			if (existing) {
				skipped++;
				continue;
			}

			await ctx.db.insert("team_members", {
				...member,
				sectorsExpertise: member.sectorsExpertise || [],
				transactionSlugs: member.transactionSlugs || [],
			});
			imported++;
		}

		return { imported, skipped, total: members.length };
	},
});

// Transactions Import
export const importTransactions = internalMutation({
	args: {
		transactions: v.array(
			v.object({
				slug: v.string(),
				clientName: v.string(),
				clientLogo: v.optional(v.string()),
				acquirerName: v.optional(v.string()),
				acquirerLogo: v.optional(v.string()),
				sector: v.string(),
				region: v.optional(v.string()),
				year: v.number(),
				mandateType: v.string(),
				description: v.optional(v.string()),
				isConfidential: v.boolean(),
				isPriorExperience: v.boolean(),
				context: v.optional(v.string()),
				intervention: v.optional(v.string()),
				result: v.optional(v.string()),
				testimonialText: v.optional(v.string()),
				testimonialAuthor: v.optional(v.string()),
				roleType: v.optional(v.string()),
				dealSize: v.optional(v.string()),
				keyMetrics: v.optional(v.any()),
				isCaseStudy: v.optional(v.boolean()),
				displayOrder: v.number(),
			}),
		),
	},
	handler: async (ctx, { transactions }) => {
		let imported = 0;
		let skipped = 0;

		for (const transaction of transactions) {
			// Check if already exists
			const existing = await ctx.db
				.query("transactions")
				.withIndex("by_slug", (q) => q.eq("slug", transaction.slug))
				.first();

			if (existing) {
				skipped++;
				continue;
			}

			await ctx.db.insert("transactions", transaction);
			imported++;
		}

		return { imported, skipped, total: transactions.length };
	},
});

// Blog Posts Import
export const importBlogPosts = internalMutation({
	args: {
		posts: v.array(
			v.object({
				title: v.string(),
				slug: v.string(),
				content: v.string(),
				excerpt: v.optional(v.string()),
				featuredImage: v.optional(v.string()),
				coverImage: v.optional(v.string()),
				category: v.optional(v.string()),
				status: v.union(
					v.literal("draft"),
					v.literal("published"),
					v.literal("archived"),
				),
				publishedAt: v.optional(v.number()),
				seoTitle: v.optional(v.string()),
				seoDescription: v.optional(v.string()),
				tags: v.optional(v.array(v.string())),
			}),
		),
	},
	handler: async (ctx, { posts }) => {
		let imported = 0;
		let skipped = 0;

		for (const post of posts) {
			// Check if already exists
			const existing = await ctx.db
				.query("blog_posts")
				.withIndex("by_slug", (q) => q.eq("slug", post.slug))
				.first();

			if (existing) {
				skipped++;
				continue;
			}

			await ctx.db.insert("blog_posts", post);
			imported++;
		}

		return { imported, skipped, total: posts.length };
	},
});

// Job Offers Import
export const importJobOffers = internalMutation({
	args: {
		offers: v.array(
			v.object({
				slug: v.string(),
				title: v.string(),
				type: v.string(),
				location: v.string(),
				description: v.string(),
				requirements: v.optional(v.union(v.string(), v.array(v.string()))),
				contactEmail: v.optional(v.string()),
				pdfUrl: v.optional(v.string()),
				isPublished: v.boolean(),
				displayOrder: v.number(),
			}),
		),
	},
	handler: async (ctx, { offers }) => {
		let imported = 0;
		let skipped = 0;

		for (const offer of offers) {
			// Check if already exists
			const existing = await ctx.db
				.query("job_offers")
				.withIndex("by_slug", (q) => q.eq("slug", offer.slug))
				.first();

			if (existing) {
				skipped++;
				continue;
			}

			await ctx.db.insert("job_offers", offer);
			imported++;
		}

		return { imported, skipped, total: offers.length };
	},
});

// Master Import Function
export const importAll = internalMutation({
	args: {},
	handler: async (ctx) => {
		// This is a placeholder - actual data will be passed via CLI
		// Use: npx convex run importData:importTeamMembers --args '{"members": [...]}'
		return {
			message: "Use individual import functions with data from JSONL files",
			functions: [
				"importData:importTeamMembers",
				"importData:importTransactions",
				"importData:importBlogPosts",
				"importData:importJobOffers",
			],
		};
	},
});
