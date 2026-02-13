// packages/auth/src/routes/caddy-auth.ts
// Caddy forward_auth endpoint for BetterAuth session validation
// Used by Caddy reverse proxy to authenticate requests to FOSS tools

import { auth } from "../index";

/**
 * GET /api/auth/verify-session
 *
 * Caddy forward_auth endpoint that validates BetterAuth session cookies.
 * Uses standard Web Request/Response to avoid Next.js version coupling.
 *
 * Returns:
 * - 200 + X-Alecia-User-* headers → Valid session, allow request
 * - 401 → No session or invalid session, deny request
 *
 * Caddy configuration example:
 * ```caddyfile
 * cms.alecia.fr {
 *   forward_auth app.alecia.fr:3000 {
 *     uri /api/auth/verify-session
 *     header_up X-Forwarded-Method {method}
 *     header_up X-Forwarded-Uri {uri}
 *     copy_headers X-Alecia-User-*
 *   }
 *   reverse_proxy strapi:1337
 * }
 * ```
 */
export async function GET(request: Request) {
  try {
    // Extract session from BetterAuth cookie
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // No session or invalid session
    if (!session?.user) {
      return new Response(null, {
        status: 401,
        headers: {
          "X-Auth-Error": "No valid session",
        },
      });
    }

    // Valid session — return user headers for Caddy to inject upstream
    return new Response(null, {
      status: 200,
      headers: {
        // Core user identity
        "X-Alecia-User-Id": session.user.id,
        "X-Alecia-User-Email": session.user.email,
        "X-Alecia-User-Name": session.user.name || session.user.email,

        // Role/permissions (map from BetterAuth to FOSS tool roles)
        "X-Alecia-User-Role": (session.user as any).role || "user",

        // Optional: Avatar URL for UI
        "X-Alecia-User-Avatar": session.user.image || "",

        // Session metadata
        "X-Alecia-Session-Id": session.session.id,
        "X-Alecia-Session-Expires": new Date(session.session.expiresAt).toISOString(),
      },
    });
  } catch (error) {
    console.error("[Caddy Auth] Session validation error:", error);

    return new Response(null, {
      status: 401,
      headers: {
        "X-Auth-Error": "Session validation failed",
      },
    });
  }
}

/** HEAD handler — same logic, lighter for reverse proxy health checks */
export const HEAD = GET;
