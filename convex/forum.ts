import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getOptionalUser, getAuthenticatedUser } from "./auth_utils";
import { validateContent, isCleanText } from "./lib/validation";
import { batchGet, extractIds } from "./lib/batch";

// ============================================
// FORUM THREADS
// ============================================

export const getThreads = query({
	args: {
		category: v.optional(v.string()),
		dealId: v.optional(v.id("deals")),
	},
	handler: async (ctx, args) => {
		const user = await getOptionalUser(ctx);
		if (!user) return []; // Not authenticated

		let threads;
		if (args.category) {
			threads = await ctx.db
				.query("forum_threads")
				.withIndex("by_category", (q) => q.eq("category", args.category))
				.order("desc")
				.collect();
		} else if (args.dealId) {
			threads = await ctx.db
				.query("forum_threads")
				.withIndex("by_dealId", (q) => q.eq("dealId", args.dealId))
				.order("desc")
				.collect();
		} else {
			threads = await ctx.db.query("forum_threads").order("desc").collect();
		}

		// Batch fetch authors (avoids N+1)
		const authorIds = extractIds(threads, "authorId");
		const authors = await batchGet(ctx, authorIds);
		const authorMap = new Map(authorIds.map((id, i) => [id, authors[i]]));

		// Fetch post counts for all threads in parallel (still needed per thread)
		const postCountsPromises = threads.map(async (thread) => {
			const posts = await ctx.db
				.query("forum_posts")
				.withIndex("by_threadId", (q) => q.eq("threadId", thread._id))
				.collect();
			return {
				threadId: thread._id,
				postCount: posts.length,
				lastActivity:
					posts.length > 0
						? Math.max(...posts.map((p) => p._creationTime))
						: thread._creationTime,
			};
		});
		const postCounts = await Promise.all(postCountsPromises);
		const postCountMap = new Map(postCounts.map((p) => [p.threadId, p]));

		// Enrich threads (no async, just mapping)
		const enriched = threads.map((thread) => {
			const author = authorMap.get(thread.authorId);
			const postData = postCountMap.get(thread._id);
			return {
				...thread,
				authorName: author?.name ?? "Inconnu",
				authorAvatar: author?.avatarUrl,
				postCount: postData?.postCount ?? 0,
				lastActivity: postData?.lastActivity ?? thread._creationTime,
			};
		});

		// Sort by pinned first, then by last activity
		return enriched.sort((a, b) => {
			if (a.isPinned && !b.isPinned) return -1;
			if (!a.isPinned && b.isPinned) return 1;
			return b.lastActivity - a.lastActivity;
		});
	},
});

export const getThread = query({
	args: { threadId: v.id("forum_threads") },
	handler: async (ctx, args) => {
		const user = await getOptionalUser(ctx);
		if (!user) return null;

		const thread = await ctx.db.get(args.threadId);
		if (!thread) return null;

		const author = await ctx.db.get(thread.authorId);

		return {
			...thread,
			authorName: author?.name ?? "Inconnu",
			authorAvatar: author?.avatarUrl,
		};
	},
});

export const createThread = mutation({
	args: {
		title: v.string(),
		category: v.optional(v.string()),
		dealId: v.optional(v.id("deals")),
		initialPostContent: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);

		// Validate title (max 200 chars, no XSS)
		const cleanTitle = validateContent(args.title, {
			maxLength: 200,
			fieldName: "title",
		});

		// Validate content (max 10000 chars, no XSS)
		const cleanContent = validateContent(args.initialPostContent, {
			maxLength: 10000,
			fieldName: "content",
		});

		// Create thread
		const threadId = await ctx.db.insert("forum_threads", {
			title: cleanTitle,
			category: args.category,
			dealId: args.dealId,
			authorId: user._id,
		});

		// Create initial post
		await ctx.db.insert("forum_posts", {
			threadId,
			content: cleanContent,
			authorId: user._id,
		});

		return threadId;
	},
});

export const updateThread = mutation({
	args: {
		threadId: v.id("forum_threads"),
		title: v.optional(v.string()),
		isPinned: v.optional(v.boolean()),
		isLocked: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);
		const thread = await ctx.db.get(args.threadId);

		if (!thread) throw new Error("Thread non trouvé");

		// Only author or sudo can edit
		if (thread.authorId !== user._id && user.role !== "sudo") {
			throw new Error("Permission refusée");
		}

		const { threadId, ...updates } = args;
		await ctx.db.patch(threadId, updates);
	},
});

export const deleteThread = mutation({
	args: { threadId: v.id("forum_threads") },
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);
		const thread = await ctx.db.get(args.threadId);

		if (!thread) throw new Error("Thread non trouvé");
		if (thread.authorId !== user._id && user.role !== "sudo") {
			throw new Error("Permission refusée");
		}

		// Delete all posts in thread
		const posts = await ctx.db
			.query("forum_posts")
			.withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
			.collect();

		await Promise.all(posts.map((p) => ctx.db.delete(p._id)));
		await ctx.db.delete(args.threadId);
	},
});

// ============================================
// FORUM POSTS
// ============================================

export const getPosts = query({
	args: { threadId: v.id("forum_threads") },
	handler: async (ctx, args) => {
		const user = await getOptionalUser(ctx);
		if (!user) return []; // Not authenticated

		const posts = await ctx.db
			.query("forum_posts")
			.withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
			.order("asc")
			.collect();

		// Batch fetch authors (avoids N+1)
		const authorIds = extractIds(posts, "authorId");
		const authors = await batchGet(ctx, authorIds);
		const authorMap = new Map(authorIds.map((id, i) => [id, authors[i]]));

		// Enrich with author info (no async)
		const enriched = posts.map((post) => {
			const author = authorMap.get(post.authorId);
			return {
				...post,
				authorName: author?.name ?? "Inconnu",
				authorAvatar: author?.avatarUrl,
				authorRole: author?.role,
			};
		});

		return enriched;
	},
});

export const createPost = mutation({
	args: {
		threadId: v.id("forum_threads"),
		content: v.string(),
		parentPostId: v.optional(v.id("forum_posts")),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);

		// Validate content (max 10000 chars, no XSS)
		const cleanContent = validateContent(args.content, {
			maxLength: 10000,
			fieldName: "content",
		});

		// Check thread is not locked
		const thread = await ctx.db.get(args.threadId);
		if (!thread) throw new Error("Thread non trouvé");
		if (thread.isLocked) throw new Error("Ce thread est verrouillé");

		return await ctx.db.insert("forum_posts", {
			threadId: args.threadId,
			content: cleanContent,
			authorId: user._id,
			parentPostId: args.parentPostId,
		});
	},
});

export const updatePost = mutation({
	args: {
		postId: v.id("forum_posts"),
		content: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);
		const post = await ctx.db.get(args.postId);

		if (!post) throw new Error("Post non trouvé");
		if (post.authorId !== user._id && user.role !== "sudo") {
			throw new Error("Permission refusée");
		}

		// Validate content (max 10000 chars, no XSS)
		const cleanContent = validateContent(args.content, {
			maxLength: 10000,
			fieldName: "content",
		});

		await ctx.db.patch(args.postId, {
			content: cleanContent,
			isEdited: true,
		});
	},
});

export const deletePost = mutation({
	args: { postId: v.id("forum_posts") },
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);
		const post = await ctx.db.get(args.postId);

		if (!post) throw new Error("Post non trouvé");
		if (post.authorId !== user._id && user.role !== "sudo") {
			throw new Error("Permission refusée");
		}

		await ctx.db.delete(args.postId);
	},
});
