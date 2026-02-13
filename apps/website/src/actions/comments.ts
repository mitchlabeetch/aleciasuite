"use server";

// Comments Actions (Universal commenting system)
// Ported from convex/comments.ts

import { db, shared, colab, eq, and, desc, sql } from "@alepanel/db";
import { getAuthenticatedUser } from "./lib/auth";
import { revalidatePath } from "next/cache";

interface Comment {
  id: string;
  entityType: "deal" | "company" | "contact" | "document" | "card" | "board";
  entityId: string;
  content: string;
  authorId: string;
  mentions?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// QUERIES
// ============================================

/**
 * Get comments for a specific entity
 */
export async function getComments(data: {
  entityType: "deal" | "company" | "contact" | "document" | "card" | "board";
  entityId: string;
}) {
  const user = await getAuthenticatedUser();

  const result = await db
    .select({
      id: colab.comments.id,
      entityType: colab.comments.entityType,
      entityId: colab.comments.entityId,
      content: colab.comments.content,
      authorId: colab.comments.authorId,
      mentions: colab.comments.mentions,
      createdAt: colab.comments.createdAt,
      updatedAt: colab.comments.updatedAt,
      author_name: shared.users.fullName,
      author_avatar: shared.users.avatarUrl,
    })
    .from(colab.comments)
    .leftJoin(shared.users, eq(colab.comments.authorId, shared.users.id))
    .where(
      and(
        eq(colab.comments.entityType, data.entityType),
        eq(colab.comments.entityId, data.entityId)
      )
    )
    .orderBy(desc(colab.comments.createdAt));

  return result as unknown as (Comment & {
    author_name: string | null;
    author_avatar?: string | null;
  })[];
}

/**
 * Get comment count for an entity
 */
export async function getCommentCount(data: {
  entityType: "deal" | "company" | "contact" | "document" | "card" | "board";
  entityId: string;
}) {
  const user = await getAuthenticatedUser();

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(colab.comments)
    .where(
      and(
        eq(colab.comments.entityType, data.entityType),
        eq(colab.comments.entityId, data.entityId)
      )
    );

  return result[0]?.count || 0;
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Add a comment to an entity
 */
export async function addComment(data: {
  entityType: "deal" | "company" | "contact" | "document" | "card" | "board";
  entityId: string;
  content: string;
  mentions?: string[];
}) {
  const user = await getAuthenticatedUser();

  // Validate content (max 5000 chars)
  const cleanContent = data.content.substring(0, 5000);

  const [result] = await db
    .insert(colab.comments)
    .values({
      entityType: data.entityType,
      entityId: data.entityId,
      content: cleanContent,
      authorId: user.id,
      mentions: data.mentions || [],
    })
    .returning({ id: colab.comments.id });

  const commentId = result.id;

  // Trigger notifications for mentions
  if (data.mentions && data.mentions.length > 0) {
    const uniqueMentions = [...new Set(data.mentions)];

    for (const mentionedUserId of uniqueMentions) {
      // Don't notify self
      if (mentionedUserId === user.id) continue;

      // TODO: Add notification system
      // await notify({
      //   recipientId: mentionedUserId,
      //   triggerId: user.id,
      //   type: "mention",
      //   entityType: "comment",
      //   entityId: commentId,
      //   payload: {
      //     content: cleanContent.substring(0, 100),
      //     targetType: data.entityType,
      //     targetId: data.entityId,
      //   },
      // });
    }
  }

  revalidatePath(`/${data.entityType}/${data.entityId}`);

  return { success: true, commentId };
}

/**
 * Edit a comment
 */
export async function editComment(commentId: string, content: string) {
  const user = await getAuthenticatedUser();

  const commentResult = await db
    .select()
    .from(colab.comments)
    .where(eq(colab.comments.id, commentId))
    .limit(1);

  if (commentResult.length === 0) {
    throw new Error("Comment not found");
  }

  const comment = commentResult[0];

  // Verify ownership
  if (comment.authorId !== user.id) {
    throw new Error("You can only edit your own comments");
  }

  // Validate content (max 5000 chars)
  const cleanContent = content.substring(0, 5000);

  await db
    .update(colab.comments)
    .set({
      content: cleanContent,
    })
    .where(eq(colab.comments.id, commentId));

  revalidatePath(`/${comment.entityType}/${comment.entityId}`);

  return { success: true };
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: string) {
  const user = await getAuthenticatedUser();

  const commentResult = await db
    .select()
    .from(colab.comments)
    .where(eq(colab.comments.id, commentId))
    .limit(1);

  if (commentResult.length === 0) {
    throw new Error("Comment not found");
  }

  const comment = commentResult[0];

  // Verify ownership (or admin role)
  if (comment.authorId !== user.id && user.role !== "sudo") {
    throw new Error("You can only delete your own comments");
  }

  await db.delete(colab.comments).where(eq(colab.comments.id, commentId));

  revalidatePath(`/${comment.entityType}/${comment.entityId}`);

  return { success: true };
}
