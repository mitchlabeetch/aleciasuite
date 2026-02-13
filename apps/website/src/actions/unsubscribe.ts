/**
 * Unsubscribe Handler Server Actions
 *
 * CAN-SPAM/GDPR compliant email unsubscribe.
 * Token-based — no authentication required for unsubscribe.
 * Ported from convex/unsubscribe.ts (292 lines)
 */

"use server";

import { db, shared, eq, sql } from "@alepanel/db";
import { getAuthenticatedUser } from "./lib/auth";

// ============================================
// TOKEN-BASED (NO AUTH REQUIRED)
// ============================================

/**
 * Process unsubscribe request via token
 * No authentication required (GDPR compliance)
 */
export async function handleUnsubscribe(token: string) {
  try {
    // TODO: Implement proper token validation
    // For now, decode base64 token to extract userId
    // In production, use signed JWT or HMAC tokens
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const parts = decoded.split(":");
    const userId = parts[0];

    if (!userId) {
      return {
        success: false,
        error: "invalid_token",
        message: "Ce lien de désinscription est invalide ou expiré.",
      };
    }

    // Verify user exists
    const user = await db.query.users.findFirst({
      where: eq(shared.users.id, userId),
    });

    if (!user) {
      return {
        success: false,
        error: "invalid_token",
        message: "Ce lien de désinscription est invalide ou expiré.",
      };
    }

    // Disable email notifications
    await disableEmailNotifications(userId);

    return {
      success: true,
      message: "Vous avez été désinscrit avec succès de nos emails.",
      userName: user.fullName,
      email: user.email,
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
}

/**
 * Disable email notifications for a user
 */
export async function disableEmailNotifications(userId: string) {
  // Check if preferences exist
  const existing = await db
    .select({ id: shared.userPreferences.id })
    .from(shared.userPreferences)
    .where(eq(shared.userPreferences.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    // Use JSONB operation to update nested field
    await db.execute(sql`
      UPDATE shared.user_preferences
      SET notifications = jsonb_set(
        COALESCE(notifications, '{"emailEnabled": true, "pushEnabled": true, "digestFrequency": "daily"}'::jsonb),
        '{emailEnabled}',
        'false'::jsonb
      ),
      updated_at = NOW()
      WHERE user_id = ${userId}
    `);
  } else {
    // Insert new preferences
    await db.insert(shared.userPreferences).values({
      userId,
      notifications: {
        emailEnabled: false,
        pushEnabled: true,
        digestFrequency: "none",
      },
    });
  }

  return { success: true, message: "Email notifications disabled" };
}

// ============================================
// AUTHENTICATED ACTIONS
// ============================================

/**
 * Re-subscribe to email notifications (requires auth)
 */
export async function resubscribe() {
  const user = await getAuthenticatedUser();

  try {
    await enableEmailNotifications(user.id);

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
}

/**
 * Enable email notifications for a user
 */
export async function enableEmailNotifications(userId: string) {
  // Check if preferences exist
  const existing = await db
    .select({ id: shared.userPreferences.id })
    .from(shared.userPreferences)
    .where(eq(shared.userPreferences.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    // Use JSONB operation to update nested field
    await db.execute(sql`
      UPDATE shared.user_preferences
      SET notifications = jsonb_set(
        COALESCE(notifications, '{"emailEnabled": false, "pushEnabled": true, "digestFrequency": "none"}'::jsonb),
        '{emailEnabled}',
        'true'::jsonb
      ),
      updated_at = NOW()
      WHERE user_id = ${userId}
    `);
  } else {
    // Insert new preferences
    await db.insert(shared.userPreferences).values({
      userId,
      notifications: {
        emailEnabled: true,
        pushEnabled: true,
        digestFrequency: "daily",
      },
    });
  }

  return { success: true, message: "Email notifications enabled" };
}

/**
 * Check unsubscribe status for a user by email
 */
export async function checkUnsubscribeStatus(email: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(shared.users.email, email),
    });

    if (!user) {
      return {
        found: false,
        message: "Aucun utilisateur trouvé avec cet email.",
      };
    }

    // Check preferences
    const prefs = await db
      .select({
        notifications: shared.userPreferences.notifications,
      })
      .from(shared.userPreferences)
      .where(eq(shared.userPreferences.userId, user.id))
      .limit(1);

    const notifications = prefs[0]?.notifications as any;
    const emailEnabled = notifications?.emailEnabled ?? true;

    return {
      found: true,
      subscribed: emailEnabled,
      email: user.email,
      name: user.fullName,
    };
  } catch (error) {
    console.error("Check status error:", error);
    return {
      found: false,
      message: "Erreur lors de la vérification du statut.",
    };
  }
}
