#!/bin/bash
# Script de correction SSL à exécuter SUR LE VPS
# Usage: ssh ubuntu@51.255.194.94 'bash -s' < scripts/fix-ssl-vps.sh

set -e

cd ~/alecia/alepanel

echo "============================================================"
echo "CORRECTION SSL - GÉNÉRATION CERTIFICATS LET'S ENCRYPT"
echo "============================================================"
echo ""

echo "📊 Étape 1 : Vérification de l'état actuel"
echo "────────────────────────────────────────────────────────"

# Vérifier si Caddy tourne
if docker ps | grep -q alecia-caddy; then
    echo "✅ Caddy est démarré"
    CADDY_STATUS="running"
else
    echo "❌ Caddy n'est PAS démarré"
    CADDY_STATUS="stopped"
fi

echo ""

# Vérifier les ports
echo "Ports écoutés sur 80 et 443 :"
sudo netstat -tlnp | grep -E ':(80|443)' || echo "Aucun service n'écoute sur 80/443"

echo ""
echo ""

echo "🔧 Étape 2 : Correction"
echo "────────────────────────────────────────────────────────"

if [ "$CADDY_STATUS" = "stopped" ]; then
    echo "Démarrage de Caddy..."
    docker compose --env-file .env -f docker-compose.production.yml up -d caddy
else
    echo "Redémarrage de Caddy pour forcer la génération des certificats..."
    docker compose --env-file .env -f docker-compose.production.yml restart caddy
fi

echo ""
echo "⏳ Attente de 30 secondes pour la génération des certificats..."
sleep 30

echo ""
echo ""

echo "📋 Étape 3 : Vérification des logs Caddy"
echo "────────────────────────────────────────────────────────"
echo "Dernières 30 lignes :"
docker logs alecia-caddy --tail 30

echo ""
echo ""

echo "🌐 Étape 4 : Test de connectivité HTTPS"
echo "────────────────────────────────────────────────────────"

echo "Test de alecia.markets :"
curl -I https://alecia.markets 2>&1 | head -1 || echo "❌ Échec"

echo ""
echo "Test de colab.alecia.markets :"
curl -I https://colab.alecia.markets 2>&1 | head -1 || echo "❌ Échec"

echo ""
echo "Test de cms.alecia.markets :"
curl -I https://cms.alecia.markets 2>&1 | head -1 || echo "❌ Échec"

echo ""
echo ""

echo "============================================================"
echo "RÉSUMÉ"
echo "============================================================"
echo ""

# Vérifier si les certificats ont été générés
if docker logs alecia-caddy --tail 100 | grep -q "successfully obtained certificate"; then
    echo "✅ Certificats SSL générés avec succès !"
    echo ""
    echo "Prochaine étape :"
    echo "  1. Ouvrez Firefox en navigation privée (Cmd+Shift+P)"
    echo "  2. Allez sur https://alecia.markets"
    echo ""
    echo "OU nettoyez le cache HSTS :"
    echo "  - Firefox : about:config → chercher 'stricttransportsecurity'"
    echo "  - Chrome : chrome://net-internals/#hsts → Delete domain 'alecia.markets'"
elif docker logs alecia-caddy --tail 100 | grep -q "obtaining certificate"; then
    echo "⏳ Génération des certificats en cours..."
    echo ""
    echo "Suivez les logs en temps réel :"
    echo "  docker logs alecia-caddy -f"
else
    echo "❌ Problème lors de la génération des certificats"
    echo ""
    echo "Vérifiez les logs complets :"
    echo "  docker logs alecia-caddy --tail 100"
    echo ""
    echo "Causes possibles :"
    echo "  1. Port 80 ou 443 déjà utilisé par un autre service"
    echo "  2. Firewall bloquant Let's Encrypt"
    echo "  3. DNS mal configuré"
    echo "  4. Rate limit Let's Encrypt (5 certificats/semaine/domaine)"
fi

echo ""
echo "Pour voir les logs en direct :"
echo "  docker logs alecia-caddy -f"
echo ""
