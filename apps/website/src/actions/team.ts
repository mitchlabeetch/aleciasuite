"use server";

/**
 * Team Members Module - Team Profile Management
 *
 * Ported from Convex to Next.js Server Actions with Drizzle ORM.
 * Admin functions for managing team profiles on the website.
 */

import { db, shared, eq, asc } from "@alepanel/db";
import { getAuthenticatedUser } from "./lib/auth";
import { revalidatePath } from "next/cache";

// =============================================================================
// Types
// =============================================================================

export interface TeamMember {
  id: string;
  slug: string;
  name: string;
  role: string;
  photo?: string | null;
  photoUrl?: string | null;
  bioFr?: string | null;
  bioEn?: string | null;
  linkedinUrl?: string | null;
  email?: string | null;
  sectorsExpertise: string[];
  transactionSlugs: string[];
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTeamMemberInput {
  slug: string;
  name: string;
  role: string;
  photo?: string;
  bioFr?: string;
  bioEn?: string;
  linkedinUrl?: string;
  email?: string;
  sectorsExpertise: string[];
  transactionSlugs: string[];
  isActive: boolean;
}

export interface UpdateTeamMemberInput {
  id: string;
  slug?: string;
  name?: string;
  role?: string;
  photo?: string;
  photoUrl?: string;
  bioFr?: string;
  bioEn?: string;
  linkedinUrl?: string;
  email?: string;
  sectorsExpertise?: string[];
  transactionSlugs?: string[];
  isActive?: boolean;
  displayOrder?: number;
}

// =============================================================================
// Queries
// =============================================================================

/**
 * List all team members, optionally filtering out inactive members
 */
export async function listTeamMembers(
  includeInactive: boolean = false
): Promise<TeamMember[]> {
  const members = await db.query.teamMembers.findMany({
    orderBy: [asc(shared.teamMembers.displayOrder)],
  });

  const filtered = includeInactive
    ? members
    : members.filter((m) => m.isActive);

  return filtered as TeamMember[];
}

/**
 * Get team member by ID
 */
export async function getTeamMemberById(
  id: string
): Promise<TeamMember | null> {
  const member = await db.query.teamMembers.findFirst({
    where: eq(shared.teamMembers.id, id),
  });

  return (member as TeamMember) || null;
}

// =============================================================================
// Mutations
// =============================================================================

/**
 * Create a new team member
 */
export async function createTeamMember(
  input: CreateTeamMemberInput
): Promise<string> {
  await getAuthenticatedUser(); // Verify authentication

  // Get max display order
  const members = await db.query.teamMembers.findMany();
  const maxOrder =
    members.length > 0
      ? Math.max(...members.map((m) => m.displayOrder))
      : -1;

  const [newMember] = await db
    .insert(shared.teamMembers)
    .values({
      ...input,
      displayOrder: maxOrder + 1,
    })
    .returning();

  revalidatePath("/equipe");
  revalidatePath("/team");
  return newMember.id;
}

/**
 * Update an existing team member
 */
export async function updateTeamMember(
  input: UpdateTeamMemberInput
): Promise<string> {
  await getAuthenticatedUser(); // Verify authentication

  const { id, ...updates } = input;

  // Filter out undefined values
  const cleanUpdates: Record<string, any> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      cleanUpdates[key] = value;
    }
  }

  if (Object.keys(cleanUpdates).length > 0) {
    cleanUpdates.updatedAt = new Date();

    await db
      .update(shared.teamMembers)
      .set(cleanUpdates)
      .where(eq(shared.teamMembers.id, id));
  }

  revalidatePath("/equipe");
  revalidatePath("/team");
  return id;
}

/**
 * Delete a team member
 */
export async function deleteTeamMember(id: string): Promise<void> {
  await getAuthenticatedUser(); // Verify authentication

  await db.delete(shared.teamMembers).where(eq(shared.teamMembers.id, id));

  revalidatePath("/equipe");
  revalidatePath("/team");
}

/**
 * Toggle team member active status
 */
export async function toggleTeamMemberActive(id: string): Promise<void> {
  await getAuthenticatedUser(); // Verify authentication

  const member = await db.query.teamMembers.findFirst({
    where: eq(shared.teamMembers.id, id),
  });

  if (!member) {
    throw new Error("Team member not found");
  }

  await db
    .update(shared.teamMembers)
    .set({
      isActive: !member.isActive,
      updatedAt: new Date(),
    })
    .where(eq(shared.teamMembers.id, id));

  revalidatePath("/equipe");
  revalidatePath("/team");
}

/**
 * Reorder team members
 */
export async function reorderTeamMembers(
  orderedIds: string[]
): Promise<void> {
  await getAuthenticatedUser(); // Verify authentication

  // Update display order for each member
  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(shared.teamMembers)
      .set({
        displayOrder: i,
        updatedAt: new Date(),
      })
      .where(eq(shared.teamMembers.id, orderedIds[i]));
  }

  revalidatePath("/equipe");
  revalidatePath("/team");
}

/**
 * Bulk update team member photos with correct paths
 */
export async function syncTeamMemberPhotos(): Promise<{
  success: boolean;
  updated: number;
  total: number;
}> {
  await getAuthenticatedUser(); // Verify authentication

  const photoMap: Record<string, string> = {
    "gregory-colin": "/assets/Equipe_Alecia/team_member_GC_1_cropped.jpg",
    "serge-de-fay": "/assets/Equipe_Alecia/SF_2.jpg",
    "christophe-berthon": "/assets/Equipe_Alecia/CB_1_-_cropped_-_alt.jpg",
    "louise-pini": "/assets/Equipe_Alecia/LP__2__-_cropped.jpg",
    "martin-egasse": "/assets/Equipe_Alecia/ME_2_-_cropped_-_alt.jpg",
    "tristan-cossec": "/assets/Equipe_Alecia/TC_2.jpg",
    "mickael-furet": "/assets/Equipe_Alecia/MF.jpg",
    "jerome-berthiau": "/assets/Equipe_Alecia/JB_1_-_cropped_-_alt.jpg",
  };

  const members = await db.query.teamMembers.findMany();
  let updated = 0;

  for (const member of members) {
    const photoUrl = photoMap[member.slug];
    if (photoUrl) {
      await db
        .update(shared.teamMembers)
        .set({
          photoUrl,
          photo: photoUrl,
          updatedAt: new Date(),
        })
        .where(eq(shared.teamMembers.id, member.id));
      updated++;
    }
  }

  revalidatePath("/equipe");
  revalidatePath("/team");

  return { success: true, updated, total: members.length };
}
