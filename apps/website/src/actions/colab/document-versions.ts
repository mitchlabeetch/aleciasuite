"use server";

/**
 * Colab Document Versions Server Actions
 *
 * Version history management for collaborative documents.
 * Ported from Convex to Drizzle ORM + PostgreSQL.
 */

import { db, colab, eq, and, desc } from "@alepanel/db";
import { getAuthenticatedUser } from "../lib/auth";
import { revalidatePath } from "next/cache";

// Save a new version of a document
export async function saveVersion(args: {
  documentId: string;
  content: unknown;
  changeDescription?: string;
}) {
  const user = await getAuthenticatedUser();

  // Verify document ownership
  const document = await db.query.documents.findFirst({
    where: eq(colab.documents.id, args.documentId),
  });

  if (!document || document.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  // Get the latest version number
  const existingVersions = await db.query.documentVersions.findMany({
    where: eq(colab.documentVersions.documentId, args.documentId),
    orderBy: desc(colab.documentVersions.version),
    limit: 1,
  });

  const nextVersionNumber =
    existingVersions.length > 0 ? existingVersions[0].version + 1 : 1;

  const [version] = await db
    .insert(colab.documentVersions)
    .values({
      documentId: args.documentId,
      content: args.content,
      version: nextVersionNumber,
      editedBy: user.id,
    })
    .returning();

  revalidatePath(`/colab/documents/${args.documentId}`);

  return { versionId: version.id, versionNumber: nextVersionNumber };
}

// Get all versions for a document (sorted newest first)
export async function listVersions(documentId: string) {
  const user = await getAuthenticatedUser();

  // Verify document ownership
  const document = await db.query.documents.findFirst({
    where: eq(colab.documents.id, documentId),
  });

  if (!document || document.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  const versions = await db.query.documentVersions.findMany({
    where: eq(colab.documentVersions.documentId, documentId),
    orderBy: desc(colab.documentVersions.createdAt),
  });

  return versions;
}

// Get a specific version by document and version number
export async function getVersion(args: {
  documentId: string;
  versionNumber: number;
}) {
  const user = await getAuthenticatedUser();

  // Verify document ownership
  const document = await db.query.documents.findFirst({
    where: eq(colab.documents.id, args.documentId),
  });

  if (!document || document.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  const version = await db.query.documentVersions.findFirst({
    where: and(
      eq(colab.documentVersions.documentId, args.documentId),
      eq(colab.documentVersions.version, args.versionNumber)
    ),
  });

  return version || null;
}

// Restore a version (copies content back to the document and creates a new version)
export async function restoreVersion(args: {
  documentId: string;
  versionNumber: number;
}) {
  const user = await getAuthenticatedUser();

  // Verify document ownership
  const document = await db.query.documents.findFirst({
    where: eq(colab.documents.id, args.documentId),
  });

  if (!document || document.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  // Get the version to restore
  const versionToRestore = await db.query.documentVersions.findFirst({
    where: and(
      eq(colab.documentVersions.documentId, args.documentId),
      eq(colab.documentVersions.version, args.versionNumber)
    ),
  });

  if (!versionToRestore) {
    throw new Error(`Version ${args.versionNumber} not found`);
  }

  // Update the document with the restored content
  await db
    .update(colab.documents)
    .set({
      content: versionToRestore.content,
      updatedAt: new Date(),
    })
    .where(eq(colab.documents.id, args.documentId));

  // Create a new version marking this as a restore
  const existingVersions = await db.query.documentVersions.findMany({
    where: eq(colab.documentVersions.documentId, args.documentId),
    orderBy: desc(colab.documentVersions.version),
    limit: 1,
  });

  const nextVersionNumber =
    existingVersions.length > 0 ? existingVersions[0].version + 1 : 1;

  await db.insert(colab.documentVersions).values({
    documentId: args.documentId,
    content: versionToRestore.content,
    version: nextVersionNumber,
    editedBy: user.id,
  });

  revalidatePath(`/colab/documents/${args.documentId}`);

  return {
    restoredVersion: args.versionNumber,
    newVersion: nextVersionNumber,
  };
}

// Get version count for a document
export async function getVersionCount(documentId: string) {
  const user = await getAuthenticatedUser();

  // Verify document ownership
  const document = await db.query.documents.findFirst({
    where: eq(colab.documents.id, documentId),
  });

  if (!document || document.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  const versions = await db.query.documentVersions.findMany({
    where: eq(colab.documentVersions.documentId, documentId),
  });

  return versions.length;
}
