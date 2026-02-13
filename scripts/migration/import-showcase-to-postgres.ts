// scripts/migration/import-showcase-to-postgres.ts
// Imports showcase website data from Convex export JSON files into PostgreSQL
// Handles: team_members, blog_posts, forum_categories, job_offers
// Excludes deprecated fields: quote, education

import { Pool } from "pg";
import { readFileSync, existsSync } from "fs";
import { v4 as uuidv4 } from "uuid";

const pool = new Pool({
  host: process.env.PG_HOST || "localhost",
  port: 5432,
  database: "alecia",
  user: "alecia",
  password: process.env.POSTGRES_PASSWORD || "dev-password-change-me",
});

// ID mapping: Convex _id → PostgreSQL UUID
const idMap = new Map<string, string>();

function mapId(convexId: string): string {
  if (!idMap.has(convexId)) {
    idMap.set(convexId, uuidv4());
  }
  return idMap.get(convexId)!;
}

function loadJsonl(path: string): any[] {
  try {
    const content = readFileSync(path, "utf-8");
    return content
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));
  } catch (error) {
    console.warn(`  ⚠ File not found or error reading: ${path}`, error);
    return [];
  }
}

// Convert Convex timestamp (ms) to PostgreSQL timestamp
function convexTimestampToPg(timestamp: number): Date {
  return new Date(timestamp);
}

// ============================================================================
// Team Members
// ============================================================================
async function importTeamMembers() {
  const backupPath = "backups/convex_2026-01-22/extracted/team_members/documents.jsonl";
  const teamMembers = loadJsonl(backupPath);

  for (const tm of teamMembers) {
    const pgId = mapId(tm._id);

    // Skip deprecated fields: quote, passion (not in PostgreSQL schema)
    await pool.query(
      `INSERT INTO shared.team_members (
        id, slug, name, role, photo, photo_url, bio_fr, bio_en,
        linkedin_url, email, sectors_expertise, transaction_slugs,
        is_active, display_order, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        bio_fr = EXCLUDED.bio_fr,
        bio_en = EXCLUDED.bio_en,
        linkedin_url = EXCLUDED.linkedin_url,
        email = EXCLUDED.email,
        sectors_expertise = EXCLUDED.sectors_expertise,
        transaction_slugs = EXCLUDED.transaction_slugs,
        is_active = EXCLUDED.is_active,
        display_order = EXCLUDED.display_order,
        updated_at = NOW()`,
      [
        pgId,
        tm.slug,
        tm.name,
        tm.role,
        null, // photo - not in Convex data
        null, // photo_url - not in Convex data
        tm.bioFr || null,
        tm.bioEn || null,
        tm.linkedinUrl || null,
        tm.email || null,
        tm.sectorsExpertise || [],
        tm.transactionSlugs || [],
        tm.isActive !== undefined ? tm.isActive : true,
        tm.displayOrder || 0,
        convexTimestampToPg(tm._creationTime),
        convexTimestampToPg(tm._creationTime),
      ]
    );
  }
  console.log(`✓ Imported ${teamMembers.length} team members`);
}

// ============================================================================
// Blog Posts
// ============================================================================
async function importBlogPosts() {
  const backupPath = "backups/convex_2026-01-22/extracted/blog_posts/documents.jsonl";
  const blogPosts = loadJsonl(backupPath);

  for (const bp of blogPosts) {
    const pgId = mapId(bp._id);

    await pool.query(
      `INSERT INTO shared.blog_posts (
        id, status, author_id, title, slug, content, excerpt,
        featured_image, category, published_at, seo, tags, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        excerpt = EXCLUDED.excerpt,
        featured_image = EXCLUDED.featured_image,
        category = EXCLUDED.category,
        published_at = EXCLUDED.published_at,
        seo = EXCLUDED.seo,
        tags = EXCLUDED.tags`,
      [
        pgId,
        bp.status || "published",
        null, // author_id - not in Convex data
        bp.title,
        bp.slug,
        bp.content,
        bp.excerpt || null,
        bp.coverImage || null,
        bp.category || null,
        bp.publishedAt ? Math.floor(bp.publishedAt) : null,
        JSON.stringify({
          title: bp.seoTitle || null,
          description: bp.seoDescription || null,
        }),
        [], // tags - not in Convex data
        Math.floor(bp._creationTime),
      ]
    );
  }
  console.log(`✓ Imported ${blogPosts.length} blog posts`);
}

// ============================================================================
// Forum Categories
// ============================================================================
async function importForumCategories() {
  const backupPath = "backups/convex_2026-01-22/extracted/forum_categories/documents.jsonl";
  const forumCategories = loadJsonl(backupPath);

  for (const fc of forumCategories) {
    const pgId = mapId(fc._id);

    await pool.query(
      `INSERT INTO shared.forum_categories (
        id, name, description, is_private, "order", created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING`,
      [
        pgId,
        fc.name,
        fc.description || null,
        fc.isPrivate || false,
        fc.order || 0,
        convexTimestampToPg(fc._creationTime),
      ]
    );
  }
  console.log(`✓ Imported ${forumCategories.length} forum categories`);
}

// ============================================================================
// Job Offers
// ============================================================================
async function importJobOffers() {
  const backupPath = "backups/convex_2026-01-22/extracted/job_offers/documents.jsonl";
  const jobOffers = loadJsonl(backupPath);

  for (const jo of jobOffers) {
    const pgId = mapId(jo._id);

    await pool.query(
      `INSERT INTO shared.job_offers (
        id, slug, title, type, location, description, requirements,
        contact_email, pdf_url, is_published, display_order, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        type = EXCLUDED.type,
        location = EXCLUDED.location,
        description = EXCLUDED.description,
        requirements = EXCLUDED.requirements,
        contact_email = EXCLUDED.contact_email,
        pdf_url = EXCLUDED.pdf_url,
        is_published = EXCLUDED.is_published,
        display_order = EXCLUDED.display_order,
        updated_at = NOW()`,
      [
        pgId,
        jo.slug,
        jo.title,
        jo.type || null,
        jo.location || null,
        jo.description || null,
        jo.requirements || [],
        jo.contactEmail || null,
        jo.pdfUrl || null,
        jo.isPublished !== undefined ? jo.isPublished : false,
        jo.displayOrder || 0,
        convexTimestampToPg(jo._creationTime),
        convexTimestampToPg(jo._creationTime),
      ]
    );
  }
  console.log(`✓ Imported ${jobOffers.length} job offers`);
}

// ============================================================================
// Main
// ============================================================================
async function main() {
  console.log("=== Alecia Showcase Website Import to PostgreSQL ===\n");
  console.log("Excluding deprecated fields: quote, education\n");

  try {
    // Import in order (no FK dependencies between these tables)
    await importTeamMembers();
    await importBlogPosts();
    await importForumCategories();
    await importJobOffers();

    console.log("\n=== Showcase website import complete ===");
  } catch (error) {
    console.error("Error during import:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
