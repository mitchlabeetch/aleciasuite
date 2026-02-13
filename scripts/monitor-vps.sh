#!/bin/bash
# Script de monitoring rapide du VPS

VPS_HOST="51.255.194.94"
VPS_USER="ubuntu"

echo "============================================================"
echo "MONITORING ALECIA SUITE - VPS ${VPS_HOST}"
echo "============================================================"
echo ""

ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
cd ~/alecia/alepanel

echo "📊 STATUT DES CONTENEURS"
echo "──────────────────────────────────────────────────────────"
docker compose --env-file .env -f docker-compose.production.yml ps --format "table {{.Service}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "📈 RESSOURCES SYSTÈME"
echo "──────────────────────────────────────────────────────────"
echo "CPU & Mémoire:"
top -bn1 | head -n 5 | tail -n 2

echo ""
echo "Disque:"
df -h / | tail -n 1

echo ""
echo "🐳 IMAGES DOCKER"
echo "──────────────────────────────────────────────────────────"
docker images | grep -E "REPOSITORY|alecia"

echo ""
echo "🔥 SERVICES EN ERREUR (crashloop)"
echo "──────────────────────────────────────────────────────────"
FAILED=$(docker compose --env-file .env -f docker-compose.production.yml ps --filter "status=restarting" --format "{{.Service}}")
if [ -n "$FAILED" ]; then
  echo "$FAILED"
  echo ""
  echo "Pour voir les logs d'un service:"
  echo "  docker logs alecia-<service> --tail 50"
else
  echo "✅ Aucun service en erreur"
fi

echo ""
echo "📝 DERNIERS LOGS (3 dernières lignes par service)"
echo "──────────────────────────────────────────────────────────"
for service in website colab cms; do
  echo "▸ alecia-${service}:"
  docker logs alecia-${service} --tail 3 2>&1 | head -n 3 || echo "  (conteneur non démarré)"
done
ENDSSH

echo ""
echo "============================================================"
echo "Monitoring terminé - $(date '+%H:%M:%S')"
echo "============================================================"
