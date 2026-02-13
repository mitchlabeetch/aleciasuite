// scripts/migration/import-crm-to-postgres.ts
// Imports CRM data from Convex export JSON files into PostgreSQL
// Handles: ID mapping (Convex _id → UUID), foreign key resolution, enum mapping

import { Pool } from "pg";
import { readFileSync, writeFileSync } from "fs";
import { v4 as uuidv4 } from "uuid";

const pool = new Pool({
  host: process.env.PG_HOST || "localhost",
  port: 5432,
  database: "alecia",
  user: "alecia",
  password: process.env.POSTGRES_PASSWORD,
});

// ID mapping: Convex _id → PostgreSQL UUID
const idMap = new Map<string, string>();

function mapId(convexId: string): string {
  if (!idMap.has(convexId)) {
    idMap.set(convexId, uuidv4());
  }
  return idMap.get(convexId)!;
}

function loadJson(path: string): any[] {
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    console.warn(`  ⚠ File not found: ${path}`);
    return [];
  }
}

async function importUsers() {
  const users = loadJson("scripts/migration/data/crm/users.json");
  for (const u of users) {
    const pgId = mapId(u._id);
    await pool.query(
      `INSERT INTO shared.users (id, auth_provider_id, email, full_name, role, avatar_url, preferences, created_at)
       VALUES ($1, $2, $3, $4, $5::shared.user_role, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        u.clerkId || u._id, // Legacy Clerk ID → stored as auth_provider_id
        u.email,
        u.fullName || u.name || "Unknown",
        u.role || "user",
        u.avatarUrl || u.imageUrl,
        JSON.stringify(u.preferences || {}),
        new Date(u._creationTime),
      ]
    );
  }
  console.log(`Imported ${users.length} users`);
}

async function importCompanies() {
  const companies = loadJson("scripts/migration/data/crm/companies.json");
  for (const c of companies) {
    const pgId = mapId(c._id);
    await pool.query(
      `INSERT INTO shared.companies (id, name, siren, naf_code, website, logo_url, address, financials, pappers_data, pipedrive_id, source, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        c.name,
        c.siren,
        c.nafCode,
        c.website,
        c.logoUrl,
        JSON.stringify(c.address || {}),
        JSON.stringify(c.financials || {}),
        JSON.stringify(c.pappersData || {}),
        c.pipedriveId,
        c.source || "manual",
        new Date(c._creationTime),
      ]
    );
  }
  console.log(`Imported ${companies.length} companies`);
}

async function importContacts() {
  const contacts = loadJson("scripts/migration/data/crm/contacts.json");
  for (const c of contacts) {
    const pgId = mapId(c._id);
    const companyId = c.companyId ? mapId(c.companyId) : null;
    await pool.query(
      `INSERT INTO shared.contacts (id, company_id, full_name, email, phone, role, tags, source, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        companyId,
        c.fullName || c.name,
        c.email,
        c.phone,
        c.role,
        c.tags || [],
        c.source || "manual",
        new Date(c._creationTime),
      ]
    );
  }
  console.log(`Imported ${contacts.length} contacts`);
}

async function importDeals() {
  const deals = loadJson("scripts/migration/data/crm/deals.json");
  for (const d of deals) {
    const pgId = mapId(d._id);
    const ownerId = d.ownerId ? mapId(d.ownerId) : null;
    const companyId = d.companyId ? mapId(d.companyId) : null;
    await pool.query(
      `INSERT INTO shared.deals (id, title, description, stage, amount, probability, owner_id, company_id, priority, tags, expected_close_date, pipedrive_id, source, created_at)
       VALUES ($1, $2, $3, $4::shared.deal_stage, $5, $6, $7, $8, $9::shared.deal_priority, $10, $11, $12, $13, $14)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        d.title,
        d.description,
        d.stage || "sourcing",
        d.amount,
        d.probability,
        ownerId,
        companyId,
        d.priority || "medium",
        d.tags || [],
        d.expectedCloseDate ? new Date(d.expectedCloseDate) : null,
        d.pipedriveId,
        d.source || "manual",
        new Date(d._creationTime),
      ]
    );
  }
  console.log(`Imported ${deals.length} deals`);
}

async function importDealStageHistory() {
  const history = loadJson("scripts/migration/data/crm/deal_stage_history.json");
  for (const h of history) {
    const pgId = mapId(h._id);
    const dealId = h.dealId ? mapId(h.dealId) : null;
    const changedBy = h.changedBy ? mapId(h.changedBy) : null;
    if (!dealId) continue;
    await pool.query(
      `INSERT INTO shared.deal_stage_history (id, deal_id, from_stage, to_stage, changed_by, reason, created_at)
       VALUES ($1, $2, $3::shared.deal_stage, $4::shared.deal_stage, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        dealId,
        h.fromStage || null,
        h.toStage,
        changedBy,
        h.reason,
        new Date(h._creationTime),
      ]
    );
  }
  console.log(`Imported ${history.length} deal stage history records`);
}

async function main() {
  console.log("=== Alecia CRM Import to PostgreSQL ===\n");

  // Import in order to satisfy FK constraints
  await importUsers();
  await importCompanies();
  await importContacts();
  await importDeals();
  await importDealStageHistory();

  // Save ID map for subsequent migrations (Numbers, Colab, Sign)
  writeFileSync(
    "scripts/migration/data/id-map.json",
    JSON.stringify(Object.fromEntries(idMap), null, 2)
  );
  console.log(`\nID map saved: ${idMap.size} mappings`);

  console.log("\n=== CRM import complete ===");
  await pool.end();
}

main();
