#!/bin/bash
# infrastructure/scripts/backup-postgres.sh
# Runs daily via cron, stores encrypted backup in Minio
# Cron: 0 2 * * * /opt/alecia/scripts/backup-postgres.sh >> /var/log/alecia-backup.log 2>&1

set -e
DATE=$(date +%Y-%m-%d_%H%M)
BACKUP_FILE="/tmp/alecia-pg-backup-${DATE}.sql.gz"

echo "[$(date)] Starting PostgreSQL backup..."

# Dump all schemas
docker exec alecia-postgres pg_dumpall -U alecia | gzip > "${BACKUP_FILE}"

# Upload to Minio (encrypted bucket)
mc cp "${BACKUP_FILE}" alecia/alecia-backups/postgres/

# Remove local temp file
rm "${BACKUP_FILE}"

# Retention: keep last 30 days
mc rm --older-than 30d alecia/alecia-backups/postgres/

echo "[$(date)] Backup complete: alecia-pg-backup-${DATE}.sql.gz"
