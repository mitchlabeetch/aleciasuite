#!/bin/bash
# Script de build complet des images Docker
# À exécuter SUR LE VPS dans ~/alecia/alepanel

set -e

echo "============================================================"
echo "BUILD DES IMAGES DOCKER - ALECIA SUITE"
echo "============================================================"
echo ""
echo "Ce script va builder 6 images Docker personnalisées :"
echo "  1. alecia/website (Next.js 15)"
echo "  2. alecia/colab (Next.js 16)"
echo "  3. alecia/hocuspocus (WebSocket)"
echo "  4. alecia/cms (Strapi)"
echo "  5. alecia/flows (Activepieces)"
echo "  6. alecia/caddy (Reverse Proxy + SSL)"
echo ""
echo "⏱️  Durée estimée : 15-20 minutes"
echo ""

# Fonction pour afficher la progression
build_image() {
    local name=$1
    local dockerfile=$2
    local context=$3
    local num=$4
    local total=$5

    echo ""
    echo "============================================================"
    echo "[$num/$total] Building $name"
    echo "============================================================"
    echo "Dockerfile: $dockerfile"
    echo "Context: $context"
    echo ""

    START_TIME=$(date +%s)

    if docker build -f "$dockerfile" -t "$name" "$context"; then
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        echo ""
        echo "✅ $name built successfully in ${DURATION}s"

        # Afficher la taille de l'image
        SIZE=$(docker images "$name" --format "{{.Size}}" | head -1)
        echo "   Size: $SIZE"
        return 0
    else
        echo ""
        echo "❌ Failed to build $name"
        return 1
    fi
}

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "docker-compose.production.yml" ]; then
    echo "❌ Erreur: docker-compose.production.yml non trouvé"
    echo "   Veuillez exécuter ce script depuis ~/alecia/alepanel"
    exit 1
fi

echo "📂 Répertoire de travail : $(pwd)"
echo ""

# Nettoyer les anciens builds (optionnel)
read -p "Voulez-vous nettoyer les anciennes images Docker ? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 Nettoyage des anciennes images..."
    docker image prune -f
    echo "✅ Nettoyage terminé"
fi

echo ""
echo "🚀 Début du build..."
echo ""

# Compteur d'erreurs
ERRORS=0

# Build de toutes les images
build_image "alecia/website:latest" "apps/website/Dockerfile" "." 1 6 || ((ERRORS++))
build_image "alecia/colab:latest" "apps/colab/Dockerfile" "." 2 6 || ((ERRORS++))
build_image "alecia/hocuspocus:latest" "services/hocuspocus/Dockerfile" "services/hocuspocus/" 3 6 || ((ERRORS++))
build_image "alecia/cms:latest" "services/cms/Dockerfile" "services/cms/" 4 6 || ((ERRORS++))
build_image "alecia/flows:latest" "services/flows/Dockerfile" "services/flows/" 5 6 || ((ERRORS++))

# Build Caddy (important pour SSL)
if [ -f "infrastructure/caddy/Dockerfile" ]; then
    build_image "alecia/caddy:latest" "infrastructure/caddy/Dockerfile" "infrastructure/caddy/" 6 6 || ((ERRORS++))
else
    echo ""
    echo "⚠️  infrastructure/caddy/Dockerfile non trouvé, Caddy ne sera pas buildé"
    echo "   Caddy utilisera l'image officielle Docker Hub"
fi

echo ""
echo ""
echo "============================================================"
echo "RÉSUMÉ DU BUILD"
echo "============================================================"
echo ""

# Afficher toutes les images créées
echo "Images Docker créées :"
docker images | grep -E "REPOSITORY|alecia" || echo "Aucune image alecia trouvée"

echo ""

if [ $ERRORS -eq 0 ]; then
    echo "✅ Tous les builds ont réussi !"
    echo ""
    echo "Prochaine étape : Redémarrer la stack Docker"
    echo "  docker compose --env-file .env -f docker-compose.production.yml up -d"
else
    echo "⚠️  $ERRORS build(s) ont échoué"
    echo ""
    echo "Vérifiez les erreurs ci-dessus et corrigez avant de déployer"
fi

echo ""
echo "============================================================"
echo "Temps total : $(($(date +%s) - START_TIME))s"
echo "============================================================"
echo ""
