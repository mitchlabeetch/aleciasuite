import { v } from "convex/values";
import { internalQuery } from "./_generated/server";

/**
 * Data Export Internal Queries
 *
 * Internal queries used by the data export action to fetch user data.
 */

/**
 * Get current authenticated user
 */
export const getCurrentUser = internalQuery({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const user = await ctx.db
			.query("users")
			.withIndex("by_token", (q) =>
				q.eq("tokenIdentifier", identity.tokenIdentifier),
			)
			.unique();

		if (!user) return null;

		return {
			_id: user._id,
			email: user.email,
			name: user.name,
			clerkId: identity.subject,
		};
	},
});

/**
 * Get all deals for a user
 */
export const getUserDeals = internalQuery({
	args: {
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		// Get deals where the user is the owner
		const deals = await ctx.db.query("deals").collect();

		// Filter to user's deals (checking ownerId)
		return deals.filter((deal) => deal.ownerId === args.userId);
	},
});

/**
 * Get all companies
 */
export const getUserCompanies = internalQuery({
	args: {},
	handler: async (ctx) => {
		// Companies are generally shared, return all
		return await ctx.db.query("companies").collect();
	},
});

/**
 * Get all contacts
 */
export const getUserContacts = internalQuery({
	args: {},
	handler: async (ctx) => {
		// Contacts are generally shared, return all
		return await ctx.db.query("contacts").collect();
	},
});

/**
 * Get all documents for a user
 */
export const getUserDocuments = internalQuery({
	args: {
		userId: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("colab_documents")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.collect();
	},
});

/**
 * Get all calendar events for a user
 */
export const getUserCalendarEvents = internalQuery({
	args: {
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("calendar_events")
			.filter((q) => q.eq(q.field("ownerId"), args.userId))
			.collect();
	},
});

/**
 * Get all presentations for a user
 */
export const getUserPresentations = internalQuery({
	args: {
		userId: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("colab_presentations")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.collect();
	},
});
