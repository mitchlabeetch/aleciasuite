# Infrastructure Quick Reference

## Service Status Dashboard

| # | Service | Status | Config Files | Secrets | Notes |
|---|---------|--------|--------------|---------|-------|
| 1 | Plausible | ✅ 100% | `plausible-conf.env`<br>`docker-compose.yml`<br>`custom_head.html` | `SECRET_KEY_BASE`<br>`PLAUSIBLE_PG_PASSWORD` | CSS branding applied |
| 2 | SearXNG | ✅ 100% | `settings.yml` | `secret_key` (in file) | French default |
| 3 | Vaultwarden | ✅ 100% | `docker-compose.yml`<br>`.env.example` | `VAULTWARDEN_ADMIN_TOKEN` | Invite-only signup |
| 4 | Miniflux | ✅ 100% | `docker-compose.yml`<br>`opml-feeds.xml` | `MINIFLUX_ADMIN_USER`<br>`MINIFLUX_ADMIN_PASSWORD` | 20 M&A RSS feeds |
| 5 | Flowchart.fun | 📝 External | `docker-compose.yml` (commented) | None | Use https://flowchart.fun |
| 6 | Caddy | ✅ 100% | `Caddyfile` | `OVH_ENDPOINT`<br>`OVH_APPLICATION_KEY`<br>`OVH_APPLICATION_SECRET`<br>`OVH_CONSUMER_KEY` | Wildcard TLS ready |

---

## Environment Variables Needed

```bash
# Copy this template to your .env file

# Plausible Analytics
PLAUSIBLE_PG_PASSWORD=

# Vaultwarden
VAULTWARDEN_ADMIN_TOKEN=

# Miniflux
POSTGRES_PASSWORD=
MINIFLUX_ADMIN_USER=
MINIFLUX_ADMIN_PASSWORD=

# Caddy / OVH DNS
OVH_ENDPOINT=ovh-eu
OVH_APPLICATION_KEY=
OVH_APPLICATION_SECRET=
OVH_CONSUMER_KEY=
```

---

## Pre-Deployment Checklist

- [ ] OVH API credentials generated (https://eu.api.ovh.com/createToken/)
- [ ] All environment variables set in deployment platform
- [ ] Production secrets generated (replace deterministic dev values)
- [ ] Docker networks configured
- [ ] Volume mounts verified:
  - [ ] `plausible/custom_head.html` exists
  - [ ] `miniflux/opml-feeds.xml` exists
- [ ] Port conflicts resolved
- [ ] PostgreSQL accessible at `alecia-postgres:5432`

---

## Post-Deployment Checklist

- [ ] Plausible accessible at https://analytics.alecia.fr
  - [ ] Create account
  - [ ] Add tracked sites
  - [ ] Verify custom branding (no Plausible logo)
- [ ] SearXNG accessible at https://search.alecia.fr
  - [ ] Test search functionality
  - [ ] Verify French language default
- [ ] Vaultwarden accessible at https://vault.alecia.fr
  - [ ] Access /admin panel with ADMIN_TOKEN
  - [ ] Create organization
  - [ ] Invite team members
- [ ] Miniflux accessible at https://feeds.alecia.fr
  - [ ] Login with admin credentials
  - [ ] Import OPML: Settings → Integrations → Import OPML
  - [ ] Verify 20 feeds imported
  - [ ] Configure refresh intervals
- [ ] Caddy TLS verification
  - [ ] All *.alecia.fr domains resolve
  - [ ] Wildcard certificate issued
  - [ ] No certificate errors

---

## Quick Troubleshooting

### Plausible won't start
```bash
# Check if PostgreSQL password is set
docker logs alecia-plausible | grep -i "password"

# Verify ClickHouse is running
docker ps | grep clickhouse
```

### Vaultwarden admin panel 401
```bash
# Verify token is set
docker exec alecia-vaultwarden env | grep ADMIN_TOKEN

# Check for whitespace in token
echo -n "$VAULTWARDEN_ADMIN_TOKEN" | wc -c
```

### Miniflux OPML import fails
```bash
# Verify file is mounted
docker exec alecia-miniflux ls -l /opml-feeds.xml

# Check XML validity
xmllint --noout infrastructure/miniflux/opml-feeds.xml
```

### Caddy TLS fails
```bash
# Check OVH credentials
docker logs alecia-caddy | grep -i "ovh"

# Test DNS propagation
dig _acme-challenge.alecia.fr TXT

# Verify API permissions
curl -X GET \
  -H "X-Ovh-Application: $OVH_APPLICATION_KEY" \
  https://eu.api.ovh.com/1.0/domain/zone/alecia.fr
```

---

## Documentation Files

- **INFRASTRUCTURE_READINESS_REPORT.md** - Complete deployment guide (450 lines)
- **COMPLETION_SUMMARY.md** - Executive summary of all changes
- **verify-config.sh** - Configuration verification script
- This file - Quick reference card

---

## Service URLs

```
Marketing:       https://alecia.fr
CMS:             https://cms.alecia.fr
Business Intel:  https://app.alecia.fr
Automation:      https://flows.alecia.fr
E-Signature:     https://sign.alecia.fr
Collaboration:   https://colab.alecia.fr
Analytics:       https://analytics.alecia.fr     ← NEW
Storage Admin:   https://storage.alecia.fr
S3 API:          https://s3.alecia.fr
RSS Feeds:       https://feeds.alecia.fr         ← NEW
Search:          https://search.alecia.fr        ← NEW
PDF Tools:       https://docs.alecia.fr
PDF Generator:   https://pdf.alecia.fr
Diagrams:        https://flowchart.fun           ← EXTERNAL
Vault:           https://vault.alecia.fr         ← NEW
WebSocket:       wss://ws.alecia.fr
```

---

**All 6 infrastructure services are now at 100% configuration readiness.**
