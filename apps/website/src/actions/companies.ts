/**
 * Company Management Server Actions
 *
 * Handles company CRUD operations with Pappers API enrichment
 * Supports French company data (SIREN, SIRET, NAF codes)
 */

"use server";

import { db, shared, eq, or, ilike, desc } from "@alepanel/db";
import { auth } from "@alepanel/auth";
import { revalidatePath } from "next/cache";

// ============================================
// TYPES
// ============================================

export interface CreateCompanyInput {
  name: string;
  siren?: string;
  siret?: string;
  nafCode?: string;
  vatNumber?: string;
  website?: string;
  logoUrl?: string;
  address?: {
    street: string;
    city: string;
    zip: string;
    country: string;
  };
  financials?: {
    revenue?: number;
    ebitda?: number;
    netDebt?: number;
    valuationAsk?: number;
    year?: number;
    currency?: string;
  };
  tags?: string[];
  source?: string;
}

export interface CompanyFilters {
  search?: string;
  tags?: string[];
  hasSiren?: boolean;
}

// ============================================
// AUTHENTICATION HELPER
// ============================================

async function getAuthenticatedUser() {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((mod) => mod.headers()),
  });

  if (!session?.user) {
    throw new Error("Unauthorized: Please sign in to continue");
  }

  return session.user;
}

// ============================================
// QUERIES
// ============================================

/**
 * Get all companies with optional filtering
 */
export async function getCompanies(filters?: CompanyFilters) {
  const user = await getAuthenticatedUser();

  const whereConditions = [];

  if (filters?.search) {
    whereConditions.push(
      or(
        ilike(shared.companies.name, `%${filters.search}%`),
        ilike(shared.companies.siren, `%${filters.search}%`),
        ilike(shared.companies.website, `%${filters.search}%`)
      )
    );
  }

  // TODO: Add tags filtering when we have proper array contains support
  // if (filters?.tags && filters.tags.length > 0) {
  //   whereConditions.push(arrayContains(shared.companies.tags, filters.tags));
  // }

  const companies = await db.query.companies.findMany({
    where: whereConditions.length > 0 ? or(...whereConditions) : undefined,
    orderBy: [desc(shared.companies.updatedAt)],
  });

  return companies;
}

/**
 * Get a single company by ID
 */
export async function getCompanyById(id: string) {
  const user = await getAuthenticatedUser();

  const company = await db.query.companies.findFirst({
    where: eq(shared.companies.id, id),
  });

  if (!company) {
    return null;
  }

  return company;
}

/**
 * Get a company by SIREN (French company identifier)
 */
export async function getCompanyBySiren(siren: string) {
  const user = await getAuthenticatedUser();

  const company = await db.query.companies.findFirst({
    where: eq(shared.companies.siren, siren),
  });

  return company;
}

/**
 * Create a new company
 */
export async function createCompany(data: CreateCompanyInput) {
  const user = await getAuthenticatedUser();

  const [company] = await db
    .insert(shared.companies)
    .values({
      name: data.name,
      siren: data.siren,
      siret: data.siret,
      nafCode: data.nafCode,
      vatNumber: data.vatNumber,
      website: data.website,
      logoUrl: data.logoUrl,
      address: data.address,
      financials: data.financials,
      tags: data.tags || [],
      source: data.source || "manual",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  revalidatePath("/companies");

  return company;
}

/**
 * Update an existing company
 */
export async function updateCompany(id: string, data: Partial<CreateCompanyInput>) {
  const user = await getAuthenticatedUser();

  const existingCompany = await db.query.companies.findFirst({
    where: eq(shared.companies.id, id),
  });

  if (!existingCompany) {
    throw new Error("Company not found");
  }

  const [updatedCompany] = await db
    .update(shared.companies)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(shared.companies.id, id))
    .returning();

  revalidatePath("/companies");
  revalidatePath(`/companies/${id}`);

  return updatedCompany;
}

/**
 * Delete a company
 */
export async function deleteCompany(id: string) {
  const user = await getAuthenticatedUser();

  // Check if company has associated deals
  const associatedDeals = await db.query.deals.findFirst({
    where: eq(shared.deals.companyId, id),
  });

  if (associatedDeals) {
    throw new Error(
      "Cannot delete company with associated deals. Please archive or reassign deals first."
    );
  }

  await db.delete(shared.companies).where(eq(shared.companies.id, id));

  revalidatePath("/companies");
}

/**
 * Enrich company data using Pappers API
 *
 * Pappers provides official French company data including:
 * - Legal information (SIREN, NAF, legal form)
 * - Financial data (revenue, employees)
 * - Company officers and beneficial owners
 * - Credit scores and risk indicators
 */
export async function enrichCompany(id: string) {
  const user = await getAuthenticatedUser();

  const company = await db.query.companies.findFirst({
    where: eq(shared.companies.id, id),
  });

  if (!company) {
    throw new Error("Company not found");
  }

  if (!company.siren) {
    throw new Error("Company must have a SIREN to enrich from Pappers");
  }

  // TODO: Implement Pappers API integration
  // 1. Call Pappers API with SIREN: GET https://api.pappers.fr/v2/entreprise?api_token=TOKEN&siren=SIREN
  // 2. Parse response and extract relevant data
  // 3. Update company record with enriched data
  //
  // Example response structure:
  // {
  //   "nom_entreprise": "ALECIA",
  //   "siren": "123456789",
  //   "siege": { "adresse_ligne_1": "...", "code_postal": "...", "ville": "..." },
  //   "finances": [{ "annee": 2023, "chiffre_affaires": 5000000 }],
  //   "representants": [{ "nom": "...", "prenom": "...", "qualite": "..." }],
  // }

  const PAPPERS_API_TOKEN = process.env.PAPPERS_API_TOKEN;

  if (!PAPPERS_API_TOKEN) {
    throw new Error("Pappers API token not configured");
  }

  try {
    const response = await fetch(
      `https://api.pappers.fr/v2/entreprise?api_token=${PAPPERS_API_TOKEN}&siren=${company.siren}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Pappers API error: ${response.statusText}`);
    }

    const pappersData = await response.json();

    // Extract address if available
    const address = pappersData.siege
      ? {
          street: pappersData.siege.adresse_ligne_1 || "",
          city: pappersData.siege.ville || "",
          zip: pappersData.siege.code_postal || "",
          country: "France",
        }
      : company.address;

    // Extract latest financial data
    const latestFinancials =
      pappersData.finances && pappersData.finances.length > 0
        ? pappersData.finances[0]
        : null;

    const financials = latestFinancials
      ? {
          revenue: latestFinancials.chiffre_affaires,
          year: latestFinancials.annee,
          currency: "EUR",
          ...(company.financials as object),
        }
      : company.financials;

    // Update company with enriched data
    const [enrichedCompany] = await db
      .update(shared.companies)
      .set({
        name: pappersData.nom_entreprise || company.name,
        siret: pappersData.siege?.siret || company.siret,
        nafCode: pappersData.code_naf || company.nafCode,
        vatNumber: pappersData.numero_tva_intracommunautaire || company.vatNumber,
        address,
        financials,
        pappersData: pappersData, // Store full response for reference
        source: "pappers",
        updatedAt: new Date(),
      })
      .where(eq(shared.companies.id, id))
      .returning();

    revalidatePath("/companies");
    revalidatePath(`/companies/${id}`);

    return enrichedCompany;
  } catch (error) {
    console.error("Pappers enrichment error:", error);
    throw new Error(
      `Failed to enrich company data: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Search companies by name or SIREN
 * Used for autocomplete and quick lookup
 */
export async function searchCompanies(query: string) {
  const user = await getAuthenticatedUser();

  if (!query || query.length < 2) {
    return [];
  }

  const companies = await db.query.companies.findMany({
    where: or(
      ilike(shared.companies.name, `%${query}%`),
      ilike(shared.companies.siren, `%${query}%`)
    ),
    columns: {
      id: true,
      name: true,
      siren: true,
      logoUrl: true,
      website: true,
    },
    limit: 10,
  });

  return companies;
}

/**
 * Get companies related to a user's deals (for relationship mapping)
 */
export async function getCompaniesForUser(userId: string) {
  const user = await getAuthenticatedUser();

  // Get all deals owned by this user
  const userDeals = await db.query.deals.findMany({
    where: eq(shared.deals.ownerId, userId),
    columns: {
      companyId: true,
    },
  });

  const companyIds = [
    ...new Set(userDeals.map((d) => d.companyId).filter(Boolean)),
  ] as string[];

  if (companyIds.length === 0) {
    return [];
  }

  // TODO: Add proper IN clause support
  // For now, we'll fetch all companies and filter in memory
  const allCompanies = await db.query.companies.findMany();
  const filteredCompanies = allCompanies.filter((c) => companyIds.includes(c.id));

  return filteredCompanies;
}
