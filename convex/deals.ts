import { mutation, query, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getOptionalUser, checkRole } from "./auth_utils";
import { batchGet, extractIds } from "./lib/batch";
import { notify } from "./notifications";

/**
 * UNIFIED DEALS MODULE
 *
 * This module serves BOTH Panel and Colab:
 * - Panel: CRM-integrated, Pipedrive sync, company linkage
 * - Colab: Flow visualization, tags, custom properties
 *
 * Single source of truth for all M&A deals.
 */

// ============================================
// DEAL STAGES - SINGLE SOURCE OF TRUTH
// ============================================

/**
 * Valid deal stages for M&A pipeline
 *
 * RECOMMENDED STANDARD (8 stages):
 * 1. sourcing         - Initial lead identification
 * 2. qualification    - Fit assessment & initial screening
 * 3. initial_meeting  - First contact with decision makers
 * 4. analysis         - Deep dive into business model
 * 5. valuation        - Financial modeling & pricing
 * 6. due_diligence    - Legal, financial, operational DD
 * 7. negotiation      - Term sheet & final negotiations
 * 8. closing          - Legal docs & transaction close
 *
 * Terminal states:
 * - closed_won        - Successfully completed deal
 * - closed_lost       - Deal fell through
 *
 * LEGACY STAGES (backward compatibility):
 * - Lead, NDA Signed, Offer Received, Due Diligence, Closing, completed
 *
 * NOTE: Both Colab and Panel should migrate to the RECOMMENDED STANDARD.
 * TODO: Create migration to standardize existing deals to new stages.
 */
const DEAL_STAGES = [
  // Recommended standard stages (8-stage pipeline)
  "sourcing",
  "qualification",
  "initial_meeting",
  "analysis",
  "valuation",
  "due_diligence",
  "negotiation",
  "closing",
  "closed_won",
  "closed_lost",
  // Legacy stages (backward compatibility - will be migrated)
  "Lead",
  "NDA Signed",
  "Offer Received",
  "Due Diligence",
  "Closing",
  "completed",
] as const;

// ============================================
// QUERIES
// ============================================

/**
 * Get all deals with enriched data (Panel + Colab compatible)
 */
export const getDeals = query({
  args: {
    stage: v.optional(v.string()),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getOptionalUser(ctx);
    if (!user) return [];

    let deals = await ctx.db.query("deals").collect();

    // Filter archived unless explicitly included
    if (!args.includeArchived) {
      deals = deals.filter((d) => !d.isArchived);
    }

    // Filter by stage if provided
    if (args.stage) {
      deals = deals.filter((d) => d.stage === args.stage);
    }

    // Batch fetch related data (N+1 prevention)
    const companyIds = extractIds(deals, "companyId");
    const ownerIds = extractIds(deals, "ownerId");

    const companies = await batchGet(ctx, companyIds);
    const owners = await batchGet(ctx, ownerIds);

    const companyMap = new Map(companyIds.map((id, i) => [id, companies[i]]));
    const ownerMap = new Map(ownerIds.map((id, i) => [id, owners[i]]));

    return deals.map((deal) => ({
      ...deal,
      companyName: deal.companyId
        ? companyMap.get(deal.companyId)?.name || "Unknown"
        : null,
      companyLogo: deal.companyId
        ? companyMap.get(deal.companyId)?.logoUrl
        : null,
      ownerName: deal.ownerId
        ? ownerMap.get(deal.ownerId)?.name || "Unknown"
        : null,
      ownerAvatar: deal.ownerId ? ownerMap.get(deal.ownerId)?.avatarUrl : null,
    }));
  },
});

/**
 * Get deals grouped by stage (for Kanban/Pipeline view)
 */
export const getByStage = query({
  args: {},
  handler: async (ctx) => {
    const user = await getOptionalUser(ctx);
    if (!user) return {};

    const deals = await ctx.db
      .query("deals")
      .filter((q) => q.neq(q.field("isArchived"), true))
      .collect();

    // Group by stage
    const grouped: Record<string, typeof deals> = {};
    for (const stage of DEAL_STAGES) {
      grouped[stage] = deals.filter((d) => d.stage === stage);
    }
    return grouped;
  },
});

/**
 * Get single deal by ID
 */
export const getDeal = internalQuery({
  args: { dealId: v.id("deals") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.dealId);
  },
});

/**
 * Get deal by ID (alias for notification service)
 */
export const getById = internalQuery({
  args: { id: v.id("deals") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const get = query({
  args: { id: v.id("deals") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get all related documents for a deal
 * Fetches from Colab documents and Numbers tools in parallel
 */
export const getDealDocuments = query({
  args: { dealId: v.id("deals") },
  handler: async (ctx, args) => {
    const user = await getOptionalUser(ctx);
    if (!user) return null;

    // Verify deal exists
    const deal = await ctx.db.get(args.dealId);
    if (!deal) return null;

    // Fetch all document types in parallel
    const [
      colabDocuments,
      feeCalculations,
      financialModels,
      comparables,
      timelines,
      teaserTracking,
      postDeal,
    ] = await Promise.all([
      // Colab documents
      ctx.db
        .query("colab_documents")
        .withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
        .collect(),
      // Numbers: Fee calculations
      ctx.db
        .query("numbers_fee_calculations")
        .withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
        .collect(),
      // Numbers: Financial models
      ctx.db
        .query("numbers_financial_models")
        .withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
        .collect(),
      // Numbers: Comparables
      ctx.db
        .query("numbers_comparables")
        .withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
        .collect(),
      // Numbers: Timelines
      ctx.db
        .query("numbers_timelines")
        .withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
        .collect(),
      // Numbers: Teaser tracking
      ctx.db
        .query("numbers_teaser_tracking")
        .withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
        .collect(),
      // Numbers: Post-deal
      ctx.db
        .query("numbers_post_deal")
        .withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
        .collect(),
    ]);

    return {
      deal: {
        id: deal._id,
        title: deal.title,
      },
      colab: {
        documents: colabDocuments.map((d) => ({
          id: d._id,
          title: d.title,
          updatedAt: d.updatedAt,
          type: "document" as const,
        })),
      },
      numbers: {
        feeCalculations: feeCalculations.map((d) => ({
          id: d._id,
          title: d.clientName,
          updatedAt: d._creationTime,
          type: "fee-calculator" as const,
        })),
        financialModels: financialModels.map((d) => ({
          id: d._id,
          title: d.name,
          updatedAt: d.updatedAt,
          type: "financial-model" as const,
        })),
        comparables: comparables.map((d) => ({
          id: d._id,
          title: d.name,
          updatedAt: d.updatedAt,
          type: "comparables" as const,
        })),
        timelines: timelines.map((d) => ({
          id: d._id,
          title: d.name,
          updatedAt: d.updatedAt,
          type: "timeline" as const,
        })),
        teaserTracking: teaserTracking.map((d) => ({
          id: d._id,
          title: d.name,
          updatedAt: d.updatedAt,
          type: "teaser-tracking" as const,
        })),
        postDeal: postDeal.map((d) => ({
          id: d._id,
          title: d.name,
          updatedAt: d.updatedAt,
          type: "post-deal" as const,
        })),
      },
      counts: {
        colabDocuments: colabDocuments.length,
        feeCalculations: feeCalculations.length,
        financialModels: financialModels.length,
        comparables: comparables.length,
        timelines: timelines.length,
        teaserTracking: teaserTracking.length,
        postDeal: postDeal.length,
        total:
          colabDocuments.length +
          feeCalculations.length +
          financialModels.length +
          comparables.length +
          timelines.length +
          teaserTracking.length +
          postDeal.length,
      },
    };
  },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new deal (Panel + Colab compatible)
 */
export const create = mutation({
  args: {
    title: v.string(),
    stage: v.string(),
    description: v.optional(v.string()),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    ),
    leadName: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    expectedCloseDate: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Security: Require authentication to create deals
    const user = await getOptionalUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const now = Date.now();

    return await ctx.db.insert("deals", {
      ...args,
      stage: args.stage as (typeof DEAL_STAGES)[number],
      ownerId: user?._id,
      source: args.source || "manual",
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update a deal (full update with all fields)
 */
export const update = mutation({
  args: {
    id: v.id("deals"),
    title: v.optional(v.string()),
    stage: v.optional(v.string()),
    description: v.optional(v.string()),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    ),
    leadName: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    expectedCloseDate: v.optional(v.number()),
    probability: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    nodePosition: v.optional(v.object({ x: v.number(), y: v.number() })),
    customProperties: v.optional(
      v.record(
        v.string(),
        v.union(v.string(), v.number(), v.boolean(), v.null()),
      ),
    ),
  },
  handler: async (ctx, args) => {
    await checkRole(ctx, ["sudo", "partner", "advisor"]);

    const { id, ...updates } = args;
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined),
    );

    await ctx.db.patch(id, {
      ...cleanUpdates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Unified mutation to move a deal to a different stage.
 *
 * This is the consolidated mutation that should be used for all stage changes.
 * It supports both admin panel (with role check) and Colab (auth only) contexts.
 *
 * @param id - The deal ID
 * @param stage - The new stage
 * @param skipRoleCheck - If true, only requires authentication (for Colab context)
 */
export const moveDealToStage = mutation({
  args: {
    id: v.id("deals"),
    stage: v.string(),
    skipRoleCheck: v.optional(v.boolean()),
    notes: v.optional(v.string()), // Optional notes for stage change
  },
  handler: async (ctx, args) => {
    let currentUser;
    if (args.skipRoleCheck) {
      // Colab context: just require authentication
      currentUser = await getOptionalUser(ctx);
      if (!currentUser) throw new Error("Not authenticated");
    } else {
      // Admin context: require specific roles
      currentUser = await checkRole(ctx, ["sudo", "partner"]);
    }

    const deal = await ctx.db.get(args.id);
    if (!deal) throw new Error("Deal not found");

    const oldStage = deal.stage;
    const now = Date.now();

    // Only log history if stage actually changed
    if (oldStage !== args.stage) {
      // Get the last stage history entry to calculate duration
      const lastHistory = await ctx.db
        .query("deal_stage_history")
        .withIndex("by_deal_date", (q) => q.eq("dealId", args.id))
        .order("desc")
        .first();

      // Calculate duration in previous stage
      let durationInPreviousStage: number | undefined;
      if (lastHistory) {
        durationInPreviousStage = now - lastHistory.changedAt;
      } else {
        // First stage change - use deal creation time
        const createdAt = deal.createdAt || deal._creationTime;
        durationInPreviousStage = now - createdAt;
      }

      // Insert stage history record
      await ctx.db.insert("deal_stage_history", {
        dealId: args.id,
        fromStage: oldStage,
        toStage: args.stage,
        changedBy: currentUser._id,
        changedAt: now,
        dealValue: deal.amount,
        probability: deal.probability,
        notes: args.notes,
        durationInPreviousStage,
      });
    }

    await ctx.db.patch(args.id, {
      stage: args.stage as (typeof DEAL_STAGES)[number],
      updatedAt: now,
    });

    // Notify deal owner if different from current user
    if (
      deal.ownerId &&
      deal.ownerId !== currentUser._id &&
      oldStage !== args.stage
    ) {
      await notify(ctx, {
        recipientId: deal.ownerId,
        triggerId: currentUser._id,
        type: "deal_stage_changed",
        entityType: "deal",
        entityId: args.id,
        payload: { title: deal.title, oldStage, newStage: args.stage },
      });
    }

    return { success: true };
  },
});

/**
 * @deprecated Use moveDealToStage instead. Kept for backward compatibility.
 * Move deal to a different stage (Kanban drag-drop)
 *
 * Used by: Panel admin interface
 * Auth: Requires sudo or partner role
 */
export const moveDeal = mutation({
  args: {
    dealId: v.id("deals"),
    newStage: v.string(),
  },
  handler: async (ctx, args) => {
    await checkRole(ctx, ["sudo", "partner"]);
    await ctx.db.patch(args.dealId, {
      stage: args.newStage as (typeof DEAL_STAGES)[number],
      updatedAt: Date.now(),
    });
  },
});

/**
 * @deprecated Use moveDealToStage instead. Kept for backward compatibility.
 * Alias for unified Kanban (Batch 6)
 *
 * Used by: Unified Kanban components
 * Auth: Requires sudo or partner role
 */
export const updateDealStage = mutation({
  args: {
    id: v.id("deals"),
    stage: v.string(),
  },
  handler: async (ctx, args) => {
    await checkRole(ctx, ["sudo", "partner"]);
    await ctx.db.patch(args.id, {
      stage: args.stage as (typeof DEAL_STAGES)[number],
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

/**
 * @deprecated Use moveDealToStage({ skipRoleCheck: true }) instead.
 * Alias for Colab compatibility
 *
 * Used by: Colab deal pipeline
 * Auth: Any authenticated user
 */
export const moveStage = mutation({
  args: {
    id: v.id("deals"),
    stage: v.string(),
  },
  handler: async (ctx, args) => {
    // Colab doesn't have role-based auth, allow all authenticated users
    const user = await getOptionalUser(ctx);
    if (!user) throw new Error("Not authenticated");

    await ctx.db.patch(args.id, {
      stage: args.stage as (typeof DEAL_STAGES)[number],
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

/**
 * Archive a deal (soft delete)
 */
export const archive = mutation({
  args: { id: v.id("deals") },
  handler: async (ctx, args) => {
    // Security: Require authentication to archive deals
    await checkRole(ctx, ["sudo", "partner", "advisor"]);

    await ctx.db.patch(args.id, {
      isArchived: true,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

/**
 * Restore an archived deal
 */
export const restore = mutation({
  args: { id: v.id("deals") },
  handler: async (ctx, args) => {
    // Security: Require authentication to restore deals
    await checkRole(ctx, ["sudo", "partner", "advisor"]);

    await ctx.db.patch(args.id, {
      isArchived: false,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

/**
 * Delete a deal permanently
 */
export const remove = mutation({
  args: { id: v.id("deals") },
  handler: async (ctx, args) => {
    await checkRole(ctx, ["sudo"]);
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// Export list alias for Colab compatibility
export const list = getDeals;

// ============================================
// BULK IMPORT (Excel Import Wizard)
// ============================================

/**
 * Bulk import deals from Excel data
 *
 * Creates companies if they don't exist, then creates deals linked to them.
 * Used by: Excel Import Wizard
 * Auth: Requires sudo or partner role
 */
export const bulkImport = mutation({
  args: {
    deals: v.array(
      v.object({
        title: v.string(),
        companyName: v.optional(v.string()),
        amount: v.optional(v.number()),
        revenue: v.optional(v.number()),
        ebitda: v.optional(v.number()),
        contact: v.optional(v.string()),
        email: v.optional(v.string()),
        sector: v.optional(v.string()),
        expectedCloseDate: v.optional(v.number()),
      }),
    ),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await checkRole(ctx, ["sudo", "partner"]);
    const user = await getOptionalUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const now = Date.now();
    const results = {
      dealsCreated: 0,
      companiesCreated: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < args.deals.length; i++) {
      const dealData = args.deals[i];
      try {
        let companyId = null;

        // Create or find company if company name provided
        if (dealData.companyName) {
          // Check if company exists by name
          const existingCompany = await ctx.db
            .query("companies")
            .withIndex("by_name", (q) => q.eq("name", dealData.companyName!))
            .first();

          if (existingCompany) {
            companyId = existingCompany._id;
          } else {
            // Create new company
            companyId = await ctx.db.insert("companies", {
              name: dealData.companyName,
              financials: {
                revenue: dealData.revenue,
                ebitda: dealData.ebitda,
                year: new Date().getFullYear(),
                currency: "EUR",
              },
              source: args.source || "excel_import",
              createdAt: now,
              updatedAt: now,
            });
            results.companiesCreated++;
          }

          // Create contact if provided
          if (dealData.contact || dealData.email) {
            // Check if contact exists
            const existingContact = dealData.email
              ? await ctx.db
                  .query("contacts")
                  .withIndex("by_email", (q) => q.eq("email", dealData.email!))
                  .first()
              : null;

            if (!existingContact) {
              await ctx.db.insert("contacts", {
                companyId,
                fullName: dealData.contact || "Contact principal",
                email: dealData.email,
                source: args.source || "excel_import",
                createdAt: now,
                updatedAt: now,
              });
            }
          }
        }

        // Create deal
        await ctx.db.insert("deals", {
          title: dealData.title,
          stage: "sourcing" as const,
          amount: dealData.amount,
          currency: "EUR",
          companyId: companyId ?? undefined,
          ownerId: user._id,
          expectedCloseDate: dealData.expectedCloseDate,
          tags: dealData.sector ? [dealData.sector] : undefined,
          source: args.source || "excel_import",
          createdAt: now,
          updatedAt: now,
        });
        results.dealsCreated++;
      } catch (err) {
        results.errors.push(`Ligne ${i + 1}: ${(err as Error).message}`);
      }
    }

    return results;
  },
});
