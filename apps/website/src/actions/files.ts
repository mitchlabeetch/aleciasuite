/**
 * File Storage Server Actions
 *
 * S3/Minio file operations + transaction logo management.
 * Ported from convex/files.ts + convex/logos.ts
 */

"use server";

import { db, shared, eq } from "@alepanel/db";
import { getAuthenticatedUser } from "./lib/auth";
import { revalidatePath } from "next/cache";

// ============================================
// S3/MINIO FILE OPERATIONS
// ============================================

/**
 * Generate a presigned upload URL for S3/Minio
 */
export async function generateUploadUrl(fileName: string, _fileType: string) {
  await getAuthenticatedUser();

  // TODO: Use @aws-sdk/client-s3 + @aws-sdk/s3-request-presigner
  // const s3Client = new S3Client({
  //   endpoint: process.env.MINIO_ENDPOINT,
  //   region: "us-east-1",
  //   credentials: {
  //     accessKeyId: process.env.MINIO_ACCESS_KEY!,
  //     secretAccessKey: process.env.MINIO_SECRET_KEY!,
  //   },
  //   forcePathStyle: true,
  // });

  const key = `uploads/${Date.now()}-${fileName}`;

  // TODO: Generate presigned URL with PutObjectCommand
  // const command = new PutObjectCommand({
  //   Bucket: process.env.MINIO_BUCKET!,
  //   Key: key,
  //   ContentType: fileType,
  // });
  // const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  // Placeholder until Minio is configured
  const uploadUrl = `${process.env.MINIO_PUBLIC_URL || "/api/upload"}/${key}`;

  return { uploadUrl, key };
}

/**
 * Delete a file from S3/Minio
 */
export async function deleteFile(key: string) {
  await getAuthenticatedUser();

  // TODO: Use S3Client.send(new DeleteObjectCommand(...))
  console.info("[Files] Delete requested for:", key);
}

/**
 * Get public URL for a file
 */
export async function getFileUrl(key: string): Promise<string> {
  return `${process.env.MINIO_PUBLIC_URL || ""}/${key}`;
}

// ============================================
// TRANSACTION LOGO MANAGEMENT
// ============================================

/**
 * Update transaction logos
 */
export async function updateTransactionLogos(args: {
  transactionId: string;
  clientLogoUrl?: string;
  acquirerLogoUrl?: string;
}) {
  await getAuthenticatedUser();

  const updateData: Record<string, unknown> = {};

  if (args.clientLogoUrl !== undefined) {
    updateData.clientLogo = args.clientLogoUrl;
  }
  if (args.acquirerLogoUrl !== undefined) {
    updateData.acquirerLogo = args.acquirerLogoUrl;
  }

  if (Object.keys(updateData).length > 0) {
    await db
      .update(shared.transactions)
      .set(updateData)
      .where(eq(shared.transactions.id, args.transactionId));
  }

  revalidatePath("/transactions");
  return { success: true };
}

/**
 * Bulk update multiple transaction logos
 */
export async function bulkUpdateLogos(
  updates: Array<{
    transactionId: string;
    clientLogoUrl?: string;
    acquirerLogoUrl?: string;
  }>
) {
  await getAuthenticatedUser();

  const results: Array<{ id: string; success: boolean; error?: string }> = [];

  for (const update of updates) {
    try {
      await updateTransactionLogos(update);
      results.push({ id: update.transactionId, success: true });
    } catch (error) {
      results.push({
        id: update.transactionId,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return {
    total: updates.length,
    successful: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  };
}

/**
 * Clear all transaction logos (admin operation)
 */
export async function clearAllTransactionLogos() {
  const _user = await getAuthenticatedUser();

  await db
    .update(shared.transactions)
    .set({
      clientLogo: null,
      acquirerLogo: null,
    });

  revalidatePath("/transactions");
  return { success: true };
}
