import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { checkRole, getAuthenticatedUser } from "./auth_utils";
import { logger } from "./lib/logger";

// Existing mutations...
export const updateGlobalSettings = mutation({
	args: {
		theme: v.object({
			primaryColor: v.string(),
			radius: v.number(),
			font: v.string(),
		}),
		governance: v.object({
			quorumPercentage: v.number(),
		}),
	},
	handler: async (ctx, args) => {
		// Strictly enforce Sudo role
		await checkRole(ctx, ["sudo"]);

		const existing = await ctx.db.query("global_settings").first();
		if (existing) {
			await ctx.db.patch(existing._id, args);
		} else {
			await ctx.db.insert("global_settings", args);
		}
	},
});

export const updateUserRole = mutation({
	args: {
		userId: v.id("users"),
		role: v.union(
			v.literal("sudo"),
			v.literal("partner"),
			v.literal("advisor"),
		),
	},
	handler: async (ctx, args) => {
		// Strictly enforce Sudo role
		await checkRole(ctx, ["sudo"]);

		await ctx.db.patch(args.userId, { role: args.role });
	},
});

// New mutation for CRM enrichment
export const updateCompany = mutation({
	args: {
		id: v.id("companies"),
		patch: v.object({
			siren: v.optional(v.string()),
			nafCode: v.optional(v.string()),
			vatNumber: v.optional(v.string()),
			address: v.optional(
				v.object({
					street: v.string(),
					city: v.string(),
					zip: v.string(),
					country: v.string(),
				}),
			),
			financials: v.optional(
				v.object({
					revenue: v.optional(v.number()),
					ebitda: v.optional(v.number()),
					netDebt: v.optional(v.number()),
					valuationAsk: v.optional(v.number()),
					year: v.optional(v.number()),
					currency: v.optional(v.string()),
				}),
			),
			pappersId: v.optional(v.string()),
		}),
	},
	handler: async (ctx, args) => {
		// Allow any authenticated role (Sudo, Partner, or Advisor) to update company data.
		await checkRole(ctx, ["sudo", "partner", "advisor"]);

		await ctx.db.patch(args.id, args.patch);
	},
});

/**
 * Ensure the current Clerk user exists in Convex database.
 * Called on first page load / login to sync Clerk identity with Convex users table.
 * Returns the user object.
 */
export const ensureUser = mutation({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return null; // Not logged in
		}

		// Check if user exists
		const existingUser = await ctx.db
			.query("users")
			.withIndex("by_token", (q) =>
				q.eq("tokenIdentifier", identity.tokenIdentifier),
			)
			.first();

		if (existingUser) {
			// Update name/email/avatar if changed in Clerk
			const updates: Record<string, string | undefined> = {};
			if (identity.name && identity.name !== existingUser.name) {
				updates.name = identity.name;
			}
			if (identity.email && identity.email !== existingUser.email) {
				updates.email = identity.email;
			}
			if (
				identity.pictureUrl &&
				identity.pictureUrl !== existingUser.avatarUrl
			) {
				updates.avatarUrl = identity.pictureUrl;
			}

			if (Object.keys(updates).length > 0) {
				await ctx.db.patch(existingUser._id, updates);
			}

			return existingUser;
		}

		// Create new user - default role is "advisor" (lowest privilege)
		// Can be promoted via seedTeam or manually by sudo
		const userId = await ctx.db.insert("users", {
			tokenIdentifier: identity.tokenIdentifier,
			name: identity.name || identity.email?.split("@")[0] || "Unknown User",
			email: identity.email || "",
			avatarUrl: identity.pictureUrl,
			role: "advisor", // Default role - sudo/partner can promote
		});

		logger.audit("user_created", userId.toString(), {
			email: identity.email,
			role: "advisor",
		});

		return await ctx.db.get(userId);
	},
});
