/**
 * HTTP Endpoints for Convex
 *
 * Provides public HTTP endpoints that can be called without Convex client.
 */

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

/**
 * POST /unsubscribe
 *
 * One-click email unsubscribe endpoint.
 * CAN-SPAM/GDPR compliant - no authentication required.
 */
http.route({
	path: "/unsubscribe",
	method: "POST",
	handler: httpAction(async (ctx, request) => {
		try {
			const body = await request.json();
			const { token } = body;

			if (!token) {
				return new Response(
					JSON.stringify({
						success: false,
						error: "missing_token",
						message: "Token de désinscription manquant.",
					}),
					{
						status: 400,
						headers: {
							"Content-Type": "application/json",
							"Access-Control-Allow-Origin": "*",
						},
					},
				);
			}

			// Call the unsubscribe action
			const result = await ctx.runAction(api.unsubscribe.handleUnsubscribe, {
				token,
			});

			return new Response(JSON.stringify(result), {
				status: result.success ? 200 : 400,
				headers: {
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*",
				},
			});
		} catch (error) {
			console.error("HTTP unsubscribe error:", error);
			return new Response(
				JSON.stringify({
					success: false,
					error: "server_error",
					message: "Une erreur serveur s'est produite.",
				}),
				{
					status: 500,
					headers: {
						"Content-Type": "application/json",
						"Access-Control-Allow-Origin": "*",
					},
				},
			);
		}
	}),
});

/**
 * OPTIONS /unsubscribe
 *
 * CORS preflight handler
 */
http.route({
	path: "/unsubscribe",
	method: "OPTIONS",
	handler: httpAction(async () => {
		return new Response(null, {
			status: 204,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "POST, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type",
			},
		});
	}),
});

export default http;
