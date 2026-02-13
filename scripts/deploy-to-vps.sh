#!/bin/bash
# Script de déploiement complet vers le VPS OVH
# Synchronise le code et reconstruit les images Docker

set -e

# Configuration
VPS_HOST="51.255.194.94"
VPS_USER="ubuntu"
VPS_PATH="~/alecia/alepanel"
LOCAL_PATH="/Users/utilisateur/Desktop/alepanel"

echo "============================================================"
echo "ALECIA SUITE - DÉPLOIEMENT VERS VPS"
echo "============================================================"
echo ""
echo "VPS: ${VPS_USER}@${VPS_HOST}"
echo "Chemin distant: ${VPS_PATH}"
echo ""

# Étape 1: Synchronisation du code
echo "📦 Étape 1/4 : Synchronisation du code vers le VPS..."
echo ""

rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude 'dist' \
  --exclude 'build' \
  --exclude '.git' \
  --exclude '.env.local' \
  --exclude 'infrastructure/repos' \
  --exclude '.turbo' \
  --exclude 'scripts/migration/data/convex-export' \
  "${LOCAL_PATH}/" \
  "${VPS_USER}@${VPS_HOST}:${VPS_PATH}/"

if [ $? -ne 0 ]; then
  echo "❌ Erreur lors de la synchronisation"
  exit 1
fi

echo "✅ Code synchronisé"
echo ""

# Étape 2: Build des images personnalisées
echo "🔨 Étape 2/4 : Build des images Docker personnalisées..."
echo ""

ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
cd ~/alecia/alepanel

echo "[1/5] Building Website (Next.js 15)..."
docker build -f apps/website/Dockerfile -t alecia/website:latest . || exit 1

echo "[2/5] Building Colab (Next.js 16)..."
docker build -f apps/colab/Dockerfile -t alecia/colab:latest . || exit 1

echo "[3/5] Building Hocuspocus (WebSocket)..."
docker build -f services/hocuspocus/Dockerfile -t alecia/hocuspocus:latest services/hocuspocus/ || exit 1

echo "[4/5] Building CMS (Strapi CE)..."
docker build -f services/cms/Dockerfile -t alecia/cms:latest services/cms/ || exit 1

echo "[5/5] Building Flows (Activepieces)..."
docker build -f services/flows/Dockerfile -t alecia/flows:latest services/flows/ || exit 1

echo ""
echo "✅ Toutes les images sont construites"
docker images | grep alecia
ENDSSH

if [ $? -ne 0 ]; then
  echo "❌ Erreur lors du build des images"
  exit 1
fi

echo ""

# Étape 3: Vérification de l'environnement
echo "🔍 Étape 3/4 : Vérification de l'environnement..."
echo ""

ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
cd ~/alecia/alepanel

if [ ! -f .env ]; then
  echo "❌ Fichier .env manquant"
  exit 1
fi

# Vérifier que les secrets ne sont pas des placeholders
if grep -q "REPLACE_WITH_" .env; then
  echo "⚠️  Warning: .env contient des placeholders REPLACE_WITH_*"
  echo "Les secrets doivent être générés avec des valeurs réelles"
fi

echo "✅ Environnement OK"
ENDSSH

echo ""

# Étape 4: Déploiement de la stack
echo "🚀 Étape 4/4 : Déploiement de la stack complète..."
echo ""

ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
cd ~/alecia/alepanel

# Arrêter les conteneurs existants
echo "Arrêt des conteneurs existants..."
docker compose --env-file .env -f docker-compose.production.yml down

# Démarrer la stack complète
echo "Démarrage de la stack complète (20 services)..."
docker compose --env-file .env -f docker-compose.production.yml up -d

# Attendre 10 secondes pour le démarrage
sleep 10

# Afficher le statut
echo ""
echo "============================================================"
echo "STATUT DES SERVICES"
echo "============================================================"
docker compose --env-file .env -f docker-compose.production.yml ps

# Vérifier les services en erreur
echo ""
echo "🔍 Vérification des services..."
FAILED=$(docker compose --env-file .env -f docker-compose.production.yml ps --filter "status=restarting" --format "{{.Service}}")

if [ -n "$FAILED" ]; then
  echo "⚠️  Services en crashloop détectés:"
  echo "$FAILED"
  echo ""
  echo "Pour voir les logs:"
  echo "docker logs alecia-<service> --tail 50"
else
  echo "✅ Tous les services sont démarrés"
fi
ENDSSH

echo ""
echo "============================================================"
echo "✅ DÉPLOIEMENT TERMINÉ"
echo "============================================================"
echo ""
echo "Services disponibles sur:"
echo "  - https://alecia.markets (Marketing + App)"
echo "  - https://colab.alecia.markets (Collaboration)"
echo "  - https://cms.alecia.markets (CMS Strapi)"
echo "  - https://flows.alecia.markets (Automation Activepieces)"
echo "  - https://sign.alecia.markets (E-signature DocuSeal)"
echo "  - https://storage.alecia.markets (Minio S3)"
echo ""
echo "Pour monitorer les services:"
echo "  ssh ${VPS_USER}@${VPS_HOST}"
echo "  cd ~/alecia/alepanel"
echo "  docker compose --env-file .env -f docker-compose.production.yml ps"
echo "  docker compose --env-file .env -f docker-compose.production.yml logs -f <service>"
echo ""
