"use server";

/**
 * Users Module - Identity & Profile Management
 *
 * Ported from Convex to Next.js Server Actions with Drizzle ORM.
 * Implements unified user identity across Website and Colab.
 */

import { db, shared, eq, and } from "@alepanel/db";
import { getAuthenticatedUser } from "./lib/auth";
import { revalidatePath } from "next/cache";

// =============================================================================
// Types
// =============================================================================

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: "sudo" | "partner" | "advisor" | "user";
  avatarUrl: string | null;
}

export interface EnsureUserResult {
  userId: string;
  isNew: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Find existing user by auth provider ID (BetterAuth user.id)
 */
async function findExistingUser(authProviderId: string) {
  return await db.query.users.findFirst({
    where: eq(shared.users.authProviderId, authProviderId),
  });
}

/**
 * Build user profile response
 */
function buildUserProfile(user: {
  id: string;
  fullName: string;
  email: string;
  role: "sudo" | "partner" | "advisor" | "user";
  avatarUrl: string | null;
}): UserProfile {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
  };
}

// =============================================================================
// User Synchronization
// =============================================================================

/**
 * Ensure user exists in database
 * Creates new user on first login, updates profile on subsequent logins
 *
 * Call this on app load to maintain user sync
 */
export async function ensureUser(): Promise<EnsureUserResult> {
  const authUser = await getAuthenticatedUser();
  const now = new Date();

  const existingUser = await findExistingUser(authUser.id);

  if (existingUser) {
    // Update existing user with latest profile data
    await db
      .update(shared.users)
      .set({
        email: authUser.email,
        fullName: authUser.name || existingUser.fullName,
        avatarUrl: authUser.image || existingUser.avatarUrl,
        lastLoginAt: now,
        updatedAt: now,
      })
      .where(eq(shared.users.id, existingUser.id));

    revalidatePath("/");
    return { userId: existingUser.id, isNew: false };
  }

  // Create new user
  const [newUser] = await db
    .insert(shared.users)
    .values({
      authProviderId: authUser.id,
      email: authUser.email,
      emailVerified: authUser.emailVerified || false,
      fullName: authUser.name || authUser.email.split("@")[0],
      avatarUrl: authUser.image || null,
      role: "user",
      lastLoginAt: now,
    })
    .returning();

  revalidatePath("/");
  return { userId: newUser.id, isNew: true };
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const authUser = await getAuthenticatedUser();

    const user = await db.query.users.findFirst({
      where: eq(shared.users.authProviderId, authUser.id),
      columns: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        avatarUrl: true,
      },
    });

    if (!user) return null;

    return buildUserProfile(user);
  } catch {
    return null;
  }
}

// =============================================================================
// User Queries
// =============================================================================

/**
 * Get all users (for mentions, assignees, etc.)
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    await getAuthenticatedUser(); // Verify authentication

    const users = await db.query.users.findMany({
      where: eq(shared.users.isActive, true),
      columns: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        avatarUrl: true,
      },
    });

    return users.map(buildUserProfile);
  } catch {
    return [];
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<UserProfile | null> {
  try {
    await getAuthenticatedUser(); // Verify authentication

    const user = await db.query.users.findFirst({
      where: eq(shared.users.id, userId),
      columns: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        avatarUrl: true,
      },
    });

    if (!user) return null;

    return buildUserProfile(user);
  } catch {
    return null;
  }
}

/**
 * Get user by auth provider ID (for internal use)
 */
export async function getUserByAuthProviderId(
  authProviderId: string
): Promise<UserProfile | null> {
  const user = await db.query.users.findFirst({
    where: eq(shared.users.authProviderId, authProviderId),
    columns: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      avatarUrl: true,
    },
  });

  if (!user) return null;

  return buildUserProfile(user);
}
