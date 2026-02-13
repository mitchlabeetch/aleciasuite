"use server";

/**
 * Colab Files Server Actions
 *
 * File upload and storage management using Minio/S3.
 * Ported from Convex to Drizzle ORM + PostgreSQL.
 *
 * Workflow:
 * 1. Client calls generateUploadUrl() → gets presigned PUT URL + fileKey
 * 2. Client uploads directly to Minio via the presigned URL
 * 3. Client calls saveFile() to record metadata in PostgreSQL
 */

import { db, colab, eq, and, desc } from "@alepanel/db";
import { getAuthenticatedUser } from "../lib/auth";
import { revalidatePath } from "next/cache";
import {
  createPresignedUploadUrl,
  createPresignedDownloadUrl,
  deleteS3Object,
  generateFileKey,
} from "@/lib/s3";

// Generate a presigned upload URL for direct client→Minio upload
export async function generateUploadUrl(args: {
  filename: string;
  contentType: string;
}): Promise<{ uploadUrl: string; fileKey: string }> {
  const user = await getAuthenticatedUser();

  const fileKey = generateFileKey(user.id, args.filename);
  const uploadUrl = await createPresignedUploadUrl(fileKey, args.contentType);

  return { uploadUrl, fileKey };
}

// Save file metadata after successful upload to Minio
export async function saveFile(args: {
  fileKey: string;
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

  if (args?.documentId) {
    return await db
      .select()
      .from(colab.files)
      .where(
        and(
          eq(colab.files.ownerId, user.id),
          eq(colab.files.documentId, args.documentId)
        )
      )
      .orderBy(desc(colab.files.createdAt));
  }

  if (args?.boardId) {
    return await db
      .select()
      .from(colab.files)
      .where(
        and(
          eq(colab.files.ownerId, user.id),
          eq(colab.files.boardId, args.boardId)
        )
      )
      .orderBy(desc(colab.files.createdAt));
  }

  return await db
    .select()
    .from(colab.files)
    .where(eq(colab.files.ownerId, user.id))
    .orderBy(desc(colab.files.createdAt));
}

// Generate a presigned download URL for a file
export async function getFileUrl(fileId: string): Promise<string> {
  const user = await getAuthenticatedUser();

  const file = await db.query.files.findFirst({
    where: eq(colab.files.id, fileId),
  });

  if (!file || file.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  return createPresignedDownloadUrl(file.minioKey);
}

// Delete a file from both Minio and PostgreSQL
export async function deleteFile(fileId: string) {
  const user = await getAuthenticatedUser();

  const file = await db.query.files.findFirst({
    where: eq(colab.files.id, fileId),
  });

  if (!file || file.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  // Delete from Minio
  await deleteS3Object(file.minioKey);

  // Delete from database
  await db.delete(colab.files).where(eq(colab.files.id, fileId));

  revalidatePath("/colab/files");
}
