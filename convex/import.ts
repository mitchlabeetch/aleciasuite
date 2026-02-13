// Convex Import Mutation for Neon Migration
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Import Transactions
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
				keyMetrics: v.optional(
					v.record(
						v.string(),
						v.union(v.string(), v.number(), v.boolean(), v.null()),
					),
				),
				displayOrder: v.number(),
			}),
		),
	},
	handler: async (ctx, args) => {
		let count = 0;
		for (const t of args.transactions) {
			// Check if already exists by slug
			const existing = await ctx.db
				.query("transactions")
				.withIndex("by_slug", (q) => q.eq("slug", t.slug))
				.first();

			if (!existing) {
				await ctx.db.insert("transactions", t);
				count++;
			}
		}
		return { imported: count, skipped: args.transactions.length - count };
	},
});

// Import Team Members
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
				sectorsExpertise: v.array(v.string()),
				transactionSlugs: v.array(v.string()),
				displayOrder: v.number(),
				isActive: v.boolean(),
			}),
		),
	},
	handler: async (ctx, args) => {
		let count = 0;
		for (const m of args.members) {
			const existing = await ctx.db
				.query("team_members")
				.withIndex("by_slug", (q) => q.eq("slug", m.slug))
				.first();

			if (!existing) {
				await ctx.db.insert("team_members", m);
				count++;
			}
		}
		return { imported: count, skipped: args.members.length - count };
	},
});

// Import Blog Posts
export const importBlogPosts = internalMutation({
	args: {
		posts: v.array(
			v.object({
				title: v.string(),
				slug: v.string(),
				content: v.string(),
				excerpt: v.optional(v.string()),
				status: v.union(
					v.literal("draft"),
					v.literal("published"),
					v.literal("archived"),
				),
				publishedAt: v.optional(v.number()),
				tags: v.optional(v.array(v.string())),
			}),
		),
	},
	handler: async (ctx, args) => {
		let count = 0;
		for (const p of args.posts) {
			const existing = await ctx.db
				.query("blog_posts")
				.withIndex("by_slug", (q) => q.eq("slug", p.slug))
				.first();

			if (!existing) {
				await ctx.db.insert("blog_posts", p);
				count++;
			}
		}
		return { imported: count, skipped: args.posts.length - count };
	},
});

// Promote user (called from CLI or logic)
export const promoteUserInternal = internalMutation({
	args: {
		userId: v.id("users"),
		role: v.union(
			v.literal("sudo"),
			v.literal("partner"),
			v.literal("advisor"),
		),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.userId, { role: args.role });
		return { success: true, user: args.userId, newRole: args.role };
	},
});
// Patch Transaction Logos
export const patchTransactionLogos = internalMutation({
	args: {
		updates: v.array(
			v.object({
				slug: v.string(),
				clientLogo: v.optional(v.string()),
				acquirerLogo: v.optional(v.string()),
			}),
		),
	},
	handler: async (ctx, args) => {
		let count = 0;
		for (const update of args.updates) {
			const existing = await ctx.db
				.query("transactions")
				.withIndex("by_slug", (q) => q.eq("slug", update.slug))
				.first();

			if (existing) {
				await ctx.db.patch(existing._id, {
					clientLogo: update.clientLogo,
					acquirerLogo: update.acquirerLogo,
				});
				count++;
			}
		}
		return { patched: count };
	},
});
