import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Generate an upload URL for file storage
 */
export const generateUploadUrl = mutation(async (ctx) => {
	return await ctx.storage.generateUploadUrl();
});

/**
 * Save file metadata and return the public URL
 */
export const saveFile = mutation({
	args: {
		storageId: v.id("_storage"),
		fileName: v.string(),
		fileType: v.string(),
	},
	handler: async (ctx, args) => {
		// Get the public URL for the uploaded file
		const url = await ctx.storage.getUrl(args.storageId);

		if (!url) {
			throw new Error("Failed to get file URL");
		}

		// Optionally store file metadata in a table
		// await ctx.db.insert("files", {
		//   storageId: args.storageId,
		//   fileName: args.fileName,
		//   fileType: args.fileType,
		//   uploadedAt: Date.now(),
		// });

		return url;
	},
});

/**
 * Delete a file from storage
 */
export const deleteFile = mutation({
	args: {
		storageId: v.id("_storage"),
	},
	handler: async (ctx, args) => {
		await ctx.storage.delete(args.storageId);
	},
});

/**
 * Get file URL from storage ID
 */
export const getFileUrl = query({
	args: {
		storageId: v.id("_storage"),
	},
	handler: async (ctx, args) => {
		return await ctx.storage.getUrl(args.storageId);
	},
});
