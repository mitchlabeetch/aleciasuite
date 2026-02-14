"use server";

/**
 * Slack Integration - Server Actions
 * Ported from convex/slack.ts
 *
 * Features:
 * - Webhook configuration
 * - Deal update notifications
 * - Signature request notifications
 */

import { db, shared, eq, sql } from "@alepanel/db";
import { getAuthenticatedUser } from "../lib/auth";
import { revalidatePath } from "next/cache";

// ============================================
// QUERIES
// ============================================

/**
 * Get Slack integration status
 */
export async function getSlackStatus() {
  const user = await getAuthenticatedUser();

  const config = await db.query.globalConfig.findFirst({
    where: eq(shared.globalConfig.key, "slack_config"),
  });

  if (!config) {
    return {
      connected: false,
      webhookConfigured: false,
      channel: null,
      lastNotification: null,
    };
  }

  const slackConfig = config.value as {
    webhookUrl?: string;
    channel?: string;
    enabled?: boolean;
    lastNotification?: number;
  };

  return {
    connected: !!slackConfig.webhookUrl,
    webhookConfigured: !!slackConfig.webhookUrl,
    channel: slackConfig.channel || "#deals",
    enabled: slackConfig.enabled ?? true,
    lastNotification: slackConfig.lastNotification,
  };
}

/**
 * Get notification preferences for Slack
 */
export async function getSlackNotificationPrefs() {
  const user = await getAuthenticatedUser();

  return {
    newDeal: true,
    dealStageChange: true,
    dealClosed: true,
    newSignature: true,
    commentMention: false,
    dailySummary: true,
  };
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Configure Slack webhook
 */
export async function configureSlack(args: {
  webhookUrl: string;
  channel: string;
}) {
  const user = await getAuthenticatedUser();

  // Check if user has permission
  const userData = await db
    .select()
    .from(shared.users)
    .where(eq(shared.users.id, user.id))
    .limit(1);

  if (userData.length === 0 || userData[0].role !== "sudo") {
    throw new Error("Only admins can configure Slack");
  }

  // Validate webhook URL format
  if (!args.webhookUrl.startsWith("https://hooks.slack.com/")) {
    throw new Error("Invalid Slack webhook URL");
  }

  const slackConfig = {
    webhookUrl: args.webhookUrl,
    channel: args.channel,
    enabled: true,
    configuredBy: user.id,
    configuredAt: Date.now(),
  };

  // Upsert config using Drizzle
  await db
    .insert(shared.globalConfig)
    .values({
      key: "slack_config",
      value: slackConfig,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: shared.globalConfig.key,
      set: {
        value: slackConfig,
        updatedAt: new Date(),
      },
    });

  revalidatePath("/settings/integrations");
  return { success: true };
}

/**
 * Toggle Slack notifications
 */
export async function toggleSlack(args: { enabled: boolean }) {
  const user = await getAuthenticatedUser();

  // Check if user has permission
  const userData = await db
    .select()
    .from(shared.users)
    .where(eq(shared.users.id, user.id))
    .limit(1);

  if (userData.length === 0 || userData[0].role !== "sudo") {
    throw new Error("Only admins can modify Slack");
  }

  const config = await db.query.globalConfig.findFirst({
    where: eq(shared.globalConfig.key, "slack_config"),
  });

  if (config) {
    const currentValue = config.value as Record<string, unknown>;
    await db
      .update(shared.globalConfig)
      .set({
        value: { ...currentValue, enabled: args.enabled },
        updatedAt: new Date(),
      })
      .where(eq(shared.globalConfig.key, "slack_config"));
  }

  revalidatePath("/settings/integrations");
  return { success: true };
}

/**
 * Send a test message to Slack
 */
export async function sendTestSlackMessage() {
  const user = await getAuthenticatedUser();

  await sendSlackWebhook({
    text: `🧪 Test de connexion Slack par ${user.name || user.email}`,
  });

  return {
    success: true,
    message: "Message de test envoyé à Slack",
  };
}

// ============================================
// INTERNAL HELPERS
// ============================================

async function getSlackConfig() {
  const config = await db.query.globalConfig.findFirst({
    where: eq(shared.globalConfig.key, "slack_config"),
  });

  if (!config) return null;

  return config.value as {
    webhookUrl: string;
    channel: string;
    enabled: boolean;
  };
}

async function updateLastNotification() {
  const config = await db.query.globalConfig.findFirst({
    where: eq(shared.globalConfig.key, "slack_config"),
  });

  if (config) {
    const currentValue = config.value as Record<string, unknown>;
    await db
      .update(shared.globalConfig)
      .set({
        value: { ...currentValue, lastNotification: Date.now() },
        updatedAt: new Date(),
      })
      .where(eq(shared.globalConfig.key, "slack_config"));
  }
}

/**
 * Send webhook to Slack (internal helper)
 */
async function sendSlackWebhook(args: {
  text: string;
  blocks?: Array<Record<string, unknown>>;
}) {
  const config = await getSlackConfig();

  if (!config?.webhookUrl) {
    console.warn("[Slack] No webhook configured");
    return { sent: false, error: "No webhook configured" };
  }

  if (!config.enabled) {
    console.info("[Slack] Notifications disabled");
    return { sent: false, error: "Slack disabled" };
  }

  try {
    const response = await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: args.text,
        blocks: args.blocks,
      }),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`);
    }

    await updateLastNotification();

    return { sent: true };
  } catch (error) {
    console.error("[Slack] Webhook failed:", error);
    return { sent: false, error: (error as Error).message };
  }
}

// ============================================
// PUBLIC NOTIFICATION ACTIONS
// ============================================

/**
 * Post a deal update to Slack
 */
export async function postDealUpdate(args: {
  dealTitle: string;
  oldStage: string;
  newStage: string;
  userName: string;
  dealAmount?: number;
}) {
  const emoji = getStageEmoji(args.newStage);
  const amountText = args.dealAmount
    ? ` • €${(args.dealAmount / 1_000_000).toFixed(1)}M`
    : "";

  return await sendSlackWebhook({
    text: `${emoji} *${args.dealTitle}*${amountText}\n_${args.oldStage}_ → *${args.newStage}*\nModifié par ${args.userName}`,
  });
}

/**
 * Post deal closed notification
 */
export async function postDealClosed(args: {
  dealTitle: string;
  dealAmount?: number;
  userName: string;
}) {
  const amountText = args.dealAmount
    ? `€${(args.dealAmount / 1_000_000).toFixed(1)}M`
    : "Montant NC";

  return await sendSlackWebhook({
    text: `🎉 *DEAL SIGNÉ!*\n*${args.dealTitle}*\n💰 ${amountText}\nClôturé par ${args.userName}`,
  });
}

/**
 * Post signature request notification
 */
export async function postSignatureRequest(args: {
  documentTitle: string;
  documentType: string;
  requesterName: string;
  signerName: string;
}) {
  return await sendSlackWebhook({
    text: `✍️ *Demande de signature*\n📄 *${args.documentTitle}* (${args.documentType})\n${args.requesterName} → ${args.signerName}`,
  });
}

// Helper function for stage emojis
function getStageEmoji(stage: string): string {
  const emojis: Record<string, string> = {
    Lead: "🎯",
    "NDA Signed": "📝",
    "Offer Received": "💼",
    "Due Diligence": "🔍",
    Closing: "🏁",
    Closed: "🎉",
  };
  return emojis[stage] || "📊";
}
