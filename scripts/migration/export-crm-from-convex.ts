// scripts/migration/export-crm-from-convex.ts
// Exports: users, companies, contacts, deals, deal_stage_history,
// comments, buyer_criteria, embeddings, microsoft_tokens, pipedrive_tokens

import { ConvexClient } from "convex/browser";
import { writeFileSync, mkdirSync } from "fs";

const client = new ConvexClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const OUT_DIR = "scripts/migration/data/crm";
mkdirSync(OUT_DIR, { recursive: true });

async function exportTable(queryName: string, fileName: string) {
  console.log(`Exporting ${queryName}...`);
  try {
    const data = await client.query(queryName as any);
    writeFileSync(
      `${OUT_DIR}/${fileName}.json`,
      JSON.stringify(data, null, 2)
    );
    console.log(`  → ${(data as any[]).length} records exported`);
    return data;
  } catch (err) {
    console.error(`  ✗ Failed to export ${queryName}:`, err);
    return [];
  }
}

async function main() {
  console.log("=== Alecia CRM Data Export from Convex ===\n");

  await exportTable("users:list", "users");
  await exportTable("companies:list", "companies");
  await exportTable("contacts:list", "contacts");
  await exportTable("deals:list", "deals");
  await exportTable("dealStageHistory:list", "deal_stage_history");
  await exportTable("comments:list", "comments");
  await exportTable("buyerCriteria:list", "buyer_criteria");
  await exportTable("embeddings:list", "embeddings");

  // Numbers data
  await exportTable("numbers_financialModels:list", "financial_models");
  await exportTable("numbers_valuations:list", "valuations");
  await exportTable("numbers_comparables:list", "comparables");
  await exportTable("numbers_ddChecklists:list", "dd_checklists");
  await exportTable("numbers_pipeline:list", "pipeline");
  await exportTable("numbers_timelines:list", "timelines");
  await exportTable("numbers_teaserTracking:list", "teaser_tracking");
  await exportTable("numbers_feeCalculations:list", "fee_calculations");
  await exportTable("numbers_postDeal:list", "post_deal");
  await exportTable("numbers_spreadsheets:list", "spreadsheets");

  // Colab data
  await exportTable("colab_documents:list", "colab_documents");
  await exportTable("colab_boards:list", "colab_boards");
  await exportTable("colab_lists:list", "colab_lists");
  await exportTable("colab_cards:list", "colab_cards");
  await exportTable("colab_presentations:list", "colab_presentations");

  // Data room data
  await exportTable("dealRooms:list", "deal_rooms");
  await exportTable("dealRoomFolders:list", "deal_room_folders");
  await exportTable("dealRoomDocuments:list", "deal_room_documents");
  await exportTable("dealRoomAccessLog:list", "deal_room_access_log");
  await exportTable("dealRoomQuestions:list", "deal_room_questions");
  await exportTable("dealRoomInvitations:list", "deal_room_invitations");

  console.log("\n=== CRM export complete ===");
}

main();
