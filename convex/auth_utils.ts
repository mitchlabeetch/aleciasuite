import type { QueryCtx, MutationCtx } from "./_generated/server";

/**
 * Get the currently authenticated user, or null if not logged in or user not in DB.
 * Use this for queries that should still work but need optional user context.
 */
export async function getOptionalUser(ctx: QueryCtx | MutationCtx) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		return null;
	}

	const user = await ctx.db
		.query("users")
		.withIndex("by_token", (q) =>
			q.eq("tokenIdentifier", identity.tokenIdentifier),
		)
		.unique();

	return user; // Can be null if user not in DB yet
}

/**
 * Get authenticated user - throws if not logged in or not in DB.
 * Use this for protected mutations/queries.
 */
export async function getAuthenticatedUser(ctx: QueryCtx | MutationCtx) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new Error("Unauthorized: Not logged in");
	}

	const user = await ctx.db
		.query("users")
		.withIndex("by_token", (q) =>
			q.eq("tokenIdentifier", identity.tokenIdentifier),
		)
		.unique();

	if (!user) {
		throw new Error(
			"Unauthorized: User not found in database. Please contact admin.",
		);
	}

	return user;
}

export async function checkRole(
	ctx: QueryCtx | MutationCtx,
	allowedRoles: ("sudo" | "partner" | "advisor" | "user")[],
) {
	const user = await getAuthenticatedUser(ctx);
	if (!allowedRoles.includes(user.role)) {
		throw new Error(`Forbidden: Role ${user.role} does not have access`);
	}
	return user;
}
