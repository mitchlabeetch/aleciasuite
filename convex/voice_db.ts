// Voice Notes Database Operations (V8 Runtime)
// Mutations for voice notes - runs in V8 (not Node.js)

import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
	args: {},
	handler: async (ctx) => {
		return await ctx.storage.generateUploadUrl();
	},
});

export const saveVoiceNote = mutation({
	args: {
		storageId: v.string(),
		duration: v.number(),
	},
	handler: async (ctx, args) => {
		const id = await ctx.db.insert("voice_notes", {
			audioFileId: args.storageId,
			// duration: args.duration, // Schema doesn't have duration yet
		});
		return id;
	},
});
