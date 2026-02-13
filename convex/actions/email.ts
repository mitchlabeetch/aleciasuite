"use node";

import { action, internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { logger } from "../lib/logger";
import {
	checkIntegration,
	actionError,
	actionSuccess,
	type ActionResult,
} from "../lib/env";

// Resend API endpoint
const RESEND_API_URL = "https://api.resend.com/emails";

// From address for digests
const DIGEST_FROM = "Alecia <digest@alecia.markets>";

/**
 * Check if Resend is configured
 */
function isResendConfigured(): boolean {
	return !!process.env.RESEND_API_KEY;
}

/**
 * Send an email via Resend API
 */
async function sendEmailWithResend(params: {
	to: string | string[];
	subject: string;
	html: string;
	from?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
	const apiKey = process.env.RESEND_API_KEY;
	if (!apiKey) {
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
				from: params.from || DIGEST_FROM,
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
		logger.info("[Email] Email sent successfully", {
			id: result.id,
			to: params.to,
		});
		return { success: true, id: result.id };
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		logger.error("[Email] Failed to send email", { error: errorMessage });
		return { success: false, error: errorMessage };
	}
}

/**
 * Send a digest email to a specific user
 */
export const sendDigestEmail = internalAction({
	args: {
		userId: v.id("users"),
		frequency: v.union(v.literal("daily"), v.literal("weekly")),
	},
	handler: async (ctx, args): Promise<ActionResult<{ emailId: string }>> => {
		// Check if Resend is configured
		if (!isResendConfigured()) {
			logger.warn("[Email] Resend not configured, skipping digest email");
			return actionError("Email service not configured", "MISSING_CONFIG");
		}

		// Get user and email content
		const digestData = await ctx.runQuery(internal.digest.generateDigestHtml, {
			userId: args.userId,
			frequency: args.frequency,
		});

		if (!digestData) {
			return actionError("Failed to generate digest content", "API_ERROR");
		}

		// Get user email
		const user = await ctx.runQuery(internal.users.internalGetById, {
			userId: args.userId,
		});
		if (!user || !user.email) {
			return actionError("User email not found", "NOT_FOUND");
		}

		// Send the email
		const result = await sendEmailWithResend({
			to: user.email,
			subject: digestData.subject,
			html: digestData.html,
		});

		if (!result.success) {
			return actionError(result.error || "Failed to send email", "API_ERROR");
		}

		return actionSuccess({ emailId: result.id! });
	},
});

/**
 * Send a test digest email to the current user (public action)
 */
export const sendTestDigestEmail = action({
	args: {},
	handler: async (ctx): Promise<ActionResult<{ message: string }>> => {
		// Check if Resend is configured
		if (!isResendConfigured()) {
			logger.info("[Email] Resend not configured, test digest simulated");
			return actionSuccess({
				message: "Test digest simulated (email service not configured)",
			});
		}

		// Get current user
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return actionError("Authentication required", "API_ERROR");
		}

		// Find user by clerk ID
		const user = await ctx.runQuery(internal.users.getByClerkId, {
			clerkId: identity.subject,
		});

		if (!user || !user.email) {
			return actionError("User not found", "NOT_FOUND");
		}

		// Generate digest content
		const digestData = await ctx.runQuery(internal.digest.generateDigestHtml, {
			userId: user._id,
			frequency: "daily",
		});

		if (!digestData) {
			return actionError("Failed to generate digest", "API_ERROR");
		}

		// Send the email
		const result = await sendEmailWithResend({
			to: user.email,
			subject: `[TEST] ${digestData.subject}`,
			html: digestData.html,
		});

		if (!result.success) {
			return actionError(result.error || "Failed to send email", "API_ERROR");
		}

		return actionSuccess({
			message: `Test digest envoyé à ${user.email}`,
		});
	},
});

/**
 * Send notification email (for real-time notifications)
 */
export const sendNotificationEmail = internalAction({
	args: {
		to: v.string(),
		subject: v.string(),
		html: v.string(),
	},
	handler: async (_ctx, args): Promise<ActionResult<{ emailId: string }>> => {
		if (!isResendConfigured()) {
			logger.info("[Email] Resend not configured, notification email skipped");
			return actionError("Email service not configured", "MISSING_CONFIG");
		}

		const result = await sendEmailWithResend({
			to: args.to,
			subject: args.subject,
			html: args.html,
		});

		if (!result.success) {
			return actionError(result.error || "Failed to send email", "API_ERROR");
		}

		return actionSuccess({ emailId: result.id! });
	},
});
