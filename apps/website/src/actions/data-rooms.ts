/**
 * Data Room Server Actions
 *
 * Virtual data rooms for secure document sharing during M&A deals
 * Integrates with Minio for file storage and DocuSeal for e-signatures
 */

"use server";

import { db, shared, eq, desc } from "@alepanel/db";
import { sign as aleciaSign } from "@alepanel/db";
import { auth } from "@alepanel/auth";
import { revalidatePath } from "next/cache";

// ============================================
// TYPES
// ============================================

export interface CreateDealRoomInput {
  dealId: string;
  name: string;
  description?: string;
  watermarkEnabled?: boolean;
}

export interface CreateFolderInput {
  roomId: string;
  name: string;
  parentId?: string;
  sortOrder: number;
}

export interface UploadDocumentInput {
  folderId: string;
  filename: string;
  mimeType?: string;
  fileSize?: number;
  minioKey: string;
  isConfidential?: boolean;
}

export interface CreateQuestionInput {
  roomId: string;
  documentId?: string;
  question: string;
}

export interface AnswerQuestionInput {
  questionId: string;
  answer: string;
}

export interface InviteToRoomInput {
  roomId: string;
  email: string;
  role: "viewer" | "contributor" | "admin";
  expiresInDays?: number;
}

// ============================================
// AUTHENTICATION HELPER
// ============================================

async function getAuthenticatedUser() {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((mod) => mod.headers()),
  });

  if (!session?.user) {
    throw new Error("Unauthorized: Please sign in to continue");
  }

  return session.user;
}

// ============================================
// DEAL ROOMS
// ============================================

/**
 * Get deal room by deal ID
 */
export async function getDealRoom(dealId: string) {
  const _user = await getAuthenticatedUser();

  const room = await db.query.dealRooms.findFirst({
    where: eq(aleciaSign.dealRooms.dealId, dealId),
    with: {
      createdBy: {
        columns: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  return room;
}

/**
 * Create a new deal room
 */
export async function createDealRoom(data: CreateDealRoomInput) {
  const user = await getAuthenticatedUser();

  // Verify deal exists
  const deal = await db.query.deals.findFirst({
    where: eq(shared.deals.id, data.dealId),
  });

  if (!deal) {
    throw new Error("Deal not found");
  }

  // Check if room already exists
  const existing = await db.query.dealRooms.findFirst({
    where: eq(aleciaSign.dealRooms.dealId, data.dealId),
  });

  if (existing) {
    throw new Error("Deal room already exists for this deal");
  }

  const [room] = await db
    .insert(aleciaSign.dealRooms)
    .values({
      dealId: data.dealId,
      name: data.name,
      description: data.description,
      isActive: true,
      watermarkEnabled: data.watermarkEnabled ?? true,
      createdBy: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  // Create default folder structure
  await createDefaultFolders(room.id);

  revalidatePath(`/deals/${data.dealId}/dataroom`);

  return room;
}

/**
 * Create default folder structure for new data rooms
 */
async function createDefaultFolders(roomId: string) {
  const defaultFolders = [
    { name: "1. Corporate & Legal", sortOrder: 1 },
    { name: "2. Financial", sortOrder: 2 },
    { name: "3. Tax", sortOrder: 3 },
    { name: "4. HR & Employment", sortOrder: 4 },
    { name: "5. IP & Technology", sortOrder: 5 },
    { name: "6. Commercial", sortOrder: 6 },
    { name: "7. IT Systems", sortOrder: 7 },
    { name: "8. Environmental", sortOrder: 8 },
    { name: "9. Other", sortOrder: 9 },
  ];

  await db.insert(aleciaSign.dealRoomFolders).values(
    defaultFolders.map((folder) => ({
      roomId,
      name: folder.name,
      sortOrder: folder.sortOrder,
      createdAt: new Date(),
    }))
  );
}

/**
 * Update deal room settings
 */
export async function updateDealRoom(
  roomId: string,
  data: { name?: string; description?: string; watermarkEnabled?: boolean; isActive?: boolean }
) {
  const _user = await getAuthenticatedUser();

  const [room] = await db
    .update(aleciaSign.dealRooms)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(aleciaSign.dealRooms.id, roomId))
    .returning();

  const fullRoom = await db.query.dealRooms.findFirst({
    where: eq(aleciaSign.dealRooms.id, roomId),
  });

  if (fullRoom) {
    revalidatePath(`/deals/${fullRoom.dealId}/dataroom`);
  }

  return room;
}

// ============================================
// FOLDERS
// ============================================

/**
 * Get all folders in a room
 */
export async function getFolders(roomId: string) {
  const _user = await getAuthenticatedUser();

  const folders = await db.query.dealRoomFolders.findMany({
    where: eq(aleciaSign.dealRoomFolders.roomId, roomId),
    // TODO: Add orderBy sortOrder when Drizzle supports it properly
  });

  return folders.sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Create a new folder
 */
export async function createFolder(data: CreateFolderInput) {
  const _user = await getAuthenticatedUser();

  const [folder] = await db
    .insert(aleciaSign.dealRoomFolders)
    .values({
      roomId: data.roomId,
      parentId: data.parentId,
      name: data.name,
      sortOrder: data.sortOrder,
      createdAt: new Date(),
    })
    .returning();

  return folder;
}

// ============================================
// DOCUMENTS
// ============================================

/**
 * Get documents in a folder (or all documents in room if no folderId)
 */
export async function getDocuments(roomId: string, folderId?: string) {
  const _user = await getAuthenticatedUser();

  if (folderId) {
    const documents = await db.query.dealRoomDocuments.findMany({
      where: eq(aleciaSign.dealRoomDocuments.folderId, folderId),
      with: {
        uploadedBy: {
          columns: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: [desc(aleciaSign.dealRoomDocuments.createdAt)],
    });

    return documents;
  } else {
    // Get all documents in all folders of this room
    const folders = await db.query.dealRoomFolders.findMany({
      where: eq(aleciaSign.dealRoomFolders.roomId, roomId),
    });

    const folderIds = folders.map((f) => f.id);

    // TODO: Add proper IN clause support for Drizzle
    // For now, fetch all and filter in memory
    const allDocs = await db.query.dealRoomDocuments.findMany({
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

    return allDocs.filter((doc) => folderIds.includes(doc.folderId));
  }
}

/**
 * Upload a document (record metadata, actual file stored in Minio)
 */
export async function uploadDocument(data: UploadDocumentInput) {
  const user = await getAuthenticatedUser();

  // Verify folder exists
  const folder = await db.query.dealRoomFolders.findFirst({
    where: eq(aleciaSign.dealRoomFolders.id, data.folderId),
  });

  if (!folder) {
    throw new Error("Folder not found");
  }

  const [document] = await db
    .insert(aleciaSign.dealRoomDocuments)
    .values({
      folderId: data.folderId,
      filename: data.filename,
      mimeType: data.mimeType,
      fileSize: data.fileSize,
      minioKey: data.minioKey,
      version: 1,
      uploadedBy: user.id,
      isConfidential: data.isConfidential ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  // Log upload action
  await logAccess({
    roomId: folder.roomId,
    documentId: document.id,
    action: "upload",
  });

  revalidatePath(`/dataroom/folders/${data.folderId}`);

  return document;
}

/**
 * Delete a document
 */
export async function deleteDocument(documentId: string) {
  const _user = await getAuthenticatedUser();

  const document = await db.query.dealRoomDocuments.findFirst({
    where: eq(aleciaSign.dealRoomDocuments.id, documentId),
  });

  if (!document) {
    throw new Error("Document not found");
  }

  // TODO: Delete file from Minio storage
  // await minioClient.removeObject(bucketName, document.minioKey);

  await db
    .delete(aleciaSign.dealRoomDocuments)
    .where(eq(aleciaSign.dealRoomDocuments.id, documentId));

  // Log deletion
  const folder = await db.query.dealRoomFolders.findFirst({
    where: eq(aleciaSign.dealRoomFolders.id, document.folderId),
  });

  if (folder) {
    await logAccess({
      roomId: folder.roomId,
      documentId,
      action: "delete",
    });
  }

  revalidatePath(`/dataroom/folders/${document.folderId}`);
}

// ============================================
// ACCESS LOGGING
// ============================================

/**
 * Log access to data room or document
 */
export async function logAccess(params: {
  roomId: string;
  documentId?: string;
  action: "view" | "download" | "upload" | "delete";
}) {
  const _user = await getAuthenticatedUser();

  // Get user agent and IP from headers (Next.js server context)
  const headers = await import("next/headers").then((mod) => mod.headers());
  const userAgent = headers.get("user-agent") || undefined;
  const ipAddress = headers.get("x-forwarded-for") || headers.get("x-real-ip") || undefined;

  await db.insert(aleciaSign.dealRoomAccessLog).values({
    roomId: params.roomId,
    userId: user.id,
    documentId: params.documentId,
    action: params.action,
    ipAddress,
    userAgent,
    createdAt: new Date(),
  });
}

/**
 * Get access log for a room
 */
export async function getAccessLog(roomId: string, limit = 100) {
  const _user = await getAuthenticatedUser();

  const logs = await db.query.dealRoomAccessLog.findMany({
    where: eq(aleciaSign.dealRoomAccessLog.roomId, roomId),
    with: {
      user: {
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
    orderBy: [desc(aleciaSign.dealRoomAccessLog.createdAt)],
    limit,
  });

  return logs;
}

// ============================================
// Q&A SYSTEM
// ============================================

/**
 * Get questions for a room
 */
export async function getQuestions(roomId: string) {
  const _user = await getAuthenticatedUser();

  const questions = await db.query.dealRoomQuestions.findMany({
    where: eq(aleciaSign.dealRoomQuestions.roomId, roomId),
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
    orderBy: [desc(aleciaSign.dealRoomQuestions.createdAt)],
  });

  return questions;
}

/**
 * Create a new question
 */
export async function createQuestion(data: CreateQuestionInput) {
  const user = await getAuthenticatedUser();

  const [question] = await db
    .insert(aleciaSign.dealRoomQuestions)
    .values({
      roomId: data.roomId,
      documentId: data.documentId,
      askedBy: user.id,
      question: data.question,
      status: "pending",
      createdAt: new Date(),
    })
    .returning();

  revalidatePath(`/dataroom/${data.roomId}/qa`);

  return question;
}

/**
 * Answer a question
 */
export async function answerQuestion(data: AnswerQuestionInput) {
  const user = await getAuthenticatedUser();

  const [question] = await db
    .update(aleciaSign.dealRoomQuestions)
    .set({
      answer: data.answer,
      answeredBy: user.id,
      answeredAt: new Date(),
      status: "answered",
    })
    .where(eq(aleciaSign.dealRoomQuestions.id, data.questionId))
    .returning();

  const fullQuestion = await db.query.dealRoomQuestions.findFirst({
    where: eq(aleciaSign.dealRoomQuestions.id, data.questionId),
  });

  if (fullQuestion) {
    revalidatePath(`/dataroom/${fullQuestion.roomId}/qa`);
  }

  return question;
}

// ============================================
// INVITATIONS
// ============================================

/**
 * Invite external user to data room
 */
export async function inviteToRoom(data: InviteToRoomInput) {
  const user = await getAuthenticatedUser();

  // Generate secure token
  const token = crypto.randomUUID();

  // Calculate expiry date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (data.expiresInDays || 30));

  const [invitation] = await db
    .insert(aleciaSign.dealRoomInvitations)
    .values({
      roomId: data.roomId,
      email: data.email,
      role: data.role,
      token,
      invitedBy: user.id,
      expiresAt,
      createdAt: new Date(),
    })
    .returning();

  // TODO: Send invitation email with link
  // const inviteLink = `https://alecia.fr/dataroom/accept/${token}`;
  // await sendEmail({
  //   to: data.email,
  //   subject: "You've been invited to a deal room",
  //   body: `Click here to access: ${inviteLink}`,
  // });

  return invitation;
}

/**
 * Get invitations for a room
 */
export async function getRoomInvitations(roomId: string) {
  const _user = await getAuthenticatedUser();

  const invitations = await db.query.dealRoomInvitations.findMany({
    where: eq(aleciaSign.dealRoomInvitations.roomId, roomId),
    with: {
      invitedBy: {
        columns: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: [desc(aleciaSign.dealRoomInvitations.createdAt)],
  });

  return invitations;
}
