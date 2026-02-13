#!/bin/bash
# Script de diagnostic SSL/HTTPS pour alecia.markets

echo "============================================================"
echo "DIAGNOSTIC SSL/HTTPS - ALECIA.MARKETS"
echo "============================================================"
echo ""

VPS="51.255.194.94"

echo "📍 Étape 1 : Vérification DNS"
echo "────────────────────────────────────────────────────────"
echo "Résolution DNS pour alecia.markets :"
dig +short alecia.markets @8.8.8.8

echo ""
echo "Résolution DNS pour www.alecia.markets :"
dig +short www.alecia.markets @8.8.8.8

echo ""
echo "Résolution DNS pour colab.alecia.markets :"
dig +short colab.alecia.markets @8.8.8.8

echo ""
echo "✓ Le DNS doit pointer vers : $VPS"
echo ""

echo "🌐 Étape 2 : Test de connectivité HTTP/HTTPS"
echo "────────────────────────────────────────────────────────"
echo "Test HTTP (port 80) :"
nc -zv -w 3 alecia.markets 80 2>&1 | tail -1

echo ""
echo "Test HTTPS (port 443) :"
nc -zv -w 3 alecia.markets 443 2>&1 | tail -1

echo ""

echo "🔒 Étape 3 : Vérification du certificat SSL"
echo "────────────────────────────────────────────────────────"
echo "Certificat SSL pour alecia.markets :"
timeout 5 openssl s_client -connect alecia.markets:443 -servername alecia.markets </dev/null 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "❌ Pas de certificat SSL valide"

echo ""
echo ""
echo "============================================================"
echo "DIAGNOSTIC SUR LE VPS"
echo "============================================================"
echo ""
echo "Connectez-vous au VPS et exécutez :"
echo ""
echo "  ssh ubuntu@$VPS"
echo ""
echo "Puis vérifiez :"
echo ""
echo "# 1. Statut de Caddy"
echo "docker ps | grep caddy"
echo "docker logs alecia-caddy --tail 50"
echo ""
echo "# 2. Vérifier que Caddy écoute sur les bons ports"
echo "sudo netstat -tlnp | grep -E ':(80|443)'"
echo ""
echo "# 3. Vérifier la configuration Caddy"
echo "docker exec alecia-caddy cat /etc/caddy/Caddyfile"
echo ""
echo "# 4. Forcer la régénération des certificats"
echo "docker compose --env-file .env -f docker-compose.production.yml restart caddy"
echo ""
echo "# 5. Vérifier les logs de génération de certificats"
echo "docker logs alecia-caddy -f"
echo ""
