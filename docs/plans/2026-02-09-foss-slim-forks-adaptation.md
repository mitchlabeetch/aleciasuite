# FOSS Slim Forks Adaptation Plan
**Date**: 2026-02-09
**Status**: Planning → Implementation
**Strategy**: Extend + Caddy Auth + Full Rebrand

## Executive Summary

Transform 3 FOSS tools into Alecia-branded suite components:
- **cms.alecia.fr** (Strapi CE) → Alecia CMS
- **flows.alecia.fr** (Activepieces CE) → Alecia Flows
- **sign.alecia.fr** (DocuSeal) → Alecia Sign

**Approach**: Extension-based (not true forks) with Caddy forward_auth SSO and comprehensive branding.

## Architecture Decisions

### ✅ SSO Strategy: Caddy Forward Auth
**Why**: Simplest, most maintainable approach that works across all 3 tools regardless of their native SSO capabilities.

**How it works**:
1. User accesses `cms.alecia.fr`
2. Caddy checks for `.alecia.fr` session cookie via auth_request to BetterAuth endpoint
3. If valid session → allow request, inject user headers
4. If no session → redirect to `app.alecia.fr/login?redirect=cms.alecia.fr`
5. After login → BetterAuth sets `.alecia.fr` cookie → redirect back

**Benefits**:
- ✅ Works for all 3 tools (Strapi CE has no SSO)
- ✅ Single source of truth (BetterAuth)
- ✅ No custom OIDC development needed
- ✅ User provisioning can be automated via headers
- ✅ Session management centralized

**Tradeoffs**:
- ⚠️ Tools don't "know" about BetterAuth users (just see injected headers)
- ⚠️ Need user auto-provisioning on first access per tool

### ✅ Branding Strategy: Full Rebrand
**Goal**: Tools should look like native Alecia products, not white-labeled FOSS.

**Scope**:
- Custom logos, color schemes, typography
- Favicon, login screens, dashboards
- Application naming ("Alecia CMS" not "Strapi")
- French localization where applicable
- Remove vendor attribution (where license permits)

## Implementation Phases

### Phase 1: BetterAuth SSO Integration (Priority: HIGH)

#### 1.1 Create BetterAuth Auth Endpoint for Caddy
**File**: `packages/auth/src/routes/caddy-auth.ts`

```typescript
// GET /api/auth/verify-session
// Returns 200 + user headers if valid, 401 if not
// Caddy consumes this for forward_auth
```

**Headers to inject**:
- `X-Alecia-User-Id`: BetterAuth user.id
- `X-Alecia-User-Email`: user.email
- `X-Alecia-User-Name`: user.name
- `X-Alecia-User-Role`: user.role (admin/user)

#### 1.2 Update Caddy Configuration
**File**: `infrastructure/caddy/Caddyfile`

Add forward_auth blocks for cms, flows, sign subdomains:

```caddyfile
cms.alecia.fr {
  forward_auth app.alecia.fr:3000 {
    uri /api/auth/verify-session
    header_up X-Forwarded-Method {method}
    header_up X-Forwarded-Uri {uri}
    copy_headers X-Alecia-User-*
  }

  @unauthorized status 401
  handle @unauthorized {
    redir https://app.alecia.fr/login?redirect=cms.alecia.fr{uri} 302
  }

  reverse_proxy strapi:1337
}

flows.alecia.fr {
  # Same pattern for Activepieces
}

sign.alecia.fr {
  # Same pattern for DocuSeal
}
```

#### 1.3 User Auto-Provisioning Middleware (Per Tool)

Each tool needs a middleware/plugin to:
1. Receive X-Alecia-User-* headers from Caddy
2. Check if local user exists with that email
3. If not → create local user account (auto-provision)
4. Set tool's session for that user

**Strapi**: Custom middleware plugin
**Activepieces**: Custom piece for user sync
**DocuSeal**: Rails initializer + before_action

---

### Phase 2: Branding Implementation (Priority: HIGH)

#### 2.1 Brand Asset Preparation
**Location**: `infrastructure/branding/`

Create:
- `logo.svg` → Alecia logo (full)
- `logo-icon.svg` → Icon only (for favicons)
- `colors.json` → Brand color palette
- `typography.json` → Font specifications

**Colors** (to be confirmed):
```json
{
  "primary": "#...",
  "secondary": "#...",
  "accent": "#...",
  "neutral": ["#...", "#...", "#..."],
  "semantic": {
    "success": "#...",
    "warning": "#...",
    "error": "#..."
  }
}
```

#### 2.2 Strapi CMS Branding
**Files**:
- `services/cms/config/admin.ts` → Update logo, favicon, auth screen
- `services/cms/src/admin/app.tsx` → Custom theme config
- `services/cms/public/` → Replace assets

**Changes**:
- Logo in admin panel header
- Custom login screen with Alecia branding
- Favicon
- Application name: "Alecia CMS"
- Custom theme colors

#### 2.3 Activepieces Branding
**Approach**: Custom Docker build with asset replacement

**Files**:
- `services/flows/Dockerfile` → Multi-stage build
- `services/flows/branding/` → Custom assets
- Build script replaces logo SVGs, CSS vars

**Changes**:
- Logo in header/sidebar
- Custom color scheme via CSS variables
- Application name: "Alecia Flows"
- Favicon
- Remove "Powered by Activepieces" footer

#### 2.4 DocuSeal Branding
**Approach**: Environment variables + asset mounting

**Files**:
- `services/sign/.env` → BRAND_NAME, BRAND_LOGO_URL, etc.
- `services/sign/public/` → Custom assets mounted as volume

**Changes**:
- Logo in header
- Application name: "Alecia Sign"
- Favicon
- Email templates with Alecia branding

---

### Phase 3: Docker Images & Build Pipeline (Priority: MEDIUM)

#### 3.1 Strapi Custom Image
**File**: `services/cms/Dockerfile`

```dockerfile
FROM node:20-alpine AS base
# Install Strapi + dependencies
# Copy config, content-types, plugins
# Build admin panel with custom theme
# Expose 1337
```

**Build**:
```bash
docker build -t alepanel/alecia-cms:latest services/cms/
```

#### 3.2 Activepieces Custom Image
**File**: `services/flows/Dockerfile`

```dockerfile
FROM activepieces/activepieces:latest AS base
# Copy custom pieces
# Replace branding assets
# Configure environment
```

**Build**:
```bash
docker build -t alepanel/alecia-flows:latest services/flows/
```

#### 3.3 DocuSeal (Use Official + Config)
**Strategy**: Official image + env vars + volume mounts

No custom build needed, just docker-compose config.

#### 3.4 Build Pipeline Script
**File**: `scripts/build-services.sh`

```bash
#!/bin/bash
set -e

echo "Building Alecia Suite service images..."

# CMS
docker build -t alepanel/alecia-cms:latest services/cms/
docker tag alepanel/alecia-cms:latest alepanel/alecia-cms:$(git rev-parse --short HEAD)

# Flows
docker build -t alepanel/alecia-flows:latest services/flows/
docker tag alepanel/alecia-flows:latest alepanel/alecia-flows:$(git rev-parse --short HEAD)

echo "✓ All service images built"
```

#### 3.5 Update docker-compose.production.yml
**File**: `infrastructure/docker-compose.production.yml`

Update image references:
```yaml
services:
  strapi:
    image: alepanel/alecia-cms:latest
    # ...

  activepieces:
    image: alepanel/alecia-flows:latest
    # ...

  docuseal:
    image: docuseal/docuseal:latest  # Official
    volumes:
      - ./branding/sign:/public
    # ...
```

---

### Phase 4: M&A Workflow Templates (Priority: LOW)

#### 4.1 Activepieces Custom Pieces Expansion

**Current**: 6 pieces (45 files)
**Target**: 15 pieces covering M&A workflows

**New pieces to create**:
1. **Pappers Integration** → Company research
2. **Deal Pipeline Sync** → Sync deals to/from PostgreSQL
3. **Document Generation** → M&A templates (LOI, NDA, etc.)
4. **Email Campaigns** → Buyer/seller outreach
5. **Data Room Trigger** → Create VDR on deal stage change
6. **Signature Request** → Trigger DocuSeal flows
7. **Calendar Booking** → Schedule meetings with Microsoft Calendar
8. **CRM Sync** → Bidirectional sync with Pipedrive
9. **Financial Model Export** → Export valuations to Excel

#### 4.2 Workflow Templates

**Location**: `services/flows/templates/`

Pre-built flows:
- `new-deal-intake.json` → Capture deal → Create in DB → Assign team → Notify
- `due-diligence-checklist.json` → Trigger DD tasks → Create data room → Send requests
- `buyer-outreach.json` → Select targets → Generate emails → Track opens/clicks
- `loi-signature.json` → Generate LOI → Send via DocuSeal → Track completion
- `deal-close.json` → Final docs → Archive → Post-deal integration tasks

---

### Phase 5: Testing & Validation (Priority: HIGH)

#### 5.1 SSO Flow Testing
- [ ] Login on app.alecia.fr → Access cms.alecia.fr (no re-auth)
- [ ] Logout from app → All 3 tools deny access
- [ ] Invalid session → Redirect to login
- [ ] User headers correctly injected
- [ ] Auto-provisioning creates accounts on first access

#### 5.2 Branding Validation
- [ ] All logos replaced
- [ ] Color schemes applied
- [ ] Favicons updated
- [ ] Application names correct
- [ ] No vendor attribution visible (where removed)

#### 5.3 Docker Image Validation
- [ ] Images build without errors
- [ ] Images start correctly
- [ ] Sizes reasonable (<500MB per image)
- [ ] Multi-arch support (amd64 + arm64)

#### 5.4 Workflow Testing
- [ ] Custom pieces execute correctly
- [ ] Templates import successfully
- [ ] End-to-end M&A workflows functional

---

## File Manifest

**New files to create**:
```
packages/auth/src/routes/caddy-auth.ts
infrastructure/caddy/Caddyfile (update)
infrastructure/branding/
  ├── logo.svg
  ├── logo-icon.svg
  ├── colors.json
  └── typography.json
services/cms/
  ├── src/plugins/better-auth-sync/
  ├── config/admin.ts (update)
  └── src/admin/app.tsx (update)
services/flows/
  ├── Dockerfile (update)
  ├── branding/
  └── templates/
services/sign/
  ├── .env (update)
  └── public/ (mount point)
scripts/build-services.sh
```

**Modified files**:
```
infrastructure/docker-compose.production.yml
services/cms/Dockerfile
services/flows/Dockerfile
infrastructure/caddy/Caddyfile
```

---

## Dependencies & Prerequisites

**Required**:
- ✅ Docker Desktop installed
- ✅ PostgreSQL running (for Strapi DB)
- ✅ Redis running (for session storage)
- ✅ Minio running (for file storage)
- ✅ BetterAuth configured in @alepanel/auth
- ⏳ Brand assets (logo, colors) → **Need to create or source**

**Optional**:
- GitHub Container Registry for image hosting
- OVH Cloud credentials for VPS deployment

---

## Success Criteria

### MVP (Minimum Viable Product)
- ✅ SSO works via Caddy forward_auth across all 3 tools
- ✅ Logos replaced, basic color scheme applied
- ✅ Docker images build and run locally
- ✅ Users can access all 3 tools with single BetterAuth login

### Full Implementation
- ✅ Complete branding (logos, colors, typography, favicons)
- ✅ All 3 tools auto-provision users on first access
- ✅ 15+ custom Activepieces pieces for M&A
- ✅ 5+ pre-built workflow templates
- ✅ Images published to container registry
- ✅ Production deployment on OVH VPS via Coolify

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Caddy auth breaks tool functionality | HIGH | Test thoroughly, implement fallback to tool-native auth |
| Brand assets not ready | MEDIUM | Use placeholder assets, iterate later |
| Auto-provisioning creates duplicate users | MEDIUM | Use email as unique key, handle conflicts gracefully |
| Docker images too large | LOW | Multi-stage builds, alpine base images |
| FOSS license violations from removing attribution | HIGH | Check each tool's license, only rebrand where permitted |

---

## Timeline Estimate

**Phase 1 (SSO)**: 2-3 days
**Phase 2 (Branding)**: 3-4 days
**Phase 3 (Docker)**: 1-2 days
**Phase 4 (Workflows)**: 3-5 days
**Phase 5 (Testing)**: 2 days

**Total**: ~12-16 days (with 1 developer, learning mode)

---

## Next Steps

1. **Create brand assets** (logo, colors) or confirm existing ones
2. **Implement BetterAuth Caddy auth endpoint** (Phase 1.1)
3. **Update Caddyfile** with forward_auth blocks (Phase 1.2)
4. **Build Strapi auto-provisioning plugin** (Phase 1.3)
5. **Test SSO flow** end-to-end (Phase 5.1)

---

## Questions for User

Before proceeding, please confirm:

1. **Brand assets**: Do Alecia brand guidelines exist? Where can I find logo files and color specs?
2. **Scope**: Should we implement all 5 phases or prioritize MVP (Phases 1-3)?
3. **Timeline**: Are you comfortable with ~2 weeks for full implementation?
4. **Testing**: Local testing only or do you want staging environment on VPS?

---

*This plan follows the "Extend, Don't Fork" philosophy to minimize maintenance burden while delivering a cohesive, branded suite experience.*
