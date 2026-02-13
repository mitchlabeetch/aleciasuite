# 🚀 Alecia Suite — Déploiement Complet PRÊT

**Date** : 2026-02-10 15:30 UTC
**Status** : ✅ PRÊT POUR DÉPLOIEMENT FINAL
**Domaine** : alecia.markets (DNS configuré)
**VPS** : 51.255.194.94 (OVH Cloud, Ubuntu 24.04)

---

## ✅ CE QUI EST FAIT

### Images Docker (2/6 construites)
- ✅ **alecia/website:latest** (614MB) — Next.js 15.3.6 + Turbo
- ✅ **alecia/colab:latest** (344MB) — Next.js 16.1.4 + Turbopack
- ⏳ **alecia/hocuspocus** (à builder, ~2min)
- ⏳ **alecia/cms** (à builder, ~5-8min)
- ⏳ **alecia/flows** (à builder, ~8-12min)
- ⏳ **alecia/sign** (à builder, ~3-5min)

### Configuration Prête
- ✅ `docker-compose.production.yml` (20 services)
- ✅ `infrastructure/caddy/Caddyfile.production` (14 subdomains + SSO)
- ✅ `deploy-full-suite.sh` (script automatique complet)
- ✅ `test-inter-service-communication.sh` (tests de communication)
- ✅ `DEPLOYMENT_GUIDE_FULL_SUITE.md` (documentation complète)

### Infrastructure VPS
- ✅ Docker 27.0 + Compose v5.0.2 installés
- ✅ Coolify 4.0.0-beta.463 (optionnel)
- ✅ Firewall configuré (ports 80, 443, 22)
- ✅ Codebase uploadé (~/alecia/alepanel)
- ✅ DNS configuré (alecia.markets + wildcards)

---

## 🎯 DÉPLOIEMENT EN 2 COMMANDES

### Commande 1 : Upload des Fichiers

```bash
/tmp/upload-and-deploy.sh
```

Ceci va uploader :
- Scripts de déploiement
- Caddyfile de production
- docker-compose.production.yml
- Guide de déploiement

**Durée : 30 secondes**

### Commande 2 : Déploiement Complet

```bash
ssh ubuntu@51.255.194.94
cd ~/alecia/alepanel
./deploy-full-suite.sh
```

Ce script va AUTOMATIQUEMENT :
1. ✅ Builder les 4 images Docker manquantes (~20min)
2. ✅ Générer 64 secrets de production
3. ✅ Créer le fichier `.env` complet
4. ✅ Créer 3 buckets S3 Minio
5. ✅ Déployer les 20 services
6. ✅ Vérifier la santé de chaque service
7. ✅ Afficher les credentials admin

**Durée totale : 25-30 minutes**

---

## 📊 STACK COMPLÈTE (20 Services)

### Applications Principales (3)
1. **alecia.markets** → alecia/website:latest (Site + App BI/CRM)
2. **colab.alecia.markets** → alecia/colab:latest (Collaboration)
3. **WebSocket interne** → alecia/hocuspocus (Yjs real-time)

### Services FOSS Customisés (3)
4. **cms.alecia.markets** → alecia/cms:latest (Strapi CE + SSO)
5. **flows.alecia.markets** → alecia/flows:latest (Activepieces + 18 custom pieces)
6. **sign.alecia.markets** → alecia/sign:latest (DocuSeal + branding Alecia)

### Analytics & Monitoring (2)
7. **analytics.alecia.markets** → plausible/analytics (Web analytics)
8. **ClickHouse** → clickhouse/clickhouse-server (Database analytics)

### Outils Support (5)
9. **feeds.alecia.markets** → miniflux/miniflux (RSS aggregator)
10. **search.alecia.markets** → searxng/searxng (Moteur recherche privé)
11. **vault.alecia.markets** → vaultwarden/server (Password manager)
12. **docs.alecia.markets** → frooodle/s-pdf (Stirling-PDF tools)
13. **pdf.alecia.markets** → gotenberg/gotenberg (API conversion PDF)

### Infrastructure (4)
14. **PostgreSQL 16** → postgres:16-alpine (7 databases)
15. **Redis 7** → redis:7-alpine (Cache + sessions)
16. **Minio** → minio/minio (S3-compatible storage)
17. **Caddy** → caddy:2-alpine (Reverse proxy + SSL auto)

### Stockage S3 (2 endpoints)
18. **s3.alecia.markets** → Minio Console (admin UI)
19. **storage.alecia.markets** → Minio API (S3 access)

### Health Check (1)
20. **health.alecia.markets** → Endpoint de monitoring

---

## 🔐 Sécurité & Communication

### BetterAuth SSO
- ✅ Cookie domain : `.alecia.markets`
- ✅ Forward_auth Caddy sur tous les services protégés
- ✅ Auto-provisioning utilisateurs

### Services Protégés par SSO
- cms.alecia.markets (Strapi)
- flows.alecia.markets (Activepieces)
- sign.alecia.markets (DocuSeal)
- analytics.alecia.markets (Plausible admin)
- feeds.alecia.markets (Miniflux)
- search.alecia.markets (SearXNG)
- vault.alecia.markets (Vaultwarden)
- docs.alecia.markets (Stirling-PDF)
- s3.alecia.markets (Minio console)

### Communication Inter-Services
- ✅ Réseau Docker interne `alecia-network`
- ✅ Service discovery via noms de containers
- ✅ Health checks sur tous les services critiques
- ✅ PostgreSQL partagé (7 databases isolées)
- ✅ Redis partagé (cache + sessions)
- ✅ Minio partagé (3 buckets : storage, strapi, sign)

---

## 📋 APRÈS LE DÉPLOIEMENT

### Vérifications Automatiques
Le script `deploy-full-suite.sh` va afficher :
- ✅ Status de chaque service (RUNNING / FAILED)
- ✅ Logs des services qui ont échoué
- ✅ Credentials admin pour tous les services
- ✅ URLs d'accès à toutes les interfaces

### Vérifications Manuelles

#### 1. Tester les Certificats SSL (2-5 min après déploiement)
```bash
docker logs alecia-caddy | grep -i certificate
curl -I https://alecia.markets
```

#### 2. Tester les Endpoints
```bash
curl https://alecia.markets/api/health
curl https://app.alecia.markets/api/health
curl https://colab.alecia.markets/api/health
```

#### 3. Accéder aux Interfaces Web
Dans votre navigateur :
- https://alecia.markets
- https://app.alecia.markets
- https://colab.alecia.markets
- https://cms.alecia.markets/admin (créer compte admin)
- https://flows.alecia.markets (créer compte admin)

#### 4. Tester la Communication Inter-Services
```bash
./test-inter-service-communication.sh
```

Ce script va tester :
- ✅ Connectivité réseau Docker
- ✅ PostgreSQL access depuis tous les services
- ✅ Redis access depuis tous les services
- ✅ Minio S3 access depuis tous les services
- ✅ Hocuspocus WebSocket depuis Colab
- ✅ HTTP endpoints internes
- ✅ Caddy → tous les backends
- ✅ HTTPS externe via Caddy
- ✅ BetterAuth SSO flow
- ✅ Databases PostgreSQL
- ✅ Buckets S3 Minio

**Total : ~50 tests automatiques**

---

## 🛠️ COMMANDES UTILES

### Monitoring en Temps Réel
```bash
# Tous les services
docker compose -f docker-compose.production.yml logs -f

# Un service spécifique
docker logs alecia-website -f
docker logs alecia-colab -f
docker logs alecia-caddy -f

# Ressources système
docker stats
```

### Redémarrer un Service
```bash
docker compose -f docker-compose.production.yml restart <service>

# Exemples
docker compose -f docker-compose.production.yml restart next-marketing
docker compose -f docker-compose.production.yml restart caddy
```

### Reconstruire une Image
```bash
# Rebuild + redeploy
docker build -t alecia/website:latest apps/website/
docker compose -f docker-compose.production.yml up -d next-marketing
```

### Backup
```bash
# PostgreSQL
docker exec alecia-postgres pg_dumpall -U alecia > backup-$(date +%Y%m%d).sql

# Volumes Docker
docker run --rm \
  -v postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres-$(date +%Y%m%d).tar.gz /data
```

---

## 📞 SUPPORT & DÉPANNAGE

### Logs Détaillés
Tous les services loggent en JSON dans `/var/log/caddy/` :
- `alecia-markets.log`
- `app-alecia-markets.log`
- `colab-alecia-markets.log`
- `cms-alecia-markets.log`
- etc.

### Problèmes Courants

#### Service ne démarre pas
```bash
docker logs <container_name>
docker compose -f docker-compose.production.yml restart <service>
```

#### SSL non généré
```bash
# Vérifier DNS
dig alecia.markets +short

# Recharger Caddy
docker exec alecia-caddy caddy reload --config /etc/caddy/Caddyfile
```

#### Communication inter-services échoue
```bash
# Vérifier le réseau
docker network inspect alecia-network

# Tester ping
docker exec alecia-website ping -c 3 postgres
```

---

## 🎉 RÉSUMÉ

Vous êtes à **1 commande** du déploiement complet de votre Alecia Suite 100% souveraine !

### Ce qui va se passer

1. **Upload** : `./upload-and-deploy.sh` (30s)
2. **Build** : 4 images Docker (20min)
3. **Config** : 64 secrets générés automatiquement
4. **Deploy** : 20 services démarrés
5. **Test** : 50 tests de communication
6. **SSL** : Certificats Let's Encrypt auto
7. **Result** : Suite complète opérationnelle ! 🚀

### Ce qui sera accessible

- ✅ **14 subdomains** sur alecia.markets
- ✅ **20 services** communicants
- ✅ **BetterAuth SSO** sur toute la suite
- ✅ **PostgreSQL** (7 databases)
- ✅ **Redis** (cache distribué)
- ✅ **Minio S3** (3 buckets)
- ✅ **HTTPS** automatique partout
- ✅ **100% self-hosted** sur votre VPS

---

## 🚀 LANÇONS !

### Commande Unique

```bash
/tmp/upload-and-deploy.sh && \
echo "" && \
echo "✅ Upload terminé !" && \
echo "" && \
echo "Maintenant connectez-vous au VPS :" && \
echo "  ssh ubuntu@51.255.194.94" && \
echo "  cd ~/alecia/alepanel" && \
echo "  ./deploy-full-suite.sh"
```

**Ensuite patientez 25-30 minutes et profitez de votre suite M&A complète ! 🎯**

---

**Généré le** : 2026-02-10 15:30 UTC
**Par** : Claude Opus 4.6
**Session** : 49f5e98d-2fcc-4a10-a738-42d22ce113b9
**Contact** : mitch@alecia.markets
