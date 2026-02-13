import { query } from "./_generated/server";

export const getGlobalSettings = query({
	args: {},
	handler: async (ctx) => {
		// Singleton pattern: get the first document
		const settings = await ctx.db.query("global_settings").first();
		return settings;
	},
});

export const getUsers = query({
	args: {},
	handler: async (ctx) => {
		// Ideally add auth check here to ensure only sudo/authorized users can list all
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Unauthorized");

		const users = await ctx.db.query("users").collect();
		return users;
	},
});

export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const user = await ctx.db
			.query("users")
			.withIndex("by_token", (q) =>
				q.eq("tokenIdentifier", identity.tokenIdentifier),
			)
			.first();
		return user;
	},
});
