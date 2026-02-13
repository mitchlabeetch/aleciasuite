import { query } from "./_generated/server";
import { v } from "convex/values";

// Activity types for the unified feed
type ActivityType =
  | "deal_created"
  | "deal_updated"
  | "document_created"
  | "document_updated"
  | "numbers_fee_calc"
  | "numbers_model"
  | "numbers_comparable"
  | "numbers_timeline"
  | "numbers_teaser"
  | "numbers_postdeal";

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: number;
  dealId?: string;
  dealTitle?: string;
  toolType?: string;
  userId?: string;
}

// Dashboard statistics query
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Get all deals
    const deals = await ctx.db.query("deals").collect();

    // Calculate pipeline value
    const pipelineValue = deals.reduce(
      (sum, deal) => sum + (deal.amount || 0),
      0,
    );

    // Get user count
    const users = await ctx.db.query("users").collect();

    // Get companies count
    const companies = await ctx.db.query("companies").collect();

    // Recent deals (last 5)
    const recentDeals = deals
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 5)
      .map((deal) => ({
        id: deal._id,
        title: deal.title,
        stage: deal.stage,
        amount: deal.amount,
      }));

    // Deals by stage
    const dealsByStage = deals.reduce(
      (acc, deal) => {
        acc[deal.stage] = (acc[deal.stage] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      activeDeals: deals.length,
      pipelineValue,
      teamSize: users.length,
      companiesCount: companies.length,
      recentDeals,
      dealsByStage,
    };
  },
});

/**
 * Unified Activity Feed
 * Aggregates recent activities across all tools:
 * - Deals (created/updated)
 * - Colab documents
 * - Numbers tools (fee calcs, models, comparables, etc.)
 */
export const getUnifiedActivityFeed = query({
  args: {
    limit: v.optional(v.number()),
    dealId: v.optional(v.id("deals")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const limit = args.limit ?? 50;
    const activities: ActivityItem[] = [];

    // Helper to build deal map for enrichment
    const deals = await ctx.db.query("deals").collect();
    const dealMap = new Map(deals.map((d) => [d._id, d.title]));

    // 1. Recent deals
    const recentDeals = await ctx.db.query("deals").order("desc").take(20);

    for (const deal of recentDeals) {
      if (args.dealId && deal._id !== args.dealId) continue;
      activities.push({
        id: `deal-${deal._id}`,
        type: "deal_created",
        title: deal.title,
        description: `Deal en stage ${deal.stage}`,
        timestamp: deal._creationTime,
        dealId: deal._id,
        dealTitle: deal.title,
        toolType: "deals",
      });
    }

    // 2. Colab documents
    const colabDocs = await ctx.db
      .query("colab_documents")
      .order("desc")
      .take(20);

    for (const doc of colabDocs) {
      if (args.dealId && doc.dealId !== args.dealId) continue;
      activities.push({
        id: `colab-${doc._id}`,
        type:
          doc.updatedAt > doc.createdAt + 1000
            ? "document_updated"
            : "document_created",
        title: doc.title,
        description: "Document Colab",
        timestamp: doc.updatedAt || doc.createdAt,
        dealId: doc.dealId,
        dealTitle: doc.dealId ? dealMap.get(doc.dealId) : undefined,
        toolType: "colab",
        userId: doc.userId,
      });
    }

    // 3. Numbers - Fee Calculations
    const feeCalcs = await ctx.db
      .query("numbers_fee_calculations")
      .order("desc")
      .take(10);

    for (const calc of feeCalcs) {
      if (args.dealId && calc.dealId !== args.dealId) continue;
      activities.push({
        id: `fee-${calc._id}`,
        type: "numbers_fee_calc",
        title: calc.clientName,
        description: `Calcul de fees - ${calc.missionType}`,
        timestamp: calc._creationTime,
        dealId: calc.dealId,
        dealTitle: calc.dealId ? dealMap.get(calc.dealId) : undefined,
        toolType: "numbers",
      });
    }

    // 4. Numbers - Financial Models
    const models = await ctx.db
      .query("numbers_financial_models")
      .order("desc")
      .take(10);

    for (const model of models) {
      if (args.dealId && model.dealId !== args.dealId) continue;
      activities.push({
        id: `model-${model._id}`,
        type: "numbers_model",
        title: model.name,
        description: `Modele financier - ${model.companyName}`,
        timestamp: model.updatedAt || model.createdAt,
        dealId: model.dealId,
        dealTitle: model.dealId ? dealMap.get(model.dealId) : undefined,
        toolType: "numbers",
      });
    }

    // 5. Numbers - Comparables
    const comparables = await ctx.db
      .query("numbers_comparables")
      .order("desc")
      .take(10);

    for (const comp of comparables) {
      if (args.dealId && comp.dealId !== args.dealId) continue;
      activities.push({
        id: `comp-${comp._id}`,
        type: "numbers_comparable",
        title: comp.name,
        description: `Analyse comparable - ${comp.targetName}`,
        timestamp: comp.updatedAt || comp.createdAt,
        dealId: comp.dealId,
        dealTitle: comp.dealId ? dealMap.get(comp.dealId) : undefined,
        toolType: "numbers",
      });
    }

    // 6. Numbers - Timelines
    const timelines = await ctx.db
      .query("numbers_timelines")
      .order("desc")
      .take(10);

    for (const timeline of timelines) {
      if (args.dealId && timeline.dealId !== args.dealId) continue;
      activities.push({
        id: `timeline-${timeline._id}`,
        type: "numbers_timeline",
        title: timeline.name,
        description: "Timeline du deal",
        timestamp: timeline.updatedAt || timeline.createdAt,
        dealId: timeline.dealId,
        dealTitle: timeline.dealId ? dealMap.get(timeline.dealId) : undefined,
        toolType: "numbers",
      });
    }

    // 7. Numbers - Teaser Tracking
    const teasers = await ctx.db
      .query("numbers_teaser_tracking")
      .order("desc")
      .take(10);

    for (const teaser of teasers) {
      if (args.dealId && teaser.dealId !== args.dealId) continue;
      activities.push({
        id: `teaser-${teaser._id}`,
        type: "numbers_teaser",
        title: teaser.name,
        description: "Suivi des teasers",
        timestamp: teaser.updatedAt || teaser.createdAt,
        dealId: teaser.dealId,
        dealTitle: teaser.dealId ? dealMap.get(teaser.dealId) : undefined,
        toolType: "numbers",
      });
    }

    // 8. Numbers - Post-Deal
    const postDeals = await ctx.db
      .query("numbers_post_deal")
      .order("desc")
      .take(10);

    for (const pd of postDeals) {
      if (args.dealId && pd.dealId !== args.dealId) continue;
      activities.push({
        id: `postdeal-${pd._id}`,
        type: "numbers_postdeal",
        title: pd.name,
        description: "Integration post-deal",
        timestamp: pd.updatedAt || pd.createdAt,
        dealId: pd.dealId,
        dealTitle: pd.dealId ? dealMap.get(pd.dealId) : undefined,
        toolType: "numbers",
      });
    }

    // Sort by timestamp (most recent first) and limit
    activities.sort((a, b) => b.timestamp - a.timestamp);
    return activities.slice(0, limit);
  },
});
