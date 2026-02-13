/**
 * Unsubscribe Handler Action
 *
 * Handles email unsubscribe requests via one-click token validation.
 * Updates user preferences to disable email notifications.
 *
 * CAN-SPAM/GDPR Compliance:
 * - No authentication required (token-based)
 * - Immediate effect
 * - Confirmation message
 */

import { action, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

/**
 * Process unsubscribe request
 *
 * @param token - Unsubscribe token from email link
 * @returns Success/error message and user info
 */
export const handleUnsubscribe = action({
	args: {
		token: v.string(),
	},
	handler: async (ctx, args) => {
		try {
			// Validate the token
			const tokenData = await ctx.runQuery(
				require("./lib/unsubscribeToken").validateUnsubscribeToken,
				{ token: args.token },
			);

			if (!tokenData) {
				return {
					success: false,
					error: "invalid_token",
					message: "Ce lien de désinscription est invalide ou expiré.",
				};
			}

			// Update user preferences to disable email notifications
			await ctx.runMutation(
				require("./unsubscribe").disableEmailNotifications,
				{
					userId: tokenData.userId,
				},
			);

			return {
				success: true,
				message: "Vous avez été désinscrit avec succès de nos emails.",
				userName: tokenData.userName,
				email: tokenData.email,
			};
		} catch (error) {
			console.error("Unsubscribe error:", error);
			return {
				success: false,
				error: "processing_error",
				message:
					"Une erreur s'est produite lors de la désinscription. Veuillez réessayer.",
			};
		}
	},
});

/**
 * Internal mutation to disable email notifications
 * Updates both user_preferences.notifications.emailEnabled and legacy digestEnabled
 */
export const disableEmailNotifications = internalMutation({
	args: {
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const now = Date.now();

		// Update user_preferences table (new system)
		const preferences = await ctx.db
			.query("user_preferences")
			.withIndex("by_userId", (q) => q.eq("userId", args.userId))
			.first();

		if (preferences) {
			// Update existing preferences
			const currentNotifications = preferences.notifications || {
				emailEnabled: true,
				pushEnabled: true,
				digestFrequency: "daily" as const,
			};

			await ctx.db.patch(preferences._id, {
				notifications: {
					...currentNotifications,
					emailEnabled: false,
				},
				updatedAt: now,
			});
		} else {
			// Create new preferences with email disabled
			await ctx.db.insert("user_preferences", {
				userId: args.userId,
				notifications: {
					emailEnabled: false,
					pushEnabled: true,
					digestFrequency: "none" as const,
				},
				createdAt: now,
				updatedAt: now,
			});
		}

		// Also update legacy digestEnabled field in users table for backward compatibility
		await ctx.db.patch(args.userId, {
			digestEnabled: false,
			digestFrequency: "none",
		});

		return {
			success: true,
			message: "Email notifications disabled",
		};
	},
});

/**
 * Re-subscribe a user (reverse of unsubscribe)
 * Requires authentication for security
 */
export const resubscribe = action({
	args: {
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		try {
			// Update user preferences to enable email
			await ctx.runMutation(require("./unsubscribe").enableEmailNotifications, {
				userId: args.userId,
			});

			return {
				success: true,
				message: "Vous êtes de nouveau inscrit aux notifications email.",
			};
		} catch (error) {
			console.error("Resubscribe error:", error);
			return {
				success: false,
				error: "processing_error",
				message: "Une erreur s'est produite lors de la réinscription.",
			};
		}
	},
});

/**
 * Internal mutation to enable email notifications
 */
export const enableEmailNotifications = internalMutation({
	args: {
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const now = Date.now();

		// Update user_preferences table
		const preferences = await ctx.db
			.query("user_preferences")
			.withIndex("by_userId", (q) => q.eq("userId", args.userId))
			.first();

		if (preferences) {
			const currentNotifications = preferences.notifications || {
				emailEnabled: false,
				pushEnabled: true,
				digestFrequency: "none" as const,
			};

			await ctx.db.patch(preferences._id, {
				notifications: {
					...currentNotifications,
					emailEnabled: true,
				},
				updatedAt: now,
			});
		} else {
			await ctx.db.insert("user_preferences", {
				userId: args.userId,
				notifications: {
					emailEnabled: true,
					pushEnabled: true,
					digestFrequency: "daily" as const,
				},
				createdAt: now,
				updatedAt: now,
			});
		}

		// Update legacy fields in users table
		await ctx.db.patch(args.userId, {
			digestEnabled: true,
			digestFrequency: "daily",
		});

		return {
			success: true,
			message: "Email notifications enabled",
		};
	},
});

/**
 * Check unsubscribe status for a user
 */
export const checkUnsubscribeStatus = action({
	args: {
		email: v.string(),
	},
	handler: async (ctx, args) => {
		try {
			// Find user by email
			const user = await ctx.runQuery(require("./unsubscribe").getUserByEmail, {
				email: args.email,
			});

			if (!user) {
				return {
					found: false,
					message: "Aucun utilisateur trouvé avec cet email.",
				};
			}

			// Check preferences
			const preferences = await ctx.runQuery(
				require("./unsubscribe").getUserPreferences,
				{ userId: user._id },
			);

			const emailEnabled = preferences?.notifications?.emailEnabled ?? true;
			const digestEnabled = user.digestEnabled ?? true;

			return {
				found: true,
				subscribed: emailEnabled && digestEnabled,
				email: user.email,
				name: user.name,
			};
		} catch (error) {
			console.error("Check status error:", error);
			return {
				found: false,
				message: "Erreur lors de la vérification du statut.",
			};
		}
	},
});

/**
 * Helper query to get user by email
 */
export const getUserByEmail = internalQuery({
	args: {
		email: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", args.email))
			.first();

		return user;
	},
});

/**
 * Helper query to get user preferences
 */
export const getUserPreferences = internalQuery({
	args: {
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const preferences = await ctx.db
			.query("user_preferences")
			.withIndex("by_userId", (q) => q.eq("userId", args.userId))
			.first();

		return preferences;
	},
});
