"use server";

// Forum Actions
// Ported from convex/forum.ts

import { db, shared, eq, desc, and, sql, count, max } from "@alepanel/db";
import { getAuthenticatedUser } from "./lib/auth";
import { revalidatePath } from "next/cache";

interface ForumThread {
  id: string;
  title: string;
  category?: string;
  dealId?: string;
  authorId: string;
  isPinned?: boolean;
  isLocked?: boolean;
  createdAt: number;
}

interface ForumPost {
  id: string;
  threadId: string;
  content: string;
  authorId: string;
  parentPostId?: string;
  isEdited?: boolean;
  createdAt: number;
}

// ============================================
// FORUM THREADS
// ============================================

export async function getThreads(args?: {
  category?: string;
  dealId?: string;
}) {
  const _user = await getAuthenticatedUser();

  const conditions = [];

  if (args?.category) {
    conditions.push(eq(shared.forumThreads.category, args.category));
  }

  if (args?.dealId) {
    conditions.push(eq(shared.forumThreads.dealId, args.dealId));
  }

  const threads = await db
    .select({
      id: shared.forumThreads.id,
      title: shared.forumThreads.title,
      category: shared.forumThreads.category,
      dealId: shared.forumThreads.dealId,
      authorId: shared.forumThreads.authorId,
      isPinned: shared.forumThreads.isPinned,
      isLocked: shared.forumThreads.isLocked,
      createdAt: shared.forumThreads.createdAt,
      author_name: shared.users.fullName,
      author_avatar: shared.users.avatarUrl,
    })
    .from(shared.forumThreads)
    .leftJoin(shared.users, eq(shared.forumThreads.authorId, shared.users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(shared.forumThreads.createdAt));

  // Fetch post counts for each thread
  const enriched = await Promise.all(
    threads.map(async (thread) => {
      const postStats = await db
        .select({
          post_count: count(),
          last_activity: max(shared.forumPosts.createdAt),
        })
        .from(shared.forumPosts)
        .where(eq(shared.forumPosts.threadId, thread.id));

      const stats = postStats[0];

      return {
        ...thread,
        postCount: stats.post_count || 0,
        lastActivity: stats.last_activity || thread.createdAt,
      };
    })
  );

  // Sort by pinned first, then by last activity
  return enriched.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return Number(b.lastActivity) - Number(a.lastActivity);
  });
}

export async function getThread(threadId: string) {
  const _user = await getAuthenticatedUser();

  const result = await db
    .select({
      id: shared.forumThreads.id,
      title: shared.forumThreads.title,
      category: shared.forumThreads.category,
      dealId: shared.forumThreads.dealId,
      authorId: shared.forumThreads.authorId,
      isPinned: shared.forumThreads.isPinned,
      isLocked: shared.forumThreads.isLocked,
      createdAt: shared.forumThreads.createdAt,
      author_name: shared.users.fullName,
      author_avatar: shared.users.avatarUrl,
    })
    .from(shared.forumThreads)
    .leftJoin(shared.users, eq(shared.forumThreads.authorId, shared.users.id))
    .where(eq(shared.forumThreads.id, threadId))
    .limit(1);

  if (result.length === 0) return null;

  return result[0] as unknown as ForumThread & {
    author_name: string | null;
    author_avatar?: string | null;
  };
}

export async function createThread(data: {
  title: string;
  category?: string;
  dealId?: string;
  initialPostContent: string;
}) {
  const user = await getAuthenticatedUser();

  // Validate title (max 200 chars)
  const cleanTitle = data.title.substring(0, 200);

  // Validate content (max 10000 chars)
  const cleanContent = data.initialPostContent.substring(0, 10000);

  // Create thread
  const [thread] = await db
    .insert(shared.forumThreads)
    .values({
      title: cleanTitle,
      category: data.category,
      dealId: data.dealId,
      authorId: user.id,
      createdAt: Date.now(),
    })
    .returning({ id: shared.forumThreads.id });

  const threadId = thread.id;

  // Create initial post
  await db.insert(shared.forumPosts).values({
    threadId,
    content: cleanContent,
    authorId: user.id,
    createdAt: Date.now(),
  });

  revalidatePath("/forum");
  return threadId;
}

export async function updateThread(
  threadId: string,
  data: {
    title?: string;
    isPinned?: boolean;
    isLocked?: boolean;
  }
) {
  const user = await getAuthenticatedUser();

  const threadResult = await db
    .select()
    .from(shared.forumThreads)
    .where(eq(shared.forumThreads.id, threadId))
    .limit(1);

  if (threadResult.length === 0) {
    throw new Error("Thread non trouvé");
  }

  const thread = threadResult[0];

  // Only author or sudo can edit
  if (thread.authorId !== user.id && user.role !== "sudo") {
    throw new Error("Permission refusée");
  }

  const updates: Record<string, unknown> = {};

  if (data.title !== undefined) updates.title = data.title;
  if (data.isPinned !== undefined) updates.isPinned = data.isPinned;
  if (data.isLocked !== undefined) updates.isLocked = data.isLocked;

  if (Object.keys(updates).length > 0) {
    await db
      .update(shared.forumThreads)
      .set(updates)
      .where(eq(shared.forumThreads.id, threadId));
  }

  revalidatePath("/forum");
  revalidatePath(`/forum/${threadId}`);
}

export async function deleteThread(threadId: string) {
  const user = await getAuthenticatedUser();

  const threadResult = await db
    .select()
    .from(shared.forumThreads)
    .where(eq(shared.forumThreads.id, threadId))
    .limit(1);

  if (threadResult.length === 0) {
    throw new Error("Thread non trouvé");
  }

  const thread = threadResult[0];

  if (thread.authorId !== user.id && user.role !== "sudo") {
    throw new Error("Permission refusée");
  }

  // Delete all posts in thread (cascade should handle this, but being explicit)
  await db
    .delete(shared.forumPosts)
    .where(eq(shared.forumPosts.threadId, threadId));

  // Delete thread
  await db
    .delete(shared.forumThreads)
    .where(eq(shared.forumThreads.id, threadId));

  revalidatePath("/forum");
}

// ============================================
// FORUM POSTS
// ============================================

export async function getPosts(threadId: string) {
  const _user = await getAuthenticatedUser();

  const result = await db
    .select({
      id: shared.forumPosts.id,
      threadId: shared.forumPosts.threadId,
      content: shared.forumPosts.content,
      authorId: shared.forumPosts.authorId,
      parentPostId: shared.forumPosts.parentPostId,
      isEdited: shared.forumPosts.isEdited,
      createdAt: shared.forumPosts.createdAt,
      author_name: shared.users.fullName,
      author_avatar: shared.users.avatarUrl,
      author_role: shared.users.role,
    })
    .from(shared.forumPosts)
    .leftJoin(shared.users, eq(shared.forumPosts.authorId, shared.users.id))
    .where(eq(shared.forumPosts.threadId, threadId))
    .orderBy(shared.forumPosts.createdAt);

  return result as unknown as (ForumPost & {
    author_name: string | null;
    author_avatar?: string | null;
    author_role?: string | null;
  })[];
}

export async function createPost(data: {
  threadId: string;
  content: string;
  parentPostId?: string;
}) {
  const user = await getAuthenticatedUser();

  // Validate content (max 10000 chars)
  const cleanContent = data.content.substring(0, 10000);

  // Check thread is not locked
  const threadResult = await db
    .select({ isLocked: shared.forumThreads.isLocked })
    .from(shared.forumThreads)
    .where(eq(shared.forumThreads.id, data.threadId))
    .limit(1);

  if (threadResult.length === 0) {
    throw new Error("Thread non trouvé");
  }

  const thread = threadResult[0];

  if (thread.isLocked) {
    throw new Error("Ce thread est verrouillé");
  }

  const [result] = await db
    .insert(shared.forumPosts)
    .values({
      threadId: data.threadId,
      content: cleanContent,
      authorId: user.id,
      parentPostId: data.parentPostId,
      createdAt: Date.now(),
    })
    .returning({ id: shared.forumPosts.id });

  revalidatePath(`/forum/${data.threadId}`);
  return result.id;
}

export async function updatePost(postId: string, content: string) {
  const user = await getAuthenticatedUser();

  const postResult = await db
    .select()
    .from(shared.forumPosts)
    .where(eq(shared.forumPosts.id, postId))
    .limit(1);

  if (postResult.length === 0) {
    throw new Error("Post non trouvé");
  }

  const post = postResult[0];

  if (post.authorId !== user.id && user.role !== "sudo") {
    throw new Error("Permission refusée");
  }

  // Validate content (max 10000 chars)
  const cleanContent = content.substring(0, 10000);

  await db
    .update(shared.forumPosts)
    .set({
      content: cleanContent,
      isEdited: true,
    })
    .where(eq(shared.forumPosts.id, postId));

  revalidatePath(`/forum/${post.threadId}`);
}

export async function deletePost(postId: string) {
  const user = await getAuthenticatedUser();

  const postResult = await db
    .select()
    .from(shared.forumPosts)
    .where(eq(shared.forumPosts.id, postId))
    .limit(1);

  if (postResult.length === 0) {
    throw new Error("Post non trouvé");
  }

  const post = postResult[0];

  if (post.authorId !== user.id && user.role !== "sudo") {
    throw new Error("Permission refusée");
  }

  await db.delete(shared.forumPosts).where(eq(shared.forumPosts.id, postId));

  revalidatePath(`/forum/${post.threadId}`);
}
