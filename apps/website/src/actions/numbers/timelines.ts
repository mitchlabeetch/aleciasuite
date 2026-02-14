/**
 * Numbers Timelines Server Actions
 *
 * Handles deal timelines and milestones tracking
 */

"use server";

import { db, numbers, eq, desc } from "@alepanel/db";
import { revalidatePath } from "next/cache";
import { auth } from "@alepanel/auth";

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
// TYPES
// ============================================

export interface Milestone {
  id: string;
  phase: string;
  description: string;
  startDate?: string;
  endDate?: string;
  status: "not_started" | "in_progress" | "completed" | "delayed";
  owner?: string;
  dependencies?: string[];
}

export interface SaveTimelineInput {
  id?: string;
  dealId?: string;
  name: string;
  startDate?: string;
  milestones: Milestone[];
}

// ============================================
// TIMELINE ACTIONS
// ============================================

/**
 * Save a timeline (create or update)
 */
export async function saveTimeline(data: SaveTimelineInput) {
  const _user = await getAuthenticatedUser();

  const now = new Date();

  // Update existing timeline
  if (data.id) {
    const existing = await db.query.timelines.findFirst({
      where: eq(numbers.timelines.id, data.id),
    });

    if (!existing) {
      throw new Error("Timeline not found");
    }

    const [updated] = await db
      .update(numbers.timelines)
      .set({
        name: data.name,
        milestones: data.milestones,
        updatedAt: now,
      })
      .where(eq(numbers.timelines.id, data.id))
      .returning();

    revalidatePath("/admin/numbers/timelines");
    if (data.dealId) {
      revalidatePath(`/deals/${data.dealId}/timeline`);
    }

    return updated;
  }

  // Create new timeline
  const [timeline] = await db
    .insert(numbers.timelines)
    .values({
      dealId: data.dealId,
      name: data.name,
      milestones: data.milestones,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  revalidatePath("/admin/numbers/timelines");
  if (data.dealId) {
    revalidatePath(`/deals/${data.dealId}/timeline`);
  }

  return timeline;
}

/**
 * Get user's timelines
 */
export async function getUserTimelines(limit: number = 50) {
  const _user = await getAuthenticatedUser();

  // Get all timelines (no user filtering in schema)
  const timelines = await db.query.timelines.findMany({
    orderBy: [desc(numbers.timelines.updatedAt)],
    limit,
  });

  return timelines;
}

/**
 * Get a specific timeline by ID
 */
export async function getTimeline(id: string) {
  const _user = await getAuthenticatedUser();

  const timeline = await db.query.timelines.findFirst({
    where: eq(numbers.timelines.id, id),
  });

  if (!timeline) {
    throw new Error("Timeline not found");
  }

  return timeline;
}

/**
 * Get timelines for a specific deal
 */
export async function getDealTimelines(dealId: string) {
  const _user = await getAuthenticatedUser();

  const timelines = await db.query.timelines.findMany({
    where: eq(numbers.timelines.dealId, dealId),
    orderBy: [desc(numbers.timelines.updatedAt)],
  });

  return timelines;
}

/**
 * Delete a timeline
 */
export async function deleteTimeline(id: string) {
  const _user = await getAuthenticatedUser();

  const timeline = await db.query.timelines.findFirst({
    where: eq(numbers.timelines.id, id),
  });

  if (!timeline) {
    throw new Error("Timeline not found");
  }

  await db.delete(numbers.timelines).where(eq(numbers.timelines.id, id));

  revalidatePath("/admin/numbers/timelines");
  if (timeline.dealId) {
    revalidatePath(`/deals/${timeline.dealId}/timeline`);
  }

  return true;
}

/**
 * Update a single milestone within a timeline
 */
export async function updateMilestone(
  timelineId: string,
  milestoneId: string,
  updates: Partial<Milestone>
) {
  const _user = await getAuthenticatedUser();

  const timeline = await db.query.timelines.findFirst({
    where: eq(numbers.timelines.id, timelineId),
  });

  if (!timeline) {
    throw new Error("Timeline not found");
  }

  // Update the specific milestone
  const milestones = timeline.milestones as Milestone[];
  const milestoneIndex = milestones.findIndex((m) => m.id === milestoneId);

  if (milestoneIndex === -1) {
    throw new Error("Milestone not found");
  }

  milestones[milestoneIndex] = {
    ...milestones[milestoneIndex],
    ...updates,
  };

  const [updated] = await db
    .update(numbers.timelines)
    .set({
      milestones,
      updatedAt: new Date(),
    })
    .where(eq(numbers.timelines.id, timelineId))
    .returning();

  revalidatePath("/admin/numbers/timelines");
  if (timeline.dealId) {
    revalidatePath(`/deals/${timeline.dealId}/timeline`);
  }

  return updated;
}

/**
 * Add a milestone to a timeline
 */
export async function addMilestone(timelineId: string, milestone: Milestone) {
  const _user = await getAuthenticatedUser();

  const timeline = await db.query.timelines.findFirst({
    where: eq(numbers.timelines.id, timelineId),
  });

  if (!timeline) {
    throw new Error("Timeline not found");
  }

  const milestones = [...(timeline.milestones as Milestone[]), milestone];

  const [updated] = await db
    .update(numbers.timelines)
    .set({
      milestones,
      updatedAt: new Date(),
    })
    .where(eq(numbers.timelines.id, timelineId))
    .returning();

  revalidatePath("/admin/numbers/timelines");
  if (timeline.dealId) {
    revalidatePath(`/deals/${timeline.dealId}/timeline`);
  }

  return updated;
}

/**
 * Remove a milestone from a timeline
 */
export async function removeMilestone(timelineId: string, milestoneId: string) {
  const _user = await getAuthenticatedUser();

  const timeline = await db.query.timelines.findFirst({
    where: eq(numbers.timelines.id, timelineId),
  });

  if (!timeline) {
    throw new Error("Timeline not found");
  }

  const milestones = (timeline.milestones as Milestone[]).filter(
    (m) => m.id !== milestoneId
  );

  const [updated] = await db
    .update(numbers.timelines)
    .set({
      milestones,
      updatedAt: new Date(),
    })
    .where(eq(numbers.timelines.id, timelineId))
    .returning();

  revalidatePath("/admin/numbers/timelines");
  if (timeline.dealId) {
    revalidatePath(`/deals/${timeline.dealId}/timeline`);
  }

  return updated;
}
