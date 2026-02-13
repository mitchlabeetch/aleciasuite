"use server";

// Theme Settings Actions
// Ported from convex/theme.ts
// Handles brand customization (colors, fonts)

import { db, shared, sql, eq } from "@alepanel/db";
import { revalidatePath } from "next/cache";

interface ThemeSettings {
  // Colors - Light Mode
  primaryLight: string;
  secondaryLight: string;
  backgroundLight: string;

  // Colors - Dark Mode
  primaryDark: string;
  secondaryDark: string;
  backgroundDark: string;

  // Typography
  headingFont: string;
  bodyFont: string;
}

// Default theme settings (current website state - MUST NOT CHANGE)
const DEFAULT_THEME: ThemeSettings = {
  primaryLight: "#061A40", // Navy (current)
  secondaryLight: "#f59e0b", // Gold (current)
  backgroundLight: "#f8fafc", // Light slate (current)
  primaryDark: "#f1f5f9", // Light text (current)
  secondaryDark: "#f59e0b", // Gold (current)
  backgroundDark: "#020617", // Dark slate (current)
  headingFont: "Playfair Display",
  bodyFont: "Outfit",
};

const THEME_CONFIG_KEY = "theme_settings";

// ============================================
// QUERIES
// ============================================

/**
 * Get current theme settings
 * Returns defaults if no custom theme is saved
 */
export async function getThemeSettings(): Promise<ThemeSettings> {
  const result = await db
    .select({ value: shared.globalConfig.value })
    .from(shared.globalConfig)
    .where(eq(shared.globalConfig.key, THEME_CONFIG_KEY))
    .limit(1);

  if (result.length === 0) {
    return DEFAULT_THEME;
  }

  // Merge with defaults to ensure all fields exist
  return {
    ...DEFAULT_THEME,
    ...(result[0].value as Partial<ThemeSettings>),
  };
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Update theme settings
 * Creates or updates the theme configuration
 */
export async function updateThemeSettings(
  settings: ThemeSettings
): Promise<ThemeSettings> {
  const existing = await db
    .select({ id: shared.globalConfig.id })
    .from(shared.globalConfig)
    .where(eq(shared.globalConfig.key, THEME_CONFIG_KEY))
    .limit(1);

  const newValue = {
    ...DEFAULT_THEME,
    ...settings,
  };

  const now = new Date();

  if (existing.length > 0) {
    const id = existing[0].id;
    await db
      .update(shared.globalConfig)
      .set({ value: newValue, updatedAt: now })
      .where(eq(shared.globalConfig.id, id));
  } else {
    await db.insert(shared.globalConfig).values({
      key: THEME_CONFIG_KEY,
      value: newValue,
      updatedAt: now,
    });
  }

  revalidatePath("/");
  return newValue;
}

/**
 * Reset theme to defaults
 */
export async function resetThemeSettings(): Promise<ThemeSettings> {
  const existing = await db
    .select({ id: shared.globalConfig.id })
    .from(shared.globalConfig)
    .where(eq(shared.globalConfig.key, THEME_CONFIG_KEY))
    .limit(1);

  if (existing.length > 0) {
    const id = existing[0].id;
    await db
      .update(shared.globalConfig)
      .set({ value: DEFAULT_THEME, updatedAt: new Date() })
      .where(eq(shared.globalConfig.id, id));
  }

  revalidatePath("/");
  return DEFAULT_THEME;
}
