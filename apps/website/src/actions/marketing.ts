"use server";

// Marketing Website Public Actions
// Ported from convex/marketing.ts
// TODO: Migrate to Strapi CMS once deployed

import { db, shared, eq, and, desc, sql } from "@alepanel/db";

// ============================================
// TRANSACTIONS (Track Record)
// ============================================

interface Transaction {
  id: string;
  slug: string;
  sector: string;
  year: number;
  mandateType: string;
  region?: string;
  displayOrder: number;
  clientName: string;
  isCaseStudy?: boolean;
  context?: string;
  intervention?: string;
  result?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function getTransactions(args?: {
  sector?: string;
  year?: number;
  mandateType?: string;
  limit?: number;
}) {
  let query = db.select().from(shared.transactions);

  const conditions = [];
  if (args?.sector) {
    conditions.push(eq(shared.transactions.sector, args.sector));
  }
  if (args?.year) {
    conditions.push(eq(shared.transactions.year, args.year));
  }
  if (args?.mandateType) {
    conditions.push(eq(shared.transactions.mandateType, args.mandateType));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  query = query.orderBy(shared.transactions.displayOrder, desc(shared.transactions.year)) as any;

  if (args?.limit) {
    query = query.limit(args.limit) as any;
  }

  const result = await query;
  return result as unknown as Transaction[];
}

export async function getTransactionBySlug(slug: string) {
  const result = await db
    .select()
    .from(shared.transactions)
    .where(eq(shared.transactions.slug, slug))
    .limit(1);

  return result[0] as unknown as Transaction | undefined;
}

export async function getTransactionFilters() {
  const result = await db.execute(sql`
    SELECT
      ARRAY_AGG(DISTINCT sector ORDER BY sector) as sectors,
      ARRAY_AGG(DISTINCT year ORDER BY year DESC) as years,
      ARRAY_AGG(DISTINCT mandate_type ORDER BY mandate_type) as mandate_types,
      ARRAY_AGG(DISTINCT region ORDER BY region) FILTER (WHERE region IS NOT NULL) as regions
    FROM shared.transactions
  `);

  const row = result.rows[0] as {
    sectors: string[];
    years: number[];
    mandate_types: string[];
    regions: string[];
  };

  return {
    sectors: row.sectors || [],
    years: row.years || [],
    mandateTypes: row.mandate_types || [],
    regions: row.regions || [],
  };
}

// ============================================
// TEAM MEMBERS
// ============================================

export async function getTeamMembers(activeOnly = true) {
  const members = await db
    .select()
    .from(shared.teamMembers)
    .where(activeOnly ? eq(shared.teamMembers.isActive, true) : undefined)
    .orderBy(shared.teamMembers.displayOrder);

  return members;
}

export async function getTeamMemberBySlug(slug: string) {
  const members = await db
    .select()
    .from(shared.teamMembers)
    .where(eq(shared.teamMembers.slug, slug))
    .limit(1);

  return members[0];
}

// ============================================
// BLOG POSTS (delegated to blog.ts)
// ============================================

// ============================================
// JOB OFFERS (delegated to careers.ts)
// ============================================

// ============================================
// FORUM CATEGORIES (Public)
// ============================================

interface ForumCategory {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  order: number;
  createdAt: Date;
}

export async function getForumCategories(includePrivate = false) {
  let query = db.select().from(shared.forumCategories);

  if (!includePrivate) {
    query = query.where(eq(shared.forumCategories.isPrivate, false)) as any;
  }

  const result = await query.orderBy(shared.forumCategories.order);
  return result as unknown as ForumCategory[];
}

// ============================================
// GLOBAL CONFIG
// ============================================

export async function getConfig(key: string) {
  const result = await db
    .select({ value: shared.globalConfig.value })
    .from(shared.globalConfig)
    .where(eq(shared.globalConfig.key, key))
    .limit(1);

  if (result.length === 0) return null;
  return result[0].value;
}

export async function getAllConfig() {
  const result = await db
    .select({
      key: shared.globalConfig.key,
      value: shared.globalConfig.value,
    })
    .from(shared.globalConfig);

  const config: Record<string, unknown> = {};
  for (const row of result) {
    config[row.key] = row.value;
  }

  return config;
}

// ============================================
// MARKETING KPIS (Admin Configurable) - Board Requirement
// ============================================

export async function getMarketingKPIs(locale = "fr") {
  const kpis = await db
    .select()
    .from(shared.marketingKpis)
    .where(eq(shared.marketingKpis.isActive, true))
    .orderBy(shared.marketingKpis.displayOrder);

  return kpis.map((kpi) => ({
    ...kpi,
    label: locale === "en" ? kpi.labelEn : kpi.labelFr,
  }));
}

export async function getAllMarketingKPIs() {
  const result = await db
    .select()
    .from(shared.marketingKpis)
    .orderBy(shared.marketingKpis.displayOrder);

  return result;
}

export async function upsertMarketingKPI(data: {
  key: string;
  icon: string;
  value: number;
  suffix?: string;
  prefix?: string;
  labelFr: string;
  labelEn: string;
  displayOrder: number;
  isActive: boolean;
}) {
  const existing = await db
    .select({ id: shared.marketingKpis.id })
    .from(shared.marketingKpis)
    .where(eq(shared.marketingKpis.key, data.key))
    .limit(1);

  if (existing.length > 0) {
    const id = existing[0].id;
    await db
      .update(shared.marketingKpis)
      .set({
        icon: data.icon,
        value: String(data.value),
        suffix: data.suffix ?? null,
        prefix: data.prefix ?? null,
        labelFr: data.labelFr,
        labelEn: data.labelEn,
        displayOrder: data.displayOrder,
        isActive: data.isActive,
      })
      .where(eq(shared.marketingKpis.id, id));
    return id;
  } else {
    const [result] = await db
      .insert(shared.marketingKpis)
      .values({
        key: data.key,
        icon: data.icon,
        value: String(data.value),
        suffix: data.suffix ?? null,
        prefix: data.prefix ?? null,
        labelFr: data.labelFr,
        labelEn: data.labelEn,
        displayOrder: data.displayOrder,
        isActive: data.isActive,
      })
      .returning({ id: shared.marketingKpis.id });
    return result.id;
  }
}

export async function deleteMarketingKPI(key: string) {
  await db
    .delete(shared.marketingKpis)
    .where(eq(shared.marketingKpis.key, key));
}

// ============================================
// LOCATION IMAGES (Interactive Map) - Board Requirement
// ============================================

interface LocationImage {
  id: string;
  locationId: string;
  imageUrl: string;
  altText?: string;
  updatedAt?: Date;
}

export async function getLocationImages() {
  const result = await db.select().from(shared.locationImages);
  return result as unknown as LocationImage[];
}

export async function upsertLocationImage(data: {
  locationId: string;
  imageUrl: string;
  altText?: string;
}) {
  const existing = await db
    .select({ id: shared.locationImages.id })
    .from(shared.locationImages)
    .where(eq(shared.locationImages.locationId, data.locationId))
    .limit(1);

  const now = new Date();

  if (existing.length > 0) {
    const id = existing[0].id;
    await db
      .update(shared.locationImages)
      .set({
        imageUrl: data.imageUrl,
        altText: data.altText ?? null,
        updatedAt: now,
      })
      .where(eq(shared.locationImages.id, id));
    return id;
  } else {
    const [result] = await db
      .insert(shared.locationImages)
      .values({
        locationId: data.locationId,
        imageUrl: data.imageUrl,
        altText: data.altText ?? null,
        updatedAt: now,
      })
      .returning({ id: shared.locationImages.id });
    return result.id;
  }
}
