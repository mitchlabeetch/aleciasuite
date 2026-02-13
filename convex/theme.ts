import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Theme settings schema for validation
const themeSettingsSchema = v.object({
	// Colors - Light Mode
	primaryLight: v.string(), // Titles, primary buttons (light mode)
	secondaryLight: v.string(), // Accent color (light mode)
	backgroundLight: v.string(), // Background (light mode)

	// Colors - Dark Mode
	primaryDark: v.string(), // Titles, primary buttons (dark mode)
	secondaryDark: v.string(), // Accent color (dark mode)
	backgroundDark: v.string(), // Background (dark mode)

	// Typography
	headingFont: v.string(), // Google Font for h1-h6
	bodyFont: v.string(), // Google Font for body text
});

// Default theme settings (current website state - MUST NOT CHANGE)
const DEFAULT_THEME = {
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

/**
 * Get current theme settings
 * Returns defaults if no custom theme is saved
 */
export const getThemeSettings = query({
	args: {},
	handler: async (ctx) => {
		const config = await ctx.db
			.query("global_config")
			.withIndex("by_key", (q) => q.eq("key", THEME_CONFIG_KEY))
			.unique();

		if (!config) {
			return DEFAULT_THEME;
		}

		// Merge with defaults to ensure all fields exist
		return {
			...DEFAULT_THEME,
			...(config.value as typeof DEFAULT_THEME),
		};
	},
});

/**
 * Update theme settings
 * Creates or updates the theme configuration
 */
export const updateThemeSettings = mutation({
	args: {
		settings: themeSettingsSchema,
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("global_config")
			.withIndex("by_key", (q) => q.eq("key", THEME_CONFIG_KEY))
			.unique();

		const newValue = {
			...DEFAULT_THEME,
			...args.settings,
		};

		if (existing) {
			await ctx.db.patch(existing._id, {
				value: newValue,
				updatedAt: Date.now(),
			});
		} else {
			await ctx.db.insert("global_config", {
				key: THEME_CONFIG_KEY,
				value: newValue,
				updatedAt: Date.now(),
			});
		}

		return newValue;
	},
});

/**
 * Reset theme to defaults
 */
export const resetThemeSettings = mutation({
	args: {},
	handler: async (ctx) => {
		const existing = await ctx.db
			.query("global_config")
			.withIndex("by_key", (q) => q.eq("key", THEME_CONFIG_KEY))
			.unique();

		if (existing) {
			await ctx.db.patch(existing._id, {
				value: DEFAULT_THEME,
				updatedAt: Date.now(),
			});
		}

		return DEFAULT_THEME;
	},
});
