import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Convex functions for Numbers - Deal Timelines
 */

// Save a timeline
export const saveTimeline = mutation({
  args: {
    id: v.optional(v.id("numbers_timelines")),
    dealId: v.optional(v.id("deals")),
    name: v.string(),
    closingDate: v.optional(v.string()),
    tasks: v.array(v.any()),
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
        updatedAt: now,
      });
      return args.id;
    }

    const id = await ctx.db.insert("numbers_timelines", {
      userId: user._id,
      dealId: args.dealId,
      name: args.name,
      closingDate: args.closingDate,
      tasks: args.tasks,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

// Get user's timelines
export const getUserTimelines = query({
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

    const timelines = await ctx.db
      .query("numbers_timelines")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit || 50);

    return timelines;
  },
});

// Get timelines for a deal
export const getDealTimelines = query({
  args: {
    dealId: v.id("deals"),
  },
  handler: async (ctx, args) => {
    const timelines = await ctx.db
      .query("numbers_timelines")
      .withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
      .order("desc")
      .collect();

    return timelines;
  },
});
