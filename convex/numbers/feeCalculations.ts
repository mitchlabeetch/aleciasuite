import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Convex functions for Numbers - Fee Calculations
 */

// Save a fee calculation
export const saveFeeCalculation = mutation({
  args: {
    dealId: v.optional(v.id("deals")),
    clientName: v.string(),
    missionType: v.string(),
    date: v.string(),
    enterpriseValue: v.number(),
    debtAssumed: v.optional(v.number()),
    cashAvailable: v.optional(v.number()),
    transactionValue: v.number(),
    successFee: v.number(),
    retainerTotal: v.optional(v.number()),
    totalFees: v.number(),
    customRates: v.optional(
      v.object({
        rate1: v.number(),
        rate2: v.number(),
        rate3: v.number(),
        rate4: v.number(),
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

    const id = await ctx.db.insert("numbers_fee_calculations", {
      userId: user._id,
      dealId: args.dealId,
      clientName: args.clientName,
      missionType: args.missionType,
      date: args.date,
      enterpriseValue: args.enterpriseValue,
      debtAssumed: args.debtAssumed,
      cashAvailable: args.cashAvailable,
      transactionValue: args.transactionValue,
      successFee: args.successFee,
      retainerTotal: args.retainerTotal,
      totalFees: args.totalFees,
      customRates: args.customRates,
      createdAt: Date.now(),
    });

    return id;
  },
});

// Get user's fee calculations
export const getUserFeeCalculations = query({
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

    const calculations = await ctx.db
      .query("numbers_fee_calculations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit || 50);

    return calculations;
  },
});

// Get fee calculations for a specific deal
export const getDealFeeCalculations = query({
  args: {
    dealId: v.id("deals"),
  },
  handler: async (ctx, args) => {
    const calculations = await ctx.db
      .query("numbers_fee_calculations")
      .withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
      .order("desc")
      .collect();

    return calculations;
  },
});
