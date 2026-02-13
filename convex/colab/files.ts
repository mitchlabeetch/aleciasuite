/**
 * Colab Files Module
 *
 * File upload and storage management using Convex storage.
 * Part of the unified Convex backend (Phase 2 migration).
 */

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

export const generateUploadUrl = mutation({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized");
		}
		return await ctx.storage.generateUploadUrl();
	},
});

export const saveFile = mutation({
	args: {
		storageId: v.id("_storage"),
		fileName: v.string(),
		fileType: v.string(),
		size: v.number(),
		folderId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized");
		}

		const { storageId, fileName, fileType, size, folderId } = args;

		const fileId = await ctx.db.insert("colab_files", {
			storageId,
			fileName,
			fileType,
			size,
			folderId,
			userId: identity.subject,
			createdAt: Date.now(),
		});

		return fileId;
	},
});

// Get files for a user
export const listFiles = query({
	args: {
		folderId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized");
		}

		if (args.folderId) {
			return await ctx.db
				.query("colab_files")
				.withIndex("by_folder", (q) => q.eq("folderId", args.folderId))
				.collect();
		}

		return await ctx.db
			.query("colab_files")
			.withIndex("by_user", (q) => q.eq("userId", identity.subject))
			.collect();
	},
});

// Delete a file
export const deleteFile = mutation({
	args: {
		id: v.id("colab_files"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized");
		}

		const file = await ctx.db.get(args.id);
		if (!file) {
			throw new Error("File not found");
		}

		if (file.userId !== identity.subject) {
			throw new Error("Unauthorized");
		}

		// Delete from storage
		await ctx.storage.delete(file.storageId);

		// Delete record
		await ctx.db.delete(args.id);
	},
});
