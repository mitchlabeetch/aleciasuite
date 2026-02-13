import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Analytics Functions for Alecia Analytics Hub
 * Handles ingestion from Vercel Web Analytics drain and data queries
 */

// Ingest a single analytics event from Vercel drain
export const ingestEvent = mutation({
  args: {
    eventId: v.string(),
    eventType: v.string(),
    path: v.string(),
    hostname: v.optional(v.string()),
    referrer: v.optional(v.string()),
    referrerHostname: v.optional(v.string()),
    visitorId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    deviceType: v.optional(v.string()),
    browser: v.optional(v.string()),
    os: v.optional(v.string()),
    country: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    region: v.optional(v.string()),
    city: v.optional(v.string()),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    utmTerm: v.optional(v.string()),
    utmContent: v.optional(v.string()),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if event already exists (deduplication)
    const existing = await ctx.db
      .query("analytics_events")
      .withIndex("by_event_id", (q) => q.eq("eventId", args.eventId))
      .first();

    if (existing) {
      return existing._id;
    }

    // Insert new event
    const id = await ctx.db.insert("analytics_events", {
      ...args,
      createdAt: Date.now(),
    });

    return id;
  },
});

// Batch ingest multiple events
export const ingestBatch = mutation({
  args: {
    events: v.array(
      v.object({
        eventId: v.string(),
        eventType: v.string(),
        path: v.string(),
        hostname: v.optional(v.string()),
        referrer: v.optional(v.string()),
        referrerHostname: v.optional(v.string()),
        visitorId: v.optional(v.string()),
        sessionId: v.optional(v.string()),
        deviceType: v.optional(v.string()),
        browser: v.optional(v.string()),
        os: v.optional(v.string()),
        country: v.optional(v.string()),
        countryCode: v.optional(v.string()),
        region: v.optional(v.string()),
        city: v.optional(v.string()),
        utmSource: v.optional(v.string()),
        utmMedium: v.optional(v.string()),
        utmCampaign: v.optional(v.string()),
        utmTerm: v.optional(v.string()),
        utmContent: v.optional(v.string()),
        timestamp: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let inserted = 0;

    for (const event of args.events) {
      // Check for duplicates
      const existing = await ctx.db
        .query("analytics_events")
        .withIndex("by_event_id", (q) => q.eq("eventId", event.eventId))
        .first();

      if (!existing) {
        await ctx.db.insert("analytics_events", {
          ...event,
          createdAt: now,
        });
        inserted++;
      }
    }

    return { inserted, total: args.events.length };
  },
});

// Get analytics summary for a time period
export const getSummary = query({
  args: {
    days: v.optional(v.number()), // Default 7 days
  },
  handler: async (ctx, args) => {
    const days = args.days ?? 7;
    const startTime = Date.now() - days * 24 * 60 * 60 * 1000;

    // Get all events in time range
    const events = await ctx.db
      .query("analytics_events")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", startTime))
      .collect();

    if (events.length === 0) {
      return {
        visitors: 0,
        pageViews: 0,
        bounceRate: 0,
        topPages: [],
        countries: [],
        devices: { desktop: 0, mobile: 0, tablet: 0 },
        operatingSystems: [],
        referrers: [],
        dailyData: [],
      };
    }

    // Calculate unique visitors
    const uniqueVisitors = new Set(
      events.map((e) => e.visitorId).filter(Boolean),
    );
    const visitors = uniqueVisitors.size || events.length;

    // Calculate page views
    const pageViews = events.filter((e) => e.eventType === "pageview").length;

    // Calculate bounce rate (single page sessions)
    const sessionPages = new Map<string, number>();
    events.forEach((e) => {
      if (e.sessionId) {
        sessionPages.set(e.sessionId, (sessionPages.get(e.sessionId) || 0) + 1);
      }
    });
    const totalSessions = sessionPages.size || 1;
    const bouncedSessions = Array.from(sessionPages.values()).filter(
      (c) => c === 1,
    ).length;
    const bounceRate = Math.round((bouncedSessions / totalSessions) * 100);

    // Top pages
    const pageCounts = new Map<
      string,
      { views: number; visitors: Set<string> }
    >();
    events.forEach((e) => {
      if (e.eventType === "pageview") {
        const existing = pageCounts.get(e.path) || {
          views: 0,
          visitors: new Set(),
        };
        existing.views++;
        if (e.visitorId) existing.visitors.add(e.visitorId);
        pageCounts.set(e.path, existing);
      }
    });
    const topPages = Array.from(pageCounts.entries())
      .map(([path, data]) => ({
        path,
        views: data.views,
        visitors: data.visitors.size,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Countries
    const countryCounts = new Map<string, { name: string; count: number }>();
    events.forEach((e) => {
      if (e.countryCode && e.country) {
        const existing = countryCounts.get(e.countryCode) || {
          name: e.country,
          count: 0,
        };
        existing.count++;
        countryCounts.set(e.countryCode, existing);
      }
    });
    const countries = Array.from(countryCounts.entries())
      .map(([code, data]) => ({ code, name: data.name, visitors: data.count }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 10);

    // Device breakdown
    const devices = { desktop: 0, mobile: 0, tablet: 0 };
    events.forEach((e) => {
      const device = e.deviceType?.toLowerCase() as keyof typeof devices;
      if (device && device in devices) {
        devices[device]++;
      }
    });

    // OS breakdown
    const osCounts = new Map<string, number>();
    events.forEach((e) => {
      if (e.os) {
        osCounts.set(e.os, (osCounts.get(e.os) || 0) + 1);
      }
    });
    const operatingSystems = Array.from(osCounts.entries())
      .map(([name, count]) => ({ name, visitors: count }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 5);

    // Referrers
    const referrerCounts = new Map<string, number>();
    events.forEach((e) => {
      if (e.referrerHostname) {
        referrerCounts.set(
          e.referrerHostname,
          (referrerCounts.get(e.referrerHostname) || 0) + 1,
        );
      }
    });
    const referrers = Array.from(referrerCounts.entries())
      .map(([source, count]) => ({ source, visitors: count }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 10);

    // Daily data for chart
    const dailyMap = new Map<
      string,
      { visitors: Set<string>; pageViews: number }
    >();
    events.forEach((e) => {
      const date = new Date(e.timestamp).toISOString().split("T")[0];
      const existing = dailyMap.get(date) || {
        visitors: new Set(),
        pageViews: 0,
      };
      if (e.visitorId) existing.visitors.add(e.visitorId);
      if (e.eventType === "pageview") existing.pageViews++;
      dailyMap.set(date, existing);
    });
    const dailyData = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        visitors: data.visitors.size,
        pageViews: data.pageViews,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      visitors,
      pageViews,
      bounceRate,
      topPages,
      countries,
      devices,
      operatingSystems,
      referrers,
      dailyData,
    };
  },
});

// Get or set cached data
export const getCache = query({
  args: {
    cacheKey: v.string(),
  },
  handler: async (ctx, args) => {
    const cached = await ctx.db
      .query("analytics_cache")
      .withIndex("by_key", (q) => q.eq("cacheKey", args.cacheKey))
      .first();

    if (!cached || cached.expiresAt < Date.now()) {
      return null;
    }

    return JSON.parse(cached.data);
  },
});

export const setCache = mutation({
  args: {
    cacheKey: v.string(),
    data: v.string(),
    ttlMs: v.optional(v.number()), // Default 1 hour
  },
  handler: async (ctx, args) => {
    const ttl = args.ttlMs ?? 60 * 60 * 1000; // 1 hour default
    const now = Date.now();

    // Delete existing cache entry
    const existing = await ctx.db
      .query("analytics_cache")
      .withIndex("by_key", (q) => q.eq("cacheKey", args.cacheKey))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    // Insert new cache entry
    await ctx.db.insert("analytics_cache", {
      cacheKey: args.cacheKey,
      data: args.data,
      expiresAt: now + ttl,
      createdAt: now,
    });
  },
});

// Clean up old events (older than 90 days)
export const cleanupOldEvents = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;

    const oldEvents = await ctx.db
      .query("analytics_events")
      .withIndex("by_timestamp", (q) => q.lt("timestamp", cutoff))
      .take(1000);

    for (const event of oldEvents) {
      await ctx.db.delete(event._id);
    }

    return { deleted: oldEvents.length };
  },
});

// Clean up expired cache entries
export const cleanupExpiredCache = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const expired = await ctx.db
      .query("analytics_cache")
      .withIndex("by_expires", (q) => q.lt("expiresAt", now))
      .take(100);

    for (const entry of expired) {
      await ctx.db.delete(entry._id);
    }

    return { deleted: expired.length };
  },
});
