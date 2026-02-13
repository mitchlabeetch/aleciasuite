#!/bin/bash
# Script de déploiement complet avec sshpass
# Nécessite: brew install hudochenkov/sshpass/sshpass

set -e

VPS="ubuntu@51.255.194.94"
VPS_DIR="~/alecia/alepanel"

echo "============================================================"
echo "ALECIA SUITE - DÉPLOIEMENT COMPLET AVEC SSHPASS"
echo "============================================================"
echo ""

# Demander le mot de passe une seule fois
read -sp "Mot de passe SSH pour ubuntu@51.255.194.94: " SSH_PASSWORD
echo ""
echo ""

export SSHPASS="$SSH_PASSWORD"

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
  .

ARCHIVE_SIZE=$(du -h /tmp/alepanel-deploy.tar.gz | cut -f1)
echo "✅ Archive créée (taille: $ARCHIVE_SIZE)"
echo ""

echo "📤 Étape 2/5 : Upload vers le VPS..."
sshpass -e scp -o StrictHostKeyChecking=no /tmp/alepanel-deploy.tar.gz $VPS:~/
rm /tmp/alepanel-deploy.tar.gz
echo "✅ Upload terminé"
echo ""

echo "📂 Étape 3/5 : Extraction sur le VPS..."
sshpass -e ssh -o StrictHostKeyChecking=no $VPS << 'ENDSSH'
cd ~
rm -rf ~/alecia/alepanel-backup
if [ -d ~/alecia/alepanel ]; then
  mv ~/alecia/alepanel ~/alecia/alepanel-backup
fi
mkdir -p ~/alecia/alepanel
cd ~/alecia/alepanel
tar -xzf ~/alepanel-deploy.tar.gz
rm ~/alepanel-deploy.tar.gz
echo "✅ Code extrait"
ENDSSH

echo ""

echo "🔐 Étape 4/5 : Génération du fichier .env avec secrets..."
sshpass -e ssh -o StrictHostKeyChecking=no $VPS << 'ENDSSH'
cd ~/alecia/alepanel

# Générer le fichier .env avec vrais secrets cryptographiques
cat > .env << 'EOF'
# Alecia Suite - Production Environment Variables
# Generated on $(date)

# PostgreSQL
POSTGRES_PASSWORD=$(openssl rand -hex 32)

# Redis
REDIS_PASSWORD=$(openssl rand -hex 32)

# Minio
MINIO_ROOT_USER=alecia-admin
MINIO_ROOT_PASSWORD=$(openssl rand -hex 32)

# BetterAuth
BETTER_AUTH_SECRET=$(openssl rand -hex 32)
BETTER_AUTH_URL=https://alecia.markets
TOKEN_ENCRYPTION_KEY=$(openssl rand -hex 32)

# Strapi
STRAPI_JWT_SECRET=$(openssl rand -hex 32)
STRAPI_ADMIN_JWT_SECRET=$(openssl rand -hex 32)
STRAPI_APP_KEYS=$(openssl rand -hex 32)
STRAPI_API_TOKEN_SALT=$(openssl rand -hex 32)

# Activepieces
AP_ENCRYPTION_KEY=$(openssl rand -hex 32)
AP_JWT_SECRET=$(openssl rand -hex 32)

# Plausible
PLAUSIBLE_SECRET_KEY_BASE=$(openssl rand -hex 32)

# Miniflux
MINIFLUX_ADMIN_PASSWORD=$(openssl rand -hex 16)

# DocuSeal
DOCUSEAL_SECRET_KEY_BASE=$(openssl rand -hex 32)

# Vaultwarden
VAULTWARDEN_ADMIN_TOKEN=$(openssl rand -hex 32)

# Stirling PDF
STIRLING_PASSWORD=$(openssl rand -hex 16)

# OVH DNS (optional)
OVH_ENDPOINT=ovh-eu
OVH_APPLICATION_KEY=
OVH_APPLICATION_SECRET=
OVH_CONSUMER_KEY=
EOF

echo "✅ Fichier .env généré avec secrets cryptographiques"
echo "   Nombre de lignes: $(wc -l < .env)"
ENDSSH

echo ""

echo "🚀 Étape 5/5 : Déploiement de la stack complète..."
sshpass -e ssh -o StrictHostKeyChecking=no $VPS << 'ENDSSH'
cd ~/alecia/alepanel

echo "Arrêt des conteneurs existants..."
docker compose --env-file .env -f docker-compose.production.yml down 2>&1 | grep -E "(Stopped|Removed)" || true

echo ""
echo "Démarrage de la stack complète (20 services)..."
docker compose --env-file .env -f docker-compose.production.yml up -d

echo ""
echo "Attente du démarrage (15 secondes)..."
sleep 15

echo ""
echo "============================================================"
echo "STATUT DES SERVICES"
echo "============================================================"
docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -E '(NAMES|alecia)' || docker ps --format 'table {{.Names}}\t{{.Status}}'

echo ""
echo "============================================================"
echo "IMAGES DOCKER LOCALES"
echo "============================================================"
docker images | grep alecia || echo "Aucune image alecia trouvée!"

echo ""
echo "🔍 Vérification des services en erreur..."
FAILED=$(docker ps -a --filter "status=restarting" --format "{{.Names}}" | grep alecia || true)

if [ -n "$FAILED" ]; then
  echo "⚠️  Services en crashloop:"
  echo "$FAILED"
  echo ""
  echo "Logs des services en erreur:"
  for service in $FAILED; do
    echo ""
    echo "▸ $service (20 dernières lignes):"
    docker logs $service --tail 20 2>&1
  done
else
  echo "✅ Aucun service en crashloop!"
fi

echo ""
echo "============================================================"
echo "SECRETS DE PRODUCTION"
echo "============================================================"
echo "Pour récupérer les mots de passe admin:"
echo "  ssh ubuntu@51.255.194.94 'cat ~/alecia/alepanel/.env'"
echo ""
echo "Mots de passe importants:"
grep -E "MINIFLUX_ADMIN_PASSWORD|STIRLING_PASSWORD" .env || echo "Secrets dans le fichier .env"

ENDSSH

echo ""
echo "============================================================"
echo "✅ DÉPLOIEMENT COMPLET TERMINÉ"
echo "============================================================"
echo ""
echo "Services disponibles:"
echo "  - https://alecia.markets (Marketing + App)"
echo "  - https://colab.alecia.markets (Collaboration)"
echo "  - https://cms.alecia.markets (CMS Strapi)"
echo "  - https://flows.alecia.markets (Automation)"
echo "  - https://sign.alecia.markets (E-signature)"
echo ""
echo "Pour monitorer:"
echo "  ./scripts/monitor-vps.sh"
echo ""
echo "Pour récupérer tous les secrets:"
echo "  sshpass -p 'VOTRE_MOT_DE_PASSE' ssh ubuntu@51.255.194.94 'cat ~/alecia/alepanel/.env'"
echo ""
