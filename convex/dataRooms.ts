/**
 * Virtual Data Rooms - Backend Functions
 *
 * Secure document sharing for M&A deals with:
 * - Room CRUD operations
 * - Folder management
 * - Document upload/download with access control
 * - Q&A system
 * - Access logging
 * - External user invitations
 */

import { mutation, query, internalQuery, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser, getOptionalUser } from "./auth_utils";
import type { Id, Doc } from "./_generated/dataModel";
import { api, internal } from "./_generated/api";
import { addWatermarkToPdf, isPdfFileName } from "./lib/pdfWatermark";

// =============================================================================
// ACCESS CONTROL HELPER
// =============================================================================

interface DocumentAccessInfo {
  accessLevel: "all" | "buyer_group" | "seller_only" | "restricted";
  restrictedTo?: string[];
}

interface UserAccessInfo {
  _id: Id<"users">;
  role: "sudo" | "partner" | "advisor" | "user";
  email?: string;
}

function canAccessDocument(
  doc: DocumentAccessInfo,
  user: UserAccessInfo,
): boolean {
  // "all" - everyone can access
  if (doc.accessLevel === "all") return true;

  // "seller_only" - only sudo/partner roles
  if (doc.accessLevel === "seller_only") {
    return user.role === "sudo" || user.role === "partner";
  }

  // "buyer_group" - buyers and sellers (not advisors)
  if (doc.accessLevel === "buyer_group") {
    return user.role !== "advisor";
  }

  // "restricted" - check restrictedTo array
  if (doc.accessLevel === "restricted" && doc.restrictedTo) {
    const emailDomain = user.email?.split("@")[1];
    return (
      doc.restrictedTo.includes(user._id.toString()) ||
      (emailDomain !== undefined && doc.restrictedTo.includes(emailDomain))
    );
  }

  return false;
}

// =============================================================================
// TYPES
// =============================================================================

type RoomStatus = "setup" | "active" | "closed" | "archived";
type FolderCategory =
  | "legal"
  | "financial"
  | "tax"
  | "hr"
  | "ip"
  | "commercial"
  | "it"
  | "environmental"
  | "other";

// Default folder structure for new data rooms
const DEFAULT_FOLDERS: {
  name: string;
  category: FolderCategory;
  order: number;
}[] = [
  { name: "1. Corporate", category: "legal", order: 1 },
  { name: "2. Financial", category: "financial", order: 2 },
  { name: "3. Tax", category: "tax", order: 3 },
  { name: "4. HR & Employment", category: "hr", order: 4 },
  { name: "5. IP & Technology", category: "ip", order: 5 },
  { name: "6. Commercial", category: "commercial", order: 6 },
  { name: "7. IT Systems", category: "it", order: 7 },
  { name: "8. Environmental", category: "environmental", order: 8 },
  { name: "9. Other", category: "other", order: 9 },
];

// =============================================================================
// ROOM QUERIES
// =============================================================================

/**
 * Get all data rooms (for current user)
 */
export const listRooms = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("setup"),
        v.literal("active"),
        v.literal("closed"),
        v.literal("archived"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    let rooms: Doc<"deal_rooms">[];
    if (args.status) {
      rooms = await ctx.db
        .query("deal_rooms")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      rooms = await ctx.db.query("deal_rooms").collect();
    }

    // Enrich with deal info and stats
    const enrichedRooms = await Promise.all(
      rooms.map(async (room) => {
        const deal = await ctx.db.get(room.dealId);
        const documentCount = (
          await ctx.db
            .query("deal_room_documents")
            .withIndex("by_room", (q) => q.eq("roomId", room._id))
            .collect()
        ).length;
        const folderCount = (
          await ctx.db
            .query("deal_room_folders")
            .withIndex("by_room", (q) => q.eq("roomId", room._id))
            .collect()
        ).length;
        const questionCount = (
          await ctx.db
            .query("deal_room_questions")
            .withIndex("by_room", (q) => q.eq("roomId", room._id))
            .collect()
        ).length;
        const invitationCount = (
          await ctx.db
            .query("deal_room_invitations")
            .withIndex("by_room", (q) => q.eq("roomId", room._id))
            .collect()
        ).length;

        return {
          ...room,
          dealTitle: deal?.title || "Unknown Deal",
          dealStage: deal?.stage,
          documentCount,
          folderCount,
          questionCount,
          invitationCount,
        };
      }),
    );

    return enrichedRooms;
  },
});

/**
 * Get a single data room by ID
 */
export const getRoom = query({
  args: { roomId: v.id("deal_rooms") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const room = await ctx.db.get(args.roomId);
    if (!room) return null;

    const deal = await ctx.db.get(room.dealId);
    const createdByUser = await ctx.db.get(room.createdBy);

    return {
      ...room,
      dealTitle: deal?.title || "Unknown Deal",
      dealStage: deal?.stage,
      createdByName: createdByUser?.name || "Unknown",
    };
  },
});

/**
 * Get data room for a specific deal
 */
export const getRoomByDeal = query({
  args: { dealId: v.id("deals") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const room = await ctx.db
      .query("deal_rooms")
      .withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
      .first();

    return room;
  },
});

// =============================================================================
// ROOM MUTATIONS
// =============================================================================

/**
 * Create a new data room for a deal
 */
export const createRoom = mutation({
  args: {
    dealId: v.id("deals"),
    name: v.string(),
    settings: v.optional(
      v.object({
        watermarkEnabled: v.boolean(),
        downloadRestricted: v.boolean(),
        expiresAt: v.optional(v.number()),
        allowedDomains: v.optional(v.array(v.string())),
      }),
    ),
    createDefaultFolders: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const now = Date.now();

    // Check if room already exists for this deal
    const existingRoom = await ctx.db
      .query("deal_rooms")
      .withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
      .first();

    if (existingRoom) {
      throw new Error("A data room already exists for this deal");
    }

    // Create room
    const roomId = await ctx.db.insert("deal_rooms", {
      dealId: args.dealId,
      name: args.name,
      status: "setup",
      settings: args.settings || {
        watermarkEnabled: false,
        downloadRestricted: false,
      },
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });

    // Create default folders if requested
    if (args.createDefaultFolders !== false) {
      for (const folder of DEFAULT_FOLDERS) {
        await ctx.db.insert("deal_room_folders", {
          roomId,
          name: folder.name,
          category: folder.category,
          order: folder.order,
          createdAt: now,
        });
      }
    }

    return roomId;
  },
});

/**
 * Update data room settings
 */
export const updateRoom = mutation({
  args: {
    roomId: v.id("deal_rooms"),
    name: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("setup"),
        v.literal("active"),
        v.literal("closed"),
        v.literal("archived"),
      ),
    ),
    settings: v.optional(
      v.object({
        watermarkEnabled: v.boolean(),
        downloadRestricted: v.boolean(),
        expiresAt: v.optional(v.number()),
        allowedDomains: v.optional(v.array(v.string())),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    const updates: Partial<Doc<"deal_rooms">> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.status !== undefined) updates.status = args.status;
    if (args.settings !== undefined) updates.settings = args.settings;

    await ctx.db.patch(args.roomId, updates);
    return args.roomId;
  },
});

/**
 * Archive a data room
 */
export const archiveRoom = mutation({
  args: { roomId: v.id("deal_rooms") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    await ctx.db.patch(args.roomId, {
      status: "archived",
      updatedAt: Date.now(),
    });

    return args.roomId;
  },
});

// =============================================================================
// FOLDER QUERIES
// =============================================================================

/**
 * Get all folders in a data room
 */
export const listFolders = query({
  args: { roomId: v.id("deal_rooms") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const folders = await ctx.db
      .query("deal_room_folders")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    // Sort by order
    folders.sort((a, b) => a.order - b.order);

    // Get document counts per folder
    const foldersWithCounts = await Promise.all(
      folders.map(async (folder) => {
        const documentCount = (
          await ctx.db
            .query("deal_room_documents")
            .withIndex("by_folder", (q) => q.eq("folderId", folder._id))
            .collect()
        ).length;

        return { ...folder, documentCount };
      }),
    );

    return foldersWithCounts;
  },
});

/**
 * Get folder tree (hierarchical structure)
 */
export const getFolderTree = query({
  args: { roomId: v.id("deal_rooms") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const folders = await ctx.db
      .query("deal_room_folders")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    // Build tree structure
    const folderMap = new Map(
      folders.map((f) => [f._id, { ...f, children: [] as typeof folders }]),
    );
    const rootFolders: ((typeof folders)[0] & { children: typeof folders })[] =
      [];

    for (const folder of folders) {
      const enrichedFolder = folderMap.get(folder._id)!;
      if (folder.parentId) {
        const parent = folderMap.get(folder.parentId);
        if (parent) {
          parent.children.push(enrichedFolder);
        }
      } else {
        rootFolders.push(enrichedFolder);
      }
    }

    // Sort children by order
    const sortChildren = (items: typeof rootFolders) => {
      items.sort((a, b) => a.order - b.order);
      for (const item of items) {
        if (item.children.length > 0) {
          sortChildren(item.children as typeof rootFolders);
        }
      }
    };

    sortChildren(rootFolders);
    return rootFolders;
  },
});

// =============================================================================
// FOLDER MUTATIONS
// =============================================================================

/**
 * Create a new folder
 */
export const createFolder = mutation({
  args: {
    roomId: v.id("deal_rooms"),
    name: v.string(),
    parentId: v.optional(v.id("deal_room_folders")),
    category: v.optional(
      v.union(
        v.literal("legal"),
        v.literal("financial"),
        v.literal("tax"),
        v.literal("hr"),
        v.literal("ip"),
        v.literal("commercial"),
        v.literal("it"),
        v.literal("environmental"),
        v.literal("other"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Get max order in the parent
    const siblings = await ctx.db
      .query("deal_room_folders")
      .withIndex("by_room_parent", (q) =>
        q.eq("roomId", args.roomId).eq("parentId", args.parentId),
      )
      .collect();

    const maxOrder =
      siblings.length > 0 ? Math.max(...siblings.map((f) => f.order)) : 0;

    const folderId = await ctx.db.insert("deal_room_folders", {
      roomId: args.roomId,
      parentId: args.parentId,
      name: args.name,
      order: maxOrder + 1,
      category: args.category,
      createdAt: Date.now(),
    });

    return folderId;
  },
});

/**
 * Rename a folder
 */
export const renameFolder = mutation({
  args: {
    folderId: v.id("deal_room_folders"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    await ctx.db.patch(args.folderId, { name: args.name });
    return args.folderId;
  },
});

/**
 * Move a folder to a new parent
 */
export const moveFolder = mutation({
  args: {
    folderId: v.id("deal_room_folders"),
    newParentId: v.optional(v.id("deal_room_folders")),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const folder = await ctx.db.get(args.folderId);
    if (!folder) throw new Error("Folder not found");

    // Get max order in new parent
    const siblings = await ctx.db
      .query("deal_room_folders")
      .withIndex("by_room_parent", (q) =>
        q.eq("roomId", folder.roomId).eq("parentId", args.newParentId),
      )
      .collect();

    const maxOrder =
      siblings.length > 0 ? Math.max(...siblings.map((f) => f.order)) : 0;

    await ctx.db.patch(args.folderId, {
      parentId: args.newParentId,
      order: maxOrder + 1,
    });

    return args.folderId;
  },
});

/**
 * Delete a folder (and all contents recursively)
 */
export const deleteFolder = mutation({
  args: { folderId: v.id("deal_room_folders") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Helper function to recursively collect all folder IDs to delete
    async function collectFolderIds(
      folderId: Id<"deal_room_folders">,
    ): Promise<Id<"deal_room_folders">[]> {
      const childFolders = await ctx.db
        .query("deal_room_folders")
        .withIndex("by_parent", (q) => q.eq("parentId", folderId))
        .collect();

      const allIds: Id<"deal_room_folders">[] = [folderId];
      for (const child of childFolders) {
        const childIds = await collectFolderIds(child._id);
        allIds.push(...childIds);
      }
      return allIds;
    }

    // Collect all folder IDs to delete (including nested ones)
    const folderIdsToDelete = await collectFolderIds(args.folderId);

    // Delete all documents in all folders
    for (const folderId of folderIdsToDelete) {
      const documents = await ctx.db
        .query("deal_room_documents")
        .withIndex("by_folder", (q) => q.eq("folderId", folderId))
        .collect();

      for (const doc of documents) {
        // Delete from storage
        await ctx.storage.delete(doc.storageId);
        // Delete record
        await ctx.db.delete(doc._id);
      }
    }

    // Delete all folders (in reverse order to delete children first)
    for (const folderId of folderIdsToDelete.reverse()) {
      await ctx.db.delete(folderId);
    }

    return args.folderId;
  },
});

// =============================================================================
// DOCUMENT QUERIES
// =============================================================================

/**
 * List documents in a folder
 */
export const listDocuments = query({
  args: {
    folderId: v.id("deal_room_folders"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const documents = await ctx.db
      .query("deal_room_documents")
      .withIndex("by_folder", (q) => q.eq("folderId", args.folderId))
      .collect();

    // Filter documents based on access level
    const accessible = documents.filter((doc) => canAccessDocument(doc, user));

    // Enrich with uploader info
    const enrichedDocs = await Promise.all(
      accessible.map(async (doc) => {
        const uploader = await ctx.db.get(doc.uploadedBy);
        const fileUrl = await ctx.storage.getUrl(doc.storageId);

        return {
          ...doc,
          uploaderName: uploader?.name || "Unknown",
          fileUrl,
        };
      }),
    );

    return enrichedDocs;
  },
});

/**
 * List all documents in a room
 */
export const listRoomDocuments = query({
  args: { roomId: v.id("deal_rooms") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const documents = await ctx.db
      .query("deal_room_documents")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    // Filter documents based on access level
    const accessible = documents.filter((doc) => canAccessDocument(doc, user));

    // Enrich with folder and uploader info
    const enrichedDocs = await Promise.all(
      accessible.map(async (doc) => {
        const folder = await ctx.db.get(doc.folderId);
        const uploader = await ctx.db.get(doc.uploadedBy);
        const fileUrl = await ctx.storage.getUrl(doc.storageId);

        return {
          ...doc,
          folderName: folder?.name || "Unknown",
          uploaderName: uploader?.name || "Unknown",
          fileUrl,
        };
      }),
    );

    return enrichedDocs;
  },
});

/**
 * Get a single document
 */
export const getDocument = query({
  args: { documentId: v.id("deal_room_documents") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const doc = await ctx.db.get(args.documentId);
    if (!doc) return null;

    // Check if user has access to this document
    if (!canAccessDocument(doc, user)) {
      throw new Error("Access denied to this document");
    }

    const folder = await ctx.db.get(doc.folderId);
    const uploader = await ctx.db.get(doc.uploadedBy);
    const fileUrl = await ctx.storage.getUrl(doc.storageId);

    return {
      ...doc,
      folderName: folder?.name || "Unknown",
      uploaderName: uploader?.name || "Unknown",
      fileUrl,
    };
  },
});

// =============================================================================
// DOCUMENT MUTATIONS
// =============================================================================

/**
 * Generate upload URL for a document
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Create a document record after upload
 */
export const createDocument = mutation({
  args: {
    roomId: v.id("deal_rooms"),
    folderId: v.id("deal_room_folders"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    accessLevel: v.optional(
      v.union(
        v.literal("all"),
        v.literal("buyer_group"),
        v.literal("seller_only"),
        v.literal("restricted"),
      ),
    ),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const documentId = await ctx.db.insert("deal_room_documents", {
      roomId: args.roomId,
      folderId: args.folderId,
      storageId: args.storageId,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      version: 1,
      uploadedBy: user._id,
      uploadedAt: Date.now(),
      accessLevel: args.accessLevel || "all",
      tags: args.tags,
    });

    // Update room updatedAt
    await ctx.db.patch(args.roomId, { updatedAt: Date.now() });

    return documentId;
  },
});

/**
 * Move a document to a different folder
 */
export const moveDocument = mutation({
  args: {
    documentId: v.id("deal_room_documents"),
    newFolderId: v.id("deal_room_folders"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    await ctx.db.patch(args.documentId, { folderId: args.newFolderId });
    return args.documentId;
  },
});

/**
 * Update document metadata
 */
export const updateDocument = mutation({
  args: {
    documentId: v.id("deal_room_documents"),
    fileName: v.optional(v.string()),
    accessLevel: v.optional(
      v.union(
        v.literal("all"),
        v.literal("buyer_group"),
        v.literal("seller_only"),
        v.literal("restricted"),
      ),
    ),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const updates: Record<string, unknown> = {};
    if (args.fileName !== undefined) updates.fileName = args.fileName;
    if (args.accessLevel !== undefined) updates.accessLevel = args.accessLevel;
    if (args.tags !== undefined) updates.tags = args.tags;

    await ctx.db.patch(args.documentId, updates);
    return args.documentId;
  },
});

/**
 * Delete a document
 */
export const deleteDocument = mutation({
  args: { documentId: v.id("deal_room_documents") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const doc = await ctx.db.get(args.documentId);
    if (doc) {
      // Delete from storage
      await ctx.storage.delete(doc.storageId);
      // Delete record
      await ctx.db.delete(args.documentId);
    }

    return args.documentId;
  },
});

// =============================================================================
// DOCUMENT DOWNLOAD WITH WATERMARKING
// =============================================================================

/**
 * Download a document with optional watermarking
 * Returns a watermarked PDF if watermarking is enabled and file is PDF
 */
export const downloadDocument = action({
  args: {
    documentId: v.id("deal_room_documents"),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    success: boolean;
    url?: string;
    watermarked?: boolean;
    error?: string;
  }> => {
    // Get document info
    const document = await ctx.runQuery(
      internal.dataRooms.getDocumentInternal,
      {
        id: args.documentId,
      },
    );

    if (!document) {
      return { success: false, error: "Document not found" };
    }

    // Get room to check watermarking settings
    const room = await ctx.runQuery(internal.dataRooms.getRoomInternal, {
      id: document.roomId,
    });

    if (!room) {
      return { success: false, error: "Room not found" };
    }

    // Check if download is restricted
    if (room.settings?.downloadRestricted) {
      return {
        success: false,
        error: "Downloads are restricted for this room",
      };
    }

    // Get the file URL
    const fileUrl = await ctx.storage.getUrl(document.storageId);
    if (!fileUrl) {
      return { success: false, error: "File not found in storage" };
    }

    // Check if watermarking is enabled and file is a PDF
    const shouldWatermark =
      room.settings?.watermarkEnabled && isPdfFileName(document.fileName);

    if (!shouldWatermark) {
      // Return direct URL for non-watermarked downloads
      return { success: true, url: fileUrl, watermarked: false };
    }

    // Fetch the PDF file
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        return { success: false, error: "Failed to fetch document" };
      }

      const pdfBytes = await response.arrayBuffer();

      // Get user info for watermark
      const uploader = await ctx.runQuery(internal.users.internalGetById, {
        userId: document.uploadedBy,
      });

      // Apply watermark
      const watermarkedPdf = await addWatermarkToPdf(new Uint8Array(pdfBytes), {
        userEmail: uploader?.email || "unknown@user.com",
        userName: uploader?.name,
        includeTimestamp: true,
        customText: `Document: ${document.fileName}`,
      });

      // Store the watermarked PDF temporarily
      const watermarkedStorageId = await ctx.storage.store(
        new Blob([watermarkedPdf as BlobPart], { type: "application/pdf" }),
      );

      // Get URL for watermarked version
      const watermarkedUrl = await ctx.storage.getUrl(watermarkedStorageId);

      // Schedule deletion of temp file after 1 hour
      // Note: In production, you might want to use a scheduled function

      return {
        success: true,
        url: watermarkedUrl || undefined,
        watermarked: true,
      };
    } catch (error) {
      console.error("Watermarking failed:", error);
      // Fallback to original URL if watermarking fails
      return { success: true, url: fileUrl, watermarked: false };
    }
  },
});

// =============================================================================
// ACCESS LOGGING
// =============================================================================

/**
 * Log document access
 */
export const logAccess = mutation({
  args: {
    roomId: v.id("deal_rooms"),
    documentId: v.optional(v.id("deal_room_documents")),
    action: v.union(
      v.literal("view"),
      v.literal("download"),
      v.literal("print"),
      v.literal("share"),
    ),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    await ctx.db.insert("deal_room_access_log", {
      roomId: args.roomId,
      documentId: args.documentId,
      userId: user._id,
      userEmail: user.email,
      action: args.action,
      timestamp: Date.now(),
      duration: args.duration,
    });
  },
});

/**
 * Get access log for a room
 */
export const getAccessLog = query({
  args: {
    roomId: v.id("deal_rooms"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const logs = await ctx.db
      .query("deal_room_access_log")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .take(args.limit || 100);

    // Enrich with document info
    const enrichedLogs = await Promise.all(
      logs.map(async (log) => {
        let documentName = null;
        if (log.documentId) {
          const doc = await ctx.db.get(log.documentId);
          documentName = doc?.fileName;
        }

        return {
          ...log,
          documentName,
        };
      }),
    );

    return enrichedLogs;
  },
});

/**
 * Get access analytics for a room
 */
export const getRoomAnalytics = query({
  args: { roomId: v.id("deal_rooms") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const logs = await ctx.db
      .query("deal_room_access_log")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    // Calculate analytics
    const totalViews = logs.filter((l) => l.action === "view").length;
    const totalDownloads = logs.filter((l) => l.action === "download").length;
    const uniqueUsers = new Set(logs.map((l) => l.userId)).size;

    // Views by day (last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentLogs = logs.filter((l) => l.timestamp > thirtyDaysAgo);

    const viewsByDay: Record<string, number> = {};
    for (const log of recentLogs) {
      const day = new Date(log.timestamp).toISOString().split("T")[0];
      viewsByDay[day] = (viewsByDay[day] || 0) + 1;
    }

    // Most viewed documents
    const docViews: Record<string, number> = {};
    for (const log of logs) {
      if (log.documentId) {
        docViews[log.documentId] = (docViews[log.documentId] || 0) + 1;
      }
    }

    const topDocIds = Object.entries(docViews)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const topDocuments = await Promise.all(
      topDocIds.map(async ([docId, views]) => {
        const doc = await ctx.db.get(docId as Id<"deal_room_documents">);
        return {
          documentId: docId,
          fileName: doc?.fileName || "Unknown",
          views,
        };
      }),
    );

    return {
      totalViews,
      totalDownloads,
      uniqueUsers,
      viewsByDay,
      topDocuments,
    };
  },
});

// =============================================================================
// Q&A SYSTEM
// =============================================================================

/**
 * List questions for a room
 */
export const listQuestions = query({
  args: {
    roomId: v.id("deal_rooms"),
    status: v.optional(
      v.union(
        v.literal("open"),
        v.literal("answered"),
        v.literal("clarification_needed"),
        v.literal("declined"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    let questions: Doc<"deal_room_questions">[];
    if (args.status) {
      questions = await ctx.db
        .query("deal_room_questions")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
      questions = questions.filter((q) => q.roomId === args.roomId);
    } else {
      questions = await ctx.db
        .query("deal_room_questions")
        .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
        .collect();
    }

    // Enrich with answerer info
    const enrichedQuestions = await Promise.all(
      questions.map(async (question) => {
        let answererName = null;
        if (question.answeredBy) {
          const answerer = await ctx.db.get(question.answeredBy);
          answererName = answerer?.name;
        }

        return {
          ...question,
          answererName,
        };
      }),
    );

    // Sort by date (newest first)
    enrichedQuestions.sort((a, b) => b.askedAt - a.askedAt);

    return enrichedQuestions;
  },
});

/**
 * Ask a question
 */
export const askQuestion = mutation({
  args: {
    roomId: v.id("deal_rooms"),
    documentId: v.optional(v.id("deal_room_documents")),
    folderId: v.optional(v.id("deal_room_folders")),
    question: v.string(),
    isPrivate: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const questionId = await ctx.db.insert("deal_room_questions", {
      roomId: args.roomId,
      documentId: args.documentId,
      folderId: args.folderId,
      question: args.question,
      askedBy: user._id,
      askedByName: user.name,
      askedAt: Date.now(),
      status: "open",
      isPrivate: args.isPrivate || false,
    });

    return questionId;
  },
});

/**
 * Answer a question
 */
export const answerQuestion = mutation({
  args: {
    questionId: v.id("deal_room_questions"),
    answer: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    await ctx.db.patch(args.questionId, {
      answer: args.answer,
      answeredBy: user._id,
      answeredAt: Date.now(),
      status: "answered",
    });

    return args.questionId;
  },
});

/**
 * Update question status
 */
export const updateQuestionStatus = mutation({
  args: {
    questionId: v.id("deal_room_questions"),
    status: v.union(
      v.literal("open"),
      v.literal("answered"),
      v.literal("clarification_needed"),
      v.literal("declined"),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    await ctx.db.patch(args.questionId, { status: args.status });
    return args.questionId;
  },
});

// =============================================================================
// INVITATIONS
// =============================================================================

/**
 * List invitations for a room
 */
export const listInvitations = query({
  args: { roomId: v.id("deal_rooms") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const invitations = await ctx.db
      .query("deal_room_invitations")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    // Enrich with inviter info
    const enrichedInvitations = await Promise.all(
      invitations.map(async (inv) => {
        const inviter = await ctx.db.get(inv.invitedBy);
        return {
          ...inv,
          inviterName: inviter?.name || "Unknown",
        };
      }),
    );

    return enrichedInvitations;
  },
});

/**
 * Invite an external user to a room
 */
export const inviteUser = mutation({
  args: {
    roomId: v.id("deal_rooms"),
    email: v.string(),
    name: v.string(),
    company: v.optional(v.string()),
    role: v.union(
      v.literal("viewer"),
      v.literal("downloader"),
      v.literal("questioner"),
    ),
    accessLevel: v.union(
      v.literal("all"),
      v.literal("buyer_group"),
      v.literal("restricted"),
    ),
    folderAccess: v.optional(v.array(v.id("deal_room_folders"))),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Generate access token
    const accessToken = crypto.randomUUID();

    const invitationId = await ctx.db.insert("deal_room_invitations", {
      roomId: args.roomId,
      email: args.email,
      name: args.name,
      company: args.company,
      role: args.role,
      accessLevel: args.accessLevel,
      folderAccess: args.folderAccess,
      invitedBy: user._id,
      invitedAt: Date.now(),
      expiresAt: args.expiresAt,
      status: "pending",
      accessToken,
    });

    return { invitationId, accessToken };
  },
});

/**
 * Revoke an invitation
 */
export const revokeInvitation = mutation({
  args: { invitationId: v.id("deal_room_invitations") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    await ctx.db.patch(args.invitationId, { status: "revoked" });
    return args.invitationId;
  },
});

/**
 * Accept an invitation (for external users)
 */
export const acceptInvitation = mutation({
  args: { accessToken: v.string() },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("deal_room_invitations")
      .withIndex("by_token", (q) => q.eq("accessToken", args.accessToken))
      .first();

    if (!invitation) {
      throw new Error("Invalid invitation token");
    }

    if (invitation.status !== "pending") {
      throw new Error("Invitation is no longer valid");
    }

    if (invitation.expiresAt && invitation.expiresAt < Date.now()) {
      await ctx.db.patch(invitation._id, { status: "expired" });
      throw new Error("Invitation has expired");
    }

    await ctx.db.patch(invitation._id, {
      status: "accepted",
      acceptedAt: Date.now(),
    });

    return invitation;
  },
});

// ============================================
// INTERNAL QUERIES (for notification service)
// ============================================

/**
 * Get room by ID (internal - no auth check)
 */
export const getRoomInternal = internalQuery({
  args: { id: v.id("deal_rooms") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get document by ID (internal - no auth check)
 */
export const getDocumentInternal = internalQuery({
  args: { id: v.id("deal_room_documents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get invitation by ID (internal - no auth check)
 */
export const getInvitationInternal = internalQuery({
  args: { id: v.id("deal_room_invitations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
