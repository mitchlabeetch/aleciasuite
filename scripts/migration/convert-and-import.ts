/**
 * Alecia Data Migration: Convex JSONL → PostgreSQL
 *
 * Converts Convex CLI export (JSONL) to JSON, then imports
 * the ~87 records into the local PostgreSQL database.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";

const SNAPSHOT_DIR = "scripts/migration/data/convex-export/snapshot";
const DATA_DIR = "scripts/migration/data";

// ─── Step 1: Convert JSONL → JSON arrays ────────────────────────────────────

function readJSONL(tableName: string): any[] {
  const jsonlPath = join(SNAPSHOT_DIR, tableName, "documents.jsonl");
  if (!existsSync(jsonlPath)) return [];
  const content = readFileSync(jsonlPath, "utf-8").trim();
  if (!content) return [];
  return content.split("\n").map((line) => JSON.parse(line));
}

// ─── Step 2: Import into PostgreSQL ──────────────────────────────────────────

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "alecia",
  user: "alecia",  // superuser (alecia_app lacks INSERT)
  password: "a7f3e2b1c9d4e5f8a3b7c2d1e9f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f",
});

const idMap = new Map<string, string>();
// Clerk user IDs (e.g. "user_37xMPSMT2rasxmoQgF8HXJnLk2c") → PostgreSQL UUID
const clerkIdMap = new Map<string, string>();

// Load existing ID map for idempotent re-runs
const idMapPath = join(DATA_DIR, "id-map.json");
if (existsSync(idMapPath)) {
  const saved = JSON.parse(readFileSync(idMapPath, "utf-8"));
  for (const [k, v] of Object.entries(saved)) {
    idMap.set(k, v as string);
  }
  console.log(`  Loaded existing ID map: ${idMap.size} mappings`);
}

function mapId(convexId: string): string {
  if (!idMap.has(convexId)) {
    idMap.set(convexId, uuidv4());
  }
  return idMap.get(convexId)!;
}

/** Resolve a userId that might be a Convex _id or a Clerk user ID */
function resolveUserId(userId: string): string | null {
  // Check Clerk ID map first (e.g. "user_37xMPSMT2rasxmoQgF8HXJnLk2c")
  if (clerkIdMap.has(userId)) return clerkIdMap.get(userId)!;
  // Otherwise treat as Convex document ID
  return mapId(userId);
}

// ── Users (1 record) ─────────────────────────────────────────────────────────
// Schema: id, auth_provider_id, email, full_name, role (enum: sudo|partner|advisor|user),
//         avatar_url, preferences (jsonb), is_active, last_login_at, created_at, updated_at, email_verified

/** Pre-load existing users from PostgreSQL to support idempotent re-runs */
async function preloadExistingUsers() {
  const result = await pool.query("SELECT id, auth_provider_id FROM shared.users");
  for (const row of result.rows) {
    // Reverse-map: if a user with this auth_provider_id already exists, we need
    // to find the Convex _id that maps to them
    if (row.auth_provider_id) {
      const clerkId = row.auth_provider_id.includes("|")
        ? row.auth_provider_id.split("|")[1]
        : row.auth_provider_id;
      clerkIdMap.set(clerkId, row.id);
    }
  }
  console.log(`  Pre-loaded ${result.rows.length} existing users`);
}

async function importUsers() {
  const items = readJSONL("users");
  for (const u of items) {
    const tokenId = u.tokenIdentifier || "";
    const clerkId = tokenId.includes("|") ? tokenId.split("|")[1] : (u.clerkId || "");

    // Check if user already exists (from preload)
    if (clerkId && clerkIdMap.has(clerkId)) {
      const existingUuid = clerkIdMap.get(clerkId)!;
      idMap.set(u._id, existingUuid);  // Map Convex _id → existing UUID
      console.log(`  ⊙ User "${u.name}" already exists (${existingUuid.slice(0, 8)}…)`);
      continue;
    }

    const pgId = mapId(u._id);
    const role = u.role === "sudo" ? "sudo" : u.role === "partner" ? "partner" : u.role === "advisor" ? "advisor" : "user";
    if (clerkId) clerkIdMap.set(clerkId, pgId);
    await pool.query(
      `INSERT INTO shared.users (id, auth_provider_id, email, full_name, role, avatar_url, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5::shared.user_role, $6, $7, $8, $9)
       ON CONFLICT ON CONSTRAINT users_pkey DO NOTHING`,
      [
        pgId,
        u.tokenIdentifier || u.clerkId,
        u.email || `user-${pgId.slice(0, 8)}@alecia.markets`,
        u.name || "Unknown",
        role,
        u.avatarUrl,
        true,
        new Date(u._creationTime),
        new Date(u._creationTime),
      ]
    );
  }
  console.log(`  ✓ ${items.length} users`);
  return items.length;
}

// ── Team Members (8 records) ─────────────────────────────────────────────────
// Schema: id, slug, name, role, photo, photo_url, bio_fr, bio_en, linkedin_url, email,
//         sectors_expertise (text[]), transaction_slugs (text[]), is_active, display_order, created_at, updated_at
async function importTeamMembers() {
  const items = readJSONL("team_members");
  for (const t of items) {
    const pgId = mapId(t._id);
    await pool.query(
      `INSERT INTO shared.team_members (id, slug, name, role, photo, photo_url, bio_fr, bio_en, linkedin_url, email, sectors_expertise, transaction_slugs, is_active, display_order, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       ON CONFLICT (slug) DO NOTHING`,
      [
        pgId,
        t.slug,
        t.name,
        t.role,
        t.photo,
        t.photoUrl || t.photo,
        t.bioFr,
        t.bioEn,
        t.linkedinUrl,
        t.email,
        t.sectorsExpertise || [],   // text[]
        t.transactionSlugs || [],   // text[]
        t.isActive !== false,
        t.displayOrder ?? 0,
        new Date(t._creationTime),
        new Date(t._creationTime),
      ]
    );
  }
  console.log(`  ✓ ${items.length} team_members`);
}

// ── Transactions (45 records) ────────────────────────────────────────────────
// Schema: id, slug, client_name, client_logo, acquirer_name, acquirer_logo, sector, region,
//         year (int), mandate_type, description, is_confidential, is_client_confidential,
//         is_acquirer_confidential, is_prior_experience, display_order, created_at, updated_at
async function importTransactions() {
  const items = readJSONL("transactions");
  const seenSlugs = new Set<string>();
  let imported = 0;
  for (const t of items) {
    const pgId = mapId(t._id);
    // Deduplicate slugs — append year+mandate if duplicate
    let slug = t.slug;
    if (seenSlugs.has(slug)) {
      slug = `${slug}-${(t.mandateType || "deal").toLowerCase().replace(/\s+/g, "-")}`;
    }
    if (seenSlugs.has(slug)) {
      slug = `${t.slug}-${pgId.slice(0, 8)}`;
    }
    seenSlugs.add(slug);
    await pool.query(
      `INSERT INTO shared.transactions (id, slug, client_name, acquirer_name, sector, region, year, mandate_type, description, is_confidential, is_prior_experience, display_order, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (slug) DO NOTHING`,
      [
        pgId,
        slug,
        t.clientName,
        t.acquirerName,
        t.sector,
        t.region,
        Math.round(t.year),  // Convex stores as float
        t.mandateType,
        t.description,
        t.isConfidential || false,
        t.isPriorExperience || false,
        Math.round(t.displayOrder ?? 0),
        new Date(t._creationTime),
        new Date(t._creationTime),
      ]
    );
    imported++;
  }
  console.log(`  ✓ ${imported}/${items.length} transactions (${items.length - imported} duplicate slugs skipped)`);
}

// ── Blog Posts (2 records) ───────────────────────────────────────────────────
// Schema: id, status (draft|published|archived), author_id, title, slug, content (text),
//         excerpt, featured_image, category, published_at (bigint), seo (jsonb), tags (text[]), created_at (bigint)
async function importBlogPosts() {
  const items = readJSONL("blog_posts");
  for (const b of items) {
    const pgId = mapId(b._id);
    const authorId = b.authorId ? mapId(b.authorId) : null;
    await pool.query(
      `INSERT INTO shared.blog_posts (id, status, author_id, title, slug, content, excerpt, featured_image, category, published_at, seo, tags, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (slug) DO NOTHING`,
      [
        pgId,
        b.status || "draft",
        authorId,
        b.title,
        b.slug,
        b.content || "",      // text, not jsonb
        b.excerpt,
        b.coverImage,         // featured_image
        b.category,
        b.publishedAt ? Math.round(b.publishedAt) : null,  // bigint
        JSON.stringify({ title: b.seoTitle, description: b.seoDescription }),
        b.tags || [],         // text[]
        Math.round(b._creationTime),  // bigint
      ]
    );
  }
  console.log(`  ✓ ${items.length} blog_posts`);
}

// ── Job Offers (1 record) ────────────────────────────────────────────────────
// Schema: id, slug, title, type, location, description, requirements, contact_email,
//         pdf_url, is_published, display_order, created_at, updated_at
async function importJobOffers() {
  const items = readJSONL("job_offers");
  for (const j of items) {
    const pgId = mapId(j._id);
    const requirements = Array.isArray(j.requirements) ? j.requirements.join("\n• ") : (j.requirements || "");
    await pool.query(
      `INSERT INTO shared.job_offers (id, slug, title, type, location, description, requirements, contact_email, pdf_url, is_published, display_order, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (slug) DO NOTHING`,
      [
        pgId,
        j.slug,
        j.title,
        j.type || "CDI",
        j.location,
        j.description,
        requirements ? `• ${requirements}` : null,
        j.contactEmail,
        j.pdfUrl || null,
        j.isPublished || false,
        Math.round(j.displayOrder ?? 0),
        new Date(j._creationTime),
        new Date(j._creationTime),
      ]
    );
  }
  console.log(`  ✓ ${items.length} job_offers`);
}

// ── Marketing KPIs (4 records) ───────────────────────────────────────────────
// Schema: id, key (unique), icon, value (numeric), suffix, prefix, label_fr, label_en,
//         display_order, is_active
async function importMarketingKpis() {
  const items = readJSONL("marketing_kpis");
  for (const k of items) {
    const pgId = mapId(k._id);
    await pool.query(
      `INSERT INTO shared.marketing_kpis (id, key, icon, value, suffix, prefix, label_fr, label_en, display_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (key) DO NOTHING`,
      [
        pgId,
        k.key,
        k.icon,
        k.value,          // numeric
        k.suffix || null,
        k.prefix || null,
        k.labelFr,
        k.labelEn,
        Math.round(k.displayOrder ?? 0),
        k.isActive !== false,
      ]
    );
  }
  console.log(`  ✓ ${items.length} marketing_kpis`);
}

// ── Forum Categories (4 records) ─────────────────────────────────────────────
// Schema: id, name, description, is_private, "order", created_at
async function importForumCategories() {
  const items = readJSONL("forum_categories");
  for (const c of items) {
    const pgId = mapId(c._id);
    await pool.query(
      `INSERT INTO shared.forum_categories (id, name, description, is_private, "order", created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        c.name,
        c.description,
        c.isPrivate || false,
        Math.round(c.order ?? 0),
        new Date(c._creationTime),
      ]
    );
  }
  console.log(`  ✓ ${items.length} forum_categories`);
}

// ── Page Content (4 records) ─────────────────────────────────────────────────
// Schema: id, path, locale, sections (jsonb), theme (jsonb), version (int),
//         published_at (bigint), published_by (uuid), created_at (bigint), updated_at (bigint)
async function importPageContent() {
  const items = readJSONL("page_content");
  for (const p of items) {
    const pgId = mapId(p._id);
    await pool.query(
      `INSERT INTO shared.page_content (id, path, locale, sections, version, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (path, locale) DO NOTHING`,
      [
        pgId,
        p.path,
        p.locale || "fr",
        JSON.stringify(p.sections || []),
        Math.round(p.version ?? 1),
        Math.round(p.createdAt || p._creationTime),  // bigint
        Math.round(p.updatedAt || p._creationTime),   // bigint
      ]
    );
  }
  console.log(`  ✓ ${items.length} page_content`);
}

// ── Global Config (13 records) ───────────────────────────────────────────────
// Schema: id, key (unique), value (jsonb), updated_at
async function importGlobalConfig() {
  const items = readJSONL("global_config");
  for (const g of items) {
    const pgId = mapId(g._id);
    await pool.query(
      `INSERT INTO shared.global_config (id, key, value, updated_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`,
      [
        pgId,
        g.key,
        JSON.stringify(g.value),
        g.updatedAt ? new Date(g.updatedAt) : new Date(g._creationTime),
      ]
    );
  }
  console.log(`  ✓ ${items.length} global_config`);
}

// ── Colab Documents (1 record) ───────────────────────────────────────────────
async function importColabDocuments() {
  const items = readJSONL("colab_documents");
  for (const d of items) {
    const pgId = mapId(d._id);
    const ownerId = d.ownerId || d.userId || d.createdBy;
    const ownerUuid = ownerId ? resolveUserId(ownerId) : null;
    if (!ownerUuid) continue;
    await pool.query(
      `INSERT INTO alecia_colab.documents (id, title, content, owner_id, is_template, is_archived, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        d.title || "Untitled",
        JSON.stringify(d.content || {}),
        ownerUuid,
        d.isTemplate || false,
        d.isArchived || false,
        new Date(d._creationTime),
        d.updatedAt ? new Date(d.updatedAt) : new Date(d._creationTime),
      ]
    );
  }
  console.log(`  ✓ ${items.length} colab_documents`);
}

// ── Colab Presentations (1 record) ───────────────────────────────────────────
async function importColabPresentations() {
  const items = readJSONL("colab_presentations");
  for (const p of items) {
    const pgId = mapId(p._id);
    const ownerId = p.userId || p.ownerId || p.createdBy;
    const ownerUuid = ownerId ? resolveUserId(ownerId) : null;
    if (!ownerUuid) continue;
    await pool.query(
      `INSERT INTO alecia_colab.presentations (id, title, slides, owner_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        p.title || "Untitled",
        JSON.stringify(p.slides || []),
        ownerUuid,
        new Date(p._creationTime),
        p.updatedAt ? new Date(p.updatedAt) : new Date(p._creationTime),
      ]
    );
  }
  console.log(`  ✓ ${items.length} colab_presentations`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("══════════════════════════════════════════════════════════════");
  console.log("  ALECIA DATA MIGRATION: Convex → PostgreSQL");
  console.log("══════════════════════════════════════════════════════════════\n");

  try {
    // Test connection
    const res = await pool.query("SELECT current_database(), current_user");
    console.log(`  Connected: ${res.rows[0].current_database} as ${res.rows[0].current_user}`);

    // Check schemas
    const schemas = await pool.query(
      "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'alecia_%' OR schema_name = 'shared' ORDER BY schema_name"
    );
    console.log(`  Schemas: ${schemas.rows.map((r: any) => r.schema_name).join(", ")}\n`);

    // Import in FK-dependency order
    console.log("── shared schema (users first, then everything else) ──");
    await preloadExistingUsers();
    await importUsers();
    await importTeamMembers();
    await importTransactions();
    await importBlogPosts();
    await importJobOffers();
    await importMarketingKpis();
    await importForumCategories();
    await importPageContent();
    await importGlobalConfig();

    console.log("\n── alecia_colab schema ──");
    await importColabDocuments();
    await importColabPresentations();

    // Save ID map for future use
    writeFileSync(
      join(DATA_DIR, "id-map.json"),
      JSON.stringify(Object.fromEntries(idMap), null, 2)
    );
    console.log(`\n  ✓ ID map saved: ${idMap.size} mappings → ${DATA_DIR}/id-map.json`);

    // Verify
    console.log("\n── Verification ──");
    const tables = [
      "shared.users",
      "shared.team_members",
      "shared.transactions",
      "shared.blog_posts",
      "shared.job_offers",
      "shared.marketing_kpis",
      "shared.forum_categories",
      "shared.page_content",
      "shared.global_config",
      "alecia_colab.documents",
      "alecia_colab.presentations",
    ];
    let totalRows = 0;
    for (const table of tables) {
      const count = await pool.query(`SELECT count(*) FROM ${table}`);
      const n = parseInt(count.rows[0].count);
      totalRows += n;
      console.log(`  ${table.padEnd(35)} ${String(n).padStart(3)} rows`);
    }
    console.log(`  ${"TOTAL".padEnd(35)} ${String(totalRows).padStart(3)} rows`);

  } catch (err) {
    console.error("\n✗ Import error:", err);
    throw err;
  } finally {
    await pool.end();
  }

  console.log("\n══════════════════════════════════════════════════════════════");
  console.log("  Migration complete!");
  console.log("══════════════════════════════════════════════════════════════\n");
}

main();
