# Alecia Suite - Architecture Study & Migration Blueprint

> Comprehensive analysis of the AlePanel codebase, ecosystem mapping, open-source repo evaluation, and architecture recommendations for the OVH Cloud VPS migration.
>
> **Date:** February 7, 2026 | **Version:** 1.0

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Codebase Analysis](#2-current-codebase-analysis)
3. [Suite Product Mapping](#3-suite-product-mapping)
4. [Bookmarked Repos Analysis](#4-bookmarked-repos-analysis)
5. [Recommended Repos per Module](#5-recommended-repos-per-module)
6. [Additional Suggestions](#6-additional-suggestions)
7. [Architecture Blueprint](#7-architecture-blueprint)
8. [Migration Strategy](#8-migration-strategy)
9. [Risk Assessment & Mitigation](#9-risk-assessment--mitigation)

---

## 1. Executive Summary

### What exists today

AlePanel is a **pnpm + Turborepo monorepo** containing:

| App | Framework | Port | Purpose | Maturity |
|-----|-----------|------|---------|----------|
| **website** | Next.js 15.3.6 | 3000 | Marketing site + Admin panel + Numbers tools | Advanced Beta |
| **colab** | Next.js 16.1.4 | 3001 | Notion-like collaboration (docs, kanban, presentations) | MVP/Early Production |

**Shared infrastructure:**
- **Backend:** Convex (real-time NoSQL, serverless functions)
- **Auth:** Clerk (SSO, OAuth)
- **UI:** `@alepanel/ui` shared package (shadcn/ui + Radix)
- **Editor:** `@alepanel/headless` (Novel/TipTap)
- **Deployment:** Vercel + Convex Cloud
- **Domain:** alecia.markets (current), migrating to alecia.fr

### What's planned

Migration to **self-hosted OVH Cloud VPS** with **PostgreSQL**, decomposing the monolith into **8 subdomain services** — each forked from best-fit open-source repos, customized and branded as Alecia.

### Key recommendation

Adopt a **hub-and-spoke architecture** with a shared PostgreSQL database, Caddy as reverse proxy, Coolify for deployment orchestration, and Keycloak/Authelia for unified SSO across all subdomains.

---

## 2. Current Codebase Analysis

### 2.1 Monorepo Structure

```
alepanel/
├── apps/
│   ├── website/          # @alecia/website - Next.js 15.3.6
│   │   ├── src/app/[locale]/     # i18n App Router (FR/EN)
│   │   ├── src/app/[locale]/admin/  # 40+ admin routes
│   │   ├── src/components/       # 200+ React components
│   │   └── src/lib/              # Server actions, utilities
│   └── colab/            # Next.js 16.1.4
│       ├── app/                  # Dashboard, documents, kanban
│       ├── components/           # Editor, kanban, presence
│       └── hooks/                # Yjs sync, presence, Convex
├── packages/
│   ├── ui/               # @alepanel/ui - Shared components
│   │   └── src/components/sidebar/config.ts  # Suite nav
│   └── headless/         # Novel/TipTap editor package
├── convex/               # Shared Convex backend (symlinked)
│   ├── schema.ts         # 30+ tables
│   ├── analytics.ts      # Custom analytics
│   ├── numbers/          # Financial calc backends
│   ├── colab/            # Collaboration backends
│   └── ...               # CRM, deals, approvals, etc.
└── Configuration files (turbo.json, pnpm-workspace.yaml)
```

### 2.2 Technology Stack Snapshot

| Layer | Current | Target |
|-------|---------|--------|
| Frontend | React 19, Next.js 15/16, Tailwind v3/v4 | Standardize on Next.js 15 + Tailwind v4 |
| Backend | Convex (NoSQL, serverless) | PostgreSQL + individual service backends |
| Auth | Clerk | Keycloak or Authelia (self-hosted SSO) |
| Database | Convex tables (30+) | PostgreSQL (shared) |
| Deployment | Vercel + Convex Cloud | OVH VPS + Docker + Coolify |
| Monitoring | Sentry + Vercel Analytics | Sentry + Plausible/Umami (self-hosted) |
| Domain | alecia.markets | alecia.fr + *.alecia.fr |

### 2.3 Key Features Already Built

**Website (marketing + admin):**
- Full bilingual marketing site (FR/EN) with 10+ public pages
- Hero video, KPI band, transactions carousel, interactive France map
- Admin panel: CRM, deal pipeline (kanban), data rooms, team management
- Visual editor for content (section-based page builder)
- Numbers tools: valuation calculator, DD checklist, spreadsheet (FortuneSheet)
- Analytics dashboard (custom Vercel drain integration)
- Approval workflows with diff viewer
- SEO: sitemap, robots.txt, OpenGraph, Twitter Cards, hreflang
- Performance: lazy loading, optimized images, 90+ Lighthouse target

**Colab:**
- Rich document editor (TipTap v3.18 + Novel)
- Real-time collaboration via Yjs CRDT + Convex sync
- Live cursor presence with user avatars
- Kanban boards with drag-and-drop, labels, checklists, timelines
- AI-powered presentations
- Document export (PDF, DOCX, HTML)
- Deal flow canvas (@xyflow/react)

**Convex Backend (30+ tables):**
- `deals`, `contacts`, `companies` (CRM core)
- `colab_documents`, `colab_boards`, `colab_cards` (collaboration)
- `analytics_events`, `analytics_cache` (analytics)
- `numbers_valuations`, `numbers_dd_checklists` (financial tools)
- `data_rooms`, `data_room_files` (secure document sharing)
- `approvals`, `feature_flags`, `notifications`
- Yjs sync tables for real-time collaboration

### 2.4 Quality Assessment

| Metric | Status |
|--------|--------|
| TypeScript errors | 0 (clean compilation) |
| ESLint warnings | ~60 (non-blocking, mostly `any` types) |
| Security vulnerabilities | 0 critical |
| Hardcoded secrets | 0 |
| Test coverage | Vitest + Playwright configured |
| Accessibility | WCAG 2.1 AA compliant |
| Build time | ~60-90s |

### 2.5 Existing Workflow (Alecia-Study-Step1.json)

Already using AgenticFlow with DeepSeek v3.2 for automated market study generation:
1. AI generates JSON market study
2. Web search for fact-checking
3. AI enrichment and validation
4. HTML report generation (Tailwind + Chart.js)
5. Email delivery

This proves the team is already experienced with AI-powered automation workflows.

---

## 3. Suite Product Mapping

### 3.1 Alecia's Philosophy (from codebase)

From the Suite page content:
> "Suite logicielle interne, conçue exclusivement pour les équipes d'Alecia. Elle n'est pas commercialisée : c'est un socle sur-mesure, aligné sur les méthodes et exigences du M&A mid-cap."

**Core principles (from code):**
1. **Governance & traceability** without operational overhead
2. **Targeted automation** of repetitive tasks and controls
3. **End-to-end security**: access control, audit trails, compliance
4. **"By the team, for the team"** design philosophy

**Value chain coverage:** Origination -> Execution -> Document production -> Data room -> Financial calculations -> Collaboration -> Monitoring

### 3.2 Module-by-Function Mapping

| Module | Function | Current State | Key Need |
|--------|----------|---------------|----------|
| **alecia** | Marketing landing page | Production-ready, Next.js 15 | Migrate hosting to OVH, keep as-is |
| **alecia.fr** | Website backend/CMS | Visual editor + admin panel built | Extract into headless CMS |
| **alecia business intelligence** | CRM + Market studies + AI research | Partial (deals, contacts, AI studies) | Needs proper CRM + data enrichment |
| **alecia numbers** | Financial calculus framework | 10 XLSX templates + FortuneSheet | Needs spreadsheet engine (Baserow?) |
| **alecia flows** | n8n-like workflow automation | AgenticFlow prototype exists | Fork n8n, brand as Alecia Flows |
| **alecia sign** | E-signature + Data room | Data rooms exist, no e-sign yet | Fork DocuSeal |
| **alecia colab** | Notion-like collaboration | MVP with Yjs, TipTap, kanban | Evaluate AFFiNE fork vs. continue custom |
| **alecia analytics** | Business + web analytics | Custom dashboard (Vercel drain) | Replace with Plausible/Umami |

### 3.3 Branding System

**Color palette** (from Tailwind config):
- Midnight Blue: `#061a40` (primary)
- Corporate Blue: `#163e64`
- Mid Blue: `#4370a7`
- Light Blue: `#749ac7`
- Pale Blue: `#bfd7ea`
- Ice Blue: `#e3f2fd`

**Typography:** Bierstadt (primary) + Playfair Display (serif accent)

**Logo system:** 8 products, each with distinctive gradient icon + "alecia [product]" wordmark in consistent navy sans-serif. Gradient spectrum runs blue-to-purple across products.

---

## 4. Bookmarked Repos Analysis

### 4.1 Complete Inventory (from screenshots)

**Infrastructure & PaaS:**
| Repo | Stars | Fit | Notes |
|------|-------|-----|-------|
| Coolify | 40k+ | Deployment | Self-hosted PaaS, perfect for OVH VPS |
| CapRover | 13k+ | Deployment | Alternative to Coolify, Docker-based |
| Caddy | 60k+ | Reverse proxy | Automatic HTTPS, ideal for subdomain routing |
| Authelia | 22k+ | Auth/SSO | SSO proxy for all services |
| Keycloak | 25k+ | Auth/SSO | Enterprise-grade IAM |
| DashDot | 4k+ | Server monitoring | Simple VPS dashboard |
| Gatus | 6k+ | Status page | Automated status + alerting |

**CMS & Content:**
| Repo | Stars | Fit | Notes |
|------|-------|-----|-------|
| Strapi | 67k+ | Headless CMS | JS/TS, PostgreSQL, REST+GraphQL |
| Directus | 30k+ | Headless CMS/BaaS | PostgreSQL native, visual data platform |
| KeystoneJS | 9k+ | Headless CMS | GraphQL-first, React admin |
| AdminJS | 8k+ | Admin panel | Node.js admin panel generator |

**CRM & Business:**
| Repo | Stars | Fit | Notes |
|------|-------|-----|-------|
| SuiteCRM | 5k+ | CRM | PHP-based, full-featured |
| Chatwoot | 22k+ | Customer messaging | Ruby, Salesforce alternative |
| Twenty (not bookmarked) | 25k+ | Modern CRM | Recommended addition |
| Mautic | 7k+ | Marketing automation | PHP, email campaigns |

**Collaboration & Documents:**
| Repo | Stars | Fit | Notes |
|------|-------|-----|-------|
| AFFiNE | 45k+ | Notion/Miro alternative | Local-first, blocks + whiteboard |
| Memos | 35k+ | Lightweight notes | Self-hosted, markdown |
| Paperless-ngx | 25k+ | Document management | OCR, tagging, search |
| DocuSeal | 8k+ | DocuSign alternative | Ruby, e-signatures, PDF forms |
| Gotenberg | 9k+ | Doc-to-PDF API | Docker-based conversion service |

**Data & Analytics:**
| Repo | Stars | Fit | Notes |
|------|-------|-----|-------|
| Plausible | 22k+ | Web analytics | Elixir, privacy-first, lightweight |
| Redash | 27k+ | Data visualization | Python, SQL dashboards |
| OpenPanel | 3k+ | Product analytics | Next.js, self-hosted Mixpanel |
| Baserow | 4k+ | No-code Postgres | Airtable alternative, API-first |

**Workflow & Automation:**
| Repo | Stars | Fit | Notes |
|------|-------|-----|-------|
| n8n (not bookmarked) | 55k+ | Workflow automation | Core inspiration for Alecia Flows |
| Budibase | 24k+ | Low-code apps | PostgreSQL, automation |
| Pipedream | - | API integrations | Cloud-based, 1000+ integrations |
| Cal.com | 37k+ | Scheduling | Prisma + PostgreSQL |
| Postiz | 10k+ | Social media scheduling | AI-powered, self-hosted |

**UI Libraries (already relevant):**
| Repo | Fit | Notes |
|------|-----|-------|
| TanStack Table/Virtual/Select | Already used | Core UI infra |
| React Hook Form | Already used | Form handling |
| Recharts | Already used | Charts |
| Floating UI | Enhancement | Tooltips/popovers |
| Radix Primitives | Already used | Base components |
| Headless UI | Alternative | Tailwind Labs |

**Other:**
| Repo | Fit | Notes |
|------|-----|-------|
| Reveal.js | Presentations | HTML presentation framework |
| Loomio | Decision-making | Collaborative decisions |
| FreshRSS | News aggregation | RSS reader for market intelligence |
| Unlayer Email Editor | Email templates | Drag-and-drop email builder |
| EarlyBird | Security scanning | Sensitive data detection |

---

## 5. Recommended Repos per Module

### 5.1 alecia (Marketing Landing Page)

**Recommendation: Keep current Next.js app, migrate to OVH via Docker**

The existing website is production-ready with excellent SEO, i18n, and performance. No need to replace it.

**Action:**
- Dockerize the Next.js app (`output: 'standalone'` already configured)
- Deploy via Coolify on OVH VPS
- Point alecia.fr DNS to OVH
- Keep Clerk auth short-term, migrate to Keycloak long-term

---

### 5.2 alecia.fr (Website Backend / CMS)

**Primary recommendation: Directus**
**Alternative: Strapi**

| Criteria | Directus | Strapi |
|----------|----------|--------|
| PostgreSQL | Native (built on it) | Supported |
| API | REST + GraphQL auto-generated | REST + GraphQL |
| Visual editor | Data Studio (visual data management) | Content-Type Builder |
| Self-hosting | Docker, excellent | Docker, excellent |
| White-label | Fully customizable UI | Customizable admin |
| License | BSL 1.1 (free self-hosted) | MIT (CE) / EE |
| Tech stack | Node.js, Vue.js | Node.js, React |
| Key advantage | Database-first (wraps existing PostgreSQL) | Content-first, plugin ecosystem |

**Why Directus wins for alecia.fr:**
- It wraps your existing PostgreSQL tables with instant REST/GraphQL APIs
- The existing visual editor concept maps perfectly to Directus Flows + Data Studio
- Job offers, blog articles, tombstones all become content types
- The admin panel becomes the "alecia.fr" backend — manage all website content
- SDK available for Next.js integration

**Subdomain:** `admin.alecia.fr` or `studio.alecia.fr`

---

### 5.3 alecia business intelligence (CRM + Market Studies)

**Primary recommendation: Twenty CRM**
**Alternative: Fork from bookmarked SuiteCRM + custom AI layer**

| Criteria | Twenty | SuiteCRM |
|----------|--------|----------|
| PostgreSQL | Native (Prisma) | MySQL (not ideal) |
| Tech stack | React, NestJS, GraphQL | PHP, MySQL |
| Self-hosting | Docker | Docker |
| Modern UI | Excellent, Notion-like UX | Dated but functional |
| API | GraphQL + REST | REST |
| Customization | TypeScript, very hackable | PHP modules |
| Key advantage | Modern, extensible, graph data model | Mature, feature-complete |

**Why Twenty wins:**
- Built on PostgreSQL natively (perfect for OVH migration)
- Modern React + NestJS + GraphQL stack aligns with team skills
- Notion-like UX fits Alecia's design philosophy
- Extensible object system for M&A-specific entities (deals, mandates, LOIs)
- Built-in email integration, tasks, notes

**AI Research Layer (custom):**
- Build on top of Twenty's API with custom NestJS modules
- Integrate the existing AgenticFlow market study workflow
- Add Pappers API for French company data (already used in codebase)
- Use vector DB (pgvector extension) for semantic search across studies

**Subdomain:** `bi.alecia.fr`

---

### 5.4 alecia numbers (Financial Calculus Framework)

**Primary recommendation: Baserow + custom financial templates**
**Alternative: NocoDB or continue with FortuneSheet**

| Criteria | Baserow | NocoDB | FortuneSheet (current) |
|----------|---------|--------|----------------------|
| PostgreSQL | Native | MySQL/PG | N/A (client-side) |
| Spreadsheet feel | Table-based, formulas | Spreadsheet-like views | Full Excel clone |
| API | REST, real-time WebSocket | REST | None |
| Self-hosting | Docker | Docker | Embedded |
| Collaboration | Built-in | Built-in | Manual via Convex |
| Formulas | Built-in formula field | Built-in | Excel formulas |
| Tech stack | Python/Django, Nuxt.js | Node.js, Vue.js | React |

**Why Baserow is the best fit:**
- Built natively on PostgreSQL (aligns with migration)
- API-first: all 10 M&A templates can be modeled as Baserow tables
- Real-time collaboration built-in
- Formula fields handle financial calculations
- White-label Enterprise edition available
- Plugin system for custom field types (Lehman formula, WACC, etc.)

**Implementation approach:**
1. Model each XLSX template as a Baserow table with formula fields
2. Build custom Baserow plugins for M&A-specific calculations
3. Create a branded frontend shell (`numbers.alecia.fr`) that embeds Baserow
4. Migrate the 10 existing templates:
   - Due Diligence Checklist -> Baserow table with status tracking
   - Valuation Multiples -> Baserow with formula fields
   - 3-Statement Model -> Multi-table with cross-references
   - Comparable Companies -> Table with auto-calculated stats
   - Deal Pipeline -> Kanban view (native Baserow feature)
   - etc.

**Subdomain:** `numbers.alecia.fr`

---

### 5.5 alecia flows (Workflow Automation)

**Primary recommendation: n8n (self-hosted)**

This is the clear winner. n8n is the exact inspiration cited in the project description.

| Criteria | n8n |
|----------|-----|
| PostgreSQL | Supported (SQLite, MySQL, PostgreSQL) |
| Self-hosting | Docker, excellent |
| License | Sustainable Use License (free self-hosted) |
| Nodes | 400+ integrations |
| Custom nodes | TypeScript, easy to build |
| UI | Visual workflow editor |
| API | REST API for workflows |
| AI capabilities | Built-in AI nodes (LLM, embeddings, tools) |
| White-label | Community edition is fully brandable |

**Why n8n is perfect:**
- The `Alecia-Study-Step1.json` workflow is literally an n8n-compatible workflow
- Already uses LLM nodes, web search, email — all native n8n capabilities
- Can replace AgenticFlow entirely
- Custom nodes for Alecia-specific integrations (Pappers, Convex migration, etc.)
- Built-in credential management for API keys
- Webhook triggers for connecting other suite modules

**Implementation approach:**
1. Fork n8n, rebrand to Alecia Flows
2. Build custom nodes for: Alecia CRM, Alecia Numbers, Alecia Sign
3. Pre-build workflow templates for common M&A tasks:
   - Automated market study generation
   - Deal pipeline notifications
   - Document expiry alerts
   - Client onboarding sequences
   - Tombstone generation

**Subdomain:** `flows.alecia.fr`

---

### 5.6 alecia sign (E-Signature + Data Room)

**Primary recommendation: DocuSeal**
**Document conversion complement: Gotenberg**

| Criteria | DocuSeal |
|----------|----------|
| PostgreSQL | Supported |
| Self-hosting | Docker |
| License | AGPL-3.0 |
| E-signatures | Legally valid, timestamped |
| API | REST API, webhooks |
| Tech stack | Ruby on Rails |
| Templates | PDF form builder |
| Branding | Full white-label support |
| Data room | File management built-in |

**Why DocuSeal is the best fit:**
- Directly bookmarked in your reference materials
- Full API access for integration with other suite modules
- Certificate-based signatures (aligns with "valid certificate" requirement)
- Template system for recurring M&A documents (LOIs, NDAs, SPAs)
- Self-hosted = full data control (critical for M&A confidentiality)

**Complement with Gotenberg** for document conversion:
- Convert DOCX/HTML to PDF for signing
- Merge multiple documents
- Add watermarks and headers
- API-based, Docker container

**Data room integration:**
- The existing `data_rooms` and `data_room_files` Convex tables migrate to PostgreSQL
- DocuSeal handles the signing workflow
- File storage on OVH Object Storage (S3-compatible)
- Access control per-deal, per-document

**Subdomain:** `sign.alecia.fr`

---

### 5.7 alecia colab (Collaboration Platform)

**Option A: Continue custom development (Recommended)**
**Option B: Fork AFFiNE**

| Criteria | Custom (current) | AFFiNE fork |
|----------|-----------------|-------------|
| Tech stack | Next.js 16, TipTap, Yjs | React, BlockSuite, Yjs |
| Real-time | Excellent (Yjs + Convex) | Excellent (native) |
| Kanban | Fully built | Not built-in |
| Documents | Production-grade | Excellent (blocks + whiteboard) |
| M&A-specific | Already customized | Would need extensive customization |
| Spreadsheets | Not built | Table/database blocks |
| Migration effort | None (continue) | Very high |
| Team familiarity | Full understanding | New codebase to learn |

**Why continuing custom is better:**
- The existing Colab app is surprisingly mature (Yjs real-time, TipTap editor, kanban, presentations)
- It's already customized for M&A workflows (deal pipeline, document versioning)
- AFFiNE's BlockSuite is a completely different architecture (would require full rewrite)
- The team built it and understands it deeply

**Enhancement roadmap:**
1. Migrate from Convex to PostgreSQL + Yjs WebSocket server
2. Add spreadsheet blocks (embed Baserow tables or use TipTap table extension)
3. Add calendar view (integrate Cal.com or build on existing calendar.ts)
4. Add file attachments (OVH Object Storage)
5. Add search (PostgreSQL full-text search or pgvector)

**Subdomain:** `colab.alecia.fr`

---

### 5.8 alecia analytics (Business & Web Analytics)

**Primary recommendation: Plausible Analytics (web) + custom business dashboards**
**Alternative: Umami**

| Criteria | Plausible | Umami | Current (custom) |
|----------|-----------|-------|------------------|
| PostgreSQL | ClickHouse (or PG via community) | MySQL/PG | Convex |
| Self-hosting | Docker | Docker | Vercel |
| Privacy | GDPR-compliant, no cookies | GDPR-compliant | Custom |
| Performance | Extremely lightweight (<1KB script) | Lightweight | Custom |
| Dashboard | Beautiful, simple | Clean, functional | Custom Recharts |
| API | Stats API | REST API | Custom |
| License | AGPL-3.0 | MIT | N/A |

**Why Plausible:**
- Privacy-first (no cookies = no consent banner needed for analytics)
- GDPR-compliant by design (critical for French market)
- Beautiful dashboard that can be embedded
- Goal tracking and custom events
- Email reports
- Multiple site support (track all subdomains)

**Business analytics layer (custom):**
- Build on top of Plausible for web traffic
- Custom dashboards for M&A metrics using Recharts (already in codebase)
- Pipeline analytics, deal velocity, conversion rates
- Connect to Twenty CRM API for business data
- Use Redash for ad-hoc SQL queries if needed

**Subdomain:** `analytics.alecia.fr`

---

## 6. Additional Suggestions

### 6.1 Repos NOT in bookmarks but highly recommended

| Repo | Stars | Purpose | Why |
|------|-------|---------|-----|
| **Twenty** (twentyhq/twenty) | 25k+ | Modern CRM | Best PostgreSQL-native CRM, modern stack |
| **n8n** (n8n-io/n8n) | 55k+ | Workflow automation | The exact tool described for Alecia Flows |
| **Umami** (umami-software/umami) | 25k+ | Analytics alternative | Simpler than Plausible, Next.js-based |
| **Infisical** (infisical/infisical) | 18k+ | Secret management | Centralized env var management for all services |
| **Lago** (getlago/lago) | 7k+ | Billing/invoicing | Open-source billing (for fee calculator) |
| **Minio** (minio/minio) | 50k+ | Object storage | S3-compatible, self-hosted file storage |
| **pgvector** | 14k+ | Vector search | PostgreSQL extension for AI/semantic search |
| **Hatchet** (hatchet-dev/hatchet) | 5k+ | Task queue | Distributed task scheduling |
| **Plane** (makeplane/plane) | 32k+ | Project management | Jira alternative (could complement kanban) |

### 6.2 Infrastructure recommendations

| Need | Recommendation | Why |
|------|---------------|-----|
| Reverse proxy | **Caddy** | Automatic HTTPS, simple config, subdomain routing |
| Deployment | **Coolify** | Git-push deploy, Docker orchestration, simple UI |
| SSO/Auth | **Keycloak** | Enterprise-grade, OIDC, SAML, user federation |
| Monitoring | **Uptime Kuma** | Simple uptime monitoring for all services |
| Backups | **Restic + OVH Backup** | Automated PostgreSQL + file backups |
| File storage | **Minio** | S3-compatible, self-hosted, works with all services |
| Secrets | **Infisical** | Centralized secret management |
| Mail | **Resend** (keep) or **Postal** | Email delivery for notifications |

---

## 7. Architecture Blueprint

### 7.1 Target Infrastructure

```
                        ┌─────────────────────┐
                        │   alecia.fr (DNS)    │
                        │   Cloudflare (CDN)   │
                        └──────────┬──────────┘
                                   │
                        ┌──────────▼──────────┐
                        │   Caddy Reverse      │
                        │   Proxy (HTTPS)      │
                        │   *.alecia.fr        │
                        └──────────┬──────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
    ┌─────▼─────┐          ┌──────▼──────┐          ┌─────▼─────┐
    │  alecia.fr │          │ bi.alecia.fr│          │flows.alecia│
    │  (Next.js) │          │  (Twenty)   │          │  (n8n)    │
    │  Port 3000 │          │  Port 3001  │          │ Port 5678 │
    └─────┬─────┘          └──────┬──────┘          └─────┬─────┘
          │                        │                        │
    ┌─────▼─────┐          ┌──────▼──────┐          ┌─────▼─────┐
    │numbers.ale│          │sign.alecia.fr│          │colab.alecia│
    │ (Baserow)  │          │ (DocuSeal)  │          │  (Next.js) │
    │  Port 3002 │          │  Port 3003  │          │  Port 3004 │
    └─────┬─────┘          └──────┬──────┘          └─────┬─────┘
          │                        │                        │
    ┌─────▼─────┐          ┌──────▼──────┐
    │analytics  │          │admin.alecia │
    │(Plausible)│          │ (Directus)  │
    │  Port 8000│          │  Port 8055  │
    └─────┬─────┘          └──────┬──────┘
          │                        │
          └────────────┬───────────┘
                       │
              ┌────────▼────────┐
              │   Shared Layer   │
              ├─────────────────┤
              │ PostgreSQL 16    │
              │ Keycloak (SSO)   │
              │ Minio (S3)       │
              │ Redis (cache)    │
              │ Coolify (deploy) │
              └─────────────────┘
```

### 7.2 Subdomain Map

| Subdomain | Service | Port | Docker Image |
|-----------|---------|------|-------------|
| `alecia.fr` | Next.js marketing + landing | 3000 | Custom |
| `admin.alecia.fr` | Directus (CMS/backend) | 8055 | directus/directus |
| `bi.alecia.fr` | Twenty CRM | 3001 | twentyhq/twenty |
| `numbers.alecia.fr` | Baserow | 3002 | baserow/baserow |
| `flows.alecia.fr` | n8n | 5678 | n8nio/n8n |
| `sign.alecia.fr` | DocuSeal | 3003 | docuseal/docuseal |
| `colab.alecia.fr` | Next.js collaboration | 3004 | Custom |
| `analytics.alecia.fr` | Plausible | 8000 | plausible/analytics |
| `auth.alecia.fr` | Keycloak | 8080 | keycloak/keycloak |
| `files.alecia.fr` | Minio | 9000 | minio/minio |
| `status.alecia.fr` | Uptime Kuma | 3005 | louislam/uptime-kuma |

### 7.3 Data Communication

**Inter-service communication pattern:**

```
┌──────────┐     REST API      ┌──────────┐
│  Service  │ ◄──────────────► │  Service  │
│    A      │                   │    B      │
└─────┬────┘                   └─────┬────┘
      │                               │
      │     Shared PostgreSQL         │
      └───────────┬───────────────────┘
                  │
           ┌──────▼──────┐
           │ PostgreSQL   │
           │ (schemas)    │
           │              │
           │ public.*     │ ← Shared tables (users, deals)
           │ crm.*        │ ← Twenty CRM
           │ cms.*        │ ← Directus
           │ numbers.*    │ ← Baserow
           │ colab.*      │ ← Collaboration
           │ analytics.*  │ ← Plausible
           └──────────────┘
```

**Key integration points:**
1. **Keycloak SSO** — All services authenticate through OIDC tokens
2. **PostgreSQL schemas** — Logical separation with cross-schema queries where needed
3. **n8n webhooks** — Event-driven connections between services
4. **Minio** — Shared file storage accessible by all services
5. **Directus API** — Content served to Next.js frontend

### 7.4 Refine Integration

Refine (refinedev/refine) from your bookmarks can serve as the **meta-framework** that ties multiple backends together:

- React-based admin framework
- Data providers for: REST, GraphQL, Supabase, Directus, NestJS, Strapi
- Built-in auth, routing, i18n, notifications
- Could serve as the unified admin shell (`admin.alecia.fr`) connecting to:
  - Directus for CMS data
  - Twenty for CRM data
  - Baserow for spreadsheet data
  - Custom APIs for analytics

---

## 8. Migration Strategy

### Phase 0: Infrastructure Setup (Week 1-2)

1. **Provision OVH VPS** (minimum recommended: 8 vCPU, 32GB RAM, 500GB SSD)
2. **Install Coolify** for deployment management
3. **Deploy Caddy** as reverse proxy with wildcard SSL for `*.alecia.fr`
4. **Deploy PostgreSQL 16** with pgvector extension
5. **Deploy Keycloak** and configure OIDC
6. **Deploy Minio** for object storage
7. **Deploy Redis** for caching
8. **Configure DNS** for all subdomains
9. **Set up automated backups** (Restic to OVH Backup Storage)

### Phase 1: Marketing Website Migration (Week 2-3)

1. Dockerize existing Next.js website
2. Replace Clerk auth with Keycloak OIDC
3. Migrate marketing content from Convex to PostgreSQL (via Directus)
4. Deploy to OVH via Coolify
5. Verify SEO, performance, i18n
6. DNS cutover from Vercel to OVH

### Phase 2: Core Tools (Week 3-6)

1. **Deploy n8n** as Alecia Flows
   - Rebrand UI
   - Build custom nodes for internal APIs
   - Migrate existing AgenticFlow workflows
2. **Deploy DocuSeal** as Alecia Sign
   - Configure signing certificates
   - Create M&A document templates
   - Migrate data room functionality
3. **Deploy Plausible** as Alecia Analytics
   - Add tracking to marketing site
   - Configure goals and events
   - Migrate existing analytics data

### Phase 3: Business Tools (Week 6-10)

1. **Deploy Twenty** as Alecia Business Intelligence
   - Custom objects for deals, mandates, targets
   - Migrate CRM data from Convex
   - Build AI research integration
   - Connect Pappers API for company enrichment
2. **Deploy Baserow** as Alecia Numbers
   - Model 10 M&A templates as Baserow tables
   - Build custom formula fields
   - Create branded frontend shell

### Phase 4: Collaboration Migration (Week 10-14)

1. **Migrate Colab** from Convex to PostgreSQL
   - Set up Yjs WebSocket server (y-websocket or Hocuspocus)
   - Migrate document data
   - Migrate kanban boards and cards
   - Test real-time collaboration
2. **Deploy Directus** as website backend
   - Model content types
   - Migrate admin panel functionality
   - Connect to Next.js frontend

### Phase 5: Integration & Polish (Week 14-16)

1. **Build n8n workflows** connecting all services
2. **Unified navigation** across all subdomains
3. **Cross-service search** (pgvector)
4. **Monitoring** (Uptime Kuma, Sentry)
5. **Performance testing** and optimization
6. **Security audit** and penetration testing
7. **Team training** and documentation

---

## 9. Risk Assessment & Mitigation

### Technical Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Convex -> PostgreSQL migration data loss | High | Comprehensive backup + staged migration + validation scripts |
| Real-time collaboration regression | High | Keep Yjs, swap transport only (Convex -> WebSocket) |
| Service sprawl complexity | Medium | Coolify manages all containers; n8n handles inter-service communication |
| VPS resource exhaustion | Medium | Start with 32GB RAM; monitor; scale vertically or add workers |
| Open-source license changes | Low | All recommended repos are established with stable licenses |
| Branding consistency across services | Medium | Shared CSS theme + Caddy subdomain headers + custom login pages |

### Operational Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Team learning curve (8 new tools) | High | Phase rollout; start with n8n + DocuSeal (simplest); document everything |
| Self-hosting maintenance burden | Medium | Coolify auto-updates; PostgreSQL managed backup; monitoring alerts |
| Security exposure (public-facing services) | High | Caddy HTTPS; Keycloak SSO; fail2ban; OVH firewall; regular updates |
| Backup/disaster recovery | High | Automated daily backups to OVH Object Storage; tested restore procedures |

### Strategic Considerations

1. **Build vs. Fork tradeoff:** Forking open-source gets you 80% faster, but the last 20% (M&A-specific customization) is where your competitive advantage lies. Invest there.

2. **Convex exit strategy:** Convex is proprietary SaaS. Migrating to PostgreSQL gives you full data sovereignty — critical for M&A confidentiality requirements.

3. **Progressive migration:** Don't try to migrate everything at once. Keep Vercel/Convex running while you bring up OVH services. Cut over one service at a time.

4. **Team velocity:** The current team has strong React/TypeScript skills. Prioritize repos with React/Node.js frontends (Twenty, Baserow) over PHP/Ruby alternatives (SuiteCRM, DocuSeal). Exception: DocuSeal (Ruby) is best-in-class for e-signatures and worth the stack diversity.

---

## Appendix A: OVH VPS Sizing Recommendation

**Minimum viable configuration:**

| Resource | Requirement | Recommendation |
|----------|-------------|----------------|
| CPU | 8+ vCPU | OVH VPS Comfort or higher |
| RAM | 32GB minimum | 64GB preferred for all services |
| Storage | 500GB SSD | NVMe preferred |
| Bandwidth | 1 Gbps | Standard OVH |
| Backup | Daily automated | OVH Backup Storage |
| OS | Ubuntu 24.04 LTS | Docker + Coolify |

**Per-service memory estimate:**

| Service | RAM | CPU |
|---------|-----|-----|
| PostgreSQL | 4-8GB | 2 vCPU |
| Next.js (website) | 512MB | 0.5 vCPU |
| Next.js (colab) | 1GB | 0.5 vCPU |
| Twenty CRM | 2-4GB | 1 vCPU |
| n8n | 1-2GB | 0.5 vCPU |
| DocuSeal | 1GB | 0.5 vCPU |
| Baserow | 2-4GB | 1 vCPU |
| Plausible | 1-2GB | 0.5 vCPU |
| Directus | 512MB | 0.5 vCPU |
| Keycloak | 1GB | 0.5 vCPU |
| Minio | 512MB | 0.5 vCPU |
| Redis | 256MB | 0.25 vCPU |
| Caddy | 128MB | 0.25 vCPU |
| Coolify | 1GB | 0.5 vCPU |
| **Total** | **~16-26GB** | **~8 vCPU** |

## Appendix B: Docker Compose Skeleton

```yaml
# docker-compose.alecia.yml (managed by Coolify)
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg16
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: alecia
      POSTGRES_USER: alecia
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  keycloak:
    image: quay.io/keycloak/keycloak:latest
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres/keycloak
    ports:
      - "8080:8080"

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"

  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data

  # Application services deployed separately via Coolify
  # Each gets its own container with environment variables
  # pointing to the shared postgres, redis, minio, keycloak

volumes:
  postgres_data:
  redis_data:
  minio_data:
  caddy_data:
```

---

*Document generated on February 7, 2026*
*AlePanel Codebase v2.0.0 | Main branch: 874a0910*
