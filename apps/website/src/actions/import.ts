/**
 * Data Import Server Actions
 *
 * Bulk import with deduplication for admin data migration.
 * Ported from convex/import.ts + importData.ts + team_import.ts
 */

"use server";

import { db, shared, eq, sql } from "@alepanel/db";
import { getAuthenticatedUser } from "./lib/auth";
import { revalidatePath } from "next/cache";

// ============================================
// IMPORT FUNCTIONS
// ============================================

/**
 * Import transactions with dedup by slug
 */
export async function importTransactions(
  transactions: Array<{
    slug: string;
    clientName: string;
    clientLogo?: string;
    acquirerName?: string;
    acquirerLogo?: string;
    sector: string;
    region?: string;
    year: number;
    mandateType: string;
    description?: string;
    isConfidential: boolean;
    isPriorExperience: boolean;
    context?: string;
    intervention?: string;
    result?: string;
    testimonialText?: string;
    testimonialAuthor?: string;
    roleType?: string;
    dealSize?: string;
    displayOrder: number;
  }>
) {
  const user = await getAuthenticatedUser();
  if ((user as any).role !== "sudo") throw new Error("Unauthorized: sudo role required");

  let imported = 0;
  let skipped = 0;

  for (const t of transactions) {
    // Check if already exists by slug
    const existing = await db
      .select({ id: shared.transactions.id })
      .from(shared.transactions)
      .where(eq(shared.transactions.slug, t.slug))
      .limit(1);

    if (existing.length > 0) {
      skipped++;
      continue;
    }

    await db.insert(shared.transactions).values({
      slug: t.slug,
      clientName: t.clientName,
      clientLogo: t.clientLogo ?? null,
      acquirerName: t.acquirerName ?? null,
      acquirerLogo: t.acquirerLogo ?? null,
      sector: t.sector,
      region: t.region ?? null,
      year: t.year,
      mandateType: t.mandateType,
      description: t.description ?? null,
      isConfidential: t.isConfidential,
      isPriorExperience: t.isPriorExperience,
      context: t.context ?? null,
      intervention: t.intervention ?? null,
      result: t.result ?? null,
      testimonialText: t.testimonialText ?? null,
      testimonialAuthor: t.testimonialAuthor ?? null,
      roleType: t.roleType ?? null,
      dealSize: t.dealSize ?? null,
      displayOrder: t.displayOrder,
    });
    imported++;
  }

  revalidatePath("/admin/transactions");
  return { imported, skipped, total: transactions.length };
}

/**
 * Import team members with dedup by slug
 */
export async function importTeamMembers(
  members: Array<{
    slug: string;
    name: string;
    role: string;
    photo?: string;
    bioFr?: string;
    bioEn?: string;
    linkedinUrl?: string;
    email?: string;
    sectorsExpertise?: string[];
    transactionSlugs?: string[];
    displayOrder: number;
    isActive: boolean;
  }>
) {
  const user = await getAuthenticatedUser();
  if ((user as any).role !== "sudo") throw new Error("Unauthorized: sudo role required");

  let imported = 0;
  let skipped = 0;

  for (const m of members) {
    const existing = await db
      .select({ id: shared.teamMembers.id })
      .from(shared.teamMembers)
      .where(eq(shared.teamMembers.slug, m.slug))
      .limit(1);

    if (existing.length > 0) {
      skipped++;
      continue;
    }

    await db.insert(shared.teamMembers).values({
      slug: m.slug,
      name: m.name,
      role: m.role,
      photo: m.photo ?? null,
      bioFr: m.bioFr ?? null,
      bioEn: m.bioEn ?? null,
      linkedinUrl: m.linkedinUrl ?? null,
      email: m.email ?? null,
      sectorsExpertise: m.sectorsExpertise ?? [],
      transactionSlugs: m.transactionSlugs ?? [],
      displayOrder: m.displayOrder,
      isActive: m.isActive,
    });
    imported++;
  }

  revalidatePath("/admin/team");
  return { imported, skipped, total: members.length };
}

/**
 * Import blog posts with dedup by slug
 */
export async function importBlogPosts(
  posts: Array<{
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    featuredImage?: string;
    category?: string;
    status: "draft" | "published" | "archived";
    publishedAt?: number;
    tags?: string[];
    authorId?: string;
  }>
) {
  const user = await getAuthenticatedUser();
  if ((user as any).role !== "sudo") throw new Error("Unauthorized: sudo role required");

  let imported = 0;
  let skipped = 0;

  for (const p of posts) {
    const existing = await db
      .select({ id: shared.blogPosts.id })
      .from(shared.blogPosts)
      .where(eq(shared.blogPosts.slug, p.slug))
      .limit(1);

    if (existing.length > 0) {
      skipped++;
      continue;
    }

    await db.insert(shared.blogPosts).values({
      title: p.title,
      slug: p.slug,
      content: p.content,
      excerpt: p.excerpt ?? null,
      featuredImage: p.featuredImage ?? null,
      category: p.category ?? null,
      status: p.status,
      publishedAt: p.publishedAt ?? null,
      tags: p.tags ?? [],
      authorId: p.authorId ?? user.id,
      createdAt: Date.now(),
    });
    imported++;
  }

  revalidatePath("/admin/blog");
  return { imported, skipped, total: posts.length };
}

/**
 * Import job offers with dedup by slug
 */
export async function importJobOffers(
  offers: Array<{
    slug: string;
    title: string;
    type: string;
    location: string;
    description: string;
    requirements?: string | string[];
    contactEmail?: string;
    pdfUrl?: string;
    isPublished: boolean;
    displayOrder: number;
  }>
) {
  const user = await getAuthenticatedUser();
  if ((user as any).role !== "sudo") throw new Error("Unauthorized: sudo role required");

  let imported = 0;
  let skipped = 0;

  for (const o of offers) {
    const existing = await db
      .select({ id: shared.jobOffers.id })
      .from(shared.jobOffers)
      .where(eq(shared.jobOffers.slug, o.slug))
      .limit(1);

    if (existing.length > 0) {
      skipped++;
      continue;
    }

    const requirements = Array.isArray(o.requirements)
      ? o.requirements.join("\n")
      : o.requirements;

    await db.insert(shared.jobOffers).values({
      slug: o.slug,
      title: o.title,
      type: o.type,
      location: o.location,
      description: o.description,
      requirements: requirements ?? null,
      contactEmail: o.contactEmail ?? null,
      pdfUrl: o.pdfUrl ?? null,
      isPublished: o.isPublished,
      displayOrder: o.displayOrder,
    });
    imported++;
  }

  revalidatePath("/admin/careers");
  return { imported, skipped, total: offers.length };
}

/**
 * Upsert a team member (insert or update by slug)
 */
export async function upsertTeamMember(args: {
  slug: string;
  name: string;
  role: string;
  photo?: string;
  bioFr?: string;
  bioEn?: string;
  linkedinUrl?: string;
  email?: string;
  sectorsExpertise?: string[];
  transactionSlugs?: string[];
  displayOrder: number;
  isActive: boolean;
}) {
  const user = await getAuthenticatedUser();

  const existing = await db
    .select({ id: shared.teamMembers.id })
    .from(shared.teamMembers)
    .where(eq(shared.teamMembers.slug, args.slug))
    .limit(1);

  if (existing.length > 0) {
    const id = existing[0].id;
    await db
      .update(shared.teamMembers)
      .set({
        name: args.name,
        role: args.role,
        photo: args.photo ?? null,
        bioFr: args.bioFr ?? null,
        bioEn: args.bioEn ?? null,
        linkedinUrl: args.linkedinUrl ?? null,
        email: args.email ?? null,
        sectorsExpertise: args.sectorsExpertise ?? [],
        transactionSlugs: args.transactionSlugs ?? [],
        displayOrder: args.displayOrder,
        isActive: args.isActive,
      })
      .where(eq(shared.teamMembers.id, id));
    return { id, action: "updated" as const };
  } else {
    const [inserted] = await db
      .insert(shared.teamMembers)
      .values({
        slug: args.slug,
        name: args.name,
        role: args.role,
        photo: args.photo ?? null,
        bioFr: args.bioFr ?? null,
        bioEn: args.bioEn ?? null,
        linkedinUrl: args.linkedinUrl ?? null,
        email: args.email ?? null,
        sectorsExpertise: args.sectorsExpertise ?? [],
        transactionSlugs: args.transactionSlugs ?? [],
        displayOrder: args.displayOrder,
        isActive: args.isActive,
      })
      .returning();
    return { id: inserted.id, action: "inserted" as const };
  }
}
