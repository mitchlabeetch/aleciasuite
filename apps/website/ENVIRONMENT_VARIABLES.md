# Environment Variables Documentation

**Last Updated:** January 31, 2026  
**Application:** Alecia Panel Website  
**Environment:** Production

---

## Overview

This document provides comprehensive documentation for all environment variables used in the Alecia Panel website application. Environment variables are used to configure the application for different environments (development, preview, production) and to securely store sensitive credentials.

---

## Configuration Files

- **Development:** `.env.local` (not committed to git)
- **Production Template:** `.env.production.example` (committed to git, no sensitive data)
- **Production Actual:** Set in Vercel Dashboard (never committed to git)

---

## Required Variables (CRITICAL)

These variables MUST be set in production for the application to function correctly.

### 1. Clerk Authentication

**Purpose:** User authentication and authorization

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
```

**How to Get:**
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your production application
3. Navigate to "API Keys"
4. Copy the "Publishable key" (starts with `pk_live_`)
5. Copy the "Secret key" (starts with `sk_live_`)

**Security:**
- ✅ `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Safe to expose (client-side)
- 🔒 `CLERK_SECRET_KEY` - **MUST BE SECRET** (server-side only)

**Verification:**
- Test login/signup flows work
- Check user sessions persist correctly
- Verify admin dashboard authentication

---

### 2. Convex Database

**Purpose:** Backend database and real-time data sync

```bash
NEXT_PUBLIC_CONVEX_URL=https://your-production-project.convex.cloud
```

**How to Get:**
1. Go to [Convex Dashboard](https://dashboard.convex.dev)
2. Select your **PRODUCTION** deployment (not dev)
3. Copy the deployment URL from "Settings" > "URL & Deploy Key"

**Security:**
- ✅ Safe to expose (client-side)
- Ensure this points to PRODUCTION deployment, not development

**Verification:**
- Check data loads on public pages (team, operations, careers)
- Test admin CRUD operations work
- Verify real-time updates function

---

### 3. Convex Deploy Key

**Purpose:** Server-side mutations and Convex function calls

```bash
CONVEX_DEPLOY_KEY=prod:...
```

**How to Get:**
1. Go to [Convex Dashboard](https://dashboard.convex.dev)
2. Select your production deployment
3. Navigate to "Settings" > "Deploy Keys"
4. Copy the production deploy key (starts with `prod:`)

**Security:**
- 🔒 **MUST BE SECRET** (server-side only)
- Never expose in client code

**Verification:**
- Test server actions work (email sending, data mutations)
- Check API routes can query Convex

---

### 4. Resend Email API

**Purpose:** Sending lead notification emails from contact forms and wizards

```bash
RESEND_API_KEY=re_...
LEAD_EMAIL_TO=contact@alecia.fr
```

**How to Get:**
1. Go to [Resend Dashboard](https://resend.com/api-keys)
2. Create a new API key (or use existing)
3. Set appropriate domain permissions

**Configuration:**
- `RESEND_API_KEY`: Your Resend API key
- `LEAD_EMAIL_TO`: Email address to receive lead notifications
  - Production: `contact@alecia.fr`
  - Development: `editionsrevel@gmail.com`

**Security:**
- 🔒 **MUST BE SECRET** (server-side only)

**Verification:**
- Submit contact form and check email arrives
- Test buy/sell wizards send notifications
- Check email formatting and content

---

### 5. Sentry Error Monitoring

**Purpose:** Production error tracking and monitoring

```bash
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=sntrys_...
SENTRY_ORG=your-org-name
SENTRY_PROJECT=alepanel-website
```

**How to Get:**
1. Go to [Sentry Dashboard](https://sentry.io)
2. Create a new project (or use existing)
3. Get DSN from "Settings" > "Client Keys (DSN)"
4. Create auth token from "Settings" > "Account" > "API" > "Auth Tokens"

**Configuration:**
- `NEXT_PUBLIC_SENTRY_DSN`: Public DSN for error reporting
- `SENTRY_AUTH_TOKEN`: For uploading source maps
- `SENTRY_ORG`: Your Sentry organization slug
- `SENTRY_PROJECT`: Project name (e.g., `alepanel-website`)

**Security:**
- ✅ `NEXT_PUBLIC_SENTRY_DSN` - Safe to expose
- 🔒 `SENTRY_AUTH_TOKEN` - **MUST BE SECRET**

**Verification:**
- Check errors appear in Sentry dashboard
- Verify source maps are uploaded correctly
- Test alert notifications work

---

### 6. Domain Configuration

**Purpose:** Configure application URLs for different services

```bash
NEXT_PUBLIC_SITE_URL=https://alecia.markets
NEXT_PUBLIC_ALECIA_MARKETING_URL=https://alecia.markets
NEXT_PUBLIC_ALECIA_COLAB_URL=https://colab.alecia.markets
```

**Configuration:**
- `NEXT_PUBLIC_SITE_URL`: Main website URL
- `NEXT_PUBLIC_ALECIA_MARKETING_URL`: Marketing site URL
- `NEXT_PUBLIC_ALECIA_COLAB_URL`: Collaboration tool URL

**Security:**
- ✅ All safe to expose (client-side)

**Verification:**
- Check navigation links point to correct domains
- Verify canonical URLs are correct
- Test cross-app navigation works

---

### 7. Contact Information

**Purpose:** Display contact info in UI (floating buttons, footer)

```bash
NEXT_PUBLIC_CONTACT_PHONE=+33 1 XX XX XX XX
NEXT_PUBLIC_CONTACT_EMAIL=contact@alecia.markets
NEXT_PUBLIC_WHATSAPP_NUMBER=+33600000000
```

**Security:**
- ✅ All safe to expose (publicly displayed)

**Verification:**
- Check footer displays correct contact info
- Verify floating action buttons link correctly
- Test WhatsApp link opens correct chat

---

## Optional Variables

These variables enhance functionality but are not required for basic operation.

### 8. Microsoft OAuth (Office 365 Integration)

```bash
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
```

**Purpose:** Microsoft Office 365 integration (optional feature)

**How to Get:**
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to "App Registrations"
3. Create new registration or use existing
4. Configure redirect URIs and permissions

**Required Scopes:**
- `User.Read`
- `Mail.Read`
- `Calendars.Read`
- `Files.Read.All`

**Security:**
- 🔒 Both **MUST BE SECRET**

---

### 9. Pipedrive OAuth (CRM Integration)

```bash
PIPEDRIVE_CLIENT_ID=...
PIPEDRIVE_CLIENT_SECRET=...
```

**Purpose:** Pipedrive CRM integration (optional feature)

**How to Get:**
1. Go to [Pipedrive Marketplace](https://pipedrive.readme.io/docs/marketplace-oauth)
2. Create OAuth app
3. Configure permissions and redirect URIs

**Security:**
- 🔒 Both **MUST BE SECRET**

---

### 10. Upstash Redis (Rate Limiting)

```bash
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

**Purpose:** Rate limiting for API endpoints (recommended for production)

**How to Get:**
1. Go to [Upstash Console](https://console.upstash.com)
2. Create new Redis database
3. Copy REST URL and token

**Security:**
- 🔒 Both **MUST BE SECRET**

---

### 11. Feature Flags

```bash
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_SENTRY=true
```

**Purpose:** Enable/disable features per environment

**Recommended Settings:**
- **Production:** Both `true`
- **Development:** Both `false` (or `true` for testing)
- **Preview:** Both `true`

**Security:**
- ✅ Safe to expose

---

## Vercel Automatic Variables

These are automatically set by Vercel and should NOT be manually configured:

```bash
VERCEL=1
VERCEL_ENV=production
VERCEL_URL=auto-generated.vercel.app
VERCEL_GIT_COMMIT_SHA=...
VERCEL_GIT_COMMIT_MESSAGE=...
```

**Usage:** Available for conditional logic and debugging

---

## Setup Instructions

### Development Environment

1. Copy `.env.example` to `.env.local`:
   ```bash
   cd apps/website
   cp .env.example .env.local
   ```

2. Fill in development values (use test/dev API keys)

3. Never commit `.env.local` to git

### Production Environment (Vercel)

1. Go to Vercel Dashboard > Project Settings > Environment Variables

2. Add each variable with appropriate scope:
   - **Production** - Live site only
   - **Preview** - Preview deployments (recommended for most)
   - **Development** - Local development (usually not needed)

3. Mark sensitive variables as "Secret" (Vercel will encrypt them)

4. Variables to mark as secret:
   - `CLERK_SECRET_KEY`
   - `CONVEX_DEPLOY_KEY`
   - `RESEND_API_KEY`
   - `SENTRY_AUTH_TOKEN`
   - `MICROSOFT_CLIENT_SECRET`
   - `PIPEDRIVE_CLIENT_SECRET`
   - `UPSTASH_REDIS_REST_TOKEN`

5. Redeploy after adding/updating variables

---

## Verification Checklist

After configuring production environment variables:

- [ ] Authentication works (Clerk login/signup)
- [ ] Database loads data (Convex queries)
- [ ] Contact forms send emails (Resend)
- [ ] Errors appear in Sentry dashboard
- [ ] Contact info displays correctly
- [ ] Feature flags are enabled
- [ ] No console errors about missing env vars
- [ ] Health checks pass (`/api/health`)

---

## Troubleshooting

### Variable Not Found Errors

**Symptom:** Console error: `process.env.VARIABLE_NAME is undefined`

**Solutions:**
1. Verify variable is set in Vercel dashboard
2. Check variable name spelling (case-sensitive)
3. Ensure variable has correct scope (Production/Preview)
4. Redeploy after adding new variables
5. For `NEXT_PUBLIC_*` vars, check they're not being accessed server-side only

### Clerk Authentication Fails

**Check:**
- Publishable key matches production domain
- Secret key is from same Clerk application
- Clerk dashboard shows correct allowed origins
- Keys are for production (start with `pk_live_`, `sk_live_`)

### Convex Connection Issues

**Check:**
- URL points to production deployment
- Deploy key is for production (`prod:...`)
- Convex dashboard shows deployment is active
- Network can reach `*.convex.cloud` domains

### Email Not Sending

**Check:**
- Resend API key is valid
- Domain is verified in Resend dashboard
- `LEAD_EMAIL_TO` is a valid email address
- Check Resend logs for delivery status
- Verify rate limits not exceeded

### Sentry Not Capturing Errors

**Check:**
- DSN is correct
- `NEXT_PUBLIC_ENABLE_SENTRY=true`
- Source maps uploaded successfully
- Sentry organization/project settings correct
- Check Sentry quota not exceeded

---

## Security Best Practices

1. **Never commit secrets to git**
   - Use `.env.local` for development
   - Add `.env.local` to `.gitignore`
   - Use Vercel dashboard for production

2. **Rotate keys regularly**
   - Rotate API keys every 90 days
   - Update Vercel environment variables
   - Redeploy applications

3. **Use different keys per environment**
   - Development: Test/sandbox API keys
   - Production: Production API keys
   - Never use production keys in development

4. **Limit key permissions**
   - Use minimal required scopes
   - Set key expiration where possible
   - Monitor key usage

5. **Monitor for exposed secrets**
   - Use tools like GitGuardian
   - Scan commits for accidental exposure
   - Rotate immediately if exposed

---

## Support

If you encounter issues with environment variables:

1. Check this documentation first
2. Verify in Vercel dashboard
3. Check application logs in Vercel
4. Review Sentry error reports
5. Contact support with specific error messages

---

## Change Log

| Date | Change | Updated By |
|------|--------|------------|
| 2026-01-31 | Initial documentation | Phase 4 Deployment |

---

**End of Environment Variables Documentation**
