#!/bin/bash
# Script de correction du docker-compose.production.yml sur le VPS

set -e

echo "============================================================"
echo "CORRECTION DU DOCKER-COMPOSE.PRODUCTION.YML"
echo "============================================================"
echo ""

cd ~/alecia/alepanel

echo "📝 Correction des noms d'images..."

# Corriger les noms d'images (retirer le préfixe alecia/)
sed -i 's|image: alecia/alecia-website:|image: alecia/website:|g' docker-compose.production.yml
sed -i 's|image: alecia/alecia-colab:|image: alecia/colab:|g' docker-compose.production.yml
sed -i 's|image: alecia/alecia-cms:|image: alecia/cms:|g' docker-compose.production.yml
sed -i 's|image: alecia/alecia-flows:|image: alecia/flows:|g' docker-compose.production.yml
sed -i 's|image: alecia/alecia-caddy:|image: alecia/caddy:|g' docker-compose.production.yml
sed -i 's|image: alecia/alecia-hocuspocus:|image: alecia/hocuspocus:|g' docker-compose.production.yml

# Ajouter pull_policy: never pour forcer l'utilisation des images locales
sed -i '/image: alecia\//a\    pull_policy: never' docker-compose.production.yml

echo "✅ Noms d'images corrigés"
echo ""

echo "🔍 Vérification du fichier .env..."
if [ -f .env ]; then
  echo "✅ Fichier .env existe ($(wc -l < .env) lignes)"

  # Vérifier que les secrets sont bien définis
  if grep -q "POSTGRES_PASSWORD=" .env && ! grep -q "POSTGRES_PASSWORD=\${" .env; then
    echo "✅ POSTGRES_PASSWORD défini avec valeur réelle"
  else
    echo "❌ POSTGRES_PASSWORD manquant ou mal configuré"
  fi
else
  echo "❌ Fichier .env manquant!"
  exit 1
fi

echo ""
echo "🐳 Vérification des images Docker locales..."
docker images | grep alecia

echo ""
echo "✅ Corrections appliquées!"
echo ""
echo "Utilisez maintenant:"
echo "  docker compose --env-file .env -f docker-compose.production.yml up -d"
echo ""
