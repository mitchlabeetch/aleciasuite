/**
 * Batch Query Utilities for Convex
 *
 * Provides utilities to efficiently batch database lookups to avoid N+1 query problems.
 *
 * @module convex/lib/batch
 * @see SRE_AUDIT_2026.md for full context
 */

import { Id, Doc, TableNames } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";

type AnyCtx = QueryCtx | MutationCtx;

/**
 * Batch fetch multiple documents by ID
 *
 * @example
 * ```typescript
 * const userIds = deals.map(d => d.ownerId).filter(Boolean);
 * const users = await batchGet(ctx, userIds);
 * const userMap = new Map(userIds.map((id, i) => [id, users[i]]));
 * ```
 */
export async function batchGet<T extends TableNames>(
	ctx: AnyCtx,
	ids: Array<Id<T> | null | undefined>,
): Promise<Array<Doc<T> | null>> {
	// Filter out nulls and dedupe
	const uniqueIds = [...new Set(ids.filter((id): id is Id<T> => id != null))];

	// Fetch all at once
	const docs = await Promise.all(uniqueIds.map((id) => ctx.db.get(id)));

	// Create lookup map
	const docMap = new Map<string, Doc<T> | null>();
	uniqueIds.forEach((id, i) => {
		docMap.set(id, docs[i]);
	});

	// Return in original order, mapping nulls appropriately
	return ids.map((id) => (id ? (docMap.get(id) ?? null) : null));
}

/**
 * Create a lookup map from an array of documents
 *
 * @example
 * ```typescript
 * const companies = await ctx.db.query("companies").collect();
 * const companyById = createLookupMap(companies);
 * const companyName = companyById.get(deal.companyId)?.name;
 * ```
 */
export function createLookupMap<T extends { _id: string }>(
	docs: T[],
): Map<string, T> {
	return new Map(docs.map((doc) => [doc._id, doc]));
}

/**
 * Enrich an array of documents with related data using batch fetching
 *
 * @example
 * ```typescript
 * const enrichedDeals = await batchEnrich(ctx, deals, {
 *   company: { field: 'companyId', table: 'companies' },
 *   owner: { field: 'ownerId', table: 'users' },
 * });
 * // Each deal now has deal.company and deal.owner properties
 * ```
 */
export async function batchEnrich<
	T extends Record<string, unknown>,
	R extends Record<string, { field: keyof T & string; table: TableNames }>,
>(
	ctx: AnyCtx,
	items: T[],
	relations: R,
): Promise<Array<T & { [K in keyof R]?: Doc<R[K]["table"]> | null }>> {
	// Collect all IDs for each relation
	const idsByRelation: Record<string, Array<Id<TableNames>>> = {};

	for (const [relationName, config] of Object.entries(relations)) {
		idsByRelation[relationName] = items
			.map((item) => item[config.field] as Id<TableNames> | null | undefined)
			.filter((id): id is Id<TableNames> => id != null);
	}

	// Batch fetch all relations
	const docsByRelation: Record<
		string,
		Map<string, Doc<TableNames> | null>
	> = {};

	for (const [relationName, config] of Object.entries(relations)) {
		const ids = idsByRelation[relationName];
		const uniqueIds = [...new Set(ids)];
		const docs = await Promise.all(uniqueIds.map((id) => ctx.db.get(id)));
		docsByRelation[relationName] = new Map(
			uniqueIds.map((id, i) => [id, docs[i]]),
		);
	}

	// Enrich items
	return items.map((item) => {
		const enriched = { ...item } as T & {
			[K in keyof R]?: Doc<R[K]["table"]> | null;
		};

		for (const [relationName, config] of Object.entries(relations)) {
			const id = item[config.field] as string | null | undefined;
			(enriched as Record<string, unknown>)[relationName] = id
				? (docsByRelation[relationName].get(id) ?? null)
				: null;
		}

		return enriched;
	});
}

/**
 * Extract unique IDs from an array of items
 *
 * @example
 * ```typescript
 * const ownerIds = extractIds(deals, 'ownerId');
 * ```
 */
export function extractIds<
	T extends Record<string, unknown>,
	K extends keyof T,
>(items: T[], field: K): Array<T[K] & string> {
	const ids = items
		.map((item) => item[field])
		.filter((id): id is T[K] & string => typeof id === "string");
	return [...new Set(ids)];
}
