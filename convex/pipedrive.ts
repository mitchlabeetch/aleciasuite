"use node";
// Pipedrive Integration with OAuth Flow (Node.js Runtime - Actions Only)
// Database operations are in pipedrive_db.ts

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { logger } from "./lib/logger";
import {
	checkIntegration,
	actionError,
	actionSuccess,
	hasEnv,
	getEnvOrDefault,
	type ActionResult,
} from "./lib/env";

// ============================================
// OAUTH CONFIGURATION (Lazy evaluation)
// ============================================

function getPipedriveConfig() {
	return {
		clientId: process.env.PIPEDRIVE_CLIENT_ID,
		clientSecret: process.env.PIPEDRIVE_CLIENT_SECRET,
		redirectUri:
			getEnvOrDefault("NEXT_PUBLIC_APP_URL", "http://localhost:3000") +
			"/api/auth/pipedrive/callback",
	};
}

// ============================================
// OAUTH FLOW ACTIONS
// ============================================

export const getAuthUrl = action({
	args: {},
	handler: async (): Promise<ActionResult<string>> => {
		// Check if Pipedrive is configured
		const integrationError = checkIntegration("pipedrive");
		if (integrationError) return integrationError;

		const config = getPipedriveConfig();
		if (!config.clientId) {
			return actionError(
				"Pipedrive OAuth is not configured",
				"INTEGRATION_DISABLED",
			);
		}

		const scopes = [
			"deals:read",
			"deals:write",
			"organizations:read",
			"organizations:write",
			"persons:read",
			"persons:write",
		].join(" ");

		const authUrl = new URL("https://oauth.pipedrive.com/oauth/authorize");
		authUrl.searchParams.set("client_id", config.clientId);
		authUrl.searchParams.set("redirect_uri", config.redirectUri);
		authUrl.searchParams.set("scope", scopes);
		authUrl.searchParams.set("state", crypto.randomUUID());

		return actionSuccess(authUrl.toString());
	},
});

export const exchangeCodeForToken = action({
	args: { code: v.string() },
	handler: async (ctx, args): Promise<ActionResult<{ apiDomain: string }>> => {
		// Check if Pipedrive is configured
		const integrationError = checkIntegration("pipedrive");
		if (integrationError) return integrationError;

		const config = getPipedriveConfig();
		if (!config.clientId || !config.clientSecret) {
			logger.error("[Pipedrive] OAuth credentials missing");
			return actionError(
				"Pipedrive OAuth credentials are not configured",
				"INTEGRATION_DISABLED",
			);
		}

		try {
			const tokenResponse = await fetch(
				"https://oauth.pipedrive.com/oauth/token",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
						Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`,
					},
					body: new URLSearchParams({
						grant_type: "authorization_code",
						code: args.code,
						redirect_uri: config.redirectUri,
					}),
				},
			);

			if (!tokenResponse.ok) {
				const errorText = await tokenResponse.text();
				logger.error("[Pipedrive] Token exchange failed", {
					status: tokenResponse.status,
					error: errorText.substring(0, 200),
				});
				return actionError(
					`OAuth error (${tokenResponse.status}): Authentication failed`,
					"API_ERROR",
				);
			}

			const tokens = await tokenResponse.json();

			// Validate required fields before storing
			if (!tokens.access_token || !tokens.refresh_token) {
				logger.error("[Pipedrive] Invalid token response - missing fields");
				return actionError("Invalid OAuth response", "API_ERROR");
			}

			// Store tokens securely via V8 mutation
			await ctx.runMutation(internal.pipedrive_db.storeTokens, {
				accessToken: tokens.access_token,
				refreshToken: tokens.refresh_token,
				expiresAt: Date.now() + (tokens.expires_in || 3600) * 1000,
				apiDomain: tokens.api_domain || "api.pipedrive.com",
			});

			logger.info("[Pipedrive] OAuth tokens stored", {
				apiDomain: tokens.api_domain,
			});
			return actionSuccess({ apiDomain: tokens.api_domain });
		} catch (error) {
			logger.error("[Pipedrive] Unexpected error in token exchange", {
				error: String(error),
			});
			return actionError(
				`Pipedrive authentication failed: ${(error as Error).message}`,
				"API_ERROR",
			);
		}
	},
});

// ============================================
// SYNC FROM PIPEDRIVE (Pull using OAuth token)
// ============================================

interface SyncResult {
	companies: number;
	deals: number;
	contacts: number;
	errors: string[];
}

export const syncFromPipedrive = action({
	args: {},
	handler: async (ctx): Promise<ActionResult<SyncResult>> => {
		// Check if Pipedrive is configured first
		const integrationError = checkIntegration("pipedrive");
		if (integrationError) return integrationError;

		// Get stored token from V8 query
		const tokenData = await ctx.runQuery(internal.pipedrive_db.getStoredTokens);
		if (!tokenData) {
			return actionError(
				"Not connected to Pipedrive. Please authenticate first.",
				"MISSING_CONFIG",
			);
		}

		// Check if token needs refresh
		let accessToken = tokenData.accessToken;
		try {
			if (Date.now() > tokenData.expiresAt - 60000) {
				accessToken = await refreshAccessToken(ctx, tokenData.refreshToken);
			}
		} catch (error) {
			logger.error("[Pipedrive] Token refresh failed", {
				error: String(error),
			});
			return actionError(
				"Pipedrive session expired. Please reconnect.",
				"API_ERROR",
			);
		}

		const baseUrl = `https://${tokenData.apiDomain}`;
		const results = {
			companies: 0,
			deals: 0,
			contacts: 0,
			errors: [] as string[],
		};

		// 1. Sync Organizations → Companies
		try {
			const orgsResponse = await fetch(
				`${baseUrl}/v1/organizations?limit=500`,
				{
					headers: { Authorization: `Bearer ${accessToken}` },
				},
			);

			if (orgsResponse.ok) {
				const orgsData = await orgsResponse.json();
				if (orgsData.data) {
					for (const org of orgsData.data) {
						try {
							await ctx.runMutation(internal.pipedrive_db.upsertCompany, {
								pipedriveId: org.id,
								name: org.name || "Sans nom",
								address: org.address || undefined,
							});
							results.companies++;
						} catch (err) {
							results.errors.push(`Org ${org.id}: ${(err as Error).message}`);
						}
					}
				}
			} else {
				logger.warn("[Pipedrive] Organizations sync failed", {
					status: orgsResponse.status,
				});
				results.errors.push(`Organizations: HTTP ${orgsResponse.status}`);
			}
		} catch (error) {
			logger.error("[Pipedrive] Organizations sync error", {
				error: String(error),
			});
			results.errors.push(`Organizations: ${(error as Error).message}`);
		}

		// 2. Sync Persons → Contacts
		try {
			const personsResponse = await fetch(`${baseUrl}/v1/persons?limit=500`, {
				headers: { Authorization: `Bearer ${accessToken}` },
			});

			if (personsResponse.ok) {
				const personsData = await personsResponse.json();
				if (personsData.data) {
					for (const person of personsData.data) {
						try {
							let companyId = null;
							if (person.org_id?.value) {
								companyId = await ctx.runQuery(
									internal.pipedrive_db.getCompanyByPipedriveId,
									{
										pipedriveId: person.org_id.value,
									},
								);
							}

							if (companyId) {
								await ctx.runMutation(internal.pipedrive_db.upsertContact, {
									companyId,
									fullName: person.name || "Sans nom",
									email: person.email?.[0]?.value,
									phone: person.phone?.[0]?.value,
								});
								results.contacts++;
							}
						} catch (err) {
							results.errors.push(
								`Person ${person.id}: ${(err as Error).message}`,
							);
						}
					}
				}
			} else {
				logger.warn("[Pipedrive] Persons sync failed", {
					status: personsResponse.status,
				});
				results.errors.push(`Persons: HTTP ${personsResponse.status}`);
			}
		} catch (error) {
			logger.error("[Pipedrive] Persons sync error", { error: String(error) });
			results.errors.push(`Persons: ${(error as Error).message}`);
		}

		// 3. Sync Deals
		try {
			const dealsResponse = await fetch(`${baseUrl}/v1/deals?limit=500`, {
				headers: { Authorization: `Bearer ${accessToken}` },
			});

			if (dealsResponse.ok) {
				const dealsData = await dealsResponse.json();
				if (dealsData.data) {
					for (const deal of dealsData.data) {
						try {
							let stage = "Lead";
							if (deal.status === "won") stage = "Closing";
							else if (deal.status === "lost") stage = "Closing";
							else if (deal.probability >= 80) stage = "Due Diligence";
							else if (deal.probability >= 50) stage = "Offer Received";
							else if (deal.probability >= 20) stage = "NDA Signed";

							let companyId = null;
							if (deal.org_id?.value) {
								companyId = await ctx.runQuery(
									internal.pipedrive_db.getCompanyByPipedriveId,
									{
										pipedriveId: deal.org_id.value,
									},
								);
							}

							if (companyId) {
								await ctx.runMutation(internal.pipedrive_db.upsertDeal, {
									pipedriveId: deal.id,
									title: deal.title,
									amount: deal.value || 0,
									stage,
									companyId,
								});
								results.deals++;
							}
						} catch (err) {
							results.errors.push(`Deal ${deal.id}: ${(err as Error).message}`);
						}
					}
				}
			} else {
				logger.warn("[Pipedrive] Deals sync failed", {
					status: dealsResponse.status,
				});
				results.errors.push(`Deals: HTTP ${dealsResponse.status}`);
			}
		} catch (error) {
			logger.error("[Pipedrive] Deals sync error", { error: String(error) });
			results.errors.push(`Deals: ${(error as Error).message}`);
		}

		// Log summary with structured logging
		logger.info("[Pipedrive] Sync completed", {
			companies: results.companies,
			contacts: results.contacts,
			deals: results.deals,
			errorCount: results.errors.length,
			operation: "pipedrive_sync",
		});

		return actionSuccess(results);
	},
});

import type { ActionCtx } from "./_generated/server";

// Helper: Refresh access token
async function refreshAccessToken(
	ctx: ActionCtx,
	refreshToken: string,
): Promise<string> {
	const config = getPipedriveConfig();
	if (!config.clientId || !config.clientSecret) {
		throw new Error("OAuth credentials missing");
	}

	const response = await fetch("https://oauth.pipedrive.com/oauth/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`,
		},
		body: new URLSearchParams({
			grant_type: "refresh_token",
			refresh_token: refreshToken,
		}),
	});

	if (!response.ok) {
		throw new Error("Failed to refresh token");
	}

	const tokens = await response.json();

	await ctx.runMutation(internal.pipedrive_db.storeTokens, {
		accessToken: tokens.access_token,
		refreshToken: tokens.refresh_token,
		expiresAt: Date.now() + tokens.expires_in * 1000,
		apiDomain: tokens.api_domain,
	});

	return tokens.access_token;
}

// ============================================
// PUSH TO PIPEDRIVE (Write back)
// ============================================

export const pushDealToPipedrive = action({
	args: { dealId: v.id("deals") },
	handler: async (ctx, args): Promise<ActionResult<{ pushed: boolean }>> => {
		// Check if Pipedrive is configured
		const integrationError = checkIntegration("pipedrive");
		if (integrationError) return integrationError;

		const tokenData = await ctx.runQuery(internal.pipedrive_db.getStoredTokens);
		if (!tokenData) {
			return actionError("Not connected to Pipedrive", "MISSING_CONFIG");
		}

		try {
			let accessToken = tokenData.accessToken;
			if (Date.now() > tokenData.expiresAt - 60000) {
				accessToken = await refreshAccessToken(ctx, tokenData.refreshToken);
			}

			const deal = await ctx.runQuery(internal.pipedrive_db.getDealById, {
				dealId: args.dealId,
			});
			if (!deal) {
				return actionError("Deal not found", "NOT_FOUND");
			}

			const baseUrl = `https://${tokenData.apiDomain}/v1`;
			const status = deal.stage === "Closing" ? "won" : "open";

			if (deal.pipedriveId) {
				await fetch(`${baseUrl}/deals/${deal.pipedriveId}`, {
					method: "PUT",
					headers: {
						Authorization: `Bearer ${accessToken}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						title: deal.title,
						value: deal.amount,
						status,
					}),
				});
			} else {
				const response = await fetch(`${baseUrl}/deals`, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${accessToken}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						title: deal.title,
						value: deal.amount,
						status,
					}),
				});
				const data = await response.json();
				if (data.data?.id) {
					await ctx.runMutation(internal.pipedrive_db.linkPipedriveDeal, {
						dealId: args.dealId,
						pipedriveId: data.data.id,
					});
				}
			}

			return actionSuccess({ pushed: true });
		} catch (error) {
			logger.error("[Pipedrive] Push deal failed", { error: String(error) });
			return actionError(
				`Failed to push deal to Pipedrive: ${(error as Error).message}`,
				"API_ERROR",
			);
		}
	},
});

// Check if connected to Pipedrive
export const isConnected = action({
	args: {},
	handler: async (ctx): Promise<ActionResult<{ connected: boolean }>> => {
		// First check if Pipedrive integration is even configured
		if (!hasEnv("PIPEDRIVE_CLIENT_ID")) {
			return actionSuccess({ connected: false });
		}

		const tokens = await ctx.runQuery(internal.pipedrive_db.getStoredTokens);
		const connected = !!tokens && Date.now() < tokens.expiresAt;
		return actionSuccess({ connected });
	},
});
