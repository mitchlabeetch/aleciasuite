#!/bin/bash
# Script de déploiement complet - Upload + Rebuild + Deploy
# Utilise scp pour l'upload et exécution distante

set -e

VPS="ubuntu@51.255.194.94"
LOCAL_DIR="/Users/utilisateur/Desktop/alepanel"

echo "============================================================"
echo "ALECIA SUITE - DÉPLOIEMENT COMPLET"
echo "============================================================"
echo ""
echo "Actions :"
echo "  1. Créer une archive du code local (sans node_modules)"
echo "  2. Upload l'archive vers le VPS"
echo "  3. Extraire et reconstruire les images Docker"
echo "  4. Redéployer la stack complète"
echo "✅ Confirmation automatique activée, lancement du déploiement..."
echo ""

echo "📦 Étape 1/4 : Création de l'archive du code..."

cd "$LOCAL_DIR"

# Créer l'archive en excluant les fichiers volumineux
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
echo "📤 Étape 2/4 : Upload vers le VPS..."

scp /tmp/alepanel-deploy.tar.gz $VPS:~/

if [ $? -ne 0 ]; then
  echo "❌ Erreur lors de l'upload"
  rm /tmp/alepanel-deploy.tar.gz
  exit 1
fi

echo "✅ Upload terminé"
rm /tmp/alepanel-deploy.tar.gz

echo ""
echo "📂 Étape 3/4 : Extraction et préparation..."

ssh $VPS << 'ENDSSH'
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
echo "🔨 Étape 4/4 : Rebuild et déploiement..."
echo ""

# Exécuter le script de rebuild sur le VPS
ssh $VPS 'bash -s' < "$LOCAL_DIR/scripts/rebuild-and-deploy.sh"

echo ""
echo "============================================================"
echo "✅ DÉPLOIEMENT COMPLET TERMINÉ"
echo "============================================================"
echo ""
echo "Services disponibles:"
echo "  - https://alecia.markets (Marketing + App)"
echo "  - https://colab.alecia.markets (Collaboration)"
echo "  - https://cms.alecia.markets (CMS)"
echo "  - https://flows.alecia.markets (Automation)"
echo "  - https://sign.alecia.markets (E-signature)"
echo ""
echo "Monitoring:"
echo "  ./scripts/monitor-vps.sh"
echo ""
