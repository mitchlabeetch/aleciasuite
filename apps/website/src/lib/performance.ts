/**
 * Performance Utilities
 *
 * Helpers for optimizing runtime performance.
 *
 * @see Batch 11: Performance Optimization
 */

import { logger } from "./logger";

/**
 * Debounce a function call
 *
 * @example
 * const debouncedSearch = debounce((query) => search(query), 300);
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
	func: T,
	wait: number,
): (...args: Parameters<T>) => void {
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	return function (this: unknown, ...args: Parameters<T>) {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}

		timeoutId = setTimeout(() => {
			func.apply(this, args);
			timeoutId = null;
		}, wait);
	};
}

/**
 * Throttle a function call
 *
 * @example
 * const throttledScroll = throttle(() => handleScroll(), 100);
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
	func: T,
	limit: number,
): (...args: Parameters<T>) => void {
	let inThrottle = false;

	return function (this: unknown, ...args: Parameters<T>) {
		if (!inThrottle) {
			func.apply(this, args);
			inThrottle = true;
			setTimeout(() => {
				inThrottle = false;
			}, limit);
		}
	};
}

/**
 * Memoize a function result based on arguments
 *
 * @example
 * const memoizedExpensiveCalc = memoize(expensiveCalc);
 */
export function memoize<T extends (...args: unknown[]) => unknown>(func: T): T {
	const cache = new Map<string, ReturnType<T>>();

	return function (this: unknown, ...args: Parameters<T>): ReturnType<T> {
		const key = JSON.stringify(args);

		if (cache.has(key)) {
			return cache.get(key)!;
		}

		const result = func.apply(this, args) as ReturnType<T>;
		cache.set(key, result);
		return result;
	} as T;
}

/**
 * Check if code is running in browser
 */
export const isBrowser = typeof window !== "undefined";

/**
 * Preload critical images
 *
 * @example
 * preloadImages(['/hero.jpg', '/logo.png']);
 */
export function preloadImages(urls: string[]): void {
	if (!isBrowser) return;

	urls.forEach((url) => {
		const link = document.createElement("link");
		link.rel = "preload";
		link.as = "image";
		link.href = url;
		document.head.appendChild(link);
	});
}

/**
 * Defer non-critical JavaScript execution
 *
 * @example
 * deferTask(() => analytics.track('page_view'));
 */
export function deferTask(task: () => void): void {
	if (!isBrowser) return;

	if ("requestIdleCallback" in window) {
		(
			window as Window & { requestIdleCallback: (cb: () => void) => void }
		).requestIdleCallback(task);
	} else {
		setTimeout(task, 1);
	}
}

/**
 * Measure component render time (dev only)
 *
 * @example
 * const endMeasure = measureRender('ExpensiveComponent');
 * // ... render ...
 * endMeasure();
 */
export function measureRender(componentName: string): () => void {
	if (process.env.NODE_ENV !== "development") {
		return () => {};
	}

	const start = performance.now();

	return () => {
		const duration = performance.now() - start;
		if (duration > 16) {
			// More than one frame (~60fps)
			logger.warn(
				`[Performance] ${componentName} took ${duration.toFixed(2)}ms to render`,
			);
		}
	};
}
