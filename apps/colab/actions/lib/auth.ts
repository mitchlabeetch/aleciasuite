/**
 * Shared authentication helper for Server Actions
 *
 * Centralizes session verification via BetterAuth.
 * Import this in every server action file instead of duplicating.
 */

import { auth } from "@alepanel/auth";
import { db, shared, eq } from "@alepanel/db";
import { headers } from "next/headers";

export async function getAuthenticatedUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized: Please sign in to continue");
  }

  // Fetch the full application user (with role, fullName, etc.)
  // BetterAuth's user type only has standard fields (id, email, name, image)
  const [appUser] = await db
    .select()
    .from(shared.users)
    .where(eq(shared.users.email, session.user.email));

  if (!appUser) {
    throw new Error("User profile not found. Please contact support.");
  }

  return {
    ...session.user,
    ...appUser,
    // Ensure BetterAuth session ID is preserved
    sessionId: session.session.id,
  };
}

export type AuthenticatedUser = Awaited<ReturnType<typeof getAuthenticatedUser>>;
