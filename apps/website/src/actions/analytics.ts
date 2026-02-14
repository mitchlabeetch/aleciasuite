"use server";

import { db, shared, gte, lt, sql } from "@alepanel/db";
import { getAuthenticatedUser } from "./lib/auth";

/**
 * Analytics Functions for Alecia Analytics Hub
 * Handles ingestion from Vercel Web Analytics drain and data queries
 */

interface AnalyticsEvent {
  eventId: string;
  eventType: string;
  path: string;
  hostname?: string;
  referrer?: string;
  referrerHostname?: string;
  visitorId?: string;
  sessionId?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  timestamp: number;
}

/**
 * Ingest a single analytics event from Vercel drain
 * This is called by the public ingest API endpoint (no auth required)
 */
export async function ingestEvent(args: AnalyticsEvent) {
  // Insert event with deduplication by eventId
  await db
    .insert(shared.analyticsEvents)
    .values({
      eventId: args.eventId,
      eventType: args.eventType,
      path: args.path,
      hostname: args.hostname,
      referrer: args.referrer,
      referrerHostname: args.referrerHostname,
      visitorId: args.visitorId,
      sessionId: args.sessionId,
      deviceType: args.deviceType,
      browser: args.browser,
      os: args.os,
      country: args.country,
      countryCode: args.countryCode,
      region: args.region,
      city: args.city,
      utmSource: args.utmSource,
      utmMedium: args.utmMedium,
      utmCampaign: args.utmCampaign,
      utmTerm: args.utmTerm,
      utmContent: args.utmContent,
      eventTimestamp: args.timestamp,
    })
    .onConflictDoNothing({ target: shared.analyticsEvents.eventId });

  return { success: true };
}

/**
 * Batch ingest multiple events
 * This is called by the public ingest API endpoint (no auth required)
 */
export async function ingestBatch(events: AnalyticsEvent[]) {
  if (events.length === 0) {
    return { inserted: 0, total: 0 };
  }

  const values = events.map((args) => ({
    eventId: args.eventId,
    eventType: args.eventType,
    path: args.path,
    hostname: args.hostname,
    referrer: args.referrer,
    referrerHostname: args.referrerHostname,
    visitorId: args.visitorId,
    sessionId: args.sessionId,
    deviceType: args.deviceType,
    browser: args.browser,
    os: args.os,
    country: args.country,
    countryCode: args.countryCode,
    region: args.region,
    city: args.city,
    utmSource: args.utmSource,
    utmMedium: args.utmMedium,
    utmCampaign: args.utmCampaign,
    utmTerm: args.utmTerm,
    utmContent: args.utmContent,
    eventTimestamp: args.timestamp,
  }));

  await db
    .insert(shared.analyticsEvents)
    .values(values)
    .onConflictDoNothing({ target: shared.analyticsEvents.eventId });

  return { inserted: events.length, total: events.length };
}

interface AnalyticsSummary {
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

/**
 * Get analytics summary for a time period
 */
export async function getSummary(args?: { days?: number }): Promise<AnalyticsSummary> {
  const _user = await getAuthenticatedUser();
  const days = args?.days ?? 7;
  const startTimestamp = Date.now() - days * 24 * 60 * 60 * 1000;

  // Get overall stats
  const [stats] = await db
    .select({
      visitors: sql<number>`count(distinct ${shared.analyticsEvents.visitorId})`,
      pageViews: sql<number>`count(*)`,
    })
    .from(shared.analyticsEvents)
    .where(gte(shared.analyticsEvents.eventTimestamp, startTimestamp));

  // Get top pages
  const topPagesResult = await db
    .select({
      path: shared.analyticsEvents.path,
      views: sql<number>`count(*)`,
      visitors: sql<number>`count(distinct ${shared.analyticsEvents.visitorId})`,
    })
    .from(shared.analyticsEvents)
    .where(gte(shared.analyticsEvents.eventTimestamp, startTimestamp))
    .groupBy(shared.analyticsEvents.path)
    .orderBy(sql`count(*) desc`)
    .limit(10);

  // Get countries
  const countriesResult = await db
    .select({
      code: shared.analyticsEvents.countryCode,
      name: shared.analyticsEvents.country,
      visitors: sql<number>`count(distinct ${shared.analyticsEvents.visitorId})`,
    })
    .from(shared.analyticsEvents)
    .where(gte(shared.analyticsEvents.eventTimestamp, startTimestamp))
    .groupBy(shared.analyticsEvents.countryCode, shared.analyticsEvents.country)
    .orderBy(sql`count(distinct ${shared.analyticsEvents.visitorId}) desc`)
    .limit(10);

  // Get device breakdown
  const devicesResult = await db
    .select({
      deviceType: shared.analyticsEvents.deviceType,
      count: sql<number>`count(distinct ${shared.analyticsEvents.visitorId})`,
    })
    .from(shared.analyticsEvents)
    .where(gte(shared.analyticsEvents.eventTimestamp, startTimestamp))
    .groupBy(shared.analyticsEvents.deviceType);

  const devices = {
    desktop: devicesResult.find((d) => d.deviceType === "desktop")?.count || 0,
    mobile: devicesResult.find((d) => d.deviceType === "mobile")?.count || 0,
    tablet: devicesResult.find((d) => d.deviceType === "tablet")?.count || 0,
  };

  // Get OS breakdown
  const osResult = await db
    .select({
      name: shared.analyticsEvents.os,
      visitors: sql<number>`count(distinct ${shared.analyticsEvents.visitorId})`,
    })
    .from(shared.analyticsEvents)
    .where(gte(shared.analyticsEvents.eventTimestamp, startTimestamp))
    .groupBy(shared.analyticsEvents.os)
    .orderBy(sql`count(distinct ${shared.analyticsEvents.visitorId}) desc`)
    .limit(10);

  // Get referrers
  const referrersResult = await db
    .select({
      source: shared.analyticsEvents.referrerHostname,
      visitors: sql<number>`count(distinct ${shared.analyticsEvents.visitorId})`,
    })
    .from(shared.analyticsEvents)
    .where(gte(shared.analyticsEvents.eventTimestamp, startTimestamp))
    .groupBy(shared.analyticsEvents.referrerHostname)
    .orderBy(sql`count(distinct ${shared.analyticsEvents.visitorId}) desc`)
    .limit(10);

  // Get daily data
  const dailyDataResult = await db
    .select({
      date: sql<string>`to_char(to_timestamp(${shared.analyticsEvents.eventTimestamp} / 1000), 'YYYY-MM-DD')`,
      visitors: sql<number>`count(distinct ${shared.analyticsEvents.visitorId})`,
      pageViews: sql<number>`count(*)`,
    })
    .from(shared.analyticsEvents)
    .where(gte(shared.analyticsEvents.eventTimestamp, startTimestamp))
    .groupBy(sql`to_char(to_timestamp(${shared.analyticsEvents.eventTimestamp} / 1000), 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(to_timestamp(${shared.analyticsEvents.eventTimestamp} / 1000), 'YYYY-MM-DD')`);

  // Calculate bounce rate (sessions with only 1 page view)
  const [bounceData] = await db
    .select({
      totalSessions: sql<number>`count(distinct ${shared.analyticsEvents.sessionId})`,
      bouncedSessions: sql<number>`count(distinct case when session_views = 1 then ${shared.analyticsEvents.sessionId} end)`,
    })
    .from(
      sql`(
        select ${shared.analyticsEvents.sessionId}, count(*) as session_views
        from ${shared.analyticsEvents}
        where ${gte(shared.analyticsEvents.eventTimestamp, startTimestamp)}
        group by ${shared.analyticsEvents.sessionId}
      ) as session_counts`
    );

  const bounceRate = bounceData?.totalSessions
    ? (bounceData.bouncedSessions / bounceData.totalSessions) * 100
    : 0;

  return {
    visitors: stats?.visitors || 0,
    pageViews: stats?.pageViews || 0,
    bounceRate,
    topPages: topPagesResult.map((p) => ({
      path: p.path,
      views: p.views,
      visitors: p.visitors,
    })),
    countries: countriesResult
      .filter((c) => c.code && c.name)
      .map((c) => ({
        code: c.code!,
        name: c.name!,
        visitors: c.visitors,
      })),
    devices,
    operatingSystems: osResult
      .filter((o) => o.name)
      .map((o) => ({
        name: o.name!,
        visitors: o.visitors,
      })),
    referrers: referrersResult
      .filter((r) => r.source)
      .map((r) => ({
        source: r.source!,
        visitors: r.visitors,
      })),
    dailyData: dailyDataResult.map((d) => ({
      date: d.date,
      visitors: d.visitors,
      pageViews: d.pageViews,
    })),
  };
}

/**
 * Get or set cached analytics data
 */
export async function getCache(cacheKey: string): Promise<Record<string, unknown> | null> {
  const now = Date.now();

  const [cache] = await db
    .select()
    .from(shared.analyticsCache)
    .where(
      sql`${shared.analyticsCache.cacheKey} = ${cacheKey} AND ${shared.analyticsCache.expiresAt} > ${now}`
    )
    .limit(1);

  return cache?.data || null;
}

/**
 * Set cached analytics data
 */
export async function setCache(cacheKey: string, data: Record<string, unknown>, ttlMs?: number) {
  const ttl = ttlMs ?? 60 * 60 * 1000; // 1 hour default
  const now = Date.now();
  const expiresAt = now + ttl;

  await db
    .insert(shared.analyticsCache)
    .values({
      cacheKey,
      data,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: shared.analyticsCache.cacheKey,
      set: {
        data,
        expiresAt,
      },
    });

  return { success: true };
}

/**
 * Clean up old events (older than 90 days)
 * This should be run as a cron job
 */
export async function cleanupOldEvents() {
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;

  const _result = await db
    .delete(shared.analyticsEvents)
    .where(lt(shared.analyticsEvents.eventTimestamp, cutoff));

  return { success: true };
}

/**
 * Clean up expired cache entries
 * This should be run as a cron job
 */
export async function cleanupExpiredCache() {
  const now = Date.now();

  const _result = await db
    .delete(shared.analyticsCache)
    .where(lt(shared.analyticsCache.expiresAt, now));

  return { success: true };
}

/* ============================================
 * DASHBOARD STATS
 * Merged from dashboard.ts
 * ============================================ */

interface DashboardStats {
  activeDeals: number;
  pipelineValue: number;
  teamSize: number;
  companiesCount: number;
  recentDeals: Array<{
    id: string;
    title: string;
    stage: string;
    amount?: number;
  }>;
  dealsByStage: Record<string, number>;
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats | null> {
  const _user = await getAuthenticatedUser();

  // TODO: Implement with Drizzle queries once schema is complete
  // Query deals, users, companies tables
  // Aggregate pipeline value
  // Count users
  // Count companies
  // Get recent deals (last 5)
  // Group deals by stage

  return {
    activeDeals: 0,
    pipelineValue: 0,
    teamSize: 0,
    companiesCount: 0,
    recentDeals: [],
    dealsByStage: {},
  };
}

type ActivityType =
  | "deal_created"
  | "deal_updated"
  | "document_created"
  | "document_updated"
  | "numbers_fee_calc"
  | "numbers_model"
  | "numbers_comparable"
  | "numbers_timeline"
  | "numbers_teaser"
  | "numbers_postdeal";

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: number;
  dealId?: string;
  dealTitle?: string;
  toolType?: string;
  userId?: string;
}

/**
 * Unified Activity Feed
 * Aggregates recent activities across all tools
 */
export async function getUnifiedActivityFeed(args?: {
  limit?: number;
  dealId?: string;
}): Promise<ActivityItem[]> {
  const _user = await getAuthenticatedUser();
  const _limit = args?.limit ?? 50;

  // TODO: Implement unified activity aggregation
  // Query recent deals, colab_documents, numbers_* tables
  // Build deal map for enrichment
  // Sort by timestamp descending
  // Return top N items

  return [];
}
