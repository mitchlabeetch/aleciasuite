"use server";

/**
 * Colab Presentations Server Actions
 *
 * AI-powered presentation management.
 * Ported from Convex to Drizzle ORM + PostgreSQL.
 */

import { db, colab, eq, desc } from "@alepanel/db";
import { getAuthenticatedUser } from "../lib/auth";
import { revalidatePath } from "next/cache";

// List all presentations for authenticated user
export async function listPresentations() {
  const user = await getAuthenticatedUser();

  const presentations = await db.query.presentations.findMany({
    where: eq(colab.presentations.ownerId, user.id),
    orderBy: desc(colab.presentations.updatedAt),
  });

  return presentations;
}

// Get a single presentation by ID
export async function getPresentation(id: string) {
  const user = await getAuthenticatedUser();

  const presentation = await db.query.presentations.findFirst({
    where: eq(colab.presentations.id, id),
  });

  if (!presentation) {
    return null;
  }

  // Verify ownership
  if (presentation.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  return presentation;
}

// Create a new presentation
export async function createPresentation(args: {
  title: string;
  dealId?: string;
}) {
  const user = await getAuthenticatedUser();

  const [presentation] = await db
    .insert(colab.presentations)
    .values({
      title: args.title,
      slides: [],
      dealId: args.dealId || null,
      ownerId: user.id,
    })
    .returning();

  revalidatePath("/colab/presentations");
  return presentation.id;
}

// Update a presentation
export async function updatePresentation(args: {
  id: string;
  title?: string;
  slides?: unknown[];
  dealId?: string;
}) {
  const user = await getAuthenticatedUser();

  const presentation = await db.query.presentations.findFirst({
    where: eq(colab.presentations.id, args.id),
  });

  if (!presentation || presentation.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  const { id, ...updates } = args;

  await db
    .update(colab.presentations)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(colab.presentations.id, id));

  revalidatePath("/colab/presentations");
  revalidatePath(`/colab/presentations/${id}`);
}

// Delete a presentation
export async function deletePresentation(id: string) {
  const user = await getAuthenticatedUser();

  const presentation = await db.query.presentations.findFirst({
    where: eq(colab.presentations.id, id),
  });

  if (!presentation || presentation.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  await db.delete(colab.presentations).where(eq(colab.presentations.id, id));

  revalidatePath("/colab/presentations");
}
