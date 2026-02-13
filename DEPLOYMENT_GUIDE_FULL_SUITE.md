# Guide de Déploiement Complet — Alecia Suite
**Production sur alecia.markets**

Date: 2026-02-10
Stack: 20 services Docker + PostgreSQL + Redis + Minio
Domaine: alecia.markets (+ 14 subdomains)

---

## 🎯 Vue d'Ensemble

### Services à Déployer

#### Applications Principales (3)
- ✅ **alecia/website** (614MB) — Site marketing + App BI/CRM
- ✅ **alecia/colab** (344MB) — Plateforme collaboration TipTap
- ⏳ **alecia/hocuspocus** — Serveur WebSocket Yjs (~2min build)

#### Services FOSS Customisés (3)
- ⏳ **alecia/cms** — Strapi CE 4.26 (Slim Fork) (~5-8min build)
- ⏳ **alecia/flows** — Activepieces 0.42 (Slim Fork) (~8-12min build)
- ⏳ **alecia/sign** — DocuSeal (AGPL, branding Alecia) (~3-5min build)

#### Services FOSS As-Is (8)
- **plausible/analytics** — Web analytics
- **miniflux/miniflux** — RSS feed aggregator
- **searxng/searxng** — Moteur de recherche privé
- **vaultwarden/server** — Gestionnaire de mots de passe
- **frooodle/s-pdf** — Stirling-PDF (outils PDF)
- **gotenberg/gotenberg** — API conversion PDF
- **clickhouse/clickhouse-server** — Base de données analytics
- **postgres:16-alpine** — Base de données principale

#### Infrastructure (3)
- **redis:7-alpine** — Cache et sessions
- **minio/minio** — Stockage S3-compatible
- **caddy:2-alpine** — Reverse proxy + SSL auto

---

## 📋 Prérequis

### Sur le VPS (51.255.194.94)

```bash
# Vérifier que le VPS est prêt
ssh ubuntu@51.255.194.94
docker --version  # Docker 27.0+
docker compose version  # Compose v5.0.2+
cd ~/alecia/alepanel
```

### DNS Configuré

Vérifier que ces enregistrements DNS pointent vers `51.255.194.94` :

```
A    alecia.markets              → 51.255.194.94
A    *.alecia.markets            → 51.255.194.94
```

Test :
```bash
dig alecia.markets +short
dig app.alecia.markets +short
dig colab.alecia.markets +short
```

### Fichiers Requis

Sur le VPS, vérifier la présence de :
- ✅ `docker-compose.production.yml`
- ✅ `infrastructure/caddy/Caddyfile.production`
- ✅ Images Docker : `alecia/website`, `alecia/colab`

---

## 🚀 Déploiement Automatique

### Option A : Script Tout-en-Un (Recommandé)

1. **Copier les scripts sur le VPS**

```bash
# Depuis votre machine locale
scp /tmp/deploy-full-suite.sh ubuntu@51.255.194.94:~/alecia/alepanel/
scp /tmp/test-inter-service-communication.sh ubuntu@51.255.194.94:~/alecia/alepanel/
scp /Users/utilisateur/Desktop/alepanel/infrastructure/caddy/Caddyfile.production ubuntu@51.255.194.94:~/alecia/alepanel/infrastructure/caddy/
```

2. **Lancer le déploiement complet**

```bash
# Se connecter au VPS
ssh ubuntu@51.255.194.94

# Aller dans le répertoire
cd ~/alecia/alepanel

# Exécuter le script
./deploy-full-suite.sh
```

Le script va automatiquement :
- ✅ Builder les 4 images manquantes (~20min)
- ✅ Générer tous les secrets (64 variables)
- ✅ Créer le fichier `.env` complet
- ✅ Créer les buckets S3 Minio
- ✅ Déployer tous les 20 services
- ✅ Vérifier la santé de chaque service
- ✅ Afficher les credentials d'admin

**Durée totale estimée : 25-30 minutes**

---

## 🔧 Déploiement Manuel (Étape par Étape)

### Étape 1 : Build des Images Docker

```bash
cd ~/alecia/alepanel

# 1. Hocuspocus (~2min)
docker build -t alecia/hocuspocus:latest services/hocuspocus/

# 2. Strapi CMS (~5-8min)
docker build -t alecia/cms:latest services/cms/

# 3. Activepieces Flows (~8-12min)
docker build -f services/flows/Dockerfile -t alecia/flows:latest services/

# 4. DocuSeal Sign (~3-5min)
docker build -t alecia/sign:latest infrastructure/repos/docuseal/

# Vérifier toutes les images
docker images | grep alecia
```

**Sortie attendue :**
```
alecia/website     latest    614MB
alecia/colab       latest    344MB
alecia/hocuspocus  latest    ~150MB
alecia/cms         latest    ~450MB
alecia/flows       latest    ~380MB
alecia/sign        latest    ~280MB
```

### Étape 2 : Générer les Secrets

```bash
# Générer tous les secrets
export POSTGRES_PASSWORD=$(openssl rand -hex 32)
export REDIS_PASSWORD=$(openssl rand -hex 32)
export MINIO_ROOT_PASSWORD=$(openssl rand -hex 32)
export BETTER_AUTH_SECRET=$(openssl rand -hex 32)
export TOKEN_ENCRYPTION_KEY=$(openssl rand -hex 32)
export STRAPI_JWT_SECRET=$(openssl rand -hex 32)
export STRAPI_ADMIN_JWT_SECRET=$(openssl rand -hex 32)
export STRAPI_APP_KEYS="$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32)"
export STRAPI_API_TOKEN_SALT=$(openssl rand -base64 32)
export AP_ENCRYPTION_KEY=$(openssl rand -hex 32)
export AP_JWT_SECRET=$(openssl rand -hex 32)
export PLAUSIBLE_SECRET_KEY_BASE=$(openssl rand -base64 64)
export MINIFLUX_ADMIN_PASSWORD=$(openssl rand -base64 16)
export DOCUSEAL_SECRET_KEY_BASE=$(openssl rand -hex 64)
export VAULTWARDEN_ADMIN_TOKEN=$(openssl rand -base64 32)
export STIRLING_PASSWORD=$(openssl rand -base64 16)
```

### Étape 3 : Créer le Fichier `.env`

```bash
cat > .env << 'ENVFILE'
# ============================================
# ALECIA SUITE - PRODUCTION CONFIGURATION
# ============================================

# INFRASTRUCTURE
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
DATABASE_URL=postgresql://alecia:${POSTGRES_PASSWORD}@postgres:5432/alecia
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
MINIO_ROOT_USER=alecia-admin
MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}

# AUTHENTICATION (BetterAuth)
BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
BETTER_AUTH_URL=https://app.alecia.markets
BETTER_AUTH_COOKIE_DOMAIN=.alecia.markets
TOKEN_ENCRYPTION_KEY=${TOKEN_ENCRYPTION_KEY}
NEXTAUTH_SECRET=${BETTER_AUTH_SECRET}

# STRAPI CMS
STRAPI_JWT_SECRET=${STRAPI_JWT_SECRET}
STRAPI_ADMIN_JWT_SECRET=${STRAPI_ADMIN_JWT_SECRET}
STRAPI_APP_KEYS=${STRAPI_APP_KEYS}
STRAPI_API_TOKEN_SALT=${STRAPI_API_TOKEN_SALT}

# ACTIVEPIECES
AP_ENCRYPTION_KEY=${AP_ENCRYPTION_KEY}
AP_JWT_SECRET=${AP_JWT_SECRET}

# PLAUSIBLE ANALYTICS
PLAUSIBLE_SECRET_KEY_BASE=${PLAUSIBLE_SECRET_KEY_BASE}

# MINIFLUX FEEDS
MINIFLUX_ADMIN_USERNAME=admin
MINIFLUX_ADMIN_PASSWORD=${MINIFLUX_ADMIN_PASSWORD}

# DOCUSEAL SIGN
DOCUSEAL_SECRET_KEY_BASE=${DOCUSEAL_SECRET_KEY_BASE}

# VAULTWARDEN
VAULTWARDEN_ADMIN_TOKEN=${VAULTWARDEN_ADMIN_TOKEN}

# STIRLING-PDF
STIRLING_USERNAME=admin
STIRLING_PASSWORD=${STIRLING_PASSWORD}

# NODE
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# DOCKER
REGISTRY=alecia
IMAGE_TAG=latest
ENVFILE

# Sauvegarder les secrets
cp .env .env.backup
chmod 600 .env.backup
```

### Étape 4 : Créer les Buckets Minio

```bash
# Démarrer Minio seul
docker compose -f docker-compose.production.yml up -d minio postgres redis
sleep 15

# Installer Minio client si nécessaire
wget -q https://dl.min.io/client/mc/release/linux-amd64/mc -O /usr/local/bin/mc
chmod +x /usr/local/bin/mc

# Configurer Minio
mc alias set alecia http://localhost:9000 alecia-admin ${MINIO_ROOT_PASSWORD}

# Créer les buckets
mc mb alecia/alecia-storage --ignore-existing
mc mb alecia/strapi-uploads --ignore-existing
mc mb alecia/alecia-sign --ignore-existing

# Politique publique pour uploads Strapi
mc anonymous set download alecia/strapi-uploads
```

### Étape 5 : Déployer la Stack Complète

```bash
# Copier le Caddyfile de production
cp infrastructure/caddy/Caddyfile.production infrastructure/caddy/Caddyfile

# Lancer tous les services
docker compose -f docker-compose.production.yml up -d

# Attendre le démarrage
sleep 60

# Vérifier l'état
docker compose -f docker-compose.production.yml ps
```

### Étape 6 : Vérifier les Services

```bash
# Tester la communication inter-services
./test-inter-service-communication.sh

# Vérifier les logs
docker compose -f docker-compose.production.yml logs -f --tail 100
```

---

## ✅ Vérifications Post-Déploiement

### 1. Vérifier les Certificats SSL

```bash
# Attendre que Caddy génère les certificats (2-5 minutes)
docker logs alecia-caddy | grep -i certificate

# Tester HTTPS
curl -I https://alecia.markets
curl -I https://app.alecia.markets
curl -I https://colab.alecia.markets
```

### 2. Tester les Endpoints de Santé

```bash
# Applications principales
curl https://alecia.markets/api/health
curl https://app.alecia.markets/api/health
curl https://colab.alecia.markets/api/health

# Services backend
curl https://cms.alecia.markets/_health
curl https://flows.alecia.markets/api/v1/health

# Analytics
curl https://analytics.alecia.markets/
```

### 3. Accéder aux Interfaces Web

Ouvrir dans votre navigateur :

#### Applications Principales
- https://alecia.markets — Site marketing
- https://app.alecia.markets — App BI/CRM
- https://colab.alecia.markets — Collaboration

#### Outils Métier M&A
- https://cms.alecia.markets — CMS Strapi (créer admin)
- https://flows.alecia.markets — Automation Activepieces (créer admin)
- https://sign.alecia.markets — Signature électronique

#### Analytics & Monitoring
- https://analytics.alecia.markets — Web Analytics Plausible

#### Outils Support
- https://feeds.alecia.markets — RSS Reader (admin / mot_de_passe_dans_.env)
- https://search.alecia.markets — Moteur de recherche
- https://vault.alecia.markets — Gestionnaire de mots de passe
- https://docs.alecia.markets — Outils PDF (admin / mot_de_passe_dans_.env)

#### Infrastructure
- https://s3.alecia.markets — Console Minio S3
- https://storage.alecia.markets — API S3 publique

### 4. Tester BetterAuth SSO

```bash
# Créer un utilisateur test
curl -X POST https://app.alecia.markets/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@alecia.fr",
    "password": "Test123456!",
    "name": "Test User"
  }'

# Se connecter
curl -X POST https://app.alecia.markets/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@alecia.fr",
    "password": "Test123456!"
  }'
```

### 5. Vérifier les Logs

```bash
# Tous les services
docker compose -f docker-compose.production.yml logs -f

# Un service spécifique
docker logs alecia-website
docker logs alecia-colab
docker logs alecia-cms
docker logs alecia-flows
docker logs alecia-caddy
```

---

## 🔐 Credentials Admin

### Strapi CMS
- URL: https://cms.alecia.markets/admin
- Action: Créer le compte admin au premier accès

### Activepieces
- URL: https://flows.alecia.markets
- Action: Créer le compte admin au premier accès

### Miniflux
- URL: https://feeds.alecia.markets
- Username: `admin`
- Password: Voir `.env` → `MINIFLUX_ADMIN_PASSWORD`

### Stirling-PDF
- URL: https://docs.alecia.markets
- Username: `admin`
- Password: Voir `.env` → `STIRLING_PASSWORD`

### Minio Console
- URL: https://s3.alecia.markets
- Username: `alecia-admin`
- Password: Voir `.env` → `MINIO_ROOT_PASSWORD`

### Vaultwarden Admin
- URL: https://vault.alecia.markets/admin
- Token: Voir `.env` → `VAULTWARDEN_ADMIN_TOKEN`

---

## 🛠️ Dépannage

### Service ne démarre pas

```bash
# Vérifier les logs
docker logs <container_name>

# Redémarrer un service
docker compose -f docker-compose.production.yml restart <service_name>

# Reconstruire et redémarrer
docker compose -f docker-compose.production.yml up -d --build <service_name>
```

### Certificats SSL non générés

```bash
# Vérifier les logs Caddy
docker logs alecia-caddy

# Vérifier la configuration DNS
dig alecia.markets +short
dig app.alecia.markets +short

# Forcer le renouvellement
docker exec alecia-caddy caddy reload --config /etc/caddy/Caddyfile
```

### Base de données non accessible

```bash
# Vérifier PostgreSQL
docker exec alecia-postgres psql -U alecia -c "SELECT 1;"

# Vérifier les databases
docker exec alecia-postgres psql -U alecia -lqt

# Créer une database manquante
docker exec alecia-postgres psql -U alecia -c "CREATE DATABASE strapi;"
```

### Communication inter-services échoue

```bash
# Vérifier le réseau Docker
docker network inspect alecia-network

# Tester la connectivité
docker exec alecia-website ping -c 3 postgres
docker exec alecia-colab ping -c 3 redis
docker exec alecia-cms nc -zv postgres 5432
```

---

## 📊 Monitoring

### Ressources VPS

```bash
# CPU, RAM, Disk
htop
df -h

# Docker stats
docker stats

# Logs en temps réel
docker compose -f docker-compose.production.yml logs -f --tail 100
```

### Plausible Analytics

Configurer le tracking sur vos sites :

```html
<!-- Dans apps/website/src/app/[locale]/layout.tsx -->
<Script
  defer
  data-domain="alecia.markets"
  src="https://analytics.alecia.markets/js/script.js"
/>
```

---

## 🔄 Mises à Jour

### Mettre à jour une image

```bash
# Reconstruire l'image
docker build -t alecia/website:latest apps/website/

# Redéployer
docker compose -f docker-compose.production.yml up -d website

# Nettoyer les anciennes images
docker image prune -f
```

### Sauvegarder les données

```bash
# Backup PostgreSQL
docker exec alecia-postgres pg_dumpall -U alecia > backup-$(date +%Y%m%d).sql

# Backup Minio
mc mirror alecia/alecia-storage ~/backups/minio/

# Backup volumes Docker
docker run --rm -v postgres_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres-$(date +%Y%m%d).tar.gz /data
```

---

## 📝 Checklist de Déploiement

- [ ] DNS configuré (A records pour alecia.markets et *.alecia.markets)
- [ ] VPS accessible via SSH (ubuntu@51.255.194.94)
- [ ] Codebase uploadé sur VPS (~/alecia/alepanel)
- [ ] Docker et Docker Compose installés
- [ ] Images Docker construites (6 images custom)
- [ ] Fichier `.env` créé avec tous les secrets
- [ ] Buckets Minio créés (3 buckets)
- [ ] Stack déployée (`docker compose up -d`)
- [ ] Tous les services running (20 containers)
- [ ] Certificats SSL générés (Let's Encrypt)
- [ ] Endpoints de santé répondent
- [ ] BetterAuth SSO fonctionnel
- [ ] Interfaces web accessibles
- [ ] Comptes admin créés (Strapi, Activepieces)
- [ ] Tests de communication inter-services ✅
- [ ] Backup des secrets (`.env.backup`)
- [ ] Documentation à jour

---

## 🎉 Déploiement Terminé !

Votre Alecia Suite est maintenant 100% opérationnelle avec :

✅ **3 applications custom** (Website, Colab, Hocuspocus)
✅ **3 services FOSS customisés** (Strapi, Activepieces, DocuSeal)
✅ **8 services FOSS as-is** (Analytics, Feeds, Search, Vault, etc.)
✅ **3 services infrastructure** (PostgreSQL, Redis, Minio)
✅ **1 reverse proxy** (Caddy avec SSL auto)
✅ **BetterAuth SSO** sur tous les services
✅ **14 subdomains** opérationnels

**Total : 20 services Docker communicants en production souveraine ! 🚀**

---

**Généré le** : 2026-02-10
**Par** : Claude Opus 4.6
**Contact** : mitch@alecia.markets
