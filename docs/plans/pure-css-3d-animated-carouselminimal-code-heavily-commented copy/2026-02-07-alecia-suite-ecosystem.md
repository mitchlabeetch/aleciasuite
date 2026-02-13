# Alecia Suite — Definitive Ecosystem Blueprint

> Every tool, every feature, every integration, every fork decision — documented.
>
> **Date:** February 7, 2026 | **Version:** 2.1 — FOSS-Compliant Edition
> **Strategy:** Slim forks + custom enhancements. 100% FOSS. 100% self-branded.

---

## Table of Contents

1. [Philosophy & Constraints](#1-philosophy--constraints)
2. [Infrastructure Layer](#2-infrastructure-layer)
3. [Shared Data Architecture](#3-shared-data-architecture)
4. [Tool 1: alecia — Marketing Site](#4-tool-1-alecia--marketing-site)
5. [Tool 2: alecia.fr — CMS Backend (Strapi)](#5-tool-2-aleciafr--cms-backend-strapi)
6. [Tool 3: Alecia Business Intelligence — CRM + Research](#6-tool-3-alecia-business-intelligence--crm--research)
7. [Tool 4: Alecia Numbers — M&A Financial Framework](#7-tool-4-alecia-numbers--ma-financial-framework)
8. [Tool 5: Alecia Flows — Workflow Automation (Activepieces)](#8-tool-5-alecia-flows--workflow-automation-activepieces)
9. [Tool 6: Alecia Sign — E-Signature + Data Room (DocuSeal)](#9-tool-6-alecia-sign--e-signature--data-room-docuseal)
10. [Tool 7: Alecia Colab — Collaborative Workspace](#10-tool-7-alecia-colab--collaborative-workspace)
11. [Tool 8: Alecia Analytics — Business & Web Analytics (Plausible)](#11-tool-8-alecia-analytics--business--web-analytics-plausible)
12. [Supporting Services & Utilities](#12-supporting-services--utilities)
13. [Inter-Service Communication](#13-inter-service-communication)
14. [Custom Integration Nodes](#14-custom-integration-nodes)
15. [Brand Identity System](#15-brand-identity-system)
16. [Migration & Deployment Strategy](#16-migration--deployment-strategy)
17. [Reference Repos to Study](#17-reference-repos-to-study)
18. [Decision Log](#18-decision-log)

---

## 1. Philosophy & Constraints

### Core Principles

1. **100% FOSS** — Every component must be open-source (OSI-approved license). Sole exceptions: VPS hosting costs and AI API inference charges (OpenAI/Groq).
2. **Slim Fork** — Fork each chosen repo, strip unused features, rebrand deeply, connect to shared infrastructure. Keep upstream architecture for stability, remove bloat for performance.
3. **100% Self-Branded** — Every pixel, every URL, every email says "Alecia." No "Powered by X" footers, no third-party logos in the UI.
4. **Hybrid Data Architecture** — Shared PostgreSQL schemas for cross-tool entities (deals, contacts, companies, users), isolated schemas for tool-specific data.
5. **M&A-First** — Every feature decision is filtered through: "Does this help close M&A deals faster, safer, or better?"

### Hard Constraints

| Constraint | Value |
|-----------|-------|
| Hosting | OVH Cloud VPS (self-hosted) |
| Database | PostgreSQL 16 + pgvector |
| Object Storage | Minio (S3-compatible) |
| Auth/SSO | Keycloak (Apache 2.0) |
| Reverse Proxy | Caddy (Apache 2.0) |
| Orchestration | Coolify (AGPL-3.0) |
| Licensing | 100% FOSS (OSI-approved) |
| Languages | French (business), English (code/docs) |
| Domain | alecia.fr (all subdomains) |

### Fork vs Build vs Deploy Decision Matrix

| Tool | Strategy | Source | License | Rationale |
|------|----------|--------|---------|-----------|
| **alecia** | Keep custom | Existing Next.js | MIT | Already production-ready |
| **alecia.fr** | Slim fork | Strapi CE | MIT | Current CMS unreliable, need stable headless CMS |
| **Business Intelligence** | Enhance custom | Existing Convex→PG | N/A | CRM + AI studies already built, add research tools |
| **Numbers** | Enhance custom | Existing React + FortuneSheet | N/A | 10 M&A tools production-ready, strengthen |
| **Flows** | Slim fork | Activepieces | MIT | No workflow engine exists, lighter than n8n, TS-native |
| **Sign** | Slim fork | DocuSeal | AGPL-3.0 | Need legal e-signatures, free unlimited self-hosted |
| **Colab** | Enhance custom | Existing TipTap + Yjs | MIT | Fix collaboration layer (Hocuspocus), improve UX |
| **Analytics** | Deploy + rebrand | Plausible CE | AGPL-3.0 | GDPR-compliant, deploy as-is, CSS rebrand |

---

## 2. Infrastructure Layer

### VPS Architecture

```
OVH Cloud VPS (8 vCPU, 32 GB RAM, 400 GB NVMe SSD)
├── Coolify (container orchestration)
│   ├── Caddy (reverse proxy, auto-TLS for *.alecia.fr)
│   ├── PostgreSQL 16 + pgvector
│   ├── Minio (S3-compatible blob storage)
│   ├── Keycloak (SSO/OIDC)
│   ├── Redis (caching + queues)
│   └── Hocuspocus (Yjs WebSocket server for Colab)
│
├── Application Containers
│   ├── alecia (Next.js marketing site)
│   ├── cms.alecia.fr (Strapi CE)
│   ├── app.alecia.fr (BI + Numbers — Next.js admin)
│   ├── flows.alecia.fr (Activepieces)
│   ├── sign.alecia.fr (DocuSeal)
│   ├── colab.alecia.fr (Next.js collaborative workspace)
│   └── analytics.alecia.fr (Plausible CE)
│
└── Research & Supporting Services
    ├── Miniflux (RSS aggregator, Apache 2.0)
    ├── SearXNG (meta search engine, AGPL-3.0)
    ├── Haystack (AI document intelligence, Apache 2.0)
    ├── Stirling-PDF (PDF toolkit, MIT)
    ├── Gotenberg (PDF generation, MIT)
    ├── Flowchart.fun (visual diagrams, MIT)
    └── Vaultwarden (password manager, AGPL-3.0)
```

### Subdomain Map

| Subdomain | Service | Port | Container |
|-----------|---------|------|-----------|
| `alecia.fr` | Marketing site | 3000 | next-marketing |
| `cms.alecia.fr` | Strapi admin panel | 1337 | strapi |
| `app.alecia.fr` | BI + Numbers dashboard | 3000 | next-admin |
| `flows.alecia.fr` | Activepieces workflow UI | 8080 | activepieces |
| `sign.alecia.fr` | DocuSeal signing UI | 3000 | docuseal |
| `colab.alecia.fr` | Collaborative workspace | 3001 | next-colab |
| `analytics.alecia.fr` | Plausible dashboard | 8000 | plausible |
| `auth.alecia.fr` | Keycloak SSO | 8443 | keycloak |
| `storage.alecia.fr` | Minio console | 9001 | minio |
| `feeds.alecia.fr` | Miniflux RSS reader | 8080 | miniflux |
| `search.alecia.fr` | SearXNG search | 8888 | searxng |
| `docs.alecia.fr` | Stirling-PDF toolkit | 8080 | stirling-pdf |
| `pdf.alecia.fr` | Gotenberg PDF API | 3000 | gotenberg |
| `diagrams.alecia.fr` | Flowchart.fun | 3000 | flowchart |
| `vault.alecia.fr` | Vaultwarden | 8080 | vaultwarden |

### Technology Stack Per Service

| Service | Language | Framework | Database | License |
|---------|----------|-----------|----------|---------|
| Marketing | TypeScript | Next.js 15 | PostgreSQL (via Strapi API) | MIT |
| CMS | TypeScript | Strapi 5 CE | PostgreSQL | MIT |
| BI/Numbers | TypeScript | Next.js 15 + React 19 | PostgreSQL (migrated from Convex) | MIT |
| Flows | TypeScript | Activepieces | PostgreSQL | MIT |
| Sign | Ruby | Rails 7 | PostgreSQL | AGPL-3.0 |
| Colab | TypeScript | Next.js 16 + TipTap 3 | PostgreSQL + Hocuspocus | MIT |
| Analytics | Elixir | Phoenix | PostgreSQL + ClickHouse | AGPL-3.0 |
| SSO | Java | Keycloak | PostgreSQL | Apache 2.0 |
| RSS | Go | Miniflux | PostgreSQL | Apache 2.0 |
| Search | Python | SearXNG | None (stateless) | AGPL-3.0 |
| AI Doc Search | Python | Haystack | PostgreSQL (pgvector) | Apache 2.0 |
| PDF Toolkit | Java | Stirling-PDF | None (stateless) | MIT |
| PDF Generation | Go | Gotenberg (Chromium) | None (stateless) | MIT |
| Diagrams | TypeScript | Flowchart.fun (React) | None (browser-only) | MIT |
| Passwords | Rust | Vaultwarden | SQLite | AGPL-3.0 |

---

## 3. Shared Data Architecture

### Hybrid Schema Design

PostgreSQL hosts both **shared schemas** (cross-tool entities) and **isolated schemas** (tool-specific data):

```
PostgreSQL 16
├── Schema: shared
│   ├── users (Keycloak-synced, SSO identity)
│   ├── companies (CRM, Pappers-enriched)
│   ├── contacts (linked to companies)
│   ├── deals (8-stage M&A pipeline)
│   ├── deal_stage_history (transition tracking)
│   └── audit_log (cross-service activity trail)
│
├── Schema: alecia_bi
│   ├── research_tasks
│   ├── market_studies
│   ├── buyer_criteria
│   ├── embeddings (pgvector, 1536 dimensions)
│   ├── rss_feeds (Miniflux sync)
│   └── open_data_cache (INSEE, data.gouv.fr)
│
├── Schema: alecia_numbers
│   ├── financial_models (3-statement)
│   ├── valuations (multiples, DCF)
│   ├── comparables
│   ├── dd_checklists
│   ├── fee_calculations
│   ├── timelines (Gantt)
│   ├── teaser_tracking
│   ├── post_deal_integration
│   ├── pipeline_snapshots
│   └── spreadsheets (FortuneSheet data)
│
├── Schema: alecia_flows (Activepieces internal)
│   ├── flows
│   ├── flow_runs
│   ├── connections
│   └── triggers
│
├── Schema: alecia_sign (DocuSeal internal)
│   ├── templates
│   ├── submissions
│   ├── submitters
│   └── documents (encrypted, refs Minio)
│
├── Schema: alecia_colab
│   ├── documents
│   ├── document_versions
│   ├── boards (kanban)
│   ├── lists
│   ├── cards
│   ├── labels
│   ├── checklists
│   ├── presentations
│   └── yjs_state (Hocuspocus persistence)
│
├── Schema: alecia_cms (Strapi internal)
│   ├── blog_posts
│   ├── transactions (tombstones)
│   ├── team_members
│   ├── job_offers
│   ├── marketing_kpis
│   ├── page_content
│   └── media_library
│
└── Schema: alecia_analytics (Plausible internal)
    ├── sites
    ├── goals
    └── session data (ClickHouse)
```

### Cross-Tool Data Access Patterns

| Source Tool | Accesses | Target Schema | Method |
|------------|----------|---------------|--------|
| BI → Numbers | Deal financials for valuation | `alecia_numbers.valuations` | Cross-schema JOIN |
| Flows → Sign | Trigger signing workflow | `alecia_sign` | DocuSeal REST API |
| Flows → BI | Create deal from automation | `shared.deals` | Direct INSERT |
| Colab → BI | Link document to deal | `shared.deals` | FK reference |
| Sign → BI | Update deal after signing | `shared.deals` | Webhook → API |
| Analytics → CMS | Track content performance | `alecia_cms.blog_posts` | Plausible API |
| Numbers → Colab | Embed spreadsheet in doc | `alecia_numbers.spreadsheets` | iframe / API |

### Blob Storage (Minio)

```
Minio Buckets:
├── alecia-documents/     # Data room files, contracts, NDAs
├── alecia-signatures/    # Signed PDFs, signature images
├── alecia-media/         # CMS uploads, logos, team photos
├── alecia-exports/       # Generated reports, Excel exports
├── alecia-presentations/ # Slide images, AI-generated visuals
└── alecia-backups/       # Database backups, encrypted
```

All documents stored with **server-side encryption** (SSE-S3). Presigned URLs for secure, time-limited access.

---

## 4. Tool 1: alecia — Marketing Site

### Strategy: Keep Custom

The marketing site is production-ready with bilingual support, SEO optimization, and a sophisticated component architecture. No fork needed.

### Current Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | Next.js (App Router) | 15.3.6 |
| React | React | 19.2.3 |
| Styling | Tailwind CSS | 4.x |
| UI Components | shadcn/ui + Radix | Latest |
| i18n | next-intl | 4.7.0 |
| Forms | react-hook-form + Zod | 7.71.1 / 3.23.8 |
| Animations | Framer Motion | 12.29.2 |
| Icons | Lucide React | 0.562.0 |

### Features (Production-Ready)

- **Marketing pages**: Home (HeroVideo, KPIs, InteractiveMap), Expertises, Operations (tombstones), Équipe, Actualités, Contact, Secteurs, Estimation wizard
- **Lead generation**: Valuation wizard, Sell wizard, Buy wizard, Contact forms
- **SEO**: Sitemap, robots.txt, structured data, hreflang, OpenGraph
- **i18n**: Full FR/EN, locale-prefixed routes
- **Accessibility**: WCAG 2.1 AA compliant, skip navigation, semantic HTML
- **Performance**: Lazy loading, code splitting, image optimization, ISR caching

### Migration Path

1. Replace Convex data fetching with Strapi REST/GraphQL API calls
2. Replace Clerk auth with Keycloak OIDC
3. Deploy as Docker container via Coolify
4. Point `alecia.fr` DNS to VPS

---

## 5. Tool 2: alecia.fr — CMS Backend (Strapi)

### Strategy: Slim Fork

The current visual editor has reliability issues. Strapi CE provides a battle-tested headless CMS with a clean admin panel, simpler than Payload.

### Fork Source

| Property | Value |
|----------|-------|
| Repository | `strapi/strapi` |
| License | MIT |
| Language | TypeScript + Node.js |
| Database | PostgreSQL (native) |
| API | REST + GraphQL |
| Admin UI | React |

### What We Fork & Customize

**Keep:**
- Content Type Builder (blog posts, transactions, team members, job offers)
- Media Library (images, PDFs → Minio S3 provider)
- REST + GraphQL API generation
- Role-Based Access Control (editorial roles)
- i18n plugin (FR/EN content)
- Webhook system (notify Flows on content changes)

**Strip:**
- Cloud/SaaS features
- Telemetry
- Marketplace integrations not needed
- Default Strapi branding

**Add:**
- Alecia brand theme (midnight blue admin panel)
- Custom content types:
  - `Transaction` (deal tombstones with sector, year, type, logo)
  - `TeamMember` (bio FR/EN, expertise, photo, LinkedIn)
  - `MarketingKPI` (label, value, icon, order)
  - `SectorExpertise` (name, description, icon, stats)
  - `LocationOffice` (city, address, coordinates, image)
- Minio S3 upload provider (replace local file storage)
- Keycloak SSO plugin for admin authentication
- Custom API endpoints for marketing site consumption

### Content Types Schema

```typescript
// Transaction (M&A tombstone)
{
  title: string,           // "Acquisition stratégique"
  companyName: string,     // "TechCorp SAS"
  sector: enum,            // "Tech", "Santé", "Industrie"...
  dealType: enum,          // "Cession", "Acquisition", "LBO"
  year: number,            // 2025
  logoUrl: media,          // Company logo
  description: richtext,   // Case study (FR/EN)
  isConfidential: boolean, // Hide company name
  featured: boolean,       // Show on homepage
}

// TeamMember
{
  fullName: string,
  role: string,            // "Associé", "Analyste"
  bioFr: richtext,
  bioEn: richtext,
  photo: media,
  expertise: string[],     // ["M&A", "LBO", "Private Equity"]
  linkedinUrl: string,
  email: string,
  officeLocation: string,  // "Paris", "Nice"
  order: number,           // Display order
}

// BlogPost
{
  title: string,
  slug: string,
  content: richtext,
  excerpt: string,
  coverImage: media,
  category: enum,          // "Actualités", "Insights", "Marché"
  author: relation(TeamMember),
  publishedAt: datetime,
  locale: enum,            // "fr", "en"
  seoTitle: string,
  seoDescription: string,
}
```

### Data Flow

```
Strapi Admin (cms.alecia.fr)
  → Content editors create/edit content
  → Strapi stores in alecia_cms PostgreSQL schema
  → Webhooks notify Activepieces (Flows) on publish
  → Next.js marketing site fetches via REST API
  → ISR revalidation on content change
```

---

## 6. Tool 3: Alecia Business Intelligence — CRM + Research

### Strategy: Enhance Custom + Add Research Tools

The CRM core (deals, companies, contacts, pipeline) is already functional. Rather than replacing with Twenty CRM, we strengthen the existing implementation and add intelligence gathering capabilities.

### Current Implementation (Keep & Migrate to PostgreSQL)

**CRM Core — Already Built:**

| Feature | Status | Source Files |
|---------|--------|-------------|
| Deals pipeline (8 stages) | ✅ Production | `convex/deals.ts` |
| Companies + Pappers enrichment | ✅ Production | `convex/companies.ts`, `convex/actions/intelligence.ts` |
| Contacts management | ✅ Production | `convex/contacts.ts` |
| Pipeline analytics + stage history | ✅ Production | `convex/pipeline.ts` |
| Deal flow visualization (React Flow) | ✅ Production | `@xyflow/react` |
| Pipedrive bidirectional sync | ✅ Production | `convex/pipedrive.ts` |
| Microsoft 365 integration | ✅ Production | `convex/actions/microsoft.ts` |
| Approval workflows | ✅ Production | `convex/approvals.ts` |

**AI Capabilities — Already Built:**

| AI Feature | Model | Description |
|-----------|-------|-------------|
| Deal summary generation | Groq LLaMA 3.3 70B | French professional summaries |
| Risk scoring | Groq LLaMA 3.3 70B | DD-based risk analysis (0-100 score) |
| Teaser generation | Groq LLaMA 3.3 70B | Auto M&A teaser (5 sections) |
| Valuation suggestions | Groq LLaMA 3.3 70B | Sector-adjusted multiples range |
| Document summarization | Groq LLaMA 3 | Brief/detailed/bullets styles |
| Key terms extraction | Groq LLaMA 3 | LOI/NDA/SPA clause analysis |
| Translation (FR↔EN) | Groq LLaMA 3 | Legal-precision translation |
| Deal-buyer matching | OpenAI embeddings | Vector similarity (1536 dim) |
| Market study generation | DeepSeek v3.2 | Full sector analysis workflow |

**Microsoft 365 Integration — Custom Built:**

| Capability | API | Status |
|-----------|-----|--------|
| OneDrive file browsing | Graph API | ✅ Built |
| OneDrive file search | Graph API | ✅ Built |
| Excel read/write ranges | Graph API | ✅ Built |
| Excel financial data parsing | Custom | ✅ Built (French terms regex) |
| SharePoint integration | Graph API | ✅ Built |
| Calendar sync (MS + Google) | Graph + Calendar API | ✅ Built |
| OAuth token refresh | Custom | ✅ Built |

### New: Research & Intelligence Layer

**Add Miniflux (RSS Intel Aggregator)**

| Property | Value |
|----------|-------|
| Repository | `miniflux/v2` |
| License | Apache 2.0 |
| Language | Go |
| Database | PostgreSQL (native) |

Purpose: Aggregate M&A news, sector intelligence, competitor monitoring, regulatory updates.

Configured feeds:
- Les Echos M&A, Capital Finance, CFNEWS, Fusacq
- Reuters M&A France, Bloomberg deals
- Sector-specific feeds (per active deal sectors)
- data.gouv.fr RSS (regulatory changes)
- LinkedIn company news (via RSS bridge)

Integration with BI: Miniflux API → Activepieces workflow → categorize & tag → surface in BI dashboard.

**Add SearXNG (Self-Hosted Research Engine)**

| Property | Value |
|----------|-------|
| Repository | `searxng/searxng` |
| License | AGPL-3.0 |
| Language | Python |
| Database | None (stateless) |

Purpose: Privacy-preserving meta-search for company research, market data, regulatory filings.

Features:
- Searches Google, Bing, DuckDuckGo, Wikipedia simultaneously
- No tracking, no ads, no data collection
- API endpoint for programmatic queries from BI/Flows
- Custom search categories: "M&A France", "Regulatory", "Sector"

**French Open Data APIs:**

| Source | API | Data |
|--------|-----|------|
| Pappers | REST API | SIREN lookup, financials, executives, legal filings |
| INSEE | REST API | National statistics, sector codes (NAF), demographic data |
| data.gouv.fr | REST API | Company registrations, bankruptcies, regulatory data |
| Infogreffe | REST API | Commercial court filings, KBis extracts |
| BODACC | RSS + API | Official announcements (cessions, liquidations) |

### Data Model (PostgreSQL Migration)

```sql
-- Schema: shared (cross-tool)
CREATE TABLE shared.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  stage deal_stage NOT NULL DEFAULT 'sourcing',
  amount NUMERIC(15,2),
  currency TEXT DEFAULT 'EUR',
  probability INTEGER CHECK (probability BETWEEN 0 AND 100),
  owner_id UUID REFERENCES shared.users(id),
  company_id UUID REFERENCES shared.companies(id),
  priority deal_priority DEFAULT 'medium',
  tags TEXT[],
  expected_close_date TIMESTAMPTZ,
  source TEXT DEFAULT 'manual',
  pipedrive_id BIGINT,
  external_id TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shared.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  siren CHAR(9),
  naf_code TEXT,
  vat_number TEXT,
  website TEXT,
  logo_url TEXT,
  address JSONB, -- {street, city, zip, country}
  financials JSONB, -- {revenue, ebitda, netDebt, year, currency}
  pappers_data JSONB, -- Full Pappers enrichment cache
  pipedrive_id TEXT,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shared.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES shared.companies(id),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  tags TEXT[],
  external_id TEXT,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schema: alecia_bi
CREATE TABLE alecia_bi.embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'deal', 'company', 'buyer_criteria'
  entity_id UUID NOT NULL,
  embedding vector(1536), -- pgvector
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE alecia_bi.research_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  miniflux_feed_id INTEGER,
  category TEXT, -- 'M&A', 'sector', 'regulatory', 'competitor'
  deal_id UUID REFERENCES shared.deals(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. Tool 4: Alecia Numbers — M&A Financial Framework

### Strategy: Enhance Custom

The 10 M&A tools are already production-ready. No fork needed. Migrate from Convex to PostgreSQL and strengthen reliability.

### Existing Tools (All Functional)

| # | Tool | Type | Key Formulas |
|---|------|------|-------------|
| 1 | Due Diligence Checklist | Interactive checklist | COUNTA, COUNTIF completion tracking |
| 2 | Valuation Multiples | Calculator + charts | MEDIAN, AVERAGE on EV/Sales, EV/EBITDA |
| 3 | 3-Statement Financial Model | Full spreadsheet | P&L + Balance Sheet + Cash Flow (8 years) |
| 4 | Comparable Companies | Analysis table | Statistical analysis (median, std dev) |
| 5 | Deal Pipeline Dashboard | Dashboard + Kanban | SUMPRODUCT weighted probability |
| 6 | Buyer/Seller CRM | Contact database | COUNTA, COUNTIF active tracking |
| 7 | Teaser/IM Tracking | Distribution tracker | Response rate, NDA conversion |
| 8 | Deal Timeline | Gantt chart | COUNTIF completion, dependencies |
| 9 | Fee Calculator | Lehman formula | Tiered success fee (5%/4%/3%/2%) |
| 10 | Post-Deal Integration | Phased checklist | J+30/J+90/J+180 tracking |

### Tech Stack

| Component | Technology | Status |
|-----------|-----------|--------|
| Spreadsheet engine | FortuneSheet (@fortune-sheet/react 1.0.4) | ✅ Production |
| Charts | Recharts 3.6.0 | ✅ Production |
| Excel import/export | xlsx 0.18.5 + papaparse 5.5.3 | ✅ Production |
| Forms | react-hook-form 7.71.1 + Zod 3.23.8 | ✅ Production |
| PDF generation | pdf-lib 1.17.1 | ✅ Production |
| Backend | Convex → PostgreSQL (migration) | 🔄 Planned |

### Enhancement Plan

1. **Reliability**: Add comprehensive error boundaries, input validation, auto-save with conflict resolution
2. **Excel interop**: Improve Microsoft Graph integration — read client Excel files directly from OneDrive, write results back
3. **Templates**: Pre-populate tools from deal data (select deal → auto-fill financials)
4. **Collaboration**: Real-time sharing via Hocuspocus (same Yjs server as Colab)
5. **Export quality**: Professional PDF reports with Alecia branding, watermarks

---

## 8. Tool 5: Alecia Flows — Workflow Automation (Activepieces)

### Strategy: Slim Fork

Activepieces replaces n8n (which was not FOSS). It's lighter, TypeScript-native, PostgreSQL-native, and MIT-licensed.

### Fork Source

| Property | Value |
|----------|-------|
| Repository | `activepieces/activepieces` |
| License | MIT |
| Language | TypeScript (frontend + backend) |
| Framework | Angular (UI) + NestJS (API) |
| Database | PostgreSQL (native) |
| Queue | Redis + BullMQ |

### Why Activepieces Over n8n

| Criteria | n8n | Activepieces | Winner |
|----------|-----|-------------|--------|
| License | Sustainable Use (NOT FOSS) | MIT | **Activepieces** |
| Weight | Heavy (350+ nodes) | Lighter (~100 pieces) | **Activepieces** |
| Language | TypeScript | TypeScript | Tie |
| DB | PostgreSQL ✅ | PostgreSQL ✅ | Tie |
| Custom nodes | TS classes (INodeType) | TS pieces (createPiece) | Tie |
| Self-hosted cost | Free | Free | Tie |
| MS Graph API | ✅ Native | ❌ Teams only (no Graph) | n8n |
| Community | 45k+ stars | 12k+ stars | n8n |

**Gap: Microsoft Graph API** — Activepieces lacks native Microsoft Graph integration. Solution: build a custom "Alecia Microsoft" piece using the existing `convex/actions/microsoft.ts` code as reference. The OAuth flow, token refresh, and Graph API calls are already written.

### What We Fork & Customize

**Keep:**
- Flow builder UI (Angular visual editor)
- Execution engine (NestJS workers)
- Piece framework (custom piece creation)
- Webhook triggers
- Scheduling (cron)
- PostgreSQL persistence
- Built-in pieces: HTTP, PostgreSQL, Slack, Microsoft Teams, Gmail/SMTP, OpenAI, Webhook, Schedule, Code (JS/TS)

**Strip:**
- Cloud/SaaS billing features
- Telemetry
- Activepieces branding
- Unused pieces (Shopify, Stripe, HubSpot, etc. — keep only M&A-relevant)

**Add:**
- Alecia brand theme (midnight blue, Bierstadt font)
- Keycloak SSO integration
- Custom Alecia pieces (see Section 13)
- Pre-built M&A workflow templates
- Single-tenant mode (no multi-org, just Alecia)

### Pre-Built M&A Workflow Templates

```yaml
1. Deal Onboarding
   Trigger: New deal created in BI
   → Create DD checklist in Numbers
   → Create data room in Sign
   → Notify team via Slack
   → Create calendar events (MS Graph)
   → Send welcome email to client

2. Due Diligence Automation
   Trigger: Deal reaches "due_diligence" stage
   → Assign DD items to team members
   → Send daily progress digest
   → Alert partner on red flags
   → Auto-request missing documents

3. Market Study Pipeline
   Trigger: Manual or scheduled
   → SearXNG company research
   → Pappers API enrichment
   → AI analysis (Groq LLaMA)
   → Generate HTML report
   → Send via email
   (Migrated from Alecia-Study-Step1.json)

4. Signature Workflow
   Trigger: Deal reaches "negotiation" stage
   → Generate NDA from template (DocuSeal)
   → Send for signature
   → Wait for completion
   → Upload signed doc to data room
   → Update deal stage

5. Content Publication
   Trigger: Strapi webhook (blog post published)
   → Notify team via Slack
   → Post on social media (optional)
   → Invalidate Next.js cache
   → Track in Analytics
```

---

## 9. Tool 6: Alecia Sign — E-Signature + Data Room (DocuSeal)

### Strategy: Slim Fork

DocuSeal provides legally-compliant e-signatures, free and unlimited when self-hosted. The existing data room implementation is excellent and will be kept as-is.

### Fork Source

| Property | Value |
|----------|-------|
| Repository | `docuseal/docuseal` |
| License | AGPL-3.0 |
| Language | Ruby on Rails 7 |
| Database | PostgreSQL (native) |
| Storage | S3-compatible (Minio) |
| Signing | Free, unlimited, self-hosted |

### Why DocuSeal Over Others

| Criteria | DocuSeal | OpenSign | DocuSign |
|----------|----------|---------|----------|
| License | AGPL-3.0 ✅ | AGPL-3.0 ✅ | Proprietary ❌ |
| Self-hosted signing | **Free unlimited** | ⚠️ Charges per doc | N/A |
| PDF form builder | ✅ Drag-and-drop | ✅ Basic | ✅ Advanced |
| API | ✅ REST API | ✅ REST API | ✅ REST API |
| PostgreSQL | ✅ Native | ⚠️ MongoDB default | N/A |
| Encrypted docs | ✅ Server-side | ⚠️ Limited | ✅ Yes |
| Template system | ✅ Excellent | ⚠️ Basic | ✅ Excellent |
| Multi-party signing | ✅ Yes | ✅ Yes | ✅ Yes |
| Audit trail | ✅ Full | ✅ Basic | ✅ Full |

### What We Fork & Customize

**Keep:**
- PDF form builder (drag-and-drop field placement)
- Signature capture (draw, type, upload)
- Template system (NDA, LOI, Mandate, SPA templates)
- Multi-party signing workflow
- Audit trail with timestamps
- REST API for programmatic signing
- Webhook notifications (signed, viewed, expired)
- Email notifications
- Encrypted document storage

**Strip:**
- DocuSeal branding
- Cloud features
- Telemetry

**Add:**
- Alecia brand theme
- Keycloak SSO integration
- Minio S3 storage provider (encrypted buckets)
- Custom M&A document templates:
  - NDA (Non-Disclosure Agreement) — FR/EN
  - LOI (Letter of Intent) — FR/EN
  - Mandate Letter (Lettre de mission) — FR
  - SPA (Share Purchase Agreement) — FR/EN
  - Data Room Access Agreement — FR
- Deal linking (sign_request ↔ deal_id)
- Integration with existing data room:
  - Signed documents auto-uploaded to deal's data room folder
  - Access log unified with data room audit trail

### Data Room (Keep Existing Implementation)

The current data room implementation is production-grade:

| Feature | Status |
|---------|--------|
| Room lifecycle (setup → active → closed → archived) | ✅ |
| 9 default DD folders (Legal, Financial, Tax, HR, IP, Commercial, IT, Environmental, Other) | ✅ |
| Document access control (all, buyer_group, seller_only, restricted) | ✅ |
| Audit logging (view, download, print, share with IP/user-agent) | ✅ |
| Q&A system with status tracking | ✅ |
| External user invitations with magic links | ✅ |
| Watermarking (PDF) | ✅ |
| Download restrictions | ✅ |

Migration: Move from Convex to PostgreSQL `alecia_sign` schema. Files from Convex storage → Minio encrypted buckets.

---

## 10. Tool 7: Alecia Colab — Collaborative Workspace

### Strategy: Enhance Custom (Fix Collaboration Layer)

The editor and Kanban are functional, but real-time collaboration is unreliable due to Convex-based Yjs polling. The fix: replace the sync layer with Hocuspocus (MIT), a proper WebSocket Yjs server.

### Current Stack

| Component | Technology | Status |
|-----------|-----------|--------|
| Framework | Next.js 16.1.4 | ✅ |
| Editor | TipTap 3.18.0 + Novel | ✅ |
| CRDT | Yjs 13.6.29 | ✅ (sync unreliable) |
| Sync | Custom Convex polling (2s) | ❌ Root cause of issues |
| Kanban | dnd-kit 6.3.1 | ✅ |
| Deal Flow | @xyflow/react 12.10.0 | ✅ |
| Presentations | AI-generated slides | ⚠️ Basic |

### The Fix: Hocuspocus

| Property | Value |
|----------|-------|
| Repository | `ueberdosis/hocuspocus` |
| License | MIT |
| Language | TypeScript |
| Protocol | WebSocket (native Yjs provider) |
| Database | PostgreSQL (persistence extension) |

**Current architecture (broken):**
```
Client A → Yjs Doc → Convex mutation (every 2s) → Convex DB
Client B → Convex query (reactive, but delayed) → Apply updates → Render
```
Problem: Convex reactive queries introduce 1-3 second latency. Cursor positions are stale. Merge conflicts occur during fast typing.

**New architecture (fixed):**
```
Client A → Yjs Doc → WebSocket → Hocuspocus Server → WebSocket → Client B
                                       ↓
                              PostgreSQL persistence
                              (every 30s or on disconnect)
```
Benefits: Sub-100ms sync, proper cursor tracking, offline resilience, industry-standard Yjs provider.

### Enhancement Plan

1. **Replace Convex Yjs sync with Hocuspocus**
   - Deploy Hocuspocus as Docker container
   - Configure PostgreSQL persistence extension
   - Update TipTap collaboration extensions to use WebSocket provider
   - Remove custom `useYjsSync`, `usePresence`, `ConvexAwarenessProvider` hooks
   - Add authentication middleware (Keycloak JWT verification)

2. **UX Improvements (Notion Parity)**
   - Block-based editing (TipTap already supports this via extensions)
   - Slash commands (already via Novel, improve catalogue)
   - Inline databases (table blocks with filtering/sorting)
   - Page nesting (document hierarchy with sidebar)
   - Cover images and icons for documents
   - Template gallery (meeting notes, deal memos, DD reports)
   - @mentions with user search (Keycloak user directory)

3. **Kanban Enhancements**
   - Card comments with @mentions
   - File attachments (Minio)
   - Recurring cards (weekly tasks)
   - Board templates (DD workflow, deal execution, post-merger)

4. **Reliability**
   - Error boundaries on every major section
   - Optimistic UI with rollback on failure
   - Offline mode (IndexedDB persistence)
   - Auto-reconnect with exponential backoff

---

## 11. Tool 8: Alecia Analytics — Business & Web Analytics (Plausible)

### Strategy: Deploy As-Is + CSS Rebrand

Plausible is AGPL-3.0 (FOSS ✅), GDPR-compliant (no cookies), and provides beautiful analytics dashboards. Don't fork the Elixir codebase — deploy the official Docker image and rebrand via CSS overrides.

### Deployment Source

| Property | Value |
|----------|-------|
| Repository | `plausible/analytics` |
| License | AGPL-3.0 |
| Language | Elixir + Phoenix |
| Database | PostgreSQL + ClickHouse |
| Tracking | Cookie-less, GDPR-compliant |

### Features (Out of the Box)

| Feature | Description |
|---------|-------------|
| Visitors & pageviews | Real-time and historical |
| Bounce rate | Session-based calculation |
| Visit duration | Average time on site |
| Top pages | Most visited URLs |
| Traffic sources | Referrers, UTM campaigns |
| Geographic data | Country, region, city |
| Device breakdown | Desktop/mobile/tablet, browser, OS |
| Goal tracking | Custom events, conversions |
| Shared dashboards | Public or private links |
| Stats API | Programmatic data access |

### Branding Customization

Since we don't fork Plausible's Elixir code, branding is applied via:

1. **Custom CSS injection** (Docker environment variable `EXTRA_CSS`):
```css
/* Alecia Analytics brand override */
:root {
  --primary: #061a40;          /* alecia-midnight */
  --primary-dark: #163e64;     /* alecia-corporate */
  --accent: #4370a7;           /* alecia-mid-blue */
}
/* Hide Plausible branding */
.plausible-logo, footer a[href*="plausible"] { display: none; }
/* Add Alecia logo via background-image on header */
header::before {
  content: "";
  background-image: url('/alecia-analytics-logo.svg');
  /* ... sizing ... */
}
```

2. **Reverse proxy path rewriting** (Caddy):
```
analytics.alecia.fr {
  reverse_proxy plausible:8000
  header Content-Security-Policy "..."
}
```

3. **Tracking snippet** (Next.js marketing site):
```html
<script defer data-domain="alecia.fr" src="https://analytics.alecia.fr/js/script.js"></script>
```

### Dual Analytics Strategy

| Layer | Tool | Purpose |
|-------|------|---------|
| Web analytics | Plausible | Public site traffic (GDPR-compliant) |
| Business analytics | Custom dashboards | Internal M&A metrics (pipeline velocity, deal conversion, team performance) |

Business analytics are built into the BI admin panel using Recharts, pulling directly from PostgreSQL views.

---

## 12. Supporting Services & Utilities

Beyond the 8 core tools, the Alecia Suite includes specialized services for document processing, AI intelligence, search, and security.

### Haystack — AI Document Intelligence

| Property | Value |
|----------|-------|
| Repository | `deepset-ai/haystack` |
| License | Apache 2.0 |
| Language | Python |
| Database | PostgreSQL (via pgvector) |

**Purpose:** Semantic search across due diligence document corpus. When 500+ DD documents are uploaded to a data room, Haystack indexes them and enables natural-language queries like "What are the key IP risks?" or "Find all clauses related to non-compete."

**Capabilities:**
- Semantic search across PDF/Word/Excel documents
- Key term extraction from legal documents (NDA, LOI, SPA)
- Clause comparison across multiple document versions
- Risk flag detection using fine-tuned models
- Integration with pgvector for embedding storage

**Integration:**
- Called via REST API from BI and Flows
- Custom `@alecia/piece-research` action: `semanticSearch`
- Embeddings stored in `alecia_bi.embeddings` table (1536 dimensions)
- Document ingestion triggered by Activepieces when files are uploaded to data room

### Stirling-PDF — PDF Toolkit

| Property | Value |
|----------|-------|
| Repository | `Stirling-Tools/Stirling-PDF` |
| License | MIT |
| Language | Java |
| Deployment | Docker (stateless) |

**Purpose:** Prepare and manipulate PDF documents throughout the M&A deal lifecycle. Handles the messy reality of client uploads: scanned documents needing OCR, multiple files to merge, metadata to strip for confidentiality.

**Capabilities:**
- Merge multiple PDFs (combine DD documents into packages)
- Split PDFs (extract sections for specific buyers)
- OCR scanned documents (make searchable for Haystack)
- Compress large files (reduce data room sizes)
- Add watermarks (confidential stamps, buyer-specific marks)
- Remove metadata (strip author info for anonymization)
- Convert formats (Word/Excel/PowerPoint → PDF)

**Integration:**
- REST API called by BI and Flows
- Pre-processing step before Gotenberg (clean → generate)
- Pre-processing step before Haystack (OCR → index)

### Gotenberg — PDF Generation

| Property | Value |
|----------|-------|
| Repository | `gotenberg/gotenberg` |
| License | MIT |
| Language | Go (Chromium engine) |
| Deployment | Docker (stateless) |

**Purpose:** Generate professional branded PDF reports from HTML templates. Renders React/Next.js components into PDF using headless Chromium, producing pixel-perfect valuation reports, deal summaries, and teaser documents with Alecia letterheads.

**Capabilities:**
- HTML to PDF conversion (Chromium rendering)
- Valuation report generation (from Numbers data)
- Deal summary documents (from BI data + AI summaries)
- Teaser/IM documents (branded, bilingual FR/EN)
- Closing reports and tombstones
- Custom headers/footers with Alecia branding

**Integration:**
- REST API called by Flows and Numbers
- Pipeline: Numbers data → HTML template → Gotenberg → PDF → DocuSeal/Minio

### Vaultwarden — Password & Credential Manager

| Property | Value |
|----------|-------|
| Repository | `dani-garcia/vaultwarden` |
| License | AGPL-3.0 |
| Language | Rust |
| Database | SQLite (embedded) |

**Purpose:** Secure credential sharing across the M&A team. Store and share API keys (Pappers, Groq, Microsoft Graph), client credentials, data room access codes, and deal-specific passwords.

**Capabilities:**
- Team password vault (encrypted, zero-knowledge)
- Secure credential sharing (time-limited, per-deal)
- API key management for external services
- Client credentials storage (for OAuth tokens)
- Bitwarden-compatible clients (browser, mobile, desktop)

**Deployment:** Docker image, minimal branding needed (internal tool).

### Flowchart.fun — Visual Diagrams

| Property | Value |
|----------|-------|
| Repository | `tone-row/flowchart-fun` |
| License | MIT |
| Language | TypeScript (React) |
| Deployment | Docker (static site) |

**Purpose:** Quick deal structure diagrams and organizational charts. Advisors sketch acquisition structures, holding company hierarchies, and post-merger integration plans using a text-to-flowchart interface.

**Capabilities:**
- Text-based flowchart creation (fast for M&A advisors)
- Deal structure diagrams (buyer/seller/SPV hierarchy)
- Organizational charts (pre/post-merger)
- Export to SVG/PNG for embedding in documents
- Integration with Gotenberg for PDF inclusion

**Deployment:** Static React app, hosted via Docker + Caddy.

### Optional: Meilisearch — Full-Text Search

| Property | Value |
|----------|-------|
| Repository | `meilisearch/meilisearch` |
| License | MIT |
| Language | Rust |
| Status | Optional — deploy if PostgreSQL full-text search proves insufficient |

**Purpose:** Typo-tolerant, instant search across deals, companies, contacts, and documents. If PostgreSQL `tsvector` + `pg_trgm` doesn't deliver fast enough autocomplete UX, Meilisearch provides sub-50ms faceted search with relevance ranking.

**When to add:** Phase 4 (Polish), only if search UX needs improvement.

---

## 13. Inter-Service Communication

### Communication Matrix

```
                    ┌─────────────────────────────────────────┐
                    │            Keycloak (SSO)                │
                    │     OIDC tokens for all services         │
                    └─────────┬───────────────────┬───────────┘
                              │                   │
         ┌────────────────────┼───────────────────┼────────────────────┐
         │                    │                   │                    │
    ┌────▼────┐          ┌────▼────┐         ┌────▼────┐         ┌────▼────┐
    │ alecia  │◄─REST──► │ Strapi  │         │  Flows  │◄─API──► │  Sign   │
    │ (site)  │          │ (CMS)   │         │(Active- │         │(Docu-   │
    │         │          │         │         │ pieces) │         │ Seal)   │
    └────┬────┘          └────┬────┘         └────┬────┘         └────┬────┘
         │                    │                   │                    │
         │              ┌─────▼─────┐             │                   │
         │              │PostgreSQL │◄────────────┘                   │
         │              │ (shared)  │◄────────────────────────────────┘
         │              └─────┬─────┘
         │                    │
    ┌────▼────┐          ┌────▼────┐         ┌─────────┐         ┌─────────┐
    │   BI    │◄─JOIN──► │ Numbers │         │  Colab  │         │Analytics│
    │  (CRM)  │          │(finance)│         │ (collab)│         │(Plaus.) │
    └─────────┘          └─────────┘         └────┬────┘         └─────────┘
                                                  │
                                             ┌────▼────┐
                                             │Hocus-   │
                                             │pocus    │
                                             │(WebSocket)│
                                             └─────────┘
```

### Communication Patterns

| Pattern | Used For | Example |
|---------|----------|---------|
| **Cross-schema JOIN** | Same-database tools | BI reads Numbers valuations for deal enrichment |
| **REST API call** | Cross-container tools | Flows triggers DocuSeal signing via REST API |
| **Webhook** | Event-driven | Strapi publishes blog → webhook → Flows → notify Slack |
| **Shared PostgreSQL** | Data consistency | Deals table referenced by BI, Numbers, Sign, Colab |
| **WebSocket** | Real-time sync | Colab documents via Hocuspocus |
| **S3 (Minio)** | File sharing | Sign stores signed PDFs → BI data room references them |
| **OIDC token** | Authentication | All services verify Keycloak JWT |

### Event Bus (via Activepieces)

Activepieces acts as the central event orchestrator. Services emit events via webhooks, Activepieces routes them:

```
Event: deal.stage_changed
  → If stage = "due_diligence": Create DD checklist (Numbers)
  → If stage = "negotiation": Generate NDA (Sign)
  → If stage = "closed_won": Notify team (Slack), create tombstone (CMS)
  → Always: Log to audit trail, update Analytics

Event: document.signed
  → Upload to data room (Sign → Minio)
  → Update deal metadata (BI)
  → Notify deal owner (Slack/Email)

Event: blog.published
  → Invalidate Next.js cache
  → Post to LinkedIn (optional)
  → Track in Analytics
```

---

## 14. Custom Integration Nodes

### Activepieces Custom Pieces for Alecia Suite

Each custom piece is a TypeScript package following Activepieces' `createPiece` API:

#### Piece 1: `@alecia/piece-crm`
**Connects to:** Shared PostgreSQL (`shared.deals`, `shared.companies`, `shared.contacts`)

| Action | Description |
|--------|-------------|
| `createDeal` | Create new deal with stage, amount, company link |
| `updateDealStage` | Move deal to next pipeline stage |
| `searchCompanies` | Search companies by name or SIREN |
| `createContact` | Add contact linked to company |
| `enrichCompany` | Call Pappers API to enrich company data |

| Trigger | Description |
|---------|-------------|
| `onDealCreated` | Fires when new deal is inserted |
| `onDealStageChanged` | Fires on deal stage transition |
| `onDealClosed` | Fires when deal reaches closed_won/closed_lost |

#### Piece 2: `@alecia/piece-numbers`
**Connects to:** PostgreSQL (`alecia_numbers.*`)

| Action | Description |
|--------|-------------|
| `createValuation` | Create valuation from deal financials |
| `calculateFees` | Run Lehman formula on deal amount |
| `createDDChecklist` | Instantiate DD checklist template for deal |
| `getFinancialModel` | Retrieve 3-statement model data |

| Trigger | Description |
|---------|-------------|
| `onValuationSaved` | Fires when valuation is computed |
| `onDDRedFlag` | Fires when DD item marked as "red flag" |

#### Piece 3: `@alecia/piece-sign`
**Connects to:** DocuSeal REST API

| Action | Description |
|--------|-------------|
| `createSigningRequest` | Send document for e-signature |
| `createFromTemplate` | Use NDA/LOI template, pre-fill deal data |
| `getSigningStatus` | Check if document is signed |
| `uploadToDataRoom` | Move signed doc to deal's data room |

| Trigger | Description |
|---------|-------------|
| `onDocumentSigned` | Webhook from DocuSeal |
| `onDocumentViewed` | Webhook from DocuSeal |
| `onSigningExpired` | Webhook from DocuSeal |

#### Piece 4: `@alecia/piece-microsoft`
**Connects to:** Microsoft Graph API (custom OAuth, ported from existing code)

| Action | Description |
|--------|-------------|
| `readExcelRange` | Read cells from OneDrive Excel file |
| `writeExcelRange` | Write data to OneDrive Excel file |
| `listOneDriveFiles` | Browse OneDrive folders |
| `createCalendarEvent` | Schedule meeting via Outlook |
| `sendEmail` | Send email via Graph API |

| Trigger | Description |
|---------|-------------|
| `onCalendarEvent` | New calendar event created |
| `onFileModified` | OneDrive file change detection |

#### Piece 5: `@alecia/piece-research`
**Connects to:** SearXNG API + Miniflux API + Pappers API

| Action | Description |
|--------|-------------|
| `searchWeb` | SearXNG meta-search |
| `searchPappers` | French company lookup by name or SIREN |
| `getLatestFeeds` | Fetch recent RSS articles from Miniflux |
| `enrichWithOpenData` | INSEE / data.gouv.fr API calls |
| `semanticSearch` | Haystack semantic search across DD documents |

#### Piece 6: `@alecia/piece-ai`
**Connects to:** Groq API + OpenAI API

| Action | Description |
|--------|-------------|
| `generateDealSummary` | AI-powered deal summary (French) |
| `scoreDealRisk` | DD-based risk analysis |
| `generateTeaser` | M&A teaser document |
| `suggestValuation` | Sector-adjusted valuation range |
| `summarizeDocument` | Document summarization |
| `translateDocument` | FR↔EN legal translation |
| `generateEmbedding` | Vector embedding for matching |

#### Piece 7: `@alecia/piece-colab`
**Connects to:** Colab API (internal)

| Action | Description |
|--------|-------------|
| `createDocument` | Create new document in Colab |
| `createBoardCard` | Add card to Kanban board |
| `updateCardStatus` | Move card between lists |
| `notifyUser` | Send in-app notification |

---

## 15. Brand Identity System

### Color Palette

```css
/* Primary Blues */
--alecia-midnight:    #061a40;  /* Primary brand, text, headings */
--alecia-corporate:   #163e64;  /* Secondary, hover states */
--alecia-mid-blue:    #4370a7;  /* Accents, links, rings */
--alecia-light-blue:  #749ac7;  /* Subtle accents */
--alecia-pale-blue:   #bfd7ea;  /* Backgrounds, borders */
--alecia-ice-blue:    #e3f2fd;  /* Light backgrounds */

/* Accent */
--alecia-red:         #b80c09;  /* Destructive actions, alerts */

/* Neutrals */
--alecia-titanium:    #6f7a8f;  /* Muted text */
--alecia-steel:       #aab1be;  /* Secondary text */
--alecia-cloud:       #e6e8ec;  /* Borders, dividers */
--alecia-chrome:      #c8ccd5;  /* Input backgrounds */
--alecia-off-white:   #fafafc;  /* Page background */
```

### Typography

| Usage | Font | Weight | Fallback |
|-------|------|--------|----------|
| Headings | Bierstadt | 600 (semibold) | system-ui |
| Body | Bierstadt | 400 (regular) | system-ui |
| Accents | Playfair Display | 600 | serif |
| Code | JetBrains Mono | 400 | monospace |

### Brand Application Per Tool

| Tool | Primary Branding Points |
|------|----------------------|
| Marketing site | Full Alecia design system, custom components |
| Strapi admin | Custom admin theme (CSS + logo override) |
| Activepieces | Angular theme override, logo, piece icons |
| DocuSeal | Rails asset pipeline, CSS variables, email templates |
| Plausible | CSS injection via Docker env, logo override |
| Colab | Full Alecia design system (shared @alepanel/ui) |
| Keycloak | Custom theme (FreeMarker templates + CSS) |
| Miniflux | CSS override, minimal branding needed (internal) |

---

## 16. Migration & Deployment Strategy

### Phase 0: Infrastructure (Week 1-2)

| Task | Details |
|------|---------|
| Provision OVH VPS | 8 vCPU, 32 GB RAM, 400 GB NVMe |
| Install Coolify | Single-node Docker orchestration |
| Deploy Caddy | Wildcard TLS for *.alecia.fr |
| Deploy PostgreSQL 16 | With pgvector extension, create schemas |
| Deploy Minio | Configure encrypted buckets |
| Deploy Redis | For Activepieces queues + caching |
| Deploy Keycloak | Configure realm "alecia", create OIDC clients |
| Deploy Vaultwarden | Team credential management |

### Phase 1: Quick Wins (Week 3-5)

| Task | Details |
|------|---------|
| Deploy Plausible | Docker image + CSS rebrand + tracking snippet |
| Deploy Miniflux | Configure M&A RSS feeds |
| Deploy SearXNG | Configure search categories |
| Deploy Stirling-PDF | Docker image, configure via Caddy |
| Deploy Gotenberg | Docker image, test HTML-to-PDF pipeline |
| Deploy Flowchart.fun | Static React app via Docker |
| Fork Activepieces | Strip, rebrand, build 2 initial pieces (@alecia/piece-crm, @alecia/piece-ai) |
| Fork DocuSeal | Strip, rebrand, configure Minio storage, create NDA template |

### Phase 2: Core Migration (Week 6-10)

| Task | Details |
|------|---------|
| Fork Strapi CE | Create content types, configure Minio, Keycloak SSO |
| Deploy Haystack | AI document intelligence, pgvector integration |
| Migrate CRM data | Convex deals/companies/contacts → PostgreSQL shared schema |
| Migrate Numbers data | Convex numbers_* tables → PostgreSQL alecia_numbers schema |
| Update marketing site | Replace Convex API calls with Strapi REST |
| Replace Clerk with Keycloak | All apps switch to OIDC |
| Build remaining Activepieces pieces | @alecia/piece-sign, @alecia/piece-microsoft, @alecia/piece-research |

### Phase 3: Colab Overhaul (Week 11-14)

| Task | Details |
|------|---------|
| Deploy Hocuspocus | WebSocket Yjs server with PostgreSQL persistence |
| Rewrite Colab sync layer | Remove Convex Yjs hooks, connect to Hocuspocus |
| UX improvements | Notion-like blocks, slash commands, page hierarchy |
| Kanban enhancements | Comments, attachments, templates |
| Migrate Colab data | Convex colab_* tables → PostgreSQL alecia_colab schema |

> **UX Study References:** Study Plane (Kanban/Gantt board UX), AFFiNE (Notion-like blocks), Focalboard (multi-view boards), Planka (clean Kanban UX) for design patterns and interaction models.

### Phase 4: Polish & Harden (Week 15-20)

| Task | Details |
|------|---------|
| SSO unification | All subdomains use Keycloak seamlessly |
| Monitoring | Uptime checks, PostgreSQL monitoring, log aggregation |
| Backups | Automated daily PostgreSQL dumps + Minio replication |
| Performance | CDN for static assets, connection pooling (PgBouncer) |
| Security audit | OWASP top 10, SSL Labs A+, penetration testing |
| Documentation | User guides, API docs, runbooks |
| Optional: Meilisearch | Deploy if PostgreSQL search UX insufficient |
| Optional: BookStack | Internal documentation wiki if needed |

---

## 17. Reference Repos to Study

These open-source repositories serve as architectural references, UX inspiration, and feature benchmarks. They are **not forks** — they inform how we build and improve the Alecia Suite.

### Kanban & Gantt UX (Critical for Colab + BI)

| Repository | License | Stars | What to Study |
|-----------|---------|-------|---------------|
| **Plane** (`makeplane/plane`) | Apache 2.0 | 30k+ | Board views with timeline/Gantt, sprint planning, issue grouping, multi-view switching. **Highest priority** — directly informs Colab Kanban enhancements. |
| **Focalboard** (`mattermost-community/focalboard`) | AGPL-3.0 | 22k+ | Multi-view boards (Kanban/table/calendar/gallery from same data), property types, filtering system. Informs BI dashboard views. |
| **Planka** (`plankanban/planka`) | AGPL-3.0 | 8k+ | Clean, minimalist Kanban UX. Study for visual simplicity and smooth drag-and-drop interactions. |

### Notion-like Editor UX (Critical for Colab)

| Repository | License | Stars | What to Study |
|-----------|---------|-------|---------------|
| **AFFiNE** (`toeverything/AFFiNE`) | MIT | 42k+ | Block-based editor with whiteboard, knowledge base, page nesting, inline databases. **Key reference** for Colab's Notion parity goal. Uses Yjs (same as us). |
| **CryptPad** (`cryptpad/cryptpad`) | AGPL-3.0 | 6k+ | End-to-end encrypted real-time collaboration. Study for encrypted document patterns relevant to VDR/data room. |

### ERP & CRM Architecture (Informational for BI)

| Repository | License | Stars | What to Study |
|-----------|---------|-------|---------------|
| **ERPNext** (`frappe/erpnext`) | GPL-3.0 | 20k+ | Full ERP architecture, project management UI, milestone tracking, form builder patterns. Study for BI admin panel design. |
| **Krayin CRM** (`krayin/laravel-crm`) | MIT | 12k+ | Access control list (ACL) patterns, lead scoring, pipeline management. Study for role-based access in BI. |

### Document & PDF Processing (Direct Integration)

| Repository | License | Stars | What to Study |
|-----------|---------|-------|---------------|
| **Stirling-PDF** (`Stirling-Tools/Stirling-PDF`) | MIT | 50k+ | **Deployed in suite.** PDF manipulation API, OCR pipeline, format conversion. |
| **Gotenberg** (`gotenberg/gotenberg`) | MIT | 8k+ | **Deployed in suite.** HTML-to-PDF via Chromium, API design for document generation. |
| **DocuSeal** (`docuseal/docuseal`) | AGPL-3.0 | 8k+ | **Forked in suite.** E-signature workflow, template system, PDF form builder. |

### AI & Search (Direct Integration)

| Repository | License | Stars | What to Study |
|-----------|---------|-------|---------------|
| **Haystack** (`deepset-ai/haystack`) | Apache 2.0 | 18k+ | **Deployed in suite.** NLP pipelines, RAG patterns, semantic search architecture. |
| **Meilisearch** (`meilisearch/meilisearch`) | MIT | 48k+ | **Optional.** Instant full-text search, typo tolerance, faceted search. Benchmark against PostgreSQL full-text. |

### Security & Infrastructure (Direct Integration)

| Repository | License | Stars | What to Study |
|-----------|---------|-------|---------------|
| **Vaultwarden** (`dani-garcia/vaultwarden`) | AGPL-3.0 | 40k+ | **Deployed in suite.** Lightweight Bitwarden server, team credential sharing. |
| **Coolify** (`coollabsio/coolify`) | AGPL-3.0 | 35k+ | **Deployed in suite.** Self-hosted PaaS, Docker orchestration, deployment workflows. |

### How to Use These References

1. **Before building a feature**, check if a reference repo has solved it. Study their implementation, then adapt the pattern to Alecia's architecture.
2. **For UX decisions**, open the reference app and test the interaction. Screenshot the patterns that feel right.
3. **For architecture decisions**, read the repo's data model and API design. Don't copy — adapt to PostgreSQL shared schema.
4. **Priority order**: Plane → AFFiNE → Focalboard → ERPNext → Krayin → Planka → CryptPad

---

## 18. Decision Log

### Decisions Made

| # | Decision | Rationale | Date |
|---|----------|-----------|------|
| 1 | Slim fork strategy | Stability of community codebases + deep customization | 2026-02-07 |
| 2 | Hybrid data architecture | Shared entities (deals, contacts) + isolated tool schemas | 2026-02-07 |
| 3 | Minio for blob storage | S3-compatible, encrypted, FOSS (AGPL-3.0) | 2026-02-07 |
| 4 | Activepieces over n8n | n8n not FOSS (Sustainable Use License), Activepieces is MIT + lighter | 2026-02-07 |
| 5 | Strapi over Directus | Directus not FOSS (BSL 1.1), Strapi is MIT + simpler than Payload | 2026-02-07 |
| 6 | DocuSeal over OpenSign | Free unlimited self-hosted signing, better template system | 2026-02-07 |
| 7 | Hocuspocus for Colab | Current Convex Yjs polling causes collaboration failures | 2026-02-07 |
| 8 | Keep custom Numbers | 10 M&A tools already production-ready, Baserow would be a downgrade | 2026-02-07 |
| 9 | Keep custom BI/CRM | Existing CRM + AI studies are unique, Twenty optional later | 2026-02-07 |
| 10 | Plausible deploy (not fork) | Elixir stack too different, CSS rebrand sufficient | 2026-02-07 |
| 11 | Miniflux for RSS intel | Apache 2.0, PostgreSQL-native, lightweight Go binary | 2026-02-07 |
| 12 | SearXNG for research | Privacy-preserving meta-search, AGPL-3.0, API for automation | 2026-02-07 |
| 13 | Custom MS Graph piece | Activepieces lacks native Graph API, existing code provides foundation | 2026-02-07 |
| 14 | Haystack for AI doc intelligence | Apache 2.0, semantic search across DD corpus, pgvector integration | 2026-02-07 |
| 15 | Stirling-PDF for PDF toolkit | MIT, stateless Docker, handles OCR/merge/split/watermark for DD docs | 2026-02-07 |
| 16 | Gotenberg for PDF generation | MIT, Chromium-based HTML-to-PDF for branded reports | 2026-02-07 |
| 17 | Vaultwarden for credentials | AGPL-3.0, lightweight Bitwarden, team credential sharing | 2026-02-07 |
| 18 | Flowchart.fun for diagrams | MIT, text-to-flowchart for deal structure visualization | 2026-02-07 |
| 19 | Plane as Kanban/Gantt UX reference | Apache 2.0, study board views + timeline for Colab enhancements | 2026-02-07 |
| 20 | AFFiNE as Notion-like UX reference | MIT, study block editor + knowledge base for Colab Notion parity | 2026-02-07 |

### Open Questions (To Resolve During Implementation)

| # | Question | Impact | When to Decide |
|---|----------|--------|----------------|
| 1 | Strapi v4 vs v5? | Plugin compatibility, i18n approach | Phase 2 start |
| 2 | ClickHouse for Plausible — manage separately or let Plausible handle? | Infrastructure complexity | Phase 1 |
| 3 | Hocuspocus single instance or clustered? | Scalability for concurrent editors | Phase 3 |
| 4 | PostgreSQL connection pooling (PgBouncer vs built-in)? | Performance under load | Phase 4 |
| 5 | Custom Keycloak theme — FreeMarker or React? | Development speed vs flexibility | Phase 0 |
| 6 | Pappers API rate limits — cache strategy? | Cost optimization | Phase 2 |

---

*Document generated February 7, 2026 — Alecia Suite Ecosystem Blueprint v2.1*
*Authored collaboratively with Claude Code*
