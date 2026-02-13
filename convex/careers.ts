// Careers (Job Offers) CRUD Mutations
// Admin functions for managing job listings

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// QUERIES (Admin)
// ============================================

export const list = query({
	args: { includeUnpublished: v.optional(v.boolean()) },
	handler: async (ctx, args) => {
		let offers = await ctx.db.query("job_offers").collect();

		if (!args.includeUnpublished) {
			offers = offers.filter((o) => o.isPublished);
		}

		return offers.sort((a, b) => a.displayOrder - b.displayOrder);
	},
});

export const getById = query({
	args: { id: v.id("job_offers") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

// ============================================
// MUTATIONS
// ============================================

export const create = mutation({
	args: {
		slug: v.string(),
		title: v.string(),
		type: v.string(),
		location: v.string(),
		description: v.string(),
		requirements: v.optional(v.union(v.string(), v.array(v.string()))),
		contactEmail: v.optional(v.string()),
		pdfUrl: v.optional(v.string()),
		isPublished: v.boolean(),
	},
	handler: async (ctx, args) => {
		const offers = await ctx.db.query("job_offers").collect();
		const maxOrder =
			offers.length > 0 ? Math.max(...offers.map((o) => o.displayOrder)) : -1;

		return await ctx.db.insert("job_offers", {
			...args,
			displayOrder: maxOrder + 1,
		});
	},
});

export const update = mutation({
	args: {
		id: v.id("job_offers"),
		slug: v.optional(v.string()),
		title: v.optional(v.string()),
		type: v.optional(v.string()),
		location: v.optional(v.string()),
		description: v.optional(v.string()),
		requirements: v.optional(v.union(v.string(), v.array(v.string()))),
		contactEmail: v.optional(v.string()),
		pdfUrl: v.optional(v.string()),
		isPublished: v.optional(v.boolean()),
		displayOrder: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const { id, ...updates } = args;

		const cleanUpdates = Object.fromEntries(
			Object.entries(updates).filter(([, v]) => v !== undefined),
		);

		await ctx.db.patch(id, cleanUpdates);
		return id;
	},
});

export const remove = mutation({
	args: { id: v.id("job_offers") },
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
	},
});

export const togglePublished = mutation({
	args: { id: v.id("job_offers") },
	handler: async (ctx, args) => {
		const offer = await ctx.db.get(args.id);
		if (!offer) throw new Error("Job offer not found");

		await ctx.db.patch(args.id, { isPublished: !offer.isPublished });
	},
});
