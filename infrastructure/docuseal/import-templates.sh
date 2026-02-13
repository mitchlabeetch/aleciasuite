#!/bin/bash
# DocuSeal Template Import Script
# Usage: ./import-templates.sh <DOCUSEAL_API_KEY>
# Templates are imported via DocuSeal's REST API
# API Docs: https://www.docuseal.co/docs/api

set -e

API_KEY="${1:?Usage: ./import-templates.sh <API_KEY>}"
BASE_URL="${DOCUSEAL_URL:-https://sign.alecia.fr}"

echo "============================================"
echo "DocuSeal Template Import Script"
echo "============================================"
echo "Base URL: $BASE_URL"
echo "Templates directory: ./templates"
echo ""

if [ ! -d "./templates" ]; then
  echo "Error: ./templates directory not found"
  exit 1
fi

template_count=$(ls -1 ./templates/*.json 2>/dev/null | wc -l)
if [ "$template_count" -eq 0 ]; then
  echo "Error: No JSON templates found in ./templates/"
  exit 1
fi

echo "Found $template_count template(s) to import"
echo ""

for template in ./templates/*.json; do
  name=$(basename "$template" .json)
  echo "Importing template: $name"

  response=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/templates" \
    -H "X-Auth-Token: ${API_KEY}" \
    -H "Content-Type: application/json" \
    -d @"$template")

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
    echo "  ✓ Success (HTTP $http_code)"
  else
    echo "  ✗ Failed (HTTP $http_code)"
    echo "  Response: $body"
  fi
  echo ""
done

echo "============================================"
echo "Template import completed"
echo "============================================"
