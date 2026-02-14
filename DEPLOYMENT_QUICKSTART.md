# Alecia Suite - Quick Deployment Guide

## Prerequisites

- Fresh Ubuntu 24.04 VPS (minimum 8 vCPU, 32GB RAM, 500GB SSD)
- Root or sudo access
- Domain DNS configured (A records for alecia.markets and *.alecia.markets)
- OVH DNS API credentials

## Step 1: Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

## Step 2: Clone Repository

```bash
git clone https://github.com/mitchlabeetch/aleciasuite.git
cd aleciasuite
```

## Step 3: Generate Secrets

```bash
chmod +x scripts/*.sh
./scripts/generate-secrets.sh
```

Edit `.env` and add your OVH credentials.

## Step 4: Deploy

```bash
./scripts/deploy-production.sh
```

## Step 5: Verify

```bash
docker compose -f docker-compose.production.yml ps
```

All services should show "Up (healthy)".

## Access Your Services

- https://alecia.markets - Main website
- https://colab.alecia.markets - Collaboration
- https://cms.alecia.markets/admin - Strapi (create admin on first visit)
- https://flows.alecia.markets - Activepieces (create admin)
- https://analytics.alecia.markets - Plausible
- https://sign.alecia.markets - DocuSeal
- https://feeds.alecia.markets - Miniflux (admin / password from .env)
- https://vault.alecia.markets - Vaultwarden
- https://docs.alecia.markets - Stirling-PDF
- https://s3.alecia.markets - Minio console
- https://serveradministration.alecia.markets - Dashboard d'administration

## 📊 Dashboard d'Administration

Le tableau de bord est accessible à : **https://serveradministration.alecia.markets**

### Fonctionnalités

- ✅ Vue d'ensemble de tous les services
- 🔄 Démarrer/arrêter les services
- 📋 Consulter les logs en temps réel
- 🔄 Mettre à jour depuis GitHub
- 🇫🇷 Interface 100% en français

### Utilisation

1. **Démarrer tous les services** : Bouton "▶️ Démarrer Tout"
2. **Arrêter tous les services** : Bouton "⏹️ Arrêter Tout"
3. **Mettre à jour** : Bouton "🔄 Mettre à Jour"
4. **Gérer un service** : Utilisez les boutons sur chaque carte de service
5. **Voir les logs** : Cliquez sur "📋 Logs" pour voir les logs en temps réel

### Sécurité du Dashboard

Par défaut, le dashboard est accessible publiquement. Pour production, considérez :

1. **Activer l'authentification basique dans Caddy**:
   Décommentez les lignes dans `infrastructure/caddy/Caddyfile`:
   ```caddyfile
   serveradministration.alecia.markets {
       basicauth /* {
           admin JDJhJDE0JHhoYXNoZWRfcGFzc3dvcmQ  # généré avec caddy hash-password
       }
       reverse_proxy alecia-dashboard:3100
   }
   ```

2. **Restreindre l'accès par IP** (optionnel):
   Ajoutez des règles de pare-feu UFW pour n'autoriser que certaines IPs.

## Troubleshooting

View logs:
```bash
docker compose -f docker-compose.production.yml logs -f [service-name]
```

Restart a service:
```bash
docker compose -f docker-compose.production.yml restart [service-name]
```
