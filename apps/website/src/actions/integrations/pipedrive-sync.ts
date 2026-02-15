"use server";

/**
 * Pipedrive Integration - Server Actions
 * Ported from convex/pipedrive_db.ts
 *
 * Features:
 * - Bidirectional deal/contact sync
 * - Token storage in BetterAuth account table
 * - Company and contact upserts
 */

import { db, shared, eq, sql } from "@alepanel/db";
import { getAuthenticatedUser } from "../lib/auth";
import { revalidatePath } from "next/cache";
import { 
  createPipedriveClient
} from "@alepanel/integrations";

// ============================================
// TOKEN HELPERS
// ============================================

async function getPipedriveTokens() {
  const user = await getAuthenticatedUser();

  // Query the account table for Pipedrive tokens
  // Note: The account table is in the shared schema (BetterAuth)
  const result = await db.execute(sql`
    SELECT access_token, refresh_token, access_token_expires_at
    FROM shared.account
    WHERE user_id = ${user.id} AND provider_id = 'pipedrive'
    LIMIT 1
  `);

  if (result.rows.length === 0) {
    return null;
  }

  return {
    accessToken: result.rows[0].access_token as string,
    refreshToken: result.rows[0].refresh_token as string,
    expiresAt: new Date(result.rows[0].access_token_expires_at as string),
  };
}

async function getPipedriveAccessToken() {
  const tokens = await getPipedriveTokens();

  if (!tokens) {
    throw new Error("Not connected to Pipedrive. Please authenticate first.");
  }

  // Check if token needs refresh (with 60 second buffer)
  if (tokens.expiresAt < new Date(Date.now() + 60000)) {
    if (!tokens.refreshToken) {
      throw new Error("Pipedrive session expired. Please reconnect.");
    }

    // Refresh the token
    const config = {
      clientId: process.env.PIPEDRIVE_CLIENT_ID,
      clientSecret: process.env.PIPEDRIVE_CLIENT_SECRET,
    };

    if (!config.clientId || !config.clientSecret) {
      throw new Error("Pipedrive OAuth credentials are not configured");
    }

    const user = await getAuthenticatedUser();

    const response = await fetch("https://oauth.pipedrive.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        refresh_token: tokens.refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh Pipedrive token. Please reconnect.");
    }

    const newTokens = await response.json();

    // Update tokens in account table
    await db.execute(sql`
      UPDATE shared.account
      SET access_token = ${newTokens.access_token},
          refresh_token = COALESCE(${newTokens.refresh_token}, refresh_token),
          access_token_expires_at = ${new Date(Date.now() + (newTokens.expires_in || 3600) * 1000)},
          updated_at = NOW()
      WHERE user_id = ${user.id} AND provider_id = 'pipedrive'
    `);

    return newTokens.access_token;
  }

  return tokens.accessToken;
}

// ============================================
// OAUTH FLOW
// ============================================

/**
 * Check if Pipedrive is connected for the current user
 */
export async function isPipedriveConnected() {
  try {
    // Check the new oauth_tokens table first
    const result = await db.execute(sql`
      SELECT 1 FROM shared.oauth_tokens WHERE provider = 'pipedrive'
      LIMIT 1
    `);
    
    if (result.rows.length > 0) {
      return true;
    }
    
    // Fallback: check the BetterAuth account table for backward compatibility
    const tokens = await getPipedriveTokens();
    return tokens !== null;
  } catch {
    return false;
  }
}

/**
 * Get Pipedrive OAuth authorization URL
 */
export async function getPipedriveAuthUrl() {
  const clientId = process.env.PIPEDRIVE_CLIENT_ID;
  if (!clientId) {
    throw new Error("Pipedrive OAuth is not configured");
  }

  // Use the new OAuth route that stores tokens in oauth_tokens table
  return "/api/integrations/pipedrive/authorize";
}

/**
 * Exchange authorization code for access token
 * Stores tokens in BetterAuth account table
 */
export async function exchangePipedriveCode(code: string): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthenticatedUser();
  const clientId = process.env.PIPEDRIVE_CLIENT_ID;
  const clientSecret = process.env.PIPEDRIVE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return { success: false, error: "Pipedrive OAuth credentials are not configured" };
  }

  const redirectUri =
    (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000") +
    "/api/auth/pipedrive/callback";

  try {
    const response = await fetch("https://oauth.pipedrive.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error_description || `Token exchange failed (${response.status})`,
      };
    }

    const tokens = await response.json();

    if (!tokens.access_token) {
      return { success: false, error: "Invalid OAuth response from Pipedrive" };
    }

    // Store tokens in BetterAuth account table
    await db.execute(sql`
      INSERT INTO shared.account (
        id, user_id, provider_id, account_id,
        access_token, refresh_token, access_token_expires_at,
        created_at, updated_at
      ) VALUES (
        gen_random_uuid(), ${user.id}, 'pipedrive', 'pipedrive_crm',
        ${tokens.access_token},
        ${tokens.refresh_token || null},
        ${new Date(Date.now() + (tokens.expires_in || 3600) * 1000)},
        NOW(), NOW()
      )
      ON CONFLICT (provider_id, account_id)
      DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = COALESCE(EXCLUDED.refresh_token, shared.account.refresh_token),
        access_token_expires_at = EXCLUDED.access_token_expires_at,
        updated_at = NOW()
    `);

    revalidatePath("/admin/settings/integrations");
    return { success: true };
  } catch (err) {
    console.error("[Pipedrive] Token exchange error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Token exchange failed",
    };
  }
}

// ============================================
// SYNC ACTIONS
// ============================================

/**
 * Upsert company from Pipedrive data
 */
export async function upsertCompanyFromPipedrive(args: {
  pipedriveId: number;
  name: string;
  address?: string;
}) {
  const user = await getAuthenticatedUser();

  // Check if company exists by Pipedrive ID
  const existing = await db
    .select()
    .from(shared.companies)
    .where(eq(shared.companies.pipedriveId, String(args.pipedriveId)))
    .limit(1);

  if (existing.length > 0) {
    // Update existing company
    await db
      .update(shared.companies)
      .set({
        name: args.name,
        updatedAt: new Date(),
      })
      .where(eq(shared.companies.id, existing[0].id));

    revalidatePath("/companies");
    return existing[0].id;
  } else {
    // Create new company
    const [company] = await db
      .insert(shared.companies)
      .values({
        name: args.name,
        pipedriveId: String(args.pipedriveId),
        source: "pipedrive",
      })
      .returning();

    revalidatePath("/companies");
    return company.id;
  }
}

/**
 * Upsert contact from Pipedrive data
 */
export async function upsertContactFromPipedrive(args: {
  companyId: string;
  fullName: string;
  email?: string;
  phone?: string;
}) {
  const user = await getAuthenticatedUser();

  // Check if contact exists by email
  let existing: typeof shared.contacts.$inferSelect[] = [];
  if (args.email) {
    existing = await db
      .select()
      .from(shared.contacts)
      .where(eq(shared.contacts.email, args.email))
      .limit(1);
  }

  if (existing.length > 0) {
    // Update existing contact
    await db
      .update(shared.contacts)
      .set({
        fullName: args.fullName,
        phone: args.phone || null,
        updatedAt: new Date(),
      })
      .where(eq(shared.contacts.id, existing[0].id));

    revalidatePath("/contacts");
    return existing[0].id;
  } else {
    // Create new contact
    const [contact] = await db
      .insert(shared.contacts)
      .values({
        companyId: args.companyId,
        fullName: args.fullName,
        email: args.email || null,
        phone: args.phone || null,
        source: "pipedrive",
      })
      .returning();

    revalidatePath("/contacts");
    return contact.id;
  }
}

/**
 * Upsert deal from Pipedrive data
 */
export async function upsertDealFromPipedrive(args: {
  pipedriveId: number;
  title: string;
  amount: number;
  stage: string;
  companyId: string;
}) {
  const user = await getAuthenticatedUser();

  // Check if deal exists by Pipedrive ID
  const existing = await db
    .select()
    .from(shared.deals)
    .where(eq(shared.deals.pipedriveId, String(args.pipedriveId)))
    .limit(1);

  // Map Pipedrive stage to our enum
  const stageMap: Record<string, typeof shared.deals.$inferSelect["stage"]> = {
    "Lead": "sourcing",
    "Qualification": "qualification",
    "Meeting": "initial_meeting",
    "Analysis": "analysis",
    "Valuation": "valuation",
    "Due Diligence": "due_diligence",
    "Negotiation": "negotiation",
    "Closing": "closing",
    "Won": "closed_won",
    "Lost": "closed_lost",
  };

  const mappedStage = stageMap[args.stage] || "sourcing";

  if (existing.length > 0) {
    // Update existing deal
    await db
      .update(shared.deals)
      .set({
        title: args.title,
        amount: String(args.amount),
        stage: mappedStage,
        updatedAt: new Date(),
      })
      .where(eq(shared.deals.id, existing[0].id));

    revalidatePath("/deals");
    revalidatePath(`/deals/${existing[0].id}`);
    return existing[0].id;
  } else {
    // Create new deal
    const [deal] = await db
      .insert(shared.deals)
      .values({
        pipedriveId: String(args.pipedriveId),
        title: args.title,
        amount: String(args.amount),
        stage: mappedStage,
        companyId: args.companyId,
        ownerId: user.id,
        source: "pipedrive",
      })
      .returning();

    revalidatePath("/deals");
    return deal.id;
  }
}

/**
 * Link a deal to a Pipedrive deal
 */
export async function linkDealToPipedrive(args: {
  dealId: string;
  pipedriveId: number;
}) {
  const user = await getAuthenticatedUser();

  await db
    .update(shared.deals)
    .set({
      pipedriveId: String(args.pipedriveId),
      updatedAt: new Date(),
    })
    .where(eq(shared.deals.id, args.dealId));

  revalidatePath("/deals");
  revalidatePath(`/deals/${args.dealId}`);
  return { success: true };
}

/**
 * Get company by Pipedrive ID
 */
export async function getCompanyByPipedriveId(pipedriveId: number) {
  const companies = await db
    .select()
    .from(shared.companies)
    .where(eq(shared.companies.pipedriveId, String(pipedriveId)))
    .limit(1);

  return companies.length > 0 ? companies[0].id : null;
}

/**
 * Get deal by ID
 */
export async function getDealById(dealId: string) {
  const deals = await db
    .select()
    .from(shared.deals)
    .where(eq(shared.deals.id, dealId))
    .limit(1);

  return deals.length > 0 ? deals[0] : null;
}

/**
 * Sync all deals from Pipedrive
 */
export async function syncFromPipedrive() {
  const accessToken = await getPipedriveAccessToken();
  const client = createPipedriveClient(accessToken);

  let created = 0;
  let updated = 0;
  let errors = 0;
  let start = 0;
  const limit = 100;

  try {
    // Fetch deals with pagination
    let hasMore = true;
    
    while (hasMore) {
      const response = await client.deals.getDeals({
        start,
        limit,
        sort: "update_time DESC",
      });

      const deals = response.data || [];
      
      if (deals.length === 0) {
        hasMore = false;
        break;
      }

      // Process each deal
      for (const deal of deals) {
        try {
          // 1. Upsert organization if present
          let companyId: string | null = null;
          if (deal.org_id && typeof deal.org_id === 'object' && 'value' in deal.org_id) {
            const orgId = deal.org_id.value;
            const orgName = deal.org_id.name || deal.org_name;
            if (orgId && orgName) {
              companyId = await upsertCompanyFromPipedrive({
                pipedriveId: orgId,
                name: orgName,
              });
            }
          }

          // 2. Upsert person if present
          if (deal.person_id && typeof deal.person_id === 'object' && 'value' in deal.person_id && companyId) {
            const personName = deal.person_id.name || deal.person_name;
            if (personName) {
              await upsertContactFromPipedrive({
                companyId,
                fullName: personName,
              });
            }
          }

          // 3. Upsert deal
          if (companyId && deal.id && deal.title) {
            const existingDeal = await db
              .select()
              .from(shared.deals)
              .where(eq(shared.deals.pipedriveId, String(deal.id)))
              .limit(1);

            if (existingDeal.length > 0) {
              updated++;
            } else {
              created++;
            }

            await upsertDealFromPipedrive({
              pipedriveId: deal.id,
              title: deal.title,
              amount: deal.value || 0,
              stage: deal.status === "won" ? "Won" : deal.status === "lost" ? "Lost" : "Lead",
              companyId,
            });
          }
        } catch (err) {
          console.error(`[Pipedrive] Failed to sync deal ${deal.id}:`, err);
          errors++;
        }
      }

      // Check if there are more pages
      if (deals.length < limit) {
        hasMore = false;
      } else {
        start += limit;
      }
    }

    revalidatePath("/deals");
    revalidatePath("/companies");
    revalidatePath("/admin/crm");

    return {
      success: true,
      synced: created + updated,
      created,
      updated,
      errors,
    };
  } catch (err) {
    console.error("[Pipedrive] Sync failed:", err);
    return {
      success: false,
      synced: 0,
      created,
      updated,
      errors: errors + 1,
    };
  }
}

/**
 * Sync contacts (persons) from Pipedrive
 */
export async function syncContactsFromPipedrive() {
  const accessToken = await getPipedriveAccessToken();
  const client = createPipedriveClient(accessToken);

  let created = 0;
  let updated = 0;
  let errors = 0;
  let start = 0;
  const limit = 100;

  try {
    let hasMore = true;

    while (hasMore) {
      const response = await client.persons.getPersons({
        start,
        limit,
        sort: "update_time DESC",
      });

      const persons = response.data || [];

      if (persons.length === 0) {
        hasMore = false;
        break;
      }

      for (const person of persons) {
        try {
          // Upsert organization first if present
          let companyId: string | null = null;
          if (person.org_id && typeof person.org_id === 'object' && 'value' in person.org_id) {
            const orgId = person.org_id.value;
            const orgName = person.org_id.name;
            if (orgId && orgName) {
              companyId = await upsertCompanyFromPipedrive({
                pipedriveId: orgId,
                name: orgName,
              });
            }
          }

          if (companyId && person.name) {
            const email = person.email?.[0]?.value || undefined;
            const phone = person.phone?.[0]?.value || undefined;

            const existing = email
              ? await db
                  .select()
                  .from(shared.contacts)
                  .where(eq(shared.contacts.email, email))
                  .limit(1)
              : [];

            if (existing.length > 0) {
              updated++;
            } else {
              created++;
            }

            await upsertContactFromPipedrive({
              companyId,
              fullName: person.name,
              email,
              phone,
            });
          }
        } catch (err) {
          console.error(`[Pipedrive] Failed to sync person ${person.id}:`, err);
          errors++;
        }
      }

      if (persons.length < limit) {
        hasMore = false;
      } else {
        start += limit;
      }
    }

    revalidatePath("/admin/contacts");
    revalidatePath("/admin/crm");

    return {
      success: true,
      synced: created + updated,
      created,
      updated,
      errors,
    };
  } catch (err) {
    console.error("[Pipedrive] Contact sync failed:", err);
    return {
      success: false,
      synced: 0,
      created,
      updated,
      errors: errors + 1,
    };
  }
}

/**
 * Sync companies (organizations) from Pipedrive
 */
export async function syncCompaniesFromPipedrive() {
  const accessToken = await getPipedriveAccessToken();
  const client = createPipedriveClient(accessToken);

  let created = 0;
  let updated = 0;
  let errors = 0;
  let start = 0;
  const limit = 100;

  try {
    let hasMore = true;

    while (hasMore) {
      const response = await client.organizations.getOrganizations({
        start,
        limit,
        sort: "update_time DESC",
      });

      const organizations = response.data || [];

      if (organizations.length === 0) {
        hasMore = false;
        break;
      }

      for (const org of organizations) {
        try {
          // Skip if missing required fields
          if (!org.id || !org.name) {
            continue;
          }

          const existing = await db
            .select()
            .from(shared.companies)
            .where(eq(shared.companies.pipedriveId, String(org.id)))
            .limit(1);

          if (existing.length > 0) {
            updated++;
          } else {
            created++;
          }

          await upsertCompanyFromPipedrive({
            pipedriveId: org.id,
            name: org.name,
            address: org.address,
          });
        } catch (err) {
          console.error(`[Pipedrive] Failed to sync organization ${org.id}:`, err);
          errors++;
        }
      }

      if (organizations.length < limit) {
        hasMore = false;
      } else {
        start += limit;
      }
    }

    revalidatePath("/companies");
    revalidatePath("/admin/crm");

    return {
      success: true,
      synced: created + updated,
      created,
      updated,
      errors,
    };
  } catch (err) {
    console.error("[Pipedrive] Company sync failed:", err);
    return {
      success: false,
      synced: 0,
      created,
      updated,
      errors: errors + 1,
    };
  }
}
