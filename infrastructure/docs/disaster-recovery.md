# Alecia Suite — Disaster Recovery Runbook

## 1. PostgreSQL Restore from Minio Backup

```bash
# 1. List available backups
mc ls alecia/alecia-backups/postgres/

# 2. Download latest backup
mc cp alecia/alecia-backups/postgres/alecia-pg-backup-YYYY-MM-DD_HHMM.sql.gz /tmp/restore.sql.gz

# 3. Stop all services except PostgreSQL
# (via Coolify dashboard or docker stop commands)

# 4. Restore
gunzip /tmp/restore.sql.gz
docker exec -i alecia-postgres psql -U alecia -d alecia < /tmp/restore.sql

# 5. Verify
docker exec alecia-postgres psql -U alecia -d alecia -c "SELECT count(*) FROM shared.deals;"

# 6. Restart all services
```

## 2. Minio Data Restore

```bash
# If using bucket replication to secondary storage:
mc mirror backup-storage/alecia-documents alecia/alecia-documents
mc mirror backup-storage/alecia-signatures alecia/alecia-signatures

# Verify
mc ls alecia/alecia-documents
```

## 3. Service Restart Order

After a full system restart, bring services up in this order:

1. **PostgreSQL** — all other services depend on it
2. **Redis** — caching and job queues
3. **Minio** — file storage
4. **Caddy** — reverse proxy (depends on all backends)
6. All other services (order doesn't matter):
   - Strapi, Plausible, Miniflux, SearXNG
   - Stirling-PDF, Gotenberg, Flowchart.fun
   - Activepieces, DocuSeal, Haystack
   - Hocuspocus, Next.js apps
7. **Uptime Kuma** — monitoring (last, to avoid false alerts)

## 4. DNS Failover

If the VPS becomes unreachable:

1. Point `*.alecia.fr` DNS A record to backup VPS IP
2. OR temporarily point to Vercel (if still active during transition period)
3. Update Caddy config on new VPS with same Caddyfile
4. Restore PostgreSQL from Minio backup on new VPS

## 5. Emergency Contacts

- **OVH Support**: ovhcloud.com/fr/support
- **Domain Registrar**: OVH domain manager
- **Coolify**: github.com/coollabsio/coolify/issues

## 6. Key File Locations on VPS

| Item | Path |
|------|------|
| Docker Compose files | `/opt/alecia/infrastructure/` |
| Caddy config | `/opt/alecia/infrastructure/caddy/Caddyfile` |
| Backup scripts | `/opt/alecia/infrastructure/scripts/` |
| Backup logs | `/var/log/alecia-backup.log` |
| PostgreSQL data | Docker volume `postgres_data` |
| Minio data | Docker volume `minio_data` |
