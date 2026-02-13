import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getOptionalUser, getAuthenticatedUser } from "./auth_utils";
import { batchGet, extractIds } from "./lib/batch";

// ============================================
// SIGN REQUESTS
// ============================================

export const getSignRequests = query({
	args: {
		status: v.optional(
			v.union(
				v.literal("pending"),
				v.literal("signed"),
				v.literal("rejected"),
				v.literal("expired"),
			),
		),
		dealId: v.optional(v.id("deals")),
		asRequester: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const user = await getOptionalUser(ctx);
		if (!user) return []; // Not authenticated

		let requests;
		if (args.status) {
			const status = args.status;
			requests = await ctx.db
				.query("sign_requests")
				.withIndex("by_status", (q) => q.eq("status", status))
				.order("desc")
				.collect();
		} else if (args.dealId) {
			requests = await ctx.db
				.query("sign_requests")
				.withIndex("by_dealId", (q) => q.eq("dealId", args.dealId))
				.order("desc")
				.collect();
		} else if (args.asRequester) {
			requests = await ctx.db
				.query("sign_requests")
				.withIndex("by_requesterId", (q) => q.eq("requesterId", user._id))
				.order("desc")
				.collect();
		} else {
			// Get requests where user is signer
			requests = await ctx.db
				.query("sign_requests")
				.withIndex("by_signerId", (q) => q.eq("signerId", user._id))
				.order("desc")
				.collect();
		}

		// Batch fetch requesters, signers, and deals (avoids N+1)
		const requesterIds = extractIds(requests, "requesterId");
		const signerIds = extractIds(requests, "signerId");
		const dealIds = extractIds(requests, "dealId");

		const requesters = await batchGet(ctx, requesterIds);
		const signers = await batchGet(ctx, signerIds);
		const deals = await batchGet(ctx, dealIds);

		const requesterMap = new Map(
			requesterIds.map((id, i) => [id, requesters[i]]),
		);
		const signerMap = new Map(signerIds.map((id, i) => [id, signers[i]]));
		const dealMap = new Map(dealIds.map((id, i) => [id, deals[i]]));

		// Enrich with user info (no async)
		const enriched = requests.map((req) => {
			const requester = requesterMap.get(req.requesterId);
			const signer = signerMap.get(req.signerId);
			const deal = req.dealId ? dealMap.get(req.dealId) : null;

			return {
				...req,
				requesterName: requester?.name ?? "Inconnu",
				signerName: signer?.name ?? "Inconnu",
				signerEmail: signer?.email,
				dealTitle: deal?.title,
			};
		});

		return enriched;
	},
});

export const getMyPendingSignatures = query({
	args: {},
	handler: async (ctx) => {
		const user = await getOptionalUser(ctx);
		if (!user) return []; // Not authenticated

		const requests = await ctx.db
			.query("sign_requests")
			.withIndex("by_signerId", (q) => q.eq("signerId", user._id))
			.collect();

		return requests.filter((r) => r.status === "pending");
	},
});

export const createSignRequest = mutation({
	args: {
		title: v.string(),
		documentUrl: v.optional(v.string()),
		documentType: v.union(
			v.literal("nda"),
			v.literal("loi"),
			v.literal("mandate"),
			v.literal("contract"),
			v.literal("other"),
		),
		dealId: v.optional(v.id("deals")),
		signerId: v.id("users"),
		expiresAt: v.optional(v.number()),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);

		return await ctx.db.insert("sign_requests", {
			...args,
			requesterId: user._id,
			status: "pending",
		});
	},
});

export const signDocument = mutation({
	args: {
		requestId: v.id("sign_requests"),
		signatureData: v.string(), // Base64 signature image
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);
		const request = await ctx.db.get(args.requestId);

		if (!request) throw new Error("Demande non trouvée");
		if (request.signerId !== user._id) {
			throw new Error("Vous n'êtes pas le signataire désigné");
		}
		if (request.status !== "pending") {
			throw new Error("Cette demande n'est plus en attente");
		}

		// Check expiry
		if (request.expiresAt && Date.now() > request.expiresAt) {
			await ctx.db.patch(args.requestId, { status: "expired" });
			throw new Error("Cette demande a expiré");
		}

		await ctx.db.patch(args.requestId, {
			status: "signed",
			signedAt: Date.now(),
			signatureData: args.signatureData,
		});
	},
});

export const rejectSignRequest = mutation({
	args: {
		requestId: v.id("sign_requests"),
		reason: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);
		const request = await ctx.db.get(args.requestId);

		if (!request) throw new Error("Demande non trouvée");
		if (request.signerId !== user._id) {
			throw new Error("Vous n'êtes pas le signataire désigné");
		}

		await ctx.db.patch(args.requestId, {
			status: "rejected",
			notes: args.reason ? `Refusé: ${args.reason}` : "Refusé",
		});
	},
});

export const cancelSignRequest = mutation({
	args: { requestId: v.id("sign_requests") },
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);
		const request = await ctx.db.get(args.requestId);

		if (!request) throw new Error("Demande non trouvée");
		if (request.requesterId !== user._id && user.role !== "sudo") {
			throw new Error("Permission refusée");
		}
		if (request.status !== "pending") {
			throw new Error("Impossible d'annuler une demande non en attente");
		}

		await ctx.db.delete(args.requestId);
	},
});

// Check for expired requests (scheduled function)
export const checkExpiredRequests = mutation({
	args: {},
	handler: async (ctx) => {
		const pendingRequests = await ctx.db
			.query("sign_requests")
			.withIndex("by_status", (q) => q.eq("status", "pending"))
			.collect();

		const now = Date.now();
		let expiredCount = 0;

		for (const request of pendingRequests) {
			if (request.expiresAt && now > request.expiresAt) {
				await ctx.db.patch(request._id, { status: "expired" });
				expiredCount++;
			}
		}

		return { expiredCount };
	},
});
