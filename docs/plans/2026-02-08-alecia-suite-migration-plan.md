# Alecia Suite — Complete Migration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate the entire Alecia platform from Vercel + Convex + Clerk to a self-hosted OVH Cloud VPS running the full Alecia Suite (8 products + supporting services), with PostgreSQL, Keycloak, Minio, and Coolify — 100% FOSS.

**Architecture:** The migration decomposes a monolithic Next.js monorepo (website + colab) backed by Convex into 8 independent subdomain services (alecia.fr, cms, app, flows, sign, colab, analytics, auth) plus 7+ supporting services (Miniflux, SearXNG, Haystack, Stirling-PDF, Gotenberg, Flowchart.fun, Vaultwarden). All services share a PostgreSQL 16 database with hybrid schemas (shared + isolated), Minio S3 blob storage, Keycloak SSO, and are orchestrated by Coolify behind a Caddy reverse proxy with wildcard TLS.

**Tech Stack:** OVH Cloud VPS (8 vCPU, 32 GB RAM, 400 GB NVMe) · Coolify · Caddy · PostgreSQL 16 + pgvector · Minio · Redis · Keycloak · Hocuspocus · Next.js 15 · Strapi CE · Activepieces · DocuSeal · Plausible CE · TipTap 3 + Yjs

**Source Documents:**
- `docs/plans/2026-02-07-alecia-suite-ecosystem.md` — Definitive ecosystem blueprint v2.1
- `docs/plans/2026-02-07-alecia-suite-organigram.html` — Visual architecture diagrams (10 Mermaid diagrams)
- `docs/plans/2026-02-08-alecia-suite-client-organigram.html` — Client-facing functional architecture

**Current State:**
- Monorepo: `/Users/utilisateur/Desktop/alepanel` (pnpm + Turborepo)
- Website: Next.js 15.3.6 on Vercel (alecia.markets)
- Colab: Next.js 16.1.4 on Vercel (colab.alecia.markets)
- Backend: Convex Cloud (69+ tables, 20k+ lines, 669 exported functions)
- Auth: Clerk (custom domain clerk.alecia.markets)
- Storage: Convex file storage
- Domain: alecia.markets → migrating to alecia.fr

---

## Plan Overview — 10 Phases, 30 Sprints

| Phase | Name | Sprints | Duration | Dependencies |
|-------|------|---------|----------|--------------|
| 0 | Infrastructure Foundation | 1–2 | ~2 weeks | None |
| 1 | Quick-Deploy Services | 3–5 | ~3 weeks | Phase 0 |
| 2 | CMS & Marketing Migration | 6–8 | ~3 weeks | Phase 0 |
| 3 | Database Schema & Data Migration | 9–12 | ~4 weeks | Phase 0 |
| 4 | BI/CRM Application Adaptation | 13–15 | ~3 weeks | Phase 3 |
| 5 | Activepieces Custom Pieces | 16–18 | ~3 weeks | Phase 1 Sprint 4 |
| 6 | Colab Overhaul | 19–22 | ~4 weeks | Phase 3 |
| 7 | AI Intelligence Layer | 23–24 | ~2 weeks | Phase 3 |
| 8 | Polish & Harden | 25–28 | ~4 weeks | Phases 4–7 |
| 9 | DNS Cutover & Launch | 29–30 | ~2 weeks | Phase 8 |

**Parallelization:** Phases 1, 2, and 3 can run in parallel after Phase 0 completes. Phases 4–7 have partial parallelism. Phase 8 depends on all prior phases. Phase 9 is the final launch gate.

```
Week  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30
Phase ├──0──┤
            ├──1──────┤
            ├──2──────┤
            ├──3──────────┤
                           ├──4──────┤
                     ├──5──────┤
                              ├──6──────────┤
                              ├──7────┤
                                          ├──8──────────┤
                                                        ├──9──┤
```

---

## Phase 0 — Infrastructure Foundation

> **Goal:** Provision the OVH Cloud VPS, install Coolify, and deploy all core infrastructure services (Caddy, PostgreSQL, Minio, Redis, Keycloak). By the end of this phase, all infrastructure is running, DNS is pointed, and Keycloak has a configured "alecia" realm ready for OIDC clients.

### Sprint 1: VPS Provisioning + Core Infrastructure

**Objective:** OVH VPS is provisioned, Coolify is installed, and PostgreSQL + Minio + Redis are running and verified.

#### Task 1.1: Provision OVH Cloud VPS

**Files:**
- No local files — this is an OVH Cloud Console operation

**Step 1: Order the VPS on OVH Cloud**

Navigate to [OVH Cloud Manager](https://www.ovhcloud.com/fr/vps/) and order:
- **Model:** VPS Comfort or higher
- **vCPU:** 8 cores minimum
- **RAM:** 32 GB
- **Storage:** 400 GB NVMe SSD
- **OS:** Ubuntu 24.04 LTS (or Debian 12)
- **Location:** Gravelines (GRA) or Roubaix (RBX) — France datacenter for RGPD sovereignty
- **Extras:** Automated backup enabled

**Step 2: Initial VPS hardening**

SSH into the new VPS:
```bash
ssh root@<VPS_IP>
```

Run initial hardening:
```bash
# Update system
apt update && apt upgrade -y

# Create non-root user
adduser alecia
usermod -aG sudo alecia

# Install essential tools
apt install -y curl wget git ufw fail2ban

# Configure firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable

# Configure fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# Disable root SSH login
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart sshd
```

**Step 3: Verify VPS is accessible**

```bash
ssh alecia@<VPS_IP>
sudo ufw status
```
Expected: UFW active with ports 22, 80, 443 allowed.

---

#### Task 1.2: Install Coolify on VPS

**Step 1: Install Coolify via official script**

```bash
ssh alecia@<VPS_IP>
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | sudo bash
```

This installs: Docker Engine, Docker Compose, Coolify (port 8000), and the default proxy.

**Step 2: Access Coolify dashboard**

Open `http://<VPS_IP>:8000`. Complete initial setup:
1. Create admin account (use Alecia admin email)
2. Set instance name to "Alecia Suite"

**Step 3: Verify Docker is running**

```bash
docker --version && docker compose version && docker ps
```
Expected: Docker 24+, Compose 2+, Coolify containers running.

**Step 4: Commit**

```bash
git add docs/plans/2026-02-08-alecia-suite-migration-plan.md
git commit -m "docs: add migration plan — Phase 0 started"
```

---

#### Task 1.3: Configure Caddy Reverse Proxy with Wildcard TLS

**Files:**
- Create: `infrastructure/caddy/Caddyfile`

**Step 1: Create Caddyfile for wildcard subdomains**

```caddyfile
# infrastructure/caddy/Caddyfile
# Wildcard TLS for *.alecia.fr via DNS-01 challenge (OVH API)

{
    email admin@alecia.fr
    acme_dns ovh {
        endpoint {$OVH_ENDPOINT}
        application_key {$OVH_APPLICATION_KEY}
        application_secret {$OVH_APPLICATION_SECRET}
        consumer_key {$OVH_CONSUMER_KEY}
    }
}

alecia.fr         { reverse_proxy next-marketing:3000 }
cms.alecia.fr     { reverse_proxy strapi:1337 }
app.alecia.fr     { reverse_proxy next-admin:3000 }
flows.alecia.fr   { reverse_proxy activepieces-app:8080 }
sign.alecia.fr    { reverse_proxy docuseal:3000 }
colab.alecia.fr   { reverse_proxy next-colab:3001 }
analytics.alecia.fr { reverse_proxy plausible:8000 }
auth.alecia.fr    { reverse_proxy keycloak:8080 }
storage.alecia.fr { reverse_proxy minio:9001 }
s3.alecia.fr      { reverse_proxy minio:9000 }
feeds.alecia.fr   { reverse_proxy miniflux:8080 }
search.alecia.fr  { reverse_proxy searxng:8888 }
docs.alecia.fr    { reverse_proxy stirling-pdf:8080 }
pdf.alecia.fr     { reverse_proxy gotenberg:3000 }
diagrams.alecia.fr { reverse_proxy flowchart:3000 }
vault.alecia.fr   { reverse_proxy vaultwarden:8080 }
ws.alecia.fr      { reverse_proxy hocuspocus:1234 }
```

**Step 2: Point DNS to VPS**

In OVH domain manager for `alecia.fr`:
```
A    @    → <VPS_IP>
A    *    → <VPS_IP>
```

**Step 3: Deploy Caddy via Coolify and verify TLS**

```bash
curl -I https://alecia.fr
```
Expected: HTTP/2, valid TLS certificate for *.alecia.fr.

**Step 4: Commit**

```bash
git add infrastructure/caddy/
git commit -m "infra: add Caddy wildcard TLS config for *.alecia.fr"
```

---

#### Task 1.4: Deploy PostgreSQL 16 + pgvector

**Files:**
- Create: `infrastructure/postgres/docker-compose.yml`
- Create: `infrastructure/postgres/init/00-extensions.sql`
- Create: `infrastructure/postgres/init/01-schemas.sql`

**Step 1: Create Docker Compose**

```yaml
# infrastructure/postgres/docker-compose.yml
services:
  postgres:
    image: pgvector/pgvector:pg16
    container_name: alecia-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: alecia
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: alecia
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U alecia"]
      interval: 10s
      timeout: 5s
      retries: 5
volumes:
  postgres_data:
```

**Step 2: Create init scripts**

```sql
-- infrastructure/postgres/init/00-extensions.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
```

```sql
-- infrastructure/postgres/init/01-schemas.sql
CREATE SCHEMA IF NOT EXISTS shared;
CREATE SCHEMA IF NOT EXISTS alecia_bi;
CREATE SCHEMA IF NOT EXISTS alecia_numbers;
CREATE SCHEMA IF NOT EXISTS alecia_flows;
CREATE SCHEMA IF NOT EXISTS alecia_sign;
CREATE SCHEMA IF NOT EXISTS alecia_colab;
CREATE SCHEMA IF NOT EXISTS alecia_cms;
CREATE SCHEMA IF NOT EXISTS alecia_analytics;
ALTER DATABASE alecia SET search_path TO shared, public;
```

**Step 3: Deploy and verify**

```bash
docker exec alecia-postgres psql -U alecia -c "\dn"
# Expected: 8 schemas listed
docker exec alecia-postgres psql -U alecia -c "SELECT extname FROM pg_extension;"
# Expected: uuid-ossp, pgcrypto, pg_trgm, vector, btree_gist
```

**Step 4: Commit**

```bash
git add infrastructure/postgres/
git commit -m "infra: add PostgreSQL 16 + pgvector with 8 hybrid schemas"
```

---

#### Task 1.5: Deploy Minio S3 Blob Storage

**Files:**
- Create: `infrastructure/minio/docker-compose.yml`

**Step 1: Create Docker Compose**

```yaml
# infrastructure/minio/docker-compose.yml
services:
  minio:
    image: minio/minio:latest
    container_name: alecia-minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
      MINIO_SERVER_URL: https://s3.alecia.fr
      MINIO_BROWSER_REDIRECT_URL: https://storage.alecia.fr
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"
volumes:
  minio_data:
```

**Step 2: Create encrypted buckets**

```bash
mc alias set alecia http://localhost:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD
mc mb alecia/alecia-documents
mc mb alecia/alecia-signatures
mc mb alecia/alecia-media
mc mb alecia/alecia-exports
mc mb alecia/alecia-presentations
mc mb alecia/alecia-backups
# Enable encryption on each
mc encrypt set sse-s3 alecia/alecia-documents
mc encrypt set sse-s3 alecia/alecia-signatures
mc encrypt set sse-s3 alecia/alecia-media
mc encrypt set sse-s3 alecia/alecia-exports
mc encrypt set sse-s3 alecia/alecia-presentations
mc encrypt set sse-s3 alecia/alecia-backups
```

**Step 3: Verify**

```bash
mc ls alecia/
# Expected: 6 buckets listed
```

**Step 4: Commit**

```bash
git add infrastructure/minio/
git commit -m "infra: add Minio S3 with 6 encrypted buckets"
```

---

#### Task 1.6: Deploy Redis

**Files:**
- Create: `infrastructure/redis/docker-compose.yml`

**Step 1: Create Docker Compose**

```yaml
# infrastructure/redis/docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    container_name: alecia-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
volumes:
  redis_data:
```

**Step 2: Verify**

```bash
docker exec alecia-redis redis-cli -a $REDIS_PASSWORD ping
# Expected: PONG
```

**Step 3: Commit**

```bash
git add infrastructure/redis/
git commit -m "infra: add Redis 7 for caching and job queues"
```

---

### Sprint 2: Keycloak SSO + Vaultwarden

**Objective:** Keycloak deployed with "alecia" realm, 8 OIDC clients, 4 RBAC roles. Vaultwarden deployed for team credentials.

#### Task 2.1: Deploy Keycloak

**Files:**
- Create: `infrastructure/keycloak/docker-compose.yml`
- Create: `infrastructure/keycloak/themes/alecia/login/theme.properties`
- Create: `infrastructure/keycloak/themes/alecia/login/resources/css/alecia.css`

**Step 1: Create Docker Compose**

```yaml
# infrastructure/keycloak/docker-compose.yml
services:
  keycloak:
    image: quay.io/keycloak/keycloak:24.0
    container_name: alecia-keycloak
    restart: unless-stopped
    command: start
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://alecia-postgres:5432/alecia
      KC_DB_SCHEMA: public
      KC_DB_USERNAME: alecia
      KC_DB_PASSWORD: ${POSTGRES_PASSWORD}
      KC_HOSTNAME: auth.alecia.fr
      KC_PROXY: edge
      KC_HTTP_ENABLED: "true"
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD}
    volumes:
      - ./themes/alecia:/opt/keycloak/themes/alecia
    ports:
      - "8080:8080"
```

**Step 2: Create Alecia login theme**

```properties
# infrastructure/keycloak/themes/alecia/login/theme.properties
parent=keycloak.v2
import=common/keycloak
styles=css/alecia.css
```

```css
/* infrastructure/keycloak/themes/alecia/login/resources/css/alecia.css */
:root {
    --pf-v5-global--primary-color--100: #061a40;
    --pf-v5-global--primary-color--200: #163e64;
    --pf-v5-global--link--Color: #4370a7;
}
.login-pf body {
    background: linear-gradient(135deg, #061a40, #163e64);
}
```

**Step 3: Configure "alecia" realm**

In Keycloak admin (`https://auth.alecia.fr`):

1. Create realm: `alecia`
2. Realm settings: Display name "Alecia Suite", theme: alecia, locale: fr
3. Create 8 OIDC clients:

| Client ID | Valid Redirect URIs | Web Origins |
|-----------|-------------------|-------------|
| `alecia-marketing` | `https://alecia.fr/*` | `https://alecia.fr` |
| `alecia-cms` | `https://cms.alecia.fr/*` | `https://cms.alecia.fr` |
| `alecia-admin` | `https://app.alecia.fr/*` | `https://app.alecia.fr` |
| `alecia-flows` | `https://flows.alecia.fr/*` | `https://flows.alecia.fr` |
| `alecia-sign` | `https://sign.alecia.fr/*` | `https://sign.alecia.fr` |
| `alecia-colab` | `https://colab.alecia.fr/*` | `https://colab.alecia.fr` |
| `alecia-analytics` | `https://analytics.alecia.fr/*` | `https://analytics.alecia.fr` |
| `alecia-vault` | `https://vault.alecia.fr/*` | `https://vault.alecia.fr` |

4. Create roles: `sudo`, `partner`, `advisor`, `user`
5. Create initial admin user with `sudo` role

**Step 4: Export realm config for version control**

```bash
docker exec alecia-keycloak /opt/keycloak/bin/kc.sh export \
  --dir /tmp/export --realm alecia
docker cp alecia-keycloak:/tmp/export/alecia-realm.json \
  infrastructure/keycloak/alecia-realm.json
```

**Step 5: Verify OIDC discovery**

```bash
curl -s https://auth.alecia.fr/realms/alecia/.well-known/openid-configuration | jq .issuer
# Expected: "https://auth.alecia.fr/realms/alecia"
```

**Step 6: Commit**

```bash
git add infrastructure/keycloak/
git commit -m "infra: add Keycloak SSO with alecia realm, 8 OIDC clients, 4 roles"
```

---

#### Task 2.2: Deploy Vaultwarden

**Files:**
- Create: `infrastructure/vaultwarden/docker-compose.yml`

**Step 1: Create Docker Compose**

```yaml
# infrastructure/vaultwarden/docker-compose.yml
services:
  vaultwarden:
    image: vaultwarden/server:latest
    container_name: alecia-vaultwarden
    restart: unless-stopped
    environment:
      DOMAIN: https://vault.alecia.fr
      SIGNUPS_ALLOWED: "false"
      INVITATIONS_ALLOWED: "true"
      ADMIN_TOKEN: ${VAULTWARDEN_ADMIN_TOKEN}
    volumes:
      - vaultwarden_data:/data
    ports:
      - "8080:80"
volumes:
  vaultwarden_data:
```

**Step 2: Deploy, create org "Alecia", invite team, store all credentials**

Store in Vaultwarden: VPS SSH, PostgreSQL, Minio, Redis, Keycloak, OVH API keys.

**Step 3: Commit**

```bash
git add infrastructure/vaultwarden/
git commit -m "infra: add Vaultwarden for credential management"
```

---

#### Task 2.3: Infrastructure Health Check Script

**Files:**
- Create: `infrastructure/scripts/health-check.sh`

**Step 1: Write health check**

```bash
#!/bin/bash
# infrastructure/scripts/health-check.sh
set -e
echo "=== Alecia Suite — Infrastructure Health Check ==="
GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'

check() {
    local name=$1 cmd=$2
    if eval "$cmd" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $name"
    else
        echo -e "${RED}✗${NC} $name"
    fi
}

check "PostgreSQL" "docker exec alecia-postgres pg_isready -U alecia"
check "Redis" "docker exec alecia-redis redis-cli ping"
check "Minio" "curl -sf https://s3.alecia.fr/minio/health/live"
check "Keycloak" "curl -sf https://auth.alecia.fr/realms/alecia"
check "Vaultwarden" "curl -sf https://vault.alecia.fr"
check "Caddy TLS" "curl -sf https://alecia.fr"
echo "=== Done ==="
```

**Step 2: Commit**

```bash
git add infrastructure/scripts/
git commit -m "infra: add health check script for Phase 0 services"
```

---

**Phase 0 Completion Checklist:**
- [ ] OVH VPS provisioned + hardened (SSH, UFW, fail2ban)
- [ ] Coolify installed and accessible
- [ ] Caddy with wildcard TLS for *.alecia.fr
- [ ] PostgreSQL 16 + pgvector with 8 schemas
- [ ] Minio with 6 encrypted buckets
- [ ] Redis with password auth
- [ ] Keycloak with "alecia" realm, 8 OIDC clients, 4 roles
- [ ] Vaultwarden with team credentials
- [ ] DNS A + wildcard records pointing to VPS
- [ ] Health check script passing

---

## Phase 1 — Quick-Deploy Services

> **Goal:** Deploy all "deploy as-is" services (Plausible, Miniflux, SearXNG, Stirling-PDF, Gotenberg, Flowchart.fun) and begin the two major forks (Activepieces, DocuSeal). These are the fastest wins because they use official Docker images with minimal customization.
> **Depends on:** Phase 0 complete (VPS, Coolify, PostgreSQL, Minio, Redis, Keycloak, Caddy all running).

### Sprint 3: Deploy-As-Is Services (7 services)

**Objective:** Deploy Plausible, Miniflux, SearXNG, Stirling-PDF, Gotenberg, Flowchart.fun — all running behind Caddy with TLS, accessible via their subdomains.

#### Task 3.1: Deploy Plausible Analytics

**Files:**
- Create: `infrastructure/plausible/docker-compose.yml`
- Create: `infrastructure/plausible/plausible-conf.env`
- Create: `infrastructure/plausible/custom.css`

**Step 1: Create Docker Compose**

Plausible requires PostgreSQL + ClickHouse. We use the Plausible-managed ClickHouse (separate from our main PG):

```yaml
# infrastructure/plausible/docker-compose.yml
services:
  plausible:
    image: ghcr.io/plausible/community-edition:v2.1
    container_name: alecia-plausible
    restart: unless-stopped
    command: sh -c "sleep 10 && /entrypoint.sh db createdb && /entrypoint.sh db migrate && /entrypoint.sh run"
    env_file:
      - plausible-conf.env
    ports:
      - "8000:8000"
    depends_on:
      - plausible-db
      - plausible-events-db

  plausible-db:
    image: postgres:16-alpine
    container_name: alecia-plausible-db
    restart: unless-stopped
    volumes:
      - plausible_db_data:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: ${PLAUSIBLE_PG_PASSWORD}

  plausible-events-db:
    image: clickhouse/clickhouse-server:24.3-alpine
    container_name: alecia-plausible-clickhouse
    restart: unless-stopped
    volumes:
      - plausible_events_data:/var/lib/clickhouse
    ulimits:
      nofile:
        soft: 262144
        hard: 262144

volumes:
  plausible_db_data:
  plausible_events_data:
```

```env
# infrastructure/plausible/plausible-conf.env
BASE_URL=https://analytics.alecia.fr
SECRET_KEY_BASE=<generate with: openssl rand -base64 48>
DATABASE_URL=postgres://postgres:${PLAUSIBLE_PG_PASSWORD}@plausible-db:5432/plausible
CLICKHOUSE_DATABASE_URL=http://plausible-events-db:8123/plausible_events_db
DISABLE_REGISTRATION=invite_only
MAILER_EMAIL=analytics@alecia.fr
```

**Step 2: Create Alecia CSS rebrand**

```css
/* infrastructure/plausible/custom.css */
/* Injected via EXTRA_CSS env or reverse proxy header injection */
:root {
    --primary: #061a40;
    --primary-dark: #163e64;
    --accent: #4370a7;
}
.plausible-logo, footer a[href*="plausible"] { display: none; }
```

**Step 3: Deploy via Coolify, verify at `https://analytics.alecia.fr`**

**Step 4: Add tracking snippet to marketing site**

Will be added in Phase 2 when marketing site is migrated. For reference:
```html
<script defer data-domain="alecia.fr" src="https://analytics.alecia.fr/js/script.js"></script>
```

**Step 5: Commit**

```bash
git add infrastructure/plausible/
git commit -m "infra: deploy Plausible analytics with CSS rebrand"
```

---

#### Task 3.2: Deploy Miniflux RSS Aggregator

**Files:**
- Create: `infrastructure/miniflux/docker-compose.yml`

**Step 1: Create Docker Compose**

```yaml
# infrastructure/miniflux/docker-compose.yml
services:
  miniflux:
    image: miniflux/miniflux:latest
    container_name: alecia-miniflux
    restart: unless-stopped
    environment:
      DATABASE_URL: postgres://alecia:${POSTGRES_PASSWORD}@alecia-postgres:5432/alecia?search_path=public
      RUN_MIGRATIONS: 1
      CREATE_ADMIN: 1
      ADMIN_USERNAME: ${MINIFLUX_ADMIN_USER}
      ADMIN_PASSWORD: ${MINIFLUX_ADMIN_PASSWORD}
      BASE_URL: https://feeds.alecia.fr
    ports:
      - "8080:8080"
```

Note: Miniflux uses our shared PostgreSQL but in `public` schema (its own tables, prefixed).

**Step 2: Configure M&A RSS feeds**

After deployment, add feeds via Miniflux admin:
- Les Echos M&A, Capital Finance, CFNEWS, Fusacq
- Reuters M&A France, BODACC (official announcements)
- Sector-specific feeds per active deals

**Step 3: Verify at `https://feeds.alecia.fr`**

**Step 4: Commit**

```bash
git add infrastructure/miniflux/
git commit -m "infra: deploy Miniflux RSS aggregator for M&A intelligence"
```

---

#### Task 3.3: Deploy SearXNG Meta Search

**Files:**
- Create: `infrastructure/searxng/docker-compose.yml`
- Create: `infrastructure/searxng/settings.yml`

**Step 1: Create Docker Compose**

```yaml
# infrastructure/searxng/docker-compose.yml
services:
  searxng:
    image: searxng/searxng:latest
    container_name: alecia-searxng
    restart: unless-stopped
    volumes:
      - ./settings.yml:/etc/searxng/settings.yml:ro
    environment:
      SEARXNG_BASE_URL: https://search.alecia.fr
    ports:
      - "8888:8080"
```

**Step 2: Configure search settings**

```yaml
# infrastructure/searxng/settings.yml
use_default_settings: true
general:
  instance_name: "Alecia Recherche"
  debug: false
search:
  safe_search: 0
  autocomplete: "google"
  default_lang: "fr"
server:
  secret_key: "<generate>"
  bind_address: "0.0.0.0"
  port: 8080
  limiter: true
engines:
  - name: google
    engine: google
    shortcut: g
  - name: bing
    engine: bing
    shortcut: b
  - name: duckduckgo
    engine: duckduckgo
    shortcut: ddg
  - name: wikipedia
    engine: wikipedia
    shortcut: w
```

**Step 3: Verify at `https://search.alecia.fr`**

**Step 4: Commit**

```bash
git add infrastructure/searxng/
git commit -m "infra: deploy SearXNG meta search for company research"
```

---

#### Task 3.4: Deploy Stirling-PDF

**Files:**
- Create: `infrastructure/stirling-pdf/docker-compose.yml`

**Step 1: Create Docker Compose**

```yaml
# infrastructure/stirling-pdf/docker-compose.yml
services:
  stirling-pdf:
    image: frooodle/s-pdf:latest
    container_name: alecia-stirling-pdf
    restart: unless-stopped
    environment:
      DOCKER_ENABLE_SECURITY: "false"
      INSTALL_BOOK_AND_ADVANCED_HTML_OPS: "true"
      LANGS: "fr_FR,en_GB"
    volumes:
      - stirling_data:/usr/share/tessdata
    ports:
      - "8080:8080"
volumes:
  stirling_data:
```

**Step 2: Verify at `https://docs.alecia.fr`**

Test: upload a scanned PDF, run OCR, verify output is searchable.

**Step 3: Commit**

```bash
git add infrastructure/stirling-pdf/
git commit -m "infra: deploy Stirling-PDF toolkit for DD document processing"
```

---

#### Task 3.5: Deploy Gotenberg (PDF Generation)

**Files:**
- Create: `infrastructure/gotenberg/docker-compose.yml`

**Step 1: Create Docker Compose**

```yaml
# infrastructure/gotenberg/docker-compose.yml
services:
  gotenberg:
    image: gotenberg/gotenberg:8
    container_name: alecia-gotenberg
    restart: unless-stopped
    command:
      - "gotenberg"
      - "--api-timeout=120s"
      - "--chromium-auto-start"
    ports:
      - "3000:3000"
```

**Step 2: Verify with test conversion**

```bash
curl --request POST https://pdf.alecia.fr/forms/chromium/convert/url \
  --form url=https://alecia.fr \
  --form marginTop=1 \
  --form marginBottom=1 \
  -o test-alecia-homepage.pdf
```

**Step 3: Commit**

```bash
git add infrastructure/gotenberg/
git commit -m "infra: deploy Gotenberg for HTML-to-PDF report generation"
```

---

#### Task 3.6: Deploy Flowchart.fun

**Files:**
- Create: `infrastructure/flowchart/docker-compose.yml`

**Step 1: Create Docker Compose**

```yaml
# infrastructure/flowchart/docker-compose.yml
services:
  flowchart:
    image: node:20-alpine
    container_name: alecia-flowchart
    restart: unless-stopped
    working_dir: /app
    command: sh -c "npm install -g serve && serve -s /app/build -l 3000"
    # Note: Build from source or use a community Docker image
    ports:
      - "3000:3000"
```

Alternative: Build the flowchart.fun repo as a static site and serve via Caddy directly.

**Step 2: Verify at `https://diagrams.alecia.fr`**

**Step 3: Commit**

```bash
git add infrastructure/flowchart/
git commit -m "infra: deploy Flowchart.fun for deal structure diagrams"
```

---

### Sprint 4: Fork Activepieces (Alecia Flows)

**Objective:** Fork Activepieces, strip unused features, rebrand as "Alecia Flows", configure Keycloak SSO, deploy to `flows.alecia.fr`.

#### Task 4.1: Fork and Clone Activepieces

**Files:**
- Fork: `activepieces/activepieces` → `alecia/alecia-flows` on GitHub

**Step 1: Fork the repository**

```bash
gh repo fork activepieces/activepieces --org alecia --fork-name alecia-flows --clone
cd alecia-flows
git remote add upstream https://github.com/activepieces/activepieces.git
```

**Step 2: Create `alecia-customization` branch**

```bash
git checkout -b alecia-customization
```

**Step 3: Commit**

```bash
git commit --allow-empty -m "chore: begin Alecia Flows customization fork"
git push -u origin alecia-customization
```

---

#### Task 4.2: Strip Unused Activepieces Features

**Step 1: Identify unused pieces**

Activepieces ships ~100+ "pieces" (integrations). Keep only M&A-relevant ones:

**Keep:**
- `@activepieces/piece-http` — HTTP requests
- `@activepieces/piece-postgres` — PostgreSQL queries
- `@activepieces/piece-slack` — Slack notifications
- `@activepieces/piece-microsoft-teams` — Teams notifications
- `@activepieces/piece-gmail` — Email sending
- `@activepieces/piece-smtp` — SMTP email
- `@activepieces/piece-openai` — AI generation
- `@activepieces/piece-webhook` — Webhook triggers
- `@activepieces/piece-schedule` — Cron scheduling
- `@activepieces/piece-code` — Custom JS/TS code
- `@activepieces/piece-data-mapper` — Data transformation

**Strip:**
- Shopify, Stripe, HubSpot, Salesforce, Zendesk, Intercom, etc. (50+ pieces)
- Cloud billing features
- Telemetry and analytics

**Step 2: Remove pieces from monorepo**

In `packages/pieces/community/`, delete unused piece directories.
Update `packages/pieces/community/package.json` to remove references.

**Step 3: Remove telemetry**

Search for telemetry calls and disable/remove:
```bash
grep -r "telemetry\|analytics\|posthog\|segment" packages/server/api/src/ --include="*.ts"
```

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: strip 50+ unused pieces and telemetry from Activepieces fork"
```

---

#### Task 4.3: Rebrand Activepieces as Alecia Flows

**Step 1: Replace branding assets**

- Replace logo files in `packages/ui/` with Alecia Flows logo
- Update `packages/ui/core/src/app/` — page titles, favicon, brand name
- Update Angular theme colors to Alecia palette:
  ```
  --primary: #061a40 (midnight)
  --primary-hover: #163e64 (corporate)
  --accent: #4370a7 (mid-blue)
  ```

**Step 2: Update meta tags and titles**

Search and replace "Activepieces" → "Alecia Flows" in:
- `packages/ui/core/src/index.html`
- `packages/ui/core/src/environments/`
- `packages/server/api/src/`
- `packages/ee/` (if applicable)

**Step 3: Set single-tenant mode**

Configure for Alecia-only use (no multi-org):
- Disable sign-up in server config
- Set `AP_EXECUTION_MODE=UNSANDBOXED` for simpler Docker deployment
- Set `AP_FLOW_WORKER_CONCURRENCY=10`

**Step 4: Commit**

```bash
git add -A
git commit -m "brand: rebrand Activepieces as Alecia Flows with midnight blue theme"
```

---

#### Task 4.4: Configure Activepieces for Alecia Infrastructure

**Step 1: Create production Docker Compose**

```yaml
# infrastructure/activepieces/docker-compose.yml
services:
  activepieces-app:
    image: alecia/alecia-flows:latest  # Built from fork
    container_name: alecia-flows
    restart: unless-stopped
    environment:
      AP_ENGINE_EXECUTABLE_PATH: dist/packages/engine/main.js
      AP_ENVIRONMENT: prod
      AP_FRONTEND_URL: https://flows.alecia.fr
      AP_WEBHOOK_TIMEOUT_SECONDS: 30
      AP_TRIGGER_DEFAULT_POLL_INTERVAL: 5
      AP_POSTGRES_DATABASE: alecia
      AP_POSTGRES_HOST: alecia-postgres
      AP_POSTGRES_PORT: 5432
      AP_POSTGRES_USERNAME: alecia
      AP_POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      AP_POSTGRES_USE_SSL: "false"
      AP_REDIS_HOST: alecia-redis
      AP_REDIS_PORT: 6379
      AP_REDIS_PASSWORD: ${REDIS_PASSWORD}
      AP_ENCRYPTION_KEY: ${AP_ENCRYPTION_KEY}
      AP_JWT_SECRET: ${AP_JWT_SECRET}
      AP_EXECUTION_MODE: UNSANDBOXED
      AP_FLOW_WORKER_CONCURRENCY: 10
      AP_TELEMETRY_ENABLED: "false"
    ports:
      - "8080:80"
```

**Step 2: Build Docker image from fork**

```bash
cd alecia-flows
docker build -t alecia/alecia-flows:latest .
```

**Step 3: Deploy via Coolify and verify at `https://flows.alecia.fr`**

**Step 4: Commit**

```bash
cd /Users/utilisateur/Desktop/alepanel
git add infrastructure/activepieces/
git commit -m "infra: add Alecia Flows (Activepieces fork) deployment config"
```

---

### Sprint 5: Fork DocuSeal (Alecia Sign)

**Objective:** Fork DocuSeal, rebrand as "Alecia Sign", configure Minio storage, deploy to `sign.alecia.fr`, create NDA/LOI templates.

#### Task 5.1: Fork and Clone DocuSeal

**Step 1: Fork the repository**

```bash
gh repo fork docuseal/docuseal --org alecia --fork-name alecia-sign --clone
cd alecia-sign
git remote add upstream https://github.com/docuseal/docuseal.git
git checkout -b alecia-customization
```

**Step 2: Commit**

```bash
git commit --allow-empty -m "chore: begin Alecia Sign customization fork"
git push -u origin alecia-customization
```

---

#### Task 5.2: Strip and Rebrand DocuSeal

**Step 1: Remove DocuSeal branding**

DocuSeal is a Rails app. Replace branding in:
- `app/views/layouts/` — Logo, page titles
- `app/assets/images/` — Replace logo SVGs
- `app/assets/stylesheets/` — Update color scheme
- `config/locales/` — Update French translations

**Step 2: Update CSS variables to Alecia palette**

```css
:root {
    --primary: #061a40;
    --primary-hover: #163e64;
    --accent: #4370a7;
    --accent-light: #749ac7;
}
```

**Step 3: Remove cloud/SaaS features and telemetry**

**Step 4: Commit**

```bash
git add -A
git commit -m "brand: rebrand DocuSeal as Alecia Sign with Alecia color scheme"
```

---

#### Task 5.3: Configure DocuSeal for Minio Storage

**Step 1: Configure S3-compatible storage**

In DocuSeal's `.env` or Rails config:
```env
STORAGE_SERVICE=s3
AWS_ACCESS_KEY_ID=${MINIO_ROOT_USER}
AWS_SECRET_ACCESS_KEY=${MINIO_ROOT_PASSWORD}
AWS_REGION=us-east-1
AWS_ENDPOINT=https://s3.alecia.fr
AWS_BUCKET=alecia-signatures
AWS_FORCE_PATH_STYLE=true
```

**Step 2: Configure PostgreSQL connection**

```env
DATABASE_URL=postgres://alecia:${POSTGRES_PASSWORD}@alecia-postgres:5432/alecia
DATABASE_SCHEMA=alecia_sign
```

**Step 3: Create deployment config**

```yaml
# infrastructure/docuseal/docker-compose.yml
services:
  docuseal:
    image: alecia/alecia-sign:latest  # Built from fork
    container_name: alecia-sign
    restart: unless-stopped
    environment:
      DATABASE_URL: postgres://alecia:${POSTGRES_PASSWORD}@alecia-postgres:5432/alecia
      SECRET_KEY_BASE: ${DOCUSEAL_SECRET_KEY}
      RAILS_ENV: production
      HOST: https://sign.alecia.fr
      STORAGE_SERVICE: s3
      AWS_ACCESS_KEY_ID: ${MINIO_ROOT_USER}
      AWS_SECRET_ACCESS_KEY: ${MINIO_ROOT_PASSWORD}
      AWS_ENDPOINT: https://s3.alecia.fr
      AWS_BUCKET: alecia-signatures
      AWS_FORCE_PATH_STYLE: "true"
    ports:
      - "3000:3000"
```

**Step 4: Deploy and verify at `https://sign.alecia.fr`**

**Step 5: Commit**

```bash
cd /Users/utilisateur/Desktop/alepanel
git add infrastructure/docuseal/
git commit -m "infra: add Alecia Sign (DocuSeal fork) with Minio S3 storage"
```

---

#### Task 5.4: Create M&A Document Templates

**Step 1: Create NDA template (French)**

In Alecia Sign admin, create template with fields:
- Company names (2 parties)
- Signing dates
- Representative names and titles
- Confidentiality duration (default: 2 years)
- Jurisdiction: France
- Signature fields for both parties

**Step 2: Create LOI template (Letter of Intent — French)**

Fields:
- Buyer/Seller names
- Target company
- Proposed price range
- Key conditions
- Exclusivity period
- Due diligence timeline
- Signatures

**Step 3: Create Mandate Letter template (Lettre de mission — French)**

Fields:
- Client company
- Advisor (Alecia)
- Scope of mandate
- Fee structure (success fee + retainer)
- Duration
- Termination clauses
- Signatures

**Step 4: Commit**

```bash
git commit -m "feat: create NDA, LOI, and Mandate letter templates for Alecia Sign"
```

---

**Phase 1 Completion Checklist:**
- [ ] Plausible deployed at analytics.alecia.fr with CSS rebrand
- [ ] Miniflux deployed at feeds.alecia.fr with M&A RSS feeds
- [ ] SearXNG deployed at search.alecia.fr
- [ ] Stirling-PDF deployed at docs.alecia.fr
- [ ] Gotenberg deployed at pdf.alecia.fr
- [ ] Flowchart.fun deployed at diagrams.alecia.fr
- [ ] Activepieces forked, stripped, rebranded as "Alecia Flows"
- [ ] Alecia Flows deployed at flows.alecia.fr
- [ ] DocuSeal forked, stripped, rebranded as "Alecia Sign"
- [ ] Alecia Sign deployed at sign.alecia.fr with Minio storage
- [ ] NDA, LOI, Mandate templates created in Alecia Sign

---

## Phase 2 — CMS & Marketing Site Migration

> **Goal:** Fork Strapi CE as the CMS backend, create content types for the marketing site, migrate existing CMS content, and update the marketing site to fetch from Strapi API instead of Convex.
> **Depends on:** Phase 0 complete.
> **Can run in parallel with:** Phase 1 and Phase 3.

### Sprint 6: Fork Strapi CE (Alecia CMS)

**Objective:** Deploy Strapi CE at `cms.alecia.fr` with custom content types for the marketing site.

#### Task 6.1: Create Strapi Project

**Files:**
- Create: `services/cms/` (Strapi project root)

**Step 1: Initialize Strapi project**

```bash
cd /Users/utilisateur/Desktop/alepanel
mkdir -p services
npx create-strapi-app@latest services/cms --quickstart --no-run --typescript
cd services/cms
```

**Step 2: Configure PostgreSQL connection**

Edit `services/cms/config/database.ts`:
```typescript
export default ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      host: env('DATABASE_HOST', 'alecia-postgres'),
      port: env.int('DATABASE_PORT', 5432),
      database: env('DATABASE_NAME', 'alecia'),
      user: env('DATABASE_USERNAME', 'alecia'),
      password: env('DATABASE_PASSWORD'),
      schema: env('DATABASE_SCHEMA', 'alecia_cms'),
      ssl: env.bool('DATABASE_SSL', false),
    },
  },
});
```

**Step 3: Configure Minio S3 upload provider**

```bash
cd services/cms
npm install @strapi/provider-upload-aws-s3
```

Edit `services/cms/config/plugins.ts`:
```typescript
export default ({ env }) => ({
  upload: {
    config: {
      provider: 'aws-s3',
      providerOptions: {
        s3Options: {
          credentials: {
            accessKeyId: env('MINIO_ACCESS_KEY'),
            secretAccessKey: env('MINIO_SECRET_KEY'),
          },
          region: 'us-east-1',
          endpoint: env('MINIO_ENDPOINT', 'https://s3.alecia.fr'),
          forcePathStyle: true,
          params: {
            Bucket: env('MINIO_BUCKET', 'alecia-media'),
          },
        },
      },
    },
  },
});
```

**Step 4: Commit**

```bash
cd /Users/utilisateur/Desktop/alepanel
git add services/cms/
git commit -m "feat: initialize Strapi CE project with PostgreSQL + Minio S3 config"
```

---

#### Task 6.2: Create Content Types

**Step 1: Create content types using Strapi Content-Type Builder**

Run Strapi locally: `cd services/cms && npm run develop`

Create these content types in Strapi admin:

**Collection Type: Transaction (Tombstone)**
```
- title: Text (required)
- companyName: Text (required)
- sector: Enumeration [Tech, Santé, Industrie, Services, Agroalimentaire, Énergie, Immobilier, Distribution, Transport, Autre]
- dealType: Enumeration [Cession, Acquisition, LBO, MBO, MBI, Fusion, Apport partiel d'actifs]
- year: Integer (required)
- logo: Media (single image)
- description: Rich Text
- isConfidential: Boolean (default: false)
- featured: Boolean (default: false)
- locale: Enumeration [fr, en]
```

**Collection Type: TeamMember**
```
- fullName: Text (required)
- role: Text (required)
- bioFr: Rich Text
- bioEn: Rich Text
- photo: Media (single image)
- expertise: JSON (string array)
- linkedinUrl: Text
- email: Email
- officeLocation: Text
- order: Integer
```

**Collection Type: BlogPost**
```
- title: Text (required)
- slug: UID (from title)
- content: Rich Text (required)
- excerpt: Text
- coverImage: Media (single image)
- category: Enumeration [Actualités, Insights, Marché, Presse]
- author: Relation (TeamMember)
- publishedAt: Datetime
- locale: Enumeration [fr, en]
- seoTitle: Text
- seoDescription: Text
```

**Collection Type: JobOffer**
```
- title: Text (required)
- slug: UID
- description: Rich Text
- location: Text
- contractType: Enumeration [CDI, CDD, Stage, Alternance, Freelance]
- department: Text
- isActive: Boolean (default: true)
```

**Collection Type: MarketingKPI**
```
- label: Text (required)
- value: Text (required)
- icon: Text
- order: Integer
```

**Step 2: Enable i18n plugin**

In Strapi admin: Settings → Internationalization → Add "English (en)" locale.

**Step 3: Configure webhooks**

In Strapi admin: Settings → Webhooks → Create webhook:
- URL: `https://flows.alecia.fr/api/v1/webhooks/strapi`
- Events: entry.create, entry.update, entry.publish, entry.unpublish
- Content Types: All

**Step 4: Commit**

```bash
git add services/cms/
git commit -m "feat: create 5 Strapi content types (Transaction, Team, Blog, Jobs, KPIs)"
```

---

#### Task 6.3: Deploy Strapi to Coolify

**Files:**
- Create: `services/cms/Dockerfile`
- Create: `infrastructure/strapi/docker-compose.yml`

**Step 1: Create Dockerfile**

```dockerfile
# services/cms/Dockerfile
FROM node:20-alpine
RUN apk add --no-cache build-base gcc autoconf automake libtool zlib-dev libpng-dev
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 1337
CMD ["npm", "run", "start"]
```

**Step 2: Create deployment compose**

```yaml
# infrastructure/strapi/docker-compose.yml
services:
  strapi:
    build: ../../services/cms
    container_name: alecia-strapi
    restart: unless-stopped
    environment:
      DATABASE_HOST: alecia-postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: alecia
      DATABASE_USERNAME: alecia
      DATABASE_PASSWORD: ${POSTGRES_PASSWORD}
      DATABASE_SCHEMA: alecia_cms
      MINIO_ACCESS_KEY: ${MINIO_ROOT_USER}
      MINIO_SECRET_KEY: ${MINIO_ROOT_PASSWORD}
      MINIO_ENDPOINT: https://s3.alecia.fr
      MINIO_BUCKET: alecia-media
      APP_KEYS: ${STRAPI_APP_KEYS}
      API_TOKEN_SALT: ${STRAPI_API_TOKEN_SALT}
      ADMIN_JWT_SECRET: ${STRAPI_ADMIN_JWT_SECRET}
      JWT_SECRET: ${STRAPI_JWT_SECRET}
    ports:
      - "1337:1337"
```

**Step 3: Deploy and verify at `https://cms.alecia.fr/admin`**

**Step 4: Commit**

```bash
git add services/cms/Dockerfile infrastructure/strapi/
git commit -m "infra: deploy Strapi CMS at cms.alecia.fr"
```

---

### Sprint 7: Migrate Marketing Site Data

**Objective:** Export all CMS-managed content from Convex and import into Strapi. Update the marketing site to fetch from Strapi API.

#### Task 7.1: Export CMS Data from Convex

**Files:**
- Create: `scripts/migration/export-cms-from-convex.ts`

**Step 1: Write export script**

```typescript
// scripts/migration/export-cms-from-convex.ts
// Exports transactions, team_members, blog_posts, job_offers, marketing_kpis
// from Convex and writes JSON files for Strapi import

import { ConvexClient } from "convex/browser";

const client = new ConvexClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function exportAll() {
  // Export transactions (tombstones)
  const transactions = await client.query("transactions:list" as any);
  await Bun.write("scripts/migration/data/transactions.json", JSON.stringify(transactions, null, 2));

  // Export team members
  const team = await client.query("teamMembers:list" as any);
  await Bun.write("scripts/migration/data/team_members.json", JSON.stringify(team, null, 2));

  // Export blog posts
  const posts = await client.query("blogPosts:list" as any);
  await Bun.write("scripts/migration/data/blog_posts.json", JSON.stringify(posts, null, 2));

  // Export job offers
  const jobs = await client.query("jobOffers:list" as any);
  await Bun.write("scripts/migration/data/job_offers.json", JSON.stringify(jobs, null, 2));

  // Export marketing KPIs
  const kpis = await client.query("marketingKpis:list" as any);
  await Bun.write("scripts/migration/data/marketing_kpis.json", JSON.stringify(kpis, null, 2));

  console.log("Export complete. Files in scripts/migration/data/");
}

exportAll();
```

**Step 2: Run export**

```bash
bun run scripts/migration/export-cms-from-convex.ts
```

**Step 3: Commit exported data**

```bash
git add scripts/migration/
git commit -m "data: export CMS content from Convex for Strapi import"
```

---

#### Task 7.2: Import Data into Strapi

**Files:**
- Create: `scripts/migration/import-to-strapi.ts`

**Step 1: Write Strapi import script**

Uses Strapi REST API to create entries:

```typescript
// scripts/migration/import-to-strapi.ts
const STRAPI_URL = "https://cms.alecia.fr";
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

async function importCollection(collectionName: string, data: any[]) {
  for (const item of data) {
    const res = await fetch(`${STRAPI_URL}/api/${collectionName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
      body: JSON.stringify({ data: item }),
    });
    if (!res.ok) {
      console.error(`Failed to import ${collectionName}:`, await res.text());
    }
  }
}

async function main() {
  // Transform Convex data shape → Strapi data shape, then import
  const transactions = JSON.parse(await Bun.file("scripts/migration/data/transactions.json").text());
  await importCollection("transactions", transactions.map(transformTransaction));

  const team = JSON.parse(await Bun.file("scripts/migration/data/team_members.json").text());
  await importCollection("team-members", team.map(transformTeamMember));

  // ... repeat for blog_posts, job_offers, marketing_kpis
  console.log("Import complete.");
}

// Transform functions map Convex field names → Strapi field names
function transformTransaction(t: any) {
  return {
    title: t.title,
    companyName: t.companyName || t.company_name,
    sector: t.sector,
    dealType: t.dealType || t.deal_type,
    year: t.year,
    description: t.description,
    isConfidential: t.isConfidential || false,
    featured: t.featured || false,
  };
}

function transformTeamMember(m: any) {
  return {
    fullName: m.fullName || m.name,
    role: m.role || m.title,
    bioFr: m.bio || m.bioFr,
    bioEn: m.bioEn || "",
    expertise: m.expertise || [],
    linkedinUrl: m.linkedin || m.linkedinUrl,
    email: m.email,
    officeLocation: m.location || m.officeLocation,
    order: m.order || 0,
  };
}

main();
```

**Step 2: Run import**

```bash
bun run scripts/migration/import-to-strapi.ts
```

**Step 3: Verify data in Strapi admin** at `https://cms.alecia.fr/admin`

**Step 4: Commit**

```bash
git add scripts/migration/
git commit -m "data: import CMS content into Strapi from Convex export"
```

---

#### Task 7.3: Update Marketing Site to Use Strapi API

**Files:**
- Modify: `apps/website/src/lib/strapi.ts` (create)
- Modify: `apps/website/src/app/[locale]/` — multiple page components

**Step 1: Create Strapi API client**

```typescript
// apps/website/src/lib/strapi.ts
const STRAPI_URL = process.env.STRAPI_URL || "https://cms.alecia.fr";
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

export async function fetchStrapi<T>(
  path: string,
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(`/api${path}`, STRAPI_URL);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${STRAPI_TOKEN}`,
    },
    next: { revalidate: 60 }, // ISR: revalidate every 60 seconds
  });
  if (!res.ok) throw new Error(`Strapi fetch failed: ${res.status}`);
  return res.json();
}

// Typed helpers
export const getTransactions = () =>
  fetchStrapi<StrapiResponse<Transaction[]>>("/transactions?populate=*&sort=year:desc");

export const getTeamMembers = () =>
  fetchStrapi<StrapiResponse<TeamMember[]>>("/team-members?populate=*&sort=order:asc");

export const getBlogPosts = () =>
  fetchStrapi<StrapiResponse<BlogPost[]>>("/blog-posts?populate=*&sort=publishedAt:desc");

export const getJobOffers = () =>
  fetchStrapi<StrapiResponse<JobOffer[]>>("/job-offers?filters[isActive][$eq]=true");

export const getKPIs = () =>
  fetchStrapi<StrapiResponse<MarketingKPI[]>>("/marketing-kpis?sort=order:asc");
```

**Step 2: Replace Convex queries with Strapi calls**

For each marketing page that currently uses `useQuery(api.transactions.list)` or similar Convex calls, replace with:
- Server Components: Use `getTransactions()` directly
- Remove `"use client"` where possible (prefer server components)
- Remove Convex provider from marketing layout (keep for admin only)

Key files to update:
- `apps/website/src/app/[locale]/page.tsx` — Homepage (KPIs, featured transactions)
- `apps/website/src/app/[locale]/operations/page.tsx` — Tombstones
- `apps/website/src/app/[locale]/equipe/page.tsx` — Team
- `apps/website/src/app/[locale]/actualites/page.tsx` — Blog
- `apps/website/src/app/[locale]/nous-rejoindre/page.tsx` — Jobs

**Step 3: Set up ISR revalidation webhook**

```typescript
// apps/website/src/app/api/revalidate/route.ts
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-webhook-secret");
  if (secret !== process.env.REVALIDATION_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }
  // Revalidate all marketing pages
  revalidatePath("/", "layout");
  return Response.json({ revalidated: true });
}
```

**Step 4: Test marketing site with Strapi backend**

```bash
cd apps/website
STRAPI_URL=https://cms.alecia.fr STRAPI_API_TOKEN=xxx pnpm dev
```

**Step 5: Commit**

```bash
git add apps/website/src/lib/strapi.ts apps/website/src/app/
git commit -m "feat: replace Convex with Strapi API for marketing site content"
```

---

### Sprint 8: Containerize Marketing Site

**Objective:** Build the marketing site as a Docker container and deploy to Coolify at `alecia.fr`.

#### Task 8.1: Create Dockerfile for Marketing Site

**Files:**
- Create: `apps/website/Dockerfile`
- Create: `infrastructure/marketing/docker-compose.yml`

**Step 1: Create multi-stage Dockerfile**

```dockerfile
# apps/website/Dockerfile
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/website/package.json apps/website/
COPY packages/ui/package.json packages/ui/
RUN corepack enable && pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && pnpm build:website

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/apps/website/.next/standalone ./
COPY --from=builder /app/apps/website/.next/static ./apps/website/.next/static
COPY --from=builder /app/apps/website/public ./apps/website/public
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "apps/website/server.js"]
```

**Step 2: Create deployment compose**

```yaml
# infrastructure/marketing/docker-compose.yml
services:
  next-marketing:
    build:
      context: ../..
      dockerfile: apps/website/Dockerfile
    container_name: alecia-marketing
    restart: unless-stopped
    environment:
      STRAPI_URL: http://alecia-strapi:1337
      STRAPI_API_TOKEN: ${STRAPI_API_TOKEN}
      NEXT_PUBLIC_SITE_URL: https://alecia.fr
      REVALIDATION_SECRET: ${REVALIDATION_SECRET}
    ports:
      - "3000:3000"
```

**Step 3: Deploy via Coolify and verify at `https://alecia.fr`**

**Step 4: Commit**

```bash
git add apps/website/Dockerfile infrastructure/marketing/
git commit -m "infra: containerize marketing site for Coolify deployment"
```

---

**Phase 2 Completion Checklist:**
- [ ] Strapi CE deployed at cms.alecia.fr with 5 content types
- [ ] Minio S3 upload provider configured
- [ ] CMS content exported from Convex and imported into Strapi
- [ ] Marketing site updated to fetch from Strapi REST API
- [ ] ISR revalidation webhook configured
- [ ] Marketing site containerized and deployed at alecia.fr
- [ ] Webhooks from Strapi to Activepieces configured

---

## Phase 3 — Database Schema & Data Migration

> **Goal:** Design the full PostgreSQL schema (shared + isolated), write migration scripts to move all 69+ Convex tables to PostgreSQL, and execute the migration while preserving data integrity and referential relationships.
> **Depends on:** Phase 0 complete (PostgreSQL running with schemas).
> **Can run in parallel with:** Phases 1 and 2.

### Sprint 9: Design Full PostgreSQL Schema

**Objective:** Create all PostgreSQL tables, indexes, and constraints for the shared and isolated schemas.

#### Task 9.1: Create Shared Schema Tables

**Files:**
- Create: `infrastructure/postgres/migrations/V001__shared_tables.sql`

**Step 1: Write shared schema migration**

```sql
-- infrastructure/postgres/migrations/V001__shared_tables.sql
-- Shared schema: cross-tool entities referenced by all services

-- Custom types
CREATE TYPE shared.deal_stage AS ENUM (
    'sourcing', 'qualification', 'initial_meeting', 'analysis',
    'valuation', 'due_diligence', 'negotiation', 'closing',
    'closed_won', 'closed_lost'
);

CREATE TYPE shared.deal_priority AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TYPE shared.user_role AS ENUM ('sudo', 'partner', 'advisor', 'user');

-- Users table (synced from Keycloak)
CREATE TABLE shared.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keycloak_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role shared.user_role NOT NULL DEFAULT 'user',
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companies table (CRM, Pappers-enriched)
CREATE TABLE shared.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    siren CHAR(9),
    siret CHAR(14),
    naf_code TEXT,
    vat_number TEXT,
    website TEXT,
    logo_url TEXT,
    address JSONB, -- {street, city, zip, country, lat, lng}
    financials JSONB, -- {revenue, ebitda, netDebt, employees, year, currency}
    pappers_data JSONB, -- Full Pappers enrichment cache
    pipedrive_id TEXT,
    source TEXT DEFAULT 'manual',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_companies_siren ON shared.companies(siren);
CREATE INDEX idx_companies_name_trgm ON shared.companies USING gin(name gin_trgm_ops);

-- Contacts table
CREATE TABLE shared.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES shared.companies(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT,
    tags TEXT[] DEFAULT '{}',
    external_id TEXT,
    source TEXT DEFAULT 'manual',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_contacts_company ON shared.contacts(company_id);
CREATE INDEX idx_contacts_email ON shared.contacts(email);

-- Deals table (M&A pipeline)
CREATE TABLE shared.deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    stage shared.deal_stage NOT NULL DEFAULT 'sourcing',
    amount NUMERIC(15,2),
    currency TEXT DEFAULT 'EUR',
    probability INTEGER CHECK (probability BETWEEN 0 AND 100),
    owner_id UUID REFERENCES shared.users(id) ON DELETE SET NULL,
    company_id UUID REFERENCES shared.companies(id) ON DELETE SET NULL,
    priority shared.deal_priority DEFAULT 'medium',
    tags TEXT[] DEFAULT '{}',
    expected_close_date TIMESTAMPTZ,
    source TEXT DEFAULT 'manual',
    pipedrive_id BIGINT,
    external_id TEXT,
    is_archived BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_deals_stage ON shared.deals(stage);
CREATE INDEX idx_deals_owner ON shared.deals(owner_id);
CREATE INDEX idx_deals_company ON shared.deals(company_id);
CREATE INDEX idx_deals_created ON shared.deals(created_at DESC);

-- Deal stage history
CREATE TABLE shared.deal_stage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES shared.deals(id) ON DELETE CASCADE,
    from_stage shared.deal_stage,
    to_stage shared.deal_stage NOT NULL,
    changed_by UUID REFERENCES shared.users(id),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_deal_history_deal ON shared.deal_stage_history(deal_id);

-- Cross-service audit log
CREATE TABLE shared.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES shared.users(id),
    service TEXT NOT NULL, -- 'bi', 'numbers', 'sign', 'colab', 'flows'
    action TEXT NOT NULL, -- 'create', 'update', 'delete', 'view', 'sign'
    entity_type TEXT NOT NULL, -- 'deal', 'company', 'document'
    entity_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_user ON shared.audit_log(user_id);
CREATE INDEX idx_audit_entity ON shared.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_created ON shared.audit_log(created_at DESC);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION shared.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON shared.users
    FOR EACH ROW EXECUTE FUNCTION shared.update_updated_at();
CREATE TRIGGER trg_companies_updated_at BEFORE UPDATE ON shared.companies
    FOR EACH ROW EXECUTE FUNCTION shared.update_updated_at();
CREATE TRIGGER trg_contacts_updated_at BEFORE UPDATE ON shared.contacts
    FOR EACH ROW EXECUTE FUNCTION shared.update_updated_at();
CREATE TRIGGER trg_deals_updated_at BEFORE UPDATE ON shared.deals
    FOR EACH ROW EXECUTE FUNCTION shared.update_updated_at();
```

**Step 2: Run migration**

```bash
docker exec -i alecia-postgres psql -U alecia -d alecia < \
  infrastructure/postgres/migrations/V001__shared_tables.sql
```

**Step 3: Verify**

```bash
docker exec alecia-postgres psql -U alecia -d alecia -c \
  "SELECT table_name FROM information_schema.tables WHERE table_schema='shared';"
# Expected: users, companies, contacts, deals, deal_stage_history, audit_log
```

**Step 4: Commit**

```bash
git add infrastructure/postgres/migrations/
git commit -m "db: create shared schema tables (users, companies, contacts, deals, audit_log)"
```

---

#### Task 9.2: Create Isolated Schema Tables

**Files:**
- Create: `infrastructure/postgres/migrations/V002__bi_tables.sql`
- Create: `infrastructure/postgres/migrations/V003__numbers_tables.sql`
- Create: `infrastructure/postgres/migrations/V004__colab_tables.sql`
- Create: `infrastructure/postgres/migrations/V005__sign_tables.sql`

These migrations create all tool-specific tables. Key schemas:

**alecia_bi** (Business Intelligence):
- `embeddings` (pgvector, 1536 dimensions)
- `research_feeds` (Miniflux sync)
- `research_tasks`
- `buyer_criteria`
- `market_studies`
- `open_data_cache`

**alecia_numbers** (Financial Tools):
- `financial_models`
- `valuations`
- `comparables`
- `dd_checklists` + `dd_checklist_items`
- `fee_calculations`
- `timelines`
- `teaser_tracking`
- `post_deal_integration`
- `pipeline_snapshots`
- `spreadsheets` (FortuneSheet data as JSONB)

**alecia_colab** (Collaboration):
- `documents` + `document_versions`
- `boards`, `lists`, `cards`, `labels`, `checklists`
- `yjs_state` (Hocuspocus persistence)
- `presentations`
- `presence`

**alecia_sign** (E-Signature + Data Room):
- `deal_rooms` + `deal_room_folders` + `deal_room_documents`
- `deal_room_access_log`
- `deal_room_questions`
- `deal_room_invitations`

**Step 1: Write all migration files (detailed SQL for each schema)**

Each file follows the same pattern as V001 — CREATE TABLE with proper types, FKs referencing `shared.deals(id)`, indexes, and triggers.

**Step 2: Run all migrations in order**

```bash
for f in infrastructure/postgres/migrations/V00*.sql; do
  echo "Running $f..."
  docker exec -i alecia-postgres psql -U alecia -d alecia < "$f"
done
```

**Step 3: Verify table counts per schema**

```bash
docker exec alecia-postgres psql -U alecia -d alecia -c "
  SELECT schemaname, count(*) as table_count
  FROM information_schema.tables
  WHERE table_schema LIKE 'alecia_%' OR table_schema = 'shared'
  GROUP BY schemaname
  ORDER BY schemaname;"
# Expected: shared(6), alecia_bi(6), alecia_numbers(10), alecia_colab(12), alecia_sign(7)
```

**Step 4: Commit**

```bash
git add infrastructure/postgres/migrations/
git commit -m "db: create all isolated schema tables (bi, numbers, colab, sign)"
```

---

### Sprint 10: Migrate CRM Core Data (Convex → PostgreSQL)

**Objective:** Export deals, companies, contacts from Convex and import into PostgreSQL shared schema.

#### Task 10.1: Write Convex Export Script

**Files:**
- Create: `scripts/migration/export-crm-from-convex.ts`

**Step 1: Write comprehensive export**

```typescript
// scripts/migration/export-crm-from-convex.ts
// Exports: users, companies, contacts, deals, deal_stage_history,
// comments, buyer_criteria, embeddings, microsoft_tokens, pipedrive_tokens

import { ConvexClient } from "convex/browser";
import { writeFileSync, mkdirSync } from "fs";

const client = new ConvexClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const OUT_DIR = "scripts/migration/data/crm";
mkdirSync(OUT_DIR, { recursive: true });

async function exportTable(queryName: string, fileName: string) {
  console.log(`Exporting ${queryName}...`);
  const data = await client.query(queryName as any);
  writeFileSync(`${OUT_DIR}/${fileName}.json`, JSON.stringify(data, null, 2));
  console.log(`  → ${data.length} records exported`);
  return data;
}

async function main() {
  await exportTable("users:list", "users");
  await exportTable("companies:list", "companies");
  await exportTable("contacts:list", "contacts");
  await exportTable("deals:list", "deals");
  // ... all CRM-related tables
  console.log("CRM export complete.");
}

main();
```

**Step 2: Run export and verify data**

**Step 3: Commit**

```bash
git add scripts/migration/
git commit -m "data: export CRM data from Convex (users, companies, deals, contacts)"
```

---

#### Task 10.2: Write PostgreSQL Import Script

**Files:**
- Create: `scripts/migration/import-crm-to-postgres.ts`

**Step 1: Write import with ID mapping**

The script must:
1. Map Convex IDs (`_id`) to PostgreSQL UUIDs
2. Preserve referential integrity (company_id, owner_id on deals)
3. Map Clerk user IDs to Keycloak IDs (placeholder until Keycloak migration)
4. Handle JSONB fields (address, financials, pappers_data)
5. Map Convex enums to PostgreSQL enums

```typescript
// scripts/migration/import-crm-to-postgres.ts
import { Pool } from "pg";
import { readFileSync } from "fs";
import { v4 as uuidv4 } from "uuid";

const pool = new Pool({
  host: process.env.PG_HOST || "localhost",
  port: 5432,
  database: "alecia",
  user: "alecia",
  password: process.env.POSTGRES_PASSWORD,
});

// ID mapping: Convex _id → PostgreSQL UUID
const idMap = new Map<string, string>();

function mapId(convexId: string): string {
  if (!idMap.has(convexId)) {
    idMap.set(convexId, uuidv4());
  }
  return idMap.get(convexId)!;
}

async function importCompanies() {
  const companies = JSON.parse(readFileSync("scripts/migration/data/crm/companies.json", "utf-8"));
  for (const c of companies) {
    const pgId = mapId(c._id);
    await pool.query(
      `INSERT INTO shared.companies (id, name, siren, naf_code, website, logo_url, address, financials, pappers_data, pipedrive_id, source, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [pgId, c.name, c.siren, c.nafCode, c.website, c.logoUrl,
       JSON.stringify(c.address || {}), JSON.stringify(c.financials || {}),
       JSON.stringify(c.pappersData || {}), c.pipedriveId, c.source || 'manual',
       new Date(c._creationTime)]
    );
  }
  console.log(`Imported ${companies.length} companies`);
}

async function importDeals() {
  const deals = JSON.parse(readFileSync("scripts/migration/data/crm/deals.json", "utf-8"));
  for (const d of deals) {
    const pgId = mapId(d._id);
    const ownerId = d.ownerId ? mapId(d.ownerId) : null;
    const companyId = d.companyId ? mapId(d.companyId) : null;
    await pool.query(
      `INSERT INTO shared.deals (id, title, description, stage, amount, probability, owner_id, company_id, priority, tags, expected_close_date, pipedrive_id, source, created_at)
       VALUES ($1, $2, $3, $4::shared.deal_stage, $5, $6, $7, $8, $9::shared.deal_priority, $10, $11, $12, $13, $14)`,
      [pgId, d.title, d.description, d.stage, d.amount, d.probability,
       ownerId, companyId, d.priority || 'medium', d.tags || [],
       d.expectedCloseDate ? new Date(d.expectedCloseDate) : null,
       d.pipedriveId, d.source || 'manual', new Date(d._creationTime)]
    );
  }
  console.log(`Imported ${deals.length} deals`);
}

// ... similar functions for contacts, users, deal_stage_history

async function main() {
  await importCompanies();
  // importUsers first (for FK references), then deals, then contacts
  await importDeals();
  // Save ID map for subsequent migrations
  writeFileSync("scripts/migration/data/id-map.json",
    JSON.stringify(Object.fromEntries(idMap), null, 2));
  console.log("CRM import complete. ID map saved.");
  await pool.end();
}

main();
```

**Step 2: Run import and verify row counts**

```bash
bun run scripts/migration/import-crm-to-postgres.ts
docker exec alecia-postgres psql -U alecia -d alecia -c "SELECT count(*) FROM shared.deals;"
```

**Step 3: Commit**

```bash
git add scripts/migration/
git commit -m "data: migrate CRM data to PostgreSQL (companies, deals, contacts)"
```

---

### Sprint 11: Migrate Numbers Data

**Objective:** Export all 10 M&A financial tool datasets from Convex and import into `alecia_numbers` schema.

#### Task 11.1: Export Numbers Data from Convex

Similar to Task 10.1 but for tables:
- `numbers_financial_models`
- `numbers_valuations`
- `numbers_comparables`
- `numbers_dd_checklists`
- `numbers_pipeline`
- `numbers_timelines`
- `numbers_teaser_tracking`
- `numbers_fee_calculations`
- `numbers_post_deal`
- `numbers_spreadsheets`

#### Task 11.2: Import Numbers Data to PostgreSQL

Using the `id-map.json` from Sprint 10 to resolve `deal_id` foreign keys.

---

### Sprint 12: Migrate Data Rooms & Sign Data

**Objective:** Export data room tables from Convex and import into `alecia_sign` schema. Migrate files from Convex storage to Minio.

#### Task 12.1: Migrate Data Room Structure

Tables to migrate:
- `deal_rooms` → `alecia_sign.deal_rooms`
- `deal_room_folders` → `alecia_sign.deal_room_folders`
- `deal_room_documents` → `alecia_sign.deal_room_documents`
- `deal_room_access_log` → `alecia_sign.deal_room_access_log`
- `deal_room_questions` → `alecia_sign.deal_room_questions`
- `deal_room_invitations` → `alecia_sign.deal_room_invitations`

#### Task 12.2: Migrate Files from Convex Storage to Minio

**Files:**
- Create: `scripts/migration/migrate-files-to-minio.ts`

**Step 1: Write file migration script**

```typescript
// scripts/migration/migrate-files-to-minio.ts
// Downloads files from Convex storage URLs and uploads to Minio buckets

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  endpoint: "https://s3.alecia.fr",
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.MINIO_ROOT_USER!,
    secretAccessKey: process.env.MINIO_ROOT_PASSWORD!,
  },
  forcePathStyle: true,
});

async function migrateFile(convexUrl: string, bucket: string, key: string) {
  const response = await fetch(convexUrl);
  const buffer = await response.arrayBuffer();
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: Buffer.from(buffer),
    ContentType: response.headers.get("content-type") || "application/octet-stream",
  }));
}

// Process all documents from deal_room_documents
// Map: Convex storage URL → Minio bucket/key
// Update PostgreSQL records with new Minio URLs
```

**Step 2: Run file migration**

**Step 3: Verify file count in Minio matches Convex**

**Step 4: Commit**

```bash
git add scripts/migration/
git commit -m "data: migrate files from Convex storage to Minio buckets"
```

---

**Phase 3 Completion Checklist:**
- [ ] All PostgreSQL schemas created with tables, indexes, constraints
- [ ] CRM data migrated (users, companies, contacts, deals)
- [ ] Numbers data migrated (10 tool datasets)
- [ ] Data room data migrated (rooms, folders, documents, logs)
- [ ] Files migrated from Convex storage to Minio
- [ ] ID mapping preserved (Convex _id → PostgreSQL UUID)
- [ ] Foreign key integrity verified across schemas
- [ ] Row counts verified against Convex source

---

## Phase 4 — BI/CRM Application Adaptation

> **Goal:** Adapt the existing BI/CRM admin panel to use PostgreSQL instead of Convex. Replace all Convex queries/mutations with PostgreSQL calls (via Drizzle ORM or Prisma), replace Clerk auth with Keycloak OIDC, and containerize for deployment at `app.alecia.fr`.
> **Depends on:** Phase 3 complete (PostgreSQL populated with migrated data).

### Sprint 13: Replace Convex with PostgreSQL in BI Core

**Objective:** Create a PostgreSQL data access layer and replace Convex queries in all BI/CRM pages.

#### Task 13.1: Set Up Drizzle ORM with PostgreSQL Schemas

**Files:**
- Create: `packages/db/` — shared database package
- Create: `packages/db/src/schema/shared.ts`
- Create: `packages/db/src/schema/bi.ts`
- Create: `packages/db/src/schema/numbers.ts`
- Create: `packages/db/src/index.ts`

**Step 1: Initialize database package**

```bash
mkdir -p packages/db/src/schema
cd packages/db
pnpm init
pnpm add drizzle-orm pg
pnpm add -D drizzle-kit @types/pg typescript
```

**Step 2: Define Drizzle schemas matching PostgreSQL tables**

```typescript
// packages/db/src/schema/shared.ts
import { pgSchema, uuid, text, numeric, integer, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";

export const shared = pgSchema("shared");

export const dealStageEnum = pgEnum("deal_stage", [
  "sourcing", "qualification", "initial_meeting", "analysis",
  "valuation", "due_diligence", "negotiation", "closing",
  "closed_won", "closed_lost"
]);

export const userRoleEnum = pgEnum("user_role", ["sudo", "partner", "advisor", "user"]);

export const users = shared.table("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  keycloakId: text("keycloak_id").unique().notNull(),
  email: text("email").unique().notNull(),
  fullName: text("full_name").notNull(),
  role: userRoleEnum("role").default("user").notNull(),
  avatarUrl: text("avatar_url"),
  preferences: jsonb("preferences").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const companies = shared.table("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  siren: text("siren"),
  website: text("website"),
  logoUrl: text("logo_url"),
  address: jsonb("address"),
  financials: jsonb("financials"),
  pappersData: jsonb("pappers_data"),
  pipedriveId: text("pipedrive_id"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const deals = shared.table("deals", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  stage: dealStageEnum("stage").default("sourcing").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }),
  probability: integer("probability"),
  ownerId: uuid("owner_id").references(() => users.id),
  companyId: uuid("company_id").references(() => companies.id),
  tags: text("tags").array(),
  expectedCloseDate: timestamp("expected_close_date", { withTimezone: true }),
  isArchived: boolean("is_archived").default(false),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ... contacts, deal_stage_history, audit_log
```

**Step 3: Create database client**

```typescript
// packages/db/src/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as shared from "./schema/shared";
import * as bi from "./schema/bi";
import * as numbers from "./schema/numbers";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, {
  schema: { ...shared, ...bi, ...numbers },
});

export { shared, bi, numbers };
export type DB = typeof db;
```

**Step 4: Add to pnpm-workspace.yaml and turbo.json**

**Step 5: Commit**

```bash
git add packages/db/
git commit -m "feat: create @alepanel/db package with Drizzle ORM schemas"
```

---

#### Task 13.2: Replace Convex Queries in BI Admin Pages

**Files:**
- Modify: `apps/website/src/app/[locale]/admin/` — all admin page components
- Create: `apps/website/src/lib/db.ts` — server-side DB access

**Step 1: Create server-side database utilities**

```typescript
// apps/website/src/lib/db.ts
import { db, shared } from "@alepanel/db";
import { eq, desc, and, ilike, sql } from "drizzle-orm";

// Deals
export async function getDeals(filters?: { stage?: string; ownerId?: string }) {
  return db
    .select()
    .from(shared.deals)
    .leftJoin(shared.companies, eq(shared.deals.companyId, shared.companies.id))
    .leftJoin(shared.users, eq(shared.deals.ownerId, shared.users.id))
    .where(
      and(
        filters?.stage ? eq(shared.deals.stage, filters.stage as any) : undefined,
        filters?.ownerId ? eq(shared.deals.ownerId, filters.ownerId) : undefined,
        eq(shared.deals.isArchived, false)
      )
    )
    .orderBy(desc(shared.deals.createdAt));
}

// Companies
export async function searchCompanies(query: string) {
  return db
    .select()
    .from(shared.companies)
    .where(ilike(shared.companies.name, `%${query}%`))
    .limit(20);
}

// Pipeline analytics
export async function getPipelineStats() {
  return db
    .select({
      stage: shared.deals.stage,
      count: sql<number>`count(*)`,
      totalAmount: sql<number>`sum(${shared.deals.amount})`,
    })
    .from(shared.deals)
    .where(eq(shared.deals.isArchived, false))
    .groupBy(shared.deals.stage);
}
```

**Step 2: Replace Convex `useQuery()` calls with server actions / RSC data fetching**

For each admin page, replace patterns like:
```typescript
// BEFORE (Convex)
const deals = useQuery(api.deals.list, { stage: "sourcing" });

// AFTER (PostgreSQL via RSC)
const deals = await getDeals({ stage: "sourcing" });
```

**Step 3: Replace Convex `useMutation()` with server actions**

```typescript
// BEFORE (Convex)
const updateDeal = useMutation(api.deals.update);
await updateDeal({ id, stage: "qualification" });

// AFTER (Server Action)
"use server";
import { db, shared } from "@alepanel/db";
import { eq } from "drizzle-orm";

export async function updateDealStage(dealId: string, newStage: string) {
  await db.update(shared.deals)
    .set({ stage: newStage as any, updatedAt: new Date() })
    .where(eq(shared.deals.id, dealId));
  // Log stage change
  await db.insert(shared.dealStageHistory).values({
    dealId, toStage: newStage as any,
  });
}
```

**Step 4: Test all admin pages**

Navigate through all admin routes and verify data loads correctly from PostgreSQL.

**Step 5: Commit**

```bash
git add apps/website/src/
git commit -m "feat: replace Convex queries with PostgreSQL/Drizzle in BI admin"
```

---

### Sprint 14: Adapt AI & External Integrations

**Objective:** Port AI features (Groq, OpenAI) and external API integrations (Pappers, Pipedrive) from Convex actions to standalone server functions.

#### Task 14.1: Port AI Actions to Server Functions

**Files:**
- Create: `packages/ai/src/` — shared AI service package
- Migrate from: `convex/actions/ai.ts`, `convex/actions/intelligence.ts`

**Step 1: Create AI service package**

Extract the following from `convex/actions/ai.ts` (currently ~26k chars):
- `generateDealSummary()` — Groq LLaMA 3.3 70B
- `scoreDealRisk()` — Risk analysis
- `generateTeaser()` — M&A teaser document
- `suggestValuation()` — Sector-adjusted multiples
- `summarizeDocument()` — Document summarization
- `extractKeyTerms()` — LOI/NDA clause analysis
- `translateDocument()` — FR↔EN legal translation
- `matchDealBuyer()` — OpenAI embeddings similarity

**Step 2: Replace Convex `ctx.runAction()` with direct function calls**

Each function becomes a standalone async function that:
- Takes parameters directly (no Convex context)
- Reads/writes PostgreSQL via `@alepanel/db`
- Calls Groq/OpenAI APIs directly

**Step 3: Commit**

```bash
git add packages/ai/
git commit -m "feat: port AI services from Convex actions to standalone package"
```

---

#### Task 14.2: Port External Integrations

**Files:**
- Create: `packages/integrations/src/pappers.ts`
- Create: `packages/integrations/src/pipedrive.ts`
- Create: `packages/integrations/src/microsoft.ts`
- Create: `packages/integrations/src/google.ts`
- Migrate from: `convex/actions/microsoft.ts` (~17k chars), `convex/companies.ts`, `convex/pipedrive.ts`

**Step 1: Port Microsoft Graph integration**

The existing `convex/actions/microsoft.ts` contains:
- OneDrive file browsing/search
- Excel read/write ranges
- SharePoint integration
- Calendar sync
- OAuth token refresh

Port each function to use PostgreSQL for token storage (encrypted) and direct API calls.

**Step 2: Port Pappers API integration**

Port company enrichment from `convex/actions/intelligence.ts`.

**Step 3: Port Pipedrive sync**

Port bidirectional sync from `convex/pipedrive.ts`.

**Step 4: Commit**

```bash
git add packages/integrations/
git commit -m "feat: port external integrations (MS Graph, Pappers, Pipedrive) to standalone package"
```

---

### Sprint 15: Replace Clerk with Keycloak in BI

**Objective:** Remove Clerk authentication from the admin panel and replace with Keycloak OIDC.

#### Task 15.1: Install Keycloak OIDC Client

**Files:**
- Modify: `apps/website/package.json` — remove `@clerk/nextjs`, add OIDC library
- Create: `apps/website/src/lib/auth.ts` — Keycloak auth utilities
- Modify: `apps/website/src/middleware.ts` — OIDC session validation

**Step 1: Install NextAuth.js with Keycloak provider**

```bash
cd apps/website
pnpm remove @clerk/nextjs
pnpm add next-auth @auth/core
```

**Step 2: Configure Keycloak provider**

```typescript
// apps/website/src/lib/auth.ts
import NextAuth from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER!, // https://auth.alecia.fr/realms/alecia
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.keycloakId = profile?.sub;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.user.keycloakId = token.keycloakId as string;
      // Fetch user role from PostgreSQL
      const dbUser = await db.select().from(shared.users)
        .where(eq(shared.users.keycloakId, token.keycloakId as string))
        .limit(1);
      if (dbUser[0]) {
        session.user.role = dbUser[0].role;
      }
      return session;
    },
  },
});
```

**Step 3: Update middleware to use Keycloak session**

**Step 4: Remove all `<ClerkProvider>`, `<SignIn>`, `useUser()`, `useAuth()` references**

**Step 5: Test login flow end-to-end**

**Step 6: Commit**

```bash
git add apps/website/
git commit -m "auth: replace Clerk with Keycloak OIDC via NextAuth.js"
```

---

**Phase 4 Completion Checklist:**
- [ ] Drizzle ORM schemas matching all PostgreSQL tables
- [ ] All Convex queries replaced with PostgreSQL queries
- [ ] All Convex mutations replaced with server actions
- [ ] AI services ported to standalone package
- [ ] External integrations ported (MS Graph, Pappers, Pipedrive)
- [ ] Clerk removed, Keycloak OIDC via NextAuth.js working
- [ ] Admin panel fully functional with PostgreSQL backend

---

## Phase 5 — Activepieces Custom Pieces

> **Goal:** Build the 7 custom Activepieces "pieces" (plugins) that connect Alecia Flows to every other service in the suite.
> **Depends on:** Phase 1 Sprint 4 (Activepieces deployed).

### Sprint 16: Build piece-crm + piece-ai

**Objective:** Create `@alecia/piece-crm` and `@alecia/piece-ai` — the two most critical integration pieces.

#### Task 16.1: Build @alecia/piece-crm

**Files:**
- Create: `services/flows-pieces/pieces/alecia-crm/` (inside Activepieces fork)

**Step 1: Scaffold piece**

```typescript
// pieces/alecia-crm/src/index.ts
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { createDeal } from "./lib/actions/create-deal";
import { updateDealStage } from "./lib/actions/update-deal-stage";
import { searchCompanies } from "./lib/actions/search-companies";
import { enrichCompany } from "./lib/actions/enrich-company";
import { onDealCreated } from "./lib/triggers/on-deal-created";
import { onDealStageChanged } from "./lib/triggers/on-deal-stage-changed";

export const aleciaCrm = createPiece({
  displayName: "Alecia CRM",
  description: "Manage deals, companies, and contacts in Alecia BI",
  auth: PieceAuth.SecretText({
    displayName: "Database Connection String",
    required: true,
  }),
  minimumSupportedRelease: "0.20.0",
  logoUrl: "https://alecia.fr/alecia-crm-piece.svg",
  authors: ["alecia"],
  actions: [createDeal, updateDealStage, searchCompanies, enrichCompany],
  triggers: [onDealCreated, onDealStageChanged],
});
```

**Step 2: Implement actions (createDeal, updateDealStage, searchCompanies, enrichCompany)**

Each action follows the Activepieces `createAction` API with proper input props and PostgreSQL queries.

**Step 3: Implement triggers (onDealCreated, onDealStageChanged)**

Use PostgreSQL `LISTEN/NOTIFY` or polling to detect new deals and stage changes.

**Step 4: Commit**

```bash
git add services/flows-pieces/
git commit -m "feat: build @alecia/piece-crm with 4 actions + 2 triggers"
```

---

#### Task 16.2: Build @alecia/piece-ai

**Files:**
- Create: `services/flows-pieces/pieces/alecia-ai/`

**Step 1: Scaffold and implement**

Actions: `generateDealSummary`, `scoreDealRisk`, `generateTeaser`, `suggestValuation`, `summarizeDocument`, `translateDocument`, `generateEmbedding`

Each action calls the Groq or OpenAI API with M&A-specific prompts from the existing `convex/actions/ai.ts`.

**Step 2: Commit**

```bash
git add services/flows-pieces/
git commit -m "feat: build @alecia/piece-ai with 7 AI actions"
```

---

### Sprint 17: Build piece-sign + piece-microsoft

#### Task 17.1: Build @alecia/piece-sign

Actions: `createSigningRequest`, `createFromTemplate`, `getSigningStatus`, `uploadToDataRoom`
Triggers: `onDocumentSigned`, `onDocumentViewed`, `onSigningExpired`

Connects to DocuSeal REST API at `https://sign.alecia.fr/api/v1/`.

#### Task 17.2: Build @alecia/piece-microsoft

Actions: `readExcelRange`, `writeExcelRange`, `listOneDriveFiles`, `createCalendarEvent`, `sendEmail`
Triggers: `onCalendarEvent`, `onFileModified`

Ported directly from `convex/actions/microsoft.ts` OAuth flow and Graph API calls.

---

### Sprint 18: Build Remaining Pieces + Workflow Templates

#### Task 18.1: Build @alecia/piece-research

Actions: `searchWeb` (SearXNG), `searchPappers`, `getLatestFeeds` (Miniflux), `enrichWithOpenData` (INSEE), `semanticSearch` (Haystack)

#### Task 18.2: Build @alecia/piece-colab

Actions: `createDocument`, `createBoardCard`, `updateCardStatus`, `notifyUser`

#### Task 18.3: Create Pre-Built M&A Workflow Templates

Create 5 workflow templates in Activepieces:

1. **Deal Onboarding** — New deal → DD checklist + data room + Slack notification + calendar events
2. **Due Diligence Automation** — DD stage → assign items + daily digest + red flag alerts
3. **Market Study Pipeline** — SearXNG research → Pappers enrichment → AI analysis → HTML report
4. **Signature Workflow** — Negotiation stage → generate NDA → send for signature → upload to data room
5. **Content Publication** — Strapi publish → Slack notification → cache invalidation

---

**Phase 5 Completion Checklist:**
- [ ] @alecia/piece-crm: 4 actions, 2 triggers
- [ ] @alecia/piece-ai: 7 AI actions
- [ ] @alecia/piece-sign: 4 actions, 3 triggers
- [ ] @alecia/piece-microsoft: 5 actions, 2 triggers
- [ ] @alecia/piece-research: 5 actions
- [ ] @alecia/piece-colab: 4 actions
- [ ] 5 pre-built M&A workflow templates

---

## Phase 6 — Colab Overhaul

> **Goal:** Deploy Hocuspocus for WebSocket-based Yjs sync, rewrite the Colab sync layer, migrate Colab data from Convex to PostgreSQL, and add Notion-like UX improvements.
> **Depends on:** Phase 3 complete (PostgreSQL schemas ready).

### Sprint 19: Deploy Hocuspocus

**Objective:** Deploy the Hocuspocus WebSocket server with PostgreSQL persistence.

#### Task 19.1: Create Hocuspocus Server

**Files:**
- Create: `services/hocuspocus/` — standalone Hocuspocus server
- Create: `services/hocuspocus/src/index.ts`
- Create: `services/hocuspocus/package.json`

**Step 1: Initialize Hocuspocus project**

```bash
mkdir -p services/hocuspocus/src
cd services/hocuspocus
pnpm init
pnpm add @hocuspocus/server @hocuspocus/extension-database @hocuspocus/extension-logger pg
pnpm add -D typescript @types/pg
```

**Step 2: Create server**

```typescript
// services/hocuspocus/src/index.ts
import { Hocuspocus } from "@hocuspocus/server";
import { Database } from "@hocuspocus/extension-database";
import { Logger } from "@hocuspocus/extension-logger";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const server = new Hocuspocus({
  port: parseInt(process.env.PORT || "1234"),
  extensions: [
    new Logger(),
    new Database({
      fetch: async ({ documentName }) => {
        const result = await pool.query(
          "SELECT state FROM alecia_colab.yjs_state WHERE document_name = $1",
          [documentName]
        );
        return result.rows[0]?.state || null;
      },
      store: async ({ documentName, state }) => {
        await pool.query(
          `INSERT INTO alecia_colab.yjs_state (document_name, state, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (document_name) DO UPDATE SET state = $2, updated_at = NOW()`,
          [documentName, state]
        );
      },
    }),
  ],
  async onAuthenticate({ token }) {
    // Verify Keycloak JWT token
    const response = await fetch(
      `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/userinfo`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) throw new Error("Unauthorized");
    return response.json();
  },
});

server.listen();
console.log(`Hocuspocus running on port ${server.address.port}`);
```

**Step 3: Create Dockerfile**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 1234
CMD ["node", "dist/index.js"]
```

**Step 4: Deploy via Coolify at `ws.alecia.fr`**

**Step 5: Commit**

```bash
git add services/hocuspocus/
git commit -m "feat: deploy Hocuspocus WebSocket server with PostgreSQL persistence"
```

---

### Sprint 20: Rewrite Colab Sync Layer

**Objective:** Remove all Convex Yjs polling code from Colab app and replace with Hocuspocus WebSocket provider.

#### Task 20.1: Remove Custom Yjs Polling

**Files to modify/delete in `apps/colab/`:**
- Delete: Custom `useYjsSync` hook (Convex-based polling)
- Delete: Custom `usePresence` hook (Convex awareness polling)
- Delete: `ConvexAwarenessProvider` class
- Delete: Convex `colab_yjs_*` mutations/queries

**Step 1: Identify all Yjs-related Convex code**

```bash
grep -r "colab_yjs\|useYjsSync\|ConvexAwareness\|yjs_updates\|yjs_awareness" apps/colab/src/
```

**Step 2: Remove identified files/functions**

---

#### Task 20.2: Install Hocuspocus Client Provider

**Files:**
- Modify: `apps/colab/package.json`
- Create: `apps/colab/src/lib/collaboration.ts`

**Step 1: Install Hocuspocus client**

```bash
cd apps/colab
pnpm add @hocuspocus/provider
```

**Step 2: Create collaboration provider**

```typescript
// apps/colab/src/lib/collaboration.ts
import { HocuspocusProvider } from "@hocuspocus/provider";

export function createCollaborationProvider(documentName: string, token: string) {
  return new HocuspocusProvider({
    url: process.env.NEXT_PUBLIC_HOCUSPOCUS_URL || "wss://ws.alecia.fr",
    name: documentName,
    token,
    onAuthenticated: () => console.log("Connected to Hocuspocus"),
    onDisconnect: () => console.log("Disconnected from Hocuspocus"),
  });
}
```

**Step 3: Update TipTap editor to use HocuspocusProvider**

```typescript
// Replace in editor component:
// BEFORE: custom Convex sync with 2s polling
// AFTER: WebSocket-based HocuspocusProvider

import { useEditor } from "@tiptap/react";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";

const provider = createCollaborationProvider(documentId, keycloakToken);

const editor = useEditor({
  extensions: [
    // ... other extensions
    Collaboration.configure({
      document: provider.document,
    }),
    CollaborationCursor.configure({
      provider,
      user: { name: currentUser.name, color: "#4370a7" },
    }),
  ],
});
```

**Step 4: Test real-time collaboration**

Open two browser tabs, edit the same document, verify:
- Sub-100ms sync (was 1-3 seconds with Convex polling)
- Live cursor positions
- No merge conflicts during fast typing

**Step 5: Commit**

```bash
git add apps/colab/
git commit -m "feat: replace Convex Yjs polling with Hocuspocus WebSocket provider"
```

---

### Sprint 21: Migrate Colab Data

**Objective:** Export all Colab tables from Convex and import into `alecia_colab` PostgreSQL schema.

#### Task 21.1: Migrate Colab Tables

Tables: `colab_documents`, `colab_document_versions`, `colab_boards`, `colab_lists`, `colab_cards`, `colab_labels`, `colab_checklists`, `colab_checklist_items`, `colab_presentations`, `colab_yjs_documents`

Process: Same export/import pattern as Sprint 10-12.

#### Task 21.2: Replace Convex Queries in Colab App

Same pattern as Sprint 13: replace `useQuery(api.colab_*)` with PostgreSQL/Drizzle calls via server actions.

---

### Sprint 22: Colab UX Improvements

**Objective:** Add Notion-like UX features to the Colab editor.

#### Task 22.1: Block-Based Editing Improvements

Enhance TipTap extensions:
- Improve slash command menu (more block types)
- Add inline database blocks (table with filtering/sorting)
- Add page nesting (document hierarchy with sidebar tree)
- Add cover images and icons for documents
- Add template gallery (meeting notes, deal memos, DD reports)

#### Task 22.2: Kanban Enhancements

- Card comments with @mentions
- File attachments via Minio
- Board templates (DD workflow, deal execution, post-merger)

**Reference Repos to Study:**
- **Plane** (Apache 2.0): Board views, timeline, sprint planning
- **AFFiNE** (MIT): Block editor, whiteboard, knowledge base
- **Planka** (AGPL-3.0): Clean Kanban UX

---

**Phase 6 Completion Checklist:**
- [ ] Hocuspocus deployed at ws.alecia.fr with PostgreSQL persistence
- [ ] Convex Yjs polling code removed from Colab
- [ ] HocuspocusProvider integrated with TipTap collaboration
- [ ] Real-time sync verified (sub-100ms)
- [ ] Colab data migrated from Convex to PostgreSQL
- [ ] Colab queries replaced with PostgreSQL/Drizzle
- [ ] UX improvements: slash commands, page hierarchy, templates
- [ ] Kanban enhancements: comments, attachments, board templates

---

## Phase 7 — AI Intelligence Layer

> **Goal:** Deploy Haystack for semantic document search across DD corpuses, integrate with pgvector embeddings, and connect to BI and Flows.
> **Depends on:** Phase 3 (PostgreSQL with pgvector ready).

### Sprint 23: Deploy Haystack

**Objective:** Deploy Haystack as a Docker container, configure pgvector integration, and create document indexing pipeline.

#### Task 23.1: Deploy Haystack Server

**Files:**
- Create: `infrastructure/haystack/docker-compose.yml`
- Create: `services/haystack/` — custom Haystack pipeline config

**Step 1: Create Docker Compose**

```yaml
# infrastructure/haystack/docker-compose.yml
services:
  haystack:
    image: deepset/haystack:latest
    container_name: alecia-haystack
    restart: unless-stopped
    environment:
      DOCUMENTSTORE_PARAMS_HOST: alecia-postgres
      DOCUMENTSTORE_PARAMS_PORT: 5432
      DOCUMENTSTORE_PARAMS_DB_NAME: alecia
      DOCUMENTSTORE_PARAMS_USER: alecia
      DOCUMENTSTORE_PARAMS_PASSWORD: ${POSTGRES_PASSWORD}
      DOCUMENTSTORE_PARAMS_SCHEMA: alecia_bi
    ports:
      - "8080:8000"
```

**Step 2: Create document indexing pipeline**

Configure Haystack to:
1. Accept PDF/Word/Excel uploads via REST API
2. Extract text (OCR via Stirling-PDF for scanned docs)
3. Split into chunks (500 tokens, 50 token overlap)
4. Generate embeddings (OpenAI text-embedding-3-small, 1536 dimensions)
5. Store in pgvector (`alecia_bi.embeddings` table)

**Step 3: Create semantic search pipeline**

Configure Haystack to:
1. Accept natural language queries
2. Generate query embedding
3. Search pgvector for similar documents
4. Return ranked results with snippets

**Step 4: Commit**

```bash
git add infrastructure/haystack/ services/haystack/
git commit -m "feat: deploy Haystack AI document intelligence with pgvector"
```

---

### Sprint 24: Integrate Haystack with BI + Flows

#### Task 24.1: Add Semantic Search to BI Admin

Add a search interface in the BI admin panel:
- Search bar with natural language input
- Results show relevant DD documents with highlighted snippets
- Click to open document in Colab or download from data room

#### Task 24.2: Connect Haystack to Activepieces

The `@alecia/piece-research` already includes `semanticSearch` action.
Configure Haystack API endpoint in the piece settings.

Create workflow: "When file uploaded to data room → OCR via Stirling-PDF → Index in Haystack"

---

**Phase 7 Completion Checklist:**
- [ ] Haystack deployed with pgvector document store
- [ ] Document indexing pipeline working (PDF → chunks → embeddings)
- [ ] Semantic search returning relevant DD documents
- [ ] BI admin search interface connected to Haystack
- [ ] Activepieces piece-research connected to Haystack API
- [ ] Auto-indexing workflow: data room upload → OCR → index

---

## Phase 8 — Polish & Harden

> **Goal:** Unify SSO across all subdomains, set up monitoring and alerting, automate backups, run security audit, optimize performance, and deploy the Colab app as a container.
> **Depends on:** Phases 4–7 all complete.

### Sprint 25: SSO Unification + Colab Containerization

**Objective:** All 8 suite products authenticate via Keycloak SSO. Colab app containerized and deployed at `colab.alecia.fr`.

#### Task 25.1: SSO Integration for All Services

Verify and finalize SSO for each service:

| Service | SSO Method | Status |
|---------|-----------|--------|
| alecia.fr (marketing) | NextAuth.js + Keycloak | Done in Sprint 15 |
| cms.alecia.fr (Strapi) | Strapi Keycloak plugin | Configure now |
| app.alecia.fr (BI/Numbers) | NextAuth.js + Keycloak | Done in Sprint 15 |
| flows.alecia.fr (Activepieces) | Keycloak OIDC config | Configure now |
| sign.alecia.fr (DocuSeal) | OmniAuth Keycloak gem | Configure now |
| colab.alecia.fr | NextAuth.js + Keycloak | Configure now |
| analytics.alecia.fr (Plausible) | Reverse proxy auth header | Configure now |
| vault.alecia.fr (Vaultwarden) | OIDC client | Configure now |

**Step 1: Configure SSO for Strapi**

Install `strapi-plugin-sso` or configure Keycloak as an admin login provider.

**Step 2: Configure SSO for Activepieces**

Set environment variables:
```env
AP_SSO_ENABLED=true
AP_SSO_PROVIDER=keycloak
AP_SSO_ISSUER=https://auth.alecia.fr/realms/alecia
AP_SSO_CLIENT_ID=alecia-flows
AP_SSO_CLIENT_SECRET=${FLOWS_CLIENT_SECRET}
```

**Step 3: Configure SSO for DocuSeal**

Add OmniAuth Keycloak gem to Gemfile and configure OIDC settings.

**Step 4: Configure SSO for Colab**

Same NextAuth.js + Keycloak pattern as marketing site.

**Step 5: Test SSO flow**

1. Login at `https://auth.alecia.fr`
2. Navigate to each subdomain — should be auto-logged-in
3. Logout — should be logged out from all subdomains

**Step 6: Commit**

```bash
git commit -m "auth: unify SSO across all 8 Alecia Suite services via Keycloak"
```

---

#### Task 25.2: Containerize and Deploy Colab App

**Files:**
- Create: `apps/colab/Dockerfile`
- Create: `infrastructure/colab/docker-compose.yml`

**Step 1: Create multi-stage Dockerfile (same pattern as marketing site)**

**Step 2: Deploy via Coolify at `colab.alecia.fr`**

**Step 3: Verify collaboration features work end-to-end**

---

### Sprint 26: Monitoring & Logging

**Objective:** Set up monitoring for all services, centralized logging, and alerting.

#### Task 26.1: Set Up Uptime Monitoring

**Files:**
- Create: `infrastructure/monitoring/docker-compose.yml`

**Option A: Use Uptime Kuma (MIT, self-hosted)**

```yaml
services:
  uptime-kuma:
    image: louislam/uptime-kuma:latest
    container_name: alecia-uptime
    restart: unless-stopped
    volumes:
      - uptime_data:/app/data
    ports:
      - "3001:3001"
```

Configure monitors for all 17 subdomains with:
- HTTP(S) checks every 60 seconds
- Certificate expiry alerts (14 days before)
- Response time tracking
- Slack/Email notifications on downtime

#### Task 26.2: PostgreSQL Monitoring

Set up pg_stat_statements and basic monitoring:
```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

Monitor:
- Connection count vs max_connections
- Cache hit ratio (should be > 99%)
- Slow queries (> 500ms)
- Table bloat
- Replication lag (if applicable)

#### Task 26.3: Docker Container Monitoring

Use Coolify's built-in monitoring or add:
- Container health status
- CPU/memory usage per container
- Disk space alerts (< 20% remaining)
- Auto-restart policies (already configured in compose files)

---

### Sprint 27: Backup Automation

**Objective:** Automated daily backups for PostgreSQL, Minio, and critical services.

#### Task 27.1: PostgreSQL Automated Backups

**Files:**
- Create: `infrastructure/scripts/backup-postgres.sh`

**Step 1: Create backup script**

```bash
#!/bin/bash
# infrastructure/scripts/backup-postgres.sh
# Runs daily via cron, stores encrypted backup in Minio

set -e
DATE=$(date +%Y-%m-%d_%H%M)
BACKUP_FILE="/tmp/alecia-pg-backup-${DATE}.sql.gz"

# Dump all schemas
docker exec alecia-postgres pg_dumpall -U alecia | gzip > "${BACKUP_FILE}"

# Upload to Minio (encrypted bucket)
mc cp "${BACKUP_FILE}" alecia/alecia-backups/postgres/

# Remove local temp file
rm "${BACKUP_FILE}"

# Retention: keep last 30 days
mc rm --older-than 30d alecia/alecia-backups/postgres/

echo "Backup complete: ${BACKUP_FILE}"
```

**Step 2: Schedule via cron**

```bash
# Run daily at 2:00 AM
0 2 * * * /opt/alecia/scripts/backup-postgres.sh >> /var/log/alecia-backup.log 2>&1
```

#### Task 27.2: Minio Backup

Configure Minio bucket replication or rsync to OVH secondary storage.

#### Task 27.3: Document Recovery Procedure

Create runbook:
```
infrastructure/docs/disaster-recovery.md
- How to restore PostgreSQL from Minio backup
- How to restore Minio data
- Service restart order
- DNS failover procedure
```

---

### Sprint 28: Security Audit + Performance

**Objective:** OWASP security audit, TLS configuration hardening, and performance optimization.

#### Task 28.1: TLS Hardening

Verify SSL Labs A+ rating:
```bash
# Test with ssllabs-scan or manual check
curl https://www.ssllabs.com/ssltest/analyze.html?d=alecia.fr
```

Update Caddyfile if needed:
```caddyfile
{
    # Force TLS 1.2+ only
    servers {
        protocol {
            strict_sni_host on
        }
    }
}
```

#### Task 28.2: OWASP Security Checklist

| Check | Tool | Expected |
|-------|------|----------|
| SQL Injection | Manual + automated | No vulnerabilities (Drizzle ORM parameterized) |
| XSS | Content Security Policy headers | Strict CSP on all responses |
| CSRF | Next.js built-in CSRF protection | Enabled |
| Authentication | Keycloak session management | JWT expiry, refresh rotation |
| Authorization | RBAC checks on every endpoint | sudo/partner/advisor/user |
| File Upload | Minio server-side encryption | All buckets SSE-S3 |
| Rate Limiting | Caddy rate limiting + Redis | API endpoints protected |
| Secrets | Vaultwarden | No secrets in code/env files |
| Dependencies | `npm audit` / `pnpm audit` | 0 critical vulnerabilities |
| CORS | Strict per-subdomain origins | Configured in Caddy |

#### Task 28.3: Performance Optimization

| Optimization | Action |
|-------------|--------|
| CDN | Configure Cloudflare or OVH CDN for static assets |
| Connection pooling | Add PgBouncer between apps and PostgreSQL |
| Image optimization | Next.js Image component with Minio URLs |
| Code splitting | Verify Next.js automatic code splitting |
| Redis caching | Cache frequent PostgreSQL queries in Redis |
| Gzip/Brotli | Caddy automatic compression |
| Database indexes | EXPLAIN ANALYZE on slow queries, add missing indexes |

---

**Phase 8 Completion Checklist:**
- [ ] SSO unified across all 8 services
- [ ] Colab containerized and deployed at colab.alecia.fr
- [ ] Uptime monitoring for all 17 subdomains
- [ ] PostgreSQL monitoring (slow queries, connections, cache hit)
- [ ] Docker container monitoring
- [ ] Automated daily PostgreSQL backups to Minio
- [ ] Disaster recovery runbook documented
- [ ] SSL Labs A+ rating
- [ ] OWASP security audit passed
- [ ] Performance optimized (CDN, PgBouncer, caching)

---

## Phase 9 — DNS Cutover & Launch

> **Goal:** Run parallel infrastructure for validation, execute the DNS migration from alecia.markets to alecia.fr, decommission Vercel + Convex, and declare the Alecia Suite live.
> **Depends on:** Phase 8 complete — all services running and hardened.

### Sprint 29: Parallel Testing

**Objective:** Run both old (Vercel + Convex) and new (OVH VPS) infrastructure simultaneously, validate data parity, and test all user flows.

#### Task 29.1: Data Parity Verification

**Step 1: Compare record counts**

```bash
# Convex side
# Use Convex dashboard or API to count records per table

# PostgreSQL side
docker exec alecia-postgres psql -U alecia -d alecia -c "
  SELECT 'companies' as entity, count(*) FROM shared.companies
  UNION ALL SELECT 'contacts', count(*) FROM shared.contacts
  UNION ALL SELECT 'deals', count(*) FROM shared.deals
  UNION ALL SELECT 'valuations', count(*) FROM alecia_numbers.valuations
  -- ... all tables
  ORDER BY entity;"
```

**Step 2: Spot-check specific records**

Select 10 random deals and verify:
- All fields match (title, stage, amount, company, owner)
- Related records exist (contacts, valuations, DD checklists)
- Files accessible in Minio (logos, documents)

#### Task 29.2: End-to-End User Flow Testing

Test each critical M&A workflow:

| Flow | Steps | Expected |
|------|-------|----------|
| Deal creation | Create deal in BI → verify in pipeline → check Numbers link | Deal appears across all views |
| Company enrichment | Search company → Pappers API → verify data | Financials, SIREN, executives populated |
| Document signing | Create NDA in Sign → send for signature → sign → verify in data room | Signed PDF in Minio, audit trail complete |
| Collaboration | Open document in Colab → edit simultaneously → verify sync | Sub-100ms sync, no conflicts |
| Automation | Trigger deal onboarding workflow in Flows → verify all actions executed | DD checklist + data room + Slack notification created |
| Analytics | Visit marketing site → check Plausible → verify event tracked | Pageview recorded in real-time |
| Search | Upload DD document → wait for indexing → semantic search | Relevant document returned |
| CMS | Create blog post in Strapi → publish → verify on marketing site | ISR revalidation shows new post |

---

### Sprint 30: DNS Cutover & Launch

**Objective:** Migrate DNS from alecia.markets to alecia.fr, redirect old domain, decommission Vercel and Convex.

#### Task 30.1: Pre-Launch Checklist

- [ ] All Phase 0-8 completion checklists passed
- [ ] Data parity verified (Sprint 29)
- [ ] End-to-end flows tested (Sprint 29)
- [ ] Backup tested (restore from backup successfully)
- [ ] Team trained on new tools (Keycloak, Strapi, Activepieces, DocuSeal)
- [ ] Client communication prepared (email about new URLs)
- [ ] SSL certificates valid (> 30 days remaining)
- [ ] Monitoring alerts configured and tested
- [ ] Rollback plan documented

#### Task 30.2: Execute DNS Cutover

**Step 1: Configure alecia.fr as primary domain**

Already done in Phase 0 (DNS pointing to VPS).

**Step 2: Set up redirects from alecia.markets**

In Vercel (keep active for 6 months for redirect):
```json
{
  "redirects": [
    {
      "source": "/:path*",
      "destination": "https://alecia.fr/:path*",
      "permanent": true
    }
  ]
}
```

Or in Caddy (if Vercel is decommissioned):
```caddyfile
alecia.markets {
    redir https://alecia.fr{uri} permanent
}
```

**Step 3: Update all external references**

- Google Search Console: Add alecia.fr, request indexing
- Google Analytics: Update tracking (now Plausible)
- Social media profiles: Update links
- Email signatures: Update domain
- Business cards / printed materials: Update
- Pipedrive: Update webhook URLs
- Microsoft Graph: Update redirect URIs
- Google OAuth: Update redirect URIs

**Step 4: Decommission Vercel**

```bash
# After 30 days of successful operation on OVH
vercel rm alecia.markets --yes
vercel rm colab.alecia.markets --yes
```

**Step 5: Decommission Convex**

```bash
# After 60 days (keep as read-only backup for 2 months)
npx convex deploy --cmd 'npx convex export'  # Final export
# Then delete project in Convex dashboard
```

**Step 6: Decommission Clerk**

Remove Clerk project after 60 days (all auth moved to Keycloak).

**Step 7: Celebrate**

The Alecia Suite is live. All 8 products running on 100% FOSS infrastructure, self-hosted in France.

---

**Phase 9 Completion Checklist:**
- [ ] Data parity verified between Convex and PostgreSQL
- [ ] All end-to-end user flows tested successfully
- [ ] DNS alecia.fr pointing to VPS and serving all subdomains
- [ ] Redirects from alecia.markets to alecia.fr configured
- [ ] External references updated (Google, OAuth, social media)
- [ ] Vercel decommissioned (after 30-day monitoring period)
- [ ] Convex decommissioned (after 60-day backup period)
- [ ] Clerk decommissioned (after 60-day backup period)
- [ ] Team fully transitioned to new tools

---

## Appendix A: Full Subdomain Map

| # | Subdomain | Service | Tech | Strategy | Phase |
|---|-----------|---------|------|----------|-------|
| 1 | `alecia.fr` | Marketing site | Next.js 15 | Keep custom | Phase 2 |
| 2 | `cms.alecia.fr` | CMS backend | Strapi CE | Slim fork | Phase 2 |
| 3 | `app.alecia.fr` | BI + Numbers | Next.js 15 | Enhance custom | Phase 4 |
| 4 | `flows.alecia.fr` | Automation | Activepieces | Slim fork | Phase 1 |
| 5 | `sign.alecia.fr` | E-Signature + VDR | DocuSeal | Slim fork | Phase 1 |
| 6 | `colab.alecia.fr` | Collaboration | Next.js + TipTap | Enhance custom | Phase 6 |
| 7 | `analytics.alecia.fr` | Web analytics | Plausible CE | Deploy as-is | Phase 1 |
| 8 | `auth.alecia.fr` | SSO | Keycloak | Deploy + config | Phase 0 |
| 9 | `storage.alecia.fr` | Blob storage console | Minio | Deploy | Phase 0 |
| 10 | `s3.alecia.fr` | S3 API | Minio | Deploy | Phase 0 |
| 11 | `feeds.alecia.fr` | RSS aggregator | Miniflux | Deploy as-is | Phase 1 |
| 12 | `search.alecia.fr` | Meta search | SearXNG | Deploy as-is | Phase 1 |
| 13 | `docs.alecia.fr` | PDF toolkit | Stirling-PDF | Deploy as-is | Phase 1 |
| 14 | `pdf.alecia.fr` | PDF generation | Gotenberg | Deploy as-is | Phase 1 |
| 15 | `diagrams.alecia.fr` | Flowcharts | Flowchart.fun | Deploy as-is | Phase 1 |
| 16 | `vault.alecia.fr` | Credentials | Vaultwarden | Deploy | Phase 0 |
| 17 | `ws.alecia.fr` | WebSocket sync | Hocuspocus | Deploy custom | Phase 6 |

## Appendix B: Environment Variables Master List

| Variable | Service(s) | Description |
|----------|-----------|-------------|
| `POSTGRES_PASSWORD` | All | PostgreSQL root password |
| `DATABASE_URL` | All | `postgres://alecia:<pw>@alecia-postgres:5432/alecia` |
| `MINIO_ROOT_USER` | Minio, apps | Minio admin username |
| `MINIO_ROOT_PASSWORD` | Minio, apps | Minio admin password |
| `REDIS_PASSWORD` | Redis, Activepieces | Redis auth password |
| `KEYCLOAK_ADMIN_PASSWORD` | Keycloak | Admin console password |
| `KEYCLOAK_CLIENT_ID` | Each app | Per-app OIDC client ID |
| `KEYCLOAK_CLIENT_SECRET` | Each app | Per-app OIDC client secret |
| `KEYCLOAK_ISSUER` | Each app | `https://auth.alecia.fr/realms/alecia` |
| `STRAPI_API_TOKEN` | Marketing, Flows | Strapi API access token |
| `STRAPI_APP_KEYS` | Strapi | Application keys |
| `STRAPI_JWT_SECRET` | Strapi | JWT signing secret |
| `DOCUSEAL_SECRET_KEY` | DocuSeal | Rails secret key base |
| `AP_ENCRYPTION_KEY` | Activepieces | Piece secrets encryption |
| `AP_JWT_SECRET` | Activepieces | Auth JWT signing |
| `VAULTWARDEN_ADMIN_TOKEN` | Vaultwarden | Admin panel access |
| `REVALIDATION_SECRET` | Marketing | ISR webhook secret |
| `OPENAI_API_KEY` | AI, Haystack | OpenAI embeddings |
| `GROQ_API_KEY` | AI | Groq LLaMA inference |
| `PAPPERS_API_KEY` | BI, Flows | French company data |
| `MICROSOFT_CLIENT_ID` | BI, Flows | MS Graph OAuth |
| `MICROSOFT_CLIENT_SECRET` | BI, Flows | MS Graph OAuth |
| `MICROSOFT_TENANT_ID` | BI, Flows | Azure AD tenant |
| `GOOGLE_CLIENT_ID` | BI | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | BI | Google OAuth |
| `PIPEDRIVE_CLIENT_ID` | BI | Pipedrive sync |
| `PIPEDRIVE_CLIENT_SECRET` | BI | Pipedrive sync |
| `TOKEN_ENCRYPTION_KEY` | BI | AES-256 for OAuth tokens |
| `OVH_APPLICATION_KEY` | Caddy | DNS-01 TLS challenge |
| `OVH_APPLICATION_SECRET` | Caddy | DNS-01 TLS challenge |
| `OVH_CONSUMER_KEY` | Caddy | DNS-01 TLS challenge |

## Appendix C: Git Repository Structure (Post-Migration)

```
alepanel/
├── apps/
│   ├── website/            Next.js 15 marketing + BI admin (alecia.fr + app.alecia.fr)
│   ├── colab/              Next.js collaboration workspace (colab.alecia.fr)
│   └── suite-showcase/     Static showcase page
├── packages/
│   ├── ui/                 @alepanel/ui — shared shadcn/ui components
│   ├── headless/           Novel — TipTap editor package
│   ├── db/                 @alepanel/db — Drizzle ORM schemas + PostgreSQL client
│   ├── ai/                 @alepanel/ai — AI services (Groq, OpenAI)
│   └── integrations/       @alepanel/integrations — MS Graph, Pappers, Pipedrive
├── services/
│   ├── cms/                Strapi CE fork (cms.alecia.fr)
│   ├── hocuspocus/         Hocuspocus WebSocket server (ws.alecia.fr)
│   ├── haystack/           Haystack AI doc intelligence config
│   └── flows-pieces/       Custom Activepieces pieces (7 pieces)
├── infrastructure/
│   ├── caddy/              Caddyfile (reverse proxy)
│   ├── postgres/           Docker compose + migrations + init scripts
│   ├── minio/              Docker compose
│   ├── redis/              Docker compose
│   ├── keycloak/           Docker compose + theme + realm export
│   ├── vaultwarden/        Docker compose
│   ├── plausible/          Docker compose + CSS rebrand
│   ├── miniflux/           Docker compose
│   ├── searxng/            Docker compose + settings
│   ├── stirling-pdf/       Docker compose
│   ├── gotenberg/          Docker compose
│   ├── flowchart/          Docker compose
│   ├── activepieces/       Docker compose (for forked repo)
│   ├── docuseal/           Docker compose (for forked repo)
│   ├── haystack/           Docker compose
│   ├── marketing/          Docker compose (Next.js marketing)
│   ├── colab/              Docker compose (Next.js colab)
│   ├── monitoring/         Uptime Kuma docker compose
│   ├── scripts/            Health check, backup, deployment scripts
│   └── docs/               Disaster recovery, runbooks
├── scripts/
│   └── migration/          Convex → PostgreSQL export/import scripts
├── docs/
│   └── plans/              Architecture blueprints, organigrams, this plan
├── convex/                 (DEPRECATED after migration — keep for reference)
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

*Plan generated February 8, 2026 — Alecia Suite Migration Plan v1.0*
*10 phases, 30 sprints, ~30 weeks estimated duration*
*Authored with the writing-plans skill by Claude Code*
