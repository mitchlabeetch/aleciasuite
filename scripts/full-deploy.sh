#!/bin/bash
# Script COMPLET : Upload code + Build images + Deploy
# À exécuter depuis votre Mac

set -e

VPS="ubuntu@51.255.194.94"
LOCAL_DIR="/Users/utilisateur/Desktop/alepanel"

echo "============================================================"
echo "DÉPLOIEMENT COMPLET ALECIA SUITE"
echo "============================================================"
echo ""
echo "Étapes :"
echo "  1. Upload du code vers le VPS"
echo "  2. Build des 6 images Docker (15-20 min)"
echo "  3. Déploiement de la stack"
echo "  4. Génération des certificats SSL"
echo ""
echo "⏱️  Durée totale estimée : 20-25 minutes"
echo ""

# Vérifier que le script build existe
if [ ! -f "$LOCAL_DIR/scripts/build-all-images.sh" ]; then
    echo "❌ Erreur: build-all-images.sh non trouvé"
    exit 1
fi

echo "📦 Étape 1/4 : Création de l'archive du code..."
cd "$LOCAL_DIR"
tar -czf /tmp/alepanel-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='dist' \
  --exclude='build' \
  --exclude='.git' \
  --exclude='infrastructure/repos' \
  --exclude='.turbo' \
  --exclude='scripts/migration/data/convex-export' \
  . 2>/dev/null

ARCHIVE_SIZE=$(du -h /tmp/alepanel-deploy.tar.gz | cut -f1)
echo "✅ Archive créée (taille: $ARCHIVE_SIZE)"
echo ""

echo "📤 Étape 2/4 : Upload vers le VPS..."
scp /tmp/alepanel-deploy.tar.gz $VPS:~/
rm /tmp/alepanel-deploy.tar.gz
echo "✅ Upload terminé"
echo ""

echo "📂 Étape 3/4 : Extraction sur le VPS..."
ssh $VPS << 'ENDSSH'
cd ~
rm -rf ~/alecia/alepanel-backup 2>/dev/null || true
if [ -d ~/alecia/alepanel ]; then
  mv ~/alecia/alepanel ~/alecia/alepanel-backup 2>/dev/null || true
fi
mkdir -p ~/alecia/alepanel
cd ~/alecia/alepanel
tar -xzf ~/alepanel-deploy.tar.gz 2>/dev/null
rm ~/alepanel-deploy.tar.gz
echo "✅ Code extrait"
ENDSSH

echo ""

echo "🔨 Étape 4/4 : Build des images Docker (cela va prendre 15-20 min)..."
echo ""
echo "⏳ Le script va maintenant builder toutes les images sur le VPS."
echo "   Vous pouvez suivre la progression ci-dessous..."
echo ""

# Exécuter le script de build sur le VPS
ssh $VPS 'bash -s' < "$LOCAL_DIR/scripts/build-all-images.sh"

echo ""
echo "============================================================"
echo "BUILD TERMINÉ - DÉPLOIEMENT DE LA STACK"
echo "============================================================"
echo ""

# Déployer la stack
ssh $VPS << 'ENDSSH'
cd ~/alecia/alepanel

# Créer .env si pas déjà fait
if [ ! -f .env ]; then
  echo "Génération du fichier .env..."
  cat > .env << 'ENVFILE'
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
ENVFILE
fi

echo ""
echo "🚀 Déploiement de la stack complète..."
docker compose --env-file .env -f docker-compose.production.yml up -d

echo ""
echo "⏳ Attente du démarrage (30 secondes)..."
sleep 30

echo ""
echo "============================================================"
echo "STATUT DES SERVICES"
echo "============================================================"
docker ps --format 'table {{.Names}}\t{{.Status}}' | head -25

echo ""
echo "🔍 Vérification des services en erreur..."
FAILED=$(docker ps -a --filter "status=restarting" --format "{{.Names}}" | grep alecia || echo "")

if [ -n "$FAILED" ]; then
  echo "⚠️  Services en crashloop :"
  echo "$FAILED"
  echo ""
  echo "Logs des services en erreur :"
  for service in $FAILED; do
    echo ""
    echo "▸ $service (15 dernières lignes) :"
    docker logs $service --tail 15 2>&1 | tail -15
  done
else
  echo "✅ Aucun service en crashloop !"
fi

echo ""
echo "📊 Résumé :"
RUNNING=$(docker ps --format '{{.Names}}' | grep alecia | wc -l)
TOTAL=$(docker ps -a --format '{{.Names}}' | grep alecia | wc -l)
echo "  Services actifs : $RUNNING / $TOTAL"

echo ""
echo "🔐 Secrets importants :"
grep -E "MINIFLUX_ADMIN_PASSWORD|STIRLING_PASSWORD" .env 2>/dev/null || echo "Voir le fichier .env pour tous les secrets"

ENDSSH

echo ""
echo "============================================================"
echo "✅ DÉPLOIEMENT COMPLET TERMINÉ"
echo "============================================================"
echo ""
echo "Services disponibles :"
echo "  - https://alecia.markets"
echo "  - https://colab.alecia.markets"
echo "  - https://cms.alecia.markets"
echo "  - https://flows.alecia.markets"
echo "  - https://sign.alecia.markets"
echo ""
echo "📝 Prochaines étapes :"
echo "  1. Vérifier que les certificats SSL sont générés"
echo "  2. Tester l'accès HTTPS"
echo "  3. Nettoyer le cache HSTS du navigateur si nécessaire"
echo ""
echo "Pour vérifier l'état SSL :"
echo "  ssh $VPS 'docker logs alecia-caddy --tail 50'"
echo ""
