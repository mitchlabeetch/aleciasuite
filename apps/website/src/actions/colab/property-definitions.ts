"use server";

/**
 * Colab Property Definitions Server Actions
 *
 * Custom Notion-style property definitions for boards.
 * Ported from Convex to Drizzle ORM + PostgreSQL.
 */

import { db, colab, eq, asc } from "@alepanel/db";
import { getAuthenticatedUser } from "../lib/auth";
import { revalidatePath } from "next/cache";

type PropertyType = "text" | "number" | "date" | "select" | "multiselect" | "checkbox";

interface PropertyOption {
  id: string;
  label: string;
  color: string;
}

// Create a new property definition
export async function createProperty(args: {
  boardId: string;
  name: string;
  type: PropertyType;
  options?: PropertyOption[];
}) {
  const _user = await getAuthenticatedUser();

  // Get the highest sort_order to append at end
  const existingProps = await db
    .select()
    .from(colab.propertyDefinitions)
    .where(eq(colab.propertyDefinitions.boardId, args.boardId));

  const maxOrder =
    existingProps.length > 0
      ? Math.max(...existingProps.map((p) => p.sortOrder))
      : 0;

  const [property] = await db
    .insert(colab.propertyDefinitions)
    .values({
      boardId: args.boardId,
      name: args.name,
      propertyType: args.type,
      options: args.options || [],
      sortOrder: maxOrder + 1,
    })
    .returning();

  revalidatePath("/colab/properties");
  revalidatePath(`/colab/boards/${args.boardId}`);
  return property.id;
}

// List all property definitions for a board (sorted by sort_order)
export async function listProperties(boardId: string) {
  const _user = await getAuthenticatedUser();

  const properties = await db
    .select()
    .from(colab.propertyDefinitions)
    .where(eq(colab.propertyDefinitions.boardId, boardId))
    .orderBy(asc(colab.propertyDefinitions.sortOrder));

  return properties;
}

// Update a property definition
export async function updateProperty(args: {
  id: string;
  name?: string;
  options?: PropertyOption[];
}) {
  const _user = await getAuthenticatedUser();

  const updates: Partial<typeof colab.propertyDefinitions.$inferInsert> = {};
  if (args.name !== undefined) updates.name = args.name;
  if (args.options !== undefined) updates.options = args.options;

  // Add updatedAt
  updates.updatedAt = new Date();

  await db
    .update(colab.propertyDefinitions)
    .set(updates)
    .where(eq(colab.propertyDefinitions.id, args.id));

  revalidatePath("/colab/properties");
}

// Delete a property definition
export async function deleteProperty(id: string) {
  const _user = await getAuthenticatedUser();

  await db
    .delete(colab.propertyDefinitions)
    .where(eq(colab.propertyDefinitions.id, id));

  revalidatePath("/colab/properties");
}

// Reorder properties
export async function reorderProperties(propertyIds: string[]) {
  const _user = await getAuthenticatedUser();

  // Update sort_order for each property
  for (let i = 0; i < propertyIds.length; i++) {
    await db
      .update(colab.propertyDefinitions)
      .set({ sortOrder: i + 1, updatedAt: new Date() })
      .where(eq(colab.propertyDefinitions.id, propertyIds[i]));
  }

  revalidatePath("/colab/properties");
}

// Add option to a select/multiselect property
export async function addPropertyOption(args: {
  propertyId: string;
  option: PropertyOption;
}) {
  const _user = await getAuthenticatedUser();

  const property = await db.query.propertyDefinitions.findFirst({
    where: eq(colab.propertyDefinitions.id, args.propertyId),
  });

  if (!property) throw new Error("Property not found");

  const currentOptions = (property.options || []) as PropertyOption[];

  await db
    .update(colab.propertyDefinitions)
    .set({
      options: [...currentOptions, args.option],
      updatedAt: new Date(),
    })
    .where(eq(colab.propertyDefinitions.id, args.propertyId));

  revalidatePath("/colab/properties");
}
