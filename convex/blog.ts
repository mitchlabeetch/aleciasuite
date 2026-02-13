import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser, checkRole } from "./auth_utils";
import { batchGet, extractIds } from "./lib/batch";

// ============================================
// BLOG POSTS
// ============================================

export const getPosts = query({
	args: {
		status: v.optional(
			v.union(
				v.literal("draft"),
				v.literal("published"),
				v.literal("archived"),
			),
		),
		authorId: v.optional(v.id("users")),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();

		let posts: Array<{
			_id: any;
			_creationTime: number;
			status: "draft" | "published" | "archived";
			authorId?: any;
			title: string;
			slug: string;
			content: string;
			excerpt?: string;
			featuredImage?: string;
			publishedAt?: number;
			seo?: {
				metaTitle?: string;
				metaDescription?: string;
				keywords?: string[];
			};
			tags?: string[];
		}>;
		if (args.status) {
			const status = args.status;
			posts = await ctx.db
				.query("blog_posts")
				.withIndex("by_status", (q) => q.eq("status", status))
				.order("desc")
				.collect();
		} else if (args.authorId) {
			const authorId = args.authorId;
			posts = await ctx.db
				.query("blog_posts")
				.withIndex("by_authorId", (q) => q.eq("authorId", authorId))
				.order("desc")
				.collect();
		} else {
			posts = await ctx.db.query("blog_posts").order("desc").collect();
		}

		// If not authenticated, only show published
		if (!identity) {
			posts = posts.filter((p) => p.status === "published");
		}

		// Batch fetch authors (avoids N+1)
		const authorIds = posts
			.map((p) => p.authorId)
			.filter((id): id is NonNullable<typeof id> => id != null);
		const authors = await batchGet(ctx, authorIds);

		// Create author lookup map with proper typing
		const authorMap = new Map<
			string,
			{ name?: string; avatarUrl?: string } | null
		>();
		authorIds.forEach((id, i) => {
			const author = authors[i];
			if (author && "_tableName" in author) {
				// Only process if it's a users table document
				authorMap.set(id, {
					name: "name" in author ? author.name : undefined,
					avatarUrl: "avatarUrl" in author ? author.avatarUrl : undefined,
				});
			} else {
				authorMap.set(id, null);
			}
		});

		// Enrich with author info (no async)
		const enriched = posts.map((post) => {
			const author = post.authorId ? authorMap.get(post.authorId) : null;
			return {
				...post,
				authorName: author?.name ?? "Inconnu",
				authorAvatar: author?.avatarUrl,
			};
		});

		return enriched;
	},
});

export const getPostBySlug = query({
	args: { slug: v.string() },
	handler: async (ctx, args) => {
		const post = await ctx.db
			.query("blog_posts")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.first();

		if (!post) return null;

		// Only show published posts to unauthenticated users
		const identity = await ctx.auth.getUserIdentity();
		if (!identity && post.status !== "published") {
			return null;
		}

		const author = post.authorId ? await ctx.db.get(post.authorId) : null;
		return {
			...post,
			authorName: author?.name ?? "Inconnu",
			authorAvatar: author?.avatarUrl,
		};
	},
});

export const createPost = mutation({
	args: {
		title: v.string(),
		slug: v.string(),
		content: v.string(),
		excerpt: v.optional(v.string()),
		featuredImage: v.optional(v.string()),
		status: v.union(v.literal("draft"), v.literal("published")),
		seo: v.optional(
			v.object({
				metaTitle: v.optional(v.string()),
				metaDescription: v.optional(v.string()),
				keywords: v.optional(v.array(v.string())),
			}),
		),
		tags: v.optional(v.array(v.string())),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);

		// Check slug uniqueness
		const existing = await ctx.db
			.query("blog_posts")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.first();

		if (existing) {
			throw new Error("Ce slug existe déjà");
		}

		return await ctx.db.insert("blog_posts", {
			...args,
			authorId: user._id,
			publishedAt: args.status === "published" ? Date.now() : undefined,
		});
	},
});

export const updatePost = mutation({
	args: {
		postId: v.id("blog_posts"),
		title: v.optional(v.string()),
		slug: v.optional(v.string()),
		content: v.optional(v.string()),
		excerpt: v.optional(v.string()),
		featuredImage: v.optional(v.string()),
		status: v.optional(
			v.union(
				v.literal("draft"),
				v.literal("published"),
				v.literal("archived"),
			),
		),
		seo: v.optional(
			v.object({
				metaTitle: v.optional(v.string()),
				metaDescription: v.optional(v.string()),
				keywords: v.optional(v.array(v.string())),
			}),
		),
		tags: v.optional(v.array(v.string())),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);
		const post = await ctx.db.get(args.postId);

		if (!post) throw new Error("Article non trouvé");
		// Allow editing if user is author or sudo (imported posts have no authorId)
		const isAuthor = post.authorId && post.authorId === user._id;
		if (!isAuthor && user.role !== "sudo") {
			throw new Error("Permission refusée");
		}

		// Check slug uniqueness if changing
		if (args.slug && args.slug !== post.slug) {
			const slug = args.slug;
			const existing = await ctx.db
				.query("blog_posts")
				.withIndex("by_slug", (q) => q.eq("slug", slug))
				.first();
			if (existing) throw new Error("Ce slug existe déjà");
		}

		const { postId, ...updates } = args;

		// Set publishedAt if publishing for first time
		if (updates.status === "published" && post.status !== "published") {
			(updates as { publishedAt?: number }).publishedAt = Date.now();
		}

		await ctx.db.patch(postId, updates);
	},
});

export const deletePost = mutation({
	args: { postId: v.id("blog_posts") },
	handler: async (ctx, args) => {
		await checkRole(ctx, ["sudo"]);
		await ctx.db.delete(args.postId);
	},
});

// Generate slug from title
export const generateSlug = mutation({
	args: { title: v.string() },
	handler: async (ctx, args) => {
		const baseSlug = args.title
			.toLowerCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "") // Remove accents
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "");

		// Check uniqueness
		let slug = baseSlug;
		let counter = 1;
		while (true) {
			const existing = await ctx.db
				.query("blog_posts")
				.withIndex("by_slug", (q) => q.eq("slug", slug))
				.first();
			if (!existing) break;
			slug = `${baseSlug}-${counter}`;
			counter++;
		}

		return slug;
	},
});

// Export a Colab document as a blog post (draft for review)
export const exportFromColab = mutation({
	args: {
		documentId: v.id("colab_documents"),
		title: v.string(),
		excerpt: v.optional(v.string()),
		featuredImage: v.optional(v.string()),
		category: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);

		// Get the Colab document
		const doc = await ctx.db.get(args.documentId);
		if (!doc) {
			throw new Error("Document non trouvé");
		}

		// Generate a unique slug
		const baseSlug = args.title
			.toLowerCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "");

		let slug = baseSlug;
		let counter = 1;
		while (true) {
			const existing = await ctx.db
				.query("blog_posts")
				.withIndex("by_slug", (q) => q.eq("slug", slug))
				.first();
			if (!existing) break;
			slug = `${baseSlug}-${counter}`;
			counter++;
		}

		// Create the blog post as draft
		const postId = await ctx.db.insert("blog_posts", {
			title: args.title,
			slug,
			content: doc.content, // HTML content from Colab editor
			excerpt: args.excerpt,
			featuredImage: args.featuredImage,
			category: args.category,
			authorId: user._id,
			status: "draft", // Always create as draft for review
		});

		return {
			postId,
			slug,
			message:
				"Article créé en brouillon. Veuillez le réviser avant publication.",
		};
	},
});
