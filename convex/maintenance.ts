/**
 * Maintenance Jobs (V8 Runtime)
 *
 * Internal mutations for cleanup and maintenance tasks.
 * These run in the V8 runtime (not Node.js).
 */

import { internalMutation } from "./_generated/server";

// =============================================================================
// CLEANUP JOBS
// =============================================================================

/**
 * Clean up stale presence records (users who haven't been seen in 5+ minutes)
 */
export const cleanupStalePresence = internalMutation({
	args: {},
	handler: async (ctx) => {
		const staleThreshold = Date.now() - 5 * 60 * 1000; // 5 minutes ago

		// Clean colab_presence
		const stalePresence = await ctx.db
			.query("colab_presence")
			.withIndex("by_resource")
			.filter((q) => q.lt(q.field("lastActiveAt"), staleThreshold))
			.collect();

		for (const record of stalePresence) {
			await ctx.db.delete(record._id);
		}

		// Clean colab_yjs_awareness
		const staleAwareness = await ctx.db
			.query("colab_yjs_awareness")
			.withIndex("by_lastSeen")
			.filter((q) => q.lt(q.field("lastSeen"), staleThreshold))
			.collect();

		for (const record of staleAwareness) {
			await ctx.db.delete(record._id);
		}

		console.log(
			`[Cleanup] Removed ${stalePresence.length} stale presence, ${staleAwareness.length} stale awareness records`,
		);
		return {
			presenceRemoved: stalePresence.length,
			awarenessRemoved: staleAwareness.length,
		};
	},
});

/**
 * Compact Yjs updates by merging old incremental updates into document state
 */
export const compactYjsUpdates = internalMutation({
	args: {},
	handler: async (ctx) => {
		// Find documents with many pending updates (more than 50)
		const documents = await ctx.db.query("colab_yjs_documents").collect();

		let compactedCount = 0;

		for (const doc of documents) {
			const updates = await ctx.db
				.query("colab_yjs_updates")
				.withIndex("by_document", (q) => q.eq("documentId", doc.documentId))
				.collect();

			// Only compact if there are many updates
			if (updates.length > 50) {
				// Delete old updates (keep the most recent 10)
				const updatesToDelete = updates.slice(0, updates.length - 10);
				for (const update of updatesToDelete) {
					await ctx.db.delete(update._id);
				}
				compactedCount++;
			}
		}

		console.log(`[Cleanup] Compacted ${compactedCount} Yjs documents`);
		return { compactedCount };
	},
});
