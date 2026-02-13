/**
 * Pagination Utilities for Convex Queries
 *
 * Provides cursor-based pagination for large datasets.
 *
 * @module convex/lib/pagination
 * @see SRE_AUDIT_2026.md for performance context
 */

import { v } from "convex/values";

/**
 * Common pagination arguments to include in query definitions
 */
export const paginationArgs = {
	cursor: v.optional(v.string()),
	limit: v.optional(v.number()),
};

/**
 * Default page size for queries
 */
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

/**
 * Pagination result type
 */
export interface PaginatedResult<T> {
	items: T[];
	nextCursor: string | null;
	hasMore: boolean;
	totalEstimate?: number;
}

/**
 * Create a paginated result from an array
 *
 * @param items - Array of items (should fetch limit + 1 to check for more)
 * @param limit - Page size
 * @param getIdFn - Function to extract cursor ID from item
 * @returns Paginated result with items and next cursor
 *
 * @example
 * ```typescript
 * const items = await ctx.db.query("deals").take(limit + 1);
 * return createPaginatedResult(items, limit, (d) => d._id);
 * ```
 */
export function createPaginatedResult<T>(
	items: T[],
	limit: number,
	getIdFn: (item: T) => string,
): PaginatedResult<T> {
	const requestedLimit = Math.min(limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
	const hasMore = items.length > requestedLimit;
	const resultItems = hasMore ? items.slice(0, requestedLimit) : items;

	return {
		items: resultItems,
		nextCursor: hasMore ? getIdFn(resultItems[resultItems.length - 1]) : null,
		hasMore,
	};
}

/**
 * Apply cursor filtering to a query result
 *
 * @param items - Full array of items
 * @param cursor - Cursor to start after (item ID)
 * @param limit - Number of items to return
 * @returns Paginated result
 */
export function paginateArray<T extends { _id: string }>(
	items: T[],
	cursor: string | null | undefined,
	limit: number = DEFAULT_PAGE_SIZE,
): PaginatedResult<T> {
	const requestedLimit = Math.min(limit, MAX_PAGE_SIZE);

	let startIndex = 0;
	if (cursor) {
		const cursorIndex = items.findIndex((item) => item._id === cursor);
		if (cursorIndex >= 0) {
			startIndex = cursorIndex + 1;
		}
	}

	const endIndex = startIndex + requestedLimit + 1;
	const slicedItems = items.slice(startIndex, endIndex);

	return createPaginatedResult(slicedItems, requestedLimit, (item) => item._id);
}
