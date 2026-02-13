/**
 * Metrics Instrumentation Module
 *
 * Provides application metrics for monitoring and observability.
 * Designed to work with Sentry Performance Monitoring.
 *
 * @module lib/metrics
 * @see SRE_AUDIT_2026.md
 */

// Metric types
interface MetricEvent {
	name: string;
	value: number;
	unit: "ms" | "count" | "bytes" | "percent";
	tags: Record<string, string>;
	timestamp: number;
}

// In-memory buffer for batching metrics
const metricsBuffer: MetricEvent[] = [];
const FLUSH_INTERVAL_MS = 30000; // 30 seconds
const MAX_BUFFER_SIZE = 100;

/**
 * Record a metric event
 *
 * @example
 * ```typescript
 * recordMetric("api.latency", 150, "ms", { endpoint: "/api/health" });
 * recordMetric("deals.created", 1, "count", { stage: "qualification" });
 * ```
 */
export function recordMetric(
	name: string,
	value: number,
	unit: MetricEvent["unit"] = "count",
	tags: Record<string, string> = {},
): void {
	const event: MetricEvent = {
		name,
		value,
		unit,
		tags: {
			...tags,
			env: process.env.NODE_ENV || "development",
		},
		timestamp: Date.now(),
	};

	metricsBuffer.push(event);

	// Flush if buffer is full
	if (metricsBuffer.length >= MAX_BUFFER_SIZE) {
		flushMetrics();
	}
}

/**
 * Measure function execution time
 *
 * @example
 * ```typescript
 * const result = await measureAsync("db.query", async () => {
 *   return await ctx.db.query("deals").collect();
 * }, { table: "deals" });
 * ```
 */
export async function measureAsync<T>(
	name: string,
	fn: () => Promise<T>,
	tags: Record<string, string> = {},
): Promise<T> {
	const startTime = performance.now();
	try {
		const result = await fn();
		recordMetric(name, performance.now() - startTime, "ms", {
			...tags,
			status: "success",
		});
		return result;
	} catch (error) {
		recordMetric(name, performance.now() - startTime, "ms", {
			...tags,
			status: "error",
		});
		throw error;
	}
}

/**
 * Measure synchronous function execution time
 */
export function measureSync<T>(
	name: string,
	fn: () => T,
	tags: Record<string, string> = {},
): T {
	const startTime = performance.now();
	try {
		const result = fn();
		recordMetric(name, performance.now() - startTime, "ms", {
			...tags,
			status: "success",
		});
		return result;
	} catch (error) {
		recordMetric(name, performance.now() - startTime, "ms", {
			...tags,
			status: "error",
		});
		throw error;
	}
}

/**
 * Increment a counter metric
 */
export function incrementCounter(
	name: string,
	tags: Record<string, string> = {},
): void {
	recordMetric(name, 1, "count", tags);
}

/**
 * Record an error occurrence
 */
export function recordError(
	errorType: string,
	tags: Record<string, string> = {},
): void {
	recordMetric("errors", 1, "count", {
		...tags,
		error_type: errorType,
	});
}

/**
 * Flush metrics buffer to external service
 * In production, this would send to a metrics service
 */
export function flushMetrics(): MetricEvent[] {
	const metrics = [...metricsBuffer];
	metricsBuffer.length = 0;

	// In development, log aggregated metrics
	if (process.env.NODE_ENV === "development" && metrics.length > 0) {
		const aggregated = aggregateMetrics(metrics);
		console.debug("[Metrics] Flushed:", aggregated);
	}

	// In production, send to Sentry or external metrics service
	if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
		void import("@sentry/nextjs")
			.then((Sentry) => {
				metrics.forEach((m) => {
					Sentry.addBreadcrumb({
						category: "metric",
						message: `${m.name}: ${m.value}${m.unit}`,
						level: "info",
						data: m.tags,
					});
				});
			})
			.catch(() => {
				// Sentry not available
			});
	}

	return metrics;
}

/**
 * Aggregate metrics by name for logging
 */
function aggregateMetrics(metrics: MetricEvent[]): Record<
	string,
	{
		count: number;
		sum: number;
		avg: number;
		min: number;
		max: number;
	}
> {
	const grouped: Record<string, MetricEvent[]> = {};

	metrics.forEach((m) => {
		if (!grouped[m.name]) grouped[m.name] = [];
		grouped[m.name].push(m);
	});

	const result: Record<
		string,
		{ count: number; sum: number; avg: number; min: number; max: number }
	> = {};

	Object.entries(grouped).forEach(([name, events]) => {
		const values = events.map((e) => e.value);
		result[name] = {
			count: values.length,
			sum: values.reduce((a, b) => a + b, 0),
			avg: values.reduce((a, b) => a + b, 0) / values.length,
			min: Math.min(...values),
			max: Math.max(...values),
		};
	});

	return result;
}

// Auto-flush on interval
if (typeof setInterval !== "undefined") {
	setInterval(flushMetrics, FLUSH_INTERVAL_MS);
}

/**
 * Key Business Metrics
 *
 * These are the most important metrics for the Alecia Panel:
 *
 * 1. API Latency (api.latency)
 *    - Where: API route handlers, middleware
 *    - Why: Detect slow endpoints, identify performance regressions
 *
 * 2. Error Rate (errors)
 *    - Where: Error boundaries, API catch blocks
 *    - Why: Track reliability, trigger alerts
 *
 * 3. Active Users (presence.active)
 *    - Where: Presence system, getActiveUsers query
 *    - Why: Understand usage patterns, capacity planning
 *
 * 4. Deal Pipeline Velocity (deals.stage_change)
 *    - Where: moveDeal mutation
 *    - Why: Business KPI, tracks deal progression
 *
 * 5. Integration Sync Status (integrations.sync)
 *    - Where: Pipedrive/O365 sync actions
 *    - Why: Monitor third-party integrations health
 */
export const KEY_METRICS = {
	API_LATENCY: "api.latency",
	ERROR_RATE: "errors",
	ACTIVE_USERS: "presence.active",
	DEAL_VELOCITY: "deals.stage_change",
	INTEGRATION_SYNC: "integrations.sync",
} as const;
