"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { logger } from "../lib/logger";
import { actionSuccess, actionError, type ActionResult } from "../lib/env";

/**
 * Data Export/Backup Actions
 *
 * Export user data for backup or data portability.
 * Supports JSON export of all user data.
 */

interface ExportData {
	exportedAt: string;
	version: string;
	user: {
		id: string;
		email?: string;
		name?: string;
	};
	deals: unknown[];
	companies: unknown[];
	contacts: unknown[];
	documents: unknown[];
	calendarEvents: unknown[];
	presentations: unknown[];
}

/**
 * Export all user data to JSON
 */
export const exportAllData = action({
	args: {},
	handler: async (
		ctx,
	): Promise<ActionResult<{ base64: string; filename: string }>> => {
		try {
			// Get current user
			const user = await ctx.runQuery(internal.dataExport.getCurrentUser);
			if (!user) {
				return actionError("User not authenticated", "UNAUTHORIZED");
			}

			// Gather all user data
			const [
				deals,
				companies,
				contacts,
				documents,
				calendarEvents,
				presentations,
			] = await Promise.all([
				ctx.runQuery(internal.dataExport.getUserDeals, { userId: user._id }),
				ctx.runQuery(internal.dataExport.getUserCompanies),
				ctx.runQuery(internal.dataExport.getUserContacts),
				ctx.runQuery(internal.dataExport.getUserDocuments, {
					userId: user.clerkId,
				}),
				ctx.runQuery(internal.dataExport.getUserCalendarEvents, {
					userId: user._id,
				}),
				ctx.runQuery(internal.dataExport.getUserPresentations, {
					userId: user.clerkId,
				}),
			]);

			// Build export object
			const exportData: ExportData = {
				exportedAt: new Date().toISOString(),
				version: "1.0",
				user: {
					id: user._id,
					email: user.email,
					name: user.name,
				},
				deals: deals.map(sanitizeForExport),
				companies: companies.map(sanitizeForExport),
				contacts: contacts.map(sanitizeForExport),
				documents: documents.map(sanitizeForExport),
				calendarEvents: calendarEvents.map(sanitizeForExport),
				presentations: presentations.map(sanitizeForExport),
			};

			// Convert to JSON
			const jsonString = JSON.stringify(exportData, null, 2);
			const base64 = Buffer.from(jsonString).toString("base64");

			const date = new Date().toISOString().split("T")[0];
			const filename = `alecia-export-${date}.json`;

			logger.info("[Data Export] Export completed", {
				userId: user._id,
				dealsCount: deals.length,
				companiesCount: companies.length,
				contactsCount: contacts.length,
				documentsCount: documents.length,
				calendarEventsCount: calendarEvents.length,
				presentationsCount: presentations.length,
			});

			return actionSuccess({ base64, filename });
		} catch (error) {
			logger.error("[Data Export] Export failed", { error: String(error) });
			return actionError(
				`Failed to export data: ${(error as Error).message}`,
				"EXPORT_ERROR",
			);
		}
	},
});

/**
 * Export specific entity type
 */
export const exportEntity = action({
	args: {
		entityType: v.union(
			v.literal("deals"),
			v.literal("companies"),
			v.literal("contacts"),
			v.literal("documents"),
			v.literal("calendar_events"),
			v.literal("presentations"),
		),
		format: v.optional(v.union(v.literal("json"), v.literal("csv"))),
	},
	handler: async (
		ctx,
		args,
	): Promise<ActionResult<{ base64: string; filename: string }>> => {
		try {
			// Get current user
			const user = await ctx.runQuery(internal.dataExport.getCurrentUser);
			if (!user) {
				return actionError("User not authenticated", "UNAUTHORIZED");
			}

			let data: unknown[] = [];
			const format = args.format ?? "json";

			// Fetch requested entity type
			switch (args.entityType) {
				case "deals":
					data = await ctx.runQuery(internal.dataExport.getUserDeals, {
						userId: user._id,
					});
					break;
				case "companies":
					data = await ctx.runQuery(internal.dataExport.getUserCompanies);
					break;
				case "contacts":
					data = await ctx.runQuery(internal.dataExport.getUserContacts);
					break;
				case "documents":
					data = await ctx.runQuery(internal.dataExport.getUserDocuments, {
						userId: user.clerkId,
					});
					break;
				case "calendar_events":
					data = await ctx.runQuery(internal.dataExport.getUserCalendarEvents, {
						userId: user._id,
					});
					break;
				case "presentations":
					data = await ctx.runQuery(internal.dataExport.getUserPresentations, {
						userId: user.clerkId,
					});
					break;
			}

			const sanitizedData = data.map(sanitizeForExport);
			let content: string;
			let mimeType: string;
			let extension: string;

			if (format === "csv") {
				content = convertToCSV(sanitizedData);
				mimeType = "text/csv";
				extension = "csv";
			} else {
				content = JSON.stringify(sanitizedData, null, 2);
				mimeType = "application/json";
				extension = "json";
			}

			const base64 = Buffer.from(content).toString("base64");
			const date = new Date().toISOString().split("T")[0];
			const filename = `${args.entityType}-${date}.${extension}`;

			logger.info("[Data Export] Entity export completed", {
				userId: user._id,
				entityType: args.entityType,
				count: data.length,
				format,
			});

			return actionSuccess({ base64, filename });
		} catch (error) {
			logger.error("[Data Export] Entity export failed", {
				error: String(error),
			});
			return actionError(
				`Failed to export ${args.entityType}: ${(error as Error).message}`,
				"EXPORT_ERROR",
			);
		}
	},
});

// Helper functions

function sanitizeForExport(obj: unknown): unknown {
	if (obj === null || obj === undefined) return obj;
	if (typeof obj !== "object") return obj;

	const result: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
		// Skip internal Convex fields
		if (key === "_creationTime") continue;

		// Convert ID objects to strings
		if (
			value &&
			typeof value === "object" &&
			"__tableName" in (value as object)
		) {
			result[key] = String(value);
			continue;
		}

		// Recursively sanitize nested objects
		if (Array.isArray(value)) {
			result[key] = value.map(sanitizeForExport);
		} else if (typeof value === "object") {
			result[key] = sanitizeForExport(value);
		} else {
			result[key] = value;
		}
	}
	return result;
}

function convertToCSV(data: unknown[]): string {
	if (data.length === 0) return "";

	// Get all unique keys from all objects
	const allKeys = new Set<string>();
	for (const item of data) {
		if (item && typeof item === "object") {
			for (const key of Object.keys(item)) {
				allKeys.add(key);
			}
		}
	}

	const headers = Array.from(allKeys);

	// Build CSV rows
	const rows: string[] = [];

	// Header row
	rows.push(headers.map(escapeCSV).join(","));

	// Data rows
	for (const item of data) {
		if (item && typeof item === "object") {
			const obj = item as Record<string, unknown>;
			const values = headers.map((key) => {
				const value = obj[key];
				if (value === null || value === undefined) return "";
				if (typeof value === "object") return escapeCSV(JSON.stringify(value));
				return escapeCSV(String(value));
			});
			rows.push(values.join(","));
		}
	}

	return rows.join("\n");
}

function escapeCSV(value: string): string {
	// If the value contains comma, quote, or newline, wrap in quotes
	if (value.includes(",") || value.includes('"') || value.includes("\n")) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}
