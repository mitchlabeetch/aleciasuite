/**
 * Update Transaction Logos
 * 
 * This mutation clears all existing logo URLs from transactions and allows
 * the frontend to use the HD logo mapping system instead.
 */

import { mutation } from "./_generated/server";

export const clearAllLogos = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all transactions
    const transactions = await ctx.db.query("transactions").collect();
    
    let updated = 0;
    
    for (const transaction of transactions) {
      // Clear both client and acquirer logos
      await ctx.db.patch(transaction._id, {
        clientLogo: undefined,
        acquirerLogo: undefined,
      });
      updated++;
    }
    
    return { success: true, updated };
  },
});
