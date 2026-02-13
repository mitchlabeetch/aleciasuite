/**
 * Import backup data from JSONL files
 * Run with: node scripts/import-backup.mjs
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Import transactions
export const importTransactions = mutation({
	args: {
		data: v.array(v.any()),
	},
	handler: async (ctx, { data }) => {
		let imported = 0;
		for (const item of data) {
			const { _id, _creationTime, ...doc } = item;
			await ctx.db.insert("transactions", doc);
			imported++;
		}
		return { imported, total: data.length };
	},
});

// Import blog posts
export const importBlogPosts = mutation({
	args: {
		data: v.array(v.any()),
	},
	handler: async (ctx, { data }) => {
		let imported = 0;
		for (const item of data) {
			const { _id, _creationTime, ...doc } = item;
			await ctx.db.insert("blog_posts", doc);
			imported++;
		}
		return { imported, total: data.length };
	},
});

// Import team members
export const importTeamMembers = mutation({
	args: {
		data: v.array(v.any()),
	},
	handler: async (ctx, { data }) => {
		let imported = 0;
		for (const item of data) {
			const { _id, _creationTime, ...doc } = item;
			await ctx.db.insert("team_members", doc);
			imported++;
		}
		return { imported, total: data.length };
	},
});

// Import job offers
export const importJobOffers = mutation({
	args: {
		data: v.array(v.any()),
	},
	handler: async (ctx, { data }) => {
		let imported = 0;
		for (const item of data) {
			const { _id, _creationTime, ...doc } = item;
			await ctx.db.insert("job_offers", doc);
			imported++;
		}
		return { imported, total: data.length };
	},
});

// Import users
export const importUsers = mutation({
	args: {
		data: v.array(v.any()),
	},
	handler: async (ctx, { data }) => {
		let imported = 0;
		for (const item of data) {
			const { _id, _creationTime, ...doc } = item;
			await ctx.db.insert("users", doc);
			imported++;
		}
		return { imported, total: data.length };
	},
});

// Import marketing KPIs
export const importMarketingKpis = mutation({
	args: {
		data: v.array(v.any()),
	},
	handler: async (ctx, { data }) => {
		let imported = 0;
		for (const item of data) {
			const { _id, _creationTime, ...doc } = item;
			await ctx.db.insert("marketing_kpis", doc);
			imported++;
		}
		return { imported, total: data.length };
	},
});

// Import global config
export const importGlobalConfig = mutation({
	args: {
		data: v.array(v.any()),
	},
	handler: async (ctx, { data }) => {
		let imported = 0;
		for (const item of data) {
			const { _id, _creationTime, ...doc } = item;
			await ctx.db.insert("global_config", doc);
			imported++;
		}
		return { imported, total: data.length };
	},
});

// Import forum categories
export const importForumCategories = mutation({
	args: {
		data: v.array(v.any()),
	},
	handler: async (ctx, { data }) => {
		let imported = 0;
		for (const item of data) {
			const { _id, _creationTime, ...doc } = item;
			await ctx.db.insert("forum_categories", doc);
			imported++;
		}
		return { imported, total: data.length };
	},
});

// Update blog post content by slug (for migrations)
export const updateBlogPostContent = mutation({
	args: {
		slug: v.string(),
		content: v.string(),
	},
	handler: async (ctx, { slug, content }) => {
		const post = await ctx.db
			.query("blog_posts")
			.withIndex("by_slug", (q) => q.eq("slug", slug))
			.first();

		if (!post) {
			throw new Error(`Blog post not found: ${slug}`);
		}

		await ctx.db.patch(post._id, { content });
		return { slug, updated: true };
	},
});
