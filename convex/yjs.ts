import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import type { QueryCtx, MutationCtx } from "./_generated/server";

// ============================================
// PHASE 1.2: REAL-TIME COLLABORATIVE EDITING
// Yjs CRDT sync backend for TipTap editor
// ============================================

// ============================================
// SECURITY: Authentication & Authorization
// ============================================

/**
 * Get authenticated user ID from context
 * Throws if user is not authenticated
 */
async function getUserId(ctx: QueryCtx | MutationCtx): Promise<string> {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new Error("Unauthorized: Not authenticated");
	}
	return identity.subject;
}

/**
 * Check if user has access to a document
 * Throws if user doesn't own the document
 */
async function checkDocumentAccess(
	ctx: QueryCtx | MutationCtx,
	documentId: Id<"colab_documents">,
	userId: string,
): Promise<void> {
	const doc = await ctx.db.get(documentId);

	if (!doc) {
		throw new Error("Document not found");
	}

	// Check ownership
	if (doc.userId !== userId) {
		throw new Error("Unauthorized: You don't have access to this document");
	}

	// Future: Add support for shared documents via dealId or workspace permissions
}

// Get the current Yjs document state for initial sync
export const getDocumentState = query({
	args: {
		documentId: v.id("colab_documents"),
	},
	handler: async (ctx, args) => {
		// ✅ SECURITY: Authenticate and authorize
		const userId = await getUserId(ctx);
		await checkDocumentAccess(ctx, args.documentId, userId);

		const yjsDoc = await ctx.db
			.query("colab_yjs_documents")
			.withIndex("by_document", (q) => q.eq("documentId", args.documentId))
			.first();

		if (!yjsDoc) {
			return null;
		}

		return {
			documentState: yjsDoc.documentState,
			stateVector: yjsDoc.stateVector,
			version: yjsDoc.version,
		};
	},
});

// Get incremental updates since a specific version
export const getUpdates = query({
	args: {
		documentId: v.id("colab_documents"),
		sinceVersion: v.number(),
	},
	handler: async (ctx, args) => {
		// ✅ SECURITY: Authenticate and authorize
		const userId = await getUserId(ctx);
		await checkDocumentAccess(ctx, args.documentId, userId);

		const updates = await ctx.db
			.query("colab_yjs_updates")
			.withIndex("by_document_version", (q) =>
				q.eq("documentId", args.documentId).gt("version", args.sinceVersion),
			)
			.collect();

		return updates.map((u) => ({
			update: u.update,
			version: u.version,
			clientId: u.clientId,
		}));
	},
});

// Get the latest version number for a document
export const getLatestVersion = query({
	args: {
		documentId: v.id("colab_documents"),
	},
	handler: async (ctx, args) => {
		// ✅ SECURITY: Authenticate and authorize
		const userId = await getUserId(ctx);
		await checkDocumentAccess(ctx, args.documentId, userId);

		// Check main document state first
		const yjsDoc = await ctx.db
			.query("colab_yjs_documents")
			.withIndex("by_document", (q) => q.eq("documentId", args.documentId))
			.first();

		if (yjsDoc) {
			return yjsDoc.version;
		}

		// If no document state, check for any updates
		const lastUpdate = await ctx.db
			.query("colab_yjs_updates")
			.withIndex("by_document", (q) => q.eq("documentId", args.documentId))
			.order("desc")
			.first();

		return lastUpdate?.version ?? 0;
	},
});

// Push a new Yjs update to the server
export const pushUpdate = mutation({
	args: {
		documentId: v.id("colab_documents"),
		update: v.array(v.number()),
		clientId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// ✅ SECURITY: Authenticate and authorize
		const userId = await getUserId(ctx);
		await checkDocumentAccess(ctx, args.documentId, userId);

		// Get current version
		const latestVersion = await getLatestVersionInternal(
			ctx.db,
			args.documentId,
		);
		const newVersion = latestVersion + 1;

		// Store the update
		await ctx.db.insert("colab_yjs_updates", {
			documentId: args.documentId,
			update: args.update,
			version: newVersion,
			clientId: args.clientId,
			createdAt: Date.now(),
		});

		return { version: newVersion };
	},
});

// Save the full document state (for compaction/persistence)
export const saveDocumentState = mutation({
	args: {
		documentId: v.id("colab_documents"),
		documentState: v.array(v.number()),
		stateVector: v.optional(v.array(v.number())),
		version: v.number(),
	},
	handler: async (ctx, args) => {
		// ✅ SECURITY: Authenticate and authorize
		const userId = await getUserId(ctx);
		await checkDocumentAccess(ctx, args.documentId, userId);

		// Check if document state exists
		const existing = await ctx.db
			.query("colab_yjs_documents")
			.withIndex("by_document", (q) => q.eq("documentId", args.documentId))
			.first();

		if (existing) {
			// Update existing
			await ctx.db.patch(existing._id, {
				documentState: args.documentState,
				stateVector: args.stateVector,
				version: args.version,
				updatedAt: Date.now(),
			});
		} else {
			// Create new
			await ctx.db.insert("colab_yjs_documents", {
				documentId: args.documentId,
				documentState: args.documentState,
				stateVector: args.stateVector,
				version: args.version,
				updatedAt: Date.now(),
			});
		}

		// Clean up old updates that are now merged into the state
		// Keep last 50 updates for clients that might be slightly behind
		const oldUpdates = await ctx.db
			.query("colab_yjs_updates")
			.withIndex("by_document_version", (q) =>
				q.eq("documentId", args.documentId).lt("version", args.version - 50),
			)
			.collect();

		for (const update of oldUpdates) {
			await ctx.db.delete(update._id);
		}

		return { success: true };
	},
});

// Initialize Yjs state for a new document
export const initializeDocument = mutation({
	args: {
		documentId: v.id("colab_documents"),
		initialState: v.optional(v.array(v.number())),
	},
	handler: async (ctx, args) => {
		// ✅ SECURITY: Authenticate and authorize
		const userId = await getUserId(ctx);
		await checkDocumentAccess(ctx, args.documentId, userId);

		// Check if already initialized
		const existing = await ctx.db
			.query("colab_yjs_documents")
			.withIndex("by_document", (q) => q.eq("documentId", args.documentId))
			.first();

		if (existing) {
			return { alreadyExists: true, version: existing.version };
		}

		// Create initial state
		await ctx.db.insert("colab_yjs_documents", {
			documentId: args.documentId,
			documentState: args.initialState ?? [],
			version: 0,
			updatedAt: Date.now(),
		});

		return { alreadyExists: false, version: 0 };
	},
});

// ============================================
// AWARENESS (Cursor Presence)
// ============================================

// Get all active users in a document
export const getAwareness = query({
	args: {
		documentId: v.id("colab_documents"),
	},
	handler: async (ctx, args) => {
		// ✅ SECURITY: Authenticate and authorize
		const userId = await getUserId(ctx);
		await checkDocumentAccess(ctx, args.documentId, userId);

		const staleThreshold = Date.now() - 30000; // 30 seconds

		const awareness = await ctx.db
			.query("colab_yjs_awareness")
			.withIndex("by_document", (q) => q.eq("documentId", args.documentId))
			.filter((q) => q.gt(q.field("lastSeen"), staleThreshold))
			.collect();

		return awareness.map((a) => ({
			clientId: a.clientId,
			userId: a.userId,
			userName: a.userName,
			userColor: a.userColor,
			cursor: a.cursor,
		}));
	},
});

// Update awareness (cursor position, etc.)
export const updateAwareness = mutation({
	args: {
		documentId: v.id("colab_documents"),
		clientId: v.string(),
		userId: v.optional(v.string()),
		userName: v.optional(v.string()),
		userColor: v.optional(v.string()),
		cursor: v.optional(
			v.object({
				anchor: v.number(),
				head: v.number(),
			}),
		),
	},
	handler: async (ctx, args) => {
		// ✅ SECURITY: Authenticate and authorize
		const userId = await getUserId(ctx);
		await checkDocumentAccess(ctx, args.documentId, userId);

		// Find existing awareness record
		const existing = await ctx.db
			.query("colab_yjs_awareness")
			.withIndex("by_document_client", (q) =>
				q.eq("documentId", args.documentId).eq("clientId", args.clientId),
			)
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, {
				userId: args.userId ?? existing.userId,
				userName: args.userName ?? existing.userName,
				userColor: args.userColor ?? existing.userColor,
				cursor: args.cursor,
				lastSeen: Date.now(),
			});
		} else {
			await ctx.db.insert("colab_yjs_awareness", {
				documentId: args.documentId,
				clientId: args.clientId,
				userId: args.userId,
				userName: args.userName,
				userColor: args.userColor,
				cursor: args.cursor,
				lastSeen: Date.now(),
			});
		}

		return { success: true };
	},
});

// Remove awareness when user leaves
export const removeAwareness = mutation({
	args: {
		documentId: v.id("colab_documents"),
		clientId: v.string(),
	},
	handler: async (ctx, args) => {
		// ✅ SECURITY: Authenticate and authorize
		const userId = await getUserId(ctx);
		await checkDocumentAccess(ctx, args.documentId, userId);

		const existing = await ctx.db
			.query("colab_yjs_awareness")
			.withIndex("by_document_client", (q) =>
				q.eq("documentId", args.documentId).eq("clientId", args.clientId),
			)
			.first();

		if (existing) {
			await ctx.db.delete(existing._id);
		}

		return { success: true };
	},
});

// Clean up stale awareness records (can be called by a cron job)
export const cleanupStaleAwareness = mutation({
	args: {},
	handler: async (ctx) => {
		const staleThreshold = Date.now() - 60000; // 1 minute

		const staleRecords = await ctx.db
			.query("colab_yjs_awareness")
			.withIndex("by_lastSeen", (q) => q.lt("lastSeen", staleThreshold))
			.collect();

		for (const record of staleRecords) {
			await ctx.db.delete(record._id);
		}

		return { deleted: staleRecords.length };
	},
});

// ============================================
// INTERNAL HELPERS
// ============================================

async function getLatestVersionInternal(
	db: any,
	documentId: Id<"colab_documents">,
): Promise<number> {
	// Check main document state first
	const yjsDoc = await db
		.query("colab_yjs_documents")
		.withIndex("by_document", (q: any) => q.eq("documentId", documentId))
		.first();

	if (yjsDoc) {
		// Also check updates that might be newer
		const lastUpdate = await db
			.query("colab_yjs_updates")
			.withIndex("by_document", (q: any) => q.eq("documentId", documentId))
			.order("desc")
			.first();

		return Math.max(yjsDoc.version, lastUpdate?.version ?? 0);
	}

	// If no document state, check for any updates
	const lastUpdate = await db
		.query("colab_yjs_updates")
		.withIndex("by_document", (q: any) => q.eq("documentId", documentId))
		.order("desc")
		.first();

	return lastUpdate?.version ?? 0;
}
