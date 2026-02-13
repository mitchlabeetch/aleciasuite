// services/cms/config/middlewares.ts
// Strapi middleware configuration with BetterAuth SSO

export default [
  "strapi::logger",
  "strapi::errors",
  "strapi::security",
  "strapi::cors",
  "strapi::poweredBy",
  "strapi::query",
  "strapi::body",
  // BetterAuth SSO middleware — auto-provisions users from Caddy headers
  // Must come before strapi::session to set auth context
  {
    name: "global::better-auth-sso",
    config: {},
  },
  "strapi::session",
  "strapi::favicon",
  "strapi::public",
];
