#!/bin/bash
# =============================================================================
# Alecia Suite — Complete Data Migration Pipeline
# Convex + Clerk → PostgreSQL + BetterAuth + Minio
#
# Prerequisites:
#   - Docker Desktop running (PostgreSQL, Redis, Minio containers)
#   - NEXT_PUBLIC_CONVEX_URL set in environment
#   - PostgreSQL migrations applied (docker-compose.dev.yml)
#
# Usage:
#   chmod +x scripts/migration/run-migration.sh
#   ./scripts/migration/run-migration.sh [phase]
#
# Phases:
#   1 = Export all data from Convex
#   2 = Import CRM core (users, companies, contacts, deals)
#   3 = Import remaining shared + BI + Numbers tables
#   4 = Import Colab + Sign tables
#   5 = Migrate files to Minio
#   all = Run phases 1-5 sequentially (default)
# =============================================================================

set -euo pipefail

SCRIPTS_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_DIR="${SCRIPTS_DIR}/data"
PHASE="${1:-all}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

header() {
  echo ""
  echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
  echo ""
}

check_prerequisites() {
  header "Checking prerequisites"

  # Check Node/tsx
  if ! command -v npx &> /dev/null; then
    echo -e "${RED}✗ npx not found. Install Node.js 20+${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ Node.js available${NC}"

  # Check PostgreSQL connection
  if command -v docker &> /dev/null; then
    if docker ps | grep -q alecia-postgres; then
      echo -e "${GREEN}✓ PostgreSQL container running${NC}"
    else
      echo -e "${YELLOW}⚠ PostgreSQL container not running. Start with:${NC}"
      echo "  docker compose -f infrastructure/docker-compose.dev.yml up -d postgres"
    fi
  fi

  # Check Convex URL for export phase
  if [[ "$PHASE" == "1" || "$PHASE" == "all" ]]; then
    if [[ -z "${NEXT_PUBLIC_CONVEX_URL:-}" ]]; then
      echo -e "${YELLOW}⚠ NEXT_PUBLIC_CONVEX_URL not set. Export phase will fail.${NC}"
      echo "  Set it with: export NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud"
    else
      echo -e "${GREEN}✓ Convex URL configured${NC}"
    fi
  fi

  echo ""
}

phase1_export() {
  header "Phase 1: Export all data from Convex"
  npx tsx "${SCRIPTS_DIR}/export-all-from-convex.ts"
  echo ""
  echo -e "${GREEN}✓ Phase 1 complete. Data exported to ${DATA_DIR}/${NC}"
}

phase2_crm() {
  header "Phase 2: Import CRM core (users, companies, contacts, deals)"

  if [[ ! -f "${DATA_DIR}/crm/users.json" ]]; then
    echo -e "${RED}✗ CRM export files not found. Run phase 1 first.${NC}"
    exit 1
  fi

  npx tsx "${SCRIPTS_DIR}/import-crm-to-postgres.ts"
  echo ""

  if [[ -f "${DATA_DIR}/id-map.json" ]]; then
    local count=$(python3 -c "import json; print(len(json.load(open('${DATA_DIR}/id-map.json'))))" 2>/dev/null || echo "?")
    echo -e "${GREEN}✓ Phase 2 complete. ID map contains ${count} mappings.${NC}"
  else
    echo -e "${RED}✗ ID map not created. Check for errors above.${NC}"
    exit 1
  fi
}

phase3_remaining() {
  header "Phase 3: Import shared + BI + Numbers tables"

  if [[ ! -f "${DATA_DIR}/id-map.json" ]]; then
    echo -e "${RED}✗ ID map not found. Run phase 2 first.${NC}"
    exit 1
  fi

  npx tsx "${SCRIPTS_DIR}/import-remaining-to-postgres.ts"
  echo ""
  echo -e "${GREEN}✓ Phase 3 complete.${NC}"
}

phase4_colab_sign() {
  header "Phase 4: Import Colab + Sign tables"

  if [[ ! -f "${DATA_DIR}/id-map.json" ]]; then
    echo -e "${RED}✗ ID map not found. Run phases 2-3 first.${NC}"
    exit 1
  fi

  npx tsx "${SCRIPTS_DIR}/import-colab-sign-to-postgres.ts"
  echo ""
  echo -e "${GREEN}✓ Phase 4 complete.${NC}"
}

phase5_files() {
  header "Phase 5: Migrate files to Minio"

  if [[ ! -f "${DATA_DIR}/id-map.json" ]]; then
    echo -e "${RED}✗ ID map not found. Run phases 2-4 first.${NC}"
    exit 1
  fi

  # Check Minio is running
  if command -v docker &> /dev/null && docker ps | grep -q alecia-minio; then
    echo -e "${GREEN}✓ Minio container running${NC}"
  else
    echo -e "${YELLOW}⚠ Minio container not running. Skipping file migration.${NC}"
    echo "  Start with: docker compose -f infrastructure/docker-compose.dev.yml up -d minio"
    return 0
  fi

  npx tsx "${SCRIPTS_DIR}/migrate-files-to-minio.ts"
  echo ""
  echo -e "${GREEN}✓ Phase 5 complete.${NC}"
}

# ── Main ──────────────────────────────────────────────────────────────

check_prerequisites

case "$PHASE" in
  1) phase1_export ;;
  2) phase2_crm ;;
  3) phase3_remaining ;;
  4) phase4_colab_sign ;;
  5) phase5_files ;;
  all)
    phase1_export
    phase2_crm
    phase3_remaining
    phase4_colab_sign
    phase5_files
    header "Migration complete!"
    echo -e "${GREEN}All 5 phases completed successfully.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Verify data integrity in PostgreSQL"
    echo "  2. Test the website and colab apps"
    echo "  3. Deploy to VPS (OVH Cloud + Coolify)"
    ;;
  *)
    echo "Usage: $0 [1|2|3|4|5|all]"
    exit 1
    ;;
esac
