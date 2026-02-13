import { NextResponse } from "next/server";
import { exchangePipedriveCode } from "@/actions/integrations/pipedrive-sync";

/**
 * Pipedrive OAuth Callback Handler
 *
 * Exchanges the authorization code for access tokens via server action.
 * Pipedrive is a CRM integration (not a login provider), so it's handled separately from BetterAuth.
 */
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const code = searchParams.get("code");
	const error = searchParams.get("error");
	const errorDescription = searchParams.get("error_description");

	const baseUrl = new URL(request.url).origin;
	const redirectUrl = new URL("/admin/settings/integrations", baseUrl);

	if (error) {
		console.error("[Pipedrive OAuth] Error:", error, errorDescription);
		redirectUrl.searchParams.set("error", "pipedrive_denied");
		redirectUrl.searchParams.set(
			"message",
			errorDescription || "Authorization was denied",
		);
		return NextResponse.redirect(redirectUrl);
	}

	if (!code) {
		console.error("[Pipedrive OAuth] Missing authorization code");
		redirectUrl.searchParams.set("error", "missing_code");
		redirectUrl.searchParams.set("message", "No authorization code received");
		return NextResponse.redirect(redirectUrl);
	}

	try {
		const result = await exchangePipedriveCode(code);

		if (!result.success) {
			console.error("[Pipedrive OAuth] Token exchange failed:", result.error);
			redirectUrl.searchParams.set("error", "token_exchange_failed");
			redirectUrl.searchParams.set(
				"message",
				result.error || "Token exchange failed",
			);
			return NextResponse.redirect(redirectUrl);
		}

		redirectUrl.searchParams.set("success", "pipedrive");
		redirectUrl.searchParams.set("message", "Pipedrive connected successfully");
		return NextResponse.redirect(redirectUrl);
	} catch (err) {
		console.error("[Pipedrive OAuth] Unexpected error:", err);
		redirectUrl.searchParams.set("error", "unexpected_error");
		redirectUrl.searchParams.set(
			"message",
			err instanceof Error ? err.message : "An unexpected error occurred",
		);
		return NextResponse.redirect(redirectUrl);
	}
}
