import { NextRequest, NextResponse } from "next/server";
import { createLogger } from "@/lib/logger";
import { ingestBatch } from "@/actions/analytics";

const log = createLogger("AnalyticsIngest");

// Secret token to verify requests from Vercel (set in Vercel drain config)
const ANALYTICS_SECRET = process.env.ANALYTICS_DRAIN_SECRET;

interface VercelAnalyticsEvent {
	id?: string;
	type: string;
	timestamp: number;
	page?: string;
	path?: string;
	host?: string;
	referrer?: string;
	referrerDomain?: string;
	visitorId?: string;
	sessionId?: string;
	device?: {
		type?: string;
		browser?: string;
		os?: string;
	};
	geo?: {
		country?: string;
		countryCode?: string;
		region?: string;
		city?: string;
	};
	utm?: {
		source?: string;
		medium?: string;
		campaign?: string;
		term?: string;
		content?: string;
	};
}

/**
 * Transform Vercel analytics events to our schema format
 */
function transformEvent(event: VercelAnalyticsEvent) {
	return {
		eventId: event.id || `${event.timestamp}-${Math.random().toString(36).slice(2)}`,
		eventType: event.type || "pageview",
		path: event.path || event.page || "/",
		hostname: event.host,
		referrer: event.referrer,
		referrerHostname: event.referrerDomain,
		visitorId: event.visitorId,
		sessionId: event.sessionId,
		deviceType: event.device?.type,
		browser: event.device?.browser,
		os: event.device?.os,
		country: event.geo?.country,
		countryCode: event.geo?.countryCode,
		region: event.geo?.region,
		city: event.geo?.city,
		utmSource: event.utm?.source,
		utmMedium: event.utm?.medium,
		utmCampaign: event.utm?.campaign,
		utmTerm: event.utm?.term,
		utmContent: event.utm?.content,
		timestamp: event.timestamp || Date.now(),
	};
}

export async function POST(request: NextRequest) {
	try {
		// Verify the request is from Vercel using the secret token
		const authHeader = request.headers.get("authorization");
		const token = authHeader?.replace("Bearer ", "");

		if (ANALYTICS_SECRET && token !== ANALYTICS_SECRET) {
			log.warn("Unauthorized analytics ingest attempt");
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();

		// Handle both single event and batch of events
		const events: VercelAnalyticsEvent[] = Array.isArray(body) ? body : [body];

		if (events.length === 0) {
			return NextResponse.json({ success: true, inserted: 0 });
		}

		// Transform events to our schema
		const transformedEvents = events.map(transformEvent);

		log.info(`Processing ${transformedEvents.length} analytics events`);

		// Submit to database via server action
		const result = await ingestBatch(transformedEvents);

		log.info(`Analytics ingested: ${result.inserted || 0} new events`);

		return NextResponse.json({
			success: true,
			inserted: result.inserted || 0,
			total: events.length,
		});
	} catch (error: unknown) {
		log.error("Analytics ingest error:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Internal error";
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}

// Health check endpoint
export async function GET() {
	return NextResponse.json({
		status: "ok",
		endpoint: "analytics-ingest",
		timestamp: Date.now(),
	});
}
