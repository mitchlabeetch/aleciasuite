/**
 * Activity Digest Server Actions
 *
 * Scheduled email summaries with comprehensive activity data.
 * Ported from convex/digest.ts (682 lines)
 */

"use server";

import { db, shared, eq, gte, desc } from "@alepanel/db";
import { getAuthenticatedUser } from "./lib/auth";

// ============================================
// QUERIES
// ============================================

/**
 * Get user's digest preferences
 */
export async function getDigestPreferences() {
  const _user = await getAuthenticatedUser();

  // TODO: Read from user_preferences table when available
  return {
    enabled: true,
    frequency: "daily" as const,
    includeDeals: true,
    includeComments: true,
    includeMentions: true,
    includeSignatures: true,
    includeTasks: true,
  };
}

/**
 * Get comprehensive activity summary for digest
 */
export async function getActivitySummary(args?: {
  since?: number;
  frequency?: "daily" | "weekly";
}) {
  const _user = await getAuthenticatedUser();

  const hoursBack = args?.frequency === "weekly" ? 7 * 24 : 24;
  const since = args?.since || Date.now() - hoursBack * 60 * 60 * 1000;
  const sinceDate = new Date(since);

  // Get recent deals
  const recentDeals = await db.query.deals.findMany({
    where: gte(shared.deals.createdAt, sinceDate),
    orderBy: [desc(shared.deals.createdAt)],
    limit: 50,
  });

  const dealsWithChanges = recentDeals.map((d) => ({
    id: d.id,
    title: d.title,
    stage: d.stage,
    amount: d.amount,
    createdAt: d.createdAt?.toISOString(),
    isNew: true,
  }));

  // Get all active deals for pipeline value
  const allDeals = await db.query.deals.findMany({
    where: eq(shared.deals.isArchived, false),
    columns: { amount: true },
  });
  const totalPipelineValue = allDeals.reduce(
    (sum, d) => sum + (d.amount ? parseFloat(d.amount) : 0),
    0
  );

  // TODO: Get comments mentioning user when comments table is available
  // TODO: Get pending signature requests when sign schema is wired
  // TODO: Get overdue research tasks when bi.researchTasks is wired
  // TODO: Get DD checklists with activity
  // TODO: Get VDR activity

  const stats = {
    newDeals: recentDeals.length,
    totalPipelineValue,
    pendingSignatures: 0,
    overdueTasks: 0,
    upcomingTasks: 0,
    mentions: 0,
    ddChecklistsWithActivity: 0,
    ddIssuesTotal: 0,
    ddOverdueTotal: 0,
    vdrRoomsWithActivity: 0,
    vdrTotalVisits: 0,
    vdrPendingQuestions: 0,
  };

  return {
    deals: dealsWithChanges,
    comments: [],
    mentions: 0,
    signatures: [],
    tasks: { overdue: [], upcoming: [] },
    ddChecklists: [],
    vdrActivity: [],
    stats,
    period: {
      from: sinceDate.toISOString(),
      to: new Date().toISOString(),
      label: args?.frequency === "weekly" ? "Cette semaine" : "Aujourd'hui",
    },
  };
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Update digest preferences
 */
export async function updateDigestPreferences(_args: {
  enabled: boolean;
  frequency: "daily" | "weekly" | "none";
}) {
  const _user = await getAuthenticatedUser();

  // TODO: Update user_preferences table when available
  // For now, update legacy fields on user record
  await db
    .update(shared.users)
    .set({ updatedAt: new Date() })
    .where(eq(shared.users.id, user.id));

  return { success: true };
}

/**
 * Send a test digest email (logs for now)
 */
export async function sendTestDigest() {
  const user = await getAuthenticatedUser();

  console.info("[Digest] Test digest requested", {
    email: user.email,
    userId: user.id,
  });

  return {
    success: true,
    message: `Test digest envoyé à ${user.email}`,
  };
}

/**
 * Generate HTML email content for digest
 */
export async function generateDigestHtml(
  userId: string,
  frequency: "daily" | "weekly"
) {
  const user = await db.query.users.findFirst({
    where: eq(shared.users.id, userId),
  });
  if (!user) return null;

  const hoursBack = frequency === "weekly" ? 7 * 24 : 24;
  const since = Date.now() - hoursBack * 60 * 60 * 1000;
  const sinceDate = new Date(since);

  // Get recent deals
  const recentDeals = await db.query.deals.findMany({
    where: gte(shared.deals.createdAt, sinceDate),
    orderBy: [desc(shared.deals.createdAt)],
    limit: 10,
  });

  // Build HTML email
  const dealRows = recentDeals
    .map(
      (d) => `
      <div style="background:#f9fafb;padding:12px 16px;margin-bottom:8px;border-radius:8px;border-left:3px solid #4f46e5;">
        <div style="font-weight:600;color:#111827;margin-bottom:4px;">${d.title}</div>
        <div style="font-size:13px;color:#6b7280;">${d.stage} • ${d.amount ? `€${(parseFloat(d.amount) / 1_000_000).toFixed(1)}M` : "Montant NC"}</div>
      </div>
    `
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:0;background:#f3f4f6;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);color:white;padding:24px;border-radius:12px 12px 0 0;">
      <h1 style="margin:0 0 8px 0;font-size:24px;">Bonjour ${user.fullName || ""}!</h1>
      <p style="margin:0;opacity:0.9;">Voici votre résumé ${frequency === "weekly" ? "hebdomadaire" : "quotidien"}</p>
    </div>
    <div style="background:white;padding:24px;">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px;">
        <div style="background:#f9fafb;padding:16px;border-radius:8px;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:#4f46e5;">${recentDeals.length}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px;">Nouveaux dossiers</div>
        </div>
      </div>
      ${recentDeals.length > 0 ? `<div style="margin-bottom:24px;"><div style="font-size:16px;font-weight:600;color:#374151;margin-bottom:12px;">📊 Nouveaux dossiers</div>${dealRows}</div>` : '<div style="color:#9ca3af;font-style:italic;padding:12px 0;">Aucune activité significative durant cette période.</div>'}
    </div>
    <div style="text-align:center;padding:24px;color:#6b7280;font-size:12px;background:#f9fafb;border-radius:0 0 12px 12px;">
      <p>Alecia Panel • M&A Operating System</p>
      <p><a href="https://app.alecia.fr/settings" style="color:#4f46e5;text-decoration:none;">Gérer mes préférences</a></p>
    </div>
  </div>
</body>
</html>`;

  return {
    html,
    subject: `${frequency === "weekly" ? "📅 Bilan hebdo" : "☀️ Daily digest"} Alecia`,
  };
}
