import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

/**
 * Scheduled Jobs (Cron)
 *
 * Convex cron jobs for automated maintenance tasks:
 * - OAuth token refresh (prevents expiration)
 * - Calendar sync (syncs Google/Microsoft calendars)
 * - Rate limit cleanup (removes expired entries)
 * - Presence cleanup (removes stale presence records)
 */

const crons = cronJobs();

// =============================================================================
// OAUTH TOKEN REFRESH
// =============================================================================

/**
 * Refresh OAuth tokens before they expire
 * Runs every 30 minutes to ensure tokens are always fresh
 *
 * Checks:
 * - Google tokens (refreshes if expiring within 10 minutes)
 * - Microsoft tokens (refreshes if expiring within 10 minutes)
 * - Pipedrive tokens (refreshes if expiring within 10 minutes)
 */
crons.interval(
	"refresh-oauth-tokens",
	{ minutes: 30 },
	internal.tokenRefresh.refreshAllTokens,
);

// =============================================================================
// CALENDAR SYNC
// =============================================================================

/**
 * Sync calendar events from Google and Microsoft
 * Runs every 15 minutes to keep events up-to-date
 *
 * Features:
 * - Syncs all users with enabled calendar sync
 * - Uses delta sync for Microsoft (efficient incremental updates)
 * - Backs off after 5 consecutive errors per user
 */
crons.interval(
	"sync-calendars",
	{ minutes: 15 },
	internal.actions.calendarSync.syncAllCalendars,
);

// =============================================================================
// CLEANUP JOBS
// =============================================================================

/**
 * Clean up expired rate limit entries
 * Runs every hour to keep the rate_limit_entries table clean
 */
crons.interval(
	"cleanup-rate-limits",
	{ hours: 1 },
	internal.lib.rateLimit.cleanupExpiredEntries,
);

/**
 * Clean up stale presence records
 * Removes users who haven't been seen in 5+ minutes
 * Runs every 5 minutes
 */
crons.interval(
	"cleanup-stale-presence",
	{ minutes: 5 },
	internal.maintenance.cleanupStalePresence,
);

/**
 * Clean up old Yjs updates
 * Merges incremental updates into main document state
 * Runs every hour
 */
crons.interval(
	"compact-yjs-updates",
	{ hours: 1 },
	internal.maintenance.compactYjsUpdates,
);

// =============================================================================
// EMAIL DIGESTS
// =============================================================================

/**
 * Send daily digest emails
 * Sends activity summaries to users who have daily digest enabled
 * Runs every day at 9:00 AM UTC (adjust timezone as needed)
 */
crons.daily(
	"send-daily-digests",
	{ hourUTC: 9, minuteUTC: 0 },
	internal.digest.sendScheduledDigests,
	{ frequency: "daily" },
);

/**
 * Send weekly digest emails
 * Sends weekly activity summaries to users who have weekly digest enabled
 * Runs every Monday at 9:00 AM UTC
 */
crons.weekly(
	"send-weekly-digests",
	{ dayOfWeek: "monday", hourUTC: 9, minuteUTC: 0 },
	internal.digest.sendScheduledDigests,
	{ frequency: "weekly" },
);

export default crons;
