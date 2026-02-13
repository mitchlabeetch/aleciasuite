/**
 * Liveness Probe Endpoint
 *
 * Returns 200 OK if the application process is running.
 * This is the most basic health check - if the app can respond, it's alive.
 *
 * @endpoint GET /api/health/live
 * @security Public - No auth required
 *
 * Usage in Kubernetes:
 * ```yaml
 * livenessProbe:
 *   httpGet:
 *     path: /api/health/live
 *     port: 3000
 *   initialDelaySeconds: 5
 *   periodSeconds: 10
 * ```
 */

import { NextResponse } from "next/server";

export async function GET() {
	return NextResponse.json(
		{
			alive: true,
			timestamp: new Date().toISOString(),
		},
		{
			status: 200,
			headers: {
				"Cache-Control": "no-store",
			},
		},
	);
}

export async function HEAD() {
	return new NextResponse(null, { status: 200 });
}
