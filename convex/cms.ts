import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { batchGet, extractIds } from "./lib/batch";

// --- Helpers ---

async function getAuthenticatedUser(ctx: QueryCtx | MutationCtx) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) throw new Error("Unauthorized");

	const user = await ctx.db
		.query("users")
		.withIndex("by_token", (q) =>
			q.eq("tokenIdentifier", identity.tokenIdentifier),
		)
		.first();

	if (!user) throw new Error("User not found");
	return user;
}

// --- Queries ---

export const getPage = query({
	args: { slug: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("site_pages")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.first();
	},
});

export const getProposals = query({
	args: {},
	handler: async (ctx) => {
		// In a real app, maybe filter by status or paginate
		const proposals = await ctx.db
			.query("proposals")
			.withIndex("by_status", (q) => q.eq("status", "voting"))
			.collect();

		// Batch fetch authors and pages (avoids N+1)
		const authorIds = extractIds(proposals, "authorId");
		const pageIds = extractIds(proposals, "targetPageId");

		const authors = await batchGet(ctx, authorIds);
		const pages = await batchGet(ctx, pageIds);

		const authorMap = new Map(authorIds.map((id, i) => [id, authors[i]]));
		const pageMap = new Map(pageIds.map((id, i) => [id, pages[i]]));

		// Enrich with author info and page title for display (no async)
		const enriched = proposals.map((p) => {
			const author = authorMap.get(p.authorId);
			const page = pageMap.get(p.targetPageId);
			return {
				...p,
				authorName: author?.name || "Unknown",
				pageTitle: page?.title || "Untitled Page",
				pageSlug: page?.slug,
			};
		});

		return enriched;
	},
});

export const getProposalById = query({
	args: { id: v.id("proposals") },
	handler: async (ctx, args) => {
		const proposal = await ctx.db.get(args.id);
		if (!proposal) return null;

		const author = await ctx.db.get(proposal.authorId);
		const page = await ctx.db.get(proposal.targetPageId);

		return {
			...proposal,
			authorName: author?.name || "Unknown",
			pageTitle: page?.title || "Untitled Page",
			pageSlug: page?.slug,
			currentContent: page?.content || "",
		};
	},
});

// --- Mutations ---

// Sudo direct update
export const updatePage = mutation({
	args: {
		slug: v.string(),
		title: v.string(),
		content: v.string(),
		isPublished: v.boolean(),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);
		if (user.role !== "sudo") {
			throw new Error(
				"Permission denied: Only Sudo can directly update pages.",
			);
		}

		const existing = await ctx.db
			.query("site_pages")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, {
				title: args.title,
				content: args.content,
				isPublished: args.isPublished,
			});
		} else {
			await ctx.db.insert("site_pages", {
				slug: args.slug,
				title: args.title,
				content: args.content,
				isPublished: args.isPublished,
			});
		}
	},
});

// Partner proposal creation
export const createProposal = mutation({
	args: {
		slug: v.string(),
		title: v.string(), // Commit message
		newContent: v.string(),
		aiSummary: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);
		if (user.role !== "partner" && user.role !== "sudo") {
			// Advisors typically don't edit governance content, but customizable.
			throw new Error("Permission denied: Role cannot propose changes.");
		}

		const page = await ctx.db
			.query("site_pages")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.first();

		if (!page) throw new Error("Page not found. Sudo must create it first.");

		await ctx.db.insert("proposals", {
			targetPageId: page._id,
			title: args.title,
			diffSnapshot: args.newContent, // Storing the NEW content. Diffing happens on client or via diff viewer logic.
			authorId: user._id,
			votesFor: [], // Author doesn't auto-vote? Typically yes, but let's keep it explicit.
			votesAgainst: [],
			status: "voting",
			aiSummary: args.aiSummary,
		});
	},
});

export const voteOnProposal = mutation({
	args: {
		proposalId: v.id("proposals"),
		vote: v.union(v.literal("for"), v.literal("against")),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);
		// Any partner/sudo can vote
		if (user.role !== "partner" && user.role !== "sudo")
			throw new Error("Unauthorized to vote");

		const proposal = await ctx.db.get(args.proposalId);
		if (!proposal) throw new Error("Proposal not found");
		if (proposal.status !== "voting") throw new Error("Voting is closed");

		// Remove existing vote if any to allow switching
		const cleanVotesFor = proposal.votesFor.filter((id) => id !== user._id);
		const cleanVotesAgainst = proposal.votesAgainst.filter(
			(id) => id !== user._id,
		);

		if (args.vote === "for") {
			await ctx.db.patch(args.proposalId, {
				votesFor: [...cleanVotesFor, user._id],
				votesAgainst: cleanVotesAgainst,
			});
		} else {
			await ctx.db.patch(args.proposalId, {
				votesFor: cleanVotesFor,
				votesAgainst: [...cleanVotesAgainst, user._id],
			});
		}
	},
});

export const mergeProposal = mutation({
	args: {
		proposalId: v.id("proposals"),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);
		if (user.role !== "sudo" && user.role !== "partner")
			throw new Error("Unauthorized");

		const proposal = await ctx.db.get(args.proposalId);
		if (!proposal) throw new Error("Proposal not found");
		if (proposal.status !== "voting") throw new Error("Proposal is not active");

		// Check Quorum
		const settings = await ctx.db.query("global_settings").first();
		const quorumPercent = settings?.governance?.quorumPercentage || 50;

		// Logic: Total Partners? Or just explicit votes?
		// For MVP, we simply check if votesFor > votesAgainst (Simple Majority)
		// AND votesFor count represents X% of all partners.

		// Fetch all voting eligible users
		// Note: This filter is naive for large datasets but fine for <100 partners
		const partners = await ctx.db
			.query("users")
			.filter((q) =>
				q.or(q.eq(q.field("role"), "partner"), q.eq(q.field("role"), "sudo")),
			)
			.collect();

		const totalEligible = partners.length;
		const votesForCount = proposal.votesFor.length;

		// Participation calculated but not used for MVP - just tracking
		// Just checking approval threshold for now:
		const approvalRate = (votesForCount / totalEligible) * 100;

		if (approvalRate < quorumPercent) {
			throw new Error(
				`Quorum not met. Current: ${approvalRate.toFixed(1)}%, Required: ${quorumPercent}%`,
			);
		}

		// Merge
		await ctx.db.patch(proposal.targetPageId, {
			content: proposal.diffSnapshot, // Apply new content
		});

		await ctx.db.patch(args.proposalId, {
			status: "merged",
		});
	},
});
