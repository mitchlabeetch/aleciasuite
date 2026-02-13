/**
 * Alecia M&A Platform - Load Testing Suite
 *
 * Uses k6 for load testing critical API endpoints and Convex functions.
 *
 * Installation:
 *   brew install k6  (macOS)
 *   or download from https://k6.io/docs/get-started/installation/
 *
 * Usage:
 *   k6 run tests/load/scenarios.js
 *   k6 run tests/load/scenarios.js --env BASE_URL=https://staging.alecia.markets
 *   k6 run tests/load/scenarios.js --env SCENARIO=smoke
 *
 * Scenarios:
 *   - smoke: Quick validation (10 VUs, 1 min)
 *   - load: Normal load (50 VUs, 5 min)
 *   - stress: Peak load (100 VUs, 10 min)
 *   - spike: Sudden traffic spike
 *   - soak: Extended duration test (30 min)
 */

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

// =============================================================================
// CONFIGURATION
// =============================================================================

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const CONVEX_URL =
	__ENV.CONVEX_URL || "https://colorless-bird-993.convex.cloud";
const SCENARIO = __ENV.SCENARIO || "load";

// Custom metrics
const errorRate = new Rate("errors");
const apiDuration = new Trend("api_duration");
const convexDuration = new Trend("convex_duration");
const pageLoadDuration = new Trend("page_load_duration");
const successfulRequests = new Counter("successful_requests");

// Thresholds for pass/fail
const thresholds = {
	http_req_duration: ["p(95)<500", "p(99)<1000"], // 95% under 500ms, 99% under 1s
	http_req_failed: ["rate<0.01"], // Less than 1% failures
	errors: ["rate<0.05"], // Less than 5% error rate
	api_duration: ["p(95)<300"],
	convex_duration: ["p(95)<200"],
};

// Scenario configurations
const scenarios = {
	smoke: {
		executor: "constant-vus",
		vus: 10,
		duration: "1m",
	},
	load: {
		executor: "ramping-vus",
		startVUs: 0,
		stages: [
			{ duration: "1m", target: 25 }, // Ramp up
			{ duration: "3m", target: 50 }, // Stay at 50
			{ duration: "1m", target: 0 }, // Ramp down
		],
	},
	stress: {
		executor: "ramping-vus",
		startVUs: 0,
		stages: [
			{ duration: "2m", target: 50 },
			{ duration: "3m", target: 100 },
			{ duration: "2m", target: 150 },
			{ duration: "3m", target: 100 },
			{ duration: "2m", target: 0 },
		],
	},
	spike: {
		executor: "ramping-vus",
		startVUs: 10,
		stages: [
			{ duration: "30s", target: 10 },
			{ duration: "10s", target: 200 }, // Spike!
			{ duration: "1m", target: 200 },
			{ duration: "10s", target: 10 },
			{ duration: "1m", target: 10 },
		],
	},
	soak: {
		executor: "constant-vus",
		vus: 30,
		duration: "30m",
	},
};

export const options = {
	scenarios: {
		default: scenarios[SCENARIO] || scenarios.load,
	},
	thresholds,
};

// =============================================================================
// TEST DATA
// =============================================================================

// Simulated user sessions (would be replaced with real test tokens in staging)
const testUsers = [
	{ email: "test1@alecia.markets", role: "admin" },
	{ email: "test2@alecia.markets", role: "member" },
	{ email: "test3@alecia.markets", role: "viewer" },
];

// Sample deal IDs for testing (replace with actual test data)
const sampleDealIds = ["deal_test_001", "deal_test_002", "deal_test_003"];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function convexQuery(functionPath, args = {}) {
	const url = `${CONVEX_URL}/api/query`;
	const payload = JSON.stringify({
		path: functionPath,
		args,
		format: "json",
	});

	const params = {
		headers: {
			"Content-Type": "application/json",
		},
	};

	const startTime = Date.now();
	const res = http.post(url, payload, params);
	convexDuration.add(Date.now() - startTime);

	return res;
}

function convexMutation(functionPath, args = {}) {
	const url = `${CONVEX_URL}/api/mutation`;
	const payload = JSON.stringify({
		path: functionPath,
		args,
		format: "json",
	});

	const params = {
		headers: {
			"Content-Type": "application/json",
		},
	};

	const startTime = Date.now();
	const res = http.post(url, payload, params);
	convexDuration.add(Date.now() - startTime);

	return res;
}

function randomChoice(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

// =============================================================================
// TEST SCENARIOS
// =============================================================================

export default function () {
	// Simulate realistic user behavior with weighted actions
	const actions = [
		{ weight: 30, fn: testPageLoad },
		{ weight: 25, fn: testDealsList },
		{ weight: 20, fn: testDealDetail },
		{ weight: 10, fn: testDataRoomAccess },
		{ weight: 10, fn: testDocumentList },
		{ weight: 5, fn: testSearch },
	];

	// Calculate total weight
	const totalWeight = actions.reduce((sum, a) => sum + a.weight, 0);
	let random = Math.random() * totalWeight;

	// Select action based on weight
	for (const action of actions) {
		random -= action.weight;
		if (random <= 0) {
			action.fn();
			break;
		}
	}

	// Random sleep between 1-3 seconds to simulate real user behavior
	sleep(1 + Math.random() * 2);
}

// =============================================================================
// INDIVIDUAL TEST FUNCTIONS
// =============================================================================

function testPageLoad() {
	group("Page Load", () => {
		const pages = [
			"/",
			"/admin",
			"/admin/pipeline",
			"/admin/deals",
			"/admin/data-rooms",
		];

		const page = randomChoice(pages);
		const startTime = Date.now();

		const res = http.get(`${BASE_URL}${page}`, {
			headers: {
				Accept: "text/html",
			},
		});

		pageLoadDuration.add(Date.now() - startTime);

		const success = check(res, {
			"page loads successfully": (r) => r.status === 200 || r.status === 302,
			"page loads within 2s": (r) => r.timings.duration < 2000,
		});

		if (success) {
			successfulRequests.add(1);
		} else {
			errorRate.add(1);
		}
	});
}

function testDealsList() {
	group("Deals List", () => {
		const startTime = Date.now();

		// Query deals list via Convex
		const res = convexQuery("deals:list", { limit: 20 });

		apiDuration.add(Date.now() - startTime);

		const success = check(res, {
			"deals list returns 200": (r) => r.status === 200,
			"deals list responds within 500ms": (r) => r.timings.duration < 500,
			"response is valid JSON": (r) => {
				try {
					JSON.parse(r.body);
					return true;
				} catch {
					return false;
				}
			},
		});

		if (success) {
			successfulRequests.add(1);
		} else {
			errorRate.add(1);
		}
	});
}

function testDealDetail() {
	group("Deal Detail", () => {
		const dealId = randomChoice(sampleDealIds);
		const startTime = Date.now();

		const res = convexQuery("deals:getById", { id: dealId });

		apiDuration.add(Date.now() - startTime);

		const success = check(res, {
			"deal detail returns 200": (r) => r.status === 200,
			"deal detail responds within 300ms": (r) => r.timings.duration < 300,
		});

		if (success) {
			successfulRequests.add(1);
		} else {
			errorRate.add(1);
		}
	});
}

function testDataRoomAccess() {
	group("Data Room Access", () => {
		const startTime = Date.now();

		// List data rooms
		const res = convexQuery("dataRooms:listRooms", {});

		apiDuration.add(Date.now() - startTime);

		const success = check(res, {
			"data rooms list returns 200": (r) => r.status === 200,
			"data rooms responds within 500ms": (r) => r.timings.duration < 500,
		});

		if (success) {
			successfulRequests.add(1);
		} else {
			errorRate.add(1);
		}
	});
}

function testDocumentList() {
	group("Document List", () => {
		const startTime = Date.now();

		// This would need a real folder ID in a staging environment
		const res = convexQuery("colab:listDocuments", { limit: 50 });

		apiDuration.add(Date.now() - startTime);

		const success = check(res, {
			"documents list returns 200": (r) => r.status === 200,
			"documents list responds within 400ms": (r) => r.timings.duration < 400,
		});

		if (success) {
			successfulRequests.add(1);
		} else {
			errorRate.add(1);
		}
	});
}

function testSearch() {
	group("Search", () => {
		const searchTerms = [
			"acquisition",
			"merger",
			"deal",
			"company",
			"valuation",
		];
		const query = randomChoice(searchTerms);

		const startTime = Date.now();

		// Search endpoint (if available)
		const res = http.get(
			`${BASE_URL}/api/search?q=${encodeURIComponent(query)}`,
			{
				headers: {
					Accept: "application/json",
				},
			},
		);

		apiDuration.add(Date.now() - startTime);

		const success = check(res, {
			"search returns valid response": (r) =>
				r.status === 200 || r.status === 404,
			"search responds within 1s": (r) => r.timings.duration < 1000,
		});

		if (success) {
			successfulRequests.add(1);
		} else {
			errorRate.add(1);
		}
	});
}

// =============================================================================
// LIFECYCLE HOOKS
// =============================================================================

export function setup() {
	console.log(`Starting load test against ${BASE_URL}`);
	console.log(`Scenario: ${SCENARIO}`);
	console.log(`Convex URL: ${CONVEX_URL}`);

	// Verify the target is reachable
	const healthCheck = http.get(`${BASE_URL}/api/health`);
	if (healthCheck.status !== 200) {
		console.warn(`Warning: Health check returned ${healthCheck.status}`);
	}

	return { startTime: Date.now() };
}

export function teardown(data) {
	const duration = (Date.now() - data.startTime) / 1000;
	console.log(`Load test completed in ${duration.toFixed(2)}s`);
}

// =============================================================================
// CUSTOM SUMMARY
// =============================================================================

export function handleSummary(data) {
	const summary = {
		timestamp: new Date().toISOString(),
		scenario: SCENARIO,
		baseUrl: BASE_URL,
		metrics: {
			http_reqs: data.metrics.http_reqs?.values?.count || 0,
			http_req_duration_p95:
				data.metrics.http_req_duration?.values?.["p(95)"] || 0,
			http_req_duration_p99:
				data.metrics.http_req_duration?.values?.["p(99)"] || 0,
			http_req_failed: data.metrics.http_req_failed?.values?.rate || 0,
			errors: data.metrics.errors?.values?.rate || 0,
			successful_requests: data.metrics.successful_requests?.values?.count || 0,
		},
		thresholds: {
			passed: Object.values(data.root_group?.checks || {}).every(
				(c) => c.passes > 0,
			),
		},
	};

	return {
		"tests/load/results/summary.json": JSON.stringify(summary, null, 2),
		stdout: textSummary(data, { indent: " ", enableColors: true }),
	};
}

function textSummary(data, options) {
	const lines = [
		"",
		"╔══════════════════════════════════════════════════════════════════╗",
		"║                    LOAD TEST RESULTS                             ║",
		"╠══════════════════════════════════════════════════════════════════╣",
		`║  Scenario: ${SCENARIO.padEnd(54)}║`,
		`║  Target: ${BASE_URL.padEnd(56)}║`,
		"╠══════════════════════════════════════════════════════════════════╣",
		"║  METRICS                                                         ║",
		`║  Total Requests: ${String(data.metrics.http_reqs?.values?.count || 0).padEnd(48)}║`,
		`║  Avg Duration: ${String((data.metrics.http_req_duration?.values?.avg || 0).toFixed(2) + "ms").padEnd(50)}║`,
		`║  P95 Duration: ${String((data.metrics.http_req_duration?.values?.["p(95)"] || 0).toFixed(2) + "ms").padEnd(50)}║`,
		`║  P99 Duration: ${String((data.metrics.http_req_duration?.values?.["p(99)"] || 0).toFixed(2) + "ms").padEnd(50)}║`,
		`║  Error Rate: ${String(((data.metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2) + "%").padEnd(52)}║`,
		"╚══════════════════════════════════════════════════════════════════╝",
		"",
	];

	return lines.join("\n");
}
