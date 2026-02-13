/**
 * Result Type - Consistent Error Handling Pattern
 *
 * Use this type to handle operations that can fail without throwing.
 * This makes error handling explicit and encourages proper handling.
 *
 * @see CODE_REVIEW.md - Smell #5
 *
 * @example
 * // Function that returns Result
 * async function fetchData(): Promise<Result<Data>> {
 *   try {
 *     const res = await fetch(url);
 *     if (!res.ok) return err(new Error(`HTTP ${res.status}`));
 *     return ok(await res.json());
 *   } catch (e) {
 *     return err(e instanceof Error ? e : new Error(String(e)));
 *   }
 * }
 *
 * // Caller handles both cases explicitly
 * const result = await fetchData();
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error);
 * }
 */

/**
 * Success result containing data
 */
export interface Success<T> {
	success: true;
	data: T;
}

/**
 * Failure result containing error
 */
export interface Failure<E = Error> {
	success: false;
	error: E;
}

/**
 * Result type - either Success or Failure
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;

/**
 * Create a success result
 */
export function ok<T>(data: T): Success<T> {
	return { success: true, data };
}

/**
 * Create a failure result
 */
export function err<E = Error>(error: E): Failure<E> {
	return { success: false, error };
}

/**
 * Check if result is success
 */
export function isOk<T, E>(result: Result<T, E>): result is Success<T> {
	return result.success === true;
}

/**
 * Check if result is failure
 */
export function isErr<T, E>(result: Result<T, E>): result is Failure<E> {
	return result.success === false;
}

/**
 * Unwrap a result, throwing if it's an error
 */
export function unwrap<T, E>(result: Result<T, E>): T {
	if (result.success) {
		return result.data;
	}
	throw result.error;
}

/**
 * Unwrap a result with a default value for errors
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
	if (result.success) {
		return result.data;
	}
	return defaultValue;
}

/**
 * Map over a successful result
 */
export function mapResult<T, U, E>(
	result: Result<T, E>,
	fn: (data: T) => U,
): Result<U, E> {
	if (result.success) {
		return ok(fn(result.data));
	}
	return result;
}

/**
 * Map over an error result
 */
export function mapError<T, E, F>(
	result: Result<T, E>,
	fn: (error: E) => F,
): Result<T, F> {
	if (!result.success) {
		return err(fn(result.error));
	}
	return result;
}

/**
 * Convert a Promise to a Result (never throws)
 */
export async function tryCatch<T>(
	promise: Promise<T>,
): Promise<Result<T, Error>> {
	try {
		const data = await promise;
		return ok(data);
	} catch (e) {
		return err(e instanceof Error ? e : new Error(String(e)));
	}
}

/**
 * Convert a sync function to a Result
 */
export function trySync<T>(fn: () => T): Result<T, Error> {
	try {
		return ok(fn());
	} catch (e) {
		return err(e instanceof Error ? e : new Error(String(e)));
	}
}

/**
 * Combine multiple results into one
 * Returns first error if any, or all data if all succeed
 */
export function combine<T, E>(results: Result<T, E>[]): Result<T[], E> {
	const data: T[] = [];

	for (const result of results) {
		if (!result.success) {
			return result;
		}
		data.push(result.data);
	}

	return ok(data);
}
