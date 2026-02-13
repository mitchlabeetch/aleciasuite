#!/bin/bash
# Script de déploiement NON-INTERACTIF avec sshpass
# Usage: SSHPASS='votre_mot_de_passe' ./scripts/deploy-now.sh

set -e

VPS="ubuntu@51.255.194.94"
VPS_DIR="~/alecia/alepanel"

if [ -z "$SSHPASS" ]; then
  echo "❌ Erreur: Variable SSHPASS non définie"
  echo ""
  echo "Usage:"
  echo "  SSHPASS='votre_mot_de_passe' ./scripts/deploy-now.sh"
  exit 1
fi

echo "============================================================"
echo "ALECIA SUITE - DÉPLOIEMENT AUTOMATIQUE"
echo "============================================================"
echo ""

echo "📦 Étape 1/5 : Création de l'archive..."
cd /Users/utilisateur/Desktop/alepanel
tar -czf /tmp/alepanel-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='dist' \
  --exclude='build' \
  --exclude='.git' \
  --exclude='.env.local' \
  --exclude='infrastructure/repos' \
  --exclude='.turbo' \
  --exclude='scripts/migration/data/convex-export' \
  . 2>/dev/null

ARCHIVE_SIZE=$(du -h /tmp/alepanel-deploy.tar.gz | cut -f1)
echo "✅ Archive créée (taille: $ARCHIVE_SIZE)"
echo ""

echo "📤 Étape 2/5 : Upload vers le VPS..."
sshpass -e scp -o StrictHostKeyChecking=no /tmp/alepanel-deploy.tar.gz $VPS:~/ 2>/dev/null
rm /tmp/alepanel-deploy.tar.gz
echo "✅ Upload terminé"
echo ""

echo "📂 Étape 3/5 : Extraction sur le VPS..."
sshpass -e ssh -o StrictHostKeyChecking=no $VPS 'bash -s' << 'ENDSSH'
cd ~
rm -rf ~/alecia/alepanel-backup 2>/dev/null || true
if [ -d ~/alecia/alepanel ]; then
  mv ~/alecia/alepanel ~/alecia/alepanel-backup 2>/dev/null || true
fi
mkdir -p ~/alecia/alepanel
cd ~/alecia/alepanel
tar -xzf ~/alepanel-deploy.tar.gz
rm ~/alepanel-deploy.tar.gz
echo "✅ Code extrait"
ENDSSH

echo ""

echo "🔐 Étape 4/5 : Génération du fichier .env..."
sshpass -e ssh -o StrictHostKeyChecking=no $VPS 'bash -s' << 'ENDSSH'
cd ~/alecia/alepanel

# Générer le fichier .env avec vrais secrets
cat > .env << 'EOFENV'
# Alecia Suite - Production Environment Variables
POSTGRES_PASSWORD=$(openssl rand -hex 32)
REDIS_PASSWORD=$(openssl rand -hex 32)
MINIO_ROOT_USER=alecia-admin
MINIO_ROOT_PASSWORD=$(openssl rand -hex 32)
BETTER_AUTH_SECRET=$(openssl rand -hex 32)
BETTER_AUTH_URL=https://alecia.markets
TOKEN_ENCRYPTION_KEY=$(openssl rand -hex 32)
STRAPI_JWT_SECRET=$(openssl rand -hex 32)
STRAPI_ADMIN_JWT_SECRET=$(openssl rand -hex 32)
STRAPI_APP_KEYS=$(openssl rand -hex 32)
STRAPI_API_TOKEN_SALT=$(openssl rand -hex 32)
AP_ENCRYPTION_KEY=$(openssl rand -hex 32)
AP_JWT_SECRET=$(openssl rand -hex 32)
PLAUSIBLE_SECRET_KEY_BASE=$(openssl rand -hex 32)
MINIFLUX_ADMIN_PASSWORD=$(openssl rand -hex 16)
DOCUSEAL_SECRET_KEY_BASE=$(openssl rand -hex 32)
VAULTWARDEN_ADMIN_TOKEN=$(openssl rand -hex 32)
STIRLING_PASSWORD=$(openssl rand -hex 16)
OVH_ENDPOINT=ovh-eu
OVH_APPLICATION_KEY=
OVH_APPLICATION_SECRET=
OVH_CONSUMER_KEY=
EOFENV

echo "✅ Fichier .env généré ($(wc -l < .env) lignes)"
ENDSSH

echo ""

echo "🚀 Étape 5/5 : Déploiement de la stack..."
sshpass -e ssh -o StrictHostKeyChecking=no $VPS 'bash -s' << 'ENDSSH'
cd ~/alecia/alepanel

echo "Arrêt des conteneurs existants..."
docker compose --env-file .env -f docker-compose.production.yml down 2>&1 | grep -E "(Stopped|Removed|Container)" || echo "Aucun conteneur à arrêter"

echo ""
echo "Démarrage de la stack complète..."
docker compose --env-file .env -f docker-compose.production.yml up -d

echo ""
echo "Attente du démarrage (20s)..."
sleep 20

echo ""
echo "============================================================"
echo "STATUT DES SERVICES"
echo "============================================================"
docker ps --format 'table {{.Names}}\t{{.Status}}' | head -25

echo ""
echo "============================================================"
echo "IMAGES DOCKER"
echo "============================================================"
docker images | grep alecia

echo ""
echo "🔍 Services en erreur:"
FAILED=$(docker ps -a --filter "status=restarting" --format "{{.Names}}" | grep alecia || echo "")

if [ -n "$FAILED" ]; then
  echo "⚠️  Crashloop détecté:"
  echo "$FAILED"
  echo ""
  for service in $FAILED; do
    echo "▸ Logs de $service (15 dernières lignes):"
    docker logs $service --tail 15 2>&1 | tail -15
    echo ""
  done
else
  echo "✅ Aucun service en crashloop"
fi

echo ""
echo "📊 Résumé:"
RUNNING=$(docker ps --format '{{.Names}}' | grep alecia | wc -l)
TOTAL=$(docker ps -a --format '{{.Names}}' | grep alecia | wc -l)
echo "  Services actifs: $RUNNING / $TOTAL"

ENDSSH

echo ""
echo "============================================================"
echo "✅ DÉPLOIEMENT TERMINÉ"
echo "============================================================"
echo ""
echo "Services:"
echo "  - https://alecia.markets"
echo "  - https://colab.alecia.markets"
echo "  - https://cms.alecia.markets"
echo "  - https://flows.alecia.markets"
echo "  - https://sign.alecia.markets"
echo ""
echo "Récupérer les secrets:"
echo "  sshpass -e ssh $VPS 'cat ~/alecia/alepanel/.env'"
echo ""
