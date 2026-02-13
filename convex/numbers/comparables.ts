import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Convex functions for Numbers - Comparable Companies Analysis
 */

// Save a comparables analysis
export const saveComparables = mutation({
  args: {
    id: v.optional(v.id("numbers_comparables")),
    dealId: v.optional(v.id("deals")),
    name: v.string(),
    targetName: v.string(),
    targetMetrics: v.object({
      revenue: v.number(),
      ebitda: v.number(),
      ebit: v.number(),
      netIncome: v.number(),
    }),
    comparables: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();

    if (args.id) {
      await ctx.db.patch(args.id, {
        name: args.name,
        targetName: args.targetName,
        targetMetrics: args.targetMetrics,
        comparables: args.comparables,
        updatedAt: now,
      });
      return args.id;
    }

    const id = await ctx.db.insert("numbers_comparables", {
      userId: user._id,
      dealId: args.dealId,
      name: args.name,
      targetName: args.targetName,
      targetMetrics: args.targetMetrics,
      comparables: args.comparables,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

// Get user's comparables analyses
export const getUserComparables = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (!user) {
      return [];
    }

    const analyses = await ctx.db
      .query("numbers_comparables")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit || 50);

    return analyses;
  },
});

// Get comparables for a deal
export const getDealComparables = query({
  args: {
    dealId: v.id("deals"),
  },
  handler: async (ctx, args) => {
    const analyses = await ctx.db
      .query("numbers_comparables")
      .withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
      .order("desc")
      .collect();

    return analyses;
  },
});
