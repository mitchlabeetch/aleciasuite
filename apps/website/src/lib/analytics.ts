import { createLogger } from "@/lib/logger";
import { getSummary, getCache, setCache } from "@/actions/analytics";

const log = createLogger("Analytics");

// Cache configuration
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const CACHE_KEY = "analytics_summary";

export interface AnalyticsSummary {
	visitors: number;
	pageViews: number;
	bounceRate: number;
	topPages: Array<{ path: string; views: number; visitors: number }>;
	countries: Array<{ code: string; name: string; visitors: number }>;
	devices: { desktop: number; mobile: number; tablet: number };
	operatingSystems: Array<{ name: string; visitors: number }>;
	referrers: Array<{ source: string; visitors: number }>;
	dailyData: Array<{ date: string; visitors: number; pageViews: number }>;
}

interface CacheEntry {
	data: AnalyticsSummary;
	expiresAt: number;
}

// In-memory cache for server-side
let memoryCache: CacheEntry | null = null;

/**
 * Get analytics summary with server-side caching (1-hour TTL)
 * First checks memory cache, then database cache, then fetches fresh data
 */
export async function getAnalyticsSummary(
	days: number = 7,
): Promise<AnalyticsSummary> {
	const now = Date.now();
	const cacheKey = `${CACHE_KEY}_${days}`;

	// Check memory cache first (fastest)
	if (memoryCache && memoryCache.expiresAt > now) {
		log.info("Analytics served from memory cache");
		return memoryCache.data;
	}

	// Check database cache (persisted across server restarts)
	try {
		const cachedData = await getCache(cacheKey);
		if (cachedData) {
			log.info("Analytics served from database cache");
			// Update memory cache
			memoryCache = {
				data: cachedData as unknown as AnalyticsSummary,
				expiresAt: now + CACHE_TTL_MS,
			};
			return cachedData as unknown as AnalyticsSummary;
		}
	} catch (error) {
		log.warn("Failed to check database cache:", error);
	}

	// Fetch fresh data from database
	log.info("Fetching fresh analytics data");
	const data = await getSummary({ days });

	// Update memory cache
	memoryCache = {
		data,
		expiresAt: now + CACHE_TTL_MS,
	};

	// Update database cache (async, don't await)
	updateDatabaseCache(cacheKey, data).catch((error) => {
		log.warn("Failed to update database cache:", error);
	});

	return data;
}

/**
 * Update the database cache with fresh data
 */
async function updateDatabaseCache(
	cacheKey: string,
	data: AnalyticsSummary,
): Promise<void> {
	await setCache(cacheKey, data as unknown as Record<string, unknown>, CACHE_TTL_MS);
}

/**
 * Invalidate all caches (useful after manual data updates)
 */
export function invalidateAnalyticsCache(): void {
	memoryCache = null;
	log.info("Analytics memory cache invalidated");
}

/**
 * Get cache status for debugging
 */
export function getCacheStatus(): {
	hasMemoryCache: boolean;
	expiresIn: number | null;
} {
	if (!memoryCache) {
		return { hasMemoryCache: false, expiresIn: null };
	}

	const expiresIn = memoryCache.expiresAt - Date.now();
	return {
		hasMemoryCache: expiresIn > 0,
		expiresIn: expiresIn > 0 ? expiresIn : null,
	};
}
