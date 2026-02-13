#!/bin/bash
# À exécuter directement sur le VPS après avoir synchronisé le code
# Usage: ssh ubuntu@51.255.194.94 'bash -s' < scripts/rebuild-and-deploy.sh

set -e

cd ~/alecia/alepanel

echo "============================================================"
echo "ALECIA SUITE - REBUILD & REDÉPLOIEMENT"
echo "============================================================"
echo ""

# Étape 1: Build des images personnalisées
echo "🔨 Étape 1/2 : Build des images Docker personnalisées..."
echo ""

echo "[1/5] Building Website (Next.js 15)..."
docker build -f apps/website/Dockerfile -t alecia/website:latest . 2>&1 | grep -E "Successfully|ERROR|Step" || true

echo "[2/5] Building Colab (Next.js 16)..."
docker build -f apps/colab/Dockerfile -t alecia/colab:latest . 2>&1 | grep -E "Successfully|ERROR|Step" || true

echo "[3/5] Building Hocuspocus (WebSocket)..."
docker build -f services/hocuspocus/Dockerfile -t alecia/hocuspocus:latest services/hocuspocus/ 2>&1 | grep -E "Successfully|ERROR|Step" || true

echo "[4/5] Building CMS (Strapi CE)..."
docker build -f services/cms/Dockerfile -t alecia/cms:latest services/cms/ 2>&1 | grep -E "Successfully|ERROR|Step" || true

echo "[5/5] Building Flows (Activepieces)..."
docker build -f services/flows/Dockerfile -t alecia/flows:latest services/flows/ 2>&1 | grep -E "Successfully|ERROR|Step" || true

echo ""
echo "✅ Images construites:"
docker images | grep alecia

echo ""

# Étape 2: Redéploiement
echo "🚀 Étape 2/2 : Redéploiement de la stack..."
echo ""

echo "Arrêt des conteneurs existants..."
docker compose --env-file .env -f docker-compose.production.yml down

echo "Démarrage de la stack complète (20 services)..."
docker compose --env-file .env -f docker-compose.production.yml up -d

echo "Attente du démarrage (15 secondes)..."
sleep 15

echo ""
echo "============================================================"
echo "STATUT DES SERVICES"
echo "============================================================"
docker compose --env-file .env -f docker-compose.production.yml ps

echo ""
echo "🔍 Vérification des services en erreur..."
FAILED=$(docker compose --env-file .env -f docker-compose.production.yml ps --filter "status=restarting" --format "{{.Service}}" 2>/dev/null || true)

if [ -n "$FAILED" ]; then
  echo "⚠️  Services en crashloop:"
  echo "$FAILED"
  echo ""
  echo "Logs des services en erreur:"
  for service in $FAILED; do
    echo ""
    echo "▸ alecia-${service} (dernières 20 lignes):"
    docker logs alecia-${service} --tail 20
  done
else
  echo "✅ Tous les services sont opérationnels!"
fi

echo ""
echo "============================================================"
echo "✅ DÉPLOIEMENT TERMINÉ"
echo "============================================================"
