"use server";

// Careers (Job Offers) Actions
// Ported from convex/careers.ts
// TODO: Migrate to Strapi CMS once deployed

import { db, shared, eq, desc, sql } from "@alepanel/db";
import { revalidatePath } from "next/cache";

interface JobOffer {
  id: string;
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
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================
// QUERIES (Admin)
// ============================================

export async function listJobOffers(includeUnpublished = false) {
  const offers = await db
    .select()
    .from(shared.jobOffers)
    .where(includeUnpublished ? undefined : eq(shared.jobOffers.isPublished, true))
    .orderBy(shared.jobOffers.displayOrder);

  return offers as unknown as JobOffer[];
}

export async function getJobOfferById(id: string) {
  const result = await db
    .select()
    .from(shared.jobOffers)
    .where(eq(shared.jobOffers.id, id))
    .limit(1);

  if (result.length === 0) return null;
  return result[0] as unknown as JobOffer;
}

export async function getJobOfferBySlug(slug: string) {
  const result = await db
    .select()
    .from(shared.jobOffers)
    .where(eq(shared.jobOffers.slug, slug))
    .limit(1);

  if (result.length === 0) return null;
  return result[0] as unknown as JobOffer;
}

// ============================================
// MUTATIONS
// ============================================

export async function createJobOffer(data: {
  slug: string;
  title: string;
  type: string;
  location: string;
  description: string;
  requirements?: string | string[];
  contactEmail?: string;
  pdfUrl?: string;
  isPublished: boolean;
}) {
  // Get max display order
  const maxOrderResult = await db
    .select({ maxOrder: sql<number>`COALESCE(MAX(${shared.jobOffers.displayOrder}), -1)` })
    .from(shared.jobOffers);

  const maxOrder = maxOrderResult[0]?.maxOrder ?? -1;

  const requirementsValue =
    typeof data.requirements === "string"
      ? data.requirements
      : data.requirements?.join("\n");

  const [result] = await db
    .insert(shared.jobOffers)
    .values({
      slug: data.slug,
      title: data.title,
      type: data.type,
      location: data.location,
      description: data.description,
      requirements: requirementsValue,
      contactEmail: data.contactEmail,
      pdfUrl: data.pdfUrl,
      isPublished: data.isPublished,
      displayOrder: maxOrder + 1,
    })
    .returning({ id: shared.jobOffers.id });

  revalidatePath("/careers");
  return result.id;
}

export async function updateJobOffer(
  id: string,
  data: {
    slug?: string;
    title?: string;
    type?: string;
    location?: string;
    description?: string;
    requirements?: string | string[];
    contactEmail?: string;
    pdfUrl?: string;
    isPublished?: boolean;
    displayOrder?: number;
  }
) {
  const updates: Record<string, any> = {};

  if (data.slug !== undefined) updates.slug = data.slug;
  if (data.title !== undefined) updates.title = data.title;
  if (data.type !== undefined) updates.type = data.type;
  if (data.location !== undefined) updates.location = data.location;
  if (data.description !== undefined) updates.description = data.description;
  if (data.requirements !== undefined) {
    updates.requirements =
      typeof data.requirements === "string"
        ? data.requirements
        : data.requirements.join("\n");
  }
  if (data.contactEmail !== undefined) updates.contactEmail = data.contactEmail;
  if (data.pdfUrl !== undefined) updates.pdfUrl = data.pdfUrl;
  if (data.isPublished !== undefined) updates.isPublished = data.isPublished;
  if (data.displayOrder !== undefined) updates.displayOrder = data.displayOrder;

  if (Object.keys(updates).length > 0) {
    await db
      .update(shared.jobOffers)
      .set(updates)
      .where(eq(shared.jobOffers.id, id));
  }

  revalidatePath("/careers");
  return id;
}

export async function deleteJobOffer(id: string) {
  await db.delete(shared.jobOffers).where(eq(shared.jobOffers.id, id));

  revalidatePath("/careers");
}

export async function toggleJobOfferPublished(id: string) {
  const offerResult = await db
    .select({ isPublished: shared.jobOffers.isPublished })
    .from(shared.jobOffers)
    .where(eq(shared.jobOffers.id, id))
    .limit(1);

  if (offerResult.length === 0) {
    throw new Error("Job offer not found");
  }

  const offer = offerResult[0];

  await db
    .update(shared.jobOffers)
    .set({ isPublished: !offer.isPublished })
    .where(eq(shared.jobOffers.id, id));

  revalidatePath("/careers");
}
