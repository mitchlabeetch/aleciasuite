/**
 * Feature Flags Server Actions
 *
 * Gradual rollout system with multiple strategies.
 * Ported from convex/featureFlags.ts (609 lines)
 *
 * Strategies: all, none, percentage, users, roles, domains
 */

"use server";

import { db, shared, sql, eq, and } from "@alepanel/db";
import { getAuthenticatedUser } from "./lib/auth";
import { revalidatePath } from "next/cache";

// ============================================
// TYPES
// ============================================

type RolloutStrategy = "all" | "none" | "percentage" | "users" | "roles" | "domains";
type FlagCategory = "feature" | "experiment" | "ops" | "release";

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  rolloutStrategy: RolloutStrategy;
  rolloutPercentage?: number;
  allowedUserIds?: string[];
  allowedRoles?: string[];
  allowedDomains?: string[];
  environments?: string[];
  category?: FlagCategory;
  expiresAt?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// HELPERS
// ============================================

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function getCurrentEnv(): string {
  return process.env.NODE_ENV === "production"
    ? "production"
    : process.env.NODE_ENV === "development"
      ? "development"
      : "staging";
}

// ============================================
// QUERIES
// ============================================

/**
 * List all feature flags
 */
export async function listFlags(args?: {
  category?: FlagCategory;
  enabledOnly?: boolean;
}) {
  await getAuthenticatedUser();

  let query = db.select().from(shared.featureFlags);

  if (args?.enabledOnly && args?.category) {
    query = query.where(
      and(
        eq(shared.featureFlags.enabled, true),
        eq(shared.featureFlags.category, args.category)
      )
    ) as typeof query;
  } else if (args?.enabledOnly) {
    query = query.where(eq(shared.featureFlags.enabled, true)) as typeof query;
  } else if (args?.category) {
    query = query.where(eq(shared.featureFlags.category, args.category)) as typeof query;
  }

  const result = await query;
  return result.map((flag) => ({
    ...flag,
    enabled: flag.enabled ?? false,
    rolloutStrategy: flag.rolloutStrategy ?? "none",
    createdAt: flag.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: flag.updatedAt?.toISOString() ?? new Date().toISOString(),
  })) as unknown as FeatureFlag[];
}

/**
 * Get a single feature flag by key
 */
export async function getFlagByKey(key: string) {
  const result = await db
    .select()
    .from(shared.featureFlags)
    .where(eq(shared.featureFlags.key, key))
    .limit(1);

  return (result[0] as unknown as FeatureFlag) || null;
}

/**
 * Check if a feature flag is enabled for the current user
 */
export async function isFlagEnabled(key: string): Promise<boolean> {
  const user = await getAuthenticatedUser();

  const result = await db
    .select()
    .from(shared.featureFlags)
    .where(eq(shared.featureFlags.key, key))
    .limit(1);

  const flag = result[0] as Record<string, unknown> | undefined;

  if (!flag || !flag.enabled) return false;

  // Check expiration
  if (flag.expiresAt && flag.expiresAt < Date.now()) return false;

  // Check environment
  if (flag.environments && flag.environments.length > 0) {
    if (!flag.environments.includes(getCurrentEnv())) return false;
  }

  // Evaluate rollout strategy
  switch (flag.rolloutStrategy) {
    case "all":
      return true;
    case "none":
      return false;
    case "percentage": {
      const hash = simpleHash(user.id + flag.key);
      const bucket = hash % 100;
      return bucket < (flag.rolloutPercentage ?? 0);
    }
    case "users":
      return flag.allowedUserIds?.includes(user.id) ?? false;
    case "roles":
      return flag.allowedRoles?.includes((user as Record<string, unknown>).role as string) ?? false;
    case "domains": {
      const userDomain = user.email?.split("@")[1];
      return flag.allowedDomains?.includes(userDomain) ?? false;
    }
    default:
      return false;
  }
}

/**
 * Get all enabled flags for the current user (returns map)
 */
export async function getEnabledFlags(): Promise<Record<string, boolean>> {
  const user = await getAuthenticatedUser();

  const flags = await db
    .select()
    .from(shared.featureFlags)
    .where(eq(shared.featureFlags.enabled, true));

  const flagMap: Record<string, boolean> = {};

  for (const flag of flags) {
    if (flag.expiresAt && flag.expiresAt < Date.now()) {
      flagMap[flag.key] = false;
      continue;
    }

    if (flag.environments && flag.environments.length > 0 && !flag.environments.includes(getCurrentEnv())) {
      flagMap[flag.key] = false;
      continue;
    }

    switch (flag.rolloutStrategy) {
      case "all":
        flagMap[flag.key] = true;
        break;
      case "none":
        flagMap[flag.key] = false;
        break;
      case "percentage": {
        const hash = simpleHash(user.id + flag.key);
        flagMap[flag.key] = (hash % 100) < (flag.rolloutPercentage ?? 0);
        break;
      }
      case "users":
        flagMap[flag.key] = flag.allowedUserIds?.includes(user.id) ?? false;
        break;
      case "roles":
        flagMap[flag.key] = flag.allowedRoles?.includes((user as Record<string, unknown>).role as string) ?? false;
        break;
      case "domains": {
        const domain = user.email?.split("@")[1];
        flagMap[flag.key] = flag.allowedDomains?.includes(domain) ?? false;
        break;
      }
      default:
        flagMap[flag.key] = false;
    }
  }

  return flagMap;
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new feature flag
 */
export async function createFlag(args: {
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  rolloutStrategy: RolloutStrategy;
  rolloutPercentage?: number;
  allowedUserIds?: string[];
  allowedRoles?: string[];
  allowedDomains?: string[];
  environments?: string[];
  category?: FlagCategory;
  expiresAt?: number;
}) {
  const user = await getAuthenticatedUser();

  // Check for duplicate key
  const existing = await getFlagByKey(args.key);
  if (existing) {
    throw new Error(`Feature flag with key "${args.key}" already exists`);
  }

  const [result] = await db
    .insert(shared.featureFlags)
    .values({
      key: args.key,
      name: args.name,
      description: args.description ?? null,
      enabled: args.enabled,
      rolloutStrategy: args.rolloutStrategy,
      rolloutPercentage: args.rolloutPercentage ?? null,
      allowedUserIds: args.allowedUserIds ?? [],
      allowedRoles: args.allowedRoles ?? [],
      allowedDomains: args.allowedDomains ?? [],
      environments: args.environments ?? [],
      category: args.category ?? null,
      expiresAt: args.expiresAt ?? null,
      createdBy: user.id,
    })
    .returning({ id: shared.featureFlags.id });

  revalidatePath("/admin/feature-flags");
  return result;
}

/**
 * Update a feature flag
 */
export async function updateFlag(
  id: string,
  updates: Partial<{
    name: string;
    description: string;
    enabled: boolean;
    rolloutStrategy: RolloutStrategy;
    rolloutPercentage: number;
    allowedUserIds: string[];
    allowedRoles: string[];
    allowedDomains: string[];
    environments: string[];
    category: FlagCategory;
    expiresAt: number;
  }>
) {
  await getAuthenticatedUser();

  // Build update object dynamically
  const updateData: Record<string, unknown> = {};

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.enabled !== undefined) updateData.enabled = updates.enabled;
  if (updates.rolloutStrategy !== undefined) updateData.rolloutStrategy = updates.rolloutStrategy;
  if (updates.rolloutPercentage !== undefined) updateData.rolloutPercentage = updates.rolloutPercentage;
  if (updates.allowedUserIds !== undefined) updateData.allowedUserIds = updates.allowedUserIds;
  if (updates.allowedRoles !== undefined) updateData.allowedRoles = updates.allowedRoles;
  if (updates.allowedDomains !== undefined) updateData.allowedDomains = updates.allowedDomains;
  if (updates.environments !== undefined) updateData.environments = updates.environments;
  if (updates.category !== undefined) updateData.category = updates.category;
  if (updates.expiresAt !== undefined) updateData.expiresAt = updates.expiresAt;

  updateData.updatedAt = new Date();

  await db
    .update(shared.featureFlags)
    .set(updateData)
    .where(eq(shared.featureFlags.id, id));

  revalidatePath("/admin/feature-flags");
}

/**
 * Toggle a feature flag on/off
 */
export async function toggleFlag(id: string) {
  await getAuthenticatedUser();

  // Get current value
  const [current] = await db
    .select({ enabled: shared.featureFlags.enabled })
    .from(shared.featureFlags)
    .where(eq(shared.featureFlags.id, id));

  if (!current) return;

  await db
    .update(shared.featureFlags)
    .set({ enabled: !current.enabled, updatedAt: new Date() })
    .where(eq(shared.featureFlags.id, id));

  revalidatePath("/admin/feature-flags");
}

/**
 * Delete a feature flag and its assignments
 */
export async function removeFlag(id: string) {
  await getAuthenticatedUser();

  // Get the flag key for assignment cleanup
  const [flag] = await db
    .select({ key: shared.featureFlags.key })
    .from(shared.featureFlags)
    .where(eq(shared.featureFlags.id, id));

  if (flag) {
    // Delete assignments
    await db
      .delete(shared.featureFlagAssignments)
      .where(eq(shared.featureFlagAssignments.flagKey, flag.key));
  }

  await db
    .delete(shared.featureFlags)
    .where(eq(shared.featureFlags.id, id));

  revalidatePath("/admin/feature-flags");
}

/**
 * Update rollout percentage
 */
export async function updatePercentage(id: string, percentage: number) {
  await getAuthenticatedUser();

  if (percentage < 0 || percentage > 100) {
    throw new Error("Percentage must be between 0 and 100");
  }

  await db
    .update(shared.featureFlags)
    .set({
      rolloutPercentage: percentage,
      rolloutStrategy: "percentage",
      updatedAt: new Date(),
    })
    .where(eq(shared.featureFlags.id, id));

  revalidatePath("/admin/feature-flags");
}

/**
 * Add user to flag's allowed list
 */
export async function addUserToFlag(flagId: string, userId: string) {
  await getAuthenticatedUser();

  // Use PostgreSQL array_append via raw SQL for array operations
  await db.execute(sql`
    UPDATE shared.feature_flags
    SET allowed_user_ids = array_append(
      COALESCE(allowed_user_ids, ARRAY[]::text[]),
      ${userId}
    ),
    updated_at = NOW()
    WHERE id = ${flagId}
    AND NOT (${userId} = ANY(COALESCE(allowed_user_ids, ARRAY[]::text[])))
  `);

  revalidatePath("/admin/feature-flags");
}

/**
 * Remove user from flag's allowed list
 */
export async function removeUserFromFlag(flagId: string, userId: string) {
  await getAuthenticatedUser();

  // Use PostgreSQL array_remove via raw SQL for array operations
  await db.execute(sql`
    UPDATE shared.feature_flags
    SET allowed_user_ids = array_remove(COALESCE(allowed_user_ids, ARRAY[]::text[]), ${userId}),
    updated_at = NOW()
    WHERE id = ${flagId}
  `);

  revalidatePath("/admin/feature-flags");
}
