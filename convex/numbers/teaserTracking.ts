import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Convex functions for Numbers - Teaser/IM Tracking
 */

// Save teaser tracking data
export const saveTeaserTracking = mutation({
  args: {
    id: v.optional(v.id("numbers_teaser_tracking")),
    dealId: v.optional(v.id("deals")),
    name: v.string(),
    buyers: v.array(v.any()),
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
        buyers: args.buyers,
        updatedAt: now,
      });
      return args.id;
    }

    const id = await ctx.db.insert("numbers_teaser_tracking", {
      userId: user._id,
      dealId: args.dealId,
      name: args.name,
      buyers: args.buyers,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

// Get user's teaser tracking data
export const getUserTeaserTracking = query({
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

    const tracking = await ctx.db
      .query("numbers_teaser_tracking")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit || 50);

    return tracking;
  },
});

// Get teaser tracking for a deal
export const getDealTeaserTracking = query({
  args: {
    dealId: v.id("deals"),
  },
  handler: async (ctx, args) => {
    const tracking = await ctx.db
      .query("numbers_teaser_tracking")
      .withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
      .order("desc")
      .collect();

    return tracking;
  },
});
