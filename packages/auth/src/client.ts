// packages/auth/src/client.ts
// BetterAuth client — import this in Next.js client components
// Provides useSession(), signIn(), signOut() hooks

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // In production, all apps share the same auth via cross-subdomain cookies
  // The baseURL points to whichever app hosts the /api/auth/* routes
  baseURL:
    process.env.NEXT_PUBLIC_AUTH_URL ||
    (typeof window !== "undefined" ? window.location.origin : ""),
});

export const { useSession, signIn, signOut } = authClient;
