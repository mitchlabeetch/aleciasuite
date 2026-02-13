import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Convex functions for Numbers - Post-Deal Integration
 */

// Save post-deal integration data
export const savePostDeal = mutation({
  args: {
    id: v.optional(v.id("numbers_post_deal")),
    dealId: v.optional(v.id("deals")),
    name: v.string(),
    closingDate: v.optional(v.string()),
    tasks: v.array(v.any()),
    totalSynergiesTarget: v.optional(v.number()),
    realizedSynergies: v.optional(v.number()),
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
        closingDate: args.closingDate,
        tasks: args.tasks,
        totalSynergiesTarget: args.totalSynergiesTarget,
        realizedSynergies: args.realizedSynergies,
        updatedAt: now,
      });
      return args.id;
    }

    const id = await ctx.db.insert("numbers_post_deal", {
      userId: user._id,
      dealId: args.dealId,
      name: args.name,
      closingDate: args.closingDate,
      tasks: args.tasks,
      totalSynergiesTarget: args.totalSynergiesTarget,
      realizedSynergies: args.realizedSynergies,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

// Get user's post-deal data
export const getUserPostDeal = query({
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

    const postDeal = await ctx.db
      .query("numbers_post_deal")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit || 50);

    return postDeal;
  },
});

// Get post-deal for a specific deal
export const getDealPostDeal = query({
  args: {
    dealId: v.id("deals"),
  },
  handler: async (ctx, args) => {
    const postDeal = await ctx.db
      .query("numbers_post_deal")
      .withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
      .order("desc")
      .collect();

    return postDeal;
  },
});
