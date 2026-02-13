// scripts/migration/export-cms-from-convex.ts
// Exports transactions, team_members, blog_posts, job_offers, marketing_kpis
// from Convex and writes JSON files for Strapi import

import { ConvexClient } from "convex/browser";

const client = new ConvexClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const OUT_DIR = "scripts/migration/data/cms";

async function exportTable(queryName: string, fileName: string) {
  console.log(`Exporting ${queryName}...`);
  const data = await client.query(queryName as any);
  await Bun.write(`${OUT_DIR}/${fileName}.json`, JSON.stringify(data, null, 2));
  console.log(`  → ${(data as any[]).length} records exported`);
  return data;
}

async function main() {
  // Export transactions (tombstones)
  await exportTable("transactions:list", "transactions");

  // Export team members
  await exportTable("teamMembers:list", "team_members");

  // Export blog posts
  await exportTable("blogPosts:list", "blog_posts");

  // Export job offers
  await exportTable("jobOffers:list", "job_offers");

  // Export marketing KPIs
  await exportTable("marketingKpis:list", "marketing_kpis");

  console.log("CMS export complete. Files in scripts/migration/data/cms/");
}

main();
