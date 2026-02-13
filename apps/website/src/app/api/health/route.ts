/**
 * Health Check Endpoint
 *
 * Returns 200 OK with service status if application is healthy.
 * Returns 503 Service Unavailable if critical services are down.
 *
 * @endpoint GET /api/health
 * @security Public - No auth required for health checks
 *
 * Usage:
 * - Kubernetes liveness/readiness probes
 * - Load balancer health checks
 * - Monitoring and alerting systems (Datadog, Uptime Robot, etc.)
 */

import { NextResponse } from "next/server";
import { db, sql } from "@alepanel/db";

// Types
interface HealthStatus {
	status: "healthy" | "degraded" | "unhealthy";
	timestamp: string;
	version: string;
	environment: string;
	services: {
		postgres: ServiceStatus;
		auth: ServiceStatus;
	};
	uptime: number;
}

interface ServiceStatus {
	status: "up" | "down" | "degraded";
	latencyMs?: number;
	error?: string;
}

// Track server start time for uptime reporting
const startTime = Date.now();

/**
 * Check PostgreSQL database connectivity
 */
async function checkPostgres(): Promise<ServiceStatus> {
	const databaseUrl = process.env.DATABASE_URL;

	if (!databaseUrl) {
		return { status: "down", error: "DATABASE_URL not configured" };
	}

	const start = Date.now();
	try {
		// Simple health query
		await db.execute(sql`SELECT 1 as health`);

		const latencyMs = Date.now() - start;

		// Warn if latency is high
		if (latencyMs > 1000) {
			return {
				status: "degraded",
				latencyMs,
				error: "High latency detected",
			};
		}

		return { status: "up", latencyMs };
	} catch (error) {
		return {
			status: "down",
			latencyMs: Date.now() - start,
			error: (error as Error).message,
		};
	}
}

/**
 * Check BetterAuth authentication service connectivity
 */
async function checkAuth(): Promise<ServiceStatus> {
	const authSecret = process.env.BETTER_AUTH_SECRET;
	const authUrl = process.env.BETTER_AUTH_URL;

	if (!authSecret) {
		return { status: "down", error: "BETTER_AUTH_SECRET not configured" };
	}

	const start = Date.now();
	try {
		// If auth URL is configured, ping it
		if (authUrl) {
			const response = await fetch(`${authUrl}/api/auth/health`, {
				method: "HEAD",
				signal: AbortSignal.timeout(5000),
			});

			const latencyMs = Date.now() - start;

			if (!response.ok) {
				return {
					status: "degraded",
					latencyMs,
					error: `HTTP ${response.status}`,
				};
			}

			return { status: "up", latencyMs };
		}

		// If no auth URL, just verify config exists
		return { status: "up", latencyMs: Date.now() - start };
	} catch (error) {
		return {
			status: "down",
			latencyMs: Date.now() - start,
			error: (error as Error).message,
		};
	}
}

/**
 * GET /api/health
 *
 * Full health check with all service statuses
 */
export async function GET() {
	const [postgresStatus, authStatus] = await Promise.all([
		checkPostgres(),
		checkAuth(),
	]);

	// Determine overall health status
	const allUp = postgresStatus.status === "up" && authStatus.status === "up";
	const anyDown =
		postgresStatus.status === "down" || authStatus.status === "down";

	const overallStatus: HealthStatus["status"] = anyDown
		? "unhealthy"
		: allUp
			? "healthy"
			: "degraded";

	const health: HealthStatus = {
		status: overallStatus,
		timestamp: new Date().toISOString(),
		version: process.env.npm_package_version || "1.0.0",
		environment: process.env.NODE_ENV || "development",
		uptime: Math.floor((Date.now() - startTime) / 1000),
		services: {
			postgres: postgresStatus,
			auth: authStatus,
		},
	};

	// Return 503 if unhealthy - critical for load balancer health checks
	const httpStatus = overallStatus === "unhealthy" ? 503 : 200;

	return NextResponse.json(health, {
		status: httpStatus,
		headers: {
			"Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
			Pragma: "no-cache",
			Expires: "0",
			"X-Health-Status": overallStatus,
		},
	});
}

/**
 * HEAD /api/health
 *
 * Simple health probe - returns only status code
 * Useful for basic liveness checks
 */
export async function HEAD() {
	const postgresStatus = await checkPostgres();
	const status = postgresStatus.status === "up" ? 200 : 503;

	return new NextResponse(null, {
		status,
		headers: {
			"X-Health-Status": postgresStatus.status,
		},
	});
}
