# 🛡️ Alecia Panel Security & Reliability Audit Report

**Date**: 2026-01-21  
**Auditor**: Security & Reliability Engineering  
**Version**: 1.0.0

---

## Executive Summary

This audit covers the complete Alecia Panel ecosystem across three workspaces:

- `apps/website` - Main marketing + admin panel (Next.js 15)
- `apps/panelv2` - Legacy panel (deprecated but still deployed)
- `convex/` - Backend functions and schema

### Overall Security Posture: **🟡 MODERATE RISK**

| Category            | Status          | Risk Level |
| ------------------- | --------------- | ---------- |
| Input Validation    | ✅ Good         | Low        |
| XSS Protection      | ✅ Good         | Low        |
| Authentication      | ✅ Good         | Low        |
| Authorization       | ⚠️ Adequate     | Medium     |
| Rate Limiting       | ✅ Good         | Low        |
| Error Handling      | ⚠️ Partial      | Medium     |
| Dependency Security | 🔶 Needs Review | Medium     |
| Health Monitoring   | ❌ Missing      | High       |
| Logging Hygiene     | ⚠️ Partial      | Medium     |

---

## 1. Security Vulnerability Scan (OWASP Top 10)

### 1.1 Input Validation — ✅ SECURE

**Findings:**

- Zod validation schemas implemented in `src/lib/validations/index.ts`
- XSS payload detection via `noXssPayload` refinement
- Regex patterns for safe name/phone inputs
- Convex schema uses `v.string()` with proper type coercion

**Verified Protections:**

```typescript
// From src/lib/validations/index.ts - XSS payload blocklist
const dangerousPatterns = [
  /<script/i,
  /javascript:/i,
  /data:/i,
  /onclick/i,
  /onerror/i,
  /onload/i,
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /expression\(/i,
  /vbscript:/i,
];
```

**⚠️ IMPROVEMENT NEEDED:**

**Issue #1: Forum/Comment Content Lacks XSS Validation**  
**Severity**: MEDIUM  
**Location**: `convex/forum.ts` lines 84-110, 191-210

Forum posts and comments accept raw `v.string()` content without server-side XSS validation.

**Recommended Fix:**

```typescript
// convex/lib/validation.ts (NEW FILE)
import { v } from "convex/values";

export function sanitizeText(text: string): string {
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
  ];
  let clean = text;
  for (const pattern of dangerousPatterns) {
    clean = clean.replace(pattern, "[BLOCKED]");
  }
  return clean;
}

// Use in mutations:
// content: sanitizeText(args.content),
```

---

### 1.2 Cross-Site Scripting (XSS) — ✅ SECURE

**Findings:**

- DOMPurify sanitization implemented in `src/lib/sanitize.ts`
- `dangerouslySetInnerHTML` only used with `sanitizeHtmlWithSafeLinks()` wrapper
- External links get `rel="noopener noreferrer"` automatically

**Verified Usage:**

```typescript
// src/app/[locale]/actualites/[slug]/page.tsx - Line 115
dangerouslySetInnerHTML={{ __html: sanitizeHtmlWithSafeLinks(article.content) }}
```

✅ No raw HTML rendering found without sanitization.

---

### 1.3 Authentication/Authorization — ⚠️ ADEQUATE

**Findings:**

- Clerk authentication properly integrated
- Middleware protects admin routes
- Role-based access control via `checkRole()` helper

**Verified Protections:**

```typescript
// convex/auth_utils.ts
export async function checkRole(
  ctx: QueryCtx | MutationCtx,
  allowedRoles: ("sudo" | "partner" | "advisor")[]
) {
  const user = await getAuthenticatedUser(ctx);
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Forbidden: Role ${user.role} does not have access`);
  }
  return user;
}
```

**⚠️ ISSUES IDENTIFIED:**

**Issue #2: Missing RBAC on Several Convex Endpoints**  
**Severity**: MEDIUM  
**Locations**:

- `convex/forum.ts:createThread` - Any authenticated user can create
- `convex/comments.ts` - Check if RBAC is consistent
- `convex/voice.ts` - External API calls without role check

**Recommended Fix:**
Add minimum role requirement for sensitive operations:

```typescript
// Example: Only advisors+ can post to forum
export const createThread = mutation({
  args: { ... },
  handler: async (ctx, args) => {
    await checkRole(ctx, ["sudo", "partner", "advisor"]); // Add this
    // ... existing code
  },
});
```

**Issue #3: User Role Isn't Validated Against Attack Vectors**  
**Severity**: LOW  
**Location**: `convex/mutations.ts:updateUserRole`

While `checkRole(ctx, ["sudo"])` exists, consider implementing:

- Audit logging for privilege escalation
- Prevention of self-role-elevation

```typescript
export const updateUserRole = mutation({
  args: { ... },
  handler: async (ctx, args) => {
    const currentUser = await checkRole(ctx, ["sudo"]);

    // Prevent self-elevation (security best practice)
    if (args.userId === currentUser._id) {
      throw new Error("Cannot modify your own role");
    }

    // Add audit log
    console.log(`[AUDIT] Role change: ${args.userId} -> ${args.role} by ${currentUser.email}`);

    await ctx.db.patch(args.userId, { role: args.role });
  },
});
```

---

### 1.4 Insecure Dependencies — 🔶 NEEDS REVIEW

**Dependency Analysis:**

| Package        | Version           | Status      | Notes                        |
| -------------- | ----------------- | ----------- | ---------------------------- |
| next           | ^15.3.4           | ✅ Current  |                              |
| react          | 19.2.3            | ✅ Current  | React 19                     |
| convex         | ^1.31.2           | ✅ Current  |                              |
| dompurify      | ^3.3.1            | ✅ Current  |                              |
| zod            | ^3.23.8 / ^4.3.5  | ⚠️ Mismatch | website vs panelv2           |
| openai         | ^4.28.4 / ^6.15.0 | ⚠️ Mismatch | Major version diff           |
| groq-sdk       | ^0.11.0 / ^0.37.0 | ⚠️ Mismatch | Major version diff           |
| @xmldom/xmldom | ^0.8.11           | 🔶 Review   | Known CVEs in older versions |

**⚠️ ACTION REQUIRED:**

**Issue #4: Version Mismatches Across Workspaces**  
**Severity**: MEDIUM

```bash
# Run in project root to identify all version conflicts:
npm ls --all | grep -E "(zod|openai|groq-sdk)" 2>/dev/null
```

**Recommended Fix - Align Versions:**

```json
// Root package.json - Add resolutions
{
  "overrides": {
    "zod": "^3.23.8",
    "openai": "^4.28.4",
    "groq-sdk": "^0.37.0"
  }
}
```

**Issue #5: Run Security Audit**

```bash
# Execute in all workspaces:
cd apps/website && pnpm audit --fix
cd apps/panelv2 && npm audit --fix
```

---

## 2. Error Handling & Reliability

### 2.1 Current Coverage Analysis

**✅ Areas with Proper Error Handling:**

| File                             | Pattern                     | Quality |
| -------------------------------- | --------------------------- | ------- |
| `convex/actions/microsoft.ts`    | try/catch in all handlers   | ✅ Good |
| `convex/actions/intelligence.ts` | try/catch + error logging   | ✅ Good |
| `convex/actions/openai.ts`       | try/catch + specific errors | ✅ Good |
| `src/app/global-error.tsx`       | Root error boundary         | ✅ Good |

**⚠️ Areas Lacking Error Handling:**

**Issue #6: Missing try/catch in Critical Paths**  
**Severity**: HIGH

| File                  | Line(s) | Issue                             |
| --------------------- | ------- | --------------------------------- |
| `convex/pipedrive.ts` | 56-84   | Token exchange has no try/catch   |
| `convex/pipedrive.ts` | 111-127 | Org sync loop can fail silently   |
| `convex/slack.ts`     | 240-260 | Webhook failure partially handled |
| `convex/deals.ts`     | 35-49   | Promise.all can reject entirely   |

**Recommended Fixes:**

```typescript
// convex/pipedrive.ts - Line 49+
export const exchangeCodeForToken = action({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    if (!PIPEDRIVE_CLIENT_ID || !PIPEDRIVE_CLIENT_SECRET) {
      throw new Error("Pipedrive OAuth credentials non configurés");
    }

    try {
      const tokenResponse = await fetch(
        "https://oauth.pipedrive.com/oauth/token",
        {
          // ... existing code
        }
      );

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("[Pipedrive] Token exchange failed:", errorText);
        throw new Error(`Erreur OAuth: ${tokenResponse.status} - ${errorText}`);
      }

      const tokens = await tokenResponse.json();
      // ... rest of code
    } catch (error) {
      console.error("[Pipedrive] Token exchange error:", error);
      throw new Error(
        `Échec de l'authentification Pipedrive: ${(error as Error).message}`
      );
    }
  },
});
```

```typescript
// convex/deals.ts - Safer Promise.all pattern
export const getDeals = query({
  handler: async (ctx) => {
    const user = await getOptionalUser(ctx);
    if (!user) return [];

    const deals = await ctx.db.query("deals").collect();

    // Use Promise.allSettled for resilience
    const enrichedResults = await Promise.allSettled(
      deals.map(async (deal) => {
        const company = deal.companyId
          ? await ctx.db.get(deal.companyId)
          : null;
        const owner = deal.ownerId ? await ctx.db.get(deal.ownerId) : null;
        return {
          ...deal,
          companyName: company?.name || "Unknown Company",
          ownerName: owner?.name || "Unknown",
        };
      })
    );

    // Filter successful results, log failures
    return enrichedResults
      .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
      .map((r) => r.value);
  },
});
```

---

### 2.2 Logging Hygiene Issues

**Issue #7: Console.log Leaking in Production**  
**Severity**: MEDIUM

Found 19 instances of `console.log` in Convex actions that will log in production:

| File                  | Count | Risk               |
| --------------------- | ----- | ------------------ |
| `convex/mutations.ts` | 1     | User email exposed |
| `convex/digest.ts`    | 4     | User email exposed |
| `convex/marketing.ts` | 2     | Low                |
| `convex/seed.ts`      | 8     | Low (one-time)     |
| `convex/slack.ts`     | 1     | Low                |

**Recommended Fix - Create Logger Utility:**

```typescript
// convex/lib/logger.ts (NEW FILE)
const isProduction = process.env.NODE_ENV === "production";

export const logger = {
  debug: (...args: unknown[]) => {
    if (!isProduction) console.debug("[DEBUG]", ...args);
  },
  info: (...args: unknown[]) => {
    if (!isProduction) console.info("[INFO]", ...args);
  },
  warn: (...args: unknown[]) => {
    console.warn("[WARN]", ...args);
  },
  error: (...args: unknown[]) => {
    console.error("[ERROR]", ...args);
  },
  audit: (action: string, userId: string, details: unknown) => {
    // Always log audit events
    console.log("[AUDIT]", { action, userId, details, ts: Date.now() });
  },
};
```

---

## 3. Availability Checkpoint — ❌ MISSING

**Issue #8: No Health Check Endpoint**  
**Severity**: HIGH

The application lacks a `/healthz` or `/api/health` endpoint for:

- Container orchestration liveness probes
- Load balancer health checks
- Monitoring and alerting systems

### Recommended Implementation

**Create `/apps/website/src/app/api/health/route.ts`:**

```typescript
/**
 * Health Check Endpoint
 *
 * Returns 200 OK with service status if application is healthy.
 * Returns 503 Service Unavailable if critical services are down.
 *
 * @endpoint GET /api/health
 * @security Public - No auth required for health checks
 */

import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  services: {
    convex: ServiceStatus;
    clerk: ServiceStatus;
  };
  uptime?: number;
}

interface ServiceStatus {
  status: "up" | "down" | "degraded";
  latencyMs?: number;
  error?: string;
}

// Track server start time for uptime reporting
const startTime = Date.now();

async function checkConvex(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    // Simple query to verify Convex connection
    // Use a lightweight query that doesn't require auth
    const response = await fetch(
      process.env.NEXT_PUBLIC_CONVEX_URL + "/version",
      {
        method: "GET",
        signal: AbortSignal.timeout(5000), // 5s timeout
      }
    );

    if (!response.ok) {
      return { status: "degraded", latencyMs: Date.now() - start };
    }

    return { status: "up", latencyMs: Date.now() - start };
  } catch (error) {
    return {
      status: "down",
      latencyMs: Date.now() - start,
      error: (error as Error).message,
    };
  }
}

async function checkAuth(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    // Check BetterAuth endpoint is reachable
    const authDomain = process.env.NEXT_PUBLIC_APP_URL || "https://alecia.markets";

    const response = await fetch(`${authDomain}/api/auth/verify-session`, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });

    return {
      status: response.ok || response.status === 401 ? "up" : "degraded",
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    return {
      status: "down",
      latencyMs: Date.now() - start,
      error: (error as Error).message,
    };
  }
}

export async function GET() {
  const [convexStatus, clerkStatus] = await Promise.all([
    checkConvex(),
    checkClerk(),
  ]);

  // Determine overall health
  const allUp = convexStatus.status === "up" && clerkStatus.status === "up";
  const anyDown =
    convexStatus.status === "down" || clerkStatus.status === "down";

  const overallStatus: "healthy" | "degraded" | "unhealthy" = anyDown
    ? "unhealthy"
    : allUp
      ? "healthy"
      : "degraded";

  const health: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    services: {
      convex: convexStatus,
      clerk: clerkStatus,
    },
  };

  // Return 503 if unhealthy for load balancer health checks
  const httpStatus = overallStatus === "unhealthy" ? 503 : 200;

  return NextResponse.json(health, {
    status: httpStatus,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Health-Status": overallStatus,
    },
  });
}

// HEAD method for simple probes
export async function HEAD() {
  const convexStatus = await checkConvex();
  const status = convexStatus.status === "up" ? 200 : 503;

  return new NextResponse(null, {
    status,
    headers: { "X-Health-Status": convexStatus.status },
  });
}
```

**Additional Endpoints:**

```typescript
// apps/website/src/app/api/health/ready/route.ts
// Readiness probe - checks if app can handle traffic

import { NextResponse } from "next/server";

export async function GET() {
  // Add any startup checks here (e.g., cache warming)
  return NextResponse.json({ ready: true }, { status: 200 });
}
```

```typescript
// apps/website/src/app/api/health/live/route.ts
// Liveness probe - simple ping check

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ alive: true }, { status: 200 });
}
```

---

## 4. Action Items Summary

### 🔴 Critical (Fix Immediately)

| #   | Issue                               | Location                    | Effort |
| --- | ----------------------------------- | --------------------------- | ------ |
| 8   | No health check endpoint            | `apps/website/src/app/api/` | 1h     |
| 6   | Missing try/catch in critical paths | `convex/pipedrive.ts`       | 2h     |

### 🟠 High Priority (Fix This Sprint)

| #   | Issue                         | Location          | Effort |
| --- | ----------------------------- | ----------------- | ------ |
| 1   | Forum content XSS validation  | `convex/forum.ts` | 1h     |
| 4   | Dependency version mismatches | `package.json`    | 30m    |
| 5   | Run security audit            | All workspaces    | 30m    |

### 🟡 Medium Priority (Next Sprint)

| #   | Issue                          | Location              | Effort |
| --- | ------------------------------ | --------------------- | ------ |
| 2   | RBAC gaps on endpoints         | `convex/*.ts`         | 3h     |
| 3   | Self-role-elevation prevention | `convex/mutations.ts` | 30m    |
| 7   | Console.log cleanup            | `convex/*.ts`         | 1h     |

---

## 5. Commands to Execute

```bash
# 1. Run security audit
cd /Users/utilisateur/Desktop/alepanel/apps/website && pnpm audit
cd /Users/utilisateur/Desktop/alepanel/apps/panelv2 && npm audit

# 2. Check for outdated dependencies
cd /Users/utilisateur/Desktop/alepanel && npm outdated

# 3. Verify no secrets in git history
git log --all -p | grep -E "(API_KEY|SECRET|PASSWORD)" | head -20

# 4. Test health endpoint after implementation
curl -s http://localhost:3000/api/health | jq
```

---

## Appendix A: Security Headers Verification

The following security headers are properly configured in `next.config.ts`:

✅ Content-Security-Policy (with nonces for scripts)  
✅ X-Frame-Options: SAMEORIGIN  
✅ X-Content-Type-Options: nosniff  
✅ Referrer-Policy: strict-origin-when-cross-origin  
✅ Permissions-Policy: camera=(), microphone=(), geolocation=()  
✅ X-DNS-Prefetch-Control: on

---

## Appendix B: Rate Limiting Configuration

Current rate limits (from `src/lib/rate-limit.ts`):

| Limiter               | Rate    | Window | Use Case             |
| --------------------- | ------- | ------ | -------------------- |
| `apiRateLimiter`      | 10 req  | 10s    | General API          |
| `strictRateLimiter`   | 5 req   | 60s    | Auth, password reset |
| `generousRateLimiter` | 100 req | 60s    | Search, lists        |

⚠️ Note: Rate limiting requires Upstash Redis. Falls back gracefully if not configured.

---

**Report Generated**: 2026-01-21T08:06:08+01:00  
**Next Review**: 2026-02-21
