/**
 * Contact Management Server Actions
 *
 * Handles contact CRUD operations with company relationships
 * Supports Microsoft/Pipedrive sync via external IDs
 */

"use server";

import { db, shared, eq, or, ilike, desc, and } from "@alepanel/db";
import { auth } from "@alepanel/auth";
import { revalidatePath } from "next/cache";

// ============================================
// TYPES
// ============================================

export interface CreateContactInput {
  fullName: string;
  email?: string;
  phone?: string;
  role?: string;
  companyId?: string;
  tags?: string[];
  externalId?: string;
  source?: string;
}

export interface ContactFilters {
  companyId?: string;
  search?: string;
  tags?: string[];
  source?: string;
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
 * Get all contacts with optional filtering
 */
export async function getContacts(filters?: ContactFilters) {
  const _user = await getAuthenticatedUser();

  const conditions = [];

  if (filters?.companyId) {
    conditions.push(eq(shared.contacts.companyId, filters.companyId));
  }

  if (filters?.source) {
    conditions.push(eq(shared.contacts.source, filters.source));
  }

  if (filters?.search) {
    conditions.push(
      or(
        ilike(shared.contacts.fullName, `%${filters.search}%`),
        ilike(shared.contacts.email, `%${filters.search}%`),
        ilike(shared.contacts.phone, `%${filters.search}%`),
        ilike(shared.contacts.role, `%${filters.search}%`)
      )
    );
  }

  const contacts = await db.query.contacts.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: {
      company: {
        columns: {
          id: true,
          name: true,
          logoUrl: true,
          website: true,
        },
      },
    },
    orderBy: [desc(shared.contacts.updatedAt)],
  });

  return contacts;
}

/**
 * Get a single contact by ID
 */
export async function getContactById(id: string) {
  const _user = await getAuthenticatedUser();

  const contact = await db.query.contacts.findFirst({
    where: eq(shared.contacts.id, id),
    with: {
      company: true,
    },
  });

  if (!contact) {
    return null;
  }

  return contact;
}

/**
 * Get a contact by email (for deduplication)
 */
export async function getContactByEmail(email: string) {
  const _user = await getAuthenticatedUser();

  const contact = await db.query.contacts.findFirst({
    where: eq(shared.contacts.email, email),
    with: {
      company: true,
    },
  });

  return contact;
}

/**
 * Get a contact by external ID (for OAuth sync)
 */
export async function getContactByExternalId(externalId: string) {
  const _user = await getAuthenticatedUser();

  const contact = await db.query.contacts.findFirst({
    where: eq(shared.contacts.externalId, externalId),
  });

  return contact;
}

/**
 * Create a new contact
 */
export async function createContact(data: CreateContactInput) {
  const _user = await getAuthenticatedUser();

  // Check for duplicate email
  if (data.email) {
    const existingContact = await db.query.contacts.findFirst({
      where: eq(shared.contacts.email, data.email),
    });

    if (existingContact) {
      throw new Error(
        `Contact with email ${data.email} already exists. Use updateContact instead.`
      );
    }
  }

  // Validate company exists if provided
  if (data.companyId) {
    const company = await db.query.companies.findFirst({
      where: eq(shared.companies.id, data.companyId),
    });

    if (!company) {
      throw new Error("Company not found");
    }
  }

  const [contact] = await db
    .insert(shared.contacts)
    .values({
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      role: data.role,
      companyId: data.companyId,
      tags: data.tags || [],
      externalId: data.externalId,
      source: data.source || "manual",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  revalidatePath("/contacts");
  if (data.companyId) {
    revalidatePath(`/companies/${data.companyId}`);
  }

  return contact;
}

/**
 * Update an existing contact
 */
export async function updateContact(id: string, data: Partial<CreateContactInput>) {
  const _user = await getAuthenticatedUser();

  const existingContact = await db.query.contacts.findFirst({
    where: eq(shared.contacts.id, id),
  });

  if (!existingContact) {
    throw new Error("Contact not found");
  }

  // Check email uniqueness if email is being updated
  if (data.email && data.email !== existingContact.email) {
    const duplicateContact = await db.query.contacts.findFirst({
      where: eq(shared.contacts.email, data.email),
    });

    if (duplicateContact) {
      throw new Error(`Contact with email ${data.email} already exists`);
    }
  }

  // Validate company if being updated
  if (data.companyId && data.companyId !== existingContact.companyId) {
    const company = await db.query.companies.findFirst({
      where: eq(shared.companies.id, data.companyId),
    });

    if (!company) {
      throw new Error("Company not found");
    }
  }

  const [updatedContact] = await db
    .update(shared.contacts)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(shared.contacts.id, id))
    .returning();

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${id}`);

  if (existingContact.companyId) {
    revalidatePath(`/companies/${existingContact.companyId}`);
  }
  if (data.companyId && data.companyId !== existingContact.companyId) {
    revalidatePath(`/companies/${data.companyId}`);
  }

  return updatedContact;
}

/**
 * Delete a contact
 */
export async function deleteContact(id: string) {
  const _user = await getAuthenticatedUser();

  const contact = await db.query.contacts.findFirst({
    where: eq(shared.contacts.id, id),
  });

  if (!contact) {
    throw new Error("Contact not found");
  }

  await db.delete(shared.contacts).where(eq(shared.contacts.id, id));

  revalidatePath("/contacts");
  if (contact.companyId) {
    revalidatePath(`/companies/${contact.companyId}`);
  }
}

/**
 * Search contacts by name or email
 * Used for autocomplete and quick lookup
 */
export async function searchContacts(query: string) {
  const _user = await getAuthenticatedUser();

  if (!query || query.length < 2) {
    return [];
  }

  const contacts = await db.query.contacts.findMany({
    where: or(
      ilike(shared.contacts.fullName, `%${query}%`),
      ilike(shared.contacts.email, `%${query}%`)
    ),
    with: {
      company: {
        columns: {
          id: true,
          name: true,
          logoUrl: true,
        },
      },
    },
    columns: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
    },
    limit: 10,
  });

  return contacts;
}

/**
 * Get contacts for a specific company
 */
export async function getContactsForCompany(companyId: string) {
  const _user = await getAuthenticatedUser();

  const contacts = await db.query.contacts.findMany({
    where: eq(shared.contacts.companyId, companyId),
    orderBy: [desc(shared.contacts.createdAt)],
  });

  return contacts;
}

/**
 * Bulk create contacts (for import/sync operations)
 */
export async function bulkCreateContacts(contacts: CreateContactInput[]) {
  const _user = await getAuthenticatedUser();

  // TODO: Implement proper bulk insert with deduplication
  // For now, we'll create one at a time with error handling
  const results = {
    created: [] as unknown[],
    skipped: [] as { email: string; reason: string }[],
    errors: [] as { data: CreateContactInput; error: string }[],
  };

  for (const contactData of contacts) {
    try {
      // Check for duplicates
      if (contactData.email) {
        const existing = await db.query.contacts.findFirst({
          where: eq(shared.contacts.email, contactData.email),
        });

        if (existing) {
          results.skipped.push({
            email: contactData.email,
            reason: "Email already exists",
          });
          continue;
        }
      }

      const [contact] = await db
        .insert(shared.contacts)
        .values({
          fullName: contactData.fullName,
          email: contactData.email,
          phone: contactData.phone,
          role: contactData.role,
          companyId: contactData.companyId,
          tags: contactData.tags || [],
          externalId: contactData.externalId,
          source: contactData.source || "import",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      results.created.push(contact);
    } catch (error) {
      results.errors.push({
        data: contactData,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  revalidatePath("/contacts");

  return results;
}
