"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { logger } from "../lib/logger";
import {
	ddItemStatusChanged,
	ddChecklistSummary,
	vdrAccessNotification,
	vdrInvitation,
	dealUpdate,
	type DDItemUpdateData,
	type DDChecklistSummaryData,
	type VDRAccessNotificationData,
	type VDRInvitationData,
	type DealUpdateData,
} from "../lib/emailTemplates";

// Resend API configuration
const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_ADDRESS = "Alecia <notifications@alecia.markets>";

function isResendConfigured(): boolean {
	return !!process.env.RESEND_API_KEY;
}

async function sendEmail(params: {
	to: string | string[];
	subject: string;
	html: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
	const apiKey = process.env.RESEND_API_KEY;
	if (!apiKey) {
		logger.info("[Email] Resend not configured, email skipped", {
			to: params.to,
			subject: params.subject,
		});
		return { success: false, error: "RESEND_API_KEY not configured" };
	}

	try {
		const response = await fetch(RESEND_API_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				from: FROM_ADDRESS,
				to: Array.isArray(params.to) ? params.to : [params.to],
				subject: params.subject,
				html: params.html,
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			logger.error("[Email] Resend API error", {
				status: response.status,
				error: errorText,
			});
			return { success: false, error: errorText };
		}

		const result = await response.json();
		logger.info("[Email] Sent successfully", { id: result.id, to: params.to });
		return { success: true, id: result.id };
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		logger.error("[Email] Failed to send", { error: errorMessage });
		return { success: false, error: errorMessage };
	}
}

// ============================================
// DD CHECKLIST NOTIFICATIONS
// ============================================

/**
 * Send notification when a DD item status changes
 */
export const notifyDDItemUpdate = internalAction({
	args: {
		itemId: v.id("dd_checklist_items"),
		oldStatus: v.string(),
		newStatus: v.string(),
		updatedByUserId: v.id("users"),
		notes: v.optional(v.string()),
		issueDescription: v.optional(v.string()),
		issueSeverity: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// Get item details
		const item = await ctx.runQuery(internal.ddChecklists.getItemInternal, {
			id: args.itemId,
		});
		if (!item) {
			logger.error("[Notify] DD item not found", { itemId: args.itemId });
			return { success: false, error: "Item not found" };
		}

		// Get checklist details
		const checklistData = await ctx.runQuery(
			internal.ddChecklists.getChecklistInternal,
			{ id: item.checklistId },
		);
		if (!checklistData) {
			return { success: false, error: "Checklist not found" };
		}

		// Get deal
		const deal = await ctx.runQuery(internal.deals.getById, {
			id: checklistData.dealId,
		});
		if (!deal) {
			return { success: false, error: "Deal not found" };
		}

		// Get updater info
		const updater = await ctx.runQuery(internal.users.internalGetById, {
			userId: args.updatedByUserId,
		});
		if (!updater) {
			return { success: false, error: "User not found" };
		}

		// Get deal owner to notify
		const recipientId = deal.ownerId;
		if (!recipientId || recipientId === args.updatedByUserId) {
			// Don't notify the person who made the change
			return { success: true, message: "No notification needed" };
		}

		const recipient = await ctx.runQuery(internal.users.internalGetById, {
			userId: recipientId,
		});
		if (!recipient || !recipient.email) {
			return { success: false, error: "Recipient email not found" };
		}

		// Create in-app notification
		await ctx.runMutation(internal.notifications.createInternal, {
			recipientId,
			triggerId: args.updatedByUserId,
			type: args.newStatus === "issue_found" ? "dd_issue" : "dd_update",
			entityType: "dd_checklist_item",
			entityId: args.itemId,
			payload: {
				itemName: item.item,
				checklistName: checklistData.name,
				dealName: deal.title,
				oldStatus: args.oldStatus,
				newStatus: args.newStatus,
			},
		});

		// Only send email for important status changes
		const importantStatuses = ["issue_found", "reviewed", "received"];
		if (!importantStatuses.includes(args.newStatus)) {
			return { success: true, message: "Status change not email-worthy" };
		}

		// Build email
		const emailData: DDItemUpdateData = {
			itemName: item.item,
			checklistName: checklistData.name,
			dealName: deal.title,
			oldStatus: args.oldStatus,
			newStatus: args.newStatus,
			updatedBy: updater.name,
			notes: args.notes,
			issueDescription: args.issueDescription,
			issueSeverity: args.issueSeverity,
			viewUrl: `https://panel.alecia.markets/admin/dd-checklists/${item.checklistId}`,
		};

		const html = ddItemStatusChanged(emailData);
		const subject =
			args.newStatus === "issue_found"
				? `⚠️ Problème DD détecté: ${item.item}`
				: `📋 DD Update: ${item.item}`;

		const result = await sendEmail({
			to: recipient.email,
			subject,
			html,
		});

		return result;
	},
});

/**
 * Send DD checklist summary email
 */
export const sendDDChecklistSummary = internalAction({
	args: {
		checklistId: v.id("dd_checklists"),
		recipientEmail: v.string(),
	},
	handler: async (
		ctx,
		args,
	): Promise<{ success: boolean; id?: string; error?: string }> => {
		const checklistData = await ctx.runQuery(
			internal.ddChecklists.getChecklistInternal,
			{ id: args.checklistId },
		);
		if (!checklistData) {
			return { success: false, error: "Checklist not found" };
		}

		const stats = await ctx.runQuery(
			internal.ddChecklists.getChecklistStatsInternal,
			{
				id: args.checklistId,
			},
		);
		if (!stats) {
			return { success: false, error: "Stats not found" };
		}

		const deal = await ctx.runQuery(internal.deals.getById, {
			id: checklistData.dealId,
		});
		if (!deal) {
			return { success: false, error: "Deal not found" };
		}

		const emailData: DDChecklistSummaryData = {
			checklistName: checklistData.name,
			dealName: deal.title,
			progress: checklistData.progress,
			stats: {
				total: stats.total,
				pending: stats.pending,
				inProgress: stats.inProgress,
				completed: stats.received + stats.reviewed + stats.notApplicable,
				issues: stats.issueFound,
				overdue: stats.overdue,
			},
			recentUpdates: [], // Could populate from recent activity
			viewUrl: `https://panel.alecia.markets/admin/dd-checklists/${args.checklistId}`,
		};

		const html = ddChecklistSummary(emailData);

		return await sendEmail({
			to: args.recipientEmail,
			subject: `📊 DD Status: ${checklistData.name} (${checklistData.progress}%)`,
			html,
		});
	},
});

// ============================================
// VDR NOTIFICATIONS
// ============================================

/**
 * Send VDR access notification
 */
export const notifyVDRAccess = internalAction({
	args: {
		roomId: v.id("deal_rooms"),
		accessorEmail: v.string(),
		accessorName: v.string(),
		accessorCompany: v.optional(v.string()),
		action: v.union(
			v.literal("view"),
			v.literal("download"),
			v.literal("question"),
		),
		documentId: v.optional(v.id("deal_room_documents")),
		question: v.optional(v.string()),
	},
	handler: async (
		ctx,
		args,
	): Promise<{ success: boolean; id?: string; error?: string }> => {
		const room = await ctx.runQuery(internal.dataRooms.getRoomInternal, {
			id: args.roomId,
		});
		if (!room) {
			return { success: false, error: "Room not found" };
		}

		const deal = await ctx.runQuery(internal.deals.getById, {
			id: room.dealId,
		});
		if (!deal) {
			return { success: false, error: "Deal not found" };
		}

		// Get document name if applicable
		let documentName: string | undefined;
		if (args.documentId) {
			const doc = await ctx.runQuery(internal.dataRooms.getDocumentInternal, {
				id: args.documentId,
			});
			documentName = doc?.fileName;
		}

		// Notify room creator
		const creator = await ctx.runQuery(internal.users.internalGetById, {
			userId: room.createdBy,
		});
		if (!creator || !creator.email) {
			return { success: false, error: "Creator not found" };
		}

		const emailData: VDRAccessNotificationData = {
			roomName: room.name,
			dealName: deal.title,
			accessorName: args.accessorName,
			accessorEmail: args.accessorEmail,
			accessorCompany: args.accessorCompany,
			action: args.action,
			documentName,
			question: args.question,
			timestamp: Date.now(),
			viewUrl: `https://panel.alecia.markets/admin/data-rooms/${args.roomId}/analytics`,
		};

		const html = vdrAccessNotification(emailData);
		const actionLabels = {
			view: "a consulté",
			download: "a téléchargé",
			question: "a posé une question",
		};

		return await sendEmail({
			to: creator.email,
			subject: `📁 VDR: ${args.accessorName} ${actionLabels[args.action]}`,
			html,
		});
	},
});

/**
 * Send VDR invitation email
 */
export const sendVDRInvitation = internalAction({
	args: {
		invitationId: v.id("deal_room_invitations"),
	},
	handler: async (
		ctx,
		args,
	): Promise<{ success: boolean; id?: string; error?: string }> => {
		const invitation = await ctx.runQuery(
			internal.dataRooms.getInvitationInternal,
			{
				id: args.invitationId,
			},
		);
		if (!invitation) {
			return { success: false, error: "Invitation not found" };
		}

		const room = await ctx.runQuery(internal.dataRooms.getRoomInternal, {
			id: invitation.roomId,
		});
		if (!room) {
			return { success: false, error: "Room not found" };
		}

		const deal = await ctx.runQuery(internal.deals.getById, {
			id: room.dealId,
		});
		if (!deal) {
			return { success: false, error: "Deal not found" };
		}

		const inviter = await ctx.runQuery(internal.users.internalGetById, {
			userId: invitation.invitedBy,
		});
		if (!inviter) {
			return { success: false, error: "Inviter not found" };
		}

		const emailData: VDRInvitationData = {
			roomName: room.name,
			dealName: deal.title,
			inviterName: inviter.name,
			inviterCompany: "Alecia", // Could be dynamic
			accessLevel: invitation.role,
			expiresAt: invitation.expiresAt,
			acceptUrl: `https://panel.alecia.markets/vdr/accept/${invitation.accessToken}`,
		};

		const html = vdrInvitation(emailData);

		return await sendEmail({
			to: invitation.email,
			subject: `📨 Invitation Data Room: ${room.name}`,
			html,
		});
	},
});

// ============================================
// DEAL NOTIFICATIONS
// ============================================

/**
 * Send deal update notification
 */
export const notifyDealUpdate = internalAction({
	args: {
		dealId: v.id("deals"),
		updateType: v.union(
			v.literal("stage_change"),
			v.literal("new_comment"),
			v.literal("mention"),
			v.literal("assignment"),
		),
		updatedByUserId: v.id("users"),
		recipientUserId: v.id("users"),
		details: v.object({
			oldStage: v.optional(v.string()),
			newStage: v.optional(v.string()),
			commentPreview: v.optional(v.string()),
			mentionContext: v.optional(v.string()),
		}),
	},
	handler: async (
		ctx,
		args,
	): Promise<{
		success: boolean;
		id?: string;
		error?: string;
		message?: string;
	}> => {
		// Don't notify self
		if (args.updatedByUserId === args.recipientUserId) {
			return { success: true, message: "Self notification skipped" };
		}

		const deal = await ctx.runQuery(internal.deals.getById, {
			id: args.dealId,
		});
		if (!deal) {
			return { success: false, error: "Deal not found" };
		}

		const updater = await ctx.runQuery(internal.users.internalGetById, {
			userId: args.updatedByUserId,
		});
		const recipient = await ctx.runQuery(internal.users.internalGetById, {
			userId: args.recipientUserId,
		});

		if (!updater || !recipient || !recipient.email) {
			return { success: false, error: "User not found" };
		}

		// Create in-app notification
		await ctx.runMutation(internal.notifications.createInternal, {
			recipientId: args.recipientUserId,
			triggerId: args.updatedByUserId,
			type: args.updateType,
			entityType: "deal",
			entityId: args.dealId,
			payload: args.details,
		});

		const emailData: DealUpdateData = {
			dealName: deal.title,
			updateType: args.updateType,
			updatedBy: updater.name,
			details: args.details,
			viewUrl: `https://panel.alecia.markets/pipeline?deal=${args.dealId}`,
		};

		const html = dealUpdate(emailData);

		const subjectPrefixes = {
			stage_change: "📈",
			new_comment: "💬",
			mention: "👋",
			assignment: "👤",
		};

		return await sendEmail({
			to: recipient.email,
			subject: `${subjectPrefixes[args.updateType]} ${deal.title}`,
			html,
		});
	},
});
