# Alecia Panel Website - Comprehensive Audit Report

**Date:** 2026-01-29  
**Version:** 2.0  
**Auditor:** Gemini Advanced (Antigravity)  
**Scope:** `/apps/website` - Full codebase review

---

## 🔧 FIXES APPLIED (Session 2026-01-29)

The following critical issues were fixed during this audit session:

| ID | Issue | Status | File |
|----|-------|--------|------|
| **3RD-001** | Contact form used mock - never sent | ✅ FIXED | `contact-form.tsx` |
| **SEC-001** | Build ignores TS/ESLint errors | ✅ FIXED | `next.config.ts` |
| **SUP-001** | Build script silent failure | ✅ FIXED | `package.json` |
| **DEP-001** | No rate limiting on leads API | ✅ FIXED | `api/leads/route.ts` |
| **SEC-004** | HTML injection in email template | ✅ FIXED | `api/leads/route.ts` |
| **SUP-002** | console.error in wizard files | ✅ FIXED | 3 wizard files |
| **ADMIN-001** | Deal creation didn't save | ✅ FIXED | `admin/deals/page.tsx` |

**Total: 7 critical issues resolved.**

---

## 📋 Audit Summary

This document contains a granular analysis of all identified **ideas, issues, improvements, UI/UX points, features, corrections, and security considerations** discovered during the website codebase review.

---

## 🔴 SECURITY

### SEC-001: TypeScript/ESLint Build Bypass
**File:** `next.config.ts` (lines 67-74)  
**Severity:** HIGH  
**Description:** Both TypeScript and ESLint errors are ignored during builds:
```typescript
typescript: { ignoreBuildErrors: true },
eslint: { ignoreDuringBuilds: true },
```
**Risk:** Silent deployment of code with potential runtime errors or security vulnerabilities that would otherwise be caught at build time.  
**Recommendation:** Remove these flags after fixing existing errors. Implement a pre-deployment lint/type check in CI pipeline.

---

### SEC-002: `unsafe-inline` and `unsafe-eval` in CSP
**File:** `next.config.ts` (line 15)  
**Severity:** MEDIUM-HIGH  
**Description:** Content Security Policy includes `'unsafe-inline'` and `'unsafe-eval'` in `script-src`, which weakens XSS protection:
```
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.alecia.markets ...
```
**Risk:** Allows inline scripts and eval(), reducing the effectiveness of CSP against XSS attacks.  
**Recommendation:** Use nonces or hashes for inline scripts. Evaluate if `unsafe-eval` can be removed (often required by some libraries).

---

### SEC-003: Hardcoded Fallback Convex URL
**File:** `src/app/api/leads/route.ts` (line 182)  
**Severity:** MEDIUM  
**Description:** A hardcoded fallback Convex URL is present:
```typescript
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://hip-iguana-601.convex.cloud";
```
**Risk:** If environment variable is missing, production traffic could accidentally route to a wrong/development backend.  
**Recommendation:** Fail explicitly if `NEXT_PUBLIC_CONVEX_URL` is undefined in production.

---

### SEC-004: Lead Email Without Input Sanitization
**File:** `src/app/api/leads/route.ts` (lines 126-133)  
**Severity:** MEDIUM  
**Description:** User-provided `data.message` is directly interpolated into HTML email template without sanitization:
```typescript
<p style="margin: 8px 0 0 0;">${data.message}</p>
```
**Risk:** HTML injection in email content if malicious user submits HTML/JS in message field.  
**Recommendation:** Use `sanitizeHtml()` from `@/lib/sanitize` before inserting into email template.

---

### SEC-005: Rate Limiting Graceful Fallback May Be Too Permissive
**File:** `src/lib/rate-limit.ts` (lines 106-109)  
**Severity:** LOW-MEDIUM  
**Description:** When Redis is not configured or fails, rate limiting returns `null` and allows the request:
```typescript
if (!limiter) {
  return null; // Allow request (development mode)
}
```
**Risk:** In misconfigured production where Redis credentials are missing, no rate limiting is applied.  
**Recommendation:** Add production environment check - fail requests if rate limiting unavailable in production.

---

## 🟠 CODE QUALITY / ARCHITECTURE

### CQ-001: Residual Developer Comments in Production Code
**File:** `src/components/features/contact-form.tsx` (lines 55-70)  
**Severity:** LOW  
**Description:** Multi-line developer comments discussing schema decisions left in production code:
```tsx
{/* Using a simplified schema where firstName and lastName are combined to fullName...
    Actually, I'll stick to the existing form structure...
*/}
```
**Impact:** Code clutter, potential confusion for future maintainers.  
**Recommendation:** Remove developer discussion comments; document schema decisions in `knowledge.md` instead.

---

### CQ-002: Unused CSS Variables Duplication
**File:** `src/app/globals.css` (lines 10-40)  
**Severity:** LOW  
**Description:** CSS variables are defined twice with similar names:
```css
--alecia-midnight: #061a40;
--alecia-blue-midnight: #061a40;  /* Same value */
--alecia-light-blue: #749ac7;
--alecia-blue-light: #749ac7;     /* Same value */
```
**Impact:** Cognitive overhead, potential inconsistency if one is updated but not the other.  
**Recommendation:** Consolidate to single naming convention (`--alecia-blue-*` preferred).

---

### CQ-003: Duplicate Shadow Utilities in CSS
**File:** `src/app/globals.css` (lines 439-485)  
**Severity:** LOW  
**Description:** Shadow utilities are defined twice - first as `.shadow-navy-md` utility and again in `@theme inline`. 
**Impact:** CSS bloat, potential maintenance burden.  
**Recommendation:** Consolidate shadow definitions to a single location.

---

### CQ-004: Magic Strings for Type Labels
**File:** `src/app/api/leads/route.ts` (lines 33-38)  
**Severity:** LOW  
**Description:** Lead type labels are hardcoded as magic strings:
```typescript
const typeLabels: Record<string, string> = {
  valuation: "Estimation de Valorisation",
  sell: "Projet de Cession",
  ...
}
```
**Impact:** Not i18n-ready; inconsistency risk between front-end and back-end label definitions.  
**Recommendation:** Extract to shared constants or translations file.

---

## 🟡 UI/UX IMPROVEMENTS

### UX-001: Hero Video Missing Accessibility Controls
**File:** `src/components/home/HeroVideo.tsx` (lines 15-25)  
**Severity:** MEDIUM  
**Description:** The background video autoplays without user controls:
```tsx
<video autoPlay loop muted playsInline className="...">
```
While muted videos are generally acceptable, there's no way for users to pause/stop the video if it's distracting.  
**Recommendation:** Add an optional pause/play control for users who prefer reduced motion (beyond the CSS `prefers-reduced-motion` which exists).

---

### UX-002: Hardcoded French Text in Components
**File:** `src/components/features/contact-form.tsx` (lines 127, 160, 167)  
**Severity:** MEDIUM  
**Description:** Several strings are hardcoded in French instead of using i18n:
```tsx
<Label...>Téléphone</Label>  // Line 127
Envoi en cours...            // Line 160
En soumettant ce formulaire, vous acceptez... // Line 167
```
**Impact:** Breaks internationalization for English users.  
**Recommendation:** Use `t()` translation function for all user-facing strings.

---

### UX-003: Mobile Navigation Submenu Not Collapsible
**File:** `src/components/layout/Navbar.tsx` (lines 182-195)  
**Severity:** LOW-MEDIUM  
**Description:** The expertise submenu in mobile navigation is always visible when the parent menu is shown, without a toggle to collapse it:
```tsx
{item.hasSubmenu && (
  <div className="pl-8 space-y-1">
    {expertiseSubmenu.map((subItem) => ...)}
  </div>
)}
```
**Impact:** Takes up vertical space; may be overwhelming on mobile.  
**Recommendation:** Add accordion-style toggle for submenu items on mobile.

---

### UX-004: Contact Form Error Messages Not Translated
**File:** `src/components/features/contact-form.tsx`  
**Severity:** LOW-MEDIUM  
**Description:** Form validation errors come from Zod schema and may not be internationalized. The error display uses `errors.firstName.message` directly.  
**Impact:** French users see English errors or vice versa.  
**Recommendation:** Use `zod-i18n-map` or custom error messages via translations.

---

### UX-005: No Loading State for Language Switcher
**File:** `src/components/layout/LanguageSwitcher.tsx` (assumed)  
**Severity:** LOW  
**Description:** Language switching reloads the page without visual feedback.  
**Impact:** User uncertainty during locale change.  
**Recommendation:** Add loading spinner or skeleton state during locale transition.

---

### UX-006: Hero Section Expertise Cards Min-Height Inconsistency
**File:** `src/components/home/HeroVideo.tsx` (line 85)  
**Severity:** LOW  
**Description:** Cards have `min-h-[160px]` which may not accommodate varying content lengths consistently, especially with different locales having different text lengths.  
**Recommendation:** Test with EN/FR content; consider flex-based equal-height approach.

---

---

## 🟢 PERFORMANCE

### PERF-001: KPIBand Missing Suspense Boundary for Convex Query
**File:** `src/components/home/KPIBand.tsx` (line 99)  
**Severity:** LOW-MEDIUM  
**Description:** The `useQuery(api.marketing.getMarketingKPIs, { locale })` call doesn't have a suspense boundary or loading state:
```tsx
const convexKPIs = useQuery(api.marketing.getMarketingKPIs, { locale });
```
**Impact:** While fallback data exists, there's a brief moment where `convexKPIs` is undefined before the query resolves.  
**Recommendation:** Add React Suspense boundary or explicit loading skeleton for smoother UX during initial load.

---

### PERF-002: Pipedrive API Requests Without Pagination Handling
**File:** `src/hooks/use-pipedrive-sync.ts` (lines 209-211)  
**Severity:** MEDIUM  
**Description:** API requests have a hardcoded `limit=100` without pagination for larger datasets:
```typescript
const deals = await pipedriveRequest<PipedriveDeal[]>(
  `/deals?limit=100&sort=update_time DESC${statusParam}`
);
```
**Impact:** Users with >100 deals/contacts will have incomplete data synced.  
**Recommendation:** Implement cursor-based pagination using Pipedrive's `start` parameter.

---

### PERF-003: Animation Variants Without `prefers-reduced-motion` Check
**File:** `src/components/features/OperationsContent.tsx` (lines 16-41)  
**Severity:** LOW  
**Description:** Animation variants are always applied without checking user motion preferences:
```tsx
const cardVariants = {
  hidden: { opacity: 0, scale: 0.85, y: 30 },
  visible: (i: number) => ({ ... transition: { delay: i * 0.06 } })
};
```
While CSS handles `prefers-reduced-motion`, JavaScript animations in Framer Motion bypass this.  
**Recommendation:** Use `useReducedMotion()` hook from Framer Motion to disable delays/effects.

---

### PERF-004: Home Page Has Multiple Sequential Fetch Waterfalls
**File:** `src/app/[locale]/page.tsx` (lines 14-29)  
**Severity:** LOW  
**Description:** Transaction fetching happens synchronously in the server component:
```tsx
const transactionsData = await getTransactions({ limit: 12 }).catch(() => []);
```
This blocks the page render until data is fetched.  
**Recommendation:** Consider streaming with React Suspense or parallel data loading patterns.

---

## 🔵 FEATURE GAPS / IDEAS

### FG-001: WhatsApp Number is Placeholder
**File:** `src/components/layout/MobileFooter.tsx` (line 15)  
**Severity:** MEDIUM  
**Description:** WhatsApp number is a placeholder:
```tsx
const whatsapp = "+33600000000"; // Placeholder or based on user pref
```
**Impact:** WhatsApp button is non-functional in production.  
**Recommendation:** Either provide real number or hide button until configured.

---

### FG-002: Cookie Banner Stores Consent But Doesn't Act On It
**File:** `src/components/layout/CookieBanner.tsx` (lines 23-36)  
**Severity:** MEDIUM-HIGH  
**Description:** Cookie consent is stored in localStorage but there's no evidence the app respects these choices:
```tsx
localStorage.setItem("alecia-cookie-consent", "accepted");
localStorage.setItem("alecia-cookie-consent", "refused");
localStorage.setItem("alecia-cookie-consent", "essential");
```
**Impact:** GDPR compliance issue - if user refuses, analytics should be disabled.  
**Recommendation:** Implement consent-aware analytics loading. Check consent before initializing Vercel Analytics, Sentry, etc.

---

### FG-003: Sitemap Uses Outdated Last Modified Date
**File:** `src/app/sitemap.ts` (line 22)  
**Severity:** LOW  
**Description:** Static pages have hardcoded date from 2024:
```typescript
const LAST_UPDATE = new Date('2024-12-20');
```
**Impact:** Search engines may not re-crawl pages that have been updated since.  
**Recommendation:** Update to current date or use dynamic detection based on git commits.

---

### FG-004: Pipeline Stage Mapping is Hardcoded Without Admin Configuration
**File:** `src/hooks/use-pipedrive-sync.ts` (lines 98-108)  
**Severity:** LOW-MEDIUM  
**Description:** Pipedrive stage-to-Alecia stage mapping is hardcoded:
```typescript
const STAGE_MAP: Record<number, string> = {
  1: "qualification",
  2: "initial_meeting",
  // ...
};
```
**Impact:** Different Pipedrive setups will have different stage IDs.  
**Recommendation:** Make this configurable via environment or admin panel.

---

### FG-005: No Error Boundary for Convex Provider
**File:** `src/components/providers.tsx`  
**Severity:** MEDIUM  
**Description:** The ConvexClientProvider wraps the entire app without an error boundary:
```tsx
<ConvexClientProvider>
  <UserSync />
  <NextThemesProvider>{children}</NextThemesProvider>
</ConvexClientProvider>
```
**Impact:** Convex connection failures could crash the entire app.  
**Recommendation:** Wrap with React ErrorBoundary to provide graceful fallback.

---

## 🟠 ADDITIONAL SECURITY

### SEC-006: Admin Link Visible in Footer Without Authentication Check
**File:** `src/components/layout/Footer.tsx` (lines 191-198)  
**Severity:** LOW  
**Description:** A lock icon linking to `/admin` is visible to all users:
```tsx
<Link href="/admin" aria-label="Accès Panel" className="text-[var(--foreground-muted)]/50...">
  <Lock className="w-3 h-3" />
</Link>
```
**Impact:** While the route is protected, exposing admin paths is security through obscurity.  
**Recommendation:** Only render for authenticated admin users or remove completely.

---

### SEC-007: Validation Error Messages Hardcoded in French
**File:** `src/lib/validations/index.ts`  
**Severity:** LOW  
**Description:** All Zod validation messages are hardcoded French strings:
```typescript
.min(2, { message: "Le prénom doit contenir au moins 2 caractères" })
```
**Impact:** English users see French error messages.  
**Recommendation:** Use i18n for validation messages via `zod-i18n-map` or custom resolver.

---

## 🟡 ADDITIONAL UI/UX

### UX-007: Footer Logo Conditional Render Causes Layout Shift
**File:** `src/components/layout/Footer.tsx` (lines 56-73)  
**Severity:** LOW  
**Description:** Logo only renders after mount to prevent hydration mismatch:
```tsx
{mounted && (
  <>
    <Image src="/assets/alecia_logo_blue.svg" ... className="dark:hidden" />
    <Image src="/assets/alecia_logo.svg" ... className="hidden dark:block" />
  </>
)}
```
**Impact:** Brief flash with no logo on initial load.  
**Recommendation:** Use CSS to handle theme switching rather than conditional render.

---

### UX-008: DealFlipCard Custom Events May Conflict
**File:** `src/components/features/DealFlipCard.tsx` (lines 58-63)  
**Severity:** LOW  
**Description:** Custom events dispatch on `window` without namespacing:
```tsx
const event = new CustomEvent('filterDeals', { detail: { type, value } });
window.dispatchEvent(event);
```
**Impact:** Potential conflicts if other components use same event name.  
**Recommendation:** Namespace events: `alecia:filterDeals` or use React Context.

---

### UX-009: Mobile Footer Overlaps Page Content
**File:** `src/components/layout/MobileFooter.tsx`  
**Severity:** LOW-MEDIUM  
**Description:** Fixed bottom bar with `z-50` but no corresponding bottom padding on page content.  
**Impact:** Bottom of page content may be hidden behind mobile CTA bar.  
**Recommendation:** Add `pb-20 md:pb-0` to main content wrapper or use safe-area-inset.

---

### UX-010: Contact Section Has No Loading State
**File:** `src/components/home/ContactSection.tsx` (implied from page structure)  
**Severity:** LOW  
**Description:** Contact form submission shows loading spinner but form itself has no skeleton state on initial render.  
**Impact:** Minor - form is lightweight enough it's instant.  
**Recommendation:** Consider adding skeleton for consistency with other sections.

---

## ⏸️ BATCH 2 COMPLETE - CONTINUING

---

## 🟣 ADMIN PANEL

### ADMIN-001: New Deal Modal Has No Backend Integration
**File:** `src/app/[locale]/admin/deals/page.tsx` (lines 272-282)  
**Severity:** HIGH  
**Description:** The new deal modal form simulates submission instead of calling Convex:
```tsx
// Simulate submission - in production this would call a Convex mutation
await new Promise(resolve => setTimeout(resolve, 500));
```
**Impact:** Creating new deals doesn't persist to database.  
**Recommendation:** Implement `useMutation(api.deals.createDeal)` call.

---

### ADMIN-002: Settings Sections Are Non-Interactive Placeholders
**File:** `src/app/[locale]/admin/settings/page.tsx` (lines 60-86)  
**Severity:** MEDIUM  
**Description:** Settings cards have `cursor-pointer` but no onClick handlers:
```tsx
className="... cursor-pointer"
// No onClick handler
```
**Impact:** Users can't access profile, security, notifications, or data settings.  
**Recommendation:** Either implement routes for each section or remove misleading cursor style.

---

### ADMIN-003: Clear Cache Button Nukes Cookie Consent
**File:** `src/app/[locale]/admin/settings/page.tsx` (lines 123-130)  
**Severity:** MEDIUM  
**Description:** The "Vider le cache" button clears ALL localStorage:
```tsx
localStorage.clear();
```
**Impact:** Also clears `alecia-cookie-consent`, forcing users to re-accept cookies.  
**Recommendation:** Selectively clear cache keys while preserving consent state.

---

### ADMIN-004: Admin Panel Uses Hardcoded French Without i18n
**File:** `src/app/[locale]/admin/deals/page.tsx` (multiple lines), `admin/settings/page.tsx`  
**Severity:** MEDIUM  
**Description:** Despite being in `[locale]` route, admin pages don't use translations:
```tsx
<h1>Pipeline M&A</h1>
<span>{activeDeals} actif{activeDeals !== 1 ? "s" : ""}</span>
"Aucun deal dans le pipeline"
```
**Impact:** English-locale users see French admin UI.  
**Recommendation:** Use `useTranslations("Admin")` which already exists in `en.json`.

---

### ADMIN-005: Admin Sidebar Has Unused `comingSoon` Property
**File:** `src/components/admin/AdminSidebar.tsx` (line 29)  
**Severity:** LOW  
**Description:** NavLink interface has `comingSoon?: boolean` but it's never used in rendering logic.  
**Impact:** Dead code.  
**Recommendation:** Either implement or remove the property.

---

## 🟤 TESTING

### TEST-001: No Unit or Integration Tests Exist
**File:** Entire codebase  
**Severity:** HIGH  
**Description:** Grep search for `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx` returned 0 results.  
**Impact:** No automated testing coverage for critical M&A workflows, form validations, or API routes.  
**Recommendation:** Implement test suite with Vitest + React Testing Library. Prioritize:
  - Contact form validation
  - Rate limiting behavior
  - Lead submission API
  - Deals pipeline mutations

---

## 🔷 i18n COMPLETENESS

### I18N-001: Admin Panel Entirely Untranslated in Code
**File:** Multiple admin files  
**Severity:** MEDIUM  
**Description:** English translations exist at `Admin.*` keys in `en.json`, but admin components don't use `useTranslations`:
- `deals/page.tsx` - hardcoded French
- `settings/page.tsx` - hardcoded French
- `AdminSidebar.tsx` - hardcoded French/English mix

**Recommendation:** Systematically replace hardcoded strings with `t()` calls.

---

### I18N-002: Static Deals Data is French-Only
**File:** `src/data/deals.ts`  
**Severity:** LOW-MEDIUM  
**Description:** All deal descriptions and mandate types are French:
```typescript
"mandateType": "Levée de fonds",
"description": "Opération de Acquisition dans le secteur Distribution & services B2B."
```
**Impact:** English users see mixed-language content.  
**Recommendation:** Either translate via i18n or store translations in database.

---

### I18N-003: Locale Prefix Strategy May Confuse SEO
**File:** `src/i18n/navigation.ts` (line 7)  
**Severity:** LOW  
**Description:** Using `localePrefix: 'as-needed'` means French URLs have no prefix:
```typescript
localePrefix: 'as-needed'  // /fr/page = /page, /en/page = /en/page
```
**Impact:** Default locale pages may compete with explicit locale pages in SEO.  
**Recommendation:** Consider `localePrefix: 'always'` for clearer URL structure.

---

## 📦 BUILD & DEPENDENCIES

### BUILD-001: Potential Hydration Mismatches from Date Usage
**File:** `src/components/layout/Footer.tsx` (line 12)  
**Severity:** LOW  
**Description:** `new Date().getFullYear()` runs on both server and client:
```tsx
const currentYear = new Date().getFullYear();
```
During SSR near year boundaries, this could theoretically cause hydration mismatch.  
**Recommendation:** Use static year or ensure consistent timezone handling.

---

### DEP-001: Missing Rate Limit in High-Value API Endpoint
**File:** `src/app/api/leads/route.ts`  
**Severity:** MEDIUM-HIGH  
**Description:** The leads API endpoint creates database records and sends emails but doesn't apply rate limiting:
```tsx
export async function POST(request: NextRequest) {
  // No checkRateLimit() call
  const body = await request.json();
  ...
}
```
**Impact:** Susceptible to spam/abuse creating junk leads and burning email quota.  
**Recommendation:** Add `checkRateLimit(getClientIp(request.headers))` at start.

---

### DEP-002: next/link Used Alongside Custom i18n Link
**File:** `src/app/[locale]/admin/settings/page.tsx` (line 6)  
**Severity:** LOW  
**Description:** Admin settings imports `next/link` directly instead of i18n Link:
```tsx
import Link from "next/link";
```
Other admin files correctly use `@/i18n/navigation`.  
**Impact:** Links may not preserve locale context.  
**Recommendation:** Consistently use `import { Link } from "@/i18n/navigation"`.

---

## 📊 DATA LAYER

### DATA-001: Static Deals Fallback Contains Hardcoded Business Data
**File:** `src/data/deals.ts` (603 lines)  
**Severity:** LOW  
**Description:** 45 deals with real company names, logos, and transaction details are stored in codebase instead of database.  
**Impact:** Updating deals requires code deployment; data not admin-editable.  
**Recommendation:** Migrate to Convex `transactions` table (appears partially done already).

---

### DATA-002: Unused `id` and `slug` Fields in Deals
**File:** `src/data/deals.ts`  
**Severity:** LOW  
**Description:** Each deal has unique `id` and `slug` but individual deal pages don't appear to be implemented (no `/operations/[slug]` route).  
**Impact:** Dead navigation if DealFlipCard ever links to detail page.  
**Recommendation:** Either implement detail pages or remove unused fields.

---

## ⏸️ BATCH 3 COMPLETE - FINAL BATCH

---

## ♿ ACCESSIBILITY

### A11Y-001: Interactive Map Pins Lack Keyboard Navigation
**File:** `src/components/features/InteractiveMap.tsx` (lines 122-161)  
**Severity:** MEDIUM  
**Description:** Map pins are buttons but lack proper keyboard focus management:
```tsx
<motion.button
  onMouseEnter={() => setActiveOffice(office.id)}
  onMouseLeave={() => setActiveOffice(null)}
  // No onFocus/onBlur handlers for keyboard users
>
```
**Impact:** Keyboard users can't see tooltip content when focused.  
**Recommendation:** Add `onFocus` and `onBlur` handlers mirroring mouse behavior.

---

### A11Y-002: Form Inputs Missing `aria-describedby` for Help Text
**File:** `src/components/features/wizards/ValuationWizard.tsx` (lines 213-232)  
**Severity:** LOW-MEDIUM  
**Description:** Inputs have help text but no programmatic association:
```tsx
<Input id="revenue" ... />
<p className="text-xs ...">{t("revenueHelp")}</p>  // Not linked
```
**Impact:** Screen readers don't announce help text.  
**Recommendation:** Add `aria-describedby="revenue-help"` and `id="revenue-help"` to help text.

---

### A11Y-003: Error Boundary Uses French aria-label
**File:** `src/app/[locale]/admin/error.tsx` (line 5)  
**Severity:** LOW  
**Description:** Uses `next/link` directly and has hardcoded French text:
```tsx
import Link from "next/link";
// ...
<h2>Une erreur est survenue</h2>
```
**Impact:** English users get French error messages; locale not preserved in links.  
**Recommendation:** Use i18n Link and translations.

---

### A11Y-004: Interactive Elements Without Visible Focus States (Partial)  
**File:** Various custom buttons in admin  
**Severity:** LOW  
**Description:** While the Button component has good focus states, many custom buttons in admin pages use inline styles without `focus-visible`:
```tsx
<button className="flex items-center gap-2 px-4 py-2 bg-[var(--alecia-midnight)] text-white ...">
  // No focus-visible ring
```
**Recommendation:** Apply consistent `focus-visible:ring` classes to all interactive elements.

---

## 🔧 EDGE CASES & ERROR HANDLING

### EDGE-001: Valuation Wizard "Not Profitable" Breaks Calculation
**File:** `src/components/features/wizards/ValuationWizard.tsx` (lines 262-276)  
**Severity:** MEDIUM  
**Description:** When "not profitable" is checked, `formData.ebe` is set to string "not-profitable":
```tsx
setFormData({...formData, ebe: "not-profitable"});
```
But calculation uses `parseFloat(formData.ebe)` which returns `NaN`:
```tsx
const ebe = parseFloat(formData.ebe) * 1000; // NaN * 1000 = NaN
```
**Impact:** Valuation shows `NaN m€ - NaN m€` for unprofitable companies.  
**Recommendation:** Handle this case gracefully - show different messaging or use revenue-based multiple.

---

### EDGE-002: Kanban Stage Fallback May Orphan Deals
**File:** `src/components/admin/deals/DealKanban.tsx` (lines 140-146)  
**Severity:** LOW  
**Description:** Unknown stages default to "qualification":
```tsx
if (grouped[stage]) {
  grouped[stage].push(deal);
} else {
  grouped["qualification"].push(deal);
}
```
**Impact:** If a deal has a stage not in `DEAL_STAGES` constant, it silently moves to qualification.  
**Recommendation:** Log a warning when this fallback is triggered.

---

### EDGE-003: Console.log Left in Production Code
**File:** `src/components/features/wizards/ValuationWizard.tsx` (line 136)  
**Severity:** LOW  
**Description:** Development `console.error` statement:
```tsx
console.error("Lead submission error:", error);
```
**Impact:** Reveals error details in browser console.  
**Recommendation:** Use `logger.error()` from `@/lib/logger` instead.

---

### EDGE-004: Email Validation Only on Frontend
**File:** `src/app/api/leads/route.ts` (lines 153-158)  
**Severity:** LOW-MEDIUM  
**Description:** The leads API validates presence of email but not format:
```tsx
if (!body.email || !body.type) {
  return NextResponse.json({ error: "Email et type de lead requis" }, { status: 400 });
}
```
**Impact:** Malformed emails can be stored in database.  
**Recommendation:** Add Zod validation on backend matching frontend schema.

---

## 🧩 COMPONENT-SPECIFIC ISSUES

### COMP-001: DealKanban Has Hardcoded French Stage Labels
**File:** `src/components/admin/deals/DealKanban.tsx` (lines 44-53)  
**Severity:** MEDIUM  
**Description:** All Kanban stage labels are French:
```tsx
{ id: "initial_meeting", label: "Premier RDV", ... },
{ id: "analysis", label: "Analyse", ... },
{ id: "negotiation", label: "Négociation", ... },
```
**Impact:** Can't switch to English for international users.  
**Recommendation:** Extract to i18n keys like `Admin.deals.stages.*`.

---

### COMP-002: Sector Multiples Are Hardcoded Business Logic
**File:** `src/components/features/wizards/ValuationWizard.tsx` (lines 30-43)  
**Severity:** LOW  
**Description:** Valuation multiples are hardcoded in frontend code:
```tsx
"Technologies & logiciels": { low: 6, mid: 8, high: 12 },
"Distribution & services B2B": { low: 4, mid: 5.5, high: 7 },
```
**Impact:** Updating multiples requires code deployment.  
**Recommendation:** Move to Convex config table or environment variables.

---

### COMP-003: Button Component Exports Named Export Only  
**File:** `src/components/ui/button.tsx`  
**Severity:** INFO  
**Description:** Good practice - Button uses named exports with proper defaults and accessibility features including `aria-invalid` styling.  
**Status:** ✅ Well-implemented

---

## 📋 FINAL SUMMARY & RECOMMENDATIONS

### Critical Priority Matrix

| Priority | ID | Issue | Effort |
|----------|----------|-----------------------------------------------|---------|
| 🔴 P0 | SEC-001 | Build ignores TS/ESLint errors | Low |
| 🔴 P0 | ADMIN-001 | Deal creation doesn't save | Medium |
| 🔴 P0 | TEST-001 | Zero test coverage | High |
| 🔴 P0 | DEP-001 | No rate limiting on leads API | Low |
| 🟠 P1 | FG-002 | Cookie consent not enforced | Medium |
| 🟠 P1 | SEC-004 | HTML injection in email | Low |
| 🟠 P1 | EDGE-001 | "Not profitable" breaks wizard | Low |
| 🟠 P1 | I18N-001 | Admin panel untranslated | Medium |
| 🟡 P2 | PERF-002 | Pipedrive pagination missing | Medium |
| 🟡 P2 | FG-001 | WhatsApp number placeholder | Low |
| 🟡 P2 | SEC-002 | CSP allows unsafe-inline | High |
| 🟡 P2 | ADMIN-002 | Settings are non-functional | Medium |

### Quick Wins (< 1 hour each)

1. **SEC-001**: Remove `ignoreBuildErrors` flags from `next.config.ts`
2. **DEP-001**: Add rate limiting to leads API (copy pattern from other routes)
3. **SEC-004**: Wrap `data.message` in `sanitizeHtml()` before email template
4. **FG-001**: Hide WhatsApp button or add real number
5. **EDGE-003**: Replace `console.error` with logger
6. **DEP-002**: Change `next/link` to `@/i18n/navigation` in error.tsx

### Medium Effort (2-4 hours)

1. **ADMIN-001**: Implement actual Convex mutation for deal creation
2. **FG-002**: Add consent-aware analytics loading
3. **EDGE-001**: Handle "not profitable" case in valuation wizard
4. **I18N-001**: Wire up existing English translations in admin

### High Effort (> 4 hours)

1. **TEST-001**: Implement test suite with Vitest
2. **SEC-002**: Remove `unsafe-inline` from CSP (requires nonce strategy)
3. **ADMIN-002**: Build out settings pages

---

## 📊 AUDIT STATISTICS

| Category | Count |
|----------|-------|
| 🔴 Security | 7 |
| 🟠 Code Quality | 4 |
| 🟡 UI/UX | 10 |
| 🟢 Performance | 4 |
| 🔵 Feature Gaps | 5 |
| 🟣 Admin Panel | 5 |
| 🟤 Testing | 1 |
| 🔷 i18n | 3 |
| 📦 Build/Dependencies | 3 |
| 📊 Data Layer | 2 |
| ♿ Accessibility | 4 |
| 🔧 Edge Cases | 4 |
| 🧩 Components | 3 |
| **TOTAL** | **55** |

---

## ✅ AUDIT COMPLETE

**Date Completed:** 2026-01-29  
**Total Issues Documented:** 55  
**Critical/High Issues:** 7  
**Recommended Immediate Actions:** 6 quick wins listed above

### Files Most Needing Attention:
1. `next.config.ts` - Security flags
2. `src/app/api/leads/route.ts` - Rate limiting + sanitization
3. `src/app/[locale]/admin/deals/page.tsx` - Backend integration
4. `src/components/features/wizards/ValuationWizard.tsx` - Edge case handling
5. `src/components/layout/CookieBanner.tsx` - GDPR enforcement

---

*This audit is based on code analysis only, not runtime testing. Some issues may be less severe in practice.*

---

## 🔍 SUPPLEMENTARY FINDINGS (Second Pass)

### SUP-001: Build Script Has Silent Failure Mode
**File:** `package.json` (line 7)  
**Severity:** MEDIUM-HIGH  
**Description:** The build script suppresses failures:
```json
"build": "next build || echo 'Build completed with warnings'"
```
**Impact:** CI/CD can pass with broken builds. Combined with `ignoreBuildErrors: true` in next.config.ts, this is a dangerous pattern.  
**Recommendation:** Remove `|| echo ...` and use `"build:strict"` as default.

---

### SUP-002: Multiple Console.log/error in Production Code
**File:** Multiple wizard files  
**Severity:** LOW  
**Description:** Found 3 instances of `console.error` in production code:
- `SellWizard.tsx:169`
- `ValuationWizard.tsx:136` 
- `BuyWizard.tsx:174`
All say `console.error("Lead submission error:", error);`  
**Impact:** Error details exposed in browser console.  
**Recommendation:** Replace with `logger.error()` from `@/lib/logger`.

---

### SUP-003: Middleware Marks ALL API Routes as Public
**File:** `src/middleware.ts` (line 35)  
**Severity:** LOW-MEDIUM  
**Description:** All API routes bypass Clerk auth:
```typescript
const isPublicRoute = createRouteMatcher([
  ...
  "/api(.*)",  // ALL API routes are public
]);
```
**Impact:** While individual API routes may check auth internally, this removes the middleware protection layer.  
**Recommendation:** Only allow specific public API routes like `/api/health`, `/api/leads`.

---

### SUP-004: Deal Detail Page Exists but Uses Static Data
**File:** `src/app/[locale]/operations/[slug]/page.tsx`  
**Severity:** INFO (Corrects DATA-002)  
**Description:** The deal detail pages DO exist at `/operations/[slug]`. Previous finding DATA-002 was incorrect.  
**Status:** ✅ Implemented - uses `src/data/deals.ts` static data.

---

### SUP-005: Rate Limit Returns Null in Development
**File:** `src/lib/rate-limit.ts` (lines 106-109)  
**Severity:** LOW  
**Description:** Rate limiting fails open when Redis is not configured:
```typescript
if (!limiter) {
  return null;  // Allow request
}
```
**Impact:** Development/testing environment has no rate limiting even if code expects it.  
**Recommendation:** Add explicit logging when rate limiting is disabled.

---

### SUP-006: Outdated React Types Version
**File:** `package.json` (lines 76-77)  
**Severity:** LOW  
**Description:** Using loose version constraints for types:
```json
"@types/react": "^19",
"@types/react-dom": "^19"
```
React 19 is in use (19.2.3) but types may drift.  
**Recommendation:** Pin to exact versions or use `~19`.

---

### SUP-007: Sentry is Installed But Not Configured
**File:** `package.json` (line 37), multiple comments reference it  
**Severity:** MEDIUM  
**Description:** `@sentry/nextjs` is in dependencies but error boundary says:
```tsx
// Note: Sentry integration planned for Batch 11
```
**Impact:** Paying for Sentry without using it; errors not captured.  
**Recommendation:** Either configure Sentry or remove the dependency.

---

### SUP-008: Convex Schema Has Legacy Stage Values
**File:** `convex/schema.ts` (lines 120-127)  
**Severity:** LOW  
**Description:** Deals schema has duplicate/legacy stage values:
```typescript
v.literal("due_diligence"),
// ...
v.literal("Due Diligence"),  // Legacy duplicate
v.literal("Closing"),        // Legacy duplicate
```
**Impact:** Database can have inconsistent stage values.  
**Recommendation:** Migrate data and remove legacy literals.

---

### SUP-009: Convex Schema Uses `v.any()` in Multiple Places
**File:** `convex/schema.ts` (multiple lines)  
**Severity:** LOW  
**Description:** Several tables use untyped `v.any()`:
- `notifications.payload` (line 272)
- `project_events.metadata` (line 311)
- `colab_presentations.slides[].content` (line 664)
- `colab_card_activities.details` (line 748)

**Impact:** No type safety for these fields; can store anything.  
**Recommendation:** Define proper types or use `v.record()` with known keys.

---

### SUP-010: Analytics Loaded Without Consent Check
**File:** `src/app/[locale]/layout.tsx` (line 18)  
**Severity:** MEDIUM (Supplements FG-002)  
**Description:** Vercel Analytics imported unconditionally:
```tsx
import { Analytics } from "@vercel/analytics/next";
```
It's rendered regardless of cookie consent status.  
**Impact:** GDPR violation - analytics track users who refused consent.  
**Recommendation:** Conditionally load Analytics based on `localStorage.getItem("alecia-cookie-consent")`.

---

## 📊 REVISED STATISTICS

| Category | Original | Supplementary | Total |
|----------|----------|---------------|-------|
| 🔴 Security | 7 | 1 | 8 |
| 🟠 Code Quality | 4 | 3 | 7 |
| 🟡 UI/UX | 10 | 0 | 10 |
| 🟢 Performance | 4 | 0 | 4 |
| 🔵 Feature Gaps | 5 | 2 | 7 |
| 🟣 Admin Panel | 5 | 0 | 5 |
| 🟤 Testing | 1 | 0 | 1 |
| 🔷 i18n | 3 | 0 | 3 |
| 📦 Build/Dependencies | 3 | 3 | 6 |
| 📊 Data Layer | 2 | 1 | 3 |
| ♿ Accessibility | 4 | 0 | 4 |
| 🔧 Edge Cases | 4 | 0 | 4 |
| 🧩 Components | 3 | 0 | 3 |
| **TOTAL** | **55** | **10** | **65** |

---

## ✅ FINAL AUDIT COMPLETE

**Date Completed:** 2026-01-29  
**Total Issues Documented:** 65  
**Critical/High Issues:** 8  

### Additional Quick Wins Identified:
7. **SUP-001**: Remove `|| echo ...` from build script
8. **SUP-002**: Replace 3 `console.error` with logger
9. **SUP-007**: Either configure Sentry or remove it

### Updated Priority Matrix (Top 15)

| Rank | ID | Issue | Severity |
|------|--------|----------------------------------------|----------|
| 1 | SEC-001 | Build ignores TS/ESLint errors | 🔴 P0 |
| 2 | SUP-001 | Build script has silent failure mode | 🔴 P0 |
| 3 | ADMIN-001 | Deal creation doesn't save | 🔴 P0 |
| 4 | TEST-001 | Zero test coverage | 🔴 P0 |
| 5 | DEP-001 | No rate limiting on leads API | 🔴 P0 |
| 6 | FG-002 + SUP-010 | Cookie consent not enforced | 🟠 P1 |
| 7 | SEC-004 | HTML injection in email | 🟠 P1 |
| 8 | EDGE-001 | "Not profitable" breaks wizard | 🟠 P1 |
| 9 | SUP-007 | Sentry installed but not configured | 🟠 P1 |
| 10 | I18N-001 | Admin panel untranslated | 🟠 P1 |
| 11 | SUP-003 | All API routes marked public in middleware | 🟡 P2 |
| 12 | PERF-002 | Pipedrive pagination missing | 🟡 P2 |
| 13 | SEC-002 | CSP allows unsafe-inline | 🟡 P2 |
| 14 | SUP-008 | Convex schema has legacy stages | 🟡 P2 |
| 15 | ADMIN-002 | Settings are non-functional | 🟡 P2 |

---

*Audit complete. 65 issues documented across 13 categories.*

---

## 🔬 THIRD PASS FINDINGS

### 3RD-001: Contact Form Uses Mock Submission (Never Sends Emails)
**File:** `src/components/features/contact-form.tsx` (line 36)  
**Severity:** HIGH  
**Description:** The main contact form calls `submitMockForm()` instead of actual API:
```tsx
await submitMockForm(data);
```
And `mock-submit.ts` just does:
```tsx
await new Promise((resolve) => setTimeout(resolve, 1000));
return { success: true, message: "Demande envoyée avec succès" };
```
**Impact:** **Contact form submissions are lost** - users think they sent a message but nothing happens.  
**Recommendation:** Replace with actual `/api/leads` call like the wizards use.

---

### 3RD-002: Multiple `catch (error: any)` Type Unsafe
**File:** Multiple files  
**Severity:** LOW  
**Description:** 4 instances of `catch (error: any)` instead of proper error typing:
- `ValuationWizard.tsx:135`
- `SellWizard.tsx:168`
- `BuyWizard.tsx:173`
- `leads/route.ts:240`

**Impact:** Type safety bypassed, error handling may miss edge cases.  
**Recommendation:** Use `catch (error: unknown)` and instanceof checks.

---

### 3RD-003: ESLint Disabled for OAuth Links
**File:** `src/app/[locale]/admin/settings/integrations/page.tsx` (lines 332, 465)  
**Severity:** LOW  
**Description:** ESLint rule disabled for plain `<a>` tags:
```tsx
{/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
<a href="/sign-in?redirect_url=...">
```
**Impact:** OAuth redirect requires plain `<a>`, but bypasses Next.js Link optimization.  
**Recommendation:** Acceptable workaround - document why in codebase.

---

### 3RD-004: Some External Links Missing `rel="noreferrer"`
**File:** Various components  
**Severity:** LOW  
**Description:** Most external links correctly use `rel="noopener noreferrer"` but one uses only `rel="noopener"`:
- `TeamMemberModal.tsx:46` - LinkedIn link
  
**Impact:** Minor - `noreferrer` prevents referer header leakage.  
**Recommendation:** Add `noreferrer` for consistency.

---

### 3RD-005: No Autocomplete Attributes on Form Inputs
**File:** `src/components/features/contact-form.tsx`, all wizard forms  
**Severity:** LOW  
**Description:** Form inputs don't have `autocomplete` attributes:
```tsx
<Input id="email" ... />  // No autocomplete="email"
<Input id="firstName" ... />  // No autocomplete="given-name"
```
**Impact:** Browser can't optimize form filling; slightly worse UX and accessibility.  
**Recommendation:** Add appropriate autocomplete values per HTML spec.

---

### 3RD-006: External Links in Admin Colab Page Without Context
**File:** `src/app/[locale]/admin/colab/page.tsx` (lines 58, 105)  
**Severity:** INFO  
**Description:** Links to `alecia-colab.vercel.app` open in new tab.  
**Status:** ✅ Correctly uses `target="_blank"` with `rel="noopener noreferrer"`.

---

### 3RD-007: Good ARIA Implementation in Navbar
**File:** `src/components/layout/Navbar.tsx`  
**Severity:** INFO (Positive)  
**Description:** Navbar has excellent accessibility:
- `role="banner"`, `role="menubar"`, `role="menuitem"`
- `aria-haspopup`, `aria-expanded`, `aria-current`
- `aria-label` on buttons
**Status:** ✅ Well-implemented

---

### 3RD-008: Sanitization Library Properly Configured
**File:** `src/lib/sanitize.ts`  
**Severity:** INFO (Positive)  
**Description:** The sanitization library:
- Uses DOMPurify correctly
- Adds `target="_blank" rel="noopener noreferrer"` to external links
- Strips dangerous HTML from blog content
**Status:** ✅ Well-implemented (but not used in email template - see SEC-004)

---

## 📊 FINAL REVISED STATISTICS

| Category | Pass 1 | Pass 2 | Pass 3 | Total |
|----------|--------|--------|--------|-------|
| 🔴 Security | 7 | 1 | 0 | 8 |
| 🟠 Code Quality | 4 | 3 | 2 | 9 |
| 🟡 UI/UX | 10 | 0 | 1 | 11 |
| 🟢 Performance | 4 | 0 | 0 | 4 |
| 🔵 Feature Gaps | 5 | 2 | 1 | 8 |
| 🟣 Admin Panel | 5 | 0 | 0 | 5 |
| 🟤 Testing | 1 | 0 | 0 | 1 |
| 🔷 i18n | 3 | 0 | 0 | 3 |
| 📦 Build/Dependencies | 3 | 3 | 1 | 7 |
| 📊 Data Layer | 2 | 1 | 0 | 3 |
| ♿ Accessibility | 4 | 0 | 1 | 5 |
| 🔧 Edge Cases | 4 | 0 | 0 | 4 |
| 🧩 Components | 3 | 0 | 0 | 3 |
| **TOTAL ISSUES** | **55** | **10** | **6** | **71** |
| **POSITIVE NOTES** | - | - | 3 | **3** |

---

## ✅ COMPREHENSIVE AUDIT COMPLETE

**Date Completed:** 2026-01-29  
**Total Issues Documented:** 71  
**Positive Findings:** 3  
**Critical/High Issues:** 9 (was 8, now includes contact form)

### 🚨 UPDATED CRITICAL ISSUES (P0)

| Rank | ID | Issue | Impact |
|------|--------|----------------------------------------|---------|
| 1 | **3RD-001** | Contact form uses mock - submissions lost | **CRITICAL** |
| 2 | SEC-001 | Build ignores TS/ESLint errors | HIGH |
| 3 | SUP-001 | Build script has silent failure mode | HIGH |
| 4 | ADMIN-001 | Deal creation doesn't save | HIGH |
| 5 | TEST-001 | Zero test coverage | HIGH |
| 6 | DEP-001 | No rate limiting on leads API | HIGH |

### Immediate Action Items (6 Quick Wins)

1. **3RD-001**: Replace `submitMockForm()` with `/api/leads` call in contact form
2. **SEC-001**: Remove `ignoreBuildErrors` flags
3. **SUP-001**: Remove `|| echo...` from build script
4. **DEP-001**: Add rate limiting to leads API
5. **SEC-004**: Sanitize email template `data.message`
6. **SUP-002**: Replace 3 `console.error` with logger

### Top 5 Files Requiring Attention

1. **`src/components/features/contact-form.tsx`** - CRITICAL: Form doesn't work
2. **`next.config.ts`** - Build safety flags
3. **`package.json`** - Build script
4. **`src/app/api/leads/route.ts`** - Rate limiting + sanitization
5. **`src/app/[locale]/admin/deals/page.tsx`** - Deal creation doesn't save

---

*Final audit complete. 71 issues + 3 positive findings documented.*
