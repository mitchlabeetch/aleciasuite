"use node";

/**
 * Token Refresh - Automated OAuth Token Management
 *
 * Internal actions for refreshing OAuth tokens before they expire.
 * Called by cron jobs to ensure tokens are always valid.
 */

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { encryptToken, decryptToken } from "./lib/crypto";

// Buffer time: refresh tokens 10 minutes before expiry
const REFRESH_BUFFER_MS = 10 * 60 * 1000;

// =============================================================================
// MAIN REFRESH JOB
// =============================================================================

/**
 * Refresh all OAuth tokens that are about to expire
 * Called by cron job every 30 minutes
 */
export const refreshAllTokens = internalAction({
	args: {},
	handler: async (ctx) => {
		const results = {
			google: {
				checked: false,
				refreshed: false,
				error: null as string | null,
			},
			microsoft: {
				checked: false,
				refreshed: false,
				error: null as string | null,
			},
			pipedrive: {
				checked: false,
				refreshed: false,
				error: null as string | null,
			},
		};

		// Refresh Google tokens
		try {
			results.google.checked = true;
			const googleRefreshed = await refreshGoogleTokens(ctx);
			results.google.refreshed = googleRefreshed;
		} catch (error) {
			results.google.error = String(error);
			console.error("[TokenRefresh] Google refresh failed:", error);
		}

		// Refresh Microsoft tokens
		try {
			results.microsoft.checked = true;
			const msRefreshed = await refreshMicrosoftTokens(ctx);
			results.microsoft.refreshed = msRefreshed;
		} catch (error) {
			results.microsoft.error = String(error);
			console.error("[TokenRefresh] Microsoft refresh failed:", error);
		}

		// Refresh Pipedrive tokens
		try {
			results.pipedrive.checked = true;
			const pdRefreshed = await refreshPipedriveTokens(ctx);
			results.pipedrive.refreshed = pdRefreshed;
		} catch (error) {
			results.pipedrive.error = String(error);
			console.error("[TokenRefresh] Pipedrive refresh failed:", error);
		}

		console.log("[TokenRefresh] Completed:", JSON.stringify(results));
		return results;
	},
});

// =============================================================================
// GOOGLE TOKEN REFRESH
// =============================================================================

/**
 * Refresh Google token (exported for calendarSync)
 */
export const refreshGoogleToken = internalAction({
	args: {},
	handler: async (ctx): Promise<boolean> => {
		return refreshGoogleTokens(ctx);
	},
});

async function refreshGoogleTokens(ctx: {
	runQuery: Function;
	runMutation: Function;
}): Promise<boolean> {
	const tokens = await ctx.runQuery(internal.google_db.getStoredTokens);

	if (!tokens) {
		console.log("[TokenRefresh] No Google tokens stored");
		return false;
	}

	// Check if token needs refresh
	const now = Date.now();
	if (tokens.expiresAt > now + REFRESH_BUFFER_MS) {
		console.log("[TokenRefresh] Google token still valid");
		return false;
	}

	// Get user identifier for per-user decryption
	const userIdentifier = tokens.email || tokens.userId || "global";

	// Decrypt refresh token
	const refreshToken = tokens.refreshToken
		? await decryptToken(tokens.refreshToken, userIdentifier)
		: null;

	if (!refreshToken) {
		console.error("[TokenRefresh] No Google refresh token available");
		return false;
	}

	// Get OAuth config
	const clientId = process.env.GOOGLE_CLIENT_ID;
	const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

	if (!clientId || !clientSecret) {
		console.error("[TokenRefresh] Google OAuth credentials not configured");
		return false;
	}

	// Refresh the token
	const response = await fetch("https://oauth2.googleapis.com/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({
			client_id: clientId,
			client_secret: clientSecret,
			refresh_token: refreshToken,
			grant_type: "refresh_token",
		}),
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(
			`Google token refresh failed: ${errorData.error_description || errorData.error}`,
		);
	}

	const newTokens = await response.json();

	// Encrypt new tokens using per-user key
	const encryptedAccessToken = await encryptToken(
		newTokens.access_token,
		userIdentifier,
	);
	const encryptedRefreshToken = newTokens.refresh_token
		? await encryptToken(newTokens.refresh_token, userIdentifier)
		: tokens.refreshToken;

	// Store refreshed tokens
	await ctx.runMutation(internal.google_db.storeTokens, {
		accessToken: encryptedAccessToken,
		refreshToken: encryptedRefreshToken,
		expiresAt: now + (newTokens.expires_in || 3600) * 1000,
		email: tokens.email,
		userId: tokens.userId,
		isEncrypted: !!process.env.TOKEN_ENCRYPTION_KEY,
	});

	console.log("[TokenRefresh] Google token refreshed successfully");
	return true;
}

// =============================================================================
// MICROSOFT TOKEN REFRESH
// =============================================================================

/**
 * Refresh Microsoft token (exported for calendarSync)
 */
export const refreshMicrosoftToken = internalAction({
	args: {},
	handler: async (ctx): Promise<boolean> => {
		return refreshMicrosoftTokens(ctx);
	},
});

async function refreshMicrosoftTokens(ctx: {
	runQuery: Function;
	runMutation: Function;
}): Promise<boolean> {
	const tokens = await ctx.runQuery(internal.microsoft_db.getStoredTokens);

	if (!tokens) {
		console.log("[TokenRefresh] No Microsoft tokens stored");
		return false;
	}

	// Check if token needs refresh
	const now = Date.now();
	if (tokens.expiresAt > now + REFRESH_BUFFER_MS) {
		console.log("[TokenRefresh] Microsoft token still valid");
		return false;
	}

	if (!tokens.refreshToken) {
		console.error("[TokenRefresh] No Microsoft refresh token available");
		return false;
	}

	// Get OAuth config
	const clientId = process.env.MICROSOFT_CLIENT_ID;
	const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
	const tenantId = process.env.MICROSOFT_TENANT_ID || "common";

	if (!clientId || !clientSecret) {
		console.error("[TokenRefresh] Microsoft OAuth credentials not configured");
		return false;
	}

	// Refresh the token
	const response = await fetch(
		`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				client_id: clientId,
				client_secret: clientSecret,
				refresh_token: tokens.refreshToken,
				grant_type: "refresh_token",
			}),
		},
	);

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(
			`Microsoft token refresh failed: ${errorData.error_description || errorData.error}`,
		);
	}

	const newTokens = await response.json();

	// Store refreshed tokens
	await ctx.runMutation(internal.microsoft_db.storeTokens, {
		accessToken: newTokens.access_token,
		refreshToken: newTokens.refresh_token || tokens.refreshToken,
		expiresAt: now + (newTokens.expires_in || 3600) * 1000,
		userId: tokens.userId,
		scope: newTokens.scope,
	});

	console.log("[TokenRefresh] Microsoft token refreshed successfully");
	return true;
}

// =============================================================================
// PIPEDRIVE TOKEN REFRESH
// =============================================================================

async function refreshPipedriveTokens(ctx: {
	runQuery: Function;
	runMutation: Function;
}): Promise<boolean> {
	const tokens = await ctx.runQuery(internal.pipedrive_db.getStoredTokens);

	if (!tokens) {
		console.log("[TokenRefresh] No Pipedrive tokens stored");
		return false;
	}

	// Check if token needs refresh
	const now = Date.now();
	if (tokens.expiresAt > now + REFRESH_BUFFER_MS) {
		console.log("[TokenRefresh] Pipedrive token still valid");
		return false;
	}

	if (!tokens.refreshToken) {
		console.error("[TokenRefresh] No Pipedrive refresh token available");
		return false;
	}

	// Get OAuth config
	const clientId = process.env.PIPEDRIVE_CLIENT_ID;
	const clientSecret = process.env.PIPEDRIVE_CLIENT_SECRET;

	if (!clientId || !clientSecret) {
		console.error("[TokenRefresh] Pipedrive OAuth credentials not configured");
		return false;
	}

	// Refresh the token
	const response = await fetch("https://oauth.pipedrive.com/oauth/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
		},
		body: new URLSearchParams({
			refresh_token: tokens.refreshToken,
			grant_type: "refresh_token",
		}),
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(
			`Pipedrive token refresh failed: ${errorData.error_description || errorData.error}`,
		);
	}

	const newTokens = await response.json();

	// Store refreshed tokens
	await ctx.runMutation(internal.pipedrive_db.storeTokens, {
		accessToken: newTokens.access_token,
		refreshToken: newTokens.refresh_token || tokens.refreshToken,
		expiresAt: now + (newTokens.expires_in || 3600) * 1000,
		apiDomain: tokens.apiDomain,
	});

	console.log("[TokenRefresh] Pipedrive token refreshed successfully");
	return true;
}
