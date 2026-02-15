#!/bin/bash
set -euo pipefail

echo "═══════════════════════════════════════════"
echo "  Alecia Suite — Production Data Seed"
echo "═══════════════════════════════════════════"

DB_CONTAINER="${DB_CONTAINER:-alecia-postgres}"
DB_USER="${DB_USER:-alecia}"
DB_NAME="${DB_NAME:-alecia}"

# 1. Apply migrations
echo ""
echo "▸ Applying SQL migrations..."
FAILED_MIGRATIONS=()
for sql_file in infrastructure/postgres/migrations/V*.sql; do
  echo "  → $(basename $sql_file)"
  if ! docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < "$sql_file" 2>&1 | grep -q "ERROR"; then
    echo "    ✓ Success"
  else
    echo "    ⚠ Already applied or minor error (continuing)"
    FAILED_MIGRATIONS+=("$(basename $sql_file)")
  fi
done

if [ ${#FAILED_MIGRATIONS[@]} -gt 0 ]; then
  echo ""
  echo "Note: Some migrations reported errors (likely already applied):"
  printf '  - %s\n' "${FAILED_MIGRATIONS[@]}"
fi

# 2. Run the showcase import (team members, blog posts, job offers)
echo ""
echo "▸ Importing showcase data..."
if [ -d "backups/convex_2026-01-22/extracted" ]; then
  npx tsx scripts/migration/import-showcase-to-postgres.ts
else
  echo "  ⚠ No backup data found at backups/convex_2026-01-22/extracted/"
  echo "  → Falling back to hardcoded seed data..."
  npx tsx scripts/seed-essential-data.ts
fi

# 3. Verify
echo ""
echo "▸ Verifying seeded data..."
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 'team_members' as entity, count(*) from shared.team_members
UNION ALL SELECT 'transactions', count(*) from shared.transactions
UNION ALL SELECT 'blog_posts', count(*) from shared.blog_posts
UNION ALL SELECT 'job_offers', count(*) from shared.job_offers
UNION ALL SELECT 'marketing_kpis', count(*) from shared.marketing_kpis
ORDER BY entity;
"

echo ""
echo "✓ Seed complete"
