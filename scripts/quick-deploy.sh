#!/bin/bash
# Script de monitoring et déploiement rapide sur VPS
# À exécuter APRÈS avoir uploadé le code via SCP manuellement

echo "============================================================"
echo "MONITORING & DÉPLOIEMENT RAPIDE"
echo "============================================================"
echo ""
echo "Ce script vérifie l'état actuel et relance le déploiement."
echo ""

# Connexion SSH et exécution
ssh -o StrictHostKeyChecking=no ubuntu@51.255.194.94 << 'ENDSSH'
cd ~/alecia/alepanel

echo "📊 État actuel du système:"
echo "─────────────────────────────────────────────────────────"
echo "Disque: $(df -h / | tail -n 1 | awk '{print $5 " utilisé sur " $2}')"
echo "Mémoire: $(free -h | awk '/^Mem/ {print $3 " / " $2}')"
echo ""

echo "🐳 Images Docker disponibles:"
echo "─────────────────────────────────────────────────────────"
docker images | grep -E "(REPOSITORY|alecia)"
echo ""

echo "📂 Fichier .env:"
echo "─────────────────────────────────────────────────────────"
if [ -f .env ]; then
  echo "✅ Existe ($(wc -l < .env) lignes)"
  # Vérifier si les secrets sont définis
  if grep -q "^POSTGRES_PASSWORD=" .env && ! grep -q "POSTGRES_PASSWORD=\${" .env; then
    echo "✅ Secrets définis correctement"
  else
    echo "❌ Secrets manquants ou mal configurés"
    echo ""
    echo "Génération du .env avec secrets..."

    cat > .env << 'EOF'
# Alecia Suite - Production Environment Variables
# Generated $(date)

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
EOF

    echo "✅ Fichier .env généré"
  fi
else
  echo "❌ .env manquant!"
fi

echo ""
echo "🚀 Lancement du déploiement..."
echo "─────────────────────────────────────────────────────────"

# Arrêter les conteneurs existants
docker compose --env-file .env -f docker-compose.production.yml down 2>&1 | grep -E "(Stopped|Removed|Container)"

# Démarrer la stack
docker compose --env-file .env -f docker-compose.production.yml up -d

echo ""
echo "⏳ Attente du démarrage (15s)..."
sleep 15

echo ""
echo "============================================================"
echo "STATUT FINAL DES SERVICES"
echo "============================================================"
docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -E '(NAMES|alecia)'

echo ""
echo "🔍 Services en erreur:"
echo "─────────────────────────────────────────────────────────"
FAILED=$(docker ps -a --filter "status=restarting" --format "{{.Names}}" | grep alecia || true)
if [ -n "$FAILED" ]; then
  echo "$FAILED"
  echo ""
  echo "Logs des services en erreur:"
  for service in $FAILED; do
    echo ""
    echo "▸ $service (20 dernières lignes):"
    docker logs $service --tail 20
  done
else
  echo "✅ Aucun service en crashloop"
fi

echo ""
echo "============================================================"
echo "✅ DÉPLOIEMENT TERMINÉ"
echo "============================================================"
echo ""
echo "Services disponibles:"
echo "  - https://alecia.markets"
echo "  - https://colab.alecia.markets"
echo "  - https://cms.alecia.markets"
echo "  - https://flows.alecia.markets"
echo "  - https://sign.alecia.markets"
echo ""
ENDSSH

echo ""
echo "Terminé!"
