"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import "isomorphic-fetch";
import { Client } from "@microsoft/microsoft-graph-client";
import { logger } from "../lib/logger";
import { internal } from "../_generated/api";
import {
	checkIntegration,
	actionError,
	actionSuccess,
	getEnvOrDefault,
	hasEnv,
	type ActionResult,
} from "../lib/env";

// ============================================
// OAUTH CONFIGURATION
// ============================================

function getMicrosoftConfig() {
	return {
		clientId: process.env.MICROSOFT_CLIENT_ID,
		clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
		tenantId: process.env.MICROSOFT_TENANT_ID || "common",
		redirectUri:
			getEnvOrDefault("NEXT_PUBLIC_APP_URL", "http://localhost:3000") +
			"/api/auth/microsoft/callback",
	};
}

// ============================================
// OAUTH FLOW ACTIONS
// ============================================

/**
 * Get Microsoft OAuth authorization URL
 */
export const getAuthUrl = action({
	args: {},
	handler: async (): Promise<ActionResult<string>> => {
		const integrationError = checkIntegration("microsoft");
		if (integrationError) return integrationError;

		const config = getMicrosoftConfig();
		if (!config.clientId) {
			return actionError(
				"Microsoft OAuth is not configured",
				"INTEGRATION_DISABLED",
			);
		}

		const scopes = [
			"openid",
			"profile",
			"email",
			"offline_access", // For refresh token
			"User.Read",
			"Files.Read",
			"Files.ReadWrite",
			"Calendars.Read",
			"Calendars.ReadWrite",
		].join(" ");

		const authUrl = new URL(
			`https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/authorize`,
		);
		authUrl.searchParams.set("client_id", config.clientId);
		authUrl.searchParams.set("response_type", "code");
		authUrl.searchParams.set("redirect_uri", config.redirectUri);
		authUrl.searchParams.set("scope", scopes);
		authUrl.searchParams.set("response_mode", "query");
		authUrl.searchParams.set("state", crypto.randomUUID());

		return actionSuccess(authUrl.toString());
	},
});

/**
 * Exchange authorization code for access token
 */
export const exchangeCodeForToken = action({
	args: { code: v.string() },
	handler: async (ctx, args): Promise<ActionResult<{ userId?: string }>> => {
		const integrationError = checkIntegration("microsoft");
		if (integrationError) return integrationError;

		const config = getMicrosoftConfig();
		if (!config.clientId || !config.clientSecret) {
			logger.error("[Microsoft] OAuth credentials missing");
			return actionError(
				"Microsoft OAuth credentials are not configured",
				"INTEGRATION_DISABLED",
			);
		}

		try {
			const tokenResponse = await fetch(
				`https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					body: new URLSearchParams({
						client_id: config.clientId,
						client_secret: config.clientSecret,
						code: args.code,
						redirect_uri: config.redirectUri,
						grant_type: "authorization_code",
					}),
				},
			);

			if (!tokenResponse.ok) {
				const errorData = await tokenResponse.json();
				logger.error("[Microsoft] Token exchange failed", {
					status: tokenResponse.status,
					error: errorData.error_description || errorData.error,
				});
				return actionError(
					`OAuth error: ${errorData.error_description || "Authentication failed"}`,
					"API_ERROR",
				);
			}

			const tokens = await tokenResponse.json();

			if (!tokens.access_token) {
				logger.error(
					"[Microsoft] Invalid token response - missing access_token",
				);
				return actionError("Invalid OAuth response", "API_ERROR");
			}

			// Store tokens securely
			await ctx.runMutation(internal.microsoft_db.storeTokens, {
				accessToken: tokens.access_token,
				refreshToken: tokens.refresh_token || "",
				expiresAt: Date.now() + (tokens.expires_in || 3600) * 1000,
				userId: undefined, // Will be populated if we fetch profile
			});

			logger.info("[Microsoft] OAuth tokens stored");
			return actionSuccess({ userId: undefined });
		} catch (error) {
			logger.error("[Microsoft] Unexpected error in token exchange", {
				error: String(error),
			});
			return actionError(
				`Microsoft authentication failed: ${(error as Error).message}`,
				"API_ERROR",
			);
		}
	},
});

/**
 * Check if connected to Microsoft
 */
export const isConnected = action({
	args: {},
	handler: async (ctx): Promise<ActionResult<{ connected: boolean }>> => {
		if (!hasEnv("MICROSOFT_CLIENT_ID")) {
			return actionSuccess({ connected: false });
		}

		const tokens = await ctx.runQuery(internal.microsoft_db.getStoredTokens);
		const connected = !!tokens && Date.now() < tokens.expiresAt;
		return actionSuccess({ connected });
	},
});

/**
 * Get stored access token (for use in other actions)
 * Refreshes if expired
 */
export const getAccessToken = action({
	args: {},
	handler: async (ctx): Promise<ActionResult<string>> => {
		const integrationError = checkIntegration("microsoft");
		if (integrationError) return integrationError;

		const tokens = await ctx.runQuery(internal.microsoft_db.getStoredTokens);
		if (!tokens) {
			return actionError(
				"Not connected to Microsoft. Please authenticate first.",
				"MISSING_CONFIG",
			);
		}

		// Check if token needs refresh
		if (Date.now() > tokens.expiresAt - 60000) {
			if (!tokens.refreshToken) {
				return actionError(
					"Microsoft session expired. Please reconnect.",
					"API_ERROR",
				);
			}

			// Refresh the token
			const config = getMicrosoftConfig();
			if (!config.clientId || !config.clientSecret) {
				return actionError(
					"Microsoft OAuth credentials are not configured",
					"INTEGRATION_DISABLED",
				);
			}

			try {
				const response = await fetch(
					`https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/x-www-form-urlencoded",
						},
						body: new URLSearchParams({
							client_id: config.clientId,
							client_secret: config.clientSecret,
							refresh_token: tokens.refreshToken,
							grant_type: "refresh_token",
						}),
					},
				);

				if (!response.ok) {
					return actionError(
						"Failed to refresh Microsoft token. Please reconnect.",
						"API_ERROR",
					);
				}

				const newTokens = await response.json();

				await ctx.runMutation(internal.microsoft_db.storeTokens, {
					accessToken: newTokens.access_token,
					refreshToken: newTokens.refresh_token || tokens.refreshToken,
					expiresAt: Date.now() + (newTokens.expires_in || 3600) * 1000,
				});

				return actionSuccess(newTokens.access_token);
			} catch (error) {
				logger.error("[Microsoft] Token refresh failed", {
					error: String(error),
				});
				return actionError(
					"Microsoft session expired. Please reconnect.",
					"API_ERROR",
				);
			}
		}

		return actionSuccess(tokens.accessToken);
	},
});

// ============================================
// GRAPH API HELPERS
// ============================================

// Helper to init client with user's access token from Clerk OAuth
const getGraphClient = (accessToken: string) => {
	return Client.init({
		authProvider: (done) => {
			done(null, accessToken);
		},
	});
};

/**
 * List files in OneDrive root or a specific folder
 */
export const getOneDriveFiles = action({
	args: {
		accessToken: v.string(),
		folderId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const client = getGraphClient(args.accessToken);

		try {
			const endpoint = args.folderId
				? `/me/drive/items/${args.folderId}/children`
				: "/me/drive/root/children";

			const response = await client
				.api(endpoint)
				.select(
					"id,name,webUrl,size,lastModifiedDateTime,folder,file,parentReference",
				)
				.orderby("name")
				.get();

			return response.value.map((item: Record<string, unknown>) => ({
				id: item.id,
				name: item.name,
				webUrl: item.webUrl,
				size: item.size || 0,
				lastModified: item.lastModifiedDateTime,
				type: item.folder ? "folder" : "file",
				mimeType: (item.file as Record<string, string>)?.mimeType,
				driveId: (item.parentReference as Record<string, string>)?.driveId,
			}));
		} catch (error) {
			logger.error("Graph API Error", { error: String(error) });
			throw new Error("Failed to fetch OneDrive files");
		}
	},
});

/**
 * Search for files in OneDrive by name or content
 */
export const searchOneDriveFiles = action({
	args: {
		accessToken: v.string(),
		query: v.string(),
	},
	handler: async (ctx, args) => {
		const client = getGraphClient(args.accessToken);

		try {
			const response = await client
				.api(`/me/drive/root/search(q='${encodeURIComponent(args.query)}')`)
				.select("id,name,webUrl,size,lastModifiedDateTime,file,parentReference")
				.top(25)
				.get();

			return response.value.map((item: Record<string, unknown>) => ({
				id: item.id,
				name: item.name,
				webUrl: item.webUrl,
				size: item.size || 0,
				lastModified: item.lastModifiedDateTime,
				mimeType: (item.file as Record<string, string>)?.mimeType,
				driveId: (item.parentReference as Record<string, string>)?.driveId,
				path: (item.parentReference as Record<string, string>)?.path,
			}));
		} catch (error) {
			logger.error("Graph API Search Error", { error: String(error) });
			throw new Error("Failed to search OneDrive files");
		}
	},
});

/**
 * Get an editable link for a file (opens in Office Online)
 */
export const getEditableLink = action({
	args: {
		accessToken: v.string(),
		fileId: v.string(),
	},
	handler: async (ctx, args) => {
		const client = getGraphClient(args.accessToken);
		const item = await client
			.api(`/me/drive/items/${args.fileId}`)
			.select("webUrl")
			.get();
		return item.webUrl;
	},
});

/**
 * Create a sharing link with edit permissions
 */
export const createSharingLink = action({
	args: {
		accessToken: v.string(),
		driveId: v.string(),
		fileId: v.string(),
		scope: v.optional(
			v.union(v.literal("anonymous"), v.literal("organization")),
		),
	},
	handler: async (ctx, args) => {
		const client = getGraphClient(args.accessToken);

		try {
			const response = await client
				.api(`/drives/${args.driveId}/items/${args.fileId}/createLink`)
				.post({
					type: "edit",
					scope: args.scope || "organization",
				});

			return {
				shareId: response.id,
				webUrl: response.link.webUrl,
				scope: response.link.scope,
			};
		} catch (error) {
			logger.error("Graph API Sharing Error", { error: String(error) });
			throw new Error("Failed to create sharing link");
		}
	},
});

/**
 * Read data from an Excel file range
 * This is the "Game Changer" for M&A - import financial data directly!
 */
export const readExcelRange = action({
	args: {
		accessToken: v.string(),
		driveId: v.string(),
		fileId: v.string(),
		sheetName: v.string(),
		range: v.string(), // e.g., "A1:D10" or "B2:B50"
	},
	handler: async (ctx, args) => {
		const client = getGraphClient(args.accessToken);

		try {
			const response = await client
				.api(
					`/drives/${args.driveId}/items/${args.fileId}/workbook/worksheets/${encodeURIComponent(args.sheetName)}/range(address='${args.range}')`,
				)
				.get();

			return {
				values: response.values,
				address: response.address,
				rowCount: response.rowCount,
				columnCount: response.columnCount,
				formulas: response.formulas,
			};
		} catch (error) {
			logger.error("Excel Read Error", {
				error: String(error),
				range: args.range,
			});
			throw new Error(`Failed to read Excel range: ${args.range}`);
		}
	},
});

/**
 * Get list of worksheets in an Excel file
 */
export const getExcelWorksheets = action({
	args: {
		accessToken: v.string(),
		driveId: v.string(),
		fileId: v.string(),
	},
	handler: async (ctx, args) => {
		const client = getGraphClient(args.accessToken);

		try {
			const response = await client
				.api(`/drives/${args.driveId}/items/${args.fileId}/workbook/worksheets`)
				.get();

			return response.value.map((sheet: Record<string, unknown>) => ({
				id: sheet.id,
				name: sheet.name,
				position: sheet.position,
				visibility: sheet.visibility,
			}));
		} catch (error) {
			logger.error("Excel Worksheets Error", { error: String(error) });
			throw new Error("Failed to get Excel worksheets");
		}
	},
});

/**
 * Get used range (auto-detect data bounds) from an Excel worksheet
 */
export const getExcelUsedRange = action({
	args: {
		accessToken: v.string(),
		driveId: v.string(),
		fileId: v.string(),
		sheetName: v.string(),
	},
	handler: async (ctx, args) => {
		const client = getGraphClient(args.accessToken);

		try {
			const response = await client
				.api(
					`/drives/${args.driveId}/items/${args.fileId}/workbook/worksheets/${encodeURIComponent(args.sheetName)}/usedRange`,
				)
				.get();

			return {
				values: response.values,
				address: response.address,
				rowCount: response.rowCount,
				columnCount: response.columnCount,
			};
		} catch (error) {
			logger.error("Excel Used Range Error", { error: String(error) });
			throw new Error("Failed to get Excel used range");
		}
	},
});

/**
 * Write data to an Excel file range
 */
export const writeExcelRange = action({
	args: {
		accessToken: v.string(),
		driveId: v.string(),
		fileId: v.string(),
		sheetName: v.string(),
		range: v.string(),
		values: v.array(
			v.array(v.union(v.string(), v.number(), v.boolean(), v.null())),
		),
	},
	handler: async (ctx, args) => {
		const client = getGraphClient(args.accessToken);

		try {
			await client
				.api(
					`/drives/${args.driveId}/items/${args.fileId}/workbook/worksheets/${encodeURIComponent(args.sheetName)}/range(address='${args.range}')`,
				)
				.patch({ values: args.values });

			return { success: true };
		} catch (error) {
			logger.error("Excel Write Error", {
				error: String(error),
				range: args.range,
			});
			throw new Error(`Failed to write to Excel range: ${args.range}`);
		}
	},
});

/**
 * Get Microsoft user profile from Graph API
 */
export const getMicrosoftProfile = action({
	args: {
		accessToken: v.string(),
	},
	handler: async (ctx, args) => {
		const client = getGraphClient(args.accessToken);

		try {
			const user = await client
				.api("/me")
				.select("id,displayName,mail,userPrincipalName,jobTitle,officeLocation")
				.get();

			return {
				id: user.id,
				displayName: user.displayName,
				email: user.mail || user.userPrincipalName,
				jobTitle: user.jobTitle,
				officeLocation: user.officeLocation,
			};
		} catch (error) {
			logger.error("Profile Error", { error: String(error) });
			throw new Error("Failed to get Microsoft profile");
		}
	},
});

/**
 * Create a folder in OneDrive (useful for Data Room structure)
 */
export const createOneDriveFolder = action({
	args: {
		accessToken: v.string(),
		parentFolderId: v.optional(v.string()),
		folderName: v.string(),
	},
	handler: async (ctx, args) => {
		const client = getGraphClient(args.accessToken);

		try {
			const endpoint = args.parentFolderId
				? `/me/drive/items/${args.parentFolderId}/children`
				: "/me/drive/root/children";

			const response = await client.api(endpoint).post({
				name: args.folderName,
				folder: {},
				"@microsoft.graph.conflictBehavior": "rename",
			});

			return {
				id: response.id,
				name: response.name,
				webUrl: response.webUrl,
				driveId: response.parentReference?.driveId,
			};
		} catch (error) {
			logger.error("Create Folder Error", { error: String(error) });
			throw new Error("Failed to create OneDrive folder");
		}
	},
});

/**
 * Helper: Extract key financial metrics from Excel data
 * Maps common French accounting terms to standard fields
 */
export const parseFinancialExcelData = action({
	args: {
		values: v.array(
			v.array(v.union(v.string(), v.number(), v.boolean(), v.null())),
		),
	},
	handler: async (ctx, args) => {
		const data = args.values;
		const metrics: Record<string, number | undefined> = {};

		// Common French financial terms to look for
		const patterns: Record<string, RegExp> = {
			revenue: /chiffre\s*d['']?affaires|ca\s*ht|total\s*ventes/i,
			ebitda: /ebitda|ebe|excédent\s*brut/i,
			netResult: /résultat\s*net|bénéfice\s*net/i,
			equity: /capitaux\s*propres|fonds\s*propres/i,
			netDebt: /dette\s*nette|endettement/i,
			employees: /effectif|salariés|employés/i,
		};

		// Scan for patterns in labels and extract adjacent values
		for (let row = 0; row < data.length; row++) {
			for (let col = 0; col < data[row].length; col++) {
				const cell = data[row][col];
				if (typeof cell !== "string") continue;

				for (const [key, pattern] of Object.entries(patterns)) {
					if (pattern.test(cell)) {
						// Look for number in next column or same row
						const nextCell = data[row][col + 1];
						if (typeof nextCell === "number") {
							metrics[key] = nextCell;
						}
					}
				}
			}
		}

		return metrics;
	},
});
