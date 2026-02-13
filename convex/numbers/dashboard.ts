import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Convex functions for Numbers - Dashboard & Activity
 */

// Get deals for Numbers tool selector
export const getDealsForNumbers = query({
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

    // Get active deals (not archived)
    const deals = await ctx.db
      .query("deals")
      .order("desc")
      .take(args.limit || 50);

    // Filter out archived and map to summary format
    return deals
      .filter((d) => !d.isArchived)
      .map((d) => ({
        id: d._id,
        title: d.title,
        companyId: d.companyId,
        stage: d.stage,
        amount: d.amount,
        currency: d.currency || "EUR",
      }));
  },
});

// Get a single deal by ID for Numbers tools
export const getDealById = query({
  args: {
    dealId: v.id("deals"),
  },
  handler: async (ctx, args) => {
    const deal = await ctx.db.get(args.dealId);
    if (!deal) return null;

    // Fetch company name if companyId exists
    let companyName: string | undefined;
    if (deal.companyId) {
      const company = await ctx.db.get(deal.companyId);
      companyName = company?.name;
    }

    return {
      id: deal._id,
      title: deal.title,
      company: companyName,
      companyId: deal.companyId,
      stage: deal.stage,
      amount: deal.amount,
      currency: deal.currency || "EUR",
      description: deal.description,
    };
  },
});

// Get all Numbers data for a specific deal
export const getDealNumbersData = query({
  args: {
    dealId: v.id("deals"),
  },
  handler: async (ctx, args) => {
    const [feeCalcs, models, comparables, timelines, teasers, postDeals] =
      await Promise.all([
        ctx.db
          .query("numbers_fee_calculations")
          .withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
          .collect(),
        ctx.db
          .query("numbers_financial_models")
          .withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
          .collect(),
        ctx.db
          .query("numbers_comparables")
          .withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
          .collect(),
        ctx.db
          .query("numbers_timelines")
          .withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
          .collect(),
        ctx.db
          .query("numbers_teaser_tracking")
          .withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
          .collect(),
        ctx.db
          .query("numbers_post_deal")
          .withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
          .collect(),
      ]);

    return {
      feeCalculations: feeCalcs,
      financialModels: models,
      comparables: comparables,
      timelines: timelines,
      teaserTracking: teasers,
      postDeal: postDeals,
      counts: {
        feeCalculations: feeCalcs.length,
        financialModels: models.length,
        comparables: comparables.length,
        timelines: timelines.length,
        teaserTracking: teasers.length,
        postDeal: postDeals.length,
        total:
          feeCalcs.length +
          models.length +
          comparables.length +
          timelines.length +
          teasers.length +
          postDeals.length,
      },
    };
  },
});

// Get recent activity across all Numbers tools for the current user
export const getRecentActivity = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { items: [], stats: { total: 0, thisWeek: 0, thisMonth: 0 } };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (!user) {
      return { items: [], stats: { total: 0, thisWeek: 0, thisMonth: 0 } };
    }

    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Fetch recent items from each table
    const [feeCalcs, models, comparables, timelines, teasers, postDeals] =
      await Promise.all([
        ctx.db
          .query("numbers_fee_calculations")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .order("desc")
          .take(5),
        ctx.db
          .query("numbers_financial_models")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .order("desc")
          .take(5),
        ctx.db
          .query("numbers_comparables")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .order("desc")
          .take(5),
        ctx.db
          .query("numbers_timelines")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .order("desc")
          .take(5),
        ctx.db
          .query("numbers_teaser_tracking")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .order("desc")
          .take(5),
        ctx.db
          .query("numbers_post_deal")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .order("desc")
          .take(5),
      ]);

    // Combine and sort all items by date
    const allItems = [
      ...feeCalcs.map((item) => ({
        id: item._id,
        type: "fee-calculator" as const,
        title: item.clientName || "Calcul d'honoraires",
        description: `${item.totalFees?.toLocaleString("fr-FR")} k€ - ${item.missionType}`,
        createdAt: item.createdAt,
        href: "/admin/numbers/fee-calculator",
      })),
      ...models.map((item) => ({
        id: item._id,
        type: "financial-model" as const,
        title: item.name || "Modele financier",
        description: item.companyName || "",
        createdAt: item.createdAt,
        href: "/admin/numbers/financial-model",
      })),
      ...comparables.map((item) => ({
        id: item._id,
        type: "comparables" as const,
        title: item.name || "Analyse comparables",
        description: item.targetName || "",
        createdAt: item.createdAt,
        href: "/admin/numbers/comparables",
      })),
      ...timelines.map((item) => ({
        id: item._id,
        type: "timeline" as const,
        title: item.name || "Timeline",
        description: `${item.tasks?.length || 0} taches`,
        createdAt: item.createdAt,
        href: "/admin/numbers/timeline",
      })),
      ...teasers.map((item) => ({
        id: item._id,
        type: "teaser-tracking" as const,
        title: item.name || "Suivi Teaser/IM",
        description: `${item.buyers?.length || 0} acquereurs`,
        createdAt: item.createdAt,
        href: "/admin/numbers/teaser-tracking",
      })),
      ...postDeals.map((item) => ({
        id: item._id,
        type: "post-deal" as const,
        title: item.name || "Integration post-deal",
        description: `${item.tasks?.length || 0} taches`,
        createdAt: item.createdAt,
        href: "/admin/numbers/post-deal",
      })),
    ];

    // Sort by date and take top 10
    const sortedItems = allItems
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 10);

    // Calculate stats
    const allCreatedAts = allItems.map((i) => i.createdAt || 0);
    const thisWeek = allCreatedAts.filter((d) => d > oneWeekAgo).length;
    const thisMonth = allCreatedAts.filter((d) => d > oneMonthAgo).length;

    return {
      items: sortedItems,
      stats: {
        total: allItems.length,
        thisWeek,
        thisMonth,
      },
    };
  },
});

// Get counts for each tool type
export const getToolStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        feeCalculations: 0,
        financialModels: 0,
        comparables: 0,
        timelines: 0,
        teaserTracking: 0,
        postDeal: 0,
      };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (!user) {
      return {
        feeCalculations: 0,
        financialModels: 0,
        comparables: 0,
        timelines: 0,
        teaserTracking: 0,
        postDeal: 0,
      };
    }

    // Count items in each table
    const [feeCalcs, models, comparables, timelines, teasers, postDeals] =
      await Promise.all([
        ctx.db
          .query("numbers_fee_calculations")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect(),
        ctx.db
          .query("numbers_financial_models")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect(),
        ctx.db
          .query("numbers_comparables")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect(),
        ctx.db
          .query("numbers_timelines")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect(),
        ctx.db
          .query("numbers_teaser_tracking")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect(),
        ctx.db
          .query("numbers_post_deal")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect(),
      ]);

    return {
      feeCalculations: feeCalcs.length,
      financialModels: models.length,
      comparables: comparables.length,
      timelines: timelines.length,
      teaserTracking: teasers.length,
      postDeal: postDeals.length,
    };
  },
});
