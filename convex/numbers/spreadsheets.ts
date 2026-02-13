import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Convex functions for Numbers - Spreadsheets
 */

// Save a spreadsheet
export const saveSpreadsheet = mutation({
  args: {
    id: v.optional(v.id("numbers_spreadsheets")),
    dealId: v.optional(v.id("deals")),
    name: v.string(),
    templateId: v.optional(v.string()),
    sheetData: v.string(), // JSON stringified FortuneSheet data
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
        throw new Error("Spreadsheet not found or access denied");
      }

      await ctx.db.patch(args.id, {
        name: args.name,
        dealId: args.dealId,
        templateId: args.templateId,
        sheetData: args.sheetData,
        updatedAt: now,
      });

      return args.id;
    }

    // Create new spreadsheet
    const id = await ctx.db.insert("numbers_spreadsheets", {
      userId: user._id,
      dealId: args.dealId,
      name: args.name,
      templateId: args.templateId,
      sheetData: args.sheetData,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

// Get user's spreadsheets
export const getUserSpreadsheets = query({
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

    const spreadsheets = await ctx.db
      .query("numbers_spreadsheets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit || 50);

    return spreadsheets;
  },
});

// Get a specific spreadsheet by ID
export const getSpreadsheet = query({
  args: {
    id: v.id("numbers_spreadsheets"),
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

    const spreadsheet = await ctx.db.get(args.id);
    if (!spreadsheet || spreadsheet.userId !== user._id) {
      return null;
    }

    return spreadsheet;
  },
});

// Get spreadsheets for a specific deal
export const getDealSpreadsheets = query({
  args: {
    dealId: v.id("deals"),
  },
  handler: async (ctx, args) => {
    const spreadsheets = await ctx.db
      .query("numbers_spreadsheets")
      .withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
      .order("desc")
      .collect();

    return spreadsheets;
  },
});

// Delete a spreadsheet
export const deleteSpreadsheet = mutation({
  args: {
    id: v.id("numbers_spreadsheets"),
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

    const spreadsheet = await ctx.db.get(args.id);
    if (!spreadsheet || spreadsheet.userId !== user._id) {
      throw new Error("Spreadsheet not found or access denied");
    }

    await ctx.db.delete(args.id);
    return true;
  },
});
