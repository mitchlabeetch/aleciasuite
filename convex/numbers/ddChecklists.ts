import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Convex functions for Numbers - Due Diligence Checklists
 */

const ddItemValidator = v.object({
  id: v.string(),
  category: v.string(),
  item: v.string(),
  status: v.union(
    v.literal("todo"),
    v.literal("in_progress"),
    v.literal("completed"),
    v.literal("blocked"),
  ),
  priority: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
  responsible: v.string(),
  dueDate: v.string(),
  completedDate: v.string(),
  documents: v.string(),
  comments: v.string(),
  redFlag: v.boolean(),
});

const ddCategoryValidator = v.object({
  id: v.string(),
  name: v.string(),
  icon: v.string(),
  items: v.array(ddItemValidator),
});

// Save a DD checklist
export const saveDDChecklist = mutation({
  args: {
    id: v.optional(v.id("numbers_dd_checklists")),
    dealId: v.optional(v.id("deals")),
    name: v.string(),
    categories: v.array(ddCategoryValidator),
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
        throw new Error("Checklist not found or access denied");
      }

      await ctx.db.patch(args.id, {
        name: args.name,
        dealId: args.dealId,
        categories: args.categories,
        updatedAt: now,
      });

      return args.id;
    }

    // Create new checklist
    const id = await ctx.db.insert("numbers_dd_checklists", {
      userId: user._id,
      dealId: args.dealId,
      name: args.name,
      categories: args.categories,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

// Get user's DD checklists
export const getUserDDChecklists = query({
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

    const checklists = await ctx.db
      .query("numbers_dd_checklists")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit || 50);

    return checklists;
  },
});

// Get a specific DD checklist by ID
export const getDDChecklist = query({
  args: {
    id: v.id("numbers_dd_checklists"),
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

    const checklist = await ctx.db.get(args.id);
    if (!checklist || checklist.userId !== user._id) {
      return null;
    }

    return checklist;
  },
});

// Get DD checklists for a specific deal
export const getDealDDChecklists = query({
  args: {
    dealId: v.id("deals"),
  },
  handler: async (ctx, args) => {
    const checklists = await ctx.db
      .query("numbers_dd_checklists")
      .withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
      .order("desc")
      .collect();

    return checklists;
  },
});

// Delete a DD checklist
export const deleteDDChecklist = mutation({
  args: {
    id: v.id("numbers_dd_checklists"),
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

    const checklist = await ctx.db.get(args.id);
    if (!checklist || checklist.userId !== user._id) {
      throw new Error("Checklist not found or access denied");
    }

    await ctx.db.delete(args.id);
    return true;
  },
});
