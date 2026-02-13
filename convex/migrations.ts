/**
 * @deprecated This migration file is archived.
 * The colab_deals table has been removed from the schema.
 * This file is kept for historical reference only.
 *
 * Deal Migration Script (COMPLETED/ARCHIVED)
 *
 * Phase 3: Migrate existing colab_deals to unified deals table
 *
 * This migration has been completed and the colab_deals table
 * has been removed from the schema. These functions will not work
 * as the source table no longer exists.
 */

import { query } from "./_generated/server";

// Stage mapping from Colab format to unified format (kept for reference)
const STAGE_MAP: Record<string, string> = {
  sourcing: "sourcing",
  "due-diligence": "due_diligence",
  negotiation: "negotiation",
  closing: "closing",
  "closed-won": "closed_won",
  "closed-lost": "closed_lost",
};

/**
 * Parse Colab valuation string to number (kept for reference)
 * Examples: "$25M" → 25000000, "10 m€" → 10000000, "500K" → 500000
 */
function parseValuation(val?: string): number | undefined {
  if (!val) return undefined;

  // Remove currency symbols and spaces
  const cleaned = val.replace(/[€$,\s]/g, "");

  // Match number with optional M/K suffix
  const match = cleaned.match(/(\d+(?:\.\d+)?)\s*(m|k)?/i);
  if (match) {
    const num = parseFloat(match[1]);
    const unit = match[2]?.toLowerCase();
    if (unit === "m") return num * 1000000;
    if (unit === "k") return num * 1000;
    return num;
  }
  return undefined;
}

/**
 * Extract currency from valuation string (kept for reference)
 */
function extractCurrency(val?: string): string {
  if (!val) return "EUR";
  if (val.includes("$")) return "USD";
  if (val.includes("€")) return "EUR";
  if (val.includes("£")) return "GBP";
  return "EUR"; // Default
}

// Keep utility functions accessible for potential future use
export const migrationUtils = {
  STAGE_MAP,
  parseValuation,
  extractCurrency,
};

/**
 * @deprecated Migration completed - colab_deals table no longer exists
 * Returns status message indicating migration is archived.
 */
export const previewMigration = query({
  args: {},
  handler: async () => {
    return {
      status: "ARCHIVED",
      message:
        "This migration has been completed. The colab_deals table has been removed from the schema.",
      migratedAt: "2026-01-xx",
      note: "All deals are now in the unified 'deals' table.",
    };
  },
});

/**
 * @deprecated Migration completed - colab_deals table no longer exists
 * Returns status message indicating migration is archived.
 */
export const verifyMigration = query({
  args: {},
  handler: async (ctx) => {
    // Only check the unified deals table
    const unifiedDeals = await ctx.db.query("deals").collect();
    const migratedDeals = unifiedDeals.filter(
      (d) => d.source === "colab_migrated",
    );

    return {
      status: "ARCHIVED",
      message: "Migration was completed successfully.",
      unifiedDealsTotal: unifiedDeals.length,
      migratedFromColab: migratedDeals.length,
      note: "The colab_deals table has been removed from the schema.",
    };
  },
});
