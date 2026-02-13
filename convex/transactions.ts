// Transactions CRUD Mutations
// Admin functions for managing M&A track record

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// QUERIES (Admin)
// ============================================

export const list = query({
  args: {},
  handler: async (ctx) => {
    const transactions = await ctx.db.query("transactions").collect();
    return transactions.sort((a, b) => {
      if (a.displayOrder !== b.displayOrder)
        return a.displayOrder - b.displayOrder;
      return b.year - a.year;
    });
  },
});

export const getById = query({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByDeal = query({
  args: { dealId: v.id("deals") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transactions")
      .withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
      .first();
  },
});

// ============================================
// MUTATIONS
// ============================================

export const create = mutation({
  args: {
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
    isClientConfidential: v.optional(v.boolean()),
    isAcquirerConfidential: v.optional(v.boolean()),
    isPriorExperience: v.boolean(),
    context: v.optional(v.string()),
    intervention: v.optional(v.string()),
    result: v.optional(v.string()),
    testimonialText: v.optional(v.string()),
    testimonialAuthor: v.optional(v.string()),
    roleType: v.optional(v.string()),
    dealSize: v.optional(v.string()),
    dealId: v.optional(v.id("deals")),
    keyMetrics: v.optional(
      v.record(
        v.string(),
        v.union(v.string(), v.number(), v.boolean(), v.null()),
      ),
    ),
  },
  handler: async (ctx, args) => {
    // Get max display order
    const transactions = await ctx.db.query("transactions").collect();
    const maxOrder =
      transactions.length > 0
        ? Math.max(...transactions.map((t) => t.displayOrder))
        : -1;

    return await ctx.db.insert("transactions", {
      ...args,
      displayOrder: maxOrder + 1,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("transactions"),
    slug: v.optional(v.string()),
    clientName: v.optional(v.string()),
    clientLogo: v.optional(v.string()),
    acquirerName: v.optional(v.string()),
    acquirerLogo: v.optional(v.string()),
    sector: v.optional(v.string()),
    region: v.optional(v.string()),
    year: v.optional(v.number()),
    mandateType: v.optional(v.string()),
    description: v.optional(v.string()),
    isConfidential: v.optional(v.boolean()),
    isClientConfidential: v.optional(v.boolean()),
    isAcquirerConfidential: v.optional(v.boolean()),
    isPriorExperience: v.optional(v.boolean()),
    context: v.optional(v.string()),
    intervention: v.optional(v.string()),
    result: v.optional(v.string()),
    testimonialText: v.optional(v.string()),
    testimonialAuthor: v.optional(v.string()),
    roleType: v.optional(v.string()),
    dealSize: v.optional(v.string()),
    dealId: v.optional(v.id("deals")),
    keyMetrics: v.optional(
      v.record(
        v.string(),
        v.union(v.string(), v.number(), v.boolean(), v.null()),
      ),
    ),
    displayOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined),
    );

    await ctx.db.patch(id, cleanUpdates);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const reorder = mutation({
  args: {
    orderedIds: v.array(v.id("transactions")),
  },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.orderedIds.length; i++) {
      await ctx.db.patch(args.orderedIds[i], { displayOrder: i });
    }
  },
});

export const duplicate = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.id);
    if (!original) throw new Error("Transaction not found");

    const transactions = await ctx.db.query("transactions").collect();
    const maxOrder = Math.max(...transactions.map((t) => t.displayOrder), -1);

    const { _id, _creationTime, ...data } = original;

    return await ctx.db.insert("transactions", {
      ...data,
      slug: `${data.slug}-copy`,
      displayOrder: maxOrder + 1,
    });
  },
});
