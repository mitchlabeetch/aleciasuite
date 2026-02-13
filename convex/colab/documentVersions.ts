/**
 * Colab Document Versions Module
 *
 * Version history management for colab_documents.
 * Part of the unified Convex backend (Phase 2 migration).
 */

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// Save a new version of a document
export const saveVersion = mutation({
	args: {
		documentId: v.id("colab_documents"),
		content: v.string(),
		markdown: v.optional(v.string()),
		createdBy: v.optional(v.string()),
		changeDescription: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// Get the latest version number for this document
		const existingVersions = await ctx.db
			.query("colab_document_versions")
			.withIndex("by_document", (q) => q.eq("documentId", args.documentId))
			.order("desc")
			.take(1);

		const nextVersionNumber =
			existingVersions.length > 0 ? existingVersions[0].versionNumber + 1 : 1;

		const versionId = await ctx.db.insert("colab_document_versions", {
			documentId: args.documentId,
			content: args.content,
			markdown: args.markdown,
			versionNumber: nextVersionNumber,
			createdBy: args.createdBy,
			createdAt: Date.now(),
			changeDescription: args.changeDescription,
		});

		return { versionId, versionNumber: nextVersionNumber };
	},
});

// Get all versions for a document (sorted newest first)
export const listVersions = query({
	args: {
		documentId: v.id("colab_documents"),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("colab_document_versions")
			.withIndex("by_document", (q) => q.eq("documentId", args.documentId))
			.order("desc")
			.collect();
	},
});

// Get a specific version by document and version number
export const getVersion = query({
	args: {
		documentId: v.id("colab_documents"),
		versionNumber: v.number(),
	},
	handler: async (ctx, args) => {
		const versions = await ctx.db
			.query("colab_document_versions")
			.withIndex("by_version", (q) =>
				q
					.eq("documentId", args.documentId)
					.eq("versionNumber", args.versionNumber),
			)
			.take(1);

		return versions[0] ?? null;
	},
});

// Restore a version (copies content back to the document and creates a new version)
export const restoreVersion = mutation({
	args: {
		documentId: v.id("colab_documents"),
		versionNumber: v.number(),
		restoredBy: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// Get the version to restore
		const versions = await ctx.db
			.query("colab_document_versions")
			.withIndex("by_version", (q) =>
				q
					.eq("documentId", args.documentId)
					.eq("versionNumber", args.versionNumber),
			)
			.take(1);

		if (versions.length === 0) {
			throw new Error(`Version ${args.versionNumber} not found`);
		}

		const versionToRestore = versions[0];

		// Update the document with the restored content
		await ctx.db.patch(args.documentId, {
			content: versionToRestore.content,
			markdown: versionToRestore.markdown,
			updatedAt: Date.now(),
		});

		// Create a new version marking this as a restore
		const existingVersions = await ctx.db
			.query("colab_document_versions")
			.withIndex("by_document", (q) => q.eq("documentId", args.documentId))
			.order("desc")
			.take(1);

		const nextVersionNumber =
			existingVersions.length > 0 ? existingVersions[0].versionNumber + 1 : 1;

		await ctx.db.insert("colab_document_versions", {
			documentId: args.documentId,
			content: versionToRestore.content,
			markdown: versionToRestore.markdown,
			versionNumber: nextVersionNumber,
			createdBy: args.restoredBy,
			createdAt: Date.now(),
			changeDescription: `Restored from version ${args.versionNumber}`,
		});

		return {
			restoredVersion: args.versionNumber,
			newVersion: nextVersionNumber,
		};
	},
});

// Get version count for a document
export const getVersionCount = query({
	args: {
		documentId: v.id("colab_documents"),
	},
	handler: async (ctx, args) => {
		const versions = await ctx.db
			.query("colab_document_versions")
			.withIndex("by_document", (q) => q.eq("documentId", args.documentId))
			.collect();

		return versions.length;
	},
});
