// In-app comments for any entity (deals, companies, contacts)
// Phase 5: Collaboration Suite - FULLY IMPLEMENTED

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getOptionalUser, getAuthenticatedUser } from "./auth_utils";
import { notify } from "./notifications";
import { validateContent } from "./lib/validation";
import { batchGet, extractIds } from "./lib/batch";

// ============================================
// QUERIES
// ============================================

/**
 * Get comments for a specific entity
 */
export const getComments = query({
	args: {
		entityType: v.union(
			v.literal("deal"),
			v.literal("company"),
			v.literal("contact"),
		),
		entityId: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await getOptionalUser(ctx);
		if (!user) return [];

		// Query comments for this entity
		const comments = await ctx.db
			.query("comments")
			.withIndex("by_entity", (q) =>
				q.eq("entityType", args.entityType).eq("entityId", args.entityId),
			)
			.order("desc")
			.collect();

		// Batch fetch authors (avoids N+1)
		const authorIds = extractIds(comments, "authorId");
		const authors = await batchGet(ctx, authorIds);
		const authorMap = new Map(authorIds.map((id, i) => [id, authors[i]]));

		// Enrich with author information (no async)
		const enrichedComments = comments.map((comment) => {
			const author = authorMap.get(comment.authorId);
			return {
				...comment,
				authorName: author?.name ?? "Unknown",
				authorAvatar: author?.avatarUrl,
				createdAt: comment._creationTime,
			};
		});

		return enrichedComments;
	},
});

/**
 * Get comment count for an entity
 */
export const getCommentCount = query({
	args: {
		entityType: v.union(
			v.literal("deal"),
			v.literal("company"),
			v.literal("contact"),
		),
		entityId: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await getOptionalUser(ctx);
		if (!user) return 0;

		const comments = await ctx.db
			.query("comments")
			.withIndex("by_entity", (q) =>
				q.eq("entityType", args.entityType).eq("entityId", args.entityId),
			)
			.collect();

		return comments.length;
	},
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Add a comment to an entity
 */
export const addComment = mutation({
	args: {
		entityType: v.union(
			v.literal("deal"),
			v.literal("company"),
			v.literal("contact"),
		),
		entityId: v.string(),
		content: v.string(),
		mentions: v.optional(v.array(v.id("users"))),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);

		// Validate content (max 5000 chars, no XSS)
		const cleanContent = validateContent(args.content, {
			maxLength: 5000,
			fieldName: "comment",
		});

		// Insert the comment
		const commentId = await ctx.db.insert("comments", {
			entityType: args.entityType,
			entityId: args.entityId,
			content: cleanContent,
			authorId: user._id,
			mentions: args.mentions,
			isEdited: false,
		});

		// Trigger notifications for mentions
		if (args.mentions && args.mentions.length > 0) {
			// Deduplicate mentions
			const uniqueMentions = [...new Set(args.mentions)];

			await Promise.all(
				uniqueMentions.map(async (mentionedUserId) => {
					// Don't notify self
					if (mentionedUserId === user._id) return;

					await notify(ctx, {
						recipientId: mentionedUserId,
						triggerId: user._id,
						type: "mention",
						entityType: "comment",
						entityId: commentId,
						payload: {
							content: cleanContent.substring(0, 100), // Preview
							targetType: args.entityType,
							targetId: args.entityId,
						},
					});
				}),
			);
		}

		return { success: true, commentId };
	},
});

/**
 * Edit a comment
 */
export const editComment = mutation({
	args: {
		commentId: v.id("comments"),
		content: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);

		// Get the comment
		const comment = await ctx.db.get(args.commentId);
		if (!comment) {
			throw new Error("Comment not found");
		}

		// Verify ownership
		if (comment.authorId !== user._id) {
			throw new Error("You can only edit your own comments");
		}

		// Validate content (max 5000 chars, no XSS)
		const cleanContent = validateContent(args.content, {
			maxLength: 5000,
			fieldName: "comment",
		});

		// Update the comment
		await ctx.db.patch(args.commentId, {
			content: cleanContent,
			isEdited: true,
		});

		return { success: true };
	},
});

/**
 * Delete a comment
 */
export const deleteComment = mutation({
	args: {
		commentId: v.id("comments"),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);

		// Get the comment
		const comment = await ctx.db.get(args.commentId);
		if (!comment) {
			throw new Error("Comment not found");
		}

		// Verify ownership (or admin role)
		if (comment.authorId !== user._id && user.role !== "sudo") {
			throw new Error("You can only delete your own comments");
		}

		// Delete the comment
		await ctx.db.delete(args.commentId);

		return { success: true };
	},
});
