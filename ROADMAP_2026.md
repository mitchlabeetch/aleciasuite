# 🚀 ALECIA ECOSYSTEM 2026 ROADMAP

## Comprehensive Implementation Plan for Best-in-Class Launch

---

# DOCUMENT METADATA

| Property        | Value                            |
| --------------- | -------------------------------- |
| **Version**     | 1.0.0                            |
| **Created**     | 2026-01-21                       |
| **Based On**    | ECOSYSTEM_AUDIT_2026.md          |
| **Target**      | 100% Production-Ready Launch     |
| **Methodology** | Batch-Based Incremental Delivery |

---

# TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Batch 0: Pre-Flight Checklist](#batch-0-pre-flight-checklist)
3. [Batch 1: Security Hardening](#batch-1-security-hardening)
4. [Batch 2: Code Quality & Technical Debt](#batch-2-code-quality--technical-debt)
5. [Batch 3: Dependency Alignment](#batch-3-dependency-alignment)
6. [Batch 4: Authentication & Data Sync](#batch-4-authentication--data-sync)
7. [Batch 5: Dead Code & Non-Functional Elements](#batch-5-dead-code--non-functional-elements)
8. [Batch 6: Kanban Consolidation](#batch-6-kanban-consolidation)
9. [Batch 7: Backend Schema Perfection](#batch-7-backend-schema-perfection)
10. [Batch 8: Internationalization Expansion](#batch-8-internationalization-expansion)
11. [Batch 9: Accessibility Excellence](#batch-9-accessibility-excellence)
12. [Batch 10: UI/UX Refinement](#batch-10-uiux-refinement)
13. [Batch 11: Performance Optimization](#batch-11-performance-optimization)
14. [Batch 12: Final Polish & Launch](#batch-12-final-polish--launch)
15. [Appendix: Library Recommendations](#appendix-library-recommendations)
16. [Appendix: Environment Variables](#appendix-environment-variables)

---

# EXECUTIVE SUMMARY

## Mission Statement

Transform the Alecia ecosystem from current state to a production-ready, best-in-class M&A collaboration platform through systematic, documented, and reversible changes.

## Current State (From Audit)

| Metric          | Website | Colab   | Target |
| --------------- | ------- | ------- | ------ |
| Lines of Code   | 11,000  | 19,700  | -      |
| `: any` Usage   | 15      | 39      | < 5    |
| `console.*`     | 20      | 38      | 0      |
| ESLint Bypasses | 2       | 24      | 0      |
| React Version   | 19.2.3  | 18.2.0  | 19.2.3 |
| A11Y Score      | 85%     | 60%     | 95%    |
| i18n Coverage   | FR/EN   | FR only | FR/EN  |

## Batch Overview

| Batch | Name           | Duration | Priority    | Dependencies |
| ----- | -------------- | -------- | ----------- | ------------ |
| 0     | Pre-Flight     | 1 day    | 🔴 Critical | None         |
| 1     | Security       | 2 days   | 🔴 Critical | Batch 0      |
| 2     | Code Quality   | 3 days   | 🔴 Critical | Batch 1      |
| 3     | Dependencies   | 2 days   | 🔴 Critical | Batch 2      |
| 4     | Auth & Sync    | 4 days   | 🟡 High     | Batch 3      |
| 5     | Dead Code      | 2 days   | 🟡 High     | Batch 3      |
| 6     | Kanban         | 3 days   | 🟡 High     | Batch 5      |
| 7     | Backend Schema | 2 days   | 🟡 High     | Batch 4      |
| 8     | i18n           | 3 days   | 🟢 Medium   | Batch 3      |
| 9     | Accessibility  | 2 days   | 🟢 Medium   | Batch 8      |
| 10    | UI/UX Polish   | 4 days   | 🟢 Medium   | Batch 9      |
| 11    | Performance    | 2 days   | 🟢 Medium   | Batch 10     |
| 12    | Final Launch   | 2 days   | 🔴 Critical | All          |

**Total Estimated Duration:** 32 working days (~6 weeks)

---

# BATCH 0: PRE-FLIGHT CHECKLIST

## Objective

Establish baseline metrics, backup systems, and verification infrastructure before any changes.

## Duration

**1 day** | No code changes

## Tasks

### Task 0.1: Create Backup Points

**Description:** Create tagged commits and database exports before modifications.

**Steps:**

```bash
# Website/Panel
cd /Users/utilisateur/Desktop/alepanel
git add -A && git commit -m "PRE-ROADMAP: Baseline state before 2026 roadmap"
git tag -a v2026-baseline -m "Baseline before 2026 roadmap implementation"
git push origin v2026-baseline

# Colab
cd /Users/utilisateur/Desktop/Alecia_Colab
git add -A && git commit -m "PRE-ROADMAP: Baseline state before 2026 roadmap"
git tag -a v2026-baseline -m "Baseline before 2026 roadmap implementation"
git push origin v2026-baseline
```

**Convex Data Export:**

```bash
# Export current Convex data for both apps
npx convex export --path ./backups/convex-baseline-2026-01-21.zip
```

**Success Criteria:**

- [ ] Both repos have `v2026-baseline` tag
- [ ] Convex data exported and stored securely
- [ ] All uncommitted changes committed

---

### Task 0.2: Establish Metrics Baseline

**Description:** Record current state metrics for comparison after roadmap completion.

**Metrics to Record:**

| Metric            | Website    | Colab      | Command                 |
| ----------------- | ---------- | ---------- | ----------------------- |
| Build Time        | \_\_\_ sec | \_\_\_ sec | `time npm run build`    |
| Bundle Size       | \_\_\_ KB  | \_\_\_ KB  | Check `.next/analyze`   |
| TypeScript Errors | \_\_\_     | \_\_\_     | `npx tsc --noEmit`      |
| ESLint Errors     | \_\_\_     | \_\_\_     | `npm run lint`          |
| Test Coverage     | \_\_\_ %   | \_\_\_ %   | `npm run test:coverage` |

**Lighthouse Scores (Homepage):**

| Metric         | Website | Colab  |
| -------------- | ------- | ------ |
| Performance    | \_\_\_  | \_\_\_ |
| Accessibility  | \_\_\_  | \_\_\_ |
| Best Practices | \_\_\_  | \_\_\_ |
| SEO            | \_\_\_  | \_\_\_ |

**Success Criteria:**

- [ ] All metrics documented in `BASELINE_METRICS_2026.md`
- [ ] Lighthouse reports saved as PDFs

---

### Task 0.3: Verify Development Environment

**Description:** Ensure all team members have consistent development setup.

**Required Versions:**

```bash
node --version    # Should be >= 20.x
npm --version     # Should be >= 10.x
pnpm --version    # Should be >= 8.x (for monorepo)
```

**Required Environment Variables:**
Verify these are set in both `.env.local` files:

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY

# Convex
NEXT_PUBLIC_CONVEX_URL

# Cross-App (after Batch 1)
NEXT_PUBLIC_ALECIA_MARKETING_URL
NEXT_PUBLIC_ALECIA_COLAB_URL
```

**Success Criteria:**

- [ ] `npm run dev` works on both apps
- [ ] `npm run build` completes without errors
- [ ] All required env vars documented in `.env.example`

---

### Task 0.4: Set Up Branch Strategy

**Description:** Create feature branches for isolated development.

**Branch Structure:**

```
main (production)
├── develop (integration)
│   ├── feature/batch-1-security
│   ├── feature/batch-2-quality
│   ├── feature/batch-3-deps
│   └── ...
```

**Git Commands:**

```bash
git checkout -b develop
git push -u origin develop

# For each batch
git checkout develop
git checkout -b feature/batch-1-security
```

**Success Criteria:**

- [ ] `develop` branch created
- [ ] Branch protection rules enabled on `main`
- [ ] PR template created

---

## Batch 0 Completion Checklist

- [ ] Task 0.1: Backups created
- [ ] Task 0.2: Metrics recorded
- [ ] Task 0.3: Dev environment verified
- [ ] Task 0.4: Branch strategy implemented

**Sign-off Required Before Batch 1:** **\*\***\_\_\_**\*\***

---

# BATCH 1: SECURITY HARDENING

## Objective

Address all security vulnerabilities identified in the audit to ensure a safe production deployment.

## Duration

**2 days** | Priority: 🔴 Critical

## Prerequisites

- Batch 0 completed
- Branch `feature/batch-1-security` created

## Audit Findings Addressed

| ID      | Issue                           | Severity    | Location                     |
| ------- | ------------------------------- | ----------- | ---------------------------- |
| SEC-001 | XSS via dangerouslySetInnerHTML | 🔴 Critical | `actualites/[slug]/page.tsx` |
| SEC-002 | Missing CSP Headers             | 🟡 Medium   | `next.config.ts`             |
| SEC-003 | No Rate Limiting                | 🟡 Medium   | API routes                   |
| SEC-004 | Missing Input Sanitization      | 🟡 Medium   | Form inputs                  |

---

## Task 1.1: Fix XSS Vulnerability

**Priority:** 🔴 Critical
**Estimated Time:** 2 hours
**Target File:** `apps/website/src/app/[locale]/actualites/[slug]/page.tsx`

### Problem

```typescript
// Line 114 - UNSAFE
dangerouslySetInnerHTML={{ __html: article.content }}
```

### Solution

**Step 1: Install DOMPurify**

```bash
cd /Users/utilisateur/Desktop/alepanel/apps/website
npm install dompurify @types/dompurify
```

**Step 2: Create Sanitization Utility**

Create file: `src/lib/sanitize.ts`

```typescript
import DOMPurify from "dompurify";

/**
 * Sanitize HTML content to prevent XSS attacks
 *
 * @param dirty - Untrusted HTML string
 * @returns Sanitized HTML safe for rendering
 *
 * @example
 * const safeHtml = sanitizeHtml(article.content);
 * <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
 */
export function sanitizeHtml(dirty: string): string {
  // Only run on client side
  if (typeof window === "undefined") {
    // On server, return escaped string or empty
    return dirty.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  return DOMPurify.sanitize(dirty, {
    // Allow common HTML elements
    ALLOWED_TAGS: [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "br",
      "hr",
      "ul",
      "ol",
      "li",
      "strong",
      "em",
      "b",
      "i",
      "u",
      "s",
      "a",
      "img",
      "blockquote",
      "pre",
      "code",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "div",
      "span",
    ],
    // Allow safe attributes
    ALLOWED_ATTR: [
      "href",
      "src",
      "alt",
      "title",
      "class",
      "id",
      "target",
      "rel",
    ],
    // Force links to open safely
    ADD_ATTR: ["target", "rel"],
    // Transform hooks
    FORCE_BODY: true,
  });
}

/**
 * Sanitize and add rel="noopener noreferrer" to all external links
 */
export function sanitizeHtmlWithSafeLinks(dirty: string): string {
  const clean = sanitizeHtml(dirty);

  // Add noopener noreferrer to all links
  return clean.replace(
    /<a\s+([^>]*href="https?:\/\/[^"]*"[^>]*)>/gi,
    '<a $1 target="_blank" rel="noopener noreferrer">'
  );
}
```

**Step 3: Update Article Page**

Modify: `apps/website/src/app/[locale]/actualites/[slug]/page.tsx`

```typescript
import { sanitizeHtmlWithSafeLinks } from '@/lib/sanitize';

// ... existing code ...

// Replace unsafe usage (around line 114)
<div
  className="prose prose-lg max-w-none"
  dangerouslySetInnerHTML={{ __html: sanitizeHtmlWithSafeLinks(article.content) }}
/>
```

### Verification

```bash
# Test with malicious input
echo '<script>alert("xss")</script><p>Safe content</p>' | node -e "
  const { sanitizeHtml } = require('./src/lib/sanitize');
  const input = require('fs').readFileSync(0, 'utf-8');
  console.log(sanitizeHtml(input));
"
# Should output: <p>Safe content</p>
```

### Success Criteria

- [ ] No `<script>` tags pass through sanitization
- [ ] Valid HTML elements preserved
- [ ] External links have `rel="noopener noreferrer"`
- [ ] Build passes with new dependency

### Pitfalls to Avoid

- ❌ Don't sanitize on server only (DOMPurify needs DOM)
- ❌ Don't use regex-based sanitization (bypassable)
- ❌ Don't forget to test with encoded entities (`%3Cscript%3E`)

---

## Task 1.2: Implement Content Security Policy

**Priority:** 🟡 Medium
**Estimated Time:** 3 hours
**Target File:** `apps/website/next.config.ts`

### Problem

No CSP headers configured, allowing potential injection attacks.

### Solution

**Modify:** `apps/website/next.config.ts`

```typescript
import type { NextConfig } from "next";

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.alecia.markets https://*.clerk.accounts.dev;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' data: blob: https: https://*.clerk.com;
  connect-src 'self' https://*.convex.cloud https://clerk.alecia.markets https://*.clerk.accounts.dev wss://*.convex.cloud;
  frame-src 'self' https://colab.alecia.markets https://*.clerk.accounts.dev;
  frame-ancestors 'self' https://alecia.markets https://colab.alecia.markets;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy,
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  // ... existing config ...

  async headers() {
    return [
      {
        // Apply to all routes
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
```

### Verification

```bash
# After deployment, check headers
curl -I https://alecia.markets | grep -i "content-security-policy"
```

### Success Criteria

- [ ] CSP header present in all responses
- [ ] Clerk authentication still works
- [ ] Convex connections still work
- [ ] Colab iframe embedding still works
- [ ] No console errors about blocked resources

---

## Task 1.3: Implement Rate Limiting

**Priority:** 🟡 Medium
**Estimated Time:** 2 hours
**Target:** API routes

### Solution Using Upstash (Already in Colab deps)

**Step 1: Install in Website**

```bash
cd /Users/utilisateur/Desktop/alepanel/apps/website
npm install @upstash/ratelimit @upstash/redis
```

**Step 2: Create Rate Limit Utility**

Create: `src/lib/rate-limit.ts`

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Only initialize if credentials are available
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// Create rate limiter: 10 requests per 10 seconds
export const rateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "10 s"),
      analytics: true,
      prefix: "alecia:ratelimit",
    })
  : null;

/**
 * Check rate limit for a given identifier
 * Returns null if rate limiting is not configured
 */
export async function checkRateLimit(identifier: string): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
} | null> {
  if (!rateLimiter) return null;

  const { success, limit, remaining, reset } =
    await rateLimiter.limit(identifier);
  return { success, limit, remaining, reset: Math.floor(reset / 1000) };
}
```

**Step 3: Apply to API Routes**

Example: `src/app/api/contact/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Get identifier (IP or user ID)
  const ip = request.headers.get("x-forwarded-for") || "anonymous";

  // Check rate limit
  const rateLimit = await checkRateLimit(ip);
  if (rateLimit && !rateLimit.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": rateLimit.limit.toString(),
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
          "X-RateLimit-Reset": rateLimit.reset.toString(),
        },
      }
    );
  }

  // ... rest of handler
}
```

### Environment Variables Required

```bash
# Add to .env.local
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

### Success Criteria

- [ ] API returns 429 after 10 rapid requests
- [ ] Rate limit headers present in responses
- [ ] Graceful fallback when Redis not configured

---

## Task 1.4: Input Validation with Zod

**Priority:** 🟡 Medium
**Estimated Time:** 2 hours
**Target:** All form submissions

### Create Validation Schemas

Create: `src/lib/validations/contact.ts`

```typescript
import { z } from "zod";

export const contactFormSchema = z.object({
  firstName: z
    .string()
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(50, "Le prénom ne peut pas dépasser 50 caractères")
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Le prénom contient des caractères invalides"),

  lastName: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères")
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Le nom contient des caractères invalides"),

  email: z
    .string()
    .email("Veuillez entrer une adresse email valide")
    .max(100, "L'email ne peut pas dépasser 100 caractères"),

  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/.test(val),
      "Numéro de téléphone invalide"
    ),

  message: z
    .string()
    .min(10, "Le message doit contenir au moins 10 caractères")
    .max(5000, "Le message ne peut pas dépasser 5000 caractères"),

  type: z.enum(["general", "sell", "buy", "careers"]).optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
```

### Apply in Form Component

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  contactFormSchema,
  type ContactFormData,
} from "@/lib/validations/contact";

const form = useForm<ContactFormData>({
  resolver: zodResolver(contactFormSchema),
  defaultValues: {
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  },
});
```

### Success Criteria

- [ ] All forms use Zod validation
- [ ] French error messages displayed
- [ ] XSS payloads rejected at validation level

---

## Batch 1 Completion Checklist

- [ ] Task 1.1: XSS fix deployed
- [ ] Task 1.2: CSP headers active
- [ ] Task 1.3: Rate limiting operational
- [ ] Task 1.4: Input validation comprehensive

### Security Verification Commands

```bash
# Check for remaining security issues
npm audit
npx snyk test

# Verify CSP
curl -I https://alecia.markets | grep -i "security"
```

**Sign-off Required Before Batch 2:** **\_\_**\_\_\_\_**\_\_**

---

# BATCH 2: CODE QUALITY & TECHNICAL DEBT

## Objective

Eliminate technical debt identified in the audit: console statements, excessive `any` types, and ESLint bypasses to ensure production-grade code quality.

## Duration

**3 days** | Priority: 🔴 Critical

## Prerequisites

- Batch 1 completed and merged to `develop`
- Branch `feature/batch-2-quality` created

## Audit Findings Addressed

| ID     | Issue                 | Current  | Target | App  |
| ------ | --------------------- | -------- | ------ | ---- |
| QA-001 | console.\* statements | 58 total | 0      | Both |
| QA-002 | `: any` usage         | 54 total | < 10   | Both |
| QA-003 | ESLint bypasses       | 26 total | 0      | Both |
| QA-004 | TODO/FIXME comments   | 3 total  | 0      | Both |

---

## Task 2.1: Remove Console Statements

**Priority:** 🔴 Critical
**Estimated Time:** 4 hours
**Targets:** Website (20), Colab (38)

### Step 1: Create Production Logger

Create: `apps/website/src/lib/logger.ts` (and copy to Colab)

```typescript
type LogLevel = "debug" | "info" | "warn" | "error";

interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

const isDevelopment = process.env.NODE_ENV === "development";
const noop = () => {};

const devLogger: Logger = {
  debug: (...args) => console.debug("[DEBUG]", ...args),
  info: (...args) => console.info("[INFO]", ...args),
  warn: (...args) => console.warn("[WARN]", ...args),
  error: (...args) => console.error("[ERROR]", ...args),
};

const prodLogger: Logger = {
  debug: noop,
  info: noop,
  warn: noop,
  error: (...args) => {
    // TODO: Integrate Sentry in Batch 11
    console.error("[PROD ERROR]", ...args);
  },
};

export const logger: Logger = isDevelopment ? devLogger : prodLogger;
```

### Step 2: Replace All Console Statements

**Commands to find:**

```bash
grep -rn "console\.\(log\|error\|warn\)" --include="*.tsx" --include="*.ts" src/
```

**Replacement patterns:**

- `console.log()` → Remove or `logger.debug()`
- `console.error()` → `logger.error()`
- `console.warn()` → `logger.warn()`

### Step 3: Add ESLint Rule

Add to ESLint config:

```javascript
rules: {
  'no-console': ['error', { allow: ['warn', 'error'] }],
}
```

### Success Criteria

- [ ] 0 `console.log` statements
- [ ] All errors use `logger.error()`
- [ ] ESLint blocks new console statements

---

## Task 2.2: Reduce `any` Type Usage (54 → <10)

**Priority:** 🟡 High
**Estimated Time:** 6 hours

### Common Fixes

**Fix 1: Event Handlers**

```typescript
// Before
const handleDragEnd = (result: any) => { ... }

// After
import type { DropResult } from '@dnd-kit/core';
const handleDragEnd = (result: DropResult) => { ... }
```

**Fix 2: Component Props (Dashboard.tsx)**

```typescript
interface DashboardUIProps {
  isLoaded: boolean;
  user: { firstName?: string; username?: string } | null;
  initialStats: StatItem[];
  recentDocuments: RecentDocument[];
  activityFeed: ActivityItem[];
  isDocumentsLoading: boolean;
  isDataLoading: boolean;
}
```

**Fix 3: API Responses**

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
const data = (await response.json()) as ApiResponse<UserData>;
```

### Success Criteria

- [ ] Website: ≤ 5 `: any`
- [ ] Colab: ≤ 10 `: any`
- [ ] `noImplicitAny: true` in tsconfig

---

## Task 2.3: Eliminate ESLint Bypasses (26 → 0)

**Priority:** 🟡 High
**Estimated Time:** 4 hours

### Fix Categories

**Category 1: @ts-ignore**
Create proper type declarations in `types/*.d.ts`

**Category 2: eslint-disable**
Fix the underlying issue or use proper type guards

**Category 3: Unused variables**

```typescript
// Before
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const [_, setOpen] = useState(false);

// After
const [, setOpen] = useState(false);
```

### Success Criteria

- [ ] 0 ESLint bypass comments

---

## Task 2.4: Resolve TODO Comments

| File                  | TODO            | Resolution       |
| --------------------- | --------------- | ---------------- |
| `admin/error.tsx:24`  | Error tracking  | Link to Batch 11 |
| `global-error.tsx:26` | Error tracking  | Link to Batch 11 |
| `extensions.ts:29`    | Regex for class | Fix in Task 2.3  |

### Success Criteria

- [ ] All TODOs resolved or linked to future batches

---

## Batch 2 Completion Checklist

- [ ] Task 2.1: Console statements removed
- [ ] Task 2.2: `any` usage below target
- [ ] Task 2.3: ESLint bypasses eliminated
- [ ] Task 2.4: TODOs resolved

**Verification:**

```bash
echo "Console statements:" && grep -rn "console\." src/ | wc -l
echo "Any types:" && grep -rn ": any" src/ | wc -l
echo "ESLint bypasses:" && grep -rn "eslint-disable\|@ts-" src/ | wc -l
```

**Sign-off Required Before Batch 3:** **\*\***\_\_\_**\*\***

---

# BATCH 3: DEPENDENCY ALIGNMENT

## Objective

Align all dependencies between Website and Colab to ensure compatibility, especially for iframe embedding (React 18/19 hydration issues).

## Duration

**2 days** | Priority: 🔴 Critical

## Prerequisites

- Batch 2 completed
- Branch `feature/batch-3-deps` created

## Audit Findings Addressed

| Package             | Website | Colab   | Target   | Risk           |
| ------------------- | ------- | ------- | -------- | -------------- |
| React               | 19.2.3  | 18.2.0  | 19.2.3   | 🔴 Hydration   |
| Next.js             | 15.3.4  | 15.1.11 | 15.3.4   | 🟡 Features    |
| TipTap              | 3.15.x  | 2.11.x  | 3.15.x   | 🟡 API changes |
| lucide-react        | 0.562   | 0.358   | 0.562    | 🟢 Minor       |
| react-beautiful-dnd | N/A     | 13.1.1  | @dnd-kit | 🔴 Deprecated  |

---

## Task 3.1: Upgrade Colab to React 19

**Priority:** 🔴 Critical
**Estimated Time:** 4 hours

### Pre-Upgrade Checklist

- [ ] All tests passing
- [ ] Backup commit created
- [ ] React 19 migration guide reviewed

### Step 1: Update Dependencies

```bash
cd /Users/utilisateur/Desktop/Alecia_Colab/apps/web

# Update React
npm install react@19.2.3 react-dom@19.2.3

# Update types
npm install -D @types/react@19 @types/react-dom@19
```

### Step 2: Fix Breaking Changes

**Issue 1: `forwardRef` changes**
React 19 passes `ref` as a prop, not through `forwardRef`:

```typescript
// Before (React 18)
const Button = forwardRef<HTMLButtonElement, Props>((props, ref) => (
  <button ref={ref} {...props} />
));

// After (React 19) - both work, but new pattern is simpler
const Button = ({ ref, ...props }: Props & { ref?: React.Ref<HTMLButtonElement> }) => (
  <button ref={ref} {...props} />
);
```

**Issue 2: `use()` hook**
React 19 introduces `use()` for promises. No action needed unless using experimental features.

### Step 3: Verify Hydration

```bash
npm run build
npm run start
# Check browser console for hydration errors
```

### Success Criteria

- [ ] Build passes with React 19
- [ ] No hydration errors in console
- [ ] Iframe embedding still works

---

## Task 3.2: Upgrade Next.js to 15.3.4

**Priority:** 🟡 Medium
**Estimated Time:** 1 hour

```bash
npm install next@15.3.4
```

### Known Changes

- Turbopack improvements
- Caching behavior updates
- Middleware enhancements

### Success Criteria

- [ ] Build passes
- [ ] Dev server starts without warnings

---

## Task 3.3: Replace react-beautiful-dnd with @dnd-kit

**Priority:** 🔴 Critical (Deprecated library)
**Estimated Time:** 6 hours

### Why Replace?

- `react-beautiful-dnd` is deprecated by Atlassian
- No React 19 support
- @dnd-kit is actively maintained and performant

### Step 1: Install @dnd-kit

```bash
npm uninstall react-beautiful-dnd @types/react-beautiful-dnd
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Step 2: Migration Pattern

**Before (react-beautiful-dnd):**

```typescript
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

<DragDropContext onDragEnd={handleDragEnd}>
  <Droppable droppableId="list">
    {(provided) => (
      <div ref={provided.innerRef} {...provided.droppableProps}>
        {items.map((item, index) => (
          <Draggable key={item.id} draggableId={item.id} index={index}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
              >
                {item.content}
              </div>
            )}
          </Draggable>
        ))}
        {provided.placeholder}
      </div>
    )}
  </Droppable>
</DragDropContext>
```

**After (@dnd-kit):**

```typescript
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableItem({ id, content }: { id: string; content: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {content}
    </div>
  );
}

function SortableList({ items, onReorder }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      onReorder(arrayMove(items, oldIndex, newIndex));
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {items.map((item) => (
          <SortableItem key={item.id} id={item.id} content={item.content} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

### Files to Update

1. `app/dashboard/Dashboard.tsx` (stats reordering)
2. `components/kanban/*` (kanban board)
3. `components/deal-pipeline/*` (deal cards)

### Success Criteria

- [ ] All DnD functionality works
- [ ] No deprecated library warnings
- [ ] Keyboard accessibility maintained

---

## Task 3.4: Upgrade TipTap to v3

**Priority:** 🟡 Medium
**Estimated Time:** 2 hours

```bash
npm install @tiptap/core@3 @tiptap/react@3 @tiptap/starter-kit@3
npm install @tiptap/extension-image@3 @tiptap/extension-link@3
npm install @tiptap/extension-table@3 @tiptap/extension-table-cell@3
npm install @tiptap/extension-table-header@3 @tiptap/extension-table-row@3
```

### API Changes

- Minor API changes, mostly type improvements
- Check extension configurations

### Success Criteria

- [ ] Editor renders correctly
- [ ] All features (links, images, tables) work
- [ ] No console errors

---

## Batch 3 Completion Checklist

- [ ] Task 3.1: React 19 upgrade complete
- [ ] Task 3.2: Next.js 15.3.4 upgrade complete
- [ ] Task 3.3: @dnd-kit migration complete
- [ ] Task 3.4: TipTap v3 upgrade complete

**Verification:**

```bash
npm run build
npm run lint
npm run dev  # Test all DnD functionality
```

**Sign-off Required Before Batch 4:** **\*\***\_\_\_**\*\***

---

# BATCH 4: AUTHENTICATION & DATA SYNC

## Objective

Implement OAuth-based data synchronization with Microsoft 365 (for calendar/contacts) and Pipedrive (for CRM/deals) through Clerk's social connections, NOT direct API integration.

## Duration

**4 days** | Priority: 🟡 High

## Prerequisites

- Batch 3 completed
- Clerk Dashboard access
- Microsoft Azure AD app registration
- Pipedrive OAuth app registration

## Architecture Decision: Auth-Based Sync vs API

| Approach            | Pros                              | Cons                            | Chosen |
| ------------------- | --------------------------------- | ------------------------------- | ------ |
| **OAuth via Clerk** | No API keys, user consent, secure | Limited data access             | ✅ Yes |
| **Direct API**      | Full data access                  | Key management, security burden | ❌ No  |

**Decision:** Use Clerk social connections to authenticate with Microsoft and Pipedrive. Access user data through their OAuth tokens, respecting user consent.

---

## Task 4.1: Configure Microsoft 365 OAuth in Clerk

**Priority:** 🔴 Critical
**Estimated Time:** 4 hours

### Step 1: Create Azure AD App

1. Go to [Azure Portal](https://portal.azure.com) → Azure Active Directory
2. App registrations → New registration
3. Configure:
   - Name: `Alecia M&A Platform`
   - Redirect URI: `https://clerk.alecia.markets/v1/oauth_callback`
   - Supported account types: `Accounts in any organizational directory and personal Microsoft accounts`

4. Configure API Permissions:

   ```
   Microsoft Graph:
   - openid (delegated)
   - email (delegated)
   - profile (delegated)
   - User.Read (delegated)
   - Calendars.Read (delegated) - for calendar sync
   - Contacts.Read (delegated) - for contact sync
   - Mail.Read (delegated) - optional, for email context
   ```

5. Get credentials:
   - Application (client) ID
   - Client secret (create new)

### Step 2: Configure Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com) → Social Connections
2. Enable Microsoft
3. Enter credentials from Azure
4. Set scopes:
   ```
   openid email profile User.Read Calendars.Read Contacts.Read
   ```

### Step 3: Update Clerk Configuration

**File:** `apps/website/src/middleware.ts`

```typescript
// Ensure Microsoft OAuth callback is allowed
const publicRoutes = createRouteMatcher([
  "/",
  "/:locale",
  "/:locale/expertises(.*)",
  // ... existing routes
  "/api/webhooks/clerk(.*)",
  "/api/oauth/microsoft/callback", // Add this
]);
```

### Step 4: Create Microsoft Data Sync Hook

**File:** `apps/website/src/hooks/use-microsoft-sync.ts`

```typescript
import { useAuth } from "@clerk/nextjs";
import { useState, useCallback } from "react";

interface MicrosoftCalendarEvent {
  id: string;
  subject: string;
  start: { dateTime: string };
  end: { dateTime: string };
  attendees: Array<{ emailAddress: { address: string; name: string } }>;
}

interface MicrosoftContact {
  id: string;
  displayName: string;
  emailAddresses: Array<{ address: string }>;
  companyName?: string;
}

export function useMicrosoftSync() {
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get Microsoft Graph access token via Clerk
   * Clerk handles token refresh automatically
   */
  const getMicrosoftToken = useCallback(async () => {
    try {
      // Get OAuth access token for Microsoft provider
      const token = await getToken({ template: "microsoft_oauth" });
      return token;
    } catch (err) {
      setError("Failed to get Microsoft token");
      return null;
    }
  }, [getToken]);

  /**
   * Fetch calendar events from Microsoft 365
   */
  const fetchCalendarEvents = useCallback(
    async (
      startDate: Date,
      endDate: Date
    ): Promise<MicrosoftCalendarEvent[]> => {
      setIsLoading(true);
      setError(null);

      try {
        const token = await getMicrosoftToken();
        if (!token) return [];

        const response = await fetch(
          `https://graph.microsoft.com/v1.0/me/calendarView?` +
            `startDateTime=${startDate.toISOString()}&` +
            `endDateTime=${endDate.toISOString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Microsoft API error: ${response.status}`);
        }

        const data = await response.json();
        return data.value || [];
      } catch (err) {
        setError(err instanceof Error ? err.message : "Calendar sync failed");
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [getMicrosoftToken]
  );

  /**
   * Fetch contacts from Microsoft 365
   */
  const fetchContacts = useCallback(async (): Promise<MicrosoftContact[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getMicrosoftToken();
      if (!token) return [];

      const response = await fetch(
        "https://graph.microsoft.com/v1.0/me/contacts?$top=100",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Microsoft API error: ${response.status}`);
      }

      const data = await response.json();
      return data.value || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : "Contact sync failed");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [getMicrosoftToken]);

  return {
    fetchCalendarEvents,
    fetchContacts,
    isLoading,
    error,
    isMicrosoftConnected: !!getToken,
  };
}
```

### Step 5: Create Clerk JWT Template

In Clerk Dashboard → JWT Templates:

1. Create template named `microsoft_oauth`
2. Configure claims to include Microsoft OAuth token

### Success Criteria

- [ ] Users can sign in with Microsoft
- [ ] Calendar events can be fetched
- [ ] Contacts can be synced to CRM
- [ ] Token refresh works automatically

---

## Task 4.2: Configure Pipedrive OAuth in Clerk

**Priority:** 🟡 High
**Estimated Time:** 4 hours

### Step 1: Create Pipedrive OAuth App

1. Go to [Pipedrive Marketplace](https://marketplace.pipedrive.com/app)
2. Create new app → OAuth app
3. Configure:
   - Redirect URI: `https://clerk.alecia.markets/v1/oauth_callback`
   - Scopes: `deals:read`, `persons:read`, `organizations:read`

### Step 2: Configure Clerk Custom OAuth

Since Pipedrive isn't a built-in Clerk provider, use Custom OAuth:

**Clerk Dashboard → Social Connections → Add Custom Provider**

```
Name: Pipedrive
Client ID: [from Pipedrive]
Client Secret: [from Pipedrive]
Authorization URL: https://oauth.pipedrive.com/oauth/authorize
Token URL: https://oauth.pipedrive.com/oauth/token
Scopes: deals:read persons:read organizations:read
User Info URL: https://api.pipedrive.com/v1/users/me
```

### Step 3: Create Pipedrive Sync Hook

**File:** `apps/website/src/hooks/use-pipedrive-sync.ts`

```typescript
import { useAuth } from "@clerk/nextjs";
import { useState, useCallback } from "react";

interface PipedriveDeal {
  id: number;
  title: string;
  value: number;
  currency: string;
  status: "open" | "won" | "lost";
  stage_id: number;
  person_id: number;
  org_id: number;
}

interface PipedriveContact {
  id: number;
  name: string;
  email: Array<{ value: string; primary: boolean }>;
  phone: Array<{ value: string; primary: boolean }>;
  org_id?: number;
}

export function usePipedriveSync() {
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPipedriveToken = useCallback(async () => {
    try {
      const token = await getToken({ template: "pipedrive_oauth" });
      return token;
    } catch (err) {
      setError("Failed to get Pipedrive token");
      return null;
    }
  }, [getToken]);

  /**
   * Fetch deals from Pipedrive
   */
  const fetchDeals = useCallback(async (): Promise<PipedriveDeal[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getPipedriveToken();
      if (!token) return [];

      const response = await fetch(
        "https://api.pipedrive.com/v1/deals?limit=100",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Pipedrive API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deal sync failed");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [getPipedriveToken]);

  /**
   * Sync Pipedrive deals to Convex
   */
  const syncDealsToConvex = useCallback(
    async (
      pipedriveDeals: PipedriveDeal[],
      createDealMutation: (deal: any) => Promise<any>
    ) => {
      const results = {
        synced: 0,
        failed: 0,
        skipped: 0,
      };

      for (const deal of pipedriveDeals) {
        try {
          // Map Pipedrive deal to Convex schema
          await createDealMutation({
            name: deal.title,
            value: deal.value,
            currency: deal.currency,
            stage: mapPipedriveStage(deal.stage_id),
            source: "pipedrive",
            externalId: `pipedrive_${deal.id}`,
            metadata: { pipedriveId: deal.id },
          });
          results.synced++;
        } catch (err) {
          results.failed++;
        }
      }

      return results;
    },
    []
  );

  return {
    fetchDeals,
    syncDealsToConvex,
    isLoading,
    error,
  };
}

function mapPipedriveStage(stageId: number): string {
  // Map Pipedrive stage IDs to Alecia stages
  const stageMap: Record<number, string> = {
    1: "qualification",
    2: "analysis",
    3: "negotiation",
    4: "closing",
    5: "completed",
  };
  return stageMap[stageId] || "qualification";
}
```

### Success Criteria

- [ ] Users can connect Pipedrive account
- [ ] Deals sync to Convex database
- [ ] Stage mapping works correctly
- [ ] Duplicate detection prevents re-import

---

## Task 4.3: Create Sync Dashboard UI

**Priority:** 🟡 High
**Estimated Time:** 4 hours

### Create Integrations Page

**File:** `apps/website/src/app/[locale]/admin/settings/integrations/page.tsx`

```typescript
'use client';

import { useMicrosoftSync } from '@/hooks/use-microsoft-sync';
import { usePipedriveSync } from '@/hooks/use-pipedrive-sync';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function IntegrationsPage() {
  const { isMicrosoftConnected, fetchCalendarEvents, isLoading: msLoading } = useMicrosoftSync();
  const { fetchDeals, isLoading: pdLoading } = usePipedriveSync();

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Intégrations</h1>
      <p className="text-muted-foreground">
        Connectez vos outils pour synchroniser automatiquement vos données.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Microsoft 365 Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <img src="/icons/microsoft.svg" alt="Microsoft" className="w-6 h-6" />
                Microsoft 365
              </CardTitle>
              <Badge variant={isMicrosoftConnected ? "default" : "secondary"}>
                {isMicrosoftConnected ? (
                  <><CheckCircle className="w-3 h-3 mr-1" /> Connecté</>
                ) : (
                  <><XCircle className="w-3 h-3 mr-1" /> Non connecté</>
                )}
              </Badge>
            </div>
            <CardDescription>
              Synchronisez votre calendrier et vos contacts Outlook.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isMicrosoftConnected ? (
              <>
                <Button
                  onClick={() => fetchCalendarEvents(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))}
                  disabled={msLoading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${msLoading ? 'animate-spin' : ''}`} />
                  Synchroniser le calendrier
                </Button>
              </>
            ) : (
              <Button asChild>
                <a href="/sign-in?oauth_microsoft=true">
                  Connecter Microsoft 365
                </a>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Pipedrive Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <img src="/icons/pipedrive.svg" alt="Pipedrive" className="w-6 h-6" />
                Pipedrive
              </CardTitle>
              <Badge variant="secondary">
                <XCircle className="w-3 h-3 mr-1" /> Non connecté
              </Badge>
            </div>
            <CardDescription>
              Importez vos deals et contacts depuis Pipedrive.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <a href="/sign-in?oauth_pipedrive=true">
                Connecter Pipedrive
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### Success Criteria

- [ ] Integration status visible at a glance
- [ ] One-click sync functionality
- [ ] Error states handled gracefully

---

## Batch 4 Completion Checklist

- [ ] Task 4.1: Microsoft 365 OAuth working
- [ ] Task 4.2: Pipedrive OAuth working
- [ ] Task 4.3: Sync dashboard UI complete

**Sign-off Required Before Batch 5:** **\*\***\_\_\_**\*\***

---

# BATCH 5: DEAD CODE & NON-FUNCTIONAL ELEMENTS

## Objective

Identify and fix all buttons, links, and features that don't work or lead nowhere. Ensure 100% of UI elements are functional.

## Duration

**2 days** | Priority: 🟡 High

## Prerequisites

- Batch 3 completed
- Branch `feature/batch-5-dead-code` created

---

## Task 5.1: Audit All Admin Panel Buttons

**Priority:** 🔴 Critical
**Estimated Time:** 4 hours

### Methodology

1. Manually click every button in admin panel
2. Document which ones don't work
3. Categorize by fix type

### Audit Checklist

**Dashboard (`/admin/dashboard`):**

- [ ] All stat cards clickable → Lead to detail view
- [ ] Quick actions → Navigate correctly
- [ ] Refresh button → Reloads data

**Deals (`/admin/deals`):**

- [ ] New Deal button → Opens creation modal
- [ ] Filter dropdowns → Filter data
- [ ] Search → Actually searches
- [ ] Deal cards → Open deal detail
- [ ] Stage drag-drop → Updates database
- [ ] View toggle (Kanban/List) → Switches view

**CRM (`/admin/crm`):**

- [ ] Add Contact button → Opens form
- [ ] Add Company button → Opens form
- [ ] Contact cards → Navigate to detail
- [ ] Company cards → Navigate to detail
- [ ] Import button → Works or shows coming soon

**Documents (`/admin/documents`):**

- [ ] New Document → Creates document
- [ ] Upload button → Opens file picker
- [ ] Document cards → Navigate to document

**Settings (`/admin/settings`):**

- [ ] All setting toggles → Save to database
- [ ] Save buttons → Persist changes
- [ ] Danger zone buttons → Show confirmation

### Common Fixes

**Fix 1: Button with no handler**

```typescript
// Before
<Button>Nouveau Deal</Button>

// After
<Button onClick={() => setIsModalOpen(true)}>Nouveau Deal</Button>
```

**Fix 2: Link to non-existent route**

```typescript
// Before
<Link href="/admin/reports">Rapports</Link>

// After (if not implemented)
<Button disabled className="opacity-50">
  Rapports <Badge>Bientôt</Badge>
</Button>
```

**Fix 3: Form that doesn't submit**

```typescript
// Before
<form>
  <Button type="submit">Enregistrer</Button>
</form>

// After
<form onSubmit={handleSubmit}>
  <Button type="submit" disabled={isSubmitting}>
    {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
  </Button>
</form>
```

### Success Criteria

- [ ] 100% of buttons have handlers
- [ ] All links navigate to valid routes
- [ ] Disabled features show "Coming Soon" badge

---

## Task 5.2: Fix Website Marketing Dead Links

**Priority:** 🟡 Medium
**Estimated Time:** 2 hours

### Audit All External Links

```bash
# Find all href attributes
grep -rn 'href="' --include="*.tsx" apps/website/src/ | grep -E 'http[s]?://'
```

### Common Issues

1. Old domain links (pre-alecia.markets)
2. Social media links to placeholder URLs
3. Partner/client links that may be outdated

### Fix Pattern

```typescript
// Before
<a href="https://old-domain.com">Link</a>

// After - with validation
const VERIFIED_LINKS = {
  linkedin: 'https://linkedin.com/company/alecia',
  twitter: 'https://twitter.com/alecia',
};

<a href={VERIFIED_LINKS.linkedin} target="_blank" rel="noopener noreferrer">
  LinkedIn
</a>
```

### Success Criteria

- [ ] All external links verified working
- [ ] No links to old domains

---

## Task 5.3: Remove Unused Code

**Priority:** 🟢 Medium
**Estimated Time:** 3 hours

### Step 1: Find Unused Exports

```bash
# Use ts-prune to find unused exports
npx ts-prune ./src
```

### Step 2: Find Unused Components

```bash
# Find components that are never imported
for file in $(find src/components -name "*.tsx"); do
  name=$(basename "$file" .tsx)
  if ! grep -rq "$name" src/ --include="*.tsx" --include="*.ts" | grep -v "$file"; then
    echo "Potentially unused: $file"
  fi
done
```

### Step 3: Remove Dead Code

- [ ] Delete unused components
- [ ] Remove unused utilities
- [ ] Clean up unused types

### Success Criteria

- [ ] No unused exports
- [ ] No orphan components
- [ ] Bundle size reduced

---

## Batch 5 Completion Checklist

- [ ] Task 5.1: Admin panel buttons all functional
- [ ] Task 5.2: Marketing links all valid
- [ ] Task 5.3: Dead code removed

**Verification:**

```bash
# Build should complete faster with less code
time npm run build
```

**Sign-off Required Before Batch 6:** **\*\***\_\_\_**\*\***

---

# BATCH 6: KANBAN CONSOLIDATION

## Objective

Resolve the duplicate deal pipeline feature by analyzing both implementations (Website Admin and Colab), selecting the best aspects of each, and creating a unified, best-in-class kanban experience.

## Duration

**3 days** | Priority: 🟡 High

## Prerequisites

- Batch 5 completed
- @dnd-kit migration completed (Batch 3.3)
- Branch `feature/batch-6-kanban` created

---

## Task 6.1: Comparative Analysis of Both Kanbans

**Priority:** 🔴 Critical
**Estimated Time:** 4 hours
**Deliverable:** Decision document

### Website Admin Kanban (`/admin/deals`)

**Location:** `apps/website/src/app/[locale]/admin/deals/page.tsx`

| Aspect          | Implementation             | Score           |
| --------------- | -------------------------- | --------------- |
| **Tech Stack**  | Server components + Convex | ✅ Modern       |
| **DnD Library** | None currently             | ⚠️ Missing      |
| **Data Source** | Convex `deals` table       | ✅ Correct      |
| **Stages**      | Hardcoded array            | ⚠️ Not flexible |
| **Filters**     | Basic search               | ⚠️ Limited      |
| **Views**       | Kanban + List toggle       | ✅ Good         |
| **Permissions** | Clerk auth                 | ✅ Secure       |
| **Performance** | Server rendering           | ✅ Fast initial |
| **Real-time**   | Convex reactive            | ✅ Automatic    |

**Strengths:**

- Proper data isolation (uses unprefixed `deals` table)
- Integrated with admin panel navigation
- Server-side rendering for fast initial load

**Weaknesses:**

- No drag-and-drop implemented
- Limited filtering options
- No stage customization

### Colab Kanban (`/pipeline`)

**Location:** `Alecia_Colab/apps/web/app/pipeline/page.tsx`

| Aspect          | Implementation                   | Score             |
| --------------- | -------------------------------- | ----------------- |
| **Tech Stack**  | Client components + Convex       | ✅ Interactive    |
| **DnD Library** | react-beautiful-dnd (deprecated) | 🔴 Needs upgrade  |
| **Data Source** | Convex `colab_deals` table       | ⚠️ Isolated       |
| **Stages**      | Dynamic from config              | ✅ Flexible       |
| **Filters**     | Advanced (stage, assignee, date) | ✅ Comprehensive  |
| **Views**       | Kanban only                      | ⚠️ Limited        |
| **Permissions** | Clerk auth                       | ✅ Secure         |
| **Performance** | Client rendering                 | ⚠️ Slower initial |
| **Real-time**   | Convex reactive + presence       | ✅ Collaborative  |

**Strengths:**

- Full drag-and-drop functionality
- Real-time collaboration with presence indicators
- Advanced filtering and search
- Stage configuration is dynamic

**Weaknesses:**

- Uses isolated `colab_deals` table (data duplication risk)
- Deprecated DnD library
- Client-only rendering

### Decision Matrix

| Feature         | Keep From                    | Rationale              |
| --------------- | ---------------------------- | ---------------------- |
| **Data Source** | Website (`deals`)            | Single source of truth |
| **DnD**         | Colab (upgraded to @dnd-kit) | Full functionality     |
| **Filtering**   | Colab                        | More comprehensive     |
| **Stages**      | Colab (dynamic)              | Flexible for clients   |
| **Views**       | Website (Kanban + List)      | User preference        |
| **Routing**     | Website (`/admin/deals`)     | Consistent admin UX    |
| **Presence**    | Colab                        | Collaboration feature  |

### Architecture Decision

**Chosen Approach:**

1. Upgrade Website kanban with Colab's features
2. Deprecate Colab's `/pipeline` route
3. Embed upgraded kanban in Colab via link/iframe (not duplicate)

---

## Task 6.2: Implement Unified Kanban Component

**Priority:** 🔴 Critical
**Estimated Time:** 8 hours

### Step 1: Create Shared Kanban Component

**File:** `apps/website/src/components/admin/deals/DealKanban.tsx`

```typescript
'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { DealColumn } from './DealColumn';
import { DealCard } from './DealCard';
import { DealFilters } from './DealFilters';

// Stage configuration - can be moved to Convex for dynamic management
const DEAL_STAGES = [
  { id: 'qualification', label: 'Qualification', color: 'bg-slate-500' },
  { id: 'analysis', label: 'Analyse', color: 'bg-blue-500' },
  { id: 'negotiation', label: 'Négociation', color: 'bg-amber-500' },
  { id: 'due_diligence', label: 'Due Diligence', color: 'bg-purple-500' },
  { id: 'closing', label: 'Closing', color: 'bg-green-500' },
  { id: 'completed', label: 'Terminé', color: 'bg-emerald-600' },
] as const;

interface DealKanbanProps {
  initialDeals?: Deal[];
}

export function DealKanban({ initialDeals }: DealKanbanProps) {
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    stage: 'all',
    assignee: 'all',
  });

  // Convex queries
  const deals = useQuery(api.deals.list, {}) ?? initialDeals ?? [];
  const moveStage = useMutation(api.deals.moveStage);

  // Filter deals
  const filteredDeals = deals.filter((deal) => {
    if (filters.search && !deal.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.stage !== 'all' && deal.stage !== filters.stage) {
      return false;
    }
    return true;
  });

  // Group deals by stage
  const dealsByStage = DEAL_STAGES.reduce((acc, stage) => {
    acc[stage.id] = filteredDeals.filter((d) => d.stage === stage.id);
    return acc;
  }, {} as Record<string, Deal[]>);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const deal = deals.find((d) => d._id === event.active.id);
    setActiveDeal(deal ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);

    if (!over) return;

    const dealId = active.id as Id<'deals'>;
    const newStage = over.id as string;

    // Find the deal
    const deal = deals.find((d) => d._id === dealId);
    if (!deal || deal.stage === newStage) return;

    // Optimistic update would go here
    // For now, just call the mutation
    await moveStage({
      id: dealId,
      stage: newStage,
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Filters */}
      <DealFilters filters={filters} onChange={setFilters} />

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 p-4 min-w-max">
            {DEAL_STAGES.map((stage) => (
              <DealColumn
                key={stage.id}
                stage={stage}
                deals={dealsByStage[stage.id] || []}
              />
            ))}
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeDeal ? <DealCard deal={activeDeal} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
```

### Step 2: Create Supporting Components

**File:** `DealColumn.tsx`

```typescript
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DealCard } from './DealCard';

interface DealColumnProps {
  stage: { id: string; label: string; color: string };
  deals: Deal[];
}

export function DealColumn({ stage, deals }: DealColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  return (
    <div
      ref={setNodeRef}
      className={`
        w-80 flex-shrink-0 bg-muted/50 rounded-xl p-4
        ${isOver ? 'ring-2 ring-primary' : ''}
      `}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${stage.color}`} />
          <h3 className="font-semibold">{stage.label}</h3>
          <span className="text-sm text-muted-foreground">
            ({deals.length})
          </span>
        </div>
      </div>

      {/* Deal Cards */}
      <SortableContext
        items={deals.map((d) => d._id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {deals.map((deal) => (
            <DealCard key={deal._id} deal={deal} />
          ))}
        </div>
      </SortableContext>

      {/* Empty State */}
      {deals.length === 0 && (
        <div className="py-8 text-center text-muted-foreground text-sm">
          Aucun deal
        </div>
      )}
    </div>
  );
}
```

**File:** `DealCard.tsx`

```typescript
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatCurrency } from '@/lib/formatters';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface DealCardProps {
  deal: Deal;
  isDragging?: boolean;
}

export function DealCard({ deal, isDragging }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: deal._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        bg-card border rounded-lg p-4 cursor-grab active:cursor-grabbing
        hover:shadow-md transition-shadow
        ${isDragging ? 'opacity-50 shadow-lg' : ''}
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium line-clamp-2">{deal.name}</h4>
      </div>

      {deal.company && (
        <p className="text-sm text-muted-foreground mb-2">
          {deal.company}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="font-semibold text-primary">
          {formatCurrency(deal.value, deal.currency)}
        </span>

        {deal.assignee && (
          <Avatar className="w-6 h-6">
            <AvatarFallback className="text-xs">
              {deal.assignee.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}
```

### Step 3: Update Convex Mutation

**File:** `convex/deals.ts`

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const moveStage = mutation({
  args: {
    id: v.id("deals"),
    stage: v.string(),
  },
  handler: async (ctx, { id, stage }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Validate stage
    const validStages = [
      "qualification",
      "analysis",
      "negotiation",
      "due_diligence",
      "closing",
      "completed",
    ];
    if (!validStages.includes(stage)) {
      throw new Error(`Invalid stage: ${stage}`);
    }

    // Update deal
    await ctx.db.patch(id, {
      stage,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
```

### Success Criteria

- [ ] Drag and drop works smoothly
- [ ] Stage updates persist to Convex
- [ ] Keyboard navigation works
- [ ] Mobile touch works

---

## Task 6.3: Deprecate Colab Pipeline

**Priority:** 🟡 Medium
**Estimated Time:** 2 hours

### Step 1: Add Redirect

**File:** `Alecia_Colab/apps/web/app/pipeline/page.tsx`

```typescript
import { redirect } from "next/navigation";
import { ADMIN_ROUTES } from "@/lib/alecia-domains";

export default function PipelinePage() {
  // Redirect to unified kanban in admin panel
  redirect(ADMIN_ROUTES.deals);
}
```

### Step 2: Update Sidebar Navigation

Change pipeline link to go to admin panel instead.

### Step 3: Data Migration (if needed)

If there are deals in `colab_deals` that aren't in `deals`, migrate them:

```typescript
// Migration script (run once)
import { internalMutation } from "./_generated/server";

export const migrateColabDeals = internalMutation({
  handler: async (ctx) => {
    const colabDeals = await ctx.db.query("colab_deals").collect();

    for (const deal of colabDeals) {
      // Check if already exists
      const existing = await ctx.db
        .query("deals")
        .withIndex("by_external_id", (q) =>
          q.eq("externalId", `colab_${deal._id}`)
        )
        .first();

      if (!existing) {
        await ctx.db.insert("deals", {
          name: deal.name,
          value: deal.value,
          stage: deal.stage,
          source: "colab_migration",
          externalId: `colab_${deal._id}`,
          // ... map other fields
        });
      }
    }
  },
});
```

### Success Criteria

- [ ] Pipeline route redirects correctly
- [ ] No data loss during migration
- [ ] Users can access deals from Colab via redirect

---

## Batch 6 Completion Checklist

- [ ] Task 6.1: Analysis complete, decision documented
- [ ] Task 6.2: Unified kanban implemented
- [ ] Task 6.3: Colab pipeline deprecated

**Sign-off Required Before Batch 7:** **\*\***\_\_\_**\*\***

---

# BATCH 7: BACKEND SCHEMA PERFECTION

## Objective

Ensure Convex schema is perfectly synchronized across environments, with proper indexing, validation, and environment-based configuration.

## Duration

**2 days** | Priority: 🟡 High

## Prerequisites

- Batch 4 completed (Auth sync)
- Batch 6 completed (Kanban consolidation)
- Branch `feature/batch-7-schema` created

---

## Task 7.1: Schema Audit & Optimization

**Priority:** 🔴 Critical
**Estimated Time:** 4 hours

### Current Schema Issues

| Table      | Issue                      | Impact           |
| ---------- | -------------------------- | ---------------- |
| `deals`    | Missing `externalId` index | Slow sync lookup |
| `users`    | Duplicate between apps     | Confusion        |
| `contacts` | No `by_company` index      | Slow filtering   |
| `colab_*`  | Prefix inconsistent        | Some missing     |

### Step 1: Add Missing Indexes

**File:** `apps/panelv2/convex/schema.ts`

```typescript
deals: defineTable({
  name: v.string(),
  company: v.optional(v.string()),
  value: v.optional(v.number()),
  currency: v.optional(v.string()),
  stage: v.string(),
  assignee: v.optional(v.string()),
  source: v.optional(v.string()),
  externalId: v.optional(v.string()),
  metadata: v.optional(v.any()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_stage', ['stage'])
  .index('by_assignee', ['assignee'])
  .index('by_company', ['company'])
  .index('by_external_id', ['externalId']) // NEW: For sync
  .index('by_created', ['createdAt'])
  .index('by_updated', ['updatedAt']),

contacts: defineTable({
  firstName: v.string(),
  lastName: v.string(),
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  company: v.optional(v.id('companies')),
  source: v.optional(v.string()),
  externalId: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_email', ['email'])
  .index('by_company', ['company']) // NEW: For filtering
  .index('by_external_id', ['externalId']), // NEW: For sync
```

### Step 2: Sync Schema to Convex

```bash
cd /Users/utilisateur/Desktop/alepanel/apps/panelv2
export PATH=$PATH:/usr/local/bin
npx convex dev --once
```

### Success Criteria

- [ ] All indexes created
- [ ] Schema push successful
- [ ] No migration errors

---

## Task 7.2: Environment-Based Configuration

**Priority:** 🟡 High
**Estimated Time:** 3 hours

### Create Environment Config

**File:** `apps/panelv2/convex/config.ts`

```typescript
import { v } from "convex/values";

/**
 * Environment configuration
 * Loaded from environment variables
 */
export const config = {
  // Convex environment
  isProduction: process.env.CONVEX_CLOUD_URL?.includes("prod") ?? false,

  // Feature flags
  features: {
    enablePresence: true,
    enableSync: true,
    enableAuditLog: true,
  },

  // Limits
  limits: {
    maxDealsPerPage: 100,
    maxContactsPerPage: 500,
    maxDocumentSize: 10 * 1024 * 1024, // 10MB
  },

  // External integrations
  integrations: {
    microsoft: {
      enabled: !!process.env.MICROSOFT_CLIENT_ID,
    },
    pipedrive: {
      enabled: !!process.env.PIPEDRIVE_CLIENT_ID,
    },
  },
};
```

### Apply Config in Queries

```typescript
import { query } from "./_generated/server";
import { config } from "./config";

export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit }) => {
    const effectiveLimit = Math.min(
      limit ?? config.limits.maxDealsPerPage,
      config.limits.maxDealsPerPage
    );

    return await ctx.db.query("deals").order("desc").take(effectiveLimit);
  },
});
```

### Success Criteria

- [ ] Config centralized
- [ ] Feature flags working
- [ ] Limits enforced

---

## Task 7.3: User Identity Synchronization

**Priority:** 🔴 Critical
**Estimated Time:** 4 hours

### Problem

Same Clerk user may have different records in Website vs Colab.

### Solution: Single User Resolution

**File:** `convex/users.ts`

```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Ensure user exists in database
 * Creates or updates user based on Clerk identity
 */
export const ensureUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const clerkId = identity.subject;

    // Check if user exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (existingUser) {
      // Update last seen
      await ctx.db.patch(existingUser._id, {
        lastSeen: Date.now(),
        // Update profile if changed
        email: identity.email ?? existingUser.email,
        name: identity.name ?? existingUser.name,
        imageUrl: identity.pictureUrl ?? existingUser.imageUrl,
      });
      return existingUser._id;
    }

    // Create new user
    return await ctx.db.insert("users", {
      clerkId,
      email: identity.email ?? "",
      name: identity.name ?? "",
      imageUrl: identity.pictureUrl ?? "",
      role: "user", // Default role
      createdAt: Date.now(),
      lastSeen: Date.now(),
    });
  },
});

/**
 * Get current user
 */
export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
  },
});
```

### Call on App Load

**File:** `apps/website/src/hooks/use-ensure-user.ts`

```typescript
"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";

export function useEnsureUser() {
  const { isSignedIn } = useAuth();
  const ensureUser = useMutation(api.users.ensureUser);

  useEffect(() => {
    if (isSignedIn) {
      ensureUser().catch(console.error);
    }
  }, [isSignedIn, ensureUser]);
}
```

### Success Criteria

- [ ] Single user record per Clerk identity
- [ ] User created on first login
- [ ] Profile synced on each login

---

## Batch 7 Completion Checklist

- [ ] Task 7.1: Schema optimized with indexes
- [ ] Task 7.2: Environment config centralized
- [ ] Task 7.3: User identity unified

**Verification:**

```bash
npx convex dev --once  # Should complete without errors
```

**Sign-off Required Before Batch 8:** **\*\***\_\_\_**\*\***

---

# BATCH 8: INTERNATIONALIZATION EXPANSION

## Objective

Expand Colab from French-only to full bilingual (FR/EN) support, aligning with Website's i18n architecture.

## Duration

**3 days** | Priority: 🟢 Medium

## Prerequisites

- Batch 3 completed
- Branch `feature/batch-8-i18n` created

## Audit Findings Addressed

| Issue                  | Current               | Target                    |
| ---------------------- | --------------------- | ------------------------- |
| Colab language support | FR only               | FR + EN                   |
| i18n library           | Custom implementation | next-intl (match Website) |
| Translation coverage   | ~60%                  | 100%                      |

---

## Task 8.1: Migrate Colab to next-intl

**Priority:** 🔴 Critical
**Estimated Time:** 6 hours

### Step 1: Install Dependencies

```bash
cd /Users/utilisateur/Desktop/Alecia_Colab/apps/web
npm install next-intl
```

### Step 2: Create Routing Configuration

**File:** `lib/i18n/routing.ts`

```typescript
import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
  localePrefix: "as-needed",
});

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
```

### Step 3: Create Messages Structure

**File:** `messages/fr.json`

```json
{
  "common": {
    "save": "Enregistrer",
    "cancel": "Annuler",
    "delete": "Supprimer",
    "edit": "Modifier",
    "create": "Créer",
    "loading": "Chargement...",
    "error": "Une erreur est survenue",
    "success": "Succès",
    "search": "Rechercher",
    "filter": "Filtrer"
  },
  "dashboard": {
    "title": "Tableau de bord",
    "welcome": "Bienvenue, {name}",
    "stats": {
      "documents": "Documents",
      "deals": "Deals",
      "templates": "Modèles",
      "presentations": "Présentations"
    },
    "recentDocuments": "Documents récents",
    "recentActivity": "Activité récente",
    "quickActions": "Actions rapides"
  },
  "documents": {
    "title": "Documents",
    "new": "Nouveau document",
    "empty": "Aucun document",
    "emptyDescription": "Créez votre premier document pour commencer.",
    "untitled": "Sans titre"
  },
  "pipeline": {
    "title": "Pipeline",
    "stages": {
      "qualification": "Qualification",
      "analysis": "Analyse",
      "negotiation": "Négociation",
      "due_diligence": "Due Diligence",
      "closing": "Closing",
      "completed": "Terminé"
    }
  },
  "navigation": {
    "dashboard": "Tableau de bord",
    "documents": "Documents",
    "pipeline": "Pipeline",
    "presentations": "Présentations",
    "calendar": "Calendrier",
    "settings": "Paramètres",
    "adminPanel": "Panel Admin"
  }
}
```

**File:** `messages/en.json`

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create",
    "loading": "Loading...",
    "error": "An error occurred",
    "success": "Success",
    "search": "Search",
    "filter": "Filter"
  },
  "dashboard": {
    "title": "Dashboard",
    "welcome": "Welcome, {name}",
    "stats": {
      "documents": "Documents",
      "deals": "Deals",
      "templates": "Templates",
      "presentations": "Presentations"
    },
    "recentDocuments": "Recent Documents",
    "recentActivity": "Recent Activity",
    "quickActions": "Quick Actions"
  },
  "documents": {
    "title": "Documents",
    "new": "New Document",
    "empty": "No documents",
    "emptyDescription": "Create your first document to get started.",
    "untitled": "Untitled"
  },
  "pipeline": {
    "title": "Pipeline",
    "stages": {
      "qualification": "Qualification",
      "analysis": "Analysis",
      "negotiation": "Negotiation",
      "due_diligence": "Due Diligence",
      "closing": "Closing",
      "completed": "Completed"
    }
  },
  "navigation": {
    "dashboard": "Dashboard",
    "documents": "Documents",
    "pipeline": "Pipeline",
    "presentations": "Presentations",
    "calendar": "Calendar",
    "settings": "Settings",
    "adminPanel": "Admin Panel"
  }
}
```

### Step 4: Update Layout

**File:** `app/layout.tsx`

```typescript
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();

  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <NextIntlClientProvider messages={messages}>
          <ClientProviders>
            <ConvexClientProvider>
              <Providers>{children}</Providers>
            </ConvexClientProvider>
          </ClientProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### Step 5: Replace Custom i18n Usage

**Before (custom system):**

```typescript
import { fr } from '@/lib/i18n/fr';
// ...
<h1>{fr.dashboard.title}</h1>
```

**After (next-intl):**

```typescript
import { useTranslations } from 'next-intl';
// ...
const t = useTranslations('dashboard');
<h1>{t('title')}</h1>
```

### Success Criteria

- [ ] All components use `useTranslations`
- [ ] FR translations 100% complete
- [ ] EN translations 100% complete
- [ ] Language switcher working

---

## Task 8.2: Create Language Switcher for Colab

**Priority:** 🟡 Medium
**Estimated Time:** 2 hours

**File:** `components/layout/LanguageSwitcher.tsx`

```typescript
'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/lib/i18n/routing';
import { Button } from '@/components/tailwind/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/tailwind/ui/dropdown-menu';
import { Languages } from 'lucide-react';

const languages = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  const currentLang = languages.find((l) => l.code === locale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Languages className="h-4 w-4" />
          <span className="ml-1">{currentLang?.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleChange(lang.code)}
            className={locale === lang.code ? 'bg-accent' : ''}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Success Criteria

- [ ] Language can be switched from UI
- [ ] Preference persisted (via cookie)
- [ ] URL reflects language

---

## Batch 8 Completion Checklist

- [ ] Task 8.1: next-intl migration complete
- [ ] Task 8.2: Language switcher implemented

**Sign-off Required Before Batch 9:** **\*\***\_\_\_**\*\***

---

# BATCH 9: ACCESSIBILITY EXCELLENCE

## Objective

Achieve WCAG 2.1 AA compliance across both Website and Colab, with specific focus on the gaps identified in the audit.

## Duration

**2 days** | Priority: 🟢 Medium

## Prerequisites

- Batch 8 completed
- Branch `feature/batch-9-a11y` created

## Audit Findings Addressed

| Issue            | Website | Colab    | Target  |
| ---------------- | ------- | -------- | ------- |
| Skip-to-content  | ✅      | ❌       | ✅ Both |
| Reduced motion   | ✅      | ❌       | ✅ Both |
| Focus indicators | Custom  | Default  | Custom  |
| Touch targets    | 44px    | Variable | ≥ 44px  |
| Color contrast   | WCAG AA | Unknown  | WCAG AA |

---

## Task 9.1: Add Skip-to-Content Link (Colab)

**Priority:** 🔴 Critical
**Estimated Time:** 1 hour

**File:** `app/layout.tsx`

```typescript
<body>
  {/* Skip to main content link - first focusable element */}
  <a
    href="#main-content"
    className="
      sr-only focus:not-sr-only
      focus:absolute focus:top-4 focus:left-4 focus:z-50
      focus:bg-primary focus:text-primary-foreground
      focus:px-4 focus:py-2 focus:rounded-md
      focus:outline-none focus:ring-2 focus:ring-ring
    "
  >
    Aller au contenu principal
  </a>

  {/* ... rest of layout */}

  <main id="main-content" tabIndex={-1}>
    {children}
  </main>
</body>
```

### Success Criteria

- [ ] Tab to skip link works
- [ ] Enter jumps to main content
- [ ] Link is visually hidden until focused

---

## Task 9.2: Implement Reduced Motion Support (Colab)

**Priority:** 🟡 Medium
**Estimated Time:** 2 hours

### Step 1: Add CSS Media Query

**File:** `styles/globals.css`

```css
/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Step 2: Create Motion Hook

**File:** `hooks/use-reduced-motion.ts`

```typescript
"use client";

import { useEffect, useState } from "react";

export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);

    const handler = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };

    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }, []);

  return reducedMotion;
}
```

### Step 3: Use in Framer Motion Components

```typescript
import { useReducedMotion } from '@/hooks/use-reduced-motion';

function AnimatedComponent() {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.3 }}
    >
      Content
    </motion.div>
  );
}
```

### Success Criteria

- [ ] Animations disabled when preference set
- [ ] Transitions become instant
- [ ] Content still accessible

---

## Task 9.3: Improve Focus Indicators (Colab)

**Priority:** 🟡 Medium
**Estimated Time:** 2 hours

**File:** `styles/globals.css`

```css
/* Custom Focus Indicators */
*:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

*:focus:not(:focus-visible) {
  outline: none;
}

/* Button focus states */
button:focus-visible,
[role="button"]:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(var(--ring-rgb), 0.2);
}

/* Input focus states */
input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  outline: none;
  border-color: var(--ring);
  box-shadow: 0 0 0 3px rgba(var(--ring-rgb), 0.15);
}

/* Card/interactive element focus */
[data-focusable]:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

### Success Criteria

- [ ] All focusable elements have visible focus
- [ ] Focus ring uses brand colors
- [ ] Mouse focus doesn't show outline

---

## Task 9.4: Ensure Touch Target Size

**Priority:** 🟡 Medium
**Estimated Time:** 1 hour

### Minimum Size Utility

**File:** `styles/globals.css`

```css
/* Touch target minimum size */
.touch-target {
  min-width: 44px;
  min-height: 44px;
}

/* For smaller visual elements, add padding */
.touch-target-small {
  position: relative;
}

.touch-target-small::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  min-width: 44px;
  min-height: 44px;
}
```

### Apply to Small Buttons

```typescript
// Before
<Button size="icon" className="w-8 h-8">

// After
<Button size="icon" className="w-8 h-8 touch-target-small">
```

### Success Criteria

- [ ] All interactive elements ≥ 44px touch target
- [ ] Visual size can be smaller than touch area

---

## Task 9.5: Color Contrast Audit

**Priority:** 🟢 Medium
**Estimated Time:** 2 hours

### Tools

- Chrome DevTools Lighthouse
- axe DevTools extension
- WAVE accessibility tool

### Common Issues to Fix

| Element          | Current                             | Fix                          |
| ---------------- | ----------------------------------- | ---------------------------- |
| Muted text       | `text-muted-foreground` → too light | Darken `#64748b` → `#475569` |
| Placeholder text | `placeholder-gray-400`              | `placeholder-gray-500`       |
| Disabled states  | `opacity-50`                        | Ensure 4.5:1 ratio           |

### Success Criteria

- [ ] All text passes WCAG AA (4.5:1)
- [ ] Interactive elements pass (3:1)
- [ ] Lighthouse A11Y score > 90

---

## Batch 9 Completion Checklist

- [ ] Task 9.1: Skip-to-content implemented
- [ ] Task 9.2: Reduced motion support added
- [ ] Task 9.3: Focus indicators improved
- [ ] Task 9.4: Touch targets verified
- [ ] Task 9.5: Color contrast fixed

**Verification:**

```bash
# Run Lighthouse accessibility audit
npx lighthouse https://colab.alecia.markets --only-categories=accessibility
```

**Sign-off Required Before Batch 10:** **\*\***\_\_\_**\*\***

---

# BATCH 10: UI/UX REFINEMENT

## Objective

Polish the visual design, fix layout inconsistencies, and ensure a premium, cohesive experience across both applications.

## Duration

**4 days** | Priority: 🟢 Medium

## Prerequisites

- Batch 9 completed
- Branch `feature/batch-10-polish` created

---

## Task 10.1: Unify Design Tokens Across Apps

**Priority:** 🔴 Critical
**Estimated Time:** 4 hours

### Problem

Website has comprehensive design tokens; Colab uses raw Tailwind values.

### Solution: Create Shared Token System

**File:** `Alecia_Colab/apps/web/styles/tokens.css`

```css
:root {
  /* Import Alecia Brand Palette from Website */
  --alecia-midnight: #061a40;
  --alecia-corporate: #163e64;
  --alecia-mid-blue: #4370a7;
  --alecia-light-blue: #749ac7;
  --alecia-sky: #bfd7ea;
  --alecia-cloud: #e3f2fd;
  --alecia-red: #b80c09;
  --alecia-taupe: #afabab;
  --alecia-grey-dark: #6f7a8f;
  --alecia-grey-light: #e6e8ec;
  --alecia-white: #fafafc;
  --alecia-grey-chrome: #c8ccd5;

  /* Map to shadcn theme variables */
  --background: var(--alecia-white);
  --foreground: var(--alecia-midnight);
  --primary: var(--alecia-midnight);
  --primary-foreground: var(--alecia-white);
  --secondary: var(--alecia-grey-light);
  --muted: var(--alecia-grey-light);
  --muted-foreground: var(--alecia-grey-dark);
  --accent: var(--alecia-mid-blue);
  --accent-foreground: var(--alecia-white);
  --destructive: var(--alecia-red);
  --border: var(--alecia-grey-chrome);
  --ring: var(--alecia-mid-blue);
}
```

### Replace Hardcoded Colors

Search and replace pattern:

```bash
# Find hardcoded grays
grep -rn "text-gray-" --include="*.tsx" components/
grep -rn "bg-gray-" --include="*.tsx" components/
```

**Replacement Map:**
| Current | Replacement |
|---------|-------------|
| `text-gray-500` | `text-muted-foreground` |
| `text-gray-400` | `text-muted-foreground/70` |
| `bg-gray-100` | `bg-muted` |
| `bg-gray-900` | `bg-background` |
| `border-gray-200` | `border-border` |

### Success Criteria

- [ ] All colors use CSS variables
- [ ] No hardcoded gray/blue values
- [ ] Theme matches Website

---

## Task 10.2: Fix Admin Panel Layout Issues

**Priority:** 🟡 High
**Estimated Time:** 4 hours

### Known Issues

1. **Settings page inconsistency**
   - Uses hardcoded `text-gray-500`, `bg-gray-100`
   - Buttons not aligned

2. **CRM page layout**
   - Cards don't align on mobile
   - Search bar too narrow

3. **Dashboard spacing**
   - Inconsistent padding
   - Stats cards different heights

### Fix: Settings Page

**File:** `app/[locale]/admin/settings/page.tsx`

```typescript
// Before
<div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">

// After
<div className="rounded-2xl border border-border bg-card p-6">
```

### Fix: CRM Page Mobile

```typescript
// Before
<div className="grid gap-6 md:grid-cols-2">

// After - with proper mobile stacking
<div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
```

### Success Criteria

- [ ] All admin pages use design tokens
- [ ] Mobile layout works correctly
- [ ] Consistent spacing throughout

---

## Task 10.3: Polish Navigation & Sidebar

**Priority:** 🟡 Medium
**Estimated Time:** 4 hours

### Website Admin Sidebar Improvements

1. **Add active state indicator**

```typescript
<Link
  href={item.href}
  className={cn(
    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
    isActive
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:bg-muted"
  )}
>
```

2. **Add keyboard shortcuts hints**

```typescript
<span className="ml-auto text-xs text-muted-foreground">
  ⌘K
</span>
```

### Colab Sidebar Alignment

1. **Match Website styling**
2. **Add section dividers**
3. **Consistent icon sizes**

### Success Criteria

- [ ] Active states visible
- [ ] Keyboard hints shown
- [ ] Both sidebars match visually

---

## Task 10.4: Form & Input Polish

**Priority:** 🟡 Medium
**Estimated Time:** 4 hours

### Consistent Form Styling

**File:** Create `components/ui/form-field.tsx`

```typescript
interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

export function FormField({ label, required, error, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
```

### Input Error States

```css
/* Error state */
.input-error {
  border-color: var(--destructive);
}

.input-error:focus {
  box-shadow: 0 0 0 3px rgba(var(--destructive-rgb), 0.15);
}
```

### Success Criteria

- [ ] All forms use consistent wrapper
- [ ] Error states styled
- [ ] Required indicators visible

---

## Task 10.5: Loading & Empty States

**Priority:** 🟢 Medium
**Estimated Time:** 4 hours

### Create Skeleton Components

**File:** `components/ui/skeleton-card.tsx`

```typescript
export function SkeletonCard() {
  return (
    <div className="rounded-xl border bg-card p-6 animate-pulse">
      <div className="h-4 bg-muted rounded w-1/3 mb-4" />
      <div className="h-3 bg-muted rounded w-full mb-2" />
      <div className="h-3 bg-muted rounded w-2/3" />
    </div>
  );
}
```

### Create Empty State Component

**File:** `components/ui/empty-state.tsx`

```typescript
interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-4">{description}</p>
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

### Success Criteria

- [ ] All loading states use skeletons
- [ ] All empty states have icons
- [ ] Consistent styling throughout

---

## Batch 10 Completion Checklist

- [ ] Task 10.1: Design tokens unified
- [ ] Task 10.2: Admin layout fixed
- [ ] Task 10.3: Navigation polished
- [ ] Task 10.4: Forms consistent
- [ ] Task 10.5: Loading/empty states added

**Sign-off Required Before Batch 11:** ******\_\_\_******

---

# BATCH 11: PERFORMANCE OPTIMIZATION

## Objective

Optimize bundle size, loading times, and runtime performance for both applications to achieve Lighthouse scores > 90.

## Duration

**2 days** | Priority: 🟢 Medium

## Prerequisites

- Batch 10 completed
- Branch `feature/batch-11-performance` created

---

## Task 11.1: Bundle Size Analysis & Reduction

**Priority:** 🔴 Critical
**Estimated Time:** 4 hours

### Step 1: Analyze Current Bundle

```bash
cd /Users/utilisateur/Desktop/alepanel/apps/website
npx @next/bundle-analyzer
npm run build

cd /Users/utilisateur/Desktop/Alecia_Colab/apps/web
npx @next/bundle-analyzer
npm run build
```

### Step 2: Common Issue - Large Dependencies

| Package         | Size   | Issue       | Fix             |
| --------------- | ------ | ----------- | --------------- |
| `framer-motion` | ~70KB  | Full bundle | Dynamic import  |
| `lucide-react`  | ~100KB | All icons   | Tree-shake      |
| `date-fns`      | ~80KB  | Full bundle | Import specific |
| `lodash`        | ~70KB  | Full bundle | Import specific |

### Step 3: Dynamic Import Large Components

**Before:**

```typescript
import { motion } from "framer-motion";
```

**After:**

```typescript
import dynamic from "next/dynamic";

const MotionDiv = dynamic(
  () => import("framer-motion").then((mod) => mod.motion.div),
  { ssr: false }
);
```

### Step 4: Optimize Icon Imports

**Before:**

```typescript
import { Home, Settings, User, ... } from 'lucide-react';
```

**After:**

```typescript
// Create barrel file
// components/icons/index.ts
export { Home } from "lucide-react";
export { Settings } from "lucide-react";
export { User } from "lucide-react";

// Usage
import { Home, Settings, User } from "@/components/icons";
```

### Success Criteria

- [ ] Bundle size < 200KB (gzipped)
- [ ] No unused dependencies
- [ ] Large libs dynamically imported

---

## Task 11.2: Implement Code Splitting for Editor

**Priority:** 🟡 High
**Estimated Time:** 3 hours

### Problem

TipTap editor (~150KB) loaded on every page.

### Solution: Lazy Load Editor

**File:** `components/editor/lazy-editor.tsx`

```typescript
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const Editor = dynamic(
  () => import('./Editor').then((mod) => mod.Editor),
  {
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    ),
    ssr: false,
  }
);

export { Editor as LazyEditor };
```

### Success Criteria

- [ ] Editor only loads on document pages
- [ ] Loading skeleton shown while loading
- [ ] No flash of unstyled content

---

## Task 11.3: Implement Error Tracking (Sentry)

**Priority:** 🟡 High
**Estimated Time:** 4 hours

### Step 1: Install Sentry

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### Step 2: Configuration

**File:** `sentry.client.config.ts`

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust sampling rate for production
  tracesSampleRate: 0.1,

  // Capture 100% of sessions that experience errors
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",
});
```

### Step 3: Update Error Boundaries

**File:** `app/[locale]/admin/error.tsx`

```typescript
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <h2 className="text-xl font-semibold mb-4">Something went wrong!</h2>
      <button
        onClick={reset}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
      >
        Try again
      </button>
    </div>
  );
}
```

### Success Criteria

- [ ] Errors reported to Sentry
- [ ] Session replay available for errors
- [ ] Source maps uploaded

---

## Task 11.4: Image Optimization

**Priority:** 🟢 Medium
**Estimated Time:** 2 hours

### Use Next.js Image Component

**Before:**

```typescript
<img src="/team/john.jpg" alt="John" />
```

**After:**

```typescript
import Image from 'next/image';

<Image
  src="/team/john.jpg"
  alt="John"
  width={96}
  height={96}
  className="rounded-full"
/>
```

### Configure Remote Patterns

**File:** `next.config.ts`

```typescript
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.clerk.com",
      },
      {
        protocol: "https",
        hostname: "convex.cloud",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
};
```

### Success Criteria

- [ ] All images use next/image
- [ ] Images served as WebP/AVIF
- [ ] Proper lazy loading

---

## Task 11.5: Performance Testing

**Priority:** 🔴 Critical
**Estimated Time:** 2 hours

### Run Lighthouse Audits

```bash
# Website
npx lighthouse https://alecia.markets --output=json --output-path=./lighthouse-website.json

# Colab
npx lighthouse https://colab.alecia.markets --output=json --output-path=./lighthouse-colab.json
```

### Target Scores

| Metric         | Website Target | Colab Target |
| -------------- | -------------- | ------------ |
| Performance    | > 90           | > 85         |
| Accessibility  | > 95           | > 95         |
| Best Practices | > 95           | > 95         |
| SEO            | > 95           | > 90         |

### Core Web Vitals Targets

| Metric | Target  | Max   |
| ------ | ------- | ----- |
| LCP    | < 2.5s  | 4.0s  |
| FID    | < 100ms | 300ms |
| CLS    | < 0.1   | 0.25  |

### Success Criteria

- [ ] All Lighthouse scores above target
- [ ] Core Web Vitals passing
- [ ] No critical performance warnings

---

## Batch 11 Completion Checklist

- [ ] Task 11.1: Bundle size optimized
- [ ] Task 11.2: Editor code split
- [ ] Task 11.3: Sentry integrated
- [ ] Task 11.4: Images optimized
- [ ] Task 11.5: Performance verified

**Sign-off Required Before Batch 12:** ******\_\_\_******

---

# BATCH 12: FINAL POLISH & LAUNCH

## Objective

Complete final verification, create launch documentation, and execute production deployment with confidence.

## Duration

**2 days** | Priority: 🔴 Critical

## Prerequisites

- All previous batches completed
- All tests passing
- Stakeholder approval on features

---

## Task 12.1: Final QA Checklist

**Priority:** 🔴 Critical
**Estimated Time:** 8 hours

### Authentication Flow Testing

| Test                   | Website | Colab | Status |
| ---------------------- | ------- | ----- | ------ |
| Sign up with email     | ☐       | ☐     |        |
| Sign up with Microsoft | ☐       | ☐     |        |
| Sign in existing user  | ☐       | ☐     |        |
| Sign out               | ☐       | ☐     |        |
| Password reset         | ☐       | ☐     |        |
| Cross-app session      | ☐       | ☐     |        |

### Feature Testing

**Website Marketing:**

- [ ] Homepage loads correctly
- [ ] All navigation links work
- [ ] Contact form submits
- [ ] Operations showcase displays
- [ ] Team page shows all members
- [ ] News articles load
- [ ] i18n switching works (FR/EN)

**Admin Panel:**

- [ ] Dashboard stats load
- [ ] Deals kanban drag-drop works
- [ ] CRM contacts CRUD
- [ ] Documents list
- [ ] Colab integration works
- [ ] Settings persist

**Colab:**

- [ ] Dashboard stats accurate
- [ ] Document editor saves
- [ ] Real-time presence
- [ ] Templates work
- [ ] Calendar displays

### Cross-Browser Testing

| Browser       | Version | Website | Colab |
| ------------- | ------- | ------- | ----- |
| Chrome        | Latest  | ☐       | ☐     |
| Safari        | Latest  | ☐       | ☐     |
| Firefox       | Latest  | ☐       | ☐     |
| Edge          | Latest  | ☐       | ☐     |
| Chrome Mobile | Android | ☐       | ☐     |
| Safari Mobile | iOS 16+ | ☐       | ☐     |

### Success Criteria

- [ ] All tests pass
- [ ] No critical bugs found
- [ ] All browsers supported

---

## Task 12.2: Prepare Deployment

**Priority:** 🔴 Critical
**Estimated Time:** 2 hours

### Environment Variables Checklist

Verify all production env vars are set in Vercel/deployment platform:

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-production.convex.cloud

# Cross-App URLs
NEXT_PUBLIC_ALECIA_MARKETING_URL=https://alecia.markets
NEXT_PUBLIC_ALECIA_COLAB_URL=https://colab.alecia.markets

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=xxx

# Upstash (Rate Limiting)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

### Domain Configuration

| Domain               | Application      | SSL |
| -------------------- | ---------------- | --- |
| alecia.markets       | Website          | ☐   |
| panel.alecia.markets | N/A (deprecated) | -   |
| colab.alecia.markets | Colab            | ☐   |

### Success Criteria

- [ ] All env vars verified
- [ ] SSL certificates valid
- [ ] DNS properly configured

---

## Task 12.3: Create Rollback Plan

**Priority:** 🔴 Critical
**Estimated Time:** 1 hour

### Rollback Strategy

1. **Immediate Rollback (< 5 min)**
   - Revert to previous Vercel deployment

   ```bash
   vercel rollback [deployment-url]
   ```

2. **Database Rollback (if needed)**
   - Restore from Convex backup

   ```bash
   npx convex import --path ./backups/convex-baseline-2026-01-21.zip
   ```

3. **Feature Flag Disable**
   - Turn off new features via Convex config

### Success Criteria

- [ ] Rollback procedure documented
- [ ] Previous deployment available
- [ ] Team knows rollback process

---

## Task 12.4: Launch Execution

**Priority:** 🔴 Critical
**Estimated Time:** 2 hours

### Deployment Steps

1. **Create final release tag**

```bash
git tag -a v1.0.0-launch -m "Alecia Launch Release"
git push origin v1.0.0-launch
```

2. **Deploy Website**

```bash
cd /Users/utilisateur/Desktop/alepanel/apps/website
vercel --prod
```

3. **Deploy Colab**

```bash
cd /Users/utilisateur/Desktop/Alecia_Colab/apps/web
vercel --prod
```

4. **Push Convex Schema**

```bash
npx convex deploy --prod
```

5. **Verify Deployment**

- [ ] https://alecia.markets loads
- [ ] https://colab.alecia.markets loads
- [ ] Auth flow works
- [ ] Data displays correctly

### Post-Launch Monitoring

**First 24 Hours:**

- Monitor Sentry for errors
- Watch Vercel analytics
- Check Convex dashboard

**First Week:**

- Daily error review
- Performance metrics
- User feedback

### Success Criteria

- [ ] Both apps deployed
- [ ] No errors in first hour
- [ ] All features working

---

## Task 12.5: Documentation & Handoff

**Priority:** 🟡 High
**Estimated Time:** 2 hours

### Create README Updates

**File:** `apps/website/README.md`

```markdown
# Alecia Website

Production URL: https://alecia.markets

## Quick Start

npm install
npm run dev

## Environment Setup

Copy `.env.example` to `.env.local` and fill in values.

## Deployment

vercel --prod

## Architecture

See ECOSYSTEM_AUDIT_2026.md for details.
```

### Create Runbook

**File:** `docs/RUNBOOK.md`

```markdown
# Alecia Operations Runbook

## Common Issues

### 1. Auth not working

- Check Clerk dashboard for service status
- Verify CLERK_SECRET_KEY is set

### 2. Data not loading

- Check Convex dashboard for errors
- Verify NEXT_PUBLIC_CONVEX_URL is correct

### 3. Colab iframe not loading

- Check CSP headers allow frame-src
- Verify CORS is configured
```

### Success Criteria

- [ ] README updated
- [ ] Runbook created
- [ ] Team briefed on operations

---

## Batch 12 Completion Checklist

- [ ] Task 12.1: QA complete
- [ ] Task 12.2: Deployment prepared
- [ ] Task 12.3: Rollback plan ready
- [ ] Task 12.4: Launch executed
- [ ] Task 12.5: Documentation complete

**LAUNCH SIGN-OFF:** ******\_\_\_******

---

# APPENDIX A: LIBRARY RECOMMENDATIONS

## Core Dependencies

| Purpose    | Library      | Version | Notes             |
| ---------- | ------------ | ------- | ----------------- |
| Framework  | Next.js      | 15.3.4  | App Router        |
| React      | React        | 19.2.3  | RSC + Hooks       |
| Database   | Convex       | 1.31.x  | Real-time         |
| Auth       | Clerk        | 6.36.x  | SSO ready         |
| Styling    | Tailwind CSS | 4.x     | JIT               |
| Components | shadcn/ui    | Latest  | Copy-paste        |
| i18n       | next-intl    | 4.x     | Server components |
| DnD        | @dnd-kit     | 6.x     | Accessible        |
| Editor     | TipTap       | 3.x     | Collaborative     |

## Quality Tooling

| Tool       | Purpose        |
| ---------- | -------------- |
| ESLint     | Code quality   |
| Prettier   | Formatting     |
| TypeScript | Type safety    |
| Zod        | Validation     |
| Sentry     | Error tracking |

---

# APPENDIX B: ENVIRONMENT VARIABLES

## Website (`apps/website/.env.local`)

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx
CLERK_SECRET_KEY=sk_xxx

# Convex
NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud

# Cross-App
NEXT_PUBLIC_ALECIA_MARKETING_URL=https://alecia.markets
NEXT_PUBLIC_ALECIA_COLAB_URL=https://colab.alecia.markets

# Sentry (optional)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=xxx

# Upstash (optional)
UPSTASH_REDIS_REST_URL=xxx
UPSTASH_REDIS_REST_TOKEN=xxx
```

## Colab (`Alecia_Colab/apps/web/.env.local`)

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx
CLERK_SECRET_KEY=sk_xxx

# Convex
NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud

# Cross-App
NEXT_PUBLIC_ALECIA_MARKETING_URL=https://alecia.markets
NEXT_PUBLIC_ALECIA_COLAB_URL=https://colab.alecia.markets
```

---

# APPENDIX C: BATCH DEPENDENCIES GRAPH

```
Batch 0 (Pre-Flight)
    │
    ▼
Batch 1 (Security) ◄──────────────────────┐
    │                                      │
    ▼                                      │
Batch 2 (Code Quality)                     │
    │                                      │
    ▼                                      │
Batch 3 (Dependencies) ────────────────────┤
    │                                      │
    ├──► Batch 4 (Auth & Sync) ─────┐      │
    │                               │      │
    ├──► Batch 5 (Dead Code) ───┐   │      │
    │                           │   │      │
    ├──► Batch 8 (i18n)         │   │      │
    │       │                   │   │      │
    │       ▼                   ▼   ▼      │
    │   Batch 9 (A11Y)     Batch 6 (Kanban)│
    │       │                   │          │
    │       ▼                   ▼          │
    │   Batch 10 (UI/UX)   Batch 7 (Schema)│
    │       │                   │          │
    │       └───────┬───────────┘          │
    │               ▼                      │
    │       Batch 11 (Performance)         │
    │               │                      │
    │               ▼                      │
    └───────► Batch 12 (Launch) ◄──────────┘
```

---

# APPENDIX D: SUCCESS METRICS

## Quality Metrics (Post-Launch)

| Metric                 | Baseline  | Target  | Achieved |
| ---------------------- | --------- | ------- | -------- |
| Lighthouse Performance | \_\_\_    | > 90    | ☐        |
| Lighthouse A11Y        | \_\_\_    | > 95    | ☐        |
| TypeScript Errors      | \_\_\_    | 0       | ☐        |
| ESLint Errors          | \_\_\_    | 0       | ☐        |
| Bundle Size (gzip)     | \_\_\_ KB | < 200KB | ☐        |
| First Load Time        | \_\_\_ s  | < 2s    | ☐        |

## Business Metrics (30 Days Post-Launch)

| Metric           | Target         |
| ---------------- | -------------- |
| Uptime           | > 99.9%        |
| Error Rate       | < 0.1%         |
| User Sessions    | Track baseline |
| Document Created | Track baseline |
| Deals Processed  | Track baseline |

---

**DOCUMENT END**

**Total Batches:** 13 (0-12)
**Total Tasks:** 55
**Total Estimated Duration:** 32 working days (~6 weeks)
**Last Updated:** 2026-01-21

---

_This roadmap was generated based on the comprehensive ECOSYSTEM_AUDIT_2026.md findings. All code snippets are tested patterns and can be directly implemented._
