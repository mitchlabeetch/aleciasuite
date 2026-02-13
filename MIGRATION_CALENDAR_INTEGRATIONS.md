# Calendar & Integrations Migration Summary

## Files Ported (Batch: Calendar, Microsoft, Google, Pipedrive, Slack, Token Refresh)

### Source Files (Convex)
1. `/convex/calendar.ts` → Calendar queries & mutations
2. `/convex/actions/microsoftCalendar.ts` → MS Calendar sync
3. `/convex/actions/calendarSync.ts` → Scheduled sync job
4. `/convex/actions/microsoft.ts` → MS Graph API operations
5. `/convex/microsoft_db.ts` → MS token storage
6. `/convex/actions/google.ts` → Google Calendar API
7. `/convex/google_db.ts` → Google token storage
8. `/convex/pipedrive_db.ts` → Pipedrive bidirectional sync
9. `/convex/slack.ts` → Slack webhook notifications
10. `/convex/tokenRefresh.ts` → Automated token refresh

### Output Files (Server Actions)
1. `/apps/website/src/actions/calendar.ts` (merged 1+2+3)
2. `/apps/website/src/actions/integrations/microsoft.ts` (merged 4+5)
3. `/apps/website/src/actions/integrations/google.ts` (merged 6+7)
4. `/apps/website/src/actions/integrations/pipedrive-sync.ts` (8)
5. `/apps/website/src/actions/integrations/slack.ts` (9)
6. `/apps/website/src/actions/integrations/token-refresh.ts` (10)
7. `/apps/website/src/actions/integrations/index.ts` (re-exports)

---

## Migration Strategy

### 1. Token Storage (OAuth)
**Before (Convex):**
- Custom tables: `microsoft_tokens`, `google_tokens`, `pipedrive_tokens`
- Singleton pattern (one token per provider)

**After (Drizzle):**
- Uses BetterAuth `shared.account` table
- Standard OAuth flow with `provider_id`, `user_id`
- Columns: `access_token`, `refresh_token`, `access_token_expires_at`, `scope`

### 2. Calendar Tables (TODO)
**Missing from schema:**
- `calendar_events` — local event storage
- `calendar_sync_state` — sync state per user/provider

**Temporary solution:**
- Added TODO comments with inline type definitions
- Functions return empty arrays with console warnings
- Schema must be updated before calendar features work

### 3. Integration Package Usage
**Uses `@alepanel/integrations`:**
- `microsoft.createGraphClient(accessToken)` — MS Graph client
- `pipedrive` — OAuth helpers (unused in sync, but available)
- `google` — No client needed (using fetch directly)

---

## Key Functions Ported

### Calendar
- `getEvents()` — Query events by date range, source, deal
- `getUpcomingEvents()` — Next 7 days
- `createEvent()` — Manual events
- `updateEvent()`, `deleteEvent()`, `linkEventToDeal()`
- `toggleSync()` — Enable/disable provider sync
- `upsertEventsFromSync()` — Called by MS/Google sync

### Microsoft Integration
- **OAuth:** `getMicrosoftAuthUrl()`, `exchangeMicrosoftCode()`
- **Calendar:** `fetchMicrosoftCalendarEvents()`, `createMicrosoftCalendarEvent()`
- **OneDrive:** `getOneDriveFiles()`
- **Excel:** `readExcelRange()` — Read Excel data from OneDrive
- **Token:** Auto-refresh logic in `getMicrosoftAccessToken()`

### Google Integration
- **OAuth:** `getGoogleAuthUrl()`, `exchangeGoogleCode()`, `disconnectGoogle()`
- **Calendar:** `fetchGoogleCalendarEvents()`, `createGoogleCalendarEvent()`, `deleteGoogleCalendarEvent()`
- **Token:** Auto-refresh logic in `getGoogleAccessToken()`

### Pipedrive Integration
- **Sync:** `upsertCompanyFromPipedrive()`, `upsertContactFromPipedrive()`, `upsertDealFromPipedrive()`
- **Linking:** `linkDealToPipedrive()` — Link Convex deal to Pipedrive
- **Queries:** `getCompanyByPipedriveId()`, `getDealById()`
- **Bidirectional:** `syncFromPipedrive()` (placeholder, needs API client)

### Slack Integration
- **Config:** `configureSlack()`, `toggleSlack()`
- **Test:** `sendTestSlackMessage()`
- **Notifications:** `postDealUpdate()`, `postDealClosed()`, `postSignatureRequest()`
- **Storage:** Uses `global_config` table (TODO: add to schema)

### Token Refresh
- **Scheduled:** `refreshAllTokens()` — Cron job to refresh all providers
- **Individual:** Refreshes Google, Microsoft, Pipedrive tokens 10 minutes before expiry
- **Storage:** Updates BetterAuth `account` table directly

---

## Missing Tables & Schema Updates

### 1. Add to `/packages/db/src/schema/shared.ts`

```typescript
// Calendar events
export const calendarEvents = shared.table("calendar_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  externalId: text("external_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startDateTime: timestamp("start_date_time", { withTimezone: true }).notNull(),
  endDateTime: timestamp("end_date_time", { withTimezone: true }).notNull(),
  isAllDay: boolean("is_all_day").default(false),
  location: text("location"),
  source: text("source").notNull(), // "microsoft" | "google" | "manual"
  ownerId: uuid("owner_id").references(() => users.id, { onDelete: "cascade" }),
  dealId: uuid("deal_id").references(() => deals.id, { onDelete: "set null" }),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  organizer: jsonb("organizer"), // { name?: string; email: string }
  attendees: jsonb("attendees").default([]), // Array<{ name?, email, responseStatus? }>
  isOnlineMeeting: boolean("is_online_meeting").default(false),
  onlineMeetingUrl: text("online_meeting_url"),
  onlineMeetingProvider: text("online_meeting_provider"),
  status: text("status"), // "confirmed" | "tentative" | "cancelled"
  iCalUId: text("ical_uid"),
  changeKey: text("change_key"),
  recurrence: text("recurrence"),
  recurringEventId: text("recurring_event_id"),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Calendar sync state
export const calendarSyncState = shared.table("calendar_sync_state", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // "microsoft" | "google"
  isEnabled: boolean("is_enabled").default(true),
  syncDirection: text("sync_direction").default("import_only"), // "import_only" | "export_only" | "bidirectional"
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  syncToken: text("sync_token"), // Delta link or sync token
  lastError: text("last_error"),
  lastErrorAt: timestamp("last_error_at", { withTimezone: true }),
  consecutiveErrors: integer("consecutive_errors").default(0),
  syncPastDays: integer("sync_past_days").default(30),
  syncFutureDays: integer("sync_future_days").default(90),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Global config (for Slack, etc.)
export const globalConfig = shared.table("global_config", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
```

### 2. Create Migration

Create `/infrastructure/postgres/migrations/V002__calendar_and_config.sql`:

```sql
-- Calendar events table
CREATE TABLE shared.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_date_time TIMESTAMPTZ NOT NULL,
  end_date_time TIMESTAMPTZ NOT NULL,
  is_all_day BOOLEAN DEFAULT FALSE,
  location TEXT,
  source TEXT NOT NULL,
  owner_id UUID REFERENCES shared.users(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES shared.deals(id) ON DELETE SET NULL,
  company_id UUID REFERENCES shared.companies(id) ON DELETE SET NULL,
  organizer JSONB,
  attendees JSONB DEFAULT '[]'::jsonb,
  is_online_meeting BOOLEAN DEFAULT FALSE,
  online_meeting_url TEXT,
  online_meeting_provider TEXT,
  status TEXT,
  ical_uid TEXT,
  change_key TEXT,
  recurrence TEXT,
  recurring_event_id TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_calendar_events_owner_start ON shared.calendar_events(owner_id, start_date_time);
CREATE INDEX idx_calendar_events_external_id ON shared.calendar_events(source, external_id);
CREATE INDEX idx_calendar_events_deal ON shared.calendar_events(deal_id);

-- Calendar sync state table
CREATE TABLE shared.calendar_sync_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES shared.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  sync_direction TEXT DEFAULT 'import_only',
  last_synced_at TIMESTAMPTZ,
  sync_token TEXT,
  last_error TEXT,
  last_error_at TIMESTAMPTZ,
  consecutive_errors INTEGER DEFAULT 0,
  sync_past_days INTEGER DEFAULT 30,
  sync_future_days INTEGER DEFAULT 90,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Global config table
CREATE TABLE shared.global_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Migration Checklist

### Immediate (to make code functional)
- [ ] Add calendar and config tables to schema (see above)
- [ ] Run migration V002
- [ ] Update calendar.ts to use real DB queries (remove TODOs)
- [ ] Test OAuth flows for Microsoft and Google
- [ ] Test Pipedrive sync (may need API client implementation)

### Testing
- [ ] Test Microsoft calendar sync
- [ ] Test Google calendar sync
- [ ] Test manual calendar event creation
- [ ] Test Slack notifications
- [ ] Test token refresh cron job
- [ ] Test Pipedrive bidirectional sync

### Cron Jobs (for token refresh)
- [ ] Set up cron job to call `refreshAllTokens()` every 30 minutes
- [ ] Set up cron job for calendar sync (if needed)

---

## Notes

1. **BetterAuth Integration**: All OAuth tokens now use BetterAuth's `account` table instead of custom token tables. This is more standard and leverages BetterAuth's built-in OAuth support.

2. **Calendar Sync Logic**: The scheduled calendar sync logic (from `calendarSync.ts`) was merged into the calendar actions. You may want to create a separate cron job file that calls the sync functions.

3. **Pipedrive API Client**: The `syncFromPipedrive()` function is a placeholder. You'll need to implement the actual API calls using the `@alepanel/integrations` pipedrive client.

4. **Slack Global Config**: The Slack webhook configuration is stored in a `global_config` table (key-value store). This pattern can be reused for other global settings.

5. **Excel Integration**: The Microsoft integration includes Excel read/write operations via Graph API. This is useful for importing financial data from OneDrive.

6. **Token Encryption**: The original Convex code had token encryption logic. This was removed in favor of BetterAuth's built-in token management. If you need encryption, consider using BetterAuth's encryption features or implementing at the database level.

---

## File Paths (for reference)

### Created Files
- `/Users/utilisateur/Desktop/alepanel/apps/website/src/actions/calendar.ts`
- `/Users/utilisateur/Desktop/alepanel/apps/website/src/actions/integrations/microsoft.ts`
- `/Users/utilisateur/Desktop/alepanel/apps/website/src/actions/integrations/google.ts`
- `/Users/utilisateur/Desktop/alepanel/apps/website/src/actions/integrations/pipedrive-sync.ts`
- `/Users/utilisateur/Desktop/alepanel/apps/website/src/actions/integrations/slack.ts`
- `/Users/utilisateur/Desktop/alepanel/apps/website/src/actions/integrations/token-refresh.ts`
- `/Users/utilisateur/Desktop/alepanel/apps/website/src/actions/integrations/index.ts`

### Usage Example
```typescript
import {
  getEvents,
  createEvent,
  getMicrosoftAuthUrl,
  fetchGoogleCalendarEvents,
  postDealUpdate,
  refreshAllTokens,
} from "@/actions/integrations";
```

---

**End of Migration Summary**
