/**
 * Logo Upload and Management Mutations
 *
 * Handles uploading optimized SVG logos to Convex storage
 * and updating transaction records
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Update transaction logos with optimized SVG paths
 */
export const updateTransactionLogos = mutation({
	args: {
		transactionId: v.id("transactions"),
		clientLogoUrl: v.optional(v.string()),
		acquirerLogoUrl: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { transactionId, clientLogoUrl, acquirerLogoUrl } = args;

		const transaction = await ctx.db.get(transactionId);
		if (!transaction) {
			throw new Error("Transaction not found");
		}

		// Update the transaction with new logo URLs
		await ctx.db.patch(transactionId, {
			...(clientLogoUrl && { clientLogo: clientLogoUrl }),
			...(acquirerLogoUrl && { acquirerLogo: acquirerLogoUrl }),
		});

		return { success: true };
	},
});

/**
 * Bulk update multiple transactions with optimized logos
 */
export const bulkUpdateLogos = mutation({
	args: {
		updates: v.array(
			v.object({
				transactionId: v.id("transactions"),
				clientLogoUrl: v.optional(v.string()),
				acquirerLogoUrl: v.optional(v.string()),
			}),
		),
	},
	handler: async (ctx, args) => {
		const results = [];

		for (const update of args.updates) {
			try {
				const transaction = await ctx.db.get(update.transactionId);
				if (!transaction) {
					results.push({
						id: update.transactionId,
						success: false,
						error: "Not found",
					});
					continue;
				}

				await ctx.db.patch(update.transactionId, {
					...(update.clientLogoUrl && { clientLogo: update.clientLogoUrl }),
					...(update.acquirerLogoUrl && {
						acquirerLogo: update.acquirerLogoUrl,
					}),
				});

				results.push({ id: update.transactionId, success: true });
			} catch (error) {
				results.push({
					id: update.transactionId,
					success: false,
					error: error instanceof Error ? error.message : "Unknown error",
				});
			}
		}

		return {
			total: args.updates.length,
			successful: results.filter((r) => r.success).length,
			failed: results.filter((r) => !r.success).length,
			results,
		};
	},
});

/**
 * Get all transactions for logo migration
 */
export const getTransactionsForLogoMigration = query({
	args: {},
	handler: async (ctx) => {
		const transactions = await ctx.db.query("transactions").collect();

		return transactions.map((t) => ({
			_id: t._id,
			clientName: t.clientName,
			acquirerName: t.acquirerName,
			clientLogo: t.clientLogo,
			acquirerLogo: t.acquirerLogo,
			slug: t.slug,
		}));
	},
});

/**
 * Clear all logo URLs to allow frontend HD logo system to take over
 */
export const clearAllTransactionLogos = mutation({
	args: {},
	handler: async (ctx) => {
		const transactions = await ctx.db.query("transactions").collect();

		let updated = 0;
		for (const transaction of transactions) {
			await ctx.db.patch(transaction._id, {
				clientLogo: undefined,
				acquirerLogo: undefined,
			});
			updated++;
		}

		return { success: true, updated };
	},
});
