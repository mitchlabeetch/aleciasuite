"use server";

/**
 * Colab Documents Server Actions
 *
 * CRUD operations for collaborative documents (TipTap/Novel editor).
 * Ported from Convex to Drizzle ORM + PostgreSQL.
 */

import { db, colab, eq, desc } from "@alepanel/db";
import { getAuthenticatedUser } from "../lib/auth";
import { revalidatePath } from "next/cache";

// Get all documents for authenticated user
export async function listDocuments() {
  const user = await getAuthenticatedUser();

  const documents = await db.query.documents.findMany({
    where: eq(colab.documents.ownerId, user.id),
    orderBy: desc(colab.documents.updatedAt),
  });

  return documents;
}

// Get a single document by ID
export async function getDocument(id: string) {
  const user = await getAuthenticatedUser();

  const document = await db.query.documents.findFirst({
    where: eq(colab.documents.id, id),
  });

  if (!document) {
    return null;
  }

  // Only allow access if the document belongs to the user
  // Future: check for shared access via dealId or workspace
  if (document.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  return document;
}

// Get documents for a specific deal
export async function getDocumentsByDeal(dealId: string) {
  const user = await getAuthenticatedUser();

  // TODO: Verify user has access to this deal
  // For now, just check if they're authenticated

  const documents = await db.query.documents.findMany({
    where: eq(colab.documents.dealId, dealId),
  });

  return documents;
}

// Create a new document
export async function createDocument(args: {
  title: string;
  content?: any;
  dealId?: string;
}) {
  const user = await getAuthenticatedUser();

  const [document] = await db
    .insert(colab.documents)
    .values({
      title: args.title,
      content: args.content || {},
      ownerId: user.id,
      dealId: args.dealId || null,
      parentId: null,
      icon: null,
      coverImageUrl: null,
      isTemplate: false,
      isArchived: false,
    })
    .returning();

  revalidatePath("/colab/documents");
  return document.id;
}

// Update a document
export async function updateDocument(args: {
  id: string;
  title?: string;
  content?: any;
  dealId?: string;
  icon?: string;
  coverImageUrl?: string;
}) {
  const user = await getAuthenticatedUser();

  const { id, ...updates } = args;

  const document = await db.query.documents.findFirst({
    where: eq(colab.documents.id, id),
  });

  if (!document) {
    throw new Error("Document not found");
  }

  if (document.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  await db
    .update(colab.documents)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(colab.documents.id, id));

  revalidatePath("/colab/documents");
  revalidatePath(`/colab/documents/${id}`);
}

// Archive a document (soft delete)
export async function archiveDocument(id: string) {
  const user = await getAuthenticatedUser();

  const document = await db.query.documents.findFirst({
    where: eq(colab.documents.id, id),
  });

  if (!document) {
    throw new Error("Document not found");
  }

  if (document.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  await db
    .update(colab.documents)
    .set({
      isArchived: true,
      updatedAt: new Date(),
    })
    .where(eq(colab.documents.id, id));

  revalidatePath("/colab/documents");
}

// Permanently delete a document
export async function deleteDocument(id: string) {
  const user = await getAuthenticatedUser();

  const document = await db.query.documents.findFirst({
    where: eq(colab.documents.id, id),
  });

  if (!document) {
    throw new Error("Document not found");
  }

  if (document.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  await db.delete(colab.documents).where(eq(colab.documents.id, id));

  revalidatePath("/colab/documents");
}
