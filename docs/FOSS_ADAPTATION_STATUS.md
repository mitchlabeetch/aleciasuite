# FOSS Slim Forks — Implementation Status & Next Steps

**Date**: 2026-02-09
**Status**: Phase 1-3 Complete (Tasks 1-13) ✅
**Remaining**: Phase 4-5 (Tasks 14-19) ⏳

---

## ✅ Completed Tasks (1-13)

### Phase 1: SSO Integration
- [x] **Task #1**: BetterAuth Caddy auth endpoint (`/api/auth/verify-session`)
- [x] **Task #2**: Caddy forward_auth configuration for cms, flows, sign
- [x] **Task #3**: Strapi auto-provisioning middleware
- [x] **Task #4**: Activepieces SSO setup scripts
- [x] **Task #5**: DocuSeal Rails initializer for BetterAuth SSO

### Phase 2: Branding
- [x] **Task #6**: Placeholder brand assets (logos, colors, typography)
- [x] **Task #7**: Strapi CMS branding (admin config, theme)
- [x] **Task #8**: Activepieces branding assets prepared
- [x] **Task #9**: DocuSeal branding via env vars

### Phase 3: Docker & Build
- [x] **Task #10**: Strapi custom Dockerfile
- [x] **Task #11**: Activepieces custom Dockerfile
- [x] **Task #12**: Automated build script (`scripts/build-services.sh`)
- [x] **Task #13**: Production docker-compose.yml updated

---

## ⏳ Remaining Tasks (14-19)

### Phase 4: M&A Workflows (Estimated: 3-5 days)

#### Task #14: Create 9 additional M&A workflow pieces

**Current Status**: 6 pieces exist (45 files)
**Target**: 15 pieces total

**New Pieces to Implement**:

1. **Pappers Integration** (`alecia-pappers`)
   - Location: `services/flows-pieces/pieces/alecia-pappers/`
   - Actions:
     - `search-company`: Search French companies by name/SIREN
     - `get-company-details`: Fetch full company profile
     - `get-company-financials`: Retrieve financial statements
   - Triggers:
     - None (API-based only)
   - API: https://www.pappers.fr/api/documentation

2. **Deal Pipeline Sync** (`alecia-pipeline`)
   - Location: `services/flows-pieces/pieces/alecia-pipeline/`
   - Actions:
     - `create-deal`: Create deal in PostgreSQL (shared.deals table)
     - `update-deal-stage`: Move deal through pipeline stages
     - `assign-deal`: Assign team members to deal
     - `sync-to-pipedrive`: Bidirectional sync with Pipedrive
   - Triggers:
     - `on-deal-created`: Webhook trigger
     - `on-stage-changed`: Webhook trigger

3. **Document Generation** (`alecia-docgen`)
   - Location: `services/flows-pieces/pieces/alecia-docgen/`
   - Actions:
     - `generate-loi`: Create Letter of Intent from template
     - `generate-nda`: Create NDA from template
     - `generate-teaser`: Generate investment teaser
     - `generate-im`: Create Information Memorandum
   - Templates: Markdown → PDF via Gotenberg
   - Storage: Minio S3

4. **Email Campaigns** (`alecia-campaigns`)
   - Location: `services/flows-pieces/pieces/alecia-campaigns/`
   - Actions:
     - `send-buyer-outreach`: Send template emails to buyers
     - `send-seller-outreach`: Send template emails to sellers
     - `track-email-opens`: Monitor engagement
     - `schedule-followup`: Schedule automated followups
   - Integration: Microsoft Graph API

5. **Data Room Trigger** (`alecia-vdr`)
   - Location: `services/flows-pieces/pieces/alecia-vdr/`
   - Actions:
     - `create-data-room`: Create VDR in DocuSeal
     - `add-documents`: Upload docs to VDR
     - `grant-access`: Invite users to VDR
     - `revoke-access`: Remove user access
   - Triggers:
     - `on-deal-stage-changed` → Auto-create VDR when deal reaches DD stage

6. **Signature Request** (`alecia-esign`)
   - Location: `services/flows-pieces/pieces/alecia-esign/`
   - Actions:
     - `send-signature-request`: Create signature request in DocuSeal
     - `check-signature-status`: Poll completion status
     - `download-signed-document`: Retrieve signed PDF
   - Triggers:
     - `on-signature-completed`: Webhook from DocuSeal

7. **Calendar Booking** (`alecia-calendar`)
   - Location: `services/flows-pieces/pieces/alecia-calendar/`
   - Actions:
     - `schedule-meeting`: Create meeting via Microsoft Calendar
     - `send-meeting-invite`: Send calendar invites
     - `check-availability`: Find free slots
   - Integration: Microsoft Graph API

8. **Financial Model Export** (`alecia-financial`)
   - Location: `services/flows-pieces/pieces/alecia-financial/`
   - Actions:
     - `export-valuation-to-excel`: Generate Excel from DB
     - `export-model-to-excel`: Export 3-statement model
     - `export-comparables`: Export comp table
   - Uses: ExcelJS library

9. **Notification Hub** (`alecia-notifications`)
   - Location: `services/flows-pieces/pieces/alecia-notifications/`
   - Actions:
     - `send-slack-notification`: Send to Slack channel
     - `send-email-notification`: Send via Microsoft Graph
     - `send-sms-notification`: Send via Twilio (optional)
     - `create-in-app-notification`: Write to PostgreSQL

**Implementation Guide**:

```bash
# Create new piece structure
mkdir -p services/flows-pieces/pieces/alecia-pappers/src/{actions,triggers}
cd services/flows-pieces/pieces/alecia-pappers

# package.json
cat > package.json << 'EOF'
{
  "name": "@activepieces/piece-alecia-pappers",
  "version": "0.0.1",
  "description": "Pappers API integration for French company research",
  "main": "src/index.ts",
  "dependencies": {
    "@activepieces/pieces-framework": "^0.3.0",
    "axios": "^1.6.0"
  }
}
EOF

# src/index.ts
cat > src/index.ts << 'EOF'
import { createPiece } from '@activepieces/pieces-framework';
import { searchCompany } from './actions/search-company';
import { getCompanyDetails } from './actions/get-company-details';

export const pappersPiece = createPiece({
  name: 'alecia-pappers',
  displayName: 'Pappers (Alecia)',
  logoUrl: '/branding/logo-icon.svg',
  authors: ['Alecia'],
  actions: [searchCompany, getCompanyDetails],
  triggers: [],
});
EOF

# Repeat for all 9 pieces...
```

---

#### Task #15: Create 5 M&A workflow templates

**Templates to Create**:

1. **new-deal-intake.json** — New Deal Intake Flow
   - Trigger: Manual or webhook
   - Steps:
     1. Capture deal info (form/API)
     2. Create in PostgreSQL (`alecia-pipeline:create-deal`)
     3. Assign team members (`alecia-pipeline:assign-deal`)
     4. Send Slack notification (`alecia-notifications:send-slack`)
     5. Create calendar meeting (`alecia-calendar:schedule-meeting`)

2. **due-diligence-checklist.json** — Due Diligence Automation
   - Trigger: Deal stage changed to "Due Diligence"
   - Steps:
     1. Create data room (`alecia-vdr:create-data-room`)
     2. Generate DD checklist PDF (`alecia-docgen:generate-checklist`)
     3. Upload to VDR (`alecia-vdr:add-documents`)
     4. Send access invites (`alecia-vdr:grant-access`)
     5. Notify team (`alecia-notifications:send-email`)

3. **buyer-outreach.json** — Buyer Outreach Campaign
   - Trigger: Manual or scheduled
   - Steps:
     1. Load buyer list from CRM (`alecia-crm:search-companies`)
     2. Generate personalized teaser (`alecia-docgen:generate-teaser`)
     3. Send email campaign (`alecia-campaigns:send-buyer-outreach`)
     4. Track opens/clicks (`alecia-campaigns:track-email-opens`)
     5. Schedule followup for non-responders

4. **loi-signature.json** — LOI Signature Flow
   - Trigger: Deal stage "LOI Ready"
   - Steps:
     1. Generate LOI document (`alecia-docgen:generate-loi`)
     2. Send signature request (`alecia-esign:send-signature-request`)
     3. Poll signature status (`alecia-esign:check-signature-status`)
     4. On completion → Download signed doc
     5. Archive to Minio + update deal stage

5. **deal-close.json** — Deal Closing Automation
   - Trigger: Deal stage "Closing"
   - Steps:
     1. Generate final closing documents
     2. Collect all signatures
     3. Archive all deal documents to Minio
     4. Send completion notifications
     5. Trigger post-deal integration tasks
     6. Update CRM status to "Closed"

**Template Format** (JSON):

```json
{
  "displayName": "New Deal Intake",
  "version": 1,
  "trigger": {
    "type": "WEBHOOK",
    "settings": {
      "inputUiInfo": {}
    }
  },
  "actions": [
    {
      "name": "create_deal",
      "displayName": "Create Deal in PostgreSQL",
      "type": "PIECE",
      "settings": {
        "pieceName": "alecia-pipeline",
        "pieceVersion": "^0.0.1",
        "actionName": "create-deal",
        "input": {
          "dealName": "{{trigger.body.dealName}}",
          "stage": "Intake",
          "targetValue": "{{trigger.body.targetValue}}"
        }
      }
    },
    // ... more actions
  ]
}
```

**Storage**: `services/flows/templates/`

---

### Phase 5: Testing (Estimated: 2 days)

#### Task #16: Test SSO flow across all 3 tools

**Manual Test Checklist**:

```bash
# Prerequisites
docker-compose -f docker-compose.production.yml up -d

# Test 1: Login Flow
1. Open https://app.alecia.fr/login
2. Sign in with BetterAuth (email/password or OAuth)
3. Verify redirect to dashboard
4. Check cookie: .alecia.fr domain, HttpOnly, Secure

# Test 2: CMS Access (Strapi)
1. Navigate to https://cms.alecia.fr
2. Should NOT prompt for login (Caddy forward_auth)
3. Verify Strapi admin panel loads
4. Check user auto-provisioned (check PostgreSQL)
5. Verify role mapping (admin → Super Admin)

# Test 3: Flows Access (Activepieces)
1. Navigate to https://flows.alecia.fr
2. Should NOT prompt for login
3. Verify Activepieces dashboard loads
4. Check custom pieces visible
5. Verify user auto-provisioned

# Test 4: Sign Access (DocuSeal)
1. Navigate to https://sign.alecia.fr
2. Should NOT prompt for login
3. Verify DocuSeal dashboard loads
4. Check user auto-provisioned
5. Verify branding applied

# Test 5: Logout Flow
1. Logout from app.alecia.fr
2. Try accessing cms.alecia.fr → Should redirect to login
3. Try accessing flows.alecia.fr → Should redirect to login
4. Try accessing sign.alecia.fr → Should redirect to login

# Test 6: Header Injection
curl -H "X-Forwarded-For: 127.0.0.1" \
     https://app.alecia.fr/api/auth/verify-session \
     -v

# Should return 200 + X-Alecia-User-* headers if logged in
```

#### Task #17: Validate branding across all tools

**Visual Validation Checklist**:

- [ ] Alecia logo visible in all admin panels
- [ ] Color schemes match `infrastructure/branding/colors.json`
- [ ] Favicons updated (check browser tab icons)
- [ ] Application names: "Alecia CMS", "Alecia Flows", "Alecia Sign"
- [ ] No vendor attribution (Strapi/Activepieces/DocuSeal logos removed where permitted)
- [ ] Login screens branded
- [ ] Email templates branded (DocuSeal)

#### Task #18: Validate Docker images build and run

```bash
# Build images
./scripts/build-services.sh

# Check image sizes
docker images | grep alecia

# Expected sizes:
# alecia-cms: < 500MB
# alecia-flows: < 800MB

# Test Strapi image
docker run --rm -p 1337:1337 alepanel/alecia-cms:latest
# Visit http://localhost:1337 → Should see Strapi admin

# Test Activepieces image
docker run --rm -p 8080:80 alepanel/alecia-flows:latest
# Visit http://localhost:8080 → Should see Activepieces

# Full stack test
docker-compose -f docker-compose.production.yml up -d
docker-compose -f docker-compose.production.yml ps
docker-compose -f docker-compose.production.yml logs -f
```

#### Task #19: Test M&A workflow templates end-to-end

```bash
# Import workflow templates into Activepieces
# Via UI: flows.alecia.fr → Import → Select template JSON

# Test "New Deal Intake"
1. Trigger workflow via webhook
2. Verify deal created in PostgreSQL
3. Verify team notification sent
4. Verify calendar meeting created

# Test "Due Diligence Checklist"
1. Change deal stage to "Due Diligence"
2. Verify data room created in DocuSeal
3. Verify DD checklist generated
4. Verify access invites sent

# Test "Buyer Outreach"
1. Run workflow manually
2. Verify buyers loaded from CRM
3. Verify personalized emails sent
4. Verify tracking works

# Monitor for errors
docker-compose -f docker-compose.production.yml logs -f activepieces
```

---

## Summary

**Completed**: 13/19 tasks (68%)

**Phase Status**:
- ✅ Phase 1 (SSO): 100% complete
- ✅ Phase 2 (Branding): 100% complete
- ✅ Phase 3 (Docker): 100% complete
- ⏳ Phase 4 (M&A Workflows): 0% (requires 3-5 days of development)
- ⏳ Phase 5 (Testing): 0% (requires 2 days of manual validation)

**Total Remaining Effort**: ~5-7 days

**Next Steps**:

1. **Immediate** (can do now):
   - Run `./scripts/build-services.sh` to build Docker images
   - Test SSO flow locally (Task #16)
   - Validate branding (Task #17)

2. **Short-term** (1-2 weeks):
   - Implement 9 custom Activepieces pieces (Task #14)
   - Create 5 workflow templates (Task #15)
   - End-to-end testing (Task #19)

3. **Deployment** (after testing):
   - Push Docker images to registry
   - Deploy to OVH VPS via Coolify
   - Configure DNS + SSL certs
   - Production smoke tests

---

**Generated**: 2026-02-09
**Tool**: Claude Code (Opus 4.6)
