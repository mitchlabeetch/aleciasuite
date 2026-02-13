/**
 * Matchmaker - AI-powered buyer/seller matching for M&A deals
 *
 * This module provides vector search-based matching between deals and buyers.
 */
import {
  internalMutation,
  action,
  internalQuery,
  query,
  mutation,
} from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

/**
 * Save deal embedding for vector search
 */
export const saveDealEmbedding = internalMutation({
  args: {
    dealId: v.id("deals"),
    vector: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("embeddings")
      .filter((q) =>
        q.and(
          q.eq(q.field("targetId"), args.dealId),
          q.eq(q.field("targetType"), "deal"),
        ),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { vector: args.vector });
    } else {
      await ctx.db.insert("embeddings", {
        targetId: args.dealId,
        targetType: "deal",
        vector: args.vector,
      });
    }
  },
});

/**
 * Save buyer embedding for vector search
 */
export const saveBuyerEmbedding = internalMutation({
  args: {
    contactId: v.id("contacts"),
    vector: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("embeddings")
      .filter((q) =>
        q.and(
          q.eq(q.field("targetId"), args.contactId),
          q.eq(q.field("targetType"), "buyer"),
        ),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { vector: args.vector });
    } else {
      await ctx.db.insert("embeddings", {
        targetId: args.contactId,
        targetType: "buyer",
        vector: args.vector,
      });
    }
  },
});

/**
 * Find matching buyers using vector search
 */
export const findMatchingBuyers = action({
  args: { dealId: v.id("deals") },
  handler: async (
    ctx,
    args,
  ): Promise<{ score: number; contact: Record<string, unknown> }[]> => {
    const dealEmbedding = await ctx.runQuery(
      internal.matchmaker.getEmbeddingByTarget,
      {
        targetId: args.dealId,
        targetType: "deal",
      },
    );

    if (!dealEmbedding) return [];

    const results = await ctx.vectorSearch("embeddings", "by_vector", {
      vector: dealEmbedding.vector,
      limit: 10,
      filter: (q) => q.eq("targetType", "buyer"),
    });

    const matches = await Promise.all(
      results.map(async (res) => {
        const embeddingDoc = await ctx.runQuery(
          internal.matchmaker.getEmbeddingById,
          { embeddingId: res._id },
        );
        if (!embeddingDoc) return null;

        const contactId = embeddingDoc.targetId;
        const contactData = await ctx.runQuery(
          internal.matchmaker.getContactDetails,
          {
            contactId: contactId as unknown as Id<"contacts">,
          },
        );

        if (!contactData) return null;

        return {
          score: res._score,
          contact: contactData,
        };
      }),
    );

    return matches.filter((m): m is NonNullable<typeof m> => m !== null);
  },
});

/**
 * Find matching deals for a buyer
 */
export const findMatchingDeals = action({
  args: { contactId: v.id("contacts") },
  handler: async (
    ctx,
    args,
  ): Promise<{ score: number; deal: Record<string, unknown> }[]> => {
    const buyerEmbedding = await ctx.runQuery(
      internal.matchmaker.getEmbeddingByTarget,
      {
        targetId: args.contactId,
        targetType: "buyer",
      },
    );

    if (!buyerEmbedding) return [];

    const results = await ctx.vectorSearch("embeddings", "by_vector", {
      vector: buyerEmbedding.vector,
      limit: 10,
      filter: (q) => q.eq("targetType", "deal"),
    });

    const matches = await Promise.all(
      results.map(async (res) => {
        const embeddingDoc = await ctx.runQuery(
          internal.matchmaker.getEmbeddingById,
          { embeddingId: res._id },
        );
        if (!embeddingDoc) return null;

        const dealId = embeddingDoc.targetId;
        const dealData = await ctx.runQuery(
          internal.matchmaker.getDealDetails,
          {
            dealId: dealId as unknown as Id<"deals">,
          },
        );

        if (!dealData) return null;

        return {
          score: res._score,
          deal: dealData,
        };
      }),
    );

    return matches.filter((m): m is NonNullable<typeof m> => m !== null);
  },
});

/**
 * Calculate match score between a deal and buyer based on criteria
 */
export const calculateMatchScore = action({
  args: {
    dealId: v.id("deals"),
    contactId: v.id("contacts"),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    overallScore: number;
    criteriaMatches: { criterion: string; match: boolean; weight: number }[];
    recommendation: string;
  }> => {
    // Get deal details
    const deal = await ctx.runQuery(internal.matchmaker.getDealDetails, {
      dealId: args.dealId,
    });
    if (!deal) throw new Error("Deal not found");

    // Get buyer criteria
    const contact = await ctx.runQuery(internal.matchmaker.getContactDetails, {
      contactId: args.contactId,
    });
    if (!contact) throw new Error("Contact not found");

    const buyerCriteria = contact.buyerCriteria;
    if (!buyerCriteria) {
      return {
        overallScore: 50,
        criteriaMatches: [],
        recommendation: "Aucun critère d'acquisition défini pour cet acquéreur",
      };
    }

    const criteriaMatches: {
      criterion: string;
      match: boolean;
      weight: number;
    }[] = [];
    let totalWeight = 0;
    let matchedWeight = 0;

    // Check sector match (weight: 30)
    if (buyerCriteria.sectors && buyerCriteria.sectors.length > 0) {
      const sectorMatch = buyerCriteria.sectors.some((s: string) =>
        (deal as Record<string, unknown>).sector
          ?.toString()
          .toLowerCase()
          .includes(s.toLowerCase()),
      );
      criteriaMatches.push({
        criterion: "Secteur",
        match: sectorMatch,
        weight: 30,
      });
      totalWeight += 30;
      if (sectorMatch) matchedWeight += 30;
    }

    // Check revenue range (weight: 25)
    if (
      buyerCriteria.minRevenue !== undefined ||
      buyerCriteria.maxRevenue !== undefined
    ) {
      const dealRevenue =
        ((deal as Record<string, unknown>).revenue as number) || 0;
      const revenueMatch =
        (buyerCriteria.minRevenue === undefined ||
          dealRevenue >= buyerCriteria.minRevenue) &&
        (buyerCriteria.maxRevenue === undefined ||
          dealRevenue <= buyerCriteria.maxRevenue);
      criteriaMatches.push({
        criterion: "Chiffre d'affaires",
        match: revenueMatch,
        weight: 25,
      });
      totalWeight += 25;
      if (revenueMatch) matchedWeight += 25;
    }

    // Check EBITDA range (weight: 25)
    if (
      buyerCriteria.minEbitda !== undefined ||
      buyerCriteria.maxEbitda !== undefined
    ) {
      const dealEbitda =
        ((deal as Record<string, unknown>).ebitda as number) || 0;
      const ebitdaMatch =
        (buyerCriteria.minEbitda === undefined ||
          dealEbitda >= buyerCriteria.minEbitda) &&
        (buyerCriteria.maxEbitda === undefined ||
          dealEbitda <= buyerCriteria.maxEbitda);
      criteriaMatches.push({
        criterion: "EBITDA",
        match: ebitdaMatch,
        weight: 25,
      });
      totalWeight += 25;
      if (ebitdaMatch) matchedWeight += 25;
    }

    // Check geography (weight: 20)
    if (buyerCriteria.geographies && buyerCriteria.geographies.length > 0) {
      const geoMatch = buyerCriteria.geographies.some((g: string) =>
        (deal as Record<string, unknown>).geography
          ?.toString()
          .toLowerCase()
          .includes(g.toLowerCase()),
      );
      criteriaMatches.push({
        criterion: "Géographie",
        match: geoMatch,
        weight: 20,
      });
      totalWeight += 20;
      if (geoMatch) matchedWeight += 20;
    }

    const overallScore =
      totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 50;

    // Generate recommendation
    let recommendation: string;
    if (overallScore >= 80) {
      recommendation = "Excellent match - Contacter prioritairement";
    } else if (overallScore >= 60) {
      recommendation = "Bon match - À explorer";
    } else if (overallScore >= 40) {
      recommendation = "Match partiel - Vérifier les critères manuellement";
    } else {
      recommendation =
        "Match faible - Ne correspond pas aux critères principaux";
    }

    return { overallScore, criteriaMatches, recommendation };
  },
});

// --- Helper Queries ---

export const getEmbeddingByTarget = internalQuery({
  args: { targetId: v.string(), targetType: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("embeddings")
      .filter((q) =>
        q.and(
          q.eq(q.field("targetId"), args.targetId),
          q.eq(q.field("targetType"), args.targetType),
        ),
      )
      .first();
  },
});

export const getEmbeddingById = internalQuery({
  args: { embeddingId: v.id("embeddings") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.embeddingId);
  },
});

export const getContactDetails = internalQuery({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) return null;

    const company = contact.companyId
      ? await ctx.db.get(contact.companyId)
      : null;

    const buyerCriteria = await ctx.db
      .query("buyer_criteria")
      .withIndex("by_contactId", (q) => q.eq("contactId", args.contactId))
      .first();

    return {
      ...contact,
      companyName: company?.name,
      companyLogo: company?.logoUrl,
      buyerCriteria: buyerCriteria ?? null,
    };
  },
});

export const getDealDetails = internalQuery({
  args: { dealId: v.id("deals") },
  handler: async (ctx, args) => {
    const deal = await ctx.db.get(args.dealId);
    if (!deal) return null;

    // Get company info
    const company = deal.companyId ? await ctx.db.get(deal.companyId) : null;

    // Get owner info
    const owner = deal.ownerId ? await ctx.db.get(deal.ownerId) : null;

    return {
      ...deal,
      companyName: company?.name,
      companyLogo: company?.logoUrl,
      ownerName: owner?.name,
    };
  },
});

// ============================================
// PUBLIC QUERIES (For Matchmaker UI)
// ============================================

/**
 * Get all buyers (contacts with buyer criteria)
 */
export const getAllBuyers = query({
  args: {},
  handler: async (ctx) => {
    const allCriteria = await ctx.db.query("buyer_criteria").collect();

    const buyers = await Promise.all(
      allCriteria.map(async (criteria) => {
        const contact = await ctx.db.get(criteria.contactId);
        if (!contact) return null;

        const company = contact.companyId
          ? await ctx.db.get(contact.companyId)
          : null;

        return {
          _id: contact._id,
          fullName: contact.fullName,
          email: contact.email,
          phone: contact.phone,
          companyId: contact.companyId,
          companyName: company?.name,
          criteria: {
            _id: criteria._id,
            sectors: criteria.sectors || [],
            minRevenue: criteria.minRevenue,
            maxRevenue: criteria.maxRevenue,
            minEbitda: criteria.minEbitda,
            maxEbitda: criteria.maxEbitda,
            minValuation: criteria.minValuation,
            maxValuation: criteria.maxValuation,
            geographies: criteria.geographies || [],
            notes: criteria.notes,
          },
        };
      }),
    );

    return buyers.filter((b): b is NonNullable<typeof b> => b !== null);
  },
});

/**
 * Get all active deals for matching
 */
export const getDealsForMatching = query({
  args: {},
  handler: async (ctx) => {
    const deals = await ctx.db
      .query("deals")
      .filter((q) => q.neq(q.field("isArchived"), true))
      .order("desc")
      .take(100);

    const enrichedDeals = await Promise.all(
      deals.map(async (deal) => {
        const company = deal.companyId
          ? await ctx.db.get(deal.companyId)
          : null;

        return {
          _id: deal._id,
          title: deal.title,
          stage: deal.stage,
          amount: deal.amount,
          companyId: deal.companyId,
          companyName: company?.name,
          financials: company?.financials,
          tags: deal.tags,
          createdAt: deal.createdAt,
        };
      }),
    );

    return enrichedDeals;
  },
});

/**
 * Get buyer criteria for a specific contact
 */
export const getBuyerCriteria = query({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("buyer_criteria")
      .withIndex("by_contactId", (q) => q.eq("contactId", args.contactId))
      .first();
  },
});

/**
 * Get contacts without buyer criteria (potential buyers to add)
 */
export const getContactsWithoutCriteria = query({
  args: {},
  handler: async (ctx) => {
    const allContacts = await ctx.db.query("contacts").take(200);
    const allCriteria = await ctx.db.query("buyer_criteria").collect();

    const contactsWithCriteria = new Set(allCriteria.map((c) => c.contactId));

    const contactsWithoutCriteria = await Promise.all(
      allContacts
        .filter((contact) => !contactsWithCriteria.has(contact._id))
        .map(async (contact) => {
          const company = contact.companyId
            ? await ctx.db.get(contact.companyId)
            : null;

          return {
            _id: contact._id,
            fullName: contact.fullName,
            email: contact.email,
            companyName: company?.name,
          };
        }),
    );

    return contactsWithoutCriteria;
  },
});

// ============================================
// MUTATIONS (CRUD for Buyer Criteria)
// ============================================

/**
 * Create or update buyer criteria for a contact
 */
export const upsertBuyerCriteria = mutation({
  args: {
    contactId: v.id("contacts"),
    sectors: v.array(v.string()),
    minRevenue: v.optional(v.number()),
    maxRevenue: v.optional(v.number()),
    minEbitda: v.optional(v.number()),
    maxEbitda: v.optional(v.number()),
    minValuation: v.optional(v.number()),
    maxValuation: v.optional(v.number()),
    geographies: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if criteria exists
    const existing = await ctx.db
      .query("buyer_criteria")
      .withIndex("by_contactId", (q) => q.eq("contactId", args.contactId))
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        sectors: args.sectors,
        minRevenue: args.minRevenue,
        maxRevenue: args.maxRevenue,
        minEbitda: args.minEbitda,
        maxEbitda: args.maxEbitda,
        minValuation: args.minValuation,
        maxValuation: args.maxValuation,
        geographies: args.geographies,
        notes: args.notes,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new
      return await ctx.db.insert("buyer_criteria", {
        contactId: args.contactId,
        sectors: args.sectors,
        minRevenue: args.minRevenue,
        maxRevenue: args.maxRevenue,
        minEbitda: args.minEbitda,
        maxEbitda: args.maxEbitda,
        minValuation: args.minValuation,
        maxValuation: args.maxValuation,
        geographies: args.geographies,
        notes: args.notes,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

/**
 * Delete buyer criteria
 */
export const deleteBuyerCriteria = mutation({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("buyer_criteria")
      .withIndex("by_contactId", (q) => q.eq("contactId", args.contactId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { success: true };
    }

    return { success: false, error: "Criteria not found" };
  },
});
