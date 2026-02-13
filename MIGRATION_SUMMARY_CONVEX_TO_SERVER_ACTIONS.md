# Migration Summary: Convex REST API to Server Actions

**Date:** 2026-02-08
**Status:** Complete

## Overview

Migrated 3 files from Convex REST API calls to use PostgreSQL-based server actions.

## Files Migrated

### 1. `/apps/website/src/lib/analytics.ts`

**Before:**
- Used `fetch()` to call Convex REST API endpoints
- Required `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_DEPLOY_KEY` environment variables
- Called `analytics:getSummary`, `analytics:getCache`, and `analytics:setCache`

**After:**
- Imports and calls server actions: `getSummary`, `getCache`, `setCache` from `@/actions/analytics`
- No environment variables required (database connection handled by server actions)
- Maintains the same caching strategy (memory → database → fresh data)

**Changes:**
- Replaced Convex REST API fetch calls with direct server action imports
- Changed "Convex cache" terminology to "database cache"
- Removed all references to `CONVEX_URL` and `CONVEX_DEPLOY_KEY`

### 2. `/apps/website/src/app/api/analytics/ingest/route.ts`

**Before:**
- Posted analytics events to Convex mutation `analytics:ingestBatch`
- Required `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_DEPLOY_KEY`

**After:**
- Calls `ingestBatch` server action from `@/actions/analytics`
- No authentication required (public webhook endpoint)
- Simplified error handling

**Changes:**
- Replaced Convex mutation call with server action call
- Removed environment variable dependencies
- Updated server action to not require authentication (public ingest endpoint)

### 3. `/apps/website/src/app/api/leads/route.ts`

**Before:**
- Posted lead data to Convex mutation `leads:create`
- Required `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_DEPLOY_KEY`
- Stored full lead object with all fields

**After:**
- Calls `createLead` server action from `@/actions/leads`
- Stores leads in PostgreSQL `shared.contacts` table
- Tags contacts with lead type and source

**Changes:**
- Created new server action file: `/apps/website/src/actions/leads.ts`
- Stores leads as contacts with tags: `["lead", "lead-type:{type}", "sector:{sector}"]`
- Source set to "website" by default
- Removed all Convex references

## New Files Created

### `/apps/website/src/actions/leads.ts`

Simple server action that converts lead form data into contact records:
- Maps lead form fields to contact schema
- Generates full name from first/last name or uses email
- Applies appropriate tags for lead tracking
- Stores in `shared.contacts` table

## Server Action Updates

### `/apps/website/src/actions/analytics.ts`

Updated to allow unauthenticated access for ingest operations:
- `ingestEvent`: Removed authentication requirement
- `ingestBatch`: Removed authentication requirement
- Query functions (`getSummary`, `getCache`) still require authentication

## Benefits

1. **Simplified architecture**: No more dual database (Convex + PostgreSQL)
2. **Better type safety**: Direct TypeScript function calls instead of REST API
3. **Reduced latency**: No HTTP overhead for server-to-server calls
4. **Fewer environment variables**: No need for Convex URLs and deploy keys
5. **Unified data layer**: All data in PostgreSQL with Drizzle ORM

## Testing Checklist

- [ ] Analytics summary page loads correctly
- [ ] Analytics cache (memory + database) works
- [ ] Vercel analytics drain successfully ingests events
- [ ] Lead form submissions create contacts
- [ ] Email notifications still sent for leads
- [ ] No Convex references remain in migrated files

## Verification

Run these commands to verify no Convex references remain:

```bash
# Check for Convex references in migrated files
grep -i "convex" apps/website/src/lib/analytics.ts
grep -i "convex" apps/website/src/app/api/analytics/ingest/route.ts
grep -i "convex" apps/website/src/app/api/leads/route.ts

# All should return: (no matches)
```

## Next Steps

1. Test all three endpoints in development
2. Verify analytics data flows correctly
3. Test lead form submission end-to-end
4. Update any documentation referencing Convex for these features
5. Remove unused Convex schema definitions for leads and analytics

## Rollback Plan

If issues arise, revert commits for these three files and restore environment variables:
- `NEXT_PUBLIC_CONVEX_URL`
- `CONVEX_DEPLOY_KEY`
