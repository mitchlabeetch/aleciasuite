// apps/website/src/lib/db.ts
// Server-side database utilities for BI/CRM admin pages
// Replaces Convex useQuery() calls with PostgreSQL/Drizzle queries

import { db, shared, eq, desc, and, ilike, sql } from "@alepanel/db";

// --- Deals ---

export async function getDeals(filters?: {
  stage?: string;
  ownerId?: string;
}) {
  return db
    .select()
    .from(shared.deals)
    .leftJoin(
      shared.companies,
      eq(shared.deals.companyId, shared.companies.id)
    )
    .leftJoin(shared.users, eq(shared.deals.ownerId, shared.users.id))
    .where(
      and(
        filters?.stage
          ? eq(shared.deals.stage, filters.stage as any)
          : undefined,
        filters?.ownerId
          ? eq(shared.deals.ownerId, filters.ownerId)
          : undefined,
        eq(shared.deals.isArchived, false)
      )
    )
    .orderBy(desc(shared.deals.createdAt));
}

export async function getDealById(dealId: string) {
  const result = await db
    .select()
    .from(shared.deals)
    .leftJoin(
      shared.companies,
      eq(shared.deals.companyId, shared.companies.id)
    )
    .leftJoin(shared.users, eq(shared.deals.ownerId, shared.users.id))
    .where(eq(shared.deals.id, dealId))
    .limit(1);
  return result[0] || null;
}

// --- Companies ---

export async function searchCompanies(query: string) {
  return db
    .select()
    .from(shared.companies)
    .where(ilike(shared.companies.name, `%${query}%`))
    .limit(20);
}

export async function getCompanyById(companyId: string) {
  const result = await db
    .select()
    .from(shared.companies)
    .where(eq(shared.companies.id, companyId))
    .limit(1);
  return result[0] || null;
}

// --- Pipeline Analytics ---

export async function getPipelineStats() {
  return db
    .select({
      stage: shared.deals.stage,
      count: sql<number>`count(*)`,
      totalAmount: sql<number>`sum(${shared.deals.amount})`,
    })
    .from(shared.deals)
    .where(eq(shared.deals.isArchived, false))
    .groupBy(shared.deals.stage);
}

// --- Contacts ---

export async function getContactsByCompany(companyId: string) {
  return db
    .select()
    .from(shared.contacts)
    .where(eq(shared.contacts.companyId, companyId))
    .orderBy(shared.contacts.fullName);
}
