// packages/auth/src/index.ts
// BetterAuth server configuration — shared across all Next.js apps
// Replaces Keycloak SSO with in-app TypeScript-native authentication

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@alepanel/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    // BetterAuth will use shared schema tables:
    // shared.user, shared.session, shared.account, shared.verification
  }),

  // Cross-subdomain cookie for *.alecia.markets SSO
  advanced: {
    cookiePrefix: "alecia",
    crossSubDomainCookies: {
      enabled: true,
      domain: process.env.NODE_ENV === "production" 
        ? (process.env.AUTH_COOKIE_DOMAIN || ".alecia.markets") 
        : undefined,
    },
  },

  // OAuth providers — no custom API needed, use platform OAuth directly
  socialProviders: {
    ...(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET ? {
      microsoft: {
        clientId: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        tenantId: process.env.MICROSOFT_TENANT_ID || "common",
        // Read+Write scopes for full Graph integration
        scope: [
          "openid",
          "profile",
          "email",
          "Mail.ReadWrite",
          "Calendars.ReadWrite",
          "Files.ReadWrite",
          "User.Read",
        ],
      },
    } : {}),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        scope: [
          "openid",
          "profile",
          "email",
          "https://www.googleapis.com/auth/calendar",
          "https://www.googleapis.com/auth/gmail.readonly",
        ],
      },
    } : {}),
  },

  // Email + password as fallback login
  emailAndPassword: {
    enabled: true,
  },

  session: {
    // 30 min idle, 10 hour max
    expiresIn: 60 * 30,
    updateAge: 60 * 5,
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;

// Re-export Next.js handler for use in apps
export { toNextJsHandler } from "better-auth/next-js";

// Export Caddy auth route handler
export { GET as caddyAuthVerify, HEAD as caddyAuthVerifyHead } from "./routes/caddy-auth";
