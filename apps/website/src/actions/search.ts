/**
 * Global Search Server Actions
 *
 * Cross-entity search across deals, companies, contacts, documents, and more.
 * Ported from convex/search.ts — uses PostgreSQL ilike instead of in-memory filtering.
 */

"use server";

import { db, shared, ilike, or, desc, sql } from "@alepanel/db";
import { getAuthenticatedUser } from "./lib/auth";

// ============================================
// TYPES
// ============================================

export type SearchResultType =
  | "deal"
  | "company"
  | "contact"
  | "document"
  | "presentation"
  | "blog_post";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  description?: string;
  url?: string;
  score: number;
  metadata?: Record<string, unknown>;
}

// ============================================
// QUERIES
// ============================================

/**
 * Global search across all entities
 */
export async function globalSearch(args: {
  query: string;
  types?: SearchResultType[];
  limit?: number;
}): Promise<SearchResult[]> {
  const user = await getAuthenticatedUser();

  const searchQuery = args.query.toLowerCase().trim();
  if (!searchQuery || searchQuery.length < 2) return [];

  const limit = args.limit ?? 20;
  const searchTypes = args.types ?? [
    "deal",
    "company",
    "contact",
    "document",
    "presentation",
    "blog_post",
  ];

  const results: SearchResult[] = [];
  const pattern = `%${searchQuery}%`;

  // Search Deals
  if (searchTypes.includes("deal")) {
    const deals = await db.query.deals.findMany({
      where: or(
        ilike(shared.deals.title, pattern),
        ilike(shared.deals.description, pattern)
      ),
      limit: 20,
    });

    for (const deal of deals) {
      const titleMatch = deal.title?.toLowerCase().includes(searchQuery);
      results.push({
        id: deal.id,
        type: "deal",
        title: deal.title || "Untitled Deal",
        subtitle: deal.stage,
        description: deal.description?.slice(0, 150),
        score: titleMatch ? 100 : 60,
        metadata: {
          stage: deal.stage,
          amount: deal.amount,
          priority: deal.priority,
        },
      });
    }
  }

  // Search Companies
  if (searchTypes.includes("company")) {
    const companies = await db.query.companies.findMany({
      where: or(
        ilike(shared.companies.name, pattern),
        ilike(shared.companies.siren, pattern),
        ilike(shared.companies.website, pattern)
      ),
      limit: 20,
    });

    for (const company of companies) {
      const nameMatch = company.name?.toLowerCase().includes(searchQuery);
      const sirenMatch = company.siren?.toLowerCase().includes(searchQuery);
      results.push({
        id: company.id,
        type: "company",
        title: company.name || "Unnamed Company",
        subtitle: company.siren || undefined,
        score: nameMatch ? 100 : sirenMatch ? 70 : 50,
        metadata: {
          website: company.website,
          siren: company.siren,
        },
      });
    }
  }

  // Search Contacts
  if (searchTypes.includes("contact")) {
    const contacts = await db.query.contacts.findMany({
      where: or(
        ilike(shared.contacts.fullName, pattern),
        ilike(shared.contacts.email, pattern),
        ilike(shared.contacts.role, pattern)
      ),
      limit: 20,
    });

    for (const contact of contacts) {
      const nameMatch = contact.fullName?.toLowerCase().includes(searchQuery);
      const emailMatch = contact.email?.toLowerCase().includes(searchQuery);
      results.push({
        id: contact.id,
        type: "contact",
        title: contact.fullName || contact.email || "Unknown Contact",
        subtitle: contact.role || undefined,
        description: contact.email || undefined,
        score: nameMatch ? 100 : emailMatch ? 90 : 60,
        metadata: {
          email: contact.email,
          phone: contact.phone,
          role: contact.role,
        },
      });
    }
  }

  // Search Documents (colab)
  // TODO: Enable when colab schema documents table is available
  // if (searchTypes.includes("document")) { ... }

  // Search Blog Posts
  // TODO: Enable when blog_posts table is available in Drizzle schema
  // if (searchTypes.includes("blog_post")) { ... }

  // Sort by score and limit results
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

/**
 * Quick search for command palette / autocomplete
 * Returns minimal data for fast response
 */
export async function quickSearch(args: {
  query: string;
  limit?: number;
}): Promise<
  Array<{
    id: string;
    type: SearchResultType;
    title: string;
    subtitle?: string;
  }>
> {
  const user = await getAuthenticatedUser();

  const searchQuery = args.query.toLowerCase().trim();
  if (!searchQuery || searchQuery.length < 2) return [];

  const limit = args.limit ?? 10;
  const pattern = `%${searchQuery}%`;

  const results: Array<{
    id: string;
    type: SearchResultType;
    title: string;
    subtitle?: string;
    score: number;
  }> = [];

  // Quick search deals
  const deals = await db.query.deals.findMany({
    where: ilike(shared.deals.title, pattern),
    columns: { id: true, title: true, stage: true },
    limit: 10,
  });
  for (const deal of deals) {
    results.push({
      id: deal.id,
      type: "deal",
      title: deal.title || "Untitled",
      subtitle: deal.stage || undefined,
      score: 100,
    });
  }

  // Quick search companies
  const companies = await db.query.companies.findMany({
    where: ilike(shared.companies.name, pattern),
    columns: { id: true, name: true, siren: true },
    limit: 10,
  });
  for (const company of companies) {
    results.push({
      id: company.id,
      type: "company",
      title: company.name || "Unnamed",
      subtitle: company.siren || undefined,
      score: 90,
    });
  }

  // Quick search contacts
  const contacts = await db.query.contacts.findMany({
    where: or(
      ilike(shared.contacts.fullName, pattern),
      ilike(shared.contacts.email, pattern)
    ),
    columns: { id: true, fullName: true, email: true, role: true },
    limit: 10,
  });
  for (const contact of contacts) {
    results.push({
      id: contact.id,
      type: "contact",
      title: contact.fullName || contact.email || "Unknown",
      subtitle: contact.role || undefined,
      score: 85,
    });
  }

  // Sort and return without score
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit).map(({ score: _score, ...rest }) => rest);
}

/**
 * Get recent items for dashboard/quick access
 */
export async function getRecentItems(args?: {
  limit?: number;
}): Promise<
  Array<{
    id: string;
    type: SearchResultType;
    title: string;
    subtitle?: string;
    updatedAt: string;
  }>
> {
  const user = await getAuthenticatedUser();
  const limit = args?.limit ?? 10;
  const perType = Math.ceil(limit / 3);

  const results: Array<{
    id: string;
    type: SearchResultType;
    title: string;
    subtitle?: string;
    updatedAt: string;
  }> = [];

  // Recent deals
  const deals = await db.query.deals.findMany({
    orderBy: [desc(shared.deals.updatedAt)],
    columns: { id: true, title: true, stage: true, updatedAt: true },
    limit: perType,
  });
  for (const deal of deals) {
    results.push({
      id: deal.id,
      type: "deal",
      title: deal.title || "Untitled",
      subtitle: deal.stage || undefined,
      updatedAt: deal.updatedAt?.toISOString() || new Date().toISOString(),
    });
  }

  // Recent companies
  const companies = await db.query.companies.findMany({
    orderBy: [desc(shared.companies.updatedAt)],
    columns: { id: true, name: true, siren: true, updatedAt: true },
    limit: perType,
  });
  for (const company of companies) {
    results.push({
      id: company.id,
      type: "company",
      title: company.name || "Unnamed",
      subtitle: company.siren || undefined,
      updatedAt: company.updatedAt?.toISOString() || new Date().toISOString(),
    });
  }

  // Sort by updatedAt descending and limit
  results.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  return results.slice(0, limit);
}
