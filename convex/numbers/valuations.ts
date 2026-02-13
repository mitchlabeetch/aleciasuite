import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Convex functions for Numbers - Valuation Multiples
 */

// Save a valuation analysis
export const saveValuation = mutation({
  args: {
    id: v.optional(v.id("numbers_valuations")),
    dealId: v.optional(v.id("deals")),
    name: v.string(),
    targetCompany: v.object({
      name: v.string(),
      sector: v.string(),
      revenue: v.number(),
      ebitda: v.number(),
      ebit: v.number(),
      netIncome: v.number(),
      netDebt: v.number(),
      cash: v.number(),
      equity: v.number(),
    }),
    comparables: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        country: v.string(),
        ev: v.number(),
        revenue: v.number(),
        ebitda: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user from database
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

    // Update existing or create new
    if (args.id) {
      const existing = await ctx.db.get(args.id);
      if (!existing || existing.userId !== user._id) {
        throw new Error("Valuation not found or access denied");
      }

      await ctx.db.patch(args.id, {
        name: args.name,
        dealId: args.dealId,
        targetCompany: args.targetCompany,
        comparables: args.comparables,
        updatedAt: now,
      });

      return args.id;
    }

    // Create new valuation
    const id = await ctx.db.insert("numbers_valuations", {
      userId: user._id,
      dealId: args.dealId,
      name: args.name,
      targetCompany: args.targetCompany,
      comparables: args.comparables,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

// Get user's valuations
export const getUserValuations = query({
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

    const valuations = await ctx.db
      .query("numbers_valuations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit || 50);

    return valuations;
  },
});

// Get a specific valuation by ID
export const getValuation = query({
  args: {
    id: v.id("numbers_valuations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (!user) {
      return null;
    }

    const valuation = await ctx.db.get(args.id);
    if (!valuation || valuation.userId !== user._id) {
      return null;
    }

    return valuation;
  },
});

// Get valuations for a specific deal
export const getDealValuations = query({
  args: {
    dealId: v.id("deals"),
  },
  handler: async (ctx, args) => {
    const valuations = await ctx.db
      .query("numbers_valuations")
      .withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
      .order("desc")
      .collect();

    return valuations;
  },
});

// Delete a valuation
export const deleteValuation = mutation({
  args: {
    id: v.id("numbers_valuations"),
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

    const valuation = await ctx.db.get(args.id);
    if (!valuation || valuation.userId !== user._id) {
      throw new Error("Valuation not found or access denied");
    }

    await ctx.db.delete(args.id);
    return true;
  },
});
