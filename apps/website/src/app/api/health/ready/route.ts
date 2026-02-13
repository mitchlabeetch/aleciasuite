/**
 * Readiness Probe Endpoint
 *
 * Returns 200 OK if the application is ready to handle traffic.
 * This checks if all required environment variables are configured.
 *
 * @endpoint GET /api/health/ready
 * @security Public - No auth required
 *
 * Usage in Kubernetes:
 * ```yaml
 * readinessProbe:
 *   httpGet:
 *     path: /api/health/ready
 *     port: 3000
 *   initialDelaySeconds: 10
 *   periodSeconds: 5
 * ```
 */

import { NextResponse } from "next/server";
import { db, sql } from "@alepanel/db";

interface ReadinessCheck {
	name: string;
	required: boolean;
	configured: boolean;
}

function checkEnvVar(name: string, required: boolean = true): ReadinessCheck {
	return {
		name,
		required,
		configured: !!process.env[name],
	};
}

export async function GET() {
	const checks: ReadinessCheck[] = [
		// Critical - App won't work without these
		checkEnvVar("DATABASE_URL", true),
		checkEnvVar("BETTER_AUTH_SECRET", true),

		// Optional but recommended
		checkEnvVar("UPSTASH_REDIS_REST_URL", false),
		checkEnvVar("UPSTASH_REDIS_REST_TOKEN", false),
		checkEnvVar("OPENAI_API_KEY", false),
		checkEnvVar("GROQ_API_KEY", false),
	];

	// App is ready if all required checks pass
	const requiredChecks = checks.filter((c) => c.required);
	let ready = requiredChecks.every((c) => c.configured);

	// Also verify PostgreSQL connectivity
	let postgresConnected = false;
	if (ready) {
		try {
			await db.execute(sql`SELECT 1 as health`);
			postgresConnected = true;
		} catch (error) {
			ready = false;
		}
	}

	const missingRequired = requiredChecks
		.filter((c) => !c.configured)
		.map((c) => c.name);

	const response = {
		ready,
		timestamp: new Date().toISOString(),
		checks: checks.map((c) => ({
			name: c.name,
			status: c.configured ? "configured" : "missing",
			required: c.required,
		})),
		postgres: postgresConnected ? "connected" : "disconnected",
		...(missingRequired.length > 0 && {
			missingRequired,
			error: `Missing required environment variables: ${missingRequired.join(", ")}`,
		}),
		...(!postgresConnected &&
			ready && {
				error: "PostgreSQL database connection failed",
			}),
	};

	return NextResponse.json(response, {
		status: ready ? 200 : 503,
		headers: {
			"Cache-Control": "no-store",
			"X-Ready": ready ? "true" : "false",
		},
	});
}

export async function HEAD() {
	const requiredVars = ["DATABASE_URL", "BETTER_AUTH_SECRET"];

	const ready = requiredVars.every((v) => !!process.env[v]);

	return new NextResponse(null, {
		status: ready ? 200 : 503,
		headers: { "X-Ready": ready ? "true" : "false" },
	});
}
