// apps/website/src/lib/auth.ts
// BetterAuth API route handler
// Replaces @clerk/nextjs → Keycloak → now BetterAuth (TypeScript-native)

import { auth, toNextJsHandler } from "@alepanel/auth";

// Mount as API route: app/api/auth/[...all]/route.ts
export const { GET, POST } = toNextJsHandler(auth);

// Re-export for server-side session access in Server Components
export { auth };
