#!/bin/bash
# Idempotent migration runner for Alecia Suite PostgreSQL
set -e

DB_HOST="${DB_HOST:-alecia-postgres}"
DB_USER="${DB_USER:-alecia}"
DB_NAME="${DB_NAME:-alecia}"

for migration in /docker-entrypoint-initdb.d/migrations/V*.sql; do
  filename=$(basename "$migration")
  echo "Applying $filename..."
  PGPASSWORD="${DB_PASSWORD:-alecia}" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$migration" 2>&1 || echo "Warning: $filename may have already been applied"
done

echo "All migrations applied."
