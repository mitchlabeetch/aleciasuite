// services/cms/src/middlewares/better-auth-sso.ts
// BetterAuth SSO middleware for Strapi CE
// Auto-provisions admin users from Caddy X-Alecia-User-* headers

import type { Core } from "@strapi/strapi";

const BETTERAUTH_SSO_MIDDLEWARE_NAME = "middleware::better-auth-sso";

export default (config: any, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    // Only process if we have BetterAuth user headers from Caddy
    const userId = ctx.request.headers["x-alecia-user-id"];
    const userEmail = ctx.request.headers["x-alecia-user-email"];
    const userName = ctx.request.headers["x-alecia-user-name"];
    const userRole = ctx.request.headers["x-alecia-user-role"];

    if (!userId || !userEmail) {
      // No BetterAuth headers → Let Strapi handle auth normally
      return next();
    }

    try {
      // Find or create Strapi admin user matching BetterAuth user
      const adminUserService = strapi.service("admin::user");
      const roleService = strapi.service("admin::role");

      // Check if user already exists in Strapi
      let strapiUser = await adminUserService.findOneByEmail(userEmail);

      if (!strapiUser) {
        // User doesn't exist → Auto-provision

        // Map BetterAuth role to Strapi role
        // BetterAuth: "admin" | "user"
        // Strapi: "Super Admin" | "Editor" | "Author"
        const roleName = userRole === "admin" ? "Super Admin" : "Editor";
        const roles = await roleService.findAllRoles();
        const targetRole = roles.find(
          (r: any) => r.name === roleName
        );

        if (!targetRole) {
          strapi.log.error(
            `[BetterAuth SSO] Could not find Strapi role: ${roleName}`
          );
          return next();
        }

        // Create Strapi admin user
        strapiUser = await adminUserService.create({
          email: userEmail,
          firstname: userName?.split(" ")[0] || userEmail.split("@")[0],
          lastname: userName?.split(" ").slice(1).join(" ") || "",
          isActive: true,
          roles: [targetRole.id],
          // Strapi requires a password but we're using SSO, so set a random one
          password: `${Math.random().toString(36)}${Date.now()}`,
        });

        strapi.log.info(
          `[BetterAuth SSO] Auto-provisioned Strapi user: ${userEmail} (${roleName})`
        );
      }

      // Set Strapi admin session for this user
      // This allows Strapi's admin panel to recognize the user
      ctx.state.user = strapiUser;
      ctx.state.userAbility = await adminUserService.getAbilityForUser(strapiUser);

      // Store session info
      ctx.state.isAuthenticated = true;
      ctx.state.auth = {
        strategy: "better-auth-sso",
        userId: strapiUser.id,
      };

      await next();
    } catch (error) {
      strapi.log.error("[BetterAuth SSO] Error processing auth headers:", error);
      // Continue without auth if something goes wrong
      await next();
    }
  };
};
