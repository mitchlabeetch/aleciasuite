import { NextRequest, NextResponse } from "next/server";
import { createLogger } from "@/lib/logger";
import { auth } from "@alepanel/auth";
import { headers } from "next/headers";

const log = createLogger("BusinessIntelligenceAPI");

// Environment variables for the agent research API
const AGENT_RESEARCH_URL = process.env.AGENT_RESEARCH_URL;
const AGENT_RESEARCH_TOKEN = process.env.AGENT_RESEARCH_TOKEN;

interface StudyVars {
	LOCATION: string;
	MARKET: string;
	PERIOD: string;
	BASE_YEAR: string;
	PROJECTION_YEAR: string;
	RECENT_EVENT: string;
	CURRENCY: string;
	SUBSEGMENTS: string;
	EMAIL?: string;
}

interface TriggerRequest {
	vars: StudyVars;
}

export async function POST(request: NextRequest) {
	try {
		// Verify user is authenticated
		const session = await auth.api.getSession({ headers: await headers() });
		const userId = session?.user?.id;
		if (!userId) {
			return NextResponse.json(
				{ error: "Non autorise. Veuillez vous connecter." },
				{ status: 401 },
			);
		}

		// Validate environment configuration
		if (!AGENT_RESEARCH_URL || !AGENT_RESEARCH_TOKEN) {
			log.error(
				"Agent research API not configured - set AGENT_RESEARCH_URL and AGENT_RESEARCH_TOKEN",
			);
			return NextResponse.json(
				{
					error:
						"Service temporairement indisponible. Configuration requise.",
				},
				{ status: 503 },
			);
		}

		// Parse and validate request body
		const body: TriggerRequest = await request.json();

		if (!body.vars) {
			return NextResponse.json(
				{ error: "Donnees invalides: vars manquant" },
				{ status: 400 },
			);
		}

		const { vars } = body;

		// Validate required fields
		const requiredFields: (keyof StudyVars)[] = [
			"LOCATION",
			"MARKET",
			"PERIOD",
			"BASE_YEAR",
			"PROJECTION_YEAR",
			"RECENT_EVENT",
			"CURRENCY",
			"SUBSEGMENTS",
		];

		const missingFields = requiredFields.filter(
			(field) => !vars[field] || vars[field].trim() === "",
		);

		if (missingFields.length > 0) {
			return NextResponse.json(
				{
					error: `Champs requis manquants: ${missingFields.join(", ")}`,
				},
				{ status: 400 },
			);
		}

		// Validate email format if provided
		if (vars.EMAIL && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vars.EMAIL)) {
			return NextResponse.json(
				{ error: "Adresse email invalide" },
				{ status: 400 },
			);
		}

		// Build the payload matching the workflow input schema
		const payload = {
			vars: {
				type: "object",
				properties: {
					BASE_YEAR: {
						type: "string",
						title: "Base Year",
						default: vars.BASE_YEAR,
					},
					CURRENCY: {
						type: "string",
						title: "Currency",
						default: vars.CURRENCY,
					},
					LOCATION: {
						type: "string",
						title: "Location",
						default: vars.LOCATION,
					},
					MARKET: {
						type: "string",
						title: "Market",
						default: vars.MARKET,
					},
					PERIOD: {
						type: "string",
						title: "Period",
						default: vars.PERIOD,
					},
					PROJECTION_YEAR: {
						type: "string",
						title: "Projection Year",
						default: vars.PROJECTION_YEAR,
					},
					RECENT_EVENT: {
						type: "string",
						title: "Recent Event",
						default: vars.RECENT_EVENT,
					},
					SUBSEGMENTS: {
						type: "string",
						title: "Subsegments",
						default: vars.SUBSEGMENTS,
					},
					...(vars.EMAIL
						? {
								EMAIL: {
									type: "string",
									title: "Email",
									default: vars.EMAIL,
								},
							}
						: {}),
				},
			},
		};

		log.info("Triggering business intelligence study", {
			userId,
			market: vars.MARKET,
			location: vars.LOCATION,
			period: vars.PERIOD,
			hasEmail: !!vars.EMAIL,
		});

		// Send request to the agent research API
		const response = await fetch(AGENT_RESEARCH_URL, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${AGENT_RESEARCH_TOKEN}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			const errorText = await response.text();
			log.error("Agent research API request failed", {
				status: response.status,
				error: errorText,
			});
			throw new Error(`Erreur du service: ${response.statusText}`);
		}

		const result = await response.json();

		log.info("Business intelligence study triggered successfully", {
			userId,
			market: vars.MARKET,
			location: vars.LOCATION,
		});

		return NextResponse.json({
			success: true,
			message: vars.EMAIL
				? "Etude lancee. Vous recevrez le resultat par email."
				: "Etude lancee. Le resultat sera disponible dans Colab.",
			data: result,
		});
	} catch (error: unknown) {
		log.error("Error triggering business intelligence study:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Erreur interne";
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}
