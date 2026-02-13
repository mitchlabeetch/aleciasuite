// scripts/migration/export-all-from-convex.ts
// Comprehensive Convex data export script
// Exports ALL Convex tables to organized subdirectories for PostgreSQL migration

import { ConvexClient } from "convex/browser";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const client = new ConvexClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const BASE_DIR = "scripts/migration/data";

// Export statistics
interface ExportStats {
  table: string;
  queryName: string;
  recordCount: number;
  filePath: string;
  fileSize: number;
  success: boolean;
  error?: string;
}

const stats: ExportStats[] = [];

/**
 * Export a table to JSON file
 */
async function exportTable(
  queryName: string,
  subdirectory: string,
  fileName: string,
): Promise<void> {
  const outputDir = join(BASE_DIR, subdirectory);
  mkdirSync(outputDir, { recursive: true });

  const filePath = join(outputDir, `${fileName}.json`);

  console.log(`📦 Exporting ${queryName}...`);

  try {
    const data = await client.query(queryName as any);
    const jsonContent = JSON.stringify(data, null, 2);
    const fileSize = Buffer.byteLength(jsonContent, "utf8");

    writeFileSync(filePath, jsonContent);

    const recordCount = Array.isArray(data) ? data.length : 0;
    console.log(`  ✓ ${recordCount} records → ${filePath} (${formatBytes(fileSize)})`);

    stats.push({
      table: fileName,
      queryName,
      recordCount,
      filePath,
      fileSize,
      success: true,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`  ✗ Failed to export ${queryName}: ${errorMsg}`);

    stats.push({
      table: fileName,
      queryName,
      recordCount: 0,
      filePath: "",
      fileSize: 0,
      success: false,
      error: errorMsg,
    });
  }
}

/**
 * Format bytes to human readable size
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Generate export summary
 */
function generateSummary(): void {
  const summaryPath = join(BASE_DIR, "export-summary.json");

  const summary = {
    exportedAt: new Date().toISOString(),
    totalTables: stats.length,
    successfulExports: stats.filter((s) => s.success).length,
    failedExports: stats.filter((s) => !s.success).length,
    totalRecords: stats.reduce((sum, s) => sum + s.recordCount, 0),
    totalSize: stats.reduce((sum, s) => sum + s.fileSize, 0),
    tables: stats,
    bySubdirectory: stats.reduce(
      (acc, s) => {
        const subdir = s.filePath.split("/").slice(-2)[0] || "unknown";
        if (!acc[subdir]) {
          acc[subdir] = {
            tables: 0,
            records: 0,
            size: 0,
          };
        }
        acc[subdir].tables++;
        acc[subdir].records += s.recordCount;
        acc[subdir].size += s.fileSize;
        return acc;
      },
      {} as Record<string, { tables: number; records: number; size: number }>,
    ),
  };

  writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`\n📊 Export summary written to ${summaryPath}`);

  // Print summary to console
  console.log("\n" + "=".repeat(80));
  console.log("EXPORT SUMMARY");
  console.log("=".repeat(80));
  console.log(`Total tables: ${summary.totalTables}`);
  console.log(`Successful: ${summary.successfulExports}`);
  console.log(`Failed: ${summary.failedExports}`);
  console.log(`Total records: ${summary.totalRecords.toLocaleString()}`);
  console.log(`Total size: ${formatBytes(summary.totalSize)}`);

  console.log("\nBreakdown by subdirectory:");
  Object.entries(summary.bySubdirectory).forEach(([subdir, data]) => {
    console.log(
      `  ${subdir.padEnd(20)} → ${String(data.tables).padStart(2)} tables, ${String(data.records).padStart(6)} records, ${formatBytes(data.size)}`,
    );
  });

  if (summary.failedExports > 0) {
    console.log("\n⚠️  Failed exports:");
    stats
      .filter((s) => !s.success)
      .forEach((s) => {
        console.log(`  ✗ ${s.queryName} - ${s.error}`);
      });
  }

  console.log("\n" + "=".repeat(80));
}

/**
 * Main export function
 */
async function main() {
  console.log("=".repeat(80));
  console.log("ALECIA SUITE - COMPREHENSIVE CONVEX DATA EXPORT");
  console.log("=".repeat(80));
  console.log(`Exporting to: ${BASE_DIR}`);
  console.log(`Started at: ${new Date().toISOString()}\n`);

  // Create base directory
  mkdirSync(BASE_DIR, { recursive: true });

  // ============================================
  // CRM DATA
  // ============================================
  console.log("\n📂 CRM Data\n");
  await exportTable("users:list", "crm", "users");
  await exportTable("companies:list", "crm", "companies");
  await exportTable("contacts:list", "crm", "contacts");
  await exportTable("deals:list", "crm", "deals");
  await exportTable("dealStageHistory:list", "crm", "deal_stage_history");

  // ============================================
  // CMS DATA
  // ============================================
  console.log("\n📂 CMS Data\n");
  await exportTable("transactions:list", "cms", "transactions");
  await exportTable("teamMembers:list", "cms", "team_members");
  await exportTable("blogPosts:list", "cms", "blog_posts");
  await exportTable("jobOffers:list", "cms", "job_offers");
  await exportTable("marketingKpis:list", "cms", "marketing_kpis");
  await exportTable("locationImages:list", "cms", "location_images");

  // ============================================
  // CONTENT / PAGE MANAGEMENT
  // ============================================
  console.log("\n📂 Content / Page Management\n");
  await exportTable("sitePages:list", "content", "site_pages");
  await exportTable("pageContent:list", "content", "page_content");
  await exportTable("pendingChanges:list", "content", "pending_changes");
  await exportTable("changeApprovals:list", "content", "change_approvals");
  await exportTable("pageVersions:list", "content", "page_versions");
  await exportTable("proposals:list", "content", "proposals");
  await exportTable("editorSessions:list", "content", "editor_sessions");
  await exportTable("globalSettings:list", "content", "global_settings");
  await exportTable("globalConfig:list", "content", "global_config");

  // ============================================
  // NUMBERS (FINANCIAL TOOLS)
  // ============================================
  console.log("\n📂 Numbers (Financial Tools)\n");
  await exportTable(
    "numbers_financialModels:list",
    "numbers",
    "financial_models",
  );
  await exportTable("numbers_valuations:list", "numbers", "valuations");
  await exportTable("numbers_comparables:list", "numbers", "comparables");
  await exportTable("numbers_ddChecklists:list", "numbers", "dd_checklists");
  await exportTable("numbers_spreadsheets:list", "numbers", "spreadsheets");
  await exportTable("numbers_pipeline:list", "numbers", "pipeline");
  await exportTable("numbers_timelines:list", "numbers", "timelines");
  await exportTable(
    "numbers_teaserTracking:list",
    "numbers",
    "teaser_tracking",
  );
  await exportTable(
    "numbers_feeCalculations:list",
    "numbers",
    "fee_calculations",
  );
  await exportTable("numbers_postDeal:list", "numbers", "post_deal");

  // ============================================
  // COLAB (COLLABORATION)
  // ============================================
  console.log("\n📂 Colab (Collaboration)\n");
  await exportTable("colab_documents:list", "colab", "colab_documents");
  await exportTable("colab_boards:list", "colab", "colab_boards");
  await exportTable("colab_lists:list", "colab", "colab_lists");
  await exportTable("colab_cards:list", "colab", "colab_cards");
  await exportTable("colab_labels:list", "colab", "colab_labels");
  await exportTable("colab_checklists:list", "colab", "colab_checklists");
  await exportTable(
    "colab_checklistItems:list",
    "colab",
    "colab_checklist_items",
  );
  await exportTable(
    "colab_cardActivities:list",
    "colab",
    "colab_card_activities",
  );
  await exportTable("colab_presentations:list", "colab", "colab_presentations");
  await exportTable("colab_files:list", "colab", "colab_files");
  await exportTable(
    "colab_propertyDefinitions:list",
    "colab",
    "colab_property_definitions",
  );
  await exportTable("colab_yjsDocuments:list", "colab", "colab_yjs_documents");
  await exportTable("colab_yjsUpdates:list", "colab", "colab_yjs_updates");
  await exportTable("colab_yjsAwareness:list", "colab", "colab_yjs_awareness");
  await exportTable("colab_presence:list", "colab", "colab_presence");
  await exportTable(
    "colab_documentVersions:list",
    "colab",
    "colab_document_versions",
  );
  await exportTable("colab_users:list", "colab", "colab_users");

  // ============================================
  // SIGN (DATA ROOMS & E-SIGNATURE)
  // ============================================
  console.log("\n📂 Sign (Data Rooms & E-Signature)\n");
  await exportTable("dealRooms:list", "sign", "deal_rooms");
  await exportTable("dealRoomFolders:list", "sign", "deal_room_folders");
  await exportTable("dealRoomDocuments:list", "sign", "deal_room_documents");
  await exportTable("dealRoomAccessLog:list", "sign", "deal_room_access_log");
  await exportTable("dealRoomQuestions:list", "sign", "deal_room_questions");
  await exportTable(
    "dealRoomInvitations:list",
    "sign",
    "deal_room_invitations",
  );
  await exportTable("signRequests:list", "sign", "sign_requests");
  await exportTable(
    "ddChecklistTemplates:list",
    "sign",
    "dd_checklist_templates",
  );
  await exportTable("ddChecklists:list", "sign", "dd_checklists");
  await exportTable("ddChecklistItems:list", "sign", "dd_checklist_items");

  // ============================================
  // BI (BUSINESS INTELLIGENCE)
  // ============================================
  console.log("\n📂 BI (Business Intelligence)\n");
  await exportTable("comments:list", "bi", "comments");
  await exportTable("buyerCriteria:list", "bi", "buyer_criteria");
  await exportTable("embeddings:list", "bi", "embeddings");
  await exportTable("researchTasks:list", "bi", "research_tasks");
  await exportTable("kanbanColumns:list", "bi", "kanban_columns");
  await exportTable("projectEvents:list", "bi", "project_events");
  await exportTable("approvalRequests:list", "bi", "approval_requests");
  await exportTable("approvalReviews:list", "bi", "approval_reviews");
  await exportTable("approvalTemplates:list", "bi", "approval_templates");

  // ============================================
  // CALENDAR
  // ============================================
  console.log("\n📂 Calendar\n");
  await exportTable("calendarEvents:list", "calendar", "calendar_events");
  await exportTable("calendarSyncState:list", "calendar", "calendar_sync_state");
  await exportTable("googleTokens:list", "calendar", "google_tokens");

  // ============================================
  // ANALYTICS
  // ============================================
  console.log("\n📂 Analytics\n");
  await exportTable("analyticsEvents:list", "analytics", "analytics_events");
  await exportTable(
    "analyticsDailyStats:list",
    "analytics",
    "analytics_daily_stats",
  );
  await exportTable("analyticsCache:list", "analytics", "analytics_cache");

  // ============================================
  // USER PREFERENCES & NOTIFICATIONS
  // ============================================
  console.log("\n📂 User Data\n");
  await exportTable("userPreferences:list", "user", "user_preferences");
  await exportTable("notifications:list", "user", "notifications");
  await exportTable("presence:list", "user", "presence");

  // ============================================
  // SECURITY & TOKENS
  // ============================================
  console.log("\n📂 Security & Tokens\n");
  await exportTable("featureFlags:list", "security", "feature_flags");
  await exportTable(
    "featureFlagAssignments:list",
    "security",
    "feature_flag_assignments",
  );
  await exportTable("rateLimitEntries:list", "security", "rate_limit_entries");
  await exportTable(
    "emailUnsubscribeTokens:list",
    "security",
    "email_unsubscribe_tokens",
  );
  await exportTable("microsoftTokens:list", "security", "microsoft_tokens");
  await exportTable("pipedriveTokens:list", "security", "pipedrive_tokens");

  // ============================================
  // MISCELLANEOUS
  // ============================================
  console.log("\n📂 Miscellaneous\n");
  await exportTable("forumCategories:list", "misc", "forum_categories");
  await exportTable("forumThreads:list", "misc", "forum_threads");
  await exportTable("forumPosts:list", "misc", "forum_posts");
  await exportTable("whiteboards:list", "misc", "whiteboards");
  await exportTable("voiceNotes:list", "misc", "voice_notes");
  await exportTable("valuationModels:list", "misc", "valuation_models");
  await exportTable("companyLogos:list", "misc", "company_logos");

  // ============================================
  // GENERATE SUMMARY
  // ============================================
  generateSummary();

  console.log(`\n✅ Export completed at: ${new Date().toISOString()}`);
  console.log(`📁 Data exported to: ${BASE_DIR}`);
}

// Run the export
main().catch((err) => {
  console.error("Fatal error during export:", err);
  process.exit(1);
});
