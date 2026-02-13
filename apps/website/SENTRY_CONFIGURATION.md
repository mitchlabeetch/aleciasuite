# Sentry Configuration Guide

**Application:** Alecia Panel Website  
**Last Updated:** January 31, 2026  
**Sentry Version:** @sentry/nextjs (Latest)

---

## Table of Contents

1. [Overview](#overview)
2. [Current Configuration](#current-configuration)
3. [Environment Variables](#environment-variables)
4. [Configuration Files](#configuration-files)
5. [Alert Setup](#alert-setup)
6. [Testing Sentry](#testing-sentry)
7. [Source Maps](#source-maps)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Overview

Sentry is configured to capture errors, performance metrics, and user sessions across all runtime environments in the Next.js application:

- **Client-side** (Browser) - `sentry.client.config.ts`
- **Server-side** (Node.js) - `sentry.server.config.ts`
- **Edge Runtime** (Middleware, Edge routes) - `sentry.edge.config.ts`

### What Sentry Monitors

- ✅ JavaScript runtime errors
- ✅ Unhandled promise rejections
- ✅ Server-side errors
- ✅ API route failures
- ✅ Performance metrics
- ✅ User session replays (on error)
- ✅ Custom breadcrumbs and events

---

## Current Configuration

### Client-Side (Browser)

**File:** `/apps/website/sentry.client.config.ts`

```typescript
{
  enabled: process.env.NODE_ENV === "production",
  tracesSampleRate: 0.1,  // 10% of transactions
  replaysOnErrorSampleRate: 1.0,  // 100% of sessions with errors
  replaysSessionSampleRate: 0.1,  // 10% of all sessions
  
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,  // Privacy: mask user text
      blockAllMedia: true  // Privacy: block images/videos
    })
  ],
  
  ignoreErrors: [
    "window.webkit",
    "ResizeObserver loop",
    "Failed to fetch",
    "NetworkError",
    "Load failed",
    "AbortError"
  ]
}
```

**Key Features:**
- Session replay captures 100% of error sessions
- Privacy-first: all text and media masked
- Filters out common browser noise
- Only active in production

### Server-Side (Node.js)

**File:** `/apps/website/sentry.server.config.ts`

```typescript
{
  enabled: process.env.NODE_ENV === "production",
  tracesSampleRate: 0.1,  // 10% of transactions
  
  integrations: [
    Sentry.httpIntegration()  // HTTP request tracking
  ],
  
  ignoreErrors: [
    "NEXT_NOT_FOUND",  // 404 errors (expected)
    "NEXT_REDIRECT"    // Redirects (not errors)
  ]
}
```

**Key Features:**
- Tracks API route errors
- Monitors server-side rendering errors
- Filters out Next.js expected errors
- HTTP request performance tracking

### Edge Runtime

**File:** `/apps/website/sentry.edge.config.ts`

```typescript
{
  enabled: process.env.NODE_ENV === "production",
  tracesSampleRate: 0.1
}
```

**Key Features:**
- Lightweight configuration for edge
- Monitors middleware errors
- Edge function error tracking

---

## Environment Variables

### Required Variables

```bash
# Public DSN (safe to expose in browser)
NEXT_PUBLIC_SENTRY_DSN=https://[key]@o[org].ingest.sentry.io/[project]

# Auth token for uploading source maps
SENTRY_AUTH_TOKEN=sntrys_[token]

# Organization slug
SENTRY_ORG=your-org-name

# Project name
SENTRY_PROJECT=alepanel-website
```

### How to Get These Values

#### 1. NEXT_PUBLIC_SENTRY_DSN

1. Go to [Sentry Dashboard](https://sentry.io)
2. Select your project or create new one
3. Navigate to **Settings** > **Projects** > **[Your Project]**
4. Click **Client Keys (DSN)**
5. Copy the DSN URL

**Format:** `https://[public-key]@o[org-id].ingest.sentry.io/[project-id]`

#### 2. SENTRY_AUTH_TOKEN

1. Go to **Settings** > **Account** > **API** > **Auth Tokens**
2. Click **Create New Token**
3. Configure token:
   - **Name:** "Vercel Deployment - Alepanel"
   - **Scopes:**
     - `project:read`
     - `project:releases`
     - `org:read`
   - **Projects:** Select your project
4. Click **Create Token**
5. Copy the token (shown only once!)

**Security:** 🔒 Mark as secret in Vercel

#### 3. SENTRY_ORG

1. In Sentry dashboard, click your organization name (top-left)
2. Go to **Organization Settings** > **General Settings**
3. Copy the **Organization Slug**

**Example:** `alecia-markets`

#### 4. SENTRY_PROJECT

1. Go to **Settings** > **Projects**
2. Click on your project
3. Copy the **Project Slug**

**Example:** `alepanel-website`

### Setting Variables in Vercel

1. Go to Vercel Dashboard > Project Settings
2. Navigate to **Environment Variables**
3. Add each variable:
   - `NEXT_PUBLIC_SENTRY_DSN` - **Production, Preview** (not secret)
   - `SENTRY_AUTH_TOKEN` - **Production, Preview** (secret ✓)
   - `SENTRY_ORG` - **Production, Preview** (not secret)
   - `SENTRY_PROJECT` - **Production, Preview** (not secret)

---

## Configuration Files

### Sentry Properties File

**File:** `/apps/website/sentry.properties`

If this file exists, it should contain:

```properties
defaults.url=https://sentry.io/
defaults.org=your-org-name
defaults.project=alepanel-website
```

**Note:** This file is typically auto-generated during build.

### Next.js Sentry Integration

Sentry is integrated with Next.js via `@sentry/nextjs` package, which automatically:

- Injects Sentry into all pages and API routes
- Uploads source maps during build
- Configures webpack for error tracking
- Sets up performance monitoring

---

## Alert Setup

### Recommended Alert Rules

#### 1. Critical Error Alert

**Trigger:** Any error occurs in production

1. Go to **Alerts** > **Create Alert**
2. Configure:
   - **Name:** "Production Critical Errors"
   - **Environment:** Production
   - **When:** An event is first seen
   - **Conditions:**
     - Level: Error or Fatal
     - Environment: production
   - **Actions:**
     - Send email to: `tech-team@alecia.fr`
     - Send Slack notification to: `#alerts`

**Response Time:** Immediate

#### 2. High Error Rate Alert

**Trigger:** More than 50 errors in 1 hour

1. Create new alert
2. Configure:
   - **Name:** "High Error Rate - Production"
   - **When:** Event frequency is above threshold
   - **Conditions:**
     - Events: > 50 in 1 hour
     - Environment: production
   - **Actions:**
     - Send email
     - Create PagerDuty incident

**Response Time:** 15 minutes

#### 3. Performance Degradation

**Trigger:** Page load time > 3 seconds

1. Create new alert
2. Configure:
   - **Name:** "Slow Page Loads"
   - **Metric:** Transaction duration
   - **When:** Average duration > 3000ms
   - **Window:** 15 minutes
   - **Actions:**
     - Send Slack notification

**Response Time:** 30 minutes

#### 4. New Error Pattern Alert

**Trigger:** New type of error appears

1. Create new alert
2. Configure:
   - **Name:** "New Error Pattern Detected"
   - **When:** An event is first seen
   - **Conditions:**
     - Environment: production
     - Level: Error or Fatal
   - **Actions:**
     - Send email to on-call engineer

**Response Time:** Immediate

---

## Testing Sentry

### Test Client-Side Error

Add this to any page temporarily:

```typescript
// In a client component
'use client';

export default function TestPage() {
  const triggerError = () => {
    throw new Error('Test error from client');
  };

  return <button onClick={triggerError}>Trigger Sentry Test</button>;
}
```

### Test Server-Side Error

Add this to an API route:

```typescript
// /app/api/test-sentry/route.ts
export async function GET() {
  throw new Error('Test error from server');
}
```

### Test Error via Console

In browser console:

```javascript
// Trigger a client error
Sentry.captureException(new Error('Manual test error'));

// Capture a message
Sentry.captureMessage('Test message from console');
```

### Verify Error Appears in Sentry

1. Trigger test error
2. Go to Sentry Dashboard
3. Check **Issues** tab
4. Verify error appears within 1 minute
5. Check that source maps show correct file/line
6. Verify breadcrumbs are captured

---

## Source Maps

Source maps allow Sentry to show you the original source code location of errors, not minified/bundled code.

### Automatic Upload

Source maps are automatically uploaded during production builds via `@sentry/nextjs`.

**Build Output:**
```
> Uploading source maps to Sentry
✓ Source maps uploaded successfully
```

### Manual Upload (if needed)

```bash
# Install Sentry CLI
npm install -g @sentry/cli

# Login
sentry-cli login

# Upload source maps
sentry-cli sourcemaps upload \
  --org=your-org \
  --project=alepanel-website \
  --release=$VERCEL_GIT_COMMIT_SHA \
  .next
```

### Verify Source Maps

1. Go to Sentry Dashboard
2. Navigate to **Settings** > **Projects** > **Source Maps**
3. Select latest release
4. Verify files are listed
5. Trigger test error and check stack trace shows original code

---

## Best Practices

### 1. Use Breadcrumbs

Add context before errors occur:

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.addBreadcrumb({
  category: 'auth',
  message: 'User attempted login',
  level: 'info',
  data: { userId: user.id }
});
```

### 2. Set User Context

Help identify which users are affected:

```typescript
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.name
});
```

### 3. Add Tags for Filtering

Tag errors for easy filtering:

```typescript
Sentry.setTag('feature', 'checkout');
Sentry.setTag('payment_method', 'stripe');
```

### 4. Custom Error Boundaries

Wrap critical components:

```typescript
import * as Sentry from '@sentry/nextjs';

function ErrorBoundary({ children }) {
  return (
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      {children}
    </Sentry.ErrorBoundary>
  );
}
```

### 5. Performance Monitoring

Track custom transactions:

```typescript
const transaction = Sentry.startTransaction({
  name: 'Checkout Process',
  op: 'transaction'
});

// Your code here

transaction.finish();
```

### 6. Filter Sensitive Data

Already configured to mask:
- All text in session replays
- All media in session replays
- PII data automatically scrubbed

**Additional filtering:**

```typescript
beforeSend(event, hint) {
  // Remove sensitive data
  if (event.request?.headers) {
    delete event.request.headers['authorization'];
  }
  return event;
}
```

---

## Troubleshooting

### Errors Not Appearing in Sentry

**Check:**

1. **Environment:** Sentry is disabled in development
   ```typescript
   enabled: process.env.NODE_ENV === "production"
   ```

2. **DSN configured:** Verify `NEXT_PUBLIC_SENTRY_DSN` is set
   ```bash
   # In browser console
   console.log(process.env.NEXT_PUBLIC_SENTRY_DSN);
   ```

3. **Network:** Check browser Network tab for requests to `sentry.io`

4. **Quota:** Check Sentry dashboard for quota limits

5. **beforeSend:** Ensure not filtering out all events

### Source Maps Not Working

**Check:**

1. **Auth token:** Verify `SENTRY_AUTH_TOKEN` is set in Vercel
2. **Build logs:** Check Vercel build logs for upload errors
3. **Release matching:** Verify release name matches
4. **Project settings:** Check Sentry project has source maps enabled

### Duplicate Errors

**Cause:** Error reported from multiple places (client + server)

**Solution:** Use `captureException` only once per error:

```typescript
try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error);
  throw error; // Don't capture again
}
```

### Too Many Events

**Reduce volume:**

1. Lower sample rates in config
2. Add more ignored errors
3. Use `beforeSend` to filter
4. Increase alert thresholds

### Session Replay Not Working

**Check:**

1. **Configuration:** Verify `replayIntegration` is added
2. **Sample rates:** Check `replaysOnErrorSampleRate` and `replaysSessionSampleRate`
3. **Browser support:** Replay requires modern browsers
4. **Privacy settings:** Verify masking settings are correct

---

## Sentry Dashboard Tour

### Key Sections

1. **Issues** - All errors and their frequency
2. **Performance** - Transaction performance metrics
3. **Replays** - Session replay recordings
4. **Releases** - Deployment tracking
5. **Alerts** - Alert rule configuration

### Issue Triage Workflow

1. **Unresolved** → Review new issues daily
2. **For Review** → Team review in weekly meeting
3. **Resolved** → Mark fixed issues
4. **Ignored** → Mark known/acceptable issues

### Release Tracking

Each deployment creates a new release in Sentry, automatically tagged with:
- Git commit SHA
- Deployment timestamp
- Source maps
- Commit messages

---

## Integration with Vercel

Sentry automatically integrates with Vercel deployments:

1. **Release tracking** - Each deployment = new release
2. **Source maps** - Uploaded during build
3. **Environment tagging** - Production/Preview automatically tagged
4. **Commit tracking** - Git metadata included

**Vercel Integration:**
- Install Sentry integration in Vercel marketplace (optional)
- Enables deployment notifications in Sentry
- Links errors to specific deployments

---

## Monitoring Checklist

After deploying to production:

- [ ] Trigger test error and verify appears in Sentry
- [ ] Check source maps show correct code
- [ ] Verify alert rules are active
- [ ] Test email notifications work
- [ ] Verify session replay captures errors
- [ ] Check performance metrics are being tracked
- [ ] Ensure user context is being set
- [ ] Verify breadcrumbs are helpful
- [ ] Test error boundary fallbacks
- [ ] Review and adjust sampling rates if needed

---

## Support Resources

- **Sentry Docs:** [docs.sentry.io](https://docs.sentry.io)
- **Next.js Integration:** [docs.sentry.io/platforms/javascript/guides/nextjs](https://docs.sentry.io/platforms/javascript/guides/nextjs)
- **Support:** support@sentry.io
- **Status:** [status.sentry.io](https://status.sentry.io)
- **Community:** [discord.gg/sentry](https://discord.gg/sentry)

---

## Change Log

| Date | Change | Updated By |
|------|--------|------------|
| 2026-01-31 | Initial Sentry configuration documentation | Phase 4 Deployment |

---

**End of Sentry Configuration Guide**
