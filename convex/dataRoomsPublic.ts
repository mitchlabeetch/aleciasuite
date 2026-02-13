/**
 * Virtual Data Rooms - Public Access Functions
 *
 * These functions provide access to VDR for external buyers without Clerk authentication.
 * Access is controlled via secure invitation tokens.
 *
 * Security model:
 * - Token-based authentication (no Clerk required)
 * - Token expiry validation
 * - Role-based access control (viewer, downloader, questioner)
 * - Document access level filtering
 * - All access is logged
 */

import {
	query,
	action,
	mutation,
	internalQuery,
	internalMutation,
} from "./_generated/server";
import { v } from "convex/values";
import type { Id, Doc } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { addWatermarkToPdf, isPdfFileName } from "./lib/pdfWatermark";

// =============================================================================
// TOKEN VALIDATION HELPER
// =============================================================================

type Invitation = Doc<"deal_room_invitations">;

interface TokenValidationResult {
	valid: boolean;
	invitation?: Invitation;
	error?: string;
}

/**
 * Internal query to validate and retrieve invitation by token
 */
export const validateTokenInternal = internalQuery({
	args: { token: v.string() },
	handler: async (ctx, args): Promise<TokenValidationResult> => {
		// Find invitation by token
		const invitation = await ctx.db
			.query("deal_room_invitations")
			.withIndex("by_token", (q) => q.eq("accessToken", args.token))
			.first();

		if (!invitation) {
			return { valid: false, error: "Invalid access token" };
		}

		// Check if invitation has been revoked
		if (invitation.status === "revoked") {
			return { valid: false, error: "This invitation has been revoked" };
		}

		// Check if invitation has expired
		if (invitation.expiresAt && invitation.expiresAt < Date.now()) {
			return { valid: false, error: "This invitation has expired" };
		}

		// Check if room is still active
		const room = await ctx.db.get(invitation.roomId);
		if (!room) {
			return { valid: false, error: "Data room no longer exists" };
		}

		if (room.status === "archived" || room.status === "closed") {
			return { valid: false, error: "Data room is no longer accessible" };
		}

		return { valid: true, invitation };
	},
});

// =============================================================================
// PUBLIC QUERIES
// =============================================================================

/**
 * Validate an access token and return invitation details
 * Used by the frontend to check if a token is valid before rendering the VDR
 */
export const validateAccessToken = query({
	args: { token: v.string() },
	handler: async (ctx, args) => {
		// Find invitation by token
		const invitation = await ctx.db
			.query("deal_room_invitations")
			.withIndex("by_token", (q) => q.eq("accessToken", args.token))
			.first();

		if (!invitation) {
			return {
				valid: false,
				error: "Invalid access token",
			};
		}

		// Check if invitation has been revoked
		if (invitation.status === "revoked") {
			return {
				valid: false,
				error: "This invitation has been revoked",
			};
		}

		// Check if invitation has expired
		if (invitation.expiresAt && invitation.expiresAt < Date.now()) {
			return {
				valid: false,
				error: "This invitation has expired",
			};
		}

		// Get room info
		const room = await ctx.db.get(invitation.roomId);
		if (!room) {
			return {
				valid: false,
				error: "Data room no longer exists",
			};
		}

		if (room.status === "archived" || room.status === "closed") {
			return {
				valid: false,
				error: "Data room is no longer accessible",
			};
		}

		// Get deal info for display
		const deal = await ctx.db.get(room.dealId);

		return {
			valid: true,
			invitation: {
				id: invitation._id,
				name: invitation.name,
				email: invitation.email,
				company: invitation.company,
				role: invitation.role,
				accessLevel: invitation.accessLevel,
				folderAccess: invitation.folderAccess,
				status: invitation.status,
			},
			room: {
				id: room._id,
				name: room.name,
				status: room.status,
				settings: room.settings,
			},
			deal: deal
				? {
						title: deal.title,
						stage: deal.stage,
					}
				: null,
		};
	},
});

/**
 * Get room information for external access
 */
export const getRoomPublic = query({
	args: { token: v.string() },
	handler: async (ctx, args) => {
		// Validate token
		const invitation = await ctx.db
			.query("deal_room_invitations")
			.withIndex("by_token", (q) => q.eq("accessToken", args.token))
			.first();

		if (
			!invitation ||
			invitation.status === "revoked" ||
			(invitation.expiresAt && invitation.expiresAt < Date.now())
		) {
			return null;
		}

		const room = await ctx.db.get(invitation.roomId);
		if (!room || room.status === "archived" || room.status === "closed") {
			return null;
		}

		const deal = await ctx.db.get(room.dealId);

		return {
			id: room._id,
			name: room.name,
			status: room.status,
			dealTitle: deal?.title || "Unknown Deal",
			dealStage: deal?.stage,
			settings: {
				watermarkEnabled: room.settings?.watermarkEnabled || false,
				downloadRestricted: room.settings?.downloadRestricted || false,
			},
		};
	},
});

/**
 * List folders for external access
 */
export const listFoldersPublic = query({
	args: { token: v.string() },
	handler: async (ctx, args) => {
		// Validate token
		const invitation = await ctx.db
			.query("deal_room_invitations")
			.withIndex("by_token", (q) => q.eq("accessToken", args.token))
			.first();

		if (
			!invitation ||
			invitation.status === "revoked" ||
			(invitation.expiresAt && invitation.expiresAt < Date.now())
		) {
			return [];
		}

		// Get room
		const room = await ctx.db.get(invitation.roomId);
		if (!room || room.status === "archived" || room.status === "closed") {
			return [];
		}

		// Get all folders in the room
		let folders = await ctx.db
			.query("deal_room_folders")
			.withIndex("by_room", (q) => q.eq("roomId", invitation.roomId))
			.collect();

		// Filter by folder access if restricted
		if (
			invitation.accessLevel === "restricted" &&
			invitation.folderAccess?.length
		) {
			const allowedFolderIds = new Set(
				invitation.folderAccess.map((id) => id.toString()),
			);
			folders = folders.filter((folder) =>
				allowedFolderIds.has(folder._id.toString()),
			);
		}

		// Sort by order
		folders.sort((a, b) => a.order - b.order);

		// Get document counts per folder
		const foldersWithCounts = await Promise.all(
			folders.map(async (folder) => {
				const documents = await ctx.db
					.query("deal_room_documents")
					.withIndex("by_folder", (q) => q.eq("folderId", folder._id))
					.collect();

				// Filter documents by access level
				const accessibleDocs = documents.filter((doc) =>
					canAccessDocumentPublic(doc, invitation),
				);

				return {
					id: folder._id,
					name: folder.name,
					category: folder.category,
					order: folder.order,
					documentCount: accessibleDocs.length,
				};
			}),
		);

		return foldersWithCounts;
	},
});

/**
 * List documents in a folder for external access
 */
export const listDocumentsPublic = query({
	args: {
		token: v.string(),
		folderId: v.id("deal_room_folders"),
	},
	handler: async (ctx, args) => {
		// Validate token
		const invitation = await ctx.db
			.query("deal_room_invitations")
			.withIndex("by_token", (q) => q.eq("accessToken", args.token))
			.first();

		if (
			!invitation ||
			invitation.status === "revoked" ||
			(invitation.expiresAt && invitation.expiresAt < Date.now())
		) {
			return [];
		}

		// Get room
		const room = await ctx.db.get(invitation.roomId);
		if (!room || room.status === "archived" || room.status === "closed") {
			return [];
		}

		// Check folder access
		if (
			invitation.accessLevel === "restricted" &&
			invitation.folderAccess?.length
		) {
			const allowedFolderIds = new Set(
				invitation.folderAccess.map((id) => id.toString()),
			);
			if (!allowedFolderIds.has(args.folderId.toString())) {
				return [];
			}
		}

		// Get documents in folder
		const documents = await ctx.db
			.query("deal_room_documents")
			.withIndex("by_folder", (q) => q.eq("folderId", args.folderId))
			.collect();

		// Filter by access level
		const accessibleDocs = documents.filter((doc) =>
			canAccessDocumentPublic(doc, invitation),
		);

		// Enrich with file URLs and uploader info
		const enrichedDocs = await Promise.all(
			accessibleDocs.map(async (doc) => {
				const uploader = await ctx.db.get(doc.uploadedBy);
				const fileUrl = await ctx.storage.getUrl(doc.storageId);

				return {
					id: doc._id,
					fileName: doc.fileName,
					fileType: doc.fileType,
					fileSize: doc.fileSize,
					version: doc.version,
					uploadedAt: doc.uploadedAt,
					uploaderName: uploader?.name || "Unknown",
					tags: doc.tags,
					// Only include fileUrl if downloads are allowed
					fileUrl:
						invitation.role !== "viewer" && !room.settings?.downloadRestricted
							? fileUrl
							: null,
					// Indicate if watermarking is enabled
					willBeWatermarked:
						room.settings?.watermarkEnabled && isPdfFileName(doc.fileName),
				};
			}),
		);

		return enrichedDocs;
	},
});

/**
 * List all documents in the room for external access
 */
export const listAllDocumentsPublic = query({
	args: { token: v.string() },
	handler: async (ctx, args) => {
		// Validate token
		const invitation = await ctx.db
			.query("deal_room_invitations")
			.withIndex("by_token", (q) => q.eq("accessToken", args.token))
			.first();

		if (
			!invitation ||
			invitation.status === "revoked" ||
			(invitation.expiresAt && invitation.expiresAt < Date.now())
		) {
			return [];
		}

		// Get room
		const room = await ctx.db.get(invitation.roomId);
		if (!room || room.status === "archived" || room.status === "closed") {
			return [];
		}

		// Get all documents in room
		let documents = await ctx.db
			.query("deal_room_documents")
			.withIndex("by_room", (q) => q.eq("roomId", invitation.roomId))
			.collect();

		// Filter by folder access if restricted
		if (
			invitation.accessLevel === "restricted" &&
			invitation.folderAccess?.length
		) {
			const allowedFolderIds = new Set(
				invitation.folderAccess.map((id) => id.toString()),
			);
			documents = documents.filter((doc) =>
				allowedFolderIds.has(doc.folderId.toString()),
			);
		}

		// Filter by access level
		const accessibleDocs = documents.filter((doc) =>
			canAccessDocumentPublic(doc, invitation),
		);

		// Enrich with folder and uploader info
		const enrichedDocs = await Promise.all(
			accessibleDocs.map(async (doc) => {
				const folder = await ctx.db.get(doc.folderId);
				const uploader = await ctx.db.get(doc.uploadedBy);

				return {
					id: doc._id,
					fileName: doc.fileName,
					fileType: doc.fileType,
					fileSize: doc.fileSize,
					version: doc.version,
					uploadedAt: doc.uploadedAt,
					folderId: doc.folderId,
					folderName: folder?.name || "Unknown",
					uploaderName: uploader?.name || "Unknown",
					tags: doc.tags,
					willBeWatermarked:
						room.settings?.watermarkEnabled && isPdfFileName(doc.fileName),
				};
			}),
		);

		return enrichedDocs;
	},
});

// =============================================================================
// Q&A FOR EXTERNAL USERS
// =============================================================================

/**
 * List questions for external access (only public questions)
 */
export const listQuestionsPublic = query({
	args: { token: v.string() },
	handler: async (ctx, args) => {
		// Validate token
		const invitation = await ctx.db
			.query("deal_room_invitations")
			.withIndex("by_token", (q) => q.eq("accessToken", args.token))
			.first();

		if (
			!invitation ||
			invitation.status === "revoked" ||
			(invitation.expiresAt && invitation.expiresAt < Date.now())
		) {
			return [];
		}

		// Get all public questions in room
		const questions = await ctx.db
			.query("deal_room_questions")
			.withIndex("by_room", (q) => q.eq("roomId", invitation.roomId))
			.collect();

		// Filter to only show public questions or questions asked by this user
		const accessibleQuestions = questions.filter(
			(q) => !q.isPrivate || q.askedBy?.toString() === invitation.email,
		);

		// Sort by date (newest first)
		accessibleQuestions.sort((a, b) => b.askedAt - a.askedAt);

		return accessibleQuestions.map((q) => ({
			id: q._id,
			question: q.question,
			answer: q.answer,
			status: q.status,
			askedByName: q.askedByName,
			askedAt: q.askedAt,
			answeredAt: q.answeredAt,
			documentId: q.documentId,
			folderId: q.folderId,
		}));
	},
});

/**
 * Ask a question as external user
 */
export const askQuestionPublic = mutation({
	args: {
		token: v.string(),
		question: v.string(),
		documentId: v.optional(v.id("deal_room_documents")),
		folderId: v.optional(v.id("deal_room_folders")),
	},
	handler: async (ctx, args) => {
		// Validate token
		const invitation = await ctx.db
			.query("deal_room_invitations")
			.withIndex("by_token", (q) => q.eq("accessToken", args.token))
			.first();

		if (
			!invitation ||
			invitation.status === "revoked" ||
			(invitation.expiresAt && invitation.expiresAt < Date.now())
		) {
			throw new Error("Invalid or expired access token");
		}

		// Check role - only questioners can ask questions
		if (invitation.role !== "questioner") {
			throw new Error("You do not have permission to ask questions");
		}

		// Create the question
		const questionId = await ctx.db.insert("deal_room_questions", {
			roomId: invitation.roomId,
			documentId: args.documentId,
			folderId: args.folderId,
			question: args.question,
			askedBy: invitation.email, // External user email as identifier
			askedByName: invitation.name,
			askedAt: Date.now(),
			status: "open",
			isPrivate: false, // External user questions are always public
		});

		return questionId;
	},
});

// =============================================================================
// ACCESS LOGGING FOR EXTERNAL USERS
// =============================================================================

/**
 * Log document access for external users
 */
export const logAccessPublic = mutation({
	args: {
		token: v.string(),
		documentId: v.optional(v.id("deal_room_documents")),
		action: v.union(v.literal("view"), v.literal("download")),
	},
	handler: async (ctx, args) => {
		// Validate token
		const invitation = await ctx.db
			.query("deal_room_invitations")
			.withIndex("by_token", (q) => q.eq("accessToken", args.token))
			.first();

		if (
			!invitation ||
			invitation.status === "revoked" ||
			(invitation.expiresAt && invitation.expiresAt < Date.now())
		) {
			return; // Silently fail for logging
		}

		// Log the access
		await ctx.db.insert("deal_room_access_log", {
			roomId: invitation.roomId,
			documentId: args.documentId,
			userId: `external:${invitation.email}`, // External user identifier
			userEmail: invitation.email,
			action: args.action,
			timestamp: Date.now(),
		});

		// Update invitation status to accepted on first access if still pending
		if (invitation.status === "pending") {
			await ctx.db.patch(invitation._id, {
				status: "accepted",
				acceptedAt: Date.now(),
			});
		}
	},
});

// =============================================================================
// DOCUMENT DOWNLOAD WITH WATERMARKING (FOR EXTERNAL USERS)
// =============================================================================

/**
 * Download a document with watermarking (for external users)
 */
export const downloadDocumentPublic = action({
	args: {
		token: v.string(),
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
		// Validate token via internal query
		const validation = await ctx.runQuery(
			internal.dataRoomsPublic.validateTokenInternal,
			{ token: args.token },
		);

		if (!validation.valid || !validation.invitation) {
			return { success: false, error: validation.error || "Invalid token" };
		}

		const invitation = validation.invitation;

		// Check role - viewers cannot download
		if (invitation.role === "viewer") {
			return { success: false, error: "You do not have download permission" };
		}

		// Get document
		const document = await ctx.runQuery(
			internal.dataRoomsPublic.getDocumentInternal,
			{ id: args.documentId },
		);

		if (!document) {
			return { success: false, error: "Document not found" };
		}

		// Check if document belongs to the same room
		if (document.roomId.toString() !== invitation.roomId.toString()) {
			return { success: false, error: "Access denied" };
		}

		// Check folder access
		if (
			invitation.accessLevel === "restricted" &&
			invitation.folderAccess?.length
		) {
			const allowedFolderIds = new Set(
				invitation.folderAccess.map((id) => id.toString()),
			);
			if (!allowedFolderIds.has(document.folderId.toString())) {
				return { success: false, error: "Access denied to this folder" };
			}
		}

		// Check document access level
		if (!canAccessDocumentPublic(document, invitation)) {
			return { success: false, error: "Access denied to this document" };
		}

		// Get room settings
		const room = await ctx.runQuery(internal.dataRoomsPublic.getRoomInternal, {
			id: invitation.roomId,
		});

		if (!room) {
			return { success: false, error: "Room not found" };
		}

		// Check if downloads are restricted
		if (room.settings?.downloadRestricted) {
			return {
				success: false,
				error: "Downloads are restricted for this room",
			};
		}

		// Get file URL
		const fileUrl = await ctx.storage.getUrl(document.storageId);
		if (!fileUrl) {
			return { success: false, error: "File not found in storage" };
		}

		// Check if watermarking is needed
		const shouldWatermark =
			room.settings?.watermarkEnabled && isPdfFileName(document.fileName);

		if (!shouldWatermark) {
			// Log the download
			await ctx.runMutation(internal.dataRoomsPublic.logAccessInternal, {
				roomId: invitation.roomId,
				documentId: args.documentId,
				userEmail: invitation.email,
				action: "download",
			});

			return { success: true, url: fileUrl, watermarked: false };
		}

		// Fetch and watermark the PDF
		try {
			const response = await fetch(fileUrl);
			if (!response.ok) {
				return { success: false, error: "Failed to fetch document" };
			}

			const pdfBytes = await response.arrayBuffer();

			// Apply watermark with external user info
			const watermarkedPdf = await addWatermarkToPdf(new Uint8Array(pdfBytes), {
				userEmail: invitation.email,
				userName: invitation.name,
				includeTimestamp: true,
				customText: `${invitation.company || "External"} - ${document.fileName}`,
			});

			// Store the watermarked PDF temporarily
			const watermarkedStorageId = await ctx.storage.store(
				new Blob([watermarkedPdf as BlobPart], { type: "application/pdf" }),
			);

			// Get URL for watermarked version
			const watermarkedUrl = await ctx.storage.getUrl(watermarkedStorageId);

			// Log the download
			await ctx.runMutation(internal.dataRoomsPublic.logAccessInternal, {
				roomId: invitation.roomId,
				documentId: args.documentId,
				userEmail: invitation.email,
				action: "download",
			});

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
// INTERNAL QUERIES (for actions)
// =============================================================================

export const getDocumentInternal = internalQuery({
	args: { id: v.id("deal_room_documents") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

export const getRoomInternal = internalQuery({
	args: { id: v.id("deal_rooms") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

export const logAccessInternal = internalMutation({
	args: {
		roomId: v.id("deal_rooms"),
		documentId: v.optional(v.id("deal_room_documents")),
		userEmail: v.string(),
		action: v.union(v.literal("view"), v.literal("download")),
	},
	handler: async (ctx, args) => {
		await ctx.db.insert("deal_room_access_log", {
			roomId: args.roomId,
			documentId: args.documentId,
			userId: `external:${args.userEmail}`, // External user identifier
			userEmail: args.userEmail,
			action: args.action,
			timestamp: Date.now(),
		});
	},
});

// =============================================================================
// ACCESS CONTROL HELPER FOR EXTERNAL USERS
// =============================================================================

function canAccessDocumentPublic(
	doc: Doc<"deal_room_documents">,
	invitation: Invitation,
): boolean {
	// "all" - everyone can access
	if (doc.accessLevel === "all") return true;

	// "buyer_group" - external buyers can access
	if (doc.accessLevel === "buyer_group") {
		// External buyers are considered part of buyer group
		return true;
	}

	// "seller_only" - external users cannot access
	if (doc.accessLevel === "seller_only") {
		return false;
	}

	// "restricted" - check if this invitation has access
	if (doc.accessLevel === "restricted") {
		// Check by folder access
		if (
			invitation.accessLevel === "restricted" &&
			invitation.folderAccess?.length
		) {
			const allowedFolderIds = new Set(
				invitation.folderAccess.map((id) => id.toString()),
			);
			return allowedFolderIds.has(doc.folderId.toString());
		}
		// If invitation has "all" access, they can see restricted docs
		if (invitation.accessLevel === "all") {
			return true;
		}
	}

	return false;
}
