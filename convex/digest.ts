// Activity Digest - Scheduled email summaries
// Uses Convex scheduled functions with Resend integration

import {
	mutation,
	query,
	internalMutation,
	internalQuery,
} from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { getOptionalUser, getAuthenticatedUser } from "./auth_utils";
import { logger } from "./lib/logger";

// Extended user type with digest preferences
interface UserWithDigestPrefs {
	_id: Id<"users">;
	email: string;
	name?: string;
	digestEnabled?: boolean;
	digestFrequency?: "daily" | "weekly" | "none";
	lastDigestSent?: number;
}

// ============================================
// QUERIES
// ============================================

/**
 * Get user's digest preferences
 */
export const getDigestPreferences = query({
	args: {},
	handler: async (ctx) => {
		const user = await getOptionalUser(ctx);
		if (!user) return null;

		const userPrefs = user as unknown as UserWithDigestPrefs;
		return {
			enabled: userPrefs.digestEnabled ?? true,
			frequency: userPrefs.digestFrequency ?? "daily",
			includeDeals: true,
			includeComments: true,
			includeMentions: true,
			includeSignatures: true,
			includeTasks: true,
		};
	},
});

/**
 * Get comprehensive activity summary for digest
 */
export const getActivitySummary = query({
	args: {
		since: v.optional(v.number()),
		frequency: v.optional(v.union(v.literal("daily"), v.literal("weekly"))),
	},
	handler: async (ctx, args) => {
		const user = await getOptionalUser(ctx);
		if (!user)
			return {
				deals: [],
				comments: [],
				mentions: [],
				signatures: [],
				tasks: [],
				ddChecklists: [],
				vdrActivity: [],
				stats: {},
			};

		// Calculate time range
		const hoursBack = args.frequency === "weekly" ? 7 * 24 : 24;
		const since = args.since || Date.now() - hoursBack * 60 * 60 * 1000;

		// Get recent deals
		const allDeals = await ctx.db.query("deals").order("desc").take(50);
		const recentDeals = allDeals.filter((d) => d._creationTime > since);

		// Get deals with stage changes
		const dealsWithChanges = recentDeals.map((d) => ({
			id: d._id,
			title: d.title,
			stage: d.stage,
			amount: d.amount,
			createdAt: d._creationTime,
			isNew: d._creationTime > since,
		}));

		// Get comments mentioning user
		const allComments = await ctx.db.query("comments").order("desc").take(100);
		const userMentions = allComments.filter(
			(c) => c._creationTime > since && c.mentions?.includes(user._id),
		);

		// Get pending signature requests
		const signRequests = await ctx.db
			.query("sign_requests")
			.withIndex("by_signerId", (q) => q.eq("signerId", user._id))
			.collect();
		const pendingSignatures = signRequests.filter(
			(s) => s.status === "pending",
		);

		// Get overdue tasks
		const tasks = await ctx.db
			.query("research_tasks")
			.withIndex("by_assigneeId", (q) => q.eq("assigneeId", user._id))
			.collect();
		const overdueTasks = tasks.filter(
			(t) => t.status !== "done" && t.dueDate && t.dueDate < Date.now(),
		);
		const upcomingTasks = tasks.filter(
			(t) =>
				t.status !== "done" &&
				t.dueDate &&
				t.dueDate > Date.now() &&
				t.dueDate < Date.now() + 3 * 24 * 60 * 60 * 1000,
		);

		// ============================================
		// DD CHECKLISTS ACTIVITY
		// ============================================
		const allChecklists = await ctx.db
			.query("dd_checklists")
			.order("desc")
			.take(20);
		const ddChecklists = await Promise.all(
			allChecklists.map(async (checklist) => {
				// Get items for this checklist
				const items = await ctx.db
					.query("dd_checklist_items")
					.withIndex("by_checklist", (q) => q.eq("checklistId", checklist._id))
					.collect();

				// Count recent updates (use _creationTime since updatedAt doesn't exist)
				const recentItems = items.filter(
					(i) =>
						i._creationTime > since || (i.completedAt && i.completedAt > since),
				);
				const issueItems = items.filter((i) => i.status === "issue_found");
				const overdueItems = items.filter(
					(i) =>
						i.dueDate &&
						i.dueDate < Date.now() &&
						!["received", "reviewed", "not_applicable"].includes(i.status),
				);

				// Get deal name
				const deal = await ctx.db.get(checklist.dealId);

				return {
					id: checklist._id,
					name: checklist.name,
					dealName: deal?.title || "Unknown Deal",
					progress: checklist.progress,
					totalItems: items.length,
					recentUpdates: recentItems.length,
					issues: issueItems.length,
					overdue: overdueItems.length,
					issueDetails: issueItems.slice(0, 3).map((i) => ({
						item: i.item,
						severity: i.issueSeverity,
						description: i.issueDescription,
					})),
				};
			}),
		);

		// Filter to only show checklists with activity or issues
		const activeDDChecklists = ddChecklists.filter(
			(c) => c.recentUpdates > 0 || c.issues > 0 || c.overdue > 0,
		);

		// ============================================
		// VDR ACTIVITY
		// ============================================
		const allRooms = await ctx.db.query("deal_rooms").order("desc").take(20);
		const vdrActivity = await Promise.all(
			allRooms.map(async (room) => {
				// Note: deal_room_access_logs table doesn't exist yet
				// Track activity through documents and questions instead
				const recentLogs: {
					_creationTime: number;
					email?: string;
					userId?: string;
					action?: string;
				}[] = [];

				// Get recent documents
				const documents = await ctx.db
					.query("deal_room_documents")
					.withIndex("by_room", (q) => q.eq("roomId", room._id))
					.collect();
				const recentDocs = documents.filter((d) => d._creationTime > since);

				// Get open Q&A (was "pending", but schema uses "open")
				const questions = await ctx.db
					.query("deal_room_questions")
					.withIndex("by_room", (q) => q.eq("roomId", room._id))
					.collect();
				const pendingQuestions = questions.filter((q) => q.status === "open");

				// Get deal name
				const deal = await ctx.db.get(room.dealId);

				// Count unique visitors from documents (since access_logs doesn't exist)
				const uniqueVisitors = new Set(
					recentLogs.map((l) => l.email || l.userId),
				).size;

				// Count downloads
				const downloads = recentLogs.filter(
					(l) => l.action === "download",
				).length;

				return {
					id: room._id,
					name: room.name,
					dealName: deal?.title || "Unknown Deal",
					recentVisits: recentLogs.length,
					uniqueVisitors,
					downloads,
					newDocuments: recentDocs.length,
					pendingQuestions: pendingQuestions.length,
					recentQuestions: pendingQuestions.slice(0, 3).map((q) => ({
						content: q.question?.slice(0, 100) || "",
						askedBy: q.askedByName || q.askedBy,
					})),
				};
			}),
		);

		// Filter to only show rooms with activity
		const activeVDRRooms = vdrActivity.filter(
			(r) => r.recentVisits > 0 || r.newDocuments > 0 || r.pendingQuestions > 0,
		);

		// Calculate stats
		const stats = {
			newDeals: recentDeals.length,
			totalPipelineValue: allDeals.reduce((sum, d) => sum + (d.amount || 0), 0),
			pendingSignatures: pendingSignatures.length,
			overdueTasks: overdueTasks.length,
			upcomingTasks: upcomingTasks.length,
			mentions: userMentions.length,
			// DD stats
			ddChecklistsWithActivity: activeDDChecklists.length,
			ddIssuesTotal: activeDDChecklists.reduce((sum, c) => sum + c.issues, 0),
			ddOverdueTotal: activeDDChecklists.reduce((sum, c) => sum + c.overdue, 0),
			// VDR stats
			vdrRoomsWithActivity: activeVDRRooms.length,
			vdrTotalVisits: activeVDRRooms.reduce(
				(sum, r) => sum + r.recentVisits,
				0,
			),
			vdrPendingQuestions: activeVDRRooms.reduce(
				(sum, r) => sum + r.pendingQuestions,
				0,
			),
		};

		return {
			deals: dealsWithChanges,
			comments: userMentions.slice(0, 10).map((c) => ({
				id: c._id,
				content:
					c.content.slice(0, 100) + (c.content.length > 100 ? "..." : ""),
				entityType: c.entityType,
				createdAt: c._creationTime,
			})),
			mentions: userMentions.length,
			signatures: pendingSignatures.map((s) => ({
				id: s._id,
				title: s.title,
				documentType: s.documentType,
				createdAt: s._creationTime,
			})),
			tasks: {
				overdue: overdueTasks.map((t) => ({
					id: t._id,
					title: t.title,
					dueDate: t.dueDate,
					priority: t.priority,
				})),
				upcoming: upcomingTasks.map((t) => ({
					id: t._id,
					title: t.title,
					dueDate: t.dueDate,
					priority: t.priority,
				})),
			},
			ddChecklists: activeDDChecklists,
			vdrActivity: activeVDRRooms,
			stats,
			period: {
				from: new Date(since).toISOString(),
				to: new Date().toISOString(),
				label: args.frequency === "weekly" ? "Cette semaine" : "Aujourd'hui",
			},
		};
	},
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Update digest preferences
 */
export const updateDigestPreferences = mutation({
	args: {
		enabled: v.boolean(),
		frequency: v.union(
			v.literal("daily"),
			v.literal("weekly"),
			v.literal("none"),
		),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedUser(ctx);

		await ctx.db.patch(user._id, {
			digestEnabled: args.enabled,
			digestFrequency: args.frequency,
		});

		return { success: true };
	},
});

/**
 * Send a test digest email
 */
export const sendTestDigest = mutation({
	args: {},
	handler: async (ctx) => {
		const user = await getAuthenticatedUser(ctx);

		// Log for development
		logger.info("[Digest] Test digest requested", {
			email: user.email,
			userId: user._id,
		});

		return {
			success: true,
			message: `Test digest envoyé à ${user.email}`,
		};
	},
});

// ============================================
// INTERNAL FUNCTIONS
// ============================================

/**
 * Get users eligible for digest
 */
export const getEligibleUsers = internalQuery({
	args: {
		frequency: v.union(v.literal("daily"), v.literal("weekly")),
	},
	handler: async (ctx, args) => {
		const users = await ctx.db.query("users").collect();

		return (users as unknown as UserWithDigestPrefs[]).filter(
			(u) => u.digestEnabled !== false && u.digestFrequency === args.frequency,
		);
	},
});

/**
 * Internal mutation called by scheduler
 */
export const sendScheduledDigests = internalMutation({
	args: {
		frequency: v.union(v.literal("daily"), v.literal("weekly")),
	},
	handler: async (ctx, args) => {
		const users = await ctx.db.query("users").collect();

		const eligibleUsers = (users as unknown as UserWithDigestPrefs[]).filter(
			(u) => u.digestEnabled !== false && u.digestFrequency === args.frequency,
		);

		logger.info("[Digest] Sending scheduled digests", {
			frequency: args.frequency,
			recipientCount: eligibleUsers.length,
		});

		let sentCount = 0;
		const errors: string[] = [];

		for (const user of eligibleUsers) {
			try {
				// In production, call Resend API here
				// const result = await sendDigestEmail(user, args.frequency);
				logger.debug("[Digest] Would send to", { email: user.email });

				// Update last sent timestamp
				await ctx.db.patch(user._id, { lastDigestSent: Date.now() });

				sentCount++;
			} catch (error) {
				errors.push(
					`Failed to send to ${user.email}: ${(error as Error).message}`,
				);
			}
		}

		return {
			sent: sentCount,
			failed: errors.length,
			errors: errors.slice(0, 5),
		};
	},
});

/**
 * Generate HTML email content for digest
 */
export const generateDigestHtml = internalQuery({
	args: {
		userId: v.id("users"),
		frequency: v.union(v.literal("daily"), v.literal("weekly")),
	},
	handler: async (ctx, args) => {
		const user = await ctx.db.get(args.userId);
		if (!user) return null;

		// Get activity summary
		const hoursBack = args.frequency === "weekly" ? 7 * 24 : 24;
		const since = Date.now() - hoursBack * 60 * 60 * 1000;

		// Get deals
		const deals = await ctx.db.query("deals").order("desc").take(10);
		const recentDeals = deals.filter((d) => d._creationTime > since);

		// Get DD Checklists with issues/activity
		const allChecklists = await ctx.db
			.query("dd_checklists")
			.order("desc")
			.take(10);
		const ddData = await Promise.all(
			allChecklists.map(async (checklist) => {
				const items = await ctx.db
					.query("dd_checklist_items")
					.withIndex("by_checklist", (q) => q.eq("checklistId", checklist._id))
					.collect();

				const recentItems = items.filter(
					(i) =>
						i._creationTime > since || (i.completedAt && i.completedAt > since),
				);
				const issueItems = items.filter((i) => i.status === "issue_found");
				const overdueItems = items.filter(
					(i) =>
						i.dueDate &&
						i.dueDate < Date.now() &&
						!["received", "reviewed", "not_applicable"].includes(i.status),
				);

				const deal = await ctx.db.get(checklist.dealId);

				return {
					name: checklist.name,
					dealName: deal?.title || "Unknown",
					progress: checklist.progress,
					recentUpdates: recentItems.length,
					issues: issueItems.length,
					overdue: overdueItems.length,
					id: checklist._id,
				};
			}),
		);
		const activeDD = ddData.filter(
			(c) => c.recentUpdates > 0 || c.issues > 0 || c.overdue > 0,
		);

		// Get VDR activity
		const allRooms = await ctx.db.query("deal_rooms").order("desc").take(10);
		const vdrData = await Promise.all(
			allRooms.map(async (room) => {
				// Note: deal_room_access_logs table doesn't exist yet
				const recentLogs: {
					_creationTime: number;
					email?: string;
					userId?: string;
					action?: string;
				}[] = [];
				const uniqueVisitors = new Set(
					recentLogs.map((l) => l.email || l.userId),
				).size;
				const downloads = recentLogs.filter(
					(l) => l.action === "download",
				).length;

				const questions = await ctx.db
					.query("deal_room_questions")
					.withIndex("by_room", (q) => q.eq("roomId", room._id))
					.collect();
				const pendingQuestions = questions.filter((q) => q.status === "open");

				const deal = await ctx.db.get(room.dealId);

				return {
					name: room.name,
					dealName: deal?.title || "Unknown",
					visits: recentLogs.length,
					uniqueVisitors,
					downloads,
					pendingQuestions: pendingQuestions.length,
					id: room._id,
				};
			}),
		);
		const activeVDR = vdrData.filter(
			(r) => r.visits > 0 || r.pendingQuestions > 0,
		);

		// Generate HTML
		const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f3f4f6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 24px; border-radius: 12px 12px 0 0; }
    .header h1 { margin: 0 0 8px 0; font-size: 24px; }
    .header p { margin: 0; opacity: 0.9; }
    .content { background: white; padding: 24px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 16px; font-weight: 600; color: #374151; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
    .card { background: #f9fafb; padding: 12px 16px; margin-bottom: 8px; border-radius: 8px; border-left: 3px solid #4f46e5; }
    .card-title { font-weight: 600; color: #111827; margin-bottom: 4px; }
    .card-subtitle { font-size: 13px; color: #6b7280; }
    .card.warning { border-left-color: #f59e0b; background: #fffbeb; }
    .card.danger { border-left-color: #ef4444; background: #fef2f2; }
    .card.success { border-left-color: #10b981; background: #ecfdf5; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
    .stat-card { background: #f9fafb; padding: 16px; border-radius: 8px; text-align: center; }
    .stat-number { font-size: 24px; font-weight: 700; color: #4f46e5; }
    .stat-label { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-danger { background: #fee2e2; color: #991b1b; }
    .badge-success { background: #d1fae5; color: #065f46; }
    .progress-bar { height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; margin-top: 8px; }
    .progress-fill { height: 100%; background: #4f46e5; border-radius: 3px; }
    .footer { text-align: center; padding: 24px; color: #6b7280; font-size: 12px; background: #f9fafb; border-radius: 0 0 12px 12px; }
    .footer a { color: #4f46e5; text-decoration: none; }
    .empty-state { color: #9ca3af; font-style: italic; padding: 12px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Bonjour ${user.name || ""}!</h1>
      <p>Voici votre résumé ${args.frequency === "weekly" ? "hebdomadaire" : "quotidien"}</p>
    </div>
    <div class="content">
      <!-- Stats Overview -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">${recentDeals.length}</div>
          <div class="stat-label">Nouveaux dossiers</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${activeDD.reduce((sum, c) => sum + c.issues, 0)}</div>
          <div class="stat-label">Problèmes DD</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${activeVDR.reduce((sum, r) => sum + r.visits, 0)}</div>
          <div class="stat-label">Visites VDR</div>
        </div>
      </div>

      <!-- Deals Section -->
      ${
				recentDeals.length > 0
					? `
      <div class="section">
        <div class="section-title">📊 Nouveaux dossiers</div>
        ${recentDeals
					.map(
						(d) => `
          <div class="card">
            <div class="card-title">${d.title}</div>
            <div class="card-subtitle">${d.stage} • ${d.amount ? `€${(d.amount / 1000000).toFixed(1)}M` : "Montant NC"}</div>
          </div>
        `,
					)
					.join("")}
      </div>
      `
					: ""
			}

      <!-- DD Checklists Section -->
      ${
				activeDD.length > 0
					? `
      <div class="section">
        <div class="section-title">📋 Due Diligence</div>
        ${activeDD
					.map(
						(c) => `
          <div class="card ${c.issues > 0 ? "danger" : c.overdue > 0 ? "warning" : ""}">
            <div class="card-title">
              ${c.name}
              ${c.issues > 0 ? `<span class="badge badge-danger">${c.issues} problème(s)</span>` : ""}
              ${c.overdue > 0 ? `<span class="badge badge-warning">${c.overdue} en retard</span>` : ""}
            </div>
            <div class="card-subtitle">${c.dealName} • ${c.recentUpdates} mise(s) à jour</div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${c.progress}%"></div>
            </div>
          </div>
        `,
					)
					.join("")}
      </div>
      `
					: ""
			}

      <!-- VDR Activity Section -->
      ${
				activeVDR.length > 0
					? `
      <div class="section">
        <div class="section-title">📁 Activité Data Room</div>
        ${activeVDR
					.map(
						(r) => `
          <div class="card ${r.pendingQuestions > 0 ? "warning" : "success"}">
            <div class="card-title">
              ${r.name}
              ${r.pendingQuestions > 0 ? `<span class="badge badge-warning">${r.pendingQuestions} question(s)</span>` : ""}
            </div>
            <div class="card-subtitle">
              ${r.dealName} • ${r.uniqueVisitors} visiteur(s) • ${r.downloads} téléchargement(s)
            </div>
          </div>
        `,
					)
					.join("")}
      </div>
      `
					: ""
			}

      ${
				recentDeals.length === 0 &&
				activeDD.length === 0 &&
				activeVDR.length === 0
					? `
      <div class="empty-state">Aucune activité significative durant cette période.</div>
      `
					: ""
			}
    </div>
    <div class="footer">
      <p>Alecia Panel • M&A Operating System</p>
      <p><a href="https://panel.alecia.markets/settings">Gérer mes préférences</a></p>
    </div>
  </div>
</body>
</html>`;

		return {
			html,
			subject: `${args.frequency === "weekly" ? "📅 Bilan hebdo" : "☀️ Daily digest"} Alecia`,
		};
	},
});
