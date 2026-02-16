"use server";

// Blog Actions
// Ported from convex/blog.ts
// TODO: Migrate to Strapi CMS once deployed

import { db, shared, eq, desc, and, sql, isNotNull } from "@alepanel/db";
import { getAuthenticatedUser } from "./lib/auth";
import { revalidatePath } from "next/cache";

interface BlogPost {
  id: string;
  status: "draft" | "published" | "archived";
  authorId?: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  category?: string;
  publishedAt?: number;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  tags?: string[];
  createdAt: number;
}

// ============================================
// QUERIES
// ============================================

export async function getPosts(args?: {
  status?: "draft" | "published" | "archived";
  authorId?: string;
}) {
  const conditions = [];

  if (args?.status) {
    conditions.push(eq(shared.blogPosts.status, args.status));
  }

  if (args?.authorId) {
    conditions.push(eq(shared.blogPosts.authorId, args.authorId));
  }

  const posts = await db
    .select({
      id: shared.blogPosts.id,
      status: shared.blogPosts.status,
      authorId: shared.blogPosts.authorId,
      title: shared.blogPosts.title,
      slug: shared.blogPosts.slug,
      content: shared.blogPosts.content,
      excerpt: shared.blogPosts.excerpt,
      featuredImage: shared.blogPosts.featuredImage,
      category: shared.blogPosts.category,
      publishedAt: shared.blogPosts.publishedAt,
      seo: shared.blogPosts.seo,
      tags: shared.blogPosts.tags,
      createdAt: shared.blogPosts.createdAt,
      author_name: shared.users.fullName,
      author_avatar: shared.users.avatarUrl,
    })
    .from(shared.blogPosts)
    .leftJoin(shared.users, eq(shared.blogPosts.authorId, shared.users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(shared.blogPosts.createdAt));

  return posts as unknown as (BlogPost & {
    author_name: string | null;
    author_avatar?: string | null;
  })[];
}

export async function getPostBySlug(slug: string) {
  const posts = await db
    .select({
      id: shared.blogPosts.id,
      status: shared.blogPosts.status,
      authorId: shared.blogPosts.authorId,
      title: shared.blogPosts.title,
      slug: shared.blogPosts.slug,
      content: shared.blogPosts.content,
      excerpt: shared.blogPosts.excerpt,
      featuredImage: shared.blogPosts.featuredImage,
      category: shared.blogPosts.category,
      publishedAt: shared.blogPosts.publishedAt,
      seo: shared.blogPosts.seo,
      tags: shared.blogPosts.tags,
      createdAt: shared.blogPosts.createdAt,
      author_name: shared.users.fullName,
      author_avatar: shared.users.avatarUrl,
    })
    .from(shared.blogPosts)
    .leftJoin(shared.users, eq(shared.blogPosts.authorId, shared.users.id))
    .where(eq(shared.blogPosts.slug, slug))
    .limit(1);

  if (posts.length === 0) return null;

  return posts[0] as unknown as BlogPost & {
    author_name: string | null;
    author_avatar?: string | null;
  };
}

export async function getBlogCategories() {
  const result = await db
    .selectDistinct({
      category: shared.blogPosts.category,
    })
    .from(shared.blogPosts)
    .where(isNotNull(shared.blogPosts.category))
    .orderBy(shared.blogPosts.category);

  return result
    .map((row) => row.category)
    .filter((cat): cat is string => cat !== null);
}

// ============================================
// MUTATIONS
// ============================================

export async function createPost(data: {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  status: "draft" | "published";
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  tags?: string[];
}) {
  const user = await getAuthenticatedUser();

  // Check slug uniqueness
  const existing = await db
    .select({ id: shared.blogPosts.id })
    .from(shared.blogPosts)
    .where(eq(shared.blogPosts.slug, data.slug))
    .limit(1);

  if (existing.length > 0) {
    throw new Error("Ce slug existe déjà");
  }

  const publishedAt = data.status === "published" ? Date.now() : null;

  const [result] = await db
    .insert(shared.blogPosts)
    .values({
      title: data.title,
      slug: data.slug,
      content: data.content,
      excerpt: data.excerpt,
      featuredImage: data.featuredImage,
      status: data.status,
      authorId: user.id,
      publishedAt,
      seo: data.seo || {},
      tags: data.tags || [],
      createdAt: Date.now(),
    })
    .returning({ id: shared.blogPosts.id });

  revalidatePath("/blog");
  return result.id;
}

export async function updatePost(
  postId: string,
  data: {
    title?: string;
    slug?: string;
    content?: string;
    excerpt?: string;
    featuredImage?: string;
    status?: "draft" | "published" | "archived";
    seo?: {
      metaTitle?: string;
      metaDescription?: string;
      keywords?: string[];
    };
    tags?: string[];
  }
) {
  const user = await getAuthenticatedUser();

  const postResult = await db
    .select()
    .from(shared.blogPosts)
    .where(eq(shared.blogPosts.id, postId))
    .limit(1);

  if (postResult.length === 0) {
    throw new Error("Article non trouvé");
  }

  const post = postResult[0];

  // Allow editing if user is author or sudo
  const isAuthor = post.authorId && post.authorId === user.id;
  if (!isAuthor && user.role !== "sudo") {
    throw new Error("Permission refusée");
  }

  // Check slug uniqueness if changing
  if (data.slug && data.slug !== post.slug) {
    const existing = await db
      .select({ id: shared.blogPosts.id })
      .from(shared.blogPosts)
      .where(eq(shared.blogPosts.slug, data.slug))
      .limit(1);

    if (existing.length > 0) {
      throw new Error("Ce slug existe déjà");
    }
  }

  // Build update object
  const updates: Record<string, unknown> = {};

  if (data.title !== undefined) updates.title = data.title;
  if (data.slug !== undefined) updates.slug = data.slug;
  if (data.content !== undefined) updates.content = data.content;
  if (data.excerpt !== undefined) updates.excerpt = data.excerpt;
  if (data.featuredImage !== undefined) updates.featuredImage = data.featuredImage;
  if (data.seo !== undefined) updates.seo = data.seo;
  if (data.tags !== undefined) updates.tags = data.tags;

  if (data.status) {
    updates.status = data.status;
    // Set publishedAt if publishing for first time
    if (data.status === "published" && post.status !== "published") {
      updates.publishedAt = Date.now();
    }
  }

  if (Object.keys(updates).length > 0) {
    await db
      .update(shared.blogPosts)
      .set(updates)
      .where(eq(shared.blogPosts.id, postId));
  }

  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
}

export async function deletePost(postId: string) {
  const user = await getAuthenticatedUser();

  if (user.role !== "sudo") {
    throw new Error("Permission refusée");
  }

  await db.delete(shared.blogPosts).where(eq(shared.blogPosts.id, postId));

  revalidatePath("/blog");
}

// Generate slug from title
export async function generateSlug(title: string): Promise<string> {
  const baseSlug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Check uniqueness
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db
      .select({ id: shared.blogPosts.id })
      .from(shared.blogPosts)
      .where(eq(shared.blogPosts.slug, slug))
      .limit(1);

    if (existing.length === 0) break;

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

// Export a Colab document as a blog post (draft for review)
export async function exportFromColab(data: {
  documentId: string;
  title: string;
  excerpt?: string;
  featuredImage?: string;
  category?: string;
}) {
  const user = await getAuthenticatedUser();

  // Get the Colab document - use raw SQL as we're querying from colab schema
  const docResult = await db.execute(
    sql`SELECT content FROM alecia_colab.documents WHERE id = ${data.documentId} LIMIT 1`
  );

  if (docResult.rows.length === 0) {
    throw new Error("Document non trouvé");
  }

  const doc = docResult.rows[0] as { content: string };

  // Generate a unique slug
  const slug = await generateSlug(data.title);

  // Create the blog post as draft
  const [result] = await db
    .insert(shared.blogPosts)
    .values({
      title: data.title,
      slug,
      content: typeof doc.content === 'string' ? doc.content : JSON.stringify(doc.content),
      excerpt: data.excerpt,
      featuredImage: data.featuredImage,
      category: data.category,
      authorId: user.id,
      status: "draft",
      createdAt: Date.now(),
    })
    .returning({ id: shared.blogPosts.id });

  const postId = result.id;

  revalidatePath("/blog");

  return {
    postId,
    slug,
    message: "Article créé en brouillon. Veuillez le réviser avant publication.",
  };
}
