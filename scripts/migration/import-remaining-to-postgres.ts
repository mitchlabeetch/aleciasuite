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

// Load existing ID map from CRM import
const idMapRaw = JSON.parse(readFileSync("scripts/migration/data/id-map.json", "utf-8"));
const idMap = new Map<string, string>(Object.entries(idMapRaw));

function mapId(convexId: string): string {
  if (!idMap.has(convexId)) {
    idMap.set(convexId, uuidv4());
  }
  return idMap.get(convexId)!;
}

function loadJson(dir: string, file: string): any[] {
  try {
    return JSON.parse(readFileSync(`scripts/migration/data/${dir}/${file}.json`, "utf-8"));
  } catch {
    console.warn(`  ⚠ File not found: ${dir}/${file}.json`);
    return [];
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Phase 1: shared schema (no complex FKs)
// ────────────────────────────────────────────────────────────────────────────

// team_members — no FK deps
async function importTeamMembers() {
  const items = loadJson("cms", "team_members");
  for (const t of items) {
    const pgId = mapId(t._id);
    await pool.query(
      `INSERT INTO shared.team_members (id, slug, name, role, photo, photo_url, bio_fr, bio_en, linkedin_url, email, sectors_expertise, transaction_slugs, is_active, display_order, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        t.slug || t._id,
        t.name,
        t.role || "",
        t.photo,
        t.photoUrl,
        t.bioFr,
        t.bioEn,
        t.linkedinUrl,
        t.email,
        t.sectorsExpertise || [],
        t.transactionSlugs || [],
        t.isActive !== false,
        t.displayOrder || 0,
        new Date(t._creationTime),
      ]
    );
  }
  console.log(`Imported ${items.length} team_members`);
}

// job_offers — no FK deps
async function importJobOffers() {
  const items = loadJson("cms", "job_offers");
  for (const j of items) {
    const pgId = mapId(j._id);
    await pool.query(
      `INSERT INTO shared.job_offers (id, slug, title, type, location, description, requirements, contact_email, pdf_url, is_published, display_order, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        j.slug || j._id,
        j.title,
        j.type || "CDI",
        j.location || "Paris",
        j.description || "",
        j.requirements,
        j.contactEmail,
        j.pdfUrl,
        j.isPublished !== false,
        j.displayOrder || 0,
        new Date(j._creationTime),
      ]
    );
  }
  console.log(`Imported ${items.length} job_offers`);
}

// marketing_kpis — no FK deps
async function importMarketingKpis() {
  const items = loadJson("cms", "marketing_kpis");
  for (const k of items) {
    const pgId = mapId(k._id);
    await pool.query(
      `INSERT INTO shared.marketing_kpis (id, key, icon, value, suffix, prefix, label_fr, label_en, display_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        k.key || k._id,
        k.icon || "📊",
        k.value || "0",
        k.suffix,
        k.prefix,
        k.labelFr || k.label || "",
        k.labelEn || k.label || "",
        k.displayOrder || 0,
        k.isActive !== false,
      ]
    );
  }
  console.log(`Imported ${items.length} marketing_kpis`);
}

// blog_posts — FK: author_id → users (nullable)
async function importBlogPosts() {
  const items = loadJson("cms", "blog_posts");
  for (const b of items) {
    const pgId = mapId(b._id);
    const authorId = b.authorId ? mapId(b.authorId) : null;
    await pool.query(
      `INSERT INTO shared.blog_posts (id, status, author_id, title, slug, content, excerpt, featured_image, category, published_at, seo, tags, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        b.status || "draft",
        authorId,
        b.title || "Untitled",
        b.slug || b._id,
        b.content || "",
        b.excerpt,
        b.featuredImage,
        b.category,
        b.publishedAt,
        JSON.stringify(b.seo || {}),
        b.tags || [],
        b._creationTime,
      ]
    );
  }
  console.log(`Imported ${items.length} blog_posts`);
}

// transactions — FK: deal_id → deals (nullable)
async function importTransactions() {
  const items = loadJson("cms", "transactions");
  for (const t of items) {
    const pgId = mapId(t._id);
    const dealId = t.dealId ? mapId(t.dealId) : null;
    await pool.query(
      `INSERT INTO shared.transactions (id, slug, client_name, client_logo, acquirer_name, acquirer_logo, sector, region, year, mandate_type, description, is_confidential, is_client_confidential, is_acquirer_confidential, is_prior_experience, context, intervention, result, testimonial_text, testimonial_author, role_type, deal_size, deal_id, key_metrics, display_order, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        t.slug || t._id,
        t.clientName || "N/A",
        t.clientLogo,
        t.acquirerName,
        t.acquirerLogo,
        t.sector || "Other",
        t.region,
        t.year || new Date(t._creationTime).getFullYear(),
        t.mandateType || "sell_side",
        t.description,
        t.isConfidential || false,
        t.isClientConfidential || false,
        t.isAcquirerConfidential || false,
        t.isPriorExperience || false,
        t.context,
        t.intervention,
        t.result,
        t.testimonialText,
        t.testimonialAuthor,
        t.roleType,
        t.dealSize,
        dealId,
        JSON.stringify(t.keyMetrics || {}),
        t.displayOrder || 0,
        new Date(t._creationTime),
      ]
    );
  }
  console.log(`Imported ${items.length} transactions`);
}

// notifications — FK: recipient_id → users, trigger_id → users
async function importNotifications() {
  const items = loadJson("user", "notifications");
  for (const n of items) {
    const pgId = mapId(n._id);
    const recipientId = n.recipientId ? mapId(n.recipientId) : null;
    const triggerId = n.triggerId ? mapId(n.triggerId) : null;
    if (!recipientId) continue;
    await pool.query(
      `INSERT INTO shared.notifications (id, recipient_id, trigger_id, type, entity_type, entity_id, is_read, payload, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        recipientId,
        triggerId,
        n.type || "general",
        n.entityType || "deal",
        n.entityId || "",
        n.isRead || false,
        JSON.stringify(n.payload || {}),
        new Date(n._creationTime),
      ]
    );
  }
  console.log(`Imported ${items.length} notifications`);
}

// user_preferences — FK: user_id → users
async function importUserPreferences() {
  const items = loadJson("user", "user_preferences");
  for (const p of items) {
    const pgId = mapId(p._id);
    const userId = p.userId ? mapId(p.userId) : null;
    if (!userId) continue;
    await pool.query(
      `INSERT INTO shared.user_preferences (id, user_id, theme, accent_color, sidebar_collapsed, compact_mode, notifications, locale, timezone, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        userId,
        p.theme || "system",
        p.accentColor,
        p.sidebarCollapsed || false,
        p.compactMode || false,
        JSON.stringify(p.notifications || {}),
        p.locale || "fr",
        p.timezone || "Europe/Paris",
        new Date(p._creationTime),
      ]
    );
  }
  console.log(`Imported ${items.length} user_preferences`);
}

// feature_flags — FK: created_by → users
async function importFeatureFlags() {
  const items = loadJson("security", "feature_flags");
  for (const f of items) {
    const pgId = mapId(f._id);
    const createdBy = f.createdBy ? mapId(f.createdBy) : null;
    if (!createdBy) continue;
    await pool.query(
      `INSERT INTO shared.feature_flags (id, key, name, description, enabled, rollout_strategy, rollout_percentage, allowed_user_ids, allowed_roles, category, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        f.key,
        f.name || f.key,
        f.description,
        f.enabled || false,
        f.rolloutStrategy || "manual",
        f.rolloutPercentage,
        f.allowedUserIds || [],
        f.allowedRoles || [],
        f.category,
        createdBy,
        new Date(f._creationTime),
      ]
    );
  }
  console.log(`Imported ${items.length} feature_flags`);
}

// calendar_events — FK: owner_id → users, deal_id → deals, company_id → companies
async function importCalendarEvents() {
  const items = loadJson("calendar", "calendar_events");
  for (const e of items) {
    const pgId = mapId(e._id);
    const ownerId = e.ownerId ? mapId(e.ownerId) : null;
    const dealId = e.dealId ? mapId(e.dealId) : null;
    const companyId = e.companyId ? mapId(e.companyId) : null;
    if (!ownerId) continue;
    await pool.query(
      `INSERT INTO shared.calendar_events (id, external_id, title, description, start_date_time, end_date_time, is_all_day, location, source, owner_id, deal_id, company_id, organizer, attendees, is_online_meeting, online_meeting_url, status, last_synced_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        e.externalId || e._id,
        e.title || "Event",
        e.description,
        e.startDateTime || e._creationTime,
        e.endDateTime || e._creationTime,
        e.isAllDay || false,
        e.location,
        e.source || "manual",
        ownerId,
        dealId,
        companyId,
        JSON.stringify(e.organizer || null),
        JSON.stringify(e.attendees || []),
        e.isOnlineMeeting || false,
        e.onlineMeetingUrl,
        e.status,
        e.lastSyncedAt || e._creationTime,
        e._creationTime,
        e.updatedAt || e._creationTime,
      ]
    );
  }
  console.log(`Imported ${items.length} calendar_events`);
}

// ────────────────────────────────────────────────────────────────────────────
// Phase 2: alecia_bi schema
// ────────────────────────────────────────────────────────────────────────────

// buyer_criteria — FK: deal_id → deals
async function importBuyerCriteria() {
  const items = loadJson("bi", "buyer_criteria");
  for (const b of items) {
    const pgId = mapId(b._id);
    const dealId = b.dealId ? mapId(b.dealId) : null;
    await pool.query(
      `INSERT INTO alecia_bi.buyer_criteria (id, deal_id, criteria_type, description, weight, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        dealId,
        b.criteriaType,
        b.description,
        b.weight,
        new Date(b._creationTime),
      ]
    );
  }
  console.log(`Imported ${items.length} buyer_criteria`);
}

// research_tasks — FK: deal_id → deals, assigned_to → users
async function importResearchTasks() {
  const items = loadJson("bi", "research_tasks");
  for (const r of items) {
    const pgId = mapId(r._id);
    const dealId = r.dealId ? mapId(r.dealId) : null;
    const assignedTo = r.assignedTo ? mapId(r.assignedTo) : null;
    await pool.query(
      `INSERT INTO alecia_bi.research_tasks (id, deal_id, assigned_to, title, description, status, due_date, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        dealId,
        assignedTo,
        r.title,
        r.description,
        r.status || "pending",
        r.dueDate ? new Date(r.dueDate) : null,
        new Date(r._creationTime),
      ]
    );
  }
  console.log(`Imported ${items.length} research_tasks`);
}

// approval_templates — FK: created_by → users
async function importApprovalTemplates() {
  const items = loadJson("bi", "approval_templates");
  for (const t of items) {
    const pgId = mapId(t._id);
    const createdBy = t.createdBy ? mapId(t.createdBy) : null;
    if (!createdBy) continue;
    await pool.query(
      `INSERT INTO alecia_bi.approval_templates (id, name, description, entity_type, approval_type, required_approvals, default_reviewers, auto_assign_rules, is_default, is_active, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        t.name || "Unnamed",
        t.description,
        t.entityType || "deal",
        t.approvalType || "any",
        t.requiredApprovals || 1,
        JSON.stringify(t.defaultReviewers || []),
        JSON.stringify(t.autoAssignRules || null),
        t.isDefault || false,
        t.isActive !== false,
        createdBy,
        new Date(t._creationTime),
      ]
    );
  }
  console.log(`Imported ${items.length} approval_templates`);
}

// approval_requests — FK: requested_by → users, deal_id → deals
async function importApprovalRequests() {
  const items = loadJson("bi", "approval_requests");
  for (const a of items) {
    const pgId = mapId(a._id);
    const requestedBy = a.requestedBy ? mapId(a.requestedBy) : null;
    const dealId = a.dealId ? mapId(a.dealId) : null;
    if (!requestedBy) continue;
    await pool.query(
      `INSERT INTO alecia_bi.approval_requests (id, entity_type, entity_id, title, description, requested_by, deal_id, approval_type, required_approvals, status, priority, due_date, current_step, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        a.entityType || "deal",
        mapId(a.entityId || a._id),
        a.title || "Approval",
        a.description,
        requestedBy,
        dealId,
        a.approvalType || "any",
        a.requiredApprovals || 1,
        a.status || "pending",
        a.priority || "medium",
        a.dueDate ? new Date(a.dueDate) : null,
        a.currentStep || 1,
        JSON.stringify(a.metadata || {}),
        new Date(a._creationTime),
      ]
    );
  }
  console.log(`Imported ${items.length} approval_requests`);
}

// approval_reviews — FK: request_id → approval_requests, reviewer_id → users
async function importApprovalReviews() {
  const items = loadJson("bi", "approval_reviews");
  for (const r of items) {
    const pgId = mapId(r._id);
    const requestId = r.requestId ? mapId(r.requestId) : null;
    const reviewerId = r.reviewerId ? mapId(r.reviewerId) : null;
    if (!requestId || !reviewerId) continue;
    await pool.query(
      `INSERT INTO alecia_bi.approval_reviews (id, request_id, reviewer_id, step, decision, comment, decided_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        requestId,
        reviewerId,
        r.step || 1,
        r.decision || "pending",
        r.comment,
        r.decidedAt ? new Date(r.decidedAt) : null,
        new Date(r._creationTime),
      ]
    );
  }
  console.log(`Imported ${items.length} approval_reviews`);
}

// ────────────────────────────────────────────────────────────────────────────
// Phase 3: alecia_numbers schema
// ────────────────────────────────────────────────────────────────────────────

// financial_models — FK: deal_id → deals, created_by → users
async function importFinancialModels() {
  const items = loadJson("numbers", "financial_models");
  for (const f of items) {
    const pgId = mapId(f._id);
    const dealId = f.dealId ? mapId(f.dealId) : null;
    const createdBy = f.createdBy ? mapId(f.createdBy) : null;
    await pool.query(
      `INSERT INTO alecia_numbers.financial_models (id, deal_id, name, model_type, assumptions, results, version, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        dealId,
        f.name,
        f.modelType,
        JSON.stringify(f.assumptions || null),
        JSON.stringify(f.results || null),
        f.version || 1,
        createdBy,
        new Date(f._creationTime),
      ]
    );
  }
  console.log(`Imported ${items.length} financial_models`);
}

// valuations — FK: deal_id → deals, created_by → users
async function importValuations() {
  const items = loadJson("numbers", "valuations");
  for (const v of items) {
    const pgId = mapId(v._id);
    const dealId = v.dealId ? mapId(v.dealId) : null;
    const createdBy = v.createdBy ? mapId(v.createdBy) : null;
    await pool.query(
      `INSERT INTO alecia_numbers.valuations (id, deal_id, method, enterprise_value, equity_value, parameters, notes, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        dealId,
        v.method,
        v.enterpriseValue,
        v.equityValue,
        JSON.stringify(v.parameters || null),
        v.notes,
        createdBy,
        new Date(v._creationTime),
      ]
    );
  }
  console.log(`Imported ${items.length} valuations`);
}

// comparables — FK: deal_id → deals
async function importComparables() {
  const items = loadJson("numbers", "comparables");
  for (const c of items) {
    const pgId = mapId(c._id);
    const dealId = c.dealId ? mapId(c.dealId) : null;
    await pool.query(
      `INSERT INTO alecia_numbers.comparables (id, deal_id, company_name, siren, sector, revenue, ebitda, ev_ebitda, ev_revenue, source, data_year, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        dealId,
        c.companyName,
        c.siren,
        c.sector,
        c.revenue,
        c.ebitda,
        c.evEbitda,
        c.evRevenue,
        c.source,
        c.dataYear,
        new Date(c._creationTime),
      ]
    );
  }
  console.log(`Imported ${items.length} comparables`);
}

// dd_checklists — FK: deal_id → deals, assigned_to → users
async function importDdChecklists() {
  const items = loadJson("numbers", "dd_checklists");
  for (const d of items) {
    const pgId = mapId(d._id);
    const dealId = d.dealId ? mapId(d.dealId) : null;
    const assignedTo = d.assignedTo ? mapId(d.assignedTo) : null;
    await pool.query(
      `INSERT INTO alecia_numbers.dd_checklists (id, deal_id, name, category, status, progress_pct, assigned_to, due_date, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        dealId,
        d.name,
        d.category,
        d.status || "not_started",
        d.progressPct || 0,
        assignedTo,
        d.dueDate ? new Date(d.dueDate) : null,
        new Date(d._creationTime),
      ]
    );
  }
  console.log(`Imported ${items.length} dd_checklists`);
}

// fee_calculations — FK: deal_id → deals, created_by → users
async function importFeeCalculations() {
  const items = loadJson("numbers", "fee_calculations");
  for (const f of items) {
    const pgId = mapId(f._id);
    const dealId = f.dealId ? mapId(f.dealId) : null;
    const createdBy = f.createdBy ? mapId(f.createdBy) : null;
    await pool.query(
      `INSERT INTO alecia_numbers.fee_calculations (id, deal_id, mandate_type, retainer_monthly, success_fee_pct, min_fee, deal_value, calculated_fee, notes, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        dealId,
        f.mandateType,
        f.retainerMonthly,
        f.successFeePct,
        f.minFee,
        f.dealValue,
        f.calculatedFee,
        f.notes,
        createdBy,
        new Date(f._creationTime),
      ]
    );
  }
  console.log(`Imported ${items.length} fee_calculations`);
}

// timelines — FK: deal_id → deals
async function importTimelines() {
  const items = loadJson("numbers", "timelines");
  for (const t of items) {
    const pgId = mapId(t._id);
    const dealId = t.dealId ? mapId(t.dealId) : null;
    await pool.query(
      `INSERT INTO alecia_numbers.timelines (id, deal_id, name, milestones, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        dealId,
        t.name,
        JSON.stringify(t.milestones || null),
        new Date(t._creationTime),
      ]
    );
  }
  console.log(`Imported ${items.length} timelines`);
}

// teaser_tracking — FK: deal_id → deals
async function importTeaserTracking() {
  const items = loadJson("numbers", "teaser_tracking");
  for (const t of items) {
    const pgId = mapId(t._id);
    const dealId = t.dealId ? mapId(t.dealId) : null;
    await pool.query(
      `INSERT INTO alecia_numbers.teaser_tracking (id, deal_id, recipient_company, recipient_contact, sent_at, opened_at, nda_signed_at, im_sent_at, status, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        dealId,
        t.recipientCompany,
        t.recipientContact,
        t.sentAt ? new Date(t.sentAt) : null,
        t.openedAt ? new Date(t.openedAt) : null,
        t.ndaSignedAt ? new Date(t.ndaSignedAt) : null,
        t.imSentAt ? new Date(t.imSentAt) : null,
        t.status,
        t.notes,
        new Date(t._creationTime),
      ]
    );
  }
  console.log(`Imported ${items.length} teaser_tracking`);
}

// spreadsheets — FK: deal_id → deals, owner_id → users
async function importSpreadsheets() {
  const items = loadJson("numbers", "spreadsheets");
  for (const s of items) {
    const pgId = mapId(s._id);
    const dealId = s.dealId ? mapId(s.dealId) : null;
    const ownerId = s.ownerId ? mapId(s.ownerId) : null;
    await pool.query(
      `INSERT INTO alecia_numbers.spreadsheets (id, deal_id, title, sheet_data, owner_id, is_template, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        dealId,
        s.title || "Untitled",
        JSON.stringify(s.sheetData || null),
        ownerId,
        s.isTemplate || false,
        new Date(s._creationTime),
      ]
    );
  }
  console.log(`Imported ${items.length} spreadsheets`);
}

// post_deal_integration — FK: deal_id → deals, owner_id → users
async function importPostDealIntegration() {
  const items = loadJson("numbers", "post_deal");
  for (const p of items) {
    const pgId = mapId(p._id);
    const dealId = p.dealId ? mapId(p.dealId) : null;
    const ownerId = p.ownerId ? mapId(p.ownerId) : null;
    await pool.query(
      `INSERT INTO alecia_numbers.post_deal_integration (id, deal_id, workstream, owner_id, tasks, status, start_date, end_date, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING`,
      [
        pgId,
        dealId,
        p.workstream,
        ownerId,
        JSON.stringify(p.tasks || null),
        p.status || "planning",
        p.startDate ? new Date(p.startDate) : null,
        p.endDate ? new Date(p.endDate) : null,
        new Date(p._creationTime),
      ]
    );
  }
  console.log(`Imported ${items.length} post_deal_integration`);
}

// ────────────────────────────────────────────────────────────────────────────
// Main execution
// ────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Alecia Remaining Data Import to PostgreSQL ===\n");
  console.log("Loading ID map from CRM import...");
  console.log(`  → ${idMap.size} existing mappings loaded\n`);

  // Phase 1: shared schema
  console.log("── Phase 1: shared schema ──");
  await importTeamMembers();
  await importJobOffers();
  await importMarketingKpis();
  await importBlogPosts();
  await importTransactions();
  await importNotifications();
  await importUserPreferences();
  await importFeatureFlags();
  await importCalendarEvents();

  // Phase 2: alecia_bi schema
  console.log("\n── Phase 2: alecia_bi schema ──");
  await importBuyerCriteria();
  await importResearchTasks();
  await importApprovalTemplates();
  await importApprovalRequests();
  await importApprovalReviews();

  // Phase 3: alecia_numbers schema
  console.log("\n── Phase 3: alecia_numbers schema ──");
  await importFinancialModels();
  await importValuations();
  await importComparables();
  await importDdChecklists();
  await importFeeCalculations();
  await importTimelines();
  await importTeaserTracking();
  await importSpreadsheets();
  await importPostDealIntegration();

  // Save updated ID map
  writeFileSync(
    "scripts/migration/data/id-map.json",
    JSON.stringify(Object.fromEntries(idMap), null, 2)
  );
  console.log(`\nID map updated: ${idMap.size} total mappings`);

  console.log("\n=== Remaining data import complete ===");
  await pool.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
