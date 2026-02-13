// Pipedrive Database Operations (V8 Runtime)
// These internal queries/mutations run in V8 (not Node.js)

import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// TOKEN STORAGE (Internal)
// Uses dedicated pipedrive_tokens table
// ============================================

export const storeTokens = internalMutation({
	args: {
		accessToken: v.string(),
		refreshToken: v.string(),
		expiresAt: v.number(),
		apiDomain: v.string(),
	},
	handler: async (ctx, args) => {
		const now = Date.now();

		// Check for existing token record (singleton pattern)
		const existing = await ctx.db.query("pipedrive_tokens").first();

		if (existing) {
			// Update existing tokens
			await ctx.db.patch(existing._id, {
				accessToken: args.accessToken,
				refreshToken: args.refreshToken,
				expiresAt: args.expiresAt,
				apiDomain: args.apiDomain,
				updatedAt: now,
			});
		} else {
			// Create new token record
			await ctx.db.insert("pipedrive_tokens", {
				accessToken: args.accessToken,
				refreshToken: args.refreshToken,
				expiresAt: args.expiresAt,
				apiDomain: args.apiDomain,
				createdAt: now,
				updatedAt: now,
			});
		}
	},
});

export const getStoredTokens = internalQuery({
	args: {},
	handler: async (ctx) => {
		const tokens = await ctx.db.query("pipedrive_tokens").first();
		if (!tokens) return null;

		return {
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
			expiresAt: tokens.expiresAt,
			apiDomain: tokens.apiDomain,
		};
	},
});

// ============================================
// INTERNAL MUTATIONS (Database operations)
// ============================================

export const upsertCompany = internalMutation({
	args: {
		pipedriveId: v.number(),
		name: v.string(),
		address: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("companies")
			.withIndex("by_pipedriveId", (q) =>
				q.eq("pipedriveId", String(args.pipedriveId)),
			)
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, { name: args.name });
			return existing._id;
		} else {
			return await ctx.db.insert("companies", {
				name: args.name,
				pipedriveId: String(args.pipedriveId),
			});
		}
	},
});

export const upsertContact = internalMutation({
	args: {
		companyId: v.id("companies"),
		fullName: v.string(),
		email: v.optional(v.string()),
		phone: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const existing = args.email
			? await ctx.db
					.query("contacts")
					.filter((q) => q.eq(q.field("email"), args.email))
					.first()
			: null;

		if (existing) {
			await ctx.db.patch(existing._id, {
				fullName: args.fullName,
				phone: args.phone,
			});
			return existing._id;
		} else {
			return await ctx.db.insert("contacts", {
				companyId: args.companyId,
				fullName: args.fullName,
				email: args.email,
				phone: args.phone,
			});
		}
	},
});

export const upsertDeal = internalMutation({
	args: {
		pipedriveId: v.number(),
		title: v.string(),
		amount: v.number(),
		stage: v.string(),
		companyId: v.id("companies"),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("deals")
			.withIndex("by_pipedriveId", (q) => q.eq("pipedriveId", args.pipedriveId))
			.first();

		const defaultOwner = await ctx.db.query("users").first();
		if (!defaultOwner)
			throw new Error("Aucun utilisateur - créez d'abord un compte");

		if (existing) {
			await ctx.db.patch(existing._id, {
				title: args.title,
				amount: args.amount,
				stage: args.stage as
					| "sourcing"
					| "qualification"
					| "initial_meeting"
					| "analysis"
					| "valuation"
					| "due_diligence"
					| "negotiation"
					| "closing"
					| "closed_won"
					| "closed_lost",
			});
			return existing._id;
		} else {
			return await ctx.db.insert("deals", {
				pipedriveId: args.pipedriveId,
				title: args.title,
				amount: args.amount,
				stage: args.stage as
					| "sourcing"
					| "qualification"
					| "initial_meeting"
					| "analysis"
					| "valuation"
					| "due_diligence"
					| "negotiation"
					| "closing"
					| "closed_won"
					| "closed_lost",
				companyId: args.companyId,
				ownerId: defaultOwner._id,
			});
		}
	},
});

export const linkPipedriveDeal = internalMutation({
	args: { dealId: v.id("deals"), pipedriveId: v.number() },
	handler: async (ctx, args) => {
		await ctx.db.patch(args.dealId, { pipedriveId: args.pipedriveId });
	},
});

export const getCompanyByPipedriveId = internalQuery({
	args: { pipedriveId: v.number() },
	handler: async (ctx, args) => {
		const company = await ctx.db
			.query("companies")
			.withIndex("by_pipedriveId", (q) =>
				q.eq("pipedriveId", String(args.pipedriveId)),
			)
			.first();
		return company?._id ?? null;
	},
});

export const getDealById = internalQuery({
	args: { dealId: v.id("deals") },
	handler: async (ctx, args) => await ctx.db.get(args.dealId),
});
