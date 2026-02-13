#!/bin/bash
# scripts/setup-foss-repos.sh
# Clones FOSS repositories that Alecia Suite depends on for "slim fork" customization
#
# Usage: bash scripts/setup-foss-repos.sh
# Repos are cloned into infrastructure/repos/ (gitignored)
#
# Strategy:
#   - "slim fork" = clone, apply minimal branding, build custom Docker image
#   - "deploy as-is" = use official Docker image, no clone needed
#   - "reference" = study codebase for UX/architecture patterns, no deployment

set -e

REPOS_DIR="$(dirname "$0")/../infrastructure/repos"
mkdir -p "$REPOS_DIR"

echo "=== Alecia Suite — FOSS Repository Setup ==="
echo ""

# ─────────────────────────────────────────────────────────────────────
# SLIM FORK repos — clone, customize, build Docker images
# ─────────────────────────────────────────────────────────────────────

# DocuSeal (AGPL-3.0) — E-signature + Data Room
# https://github.com/docusealco/docuseal
if [ ! -d "$REPOS_DIR/docuseal" ]; then
  echo "📥 Cloning DocuSeal (AGPL-3.0)..."
  git clone --depth 1 --branch master https://github.com/docusealco/docuseal.git "$REPOS_DIR/docuseal"
  echo "   ✓ DocuSeal cloned"
else
  echo "⏭  DocuSeal already cloned"
fi

# Activepieces (MIT) — Automation platform
# https://github.com/activepieces/activepieces
if [ ! -d "$REPOS_DIR/activepieces" ]; then
  echo "📥 Cloning Activepieces (MIT)..."
  git clone --depth 1 --branch main https://github.com/activepieces/activepieces.git "$REPOS_DIR/activepieces"
  echo "   ✓ Activepieces cloned"
else
  echo "⏭  Activepieces already cloned"
fi

# Strapi CE (MIT) — Headless CMS
# We need the project template to scaffold services/cms/
# https://github.com/strapi/strapi
if [ ! -d "$REPOS_DIR/strapi" ]; then
  echo "📥 Cloning Strapi CE (MIT)..."
  git clone --depth 1 --branch develop https://github.com/strapi/strapi.git "$REPOS_DIR/strapi"
  echo "   ✓ Strapi cloned"
else
  echo "⏭  Strapi already cloned"
fi

# ─────────────────────────────────────────────────────────────────────
# REFERENCE repos — study patterns, do NOT deploy
# ─────────────────────────────────────────────────────────────────────

# Plane (Apache 2.0) — Kanban/Gantt UX patterns [HIGHEST PRIORITY]
if [ ! -d "$REPOS_DIR/plane" ]; then
  echo "📥 Cloning Plane (Apache 2.0) — reference for Kanban UX..."
  git clone --depth 1 --branch preview https://github.com/makeplane/plane.git "$REPOS_DIR/plane"
  echo "   ✓ Plane cloned"
else
  echo "⏭  Plane already cloned"
fi

# AFFiNE (MIT) — Notion-like block editor UX [HIGH PRIORITY]
if [ ! -d "$REPOS_DIR/affine" ]; then
  echo "📥 Cloning AFFiNE (MIT) — reference for block editor UX..."
  git clone --depth 1 --branch canary https://github.com/toeverything/AFFiNE.git "$REPOS_DIR/affine"
  echo "   ✓ AFFiNE cloned"
else
  echo "⏭  AFFiNE already cloned"
fi

echo ""
echo "=== Clone Summary ==="
echo "Repos directory: $REPOS_DIR"
echo ""
du -sh "$REPOS_DIR"/* 2>/dev/null | while read -r size dir; do
  echo "  $size  $(basename "$dir")"
done
echo ""
echo "=== Next Steps ==="
echo "1. Apply DocuSeal branding: see infrastructure/repos/docuseal-branding.patch"
echo "2. Study Plane Kanban components: $REPOS_DIR/plane/web/components/issues/"
echo "3. Study AFFiNE block editor: $REPOS_DIR/affine/packages/frontend/core/"
echo "4. Initialize Strapi project: cd services/cms && npx create-strapi-app@latest . --quickstart --no-run"
echo "5. Build custom Activepieces pieces: cd services/flows-pieces && pnpm install"
echo ""
echo "=== Done ==="
