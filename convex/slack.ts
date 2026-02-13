// Slack Integration for deal notifications
// Posts updates to Slack channels when deals progress

import {
  mutation,
  query,
  action,
  internalQuery,
  internalMutation,
  internalAction,
} from "./_generated/server";
import { v } from "convex/values";
import { getOptionalUser, getAuthenticatedUser } from "./auth_utils";
import { internal } from "./_generated/api";
import { logger } from "./lib/logger";

// ============================================
// QUERIES
// ============================================

/**
 * Get Slack integration status
 */
export const getSlackStatus = query({
  args: {},
  handler: async (ctx) => {
    const user = await getOptionalUser(ctx);
    if (!user) return null;

    const config = await ctx.db
      .query("global_config")
      .withIndex("by_key", (q) => q.eq("key", "slack_config"))
      .unique();

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
  },
});

/**
 * Get notification preferences for Slack
 */
export const getSlackNotificationPrefs = query({
  args: {},
  handler: async (ctx) => {
    const user = await getOptionalUser(ctx);
    if (!user) return null;

    return {
      newDeal: true,
      dealStageChange: true,
      dealClosed: true,
      newSignature: true,
      commentMention: false,
      dailySummary: true,
    };
  },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Configure Slack webhook
 */
export const configureSlack = mutation({
  args: {
    webhookUrl: v.string(),
    channel: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    if (user.role !== "sudo") {
      throw new Error("Seuls les admins peuvent configurer Slack");
    }

    // Validate webhook URL format
    if (!args.webhookUrl.startsWith("https://hooks.slack.com/")) {
      throw new Error("URL de webhook Slack invalide");
    }

    const existing = await ctx.db
      .query("global_config")
      .withIndex("by_key", (q) => q.eq("key", "slack_config"))
      .unique();

    const slackConfig = {
      webhookUrl: args.webhookUrl,
      channel: args.channel,
      enabled: true,
      configuredBy: user._id,
      configuredAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: slackConfig,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("global_config", {
        key: "slack_config",
        value: slackConfig,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

/**
 * Toggle Slack notifications
 */
export const toggleSlack = mutation({
  args: {
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    if (user.role !== "sudo") {
      throw new Error("Seuls les admins peuvent modifier Slack");
    }

    const config = await ctx.db
      .query("global_config")
      .withIndex("by_key", (q) => q.eq("key", "slack_config"))
      .unique();

    if (config) {
      const currentValue = config.value as Record<string, unknown>;
      await ctx.db.patch(config._id, {
        value: { ...currentValue, enabled: args.enabled },
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

/**
 * Send a test message to Slack (schedules action)
 */
export const sendTestSlackMessage = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    // Schedule the test message action
    await ctx.scheduler.runAfter(0, internal.slack.sendSlackWebhook, {
      text: `🧪 Test de connexion Slack par ${user.name || user.email}`,
    });

    return {
      success: true,
      message: "Message de test envoyé à Slack",
    };
  },
});

// ============================================
// INTERNAL HELPERS
// ============================================

export const getSlackConfigInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db
      .query("global_config")
      .withIndex("by_key", (q) => q.eq("key", "slack_config"))
      .unique();

    if (!config) return null;

    return config.value as {
      webhookUrl: string;
      channel: string;
      enabled: boolean;
    };
  },
});

export const updateLastNotification = internalMutation({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db
      .query("global_config")
      .withIndex("by_key", (q) => q.eq("key", "slack_config"))
      .unique();

    if (config) {
      const currentValue = config.value as Record<string, unknown>;
      await ctx.db.patch(config._id, {
        value: { ...currentValue, lastNotification: Date.now() },
      });
    }
  },
});

// ============================================
// ACTIONS (use fetch for external API)
// ============================================

/**
 * Send webhook to Slack (internal action for use by other actions)
 */
export const sendSlackWebhook = internalAction({
  args: {
    text: v.string(),
    blocks: v.optional(
      v.array(
        v.record(
          v.string(),
          v.union(v.string(), v.number(), v.boolean(), v.null()),
        ),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const config = await ctx.runQuery(internal.slack.getSlackConfigInternal);

    if (!config?.webhookUrl) {
      logger.warn("[Slack] No webhook configured");
      return { sent: false, error: "No webhook configured" };
    }

    if (!config.enabled) {
      logger.info("[Slack] Notifications disabled");
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

      await ctx.runMutation(internal.slack.updateLastNotification);

      return { sent: true };
    } catch (error) {
      logger.error("[Slack] Webhook failed", { error: String(error) });
      return { sent: false, error: (error as Error).message };
    }
  },
});

/**
 * Post a deal update to Slack
 */
export const postDealUpdate = action({
  args: {
    dealTitle: v.string(),
    oldStage: v.string(),
    newStage: v.string(),
    userName: v.string(),
    dealAmount: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ sent: boolean; error?: string }> => {
    const emoji = getStageEmoji(args.newStage);
    const amountText = args.dealAmount
      ? ` • €${(args.dealAmount / 1_000_000).toFixed(1)}M`
      : "";

    return await ctx.runAction(internal.slack.sendSlackWebhook, {
      text: `${emoji} *${args.dealTitle}*${amountText}\n_${args.oldStage}_ → *${args.newStage}*\nModifié par ${args.userName}`,
    });
  },
});

/**
 * Post deal closed notification
 */
export const postDealClosed = action({
  args: {
    dealTitle: v.string(),
    dealAmount: v.optional(v.number()),
    userName: v.string(),
  },
  handler: async (ctx, args): Promise<{ sent: boolean; error?: string }> => {
    const amountText = args.dealAmount
      ? `€${(args.dealAmount / 1_000_000).toFixed(1)}M`
      : "Montant NC";

    return await ctx.runAction(internal.slack.sendSlackWebhook, {
      text: `🎉 *DEAL SIGNÉ!*\n*${args.dealTitle}*\n💰 ${amountText}\nClôturé par ${args.userName}`,
    });
  },
});

/**
 * Post signature request notification
 */
export const postSignatureRequest = action({
  args: {
    documentTitle: v.string(),
    documentType: v.string(),
    requesterName: v.string(),
    signerName: v.string(),
  },
  handler: async (ctx, args): Promise<{ sent: boolean; error?: string }> => {
    return await ctx.runAction(internal.slack.sendSlackWebhook, {
      text: `✍️ *Demande de signature*\n📄 *${args.documentTitle}* (${args.documentType})\n${args.requesterName} → ${args.signerName}`,
    });
  },
});

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
