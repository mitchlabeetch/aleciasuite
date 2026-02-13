import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Convex functions for Numbers - Financial Models
 */

// Save a financial model
export const saveFinancialModel = mutation({
  args: {
    id: v.optional(v.id("numbers_financial_models")),
    dealId: v.optional(v.id("deals")),
    name: v.string(),
    companyName: v.string(),
    years: v.array(v.any()),
    assumptions: v.optional(
      v.object({
        projectionYears: v.number(),
        growthRate: v.number(),
        marginImprovement: v.number(),
      }),
    ),
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

    // Update existing or create new
    if (args.id) {
      await ctx.db.patch(args.id, {
        name: args.name,
        companyName: args.companyName,
        years: args.years,
        assumptions: args.assumptions,
        updatedAt: now,
      });
      return args.id;
    }

    const id = await ctx.db.insert("numbers_financial_models", {
      userId: user._id,
      dealId: args.dealId,
      name: args.name,
      companyName: args.companyName,
      years: args.years,
      assumptions: args.assumptions,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

// Get user's financial models
export const getUserFinancialModels = query({
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

    const models = await ctx.db
      .query("numbers_financial_models")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit || 50);

    return models;
  },
});

// Get a specific financial model
export const getFinancialModel = query({
  args: {
    id: v.id("numbers_financial_models"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get financial models for a deal
export const getDealFinancialModels = query({
  args: {
    dealId: v.id("deals"),
  },
  handler: async (ctx, args) => {
    const models = await ctx.db
      .query("numbers_financial_models")
      .withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
      .order("desc")
      .collect();

    return models;
  },
});

// Delete a financial model
export const deleteFinancialModel = mutation({
  args: {
    id: v.id("numbers_financial_models"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const model = await ctx.db.get(args.id);
    if (!model) {
      throw new Error("Model not found");
    }

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (!user || model.userId !== user._id) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.id);
  },
});
