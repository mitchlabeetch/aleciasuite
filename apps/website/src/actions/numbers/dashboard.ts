/**
 * Numbers Dashboard Server Actions
 *
 * Handles dashboard data aggregation and activity tracking for Numbers tools
 */

"use server";

import { db, numbers, shared, eq, desc, and, gte } from "@alepanel/db";
import { revalidatePath } from "next/cache";
import { auth } from "@alepanel/auth";

// ============================================
// AUTHENTICATION HELPER
// ============================================

async function getAuthenticatedUser() {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((mod) => mod.headers()),
  });

  if (!session?.user) {
    throw new Error("Unauthorized: Please sign in to continue");
  }

  return session.user;
}

// ============================================
// TYPES
// ============================================

export interface DealSummary {
  id: string;
  title: string;
  companyId: string | null;
  stage: string;
  amount: string | null;
  currency: string;
}

export interface DealNumbersData {
  feeCalculations: any[];
  financialModels: any[];
  comparables: any[];
  timelines: any[];
  teaserTracking: any[];
  postDeal: any[];
  counts: {
    feeCalculations: number;
    financialModels: number;
    comparables: number;
    timelines: number;
    teaserTracking: number;
    postDeal: number;
    total: number;
  };
}

export interface ActivityItem {
  id: string;
  type:
    | "fee-calculator"
    | "financial-model"
    | "comparables"
    | "timeline"
    | "teaser-tracking"
    | "post-deal"
    | "spreadsheet";
  title: string;
  description: string;
  createdAt: Date;
  href: string;
}

// ============================================
// DEAL QUERIES
// ============================================

/**
 * Get deals for Numbers tool selector
 */
export async function getDealsForNumbers(limit: number = 50): Promise<DealSummary[]> {
  const user = await getAuthenticatedUser();

  const deals = await db.query.deals.findMany({
    where: eq(shared.deals.isArchived, false),
    orderBy: [desc(shared.deals.createdAt)],
    limit,
  });

  return deals.map((d) => ({
    id: d.id,
    title: d.title,
    companyId: d.companyId,
    stage: d.stage,
    amount: d.amount,
    currency: d.currency || "EUR",
  }));
}

/**
 * Get a single deal by ID for Numbers tools
 */
export async function getDealById(dealId: string) {
  const user = await getAuthenticatedUser();

  const deal = await db.query.deals.findFirst({
    where: eq(shared.deals.id, dealId),
  });

  if (!deal) {
    return null;
  }

  // Get company name separately if needed
  let companyName: string | undefined;
  if (deal.companyId) {
    const company = await db.query.companies.findFirst({
      where: eq(shared.companies.id, deal.companyId),
    });
    companyName = company?.name;
  }

  return {
    id: deal.id,
    title: deal.title,
    company: companyName,
    companyId: deal.companyId,
    stage: deal.stage,
    amount: deal.amount,
    currency: deal.currency || "EUR",
    description: deal.description,
  };
}

/**
 * Get all Numbers data for a specific deal
 */
export async function getDealNumbersData(dealId: string): Promise<DealNumbersData> {
  const user = await getAuthenticatedUser();

  const [
    feeCalculations,
    financialModels,
    comparables,
    timelines,
    teaserTracking,
    postDeal,
  ] = await Promise.all([
    db.query.feeCalculations.findMany({
      where: eq(numbers.feeCalculations.dealId, dealId),
    }),
    db.query.financialModels.findMany({
      where: eq(numbers.financialModels.dealId, dealId),
    }),
    db.query.comparables.findMany({
      where: eq(numbers.comparables.dealId, dealId),
    }),
    db.query.timelines.findMany({
      where: eq(numbers.timelines.dealId, dealId),
    }),
    db.query.teaserTracking.findMany({
      where: eq(numbers.teaserTracking.dealId, dealId),
    }),
    db.query.postDealIntegration.findMany({
      where: eq(numbers.postDealIntegration.dealId, dealId),
    }),
  ]);

  const counts = {
    feeCalculations: feeCalculations.length,
    financialModels: financialModels.length,
    comparables: comparables.length,
    timelines: timelines.length,
    teaserTracking: teaserTracking.length,
    postDeal: postDeal.length,
    total:
      feeCalculations.length +
      financialModels.length +
      comparables.length +
      timelines.length +
      teaserTracking.length +
      postDeal.length,
  };

  return {
    feeCalculations,
    financialModels,
    comparables,
    timelines,
    teaserTracking,
    postDeal,
    counts,
  };
}

// ============================================
// ACTIVITY & STATS
// ============================================

/**
 * Get recent activity across all Numbers tools for the current user
 */
export async function getRecentActivity() {
  const user = await getAuthenticatedUser();

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Fetch recent items from each table
  const [
    feeCalculations,
    financialModels,
    comparables,
    timelines,
    teaserTracking,
    postDeal,
    spreadsheets,
  ] = await Promise.all([
    db.query.feeCalculations.findMany({
      where: eq(numbers.feeCalculations.createdBy, user.id),
      orderBy: [desc(numbers.feeCalculations.createdAt)],
      limit: 5,
    }),
    db.query.financialModels.findMany({
      where: eq(numbers.financialModels.createdBy, user.id),
      orderBy: [desc(numbers.financialModels.createdAt)],
      limit: 5,
    }),
    db.query.comparables.findMany({
      orderBy: [desc(numbers.comparables.createdAt)],
      limit: 5,
    }),
    db.query.timelines.findMany({
      orderBy: [desc(numbers.timelines.createdAt)],
      limit: 5,
    }),
    db.query.teaserTracking.findMany({
      orderBy: [desc(numbers.teaserTracking.createdAt)],
      limit: 5,
    }),
    db.query.postDealIntegration.findMany({
      orderBy: [desc(numbers.postDealIntegration.createdAt)],
      limit: 5,
    }),
    db.query.spreadsheets.findMany({
      where: eq(numbers.spreadsheets.ownerId, user.id),
      orderBy: [desc(numbers.spreadsheets.createdAt)],
      limit: 5,
    }),
  ]);

  // Combine and map all items to activity format
  const allItems: ActivityItem[] = [
    ...feeCalculations.map((item) => ({
      id: item.id,
      type: "fee-calculator" as const,
      title: item.notes || "Calcul d'honoraires",
      description: `${item.calculatedFee ? parseFloat(item.calculatedFee).toLocaleString("fr-FR") : "0"} € - ${item.mandateType}`,
      createdAt: item.createdAt ?? new Date(),
      href: "/admin/numbers/fee-calculator",
    })),
    ...financialModels.map((item) => ({
      id: item.id,
      type: "financial-model" as const,
      title: item.name || "Modèle financier",
      description: item.modelType || "",
      createdAt: item.createdAt ?? new Date(),
      href: "/admin/numbers/financial-model",
    })),
    ...comparables.map((item) => ({
      id: item.id,
      type: "comparables" as const,
      title: item.companyName || "Comparable",
      description: item.sector || "",
      createdAt: item.createdAt ?? new Date(),
      href: "/admin/numbers/comparables",
    })),
    ...timelines.map((item) => ({
      id: item.id,
      type: "timeline" as const,
      title: item.name || "Timeline",
      description: `${(item.milestones as any[])?.length || 0} tâches`,
      createdAt: item.createdAt ?? new Date(),
      href: "/admin/numbers/timeline",
    })),
    ...teaserTracking.map((item) => ({
      id: item.id,
      type: "teaser-tracking" as const,
      title: item.recipientCompany || "Suivi Teaser/IM",
      description: item.status || "",
      createdAt: item.createdAt ?? new Date(),
      href: "/admin/numbers/teaser-tracking",
    })),
    ...postDeal.map((item) => ({
      id: item.id,
      type: "post-deal" as const,
      title: item.workstream || "Intégration post-deal",
      description: `${(item.tasks as any[])?.length || 0} tâches`,
      createdAt: item.createdAt ?? new Date(),
      href: "/admin/numbers/post-deal",
    })),
    ...spreadsheets.map((item) => ({
      id: item.id,
      type: "spreadsheet" as const,
      title: item.title || "Feuille de calcul",
      description: item.isTemplate ? "Template" : "Document",
      createdAt: item.createdAt ?? new Date(),
      href: "/admin/numbers/spreadsheets",
    })),
  ];

  // Sort by date and take top 10
  const sortedItems = allItems
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);

  // Calculate stats
  const allCreatedAts = allItems.map((i) => i.createdAt.getTime());
  const thisWeek = allCreatedAts.filter((d) => d > oneWeekAgo.getTime()).length;
  const thisMonth = allCreatedAts.filter((d) => d > oneMonthAgo.getTime()).length;

  return {
    items: sortedItems,
    stats: {
      total: allItems.length,
      thisWeek,
      thisMonth,
    },
  };
}

/**
 * Get counts for each tool type
 */
export async function getToolStats() {
  const user = await getAuthenticatedUser();

  // Count items in each table
  const [
    feeCalculations,
    financialModels,
    comparables,
    timelines,
    teaserTracking,
    postDeal,
  ] = await Promise.all([
    db.query.feeCalculations.findMany({
      where: eq(numbers.feeCalculations.createdBy, user.id),
    }),
    db.query.financialModels.findMany({
      where: eq(numbers.financialModels.createdBy, user.id),
    }),
    db.query.comparables.findMany(),
    db.query.timelines.findMany(),
    db.query.teaserTracking.findMany(),
    db.query.postDealIntegration.findMany(),
  ]);

  return {
    feeCalculations: feeCalculations.length,
    financialModels: financialModels.length,
    comparables: comparables.length,
    timelines: timelines.length,
    teaserTracking: teaserTracking.length,
    postDeal: postDeal.length,
  };
}
