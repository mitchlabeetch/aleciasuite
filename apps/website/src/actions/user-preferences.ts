"use server";

/**
 * User Preferences Module - Cross-App Sync
 *
 * Ported from Convex to Next.js Server Actions with Drizzle ORM.
 * Unified user settings that sync between Panel and Colab.
 * Provides CRUD operations for user preferences.
 */

import { db, shared, eq } from "@alepanel/db";
import { getAuthenticatedUser } from "./lib/auth";
import { revalidatePath } from "next/cache";

// =============================================================================
// Types
// =============================================================================

export interface NotificationSettings {
  emailEnabled: boolean;
  pushEnabled: boolean;
  digestFrequency: "realtime" | "hourly" | "daily" | "weekly" | "none";
  mentionsOnly?: boolean;
  dealUpdates?: boolean;
  calendarReminders?: boolean;
  approvalRequests?: boolean;
}

export interface UserPreferences {
  id: string;
  userId: string;
  theme?: string | null;
  accentColor?: string | null;
  sidebarCollapsed?: boolean | null;
  compactMode?: boolean | null;
  notifications?: NotificationSettings | null;
  locale?: string | null;
  timezone?: string | null;
  dateFormat?: string | null;
  numberFormat?: string | null;
  defaultDashboard?: string | null;
  pinnedDeals?: string[] | null;
  favoriteViews?: string[] | null;
  editorFontSize?: number | null;
  editorLineHeight?: string | null;
  editorWordWrap?: boolean | null;
  spellCheckEnabled?: boolean | null;
  defaultCalendarProvider?: string | null;
  autoLinkEmails?: boolean | null;
  keyboardShortcuts?: Record<string, string> | null;
  lastActiveApp?: string | null;
  lastActiveRoute?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertPreferencesInput {
  theme?: "light" | "dark" | "system";
  accentColor?: string;
  sidebarCollapsed?: boolean;
  compactMode?: boolean;
  notifications?: NotificationSettings;
  locale?: "fr" | "en";
  timezone?: string;
  dateFormat?: string;
  numberFormat?: string;
  defaultDashboard?: string;
  pinnedDeals?: string[];
  favoriteViews?: string[];
  editorFontSize?: number;
  editorLineHeight?: number;
  editorWordWrap?: boolean;
  spellCheckEnabled?: boolean;
  defaultCalendarProvider?: "microsoft" | "google" | "none";
  autoLinkEmails?: boolean;
  keyboardShortcuts?: Record<string, string>;
  lastActiveApp?: "panel" | "colab";
  lastActiveRoute?: string;
}

// =============================================================================
// Queries
// =============================================================================

/**
 * Get user preferences for the authenticated user
 */
export async function getUserPreferences(): Promise<UserPreferences | null> {
  try {
    const authUser = await getAuthenticatedUser();

    // Get the internal user ID
    const user = await db.query.users.findFirst({
      where: eq(shared.users.authProviderId, authUser.id),
    });

    if (!user) return null;

    const preferences = await db.query.userPreferences.findFirst({
      where: eq(shared.userPreferences.userId, user.id),
    });

    return (preferences as UserPreferences) || null;
  } catch {
    return null;
  }
}

/**
 * Get specific preference value
 */
export async function getPreferenceValue(key: string): Promise<any> {
  try {
    const authUser = await getAuthenticatedUser();

    const user = await db.query.users.findFirst({
      where: eq(shared.users.authProviderId, authUser.id),
    });

    if (!user) return null;

    const preferences = await db.query.userPreferences.findFirst({
      where: eq(shared.userPreferences.userId, user.id),
    });

    if (!preferences) return null;

    return (preferences as any)[key] ?? null;
  } catch {
    return null;
  }
}

// =============================================================================
// Mutations
// =============================================================================

/**
 * Create or update user preferences (upsert)
 */
export async function upsertUserPreferences(
  input: UpsertPreferencesInput
): Promise<string> {
  const authUser = await getAuthenticatedUser();

  const user = await db.query.users.findFirst({
    where: eq(shared.users.authProviderId, authUser.id),
  });

  if (!user) {
    throw new Error("User not found");
  }

  const now = new Date();

  // Check if preferences already exist
  const existing = await db.query.userPreferences.findFirst({
    where: eq(shared.userPreferences.userId, user.id),
  });

  // Build update object, only including defined values
  const updates: Record<string, any> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      updates[key] = value;
    }
  }
  updates.updatedAt = now;

  if (existing) {
    // Update existing preferences
    await db
      .update(shared.userPreferences)
      .set(updates)
      .where(eq(shared.userPreferences.id, existing.id));

    revalidatePath("/");
    return existing.id;
  } else {
    // Create new preferences
    const [newPreferences] = await db
      .insert(shared.userPreferences)
      .values({
        userId: user.id,
        createdAt: now,
        updatedAt: now,
        ...updates,
      })
      .returning();

    revalidatePath("/");
    return newPreferences.id;
  }
}

/**
 * Update a single preference value
 */
export async function updatePreferenceValue(
  key: string,
  value: any
): Promise<string> {
  const authUser = await getAuthenticatedUser();

  const user = await db.query.users.findFirst({
    where: eq(shared.users.authProviderId, authUser.id),
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Validate key is a valid preference field
  const validKeys = [
    "theme",
    "accentColor",
    "sidebarCollapsed",
    "compactMode",
    "notifications",
    "locale",
    "timezone",
    "dateFormat",
    "numberFormat",
    "defaultDashboard",
    "pinnedDeals",
    "favoriteViews",
    "editorFontSize",
    "editorLineHeight",
    "editorWordWrap",
    "spellCheckEnabled",
    "defaultCalendarProvider",
    "autoLinkEmails",
    "keyboardShortcuts",
    "lastActiveApp",
    "lastActiveRoute",
  ];

  if (!validKeys.includes(key)) {
    throw new Error(`Invalid preference key: ${key}`);
  }

  const now = new Date();

  // Check if preferences already exist
  const existing = await db.query.userPreferences.findFirst({
    where: eq(shared.userPreferences.userId, user.id),
  });

  if (existing) {
    await db
      .update(shared.userPreferences)
      .set({
        [key]: value,
        updatedAt: now,
      })
      .where(eq(shared.userPreferences.id, existing.id));

    revalidatePath("/");
    return existing.id;
  } else {
    // Create new preferences with just this value
    const [newPreferences] = await db
      .insert(shared.userPreferences)
      .values({
        userId: user.id,
        [key]: value,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    revalidatePath("/");
    return newPreferences.id;
  }
}

/**
 * Update last active state for cross-app sync
 */
export async function updateLastActive(
  app: "panel" | "colab",
  route: string
): Promise<string> {
  const authUser = await getAuthenticatedUser();

  const user = await db.query.users.findFirst({
    where: eq(shared.users.authProviderId, authUser.id),
  });

  if (!user) {
    throw new Error("User not found");
  }

  const now = new Date();

  const existing = await db.query.userPreferences.findFirst({
    where: eq(shared.userPreferences.userId, user.id),
  });

  if (existing) {
    await db
      .update(shared.userPreferences)
      .set({
        lastActiveApp: app,
        lastActiveRoute: route,
        updatedAt: now,
      })
      .where(eq(shared.userPreferences.id, existing.id));

    revalidatePath("/");
    return existing.id;
  } else {
    const [newPreferences] = await db
      .insert(shared.userPreferences)
      .values({
        userId: user.id,
        lastActiveApp: app,
        lastActiveRoute: route,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    revalidatePath("/");
    return newPreferences.id;
  }
}

/**
 * Toggle a boolean preference
 */
export async function togglePreference(
  key:
    | "sidebarCollapsed"
    | "compactMode"
    | "editorWordWrap"
    | "spellCheckEnabled"
    | "autoLinkEmails"
): Promise<string> {
  const authUser = await getAuthenticatedUser();

  const user = await db.query.users.findFirst({
    where: eq(shared.users.authProviderId, authUser.id),
  });

  if (!user) {
    throw new Error("User not found");
  }

  const now = new Date();

  const existing = await db.query.userPreferences.findFirst({
    where: eq(shared.userPreferences.userId, user.id),
  });

  if (existing) {
    const currentValue = (existing as any)[key];
    await db
      .update(shared.userPreferences)
      .set({
        [key]: !currentValue,
        updatedAt: now,
      })
      .where(eq(shared.userPreferences.id, existing.id));

    revalidatePath("/");
    return existing.id;
  } else {
    // Create with toggled value (default is false, so toggle to true)
    const [newPreferences] = await db
      .insert(shared.userPreferences)
      .values({
        userId: user.id,
        [key]: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    revalidatePath("/");
    return newPreferences.id;
  }
}

/**
 * Pin or unpin a deal
 */
export async function togglePinnedDeal(dealId: string): Promise<{
  pinned: boolean;
  dealId: string;
}> {
  const authUser = await getAuthenticatedUser();

  const user = await db.query.users.findFirst({
    where: eq(shared.users.authProviderId, authUser.id),
  });

  if (!user) {
    throw new Error("User not found");
  }

  const now = new Date();

  const existing = await db.query.userPreferences.findFirst({
    where: eq(shared.userPreferences.userId, user.id),
  });

  if (existing) {
    const pinnedDeals = (existing.pinnedDeals || []) as string[];
    const index = pinnedDeals.findIndex((id) => id === dealId);

    if (index >= 0) {
      // Remove from pinned
      pinnedDeals.splice(index, 1);
    } else {
      // Add to pinned
      pinnedDeals.push(dealId);
    }

    await db
      .update(shared.userPreferences)
      .set({
        pinnedDeals,
        updatedAt: now,
      })
      .where(eq(shared.userPreferences.id, existing.id));

    revalidatePath("/");
    return { pinned: index < 0, dealId };
  } else {
    // Create with this deal pinned
    await db
      .insert(shared.userPreferences)
      .values({
        userId: user.id,
        pinnedDeals: [dealId],
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    revalidatePath("/");
    return { pinned: true, dealId };
  }
}

/**
 * Reset preferences to defaults
 */
export async function resetUserPreferences(): Promise<{
  success: boolean;
  message: string;
}> {
  const authUser = await getAuthenticatedUser();

  const user = await db.query.users.findFirst({
    where: eq(shared.users.authProviderId, authUser.id),
  });

  if (!user) {
    throw new Error("User not found");
  }

  const existing = await db.query.userPreferences.findFirst({
    where: eq(shared.userPreferences.userId, user.id),
  });

  if (existing) {
    await db
      .delete(shared.userPreferences)
      .where(eq(shared.userPreferences.id, existing.id));
  }

  revalidatePath("/");
  return { success: true, message: "Preferences reset to defaults" };
}
