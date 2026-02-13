# Deployment Runbook

**Application:** Alecia Panel Website  
**Last Updated:** January 31, 2026  
**Version:** 1.0

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Vercel Deployment Steps](#vercel-deployment-steps)
3. [Convex Deployment Steps](#convex-deployment-steps)
4. [Post-Deployment Verification](#post-deployment-verification)
5. [Rollback Procedures](#rollback-procedures)
6. [Troubleshooting](#troubleshooting)
7. [Emergency Contacts](#emergency-contacts)

---

## Pre-Deployment Checklist

Complete ALL items before deploying to production.

### Code Quality

- [ ] All tests pass (`npm test` if applicable)
- [ ] TypeScript compilation succeeds (`npx tsc --noEmit`)
- [ ] ESLint passes with no critical errors
- [ ] Build completes successfully (`npm run build`)
- [ ] Bundle sizes are within acceptable limits
- [ ] No console errors in development build

### Security

- [ ] Run `npm audit` and review vulnerabilities
- [ ] No critical or high severity vulnerabilities
- [ ] All secrets removed from code
- [ ] Environment variables documented
- [ ] API keys rotated if needed
- [ ] HTTPS enforced in production

### Configuration

- [ ] All environment variables set in Vercel
- [ ] Domain configuration correct
- [ ] Convex production deployment URL configured
- [ ] Clerk production keys configured
- [ ] Resend API key configured
- [ ] Sentry DSN and auth token configured
- [ ] Feature flags set correctly

### Database

- [ ] Convex schema deployed to production
- [ ] Required indexes created
- [ ] Sample data verified (if needed)
- [ ] Backup of current data taken

### Monitoring

- [ ] Sentry project configured
- [ ] Alert rules set up
- [ ] Health check endpoints tested
- [ ] Uptime monitoring configured (optional)

### Team Communication

- [ ] Team notified of deployment window
- [ ] Deployment time scheduled
- [ ] Stakeholders informed
- [ ] Support team briefed on changes

---

## Vercel Deployment Steps

### Step 1: Verify Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Settings** > **Environment Variables**
4. Verify all required variables are set:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_CONVEX_URL`
   - `CONVEX_DEPLOY_KEY`
   - `RESEND_API_KEY`
   - `LEAD_EMAIL_TO`
   - `NEXT_PUBLIC_SENTRY_DSN`
   - `SENTRY_AUTH_TOKEN`
   - `SENTRY_ORG`
   - `SENTRY_PROJECT`
   - All `NEXT_PUBLIC_*` domain and contact variables

5. Ensure all sensitive variables are marked as "Secret"

### Step 2: Deploy via Git (Recommended)

**Option A: Deploy from main branch**

1. Ensure all changes are committed and pushed to main branch:
   ```bash
   git status
   git add .
   git commit -m "feat: production deployment [description]"
   git push origin main
   ```

2. Vercel will automatically trigger a deployment
3. Monitor deployment progress in Vercel dashboard
4. Wait for "Production" deployment to complete

**Option B: Deploy from Vercel Dashboard**

1. Go to Vercel Dashboard > Your Project
2. Click **Deployments** tab
3. Click **Create Deployment** button
4. Select branch: `main`
5. Click **Deploy**

**Option C: Deploy via Vercel CLI**

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Navigate to project
cd /path/to/alepanel/apps/website

# Deploy to production
vercel --prod

# Follow prompts and confirm deployment
```

### Step 3: Monitor Deployment

1. Watch deployment logs in Vercel dashboard
2. Check for any build errors
3. Verify deployment completes successfully
4. Note the deployment URL and timestamp

**Expected Deployment Time:** 3-5 minutes

---

## Convex Deployment Steps

### Step 1: Verify Convex Production Environment

1. Go to [Convex Dashboard](https://dashboard.convex.dev)
2. Ensure you're viewing the **production** deployment (not dev)
3. Check deployment URL matches `NEXT_PUBLIC_CONVEX_URL`

### Step 2: Deploy Convex Functions (if schema changed)

```bash
# Navigate to Convex directory
cd /path/to/alepanel/packages/convex

# Ensure you're on production deployment
npx convex env set prod

# Deploy functions and schema
npx convex deploy --prod

# Confirm deployment
# Enter 'yes' when prompted
```

### Step 3: Verify Convex Deployment

1. Check Convex dashboard shows latest deployment
2. Verify functions are listed correctly
3. Test a query in Convex dashboard
4. Check data is accessible

**Expected Deployment Time:** 1-2 minutes

---

## Post-Deployment Verification

Complete these checks within 15 minutes of deployment.

### Automated Checks

- [ ] Health check endpoint responds: `https://alecia.markets/api/health`
- [ ] Liveness check responds: `https://alecia.markets/api/health/live`
- [ ] Readiness check responds: `https://alecia.markets/api/health/ready`

```bash
# Run automated health checks
curl https://alecia.markets/api/health
curl https://alecia.markets/api/health/live
curl https://alecia.markets/api/health/ready
```

Expected responses: HTTP 200 with JSON status

### Manual Verification

#### 1. Public Pages Load

- [ ] Homepage loads: `https://alecia.markets`
- [ ] Team page loads: `https://alecia.markets/equipe`
- [ ] Operations page loads: `https://alecia.markets/operations`
- [ ] Careers page loads: `https://alecia.markets/nous-rejoindre`
- [ ] Studio page loads: `https://alecia.markets/studio`

#### 2. Authentication Works

- [ ] Login page loads
- [ ] Can sign in with test account
- [ ] User session persists
- [ ] Protected routes redirect to login
- [ ] Admin dashboard accessible

#### 3. Database Connection

- [ ] Team members display on team page
- [ ] Operations/deals display on operations page
- [ ] Job listings display on careers page
- [ ] Blog posts display (if published)
- [ ] Admin pages can CRUD data

#### 4. Forms and Emails

- [ ] Contact form submits successfully
- [ ] Email notification received
- [ ] Buy wizard completes
- [ ] Sell wizard completes
- [ ] Form validation works

#### 5. Error Monitoring

- [ ] Sentry captures errors (trigger test error)
- [ ] Source maps uploaded correctly
- [ ] Error details visible in Sentry dashboard

#### 6. Performance

- [ ] Lighthouse score > 90 (run in incognito)
- [ ] Page load times < 2 seconds
- [ ] Images load correctly
- [ ] No console errors
- [ ] No 404 errors in Network tab

#### 7. SEO and Metadata

- [ ] Robots.txt accessible: `https://alecia.markets/robots.txt`
- [ ] Sitemap accessible: `https://alecia.markets/sitemap.xml`
- [ ] Meta tags correct (view source)
- [ ] Canonical URLs correct
- [ ] Open Graph images load

#### 8. Mobile Responsiveness

- [ ] Test on mobile device or Chrome DevTools
- [ ] Navigation works
- [ ] Forms usable on mobile
- [ ] Touch targets adequate size

---

## Rollback Procedures

If critical issues are discovered post-deployment, follow these steps immediately.

### Immediate Rollback (< 5 minutes)

**Option 1: Vercel Dashboard Rollback**

1. Go to Vercel Dashboard > Deployments
2. Find the previous stable deployment
3. Click the three-dot menu (⋯)
4. Click **Promote to Production**
5. Confirm rollback

**Option 2: Vercel CLI Rollback**

```bash
# List recent deployments
vercel ls

# Rollback to specific deployment
vercel rollback <deployment-url>

# Or rollback to previous deployment
vercel rollback
```

**Time to Rollback:** ~30 seconds

### Convex Rollback (if needed)

```bash
# Navigate to Convex directory
cd /path/to/alepanel/packages/convex

# Rollback to previous schema version
# (Convex doesn't have built-in rollback, so redeploy previous version)

# Checkout previous commit
git checkout <previous-commit-hash>

# Deploy previous version
npx convex deploy --prod

# Return to current branch
git checkout main
```

**Time to Rollback:** ~2 minutes

### Post-Rollback Actions

- [ ] Verify rollback successful
- [ ] Test critical paths work
- [ ] Notify team of rollback
- [ ] Document reason for rollback
- [ ] Create incident report
- [ ] Plan fix and redeployment

---

## Troubleshooting

### Deployment Fails

**Symptom:** Vercel build fails

**Common Causes:**
- Build errors (TypeScript, ESLint)
- Missing environment variables
- Dependency issues
- Out of memory

**Solutions:**
1. Check build logs in Vercel dashboard
2. Verify environment variables are set
3. Test build locally: `npm run build`
4. Check for recent dependency changes
5. Verify Node.js version matches

### Application Not Loading

**Symptom:** White screen or 500 error

**Common Causes:**
- Missing environment variables
- Convex connection failed
- Clerk authentication misconfigured
- Runtime errors

**Solutions:**
1. Check browser console for errors
2. Check Vercel function logs
3. Verify all environment variables set
4. Test health check endpoints
5. Check Sentry for error reports

### Database Not Loading

**Symptom:** Data not displaying, empty pages

**Common Causes:**
- Wrong Convex deployment URL
- Convex functions not deployed
- Missing deploy key
- Schema mismatch

**Solutions:**
1. Verify `NEXT_PUBLIC_CONVEX_URL` is production URL
2. Check Convex dashboard shows latest deployment
3. Verify `CONVEX_DEPLOY_KEY` is set
4. Test Convex queries in dashboard
5. Check browser network tab for failed requests

### Emails Not Sending

**Symptom:** Forms submit but no emails received

**Common Causes:**
- Invalid Resend API key
- Domain not verified
- Wrong recipient email
- Rate limit exceeded

**Solutions:**
1. Verify `RESEND_API_KEY` is set correctly
2. Check Resend dashboard for delivery logs
3. Verify `LEAD_EMAIL_TO` is correct
4. Check Resend domain verification status
5. Review Resend rate limits

### Authentication Fails

**Symptom:** Cannot login, infinite redirects

**Common Causes:**
- Wrong Clerk keys
- Domain mismatch in Clerk dashboard
- Session configuration issue

**Solutions:**
1. Verify Clerk keys are production keys
2. Check Clerk dashboard allowed origins
3. Clear cookies and try again
4. Check Clerk dashboard for error logs
5. Verify redirect URLs configured

### Performance Issues

**Symptom:** Slow page loads, timeouts

**Common Causes:**
- Large bundle sizes
- Unoptimized images
- Too many API calls
- Database query slowness

**Solutions:**
1. Run Lighthouse audit
2. Check bundle analyzer
3. Optimize images (use next/image)
4. Review Convex query patterns
5. Enable caching where appropriate

---

## Emergency Contacts

### Internal Team

| Role | Name | Contact | Availability |
|------|------|---------|--------------|
| Tech Lead | [Name] | [Email/Phone] | 24/7 |
| DevOps | [Name] | [Email/Phone] | Business hours |
| Product Owner | [Name] | [Email/Phone] | Business hours |

### External Services

| Service | Support | Docs | Status |
|---------|---------|------|--------|
| Vercel | support@vercel.com | [docs.vercel.com](https://docs.vercel.com) | [vercel-status.com](https://vercel-status.com) |
| Convex | support@convex.dev | [docs.convex.dev](https://docs.convex.dev) | [status.convex.dev](https://status.convex.dev) |
| Clerk | support@clerk.com | [clerk.com/docs](https://clerk.com/docs) | [status.clerk.com](https://status.clerk.com) |
| Resend | support@resend.com | [resend.com/docs](https://resend.com/docs) | [status.resend.com](https://status.resend.com) |
| Sentry | support@sentry.io | [docs.sentry.io](https://docs.sentry.io) | [status.sentry.io](https://status.sentry.io) |

---

## Deployment Schedule

### Recommended Deployment Windows

**Best Times:**
- Tuesday-Thursday, 10 AM - 2 PM (local time)
- Low traffic periods
- During business hours for immediate support

**Avoid:**
- Monday mornings (start of week)
- Friday afternoons (reduced support availability)
- Evenings/weekends (unless emergency)
- Known high-traffic periods

### Deployment Frequency

- **Major releases:** Monthly or as needed
- **Minor updates:** Weekly (if needed)
- **Hotfixes:** As needed (follow rollback procedures if issues)
- **Security patches:** Immediate deployment

---

## Known Issues and Workarounds

### Issue 1: Build Warnings

**Description:** ESLint warnings about `any` types and unused variables

**Impact:** Non-blocking, does not affect functionality

**Workaround:** Warnings are acceptable; plan to fix in future iteration

**Status:** Known, tracked in backlog

### Issue 2: npm Audit Vulnerabilities

**Description:** Moderate vulnerability in lodash, high in Next.js

**Impact:** Low - requires specific attack vectors

**Workaround:** Monitor for updates, Next.js actively maintained

**Status:** Being monitored

---

## Post-Deployment Monitoring

### First 24 Hours

- [ ] Monitor Sentry for new errors every 2 hours
- [ ] Check Vercel analytics for traffic patterns
- [ ] Review user feedback channels
- [ ] Monitor health check endpoint status
- [ ] Check email delivery logs in Resend

### First Week

- [ ] Daily Sentry error review
- [ ] Monitor Lighthouse scores
- [ ] Track conversion rates (forms, wizards)
- [ ] Review performance metrics
- [ ] Gather user feedback

---

## Documentation Updates

After each deployment:

- [ ] Update this runbook with lessons learned
- [ ] Document any new issues encountered
- [ ] Update environment variables documentation
- [ ] Record deployment timestamp and version
- [ ] Update team handoff documentation

---

## Deployment History

| Date | Version | Deployed By | Status | Notes |
|------|---------|-------------|--------|-------|
| 2026-01-31 | 1.0.0 | Phase 4 | Planned | Initial production deployment |

---

## Success Criteria

Deployment is considered successful when:

- ✅ All health checks pass
- ✅ No critical errors in Sentry (first hour)
- ✅ All public pages load correctly
- ✅ Authentication works
- ✅ Forms submit and send emails
- ✅ Database queries return data
- ✅ Lighthouse score > 90
- ✅ No user-reported critical issues

---

**End of Deployment Runbook**

For questions or issues, refer to the [Emergency Contacts](#emergency-contacts) section or consult the team lead.
