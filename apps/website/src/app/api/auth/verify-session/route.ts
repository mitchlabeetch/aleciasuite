// apps/website/src/app/api/auth/verify-session/route.ts
// Caddy forward_auth endpoint
// Returns 200 + user headers if valid BetterAuth session, 401 otherwise

export { caddyAuthVerify as GET, caddyAuthVerifyHead as HEAD } from "@alepanel/auth";
