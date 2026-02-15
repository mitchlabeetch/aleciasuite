# Data Repopulation Guide

## Overview

The production PostgreSQL database can be populated with marketing data (team members, transactions, blog posts, job offers, and KPIs) using the provided seed scripts.

## Background

The original data was migrated from Convex (NoSQL) to PostgreSQL. Backup files from the Convex export are located in:
- `backups/convex_2026-01-22/extracted/` (JSONL files)
- `scripts/migration/data/` (JSON files)

If backup files are not available, the seed script will use hardcoded essential data.

## Running the Seed Script

### Prerequisites

1. PostgreSQL container must be running
2. All migrations must be applied (V001 through V014)
3. Environment variables configured:
   - `DB_CONTAINER` (default: `alecia-postgres`)
   - `DB_USER` (default: `alecia`)
   - `DB_NAME` (default: `alecia`)
   - `POSTGRES_PASSWORD`

### Execute the Seed

```bash
# From the repository root
./scripts/seed-production-data.sh
```

This script will:
1. Apply all pending SQL migrations
2. Import data from backup files (if available) or use hardcoded data
3. Verify that data was inserted correctly

## What Gets Seeded

### Team Members (8 members)
- Name, role, bio (FR/EN)
- LinkedIn URL, email
- Sectors of expertise
- Display order and active status

### Marketing KPIs (4 metrics)
- "Transactions réalisées" → "+50"
- "Associés" → "12"
- "Volumes gérés" → "€2Mds+"
- "Bureaux en France" → "5"

### Optional (if backup files exist)
- Blog posts
- Job offers
- Transactions

## Manual Seed with Essential Data Only

If you want to seed only the hardcoded essential data:

```bash
npx tsx scripts/seed-essential-data.ts
```

## Data Sources in the Application

The public website pages fetch data from PostgreSQL using server actions:

- **File**: `apps/website/src/lib/actions/convex-marketing.ts`
- **Tables**: `shared.team_members`, `shared.transactions`, `shared.blog_posts`, `shared.job_offers`, `shared.marketing_kpis`

Despite the filename containing "convex", these actions query PostgreSQL directly using Drizzle ORM.

## Adding/Editing Data via Admin Panel

Once the database is seeded, you can manage content through the admin panel:

1. Navigate to `/fr/admin/dashboard`
2. Sign in with your credentials
3. Use the CMS sections to add/edit:
   - Team members → `/fr/admin/team`
   - Blog posts → `/fr/admin/blog`
   - Job offers → `/fr/admin/careers`
   - Transactions → `/fr/admin/deals`

## Verifying Data

Check data counts in PostgreSQL:

```bash
docker exec alecia-postgres psql -U alecia -d alecia -c "
SELECT 'team_members' as table_name, count(*) from shared.team_members
UNION ALL SELECT 'transactions', count(*) from shared.transactions
UNION ALL SELECT 'blog_posts', count(*) from shared.blog_posts
UNION ALL SELECT 'job_offers', count(*) from shared.job_offers
UNION ALL SELECT 'marketing_kpis', count(*) from shared.marketing_kpis;
"
```

## Troubleshooting

### "No backup data found"
The script will automatically fall back to hardcoded essential data. This is expected if backup files aren't present.

### "relation does not exist"
Run migrations first:
```bash
for sql_file in infrastructure/postgres/migrations/V*.sql; do
  docker exec -i alecia-postgres psql -U alecia -d alecia < "$sql_file"
done
```

### "connection refused"
Ensure PostgreSQL container is running:
```bash
docker ps | grep alecia-postgres
docker-compose up -d alecia-postgres
```

## Migration History

| Version | Description |
|---------|-------------|
| V001 | Shared tables (team_members, transactions, etc.) |
| V002 | BI tables |
| V003 | Numbers tables |
| V004 | Colab tables |
| V005 | Sign tables |
| V006 | BetterAuth tables |
| V007 | Team preferences & presence |
| V008 | Business tables |
| V009 | Content tables (blog, jobs) |
| V010 | Calendar & analytics |
| V011 | CMS & visual editor |
| V012 | BI pipeline & approvals |
| V013 | Colab extensions |
| V014 | OAuth tokens (Pipedrive, etc.) |
