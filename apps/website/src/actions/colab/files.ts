"use server";

/**
 * Colab Files Server Actions
 *
 * File upload and storage management using Minio/S3.
 * Ported from Convex to Drizzle ORM + PostgreSQL.
 *
 * Note: This replaces Convex storage with Minio. The file storage workflow is:
 * 1. Client requests a signed upload URL
 * 2. Client uploads directly to Minio
 * 3. Client calls saveFile to record metadata in PostgreSQL
 */

import { db, colab, eq, and, desc } from "@alepanel/db";
import { getAuthenticatedUser } from "../lib/auth";
import { revalidatePath } from "next/cache";

// TODO: Implement Minio client for signed URL generation
// This is a placeholder that shows the structure needed
export async function generateUploadUrl() {
  const user = await getAuthenticatedUser();

  // TODO: Generate a signed Minio upload URL
  // Example with minio client:
  // const minioClient = new Minio.Client({ ... });
  // const uploadUrl = await minioClient.presignedPutObject('bucket', key, expiry);

  throw new Error(
    "generateUploadUrl not yet implemented - requires Minio integration"
  );

  // Return format should be:
  // return { uploadUrl: string, fileKey: string };
}

// Save file metadata after successful upload to Minio
export async function saveFile(args: {
  fileKey: string; // Minio object key
  fileName: string;
  fileType: string;
  size: number;
  documentId?: string;
  boardId?: string;
}) {
  const user = await getAuthenticatedUser();

  const [file] = await db
    .insert(colab.files)
    .values({
      minioKey: args.fileKey,
      filename: args.fileName,
      mimeType: args.fileType,
      fileSize: args.size,
      documentId: args.documentId || null,
      boardId: args.boardId || null,
      ownerId: user.id,
    })
    .returning();

  revalidatePath("/colab/files");
  return file.id;
}

// List files for authenticated user
export async function listFiles(args?: {
  documentId?: string;
  boardId?: string;
}) {
  const user = await getAuthenticatedUser();

  const query = db
    .select()
    .from(colab.files)
    .where(eq(colab.files.ownerId, user.id))
    .orderBy(desc(colab.files.createdAt));

  // Apply filters if provided
  if (args?.documentId) {
    const files = await db
      .select()
      .from(colab.files)
      .where(
        and(
          eq(colab.files.ownerId, user.id),
          eq(colab.files.documentId, args.documentId)
        )
      )
      .orderBy(desc(colab.files.createdAt));
    return files;
  }

  if (args?.boardId) {
    const files = await db
      .select()
      .from(colab.files)
      .where(
        and(
          eq(colab.files.ownerId, user.id),
          eq(colab.files.boardId, args.boardId)
        )
      )
      .orderBy(desc(colab.files.createdAt));
    return files;
  }

  return await query;
}

// Generate a signed download URL for a file
export async function getFileUrl(fileId: string) {
  const user = await getAuthenticatedUser();

  const file = await db.query.files.findFirst({
    where: eq(colab.files.id, fileId),
  });

  if (!file || file.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  // TODO: Generate signed download URL from Minio
  // For now, return the minio key (actual URL generation requires Minio client)
  // const minioClient = new Minio.Client({ ... });
  // const downloadUrl = await minioClient.presignedGetObject('bucket', file.minioKey, expiry);

  throw new Error(
    "getFileUrl not yet implemented - requires Minio integration for signed URL generation"
  );

  // Return format should be:
  // return downloadUrl;
}

// Delete a file
export async function deleteFile(fileId: string) {
  const user = await getAuthenticatedUser();

  const file = await db.query.files.findFirst({
    where: eq(colab.files.id, fileId),
  });

  if (!file || file.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  // TODO: Delete from Minio
  // const minioClient = new Minio.Client({ ... });
  // await minioClient.removeObject('bucket', file.minioKey);

  // Delete from database
  await db.delete(colab.files).where(eq(colab.files.id, fileId));

  revalidatePath("/colab/files");
}
