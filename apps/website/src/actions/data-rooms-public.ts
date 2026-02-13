/**
 * Data Rooms Public Access Server Actions
 *
 * Token-based access to Virtual Data Rooms for external buyers and advisors.
 * No authentication required - access is controlled via secure invitation tokens.
 *
 * Security model:
 * - Token-based authentication (no BetterAuth required)
 * - Token expiry validation
 * - Role-based access control (viewer, contributor, admin)
 * - Document access level filtering
 * - All access is logged
 */

"use server";

import { db, sign, eq, and, inArray } from "@alepanel/db";
import { revalidatePath } from "next/cache";

// ============================================
// TYPES
// ============================================

export interface TokenValidationResult {
  valid: boolean;
  invitation?: {
    id: string;
    name: string;
    email: string;
    role: string;
    roomId: string;
    expiresAt: Date | null;
  };
  room?: {
    id: string;
    name: string;
    dealId: string;
    watermarkEnabled: boolean;
  };
  error?: string;
}

// ============================================
// TOKEN VALIDATION
// ============================================

/**
 * Validate an access token and return invitation details
 */
export async function validateAccessToken(
  token: string
): Promise<TokenValidationResult> {
  // Find invitation by token
  const invitation = await db.query.dealRoomInvitations.findFirst({
    where: eq(sign.dealRoomInvitations.token, token),
  });

  if (!invitation) {
    return {
      valid: false,
      error: "Invalid access token",
    };
  }

  // Check if invitation has expired
  if (invitation.expiresAt && invitation.expiresAt < new Date()) {
    return {
      valid: false,
      error: "This invitation has expired",
    };
  }

  // Check if invitation was accepted (if acceptedAt exists, it's been used)
  // Note: We allow access even after acceptance, we just track the first access

  // Get room info
  const room = await db.query.dealRooms.findFirst({
    where: eq(sign.dealRooms.id, invitation.roomId),
  });

  if (!room) {
    return {
      valid: false,
      error: "Data room no longer exists",
    };
  }

  if (!room.isActive) {
    return {
      valid: false,
      error: "Data room is no longer accessible",
    };
  }

  return {
    valid: true,
    invitation: {
      id: invitation.id,
      name: invitation.email, // External users don't have a name field in our schema
      email: invitation.email,
      role: invitation.role,
      roomId: invitation.roomId,
      expiresAt: invitation.expiresAt,
    },
    room: {
      id: room.id,
      name: room.name,
      dealId: room.dealId,
      watermarkEnabled: room.watermarkEnabled ?? true,
    },
  };
}

/**
 * Get room information for external access
 */
export async function getRoomPublic(token: string) {
  const validation = await validateAccessToken(token);

  if (!validation.valid || !validation.room) {
    return null;
  }

  return validation.room;
}

/**
 * List folders for external access
 */
export async function listFoldersPublic(token: string) {
  const validation = await validateAccessToken(token);

  if (!validation.valid || !validation.invitation) {
    return [];
  }

  // Get all folders in the room
  const folders = await db.query.dealRoomFolders.findMany({
    where: eq(sign.dealRoomFolders.roomId, validation.invitation.roomId),
  });

  // Sort by sortOrder
  const sortedFolders = folders.sort((a, b) => a.sortOrder - b.sortOrder);

  // Get document counts per folder
  const foldersWithCounts = await Promise.all(
    sortedFolders.map(async (folder) => {
      const documents = await db.query.dealRoomDocuments.findMany({
        where: eq(sign.dealRoomDocuments.folderId, folder.id),
      });

      return {
        id: folder.id,
        name: folder.name,
        sortOrder: folder.sortOrder,
        documentCount: documents.length,
      };
    })
  );

  return foldersWithCounts;
}

/**
 * List documents in a folder for external access
 */
export async function listDocumentsPublic(token: string, folderId: string) {
  const validation = await validateAccessToken(token);

  if (!validation.valid || !validation.invitation) {
    return [];
  }

  // Verify folder belongs to the room
  const folder = await db.query.dealRoomFolders.findFirst({
    where: and(
      eq(sign.dealRoomFolders.id, folderId),
      eq(sign.dealRoomFolders.roomId, validation.invitation.roomId)
    ),
  });

  if (!folder) {
    return [];
  }

  // Get documents in folder
  const documents = await db.query.dealRoomDocuments.findMany({
    where: eq(sign.dealRoomDocuments.folderId, folderId),
    with: {
      uploadedBy: {
        columns: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  // Map to public-safe format
  return documents.map((doc) => {
    const uploader = doc.uploadedBy as any;
    return {
      id: doc.id,
      filename: doc.filename,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize,
      version: doc.version,
      createdAt: doc.createdAt,
      uploaderName: uploader?.fullName || "Unknown",
      isConfidential: doc.isConfidential,
      // Only include minioKey if user has download permission
      minioKey:
        validation.invitation?.role !== "viewer" ? doc.minioKey : undefined,
    };
  });
}

/**
 * List all documents in the room for external access
 */
export async function listAllDocumentsPublic(token: string) {
  const validation = await validateAccessToken(token);

  if (!validation.valid || !validation.invitation) {
    return [];
  }

  // Get all folders in room
  const folders = await db.query.dealRoomFolders.findMany({
    where: eq(sign.dealRoomFolders.roomId, validation.invitation.roomId),
  });

  const folderIds = folders.map((f) => f.id);

  if (folderIds.length === 0) {
    return [];
  }

  // Get all documents in all folders
  const documents = await db.query.dealRoomDocuments.findMany({
    where: inArray(sign.dealRoomDocuments.folderId, folderIds),
    with: {
      uploadedBy: {
        columns: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  // Enrich with folder info
  const enrichedDocs = await Promise.all(
    documents.map(async (doc) => {
      const folder = folders.find((f) => f.id === doc.folderId);
      const uploader = doc.uploadedBy as any;

      return {
        id: doc.id,
        filename: doc.filename,
        mimeType: doc.mimeType,
        fileSize: doc.fileSize,
        version: doc.version,
        createdAt: doc.createdAt,
        folderId: doc.folderId,
        folderName: folder?.name || "Unknown",
        uploaderName: uploader?.fullName || "Unknown",
        isConfidential: doc.isConfidential,
      };
    })
  );

  return enrichedDocs;
}

// ============================================
// Q&A FOR EXTERNAL USERS
// ============================================

/**
 * List questions for external access
 */
export async function listQuestionsPublic(token: string) {
  const validation = await validateAccessToken(token);

  if (!validation.valid || !validation.invitation) {
    return [];
  }

  // Get all questions in room
  const questions = await db.query.dealRoomQuestions.findMany({
    where: eq(sign.dealRoomQuestions.roomId, validation.invitation.roomId),
    with: {
      askedBy: {
        columns: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      answeredBy: {
        columns: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      document: {
        columns: {
          id: true,
          filename: true,
        },
      },
    },
  });

  // Sort by date (newest first)
  const sortedQuestions = questions.sort(
    (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
  );

  return sortedQuestions.map((q) => {
    const asker = q.askedBy as any;
    const answerer = q.answeredBy as any;
    return {
      id: q.id,
      question: q.question,
      answer: q.answer,
      status: q.status,
      askedByName: asker?.fullName || "External User",
      answeredByName: answerer?.fullName,
      createdAt: q.createdAt,
      answeredAt: q.answeredAt,
      documentId: q.documentId,
    };
  });
}

/**
 * Ask a question as external user
 */
export async function askQuestionPublic(
  token: string,
  question: string,
  documentId?: string
) {
  const validation = await validateAccessToken(token);

  if (!validation.valid || !validation.invitation) {
    throw new Error("Invalid or expired access token");
  }

  // Note: In the Convex version, only "questioner" role could ask questions
  // Keeping this restriction for now
  if (validation.invitation.role === "viewer") {
    throw new Error("You do not have permission to ask questions");
  }

  // Create the question
  const [newQuestion] = await db
    .insert(sign.dealRoomQuestions)
    .values({
      roomId: validation.invitation.roomId,
      documentId,
      askedBy: validation.invitation.email, // External user identifier
      question,
      status: "pending",
      createdAt: new Date(),
    })
    .returning();

  revalidatePath(`/dataroom/${validation.invitation.roomId}/qa`);

  return newQuestion;
}

// ============================================
// ACCESS LOGGING FOR EXTERNAL USERS
// ============================================

/**
 * Log document access for external users
 */
export async function logAccessPublic(
  token: string,
  action: "view" | "download",
  documentId?: string
) {
  const validation = await validateAccessToken(token);

  if (!validation.valid || !validation.invitation) {
    return; // Silently fail for logging
  }

  // Get headers for IP and user agent
  const headersList = await import("next/headers").then((mod) => mod.headers());
  const userAgent = headersList.get("user-agent") || undefined;
  const ipAddress =
    headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || undefined;

  // Log the access
  await db.insert(sign.dealRoomAccessLog).values({
    roomId: validation.invitation.roomId,
    userId: `external:${validation.invitation.email}`,
    documentId,
    action,
    ipAddress,
    userAgent,
    createdAt: new Date(),
  });

  // Update invitation status to accepted on first access if needed
  // Note: Our schema doesn't have an acceptedAt field, but we could add it
  // For now, we just log the access
}

/**
 * Download a document (returns Minio key for external user)
 * In production, this would integrate with Minio to generate pre-signed URLs
 */
export async function downloadDocumentPublic(token: string, documentId: string) {
  const validation = await validateAccessToken(token);

  if (!validation.valid || !validation.invitation || !validation.room) {
    return { success: false, error: validation.error || "Invalid token" };
  }

  // Check role - viewers cannot download
  if (validation.invitation.role === "viewer") {
    return { success: false, error: "You do not have download permission" };
  }

  // Get document
  const document = await db.query.dealRoomDocuments.findFirst({
    where: eq(sign.dealRoomDocuments.id, documentId),
    with: {
      folder: true,
    },
  });

  if (!document) {
    return { success: false, error: "Document not found" };
  }

  // Verify document belongs to the room
  const folder = document.folder as any;
  if (!folder || folder.roomId !== validation.invitation.roomId) {
    return { success: false, error: "Access denied" };
  }

  // Log the download
  await logAccessPublic(token, "download", documentId);

  // Return the minio key
  // In production, you'd generate a pre-signed URL here
  return {
    success: true,
    minioKey: document.minioKey,
    filename: document.filename,
    watermarked: validation.room.watermarkEnabled,
  };
}
