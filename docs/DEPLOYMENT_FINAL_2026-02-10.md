# Déploiement Final - Alecia Suite sur VPS OVH
**Date**: 2026-02-10
**VPS**: ubuntu@51.255.194.94
**Domaine**: alecia.markets

## Statut du Déploiement

### Phase 1 : Préparation (✅ TERMINÉE)
- [x] Tous les Dockerfiles corrigés en local
- [x] Scripts de déploiement créés
- [x] Scripts de monitoring créés
- [x] Archive du code en cours de création

### Phase 2 : Upload & Build (🔄 EN COURS)
- [x] Création de l'archive tar.gz (en cours, ~60s)
- [ ] Upload de l'archive vers le VPS via SCP
- [ ] Extraction de l'archive sur le VPS
- [ ] Build des 5 images Docker personnalisées (~15-20 min)
  - [ ] Website (Next.js 15) - ~5-8 min
  - [ ] Colab (Next.js 16) - ~5-8 min
  - [ ] Hocuspocus (WebSocket) - ~30 sec
  - [ ] CMS (Strapi CE) - ~3-5 min
  - [ ] Flows (Activepieces) - ~8-12 min

### Phase 3 : Déploiement (⏳ EN ATTENTE)
- [ ] Arrêt des conteneurs existants
- [ ] Démarrage de la stack complète (20 services)
- [ ] Vérification du statut des services
- [ ] Tests de santé des endpoints

## Corrections Appliquées

### 1. Hocuspocus Dockerfile
**Problème** : `npm ci` nécessite package-lock.json qui n'existe pas
**Solution** : Changé en `npm install` (ligne 4)

### 2. CMS Dockerfile
**Problème** : COPY de répertoires inexistants (dist, public)
**Solution** : `COPY --from=builder --chown=strapi:nodejs /app ./` (ligne 27)

### 3. Website Dockerfile
**Problème** : EACCES permission denied sur public/assets/
**Solution** : Ajout de `--chown=nextjs:nodejs` sur lignes 44-46

### 4. Colab Dockerfile
**Problème** : EACCES permission denied sur public/
**Solution** : Ajout de `--chown=nextjs:nodejs` sur lignes 44-46

## Scripts Créés

### Déploiement
- `scripts/deploy-complete.sh` - Déploiement complet automatique
- `scripts/rebuild-and-deploy.sh` - Rebuild + redéploiement (exécuté sur VPS)
- `scripts/deploy-to-vps.sh` - Version rsync (nécessite clé SSH)

### Monitoring
- `scripts/monitor-vps.sh` - Monitoring rapide du statut des services

## Architecture Déployée (20 services)

### Infrastructure (4 services)
1. **postgres** - PostgreSQL 16 (7 bases de données)
2. **redis** - Redis 7 (cache et sessions)
3. **minio** - Minio S3-compatible (object storage)
4. **clickhouse** - ClickHouse (analytics OLAP)

### Applications Personnalisées (5 services)
5. **website** - Next.js 15 (Marketing + BI + CRM)
6. **colab** - Next.js 16 (Collaboration TipTap + Yjs)
7. **hocuspocus** - WebSocket server (Yjs sync)
8. **cms** - Strapi CE 4.25 (headless CMS)
9. **flows** - Activepieces 0.42 (workflow automation)

### Services FOSS (11 services)
10. **sign** - DocuSeal (e-signature + VDR)
11. **stirling-pdf** - Stirling PDF (manipulation PDF)
12. **gotenberg** - Gotenberg (conversion documents)
13. **searxng** - SearXNG (métamoteur de recherche)
14. **plausible** - Plausible Analytics (web analytics)
15. **plausible-events-db** - ClickHouse pour Plausible
16. **miniflux** - Miniflux (lecteur RSS)
17. **vaultwarden** - Vaultwarden (gestionnaire de mots de passe)
18. **activepieces-postgres** - PostgreSQL pour Activepieces
19. **caddy** - Caddy reverse proxy (HTTPS automatique)
20. **feeds** - Service de syndication RSS

## Variables d'Environnement (.env)

### Bases de données
- `POSTGRES_PASSWORD` - 64 caractères cryptographiques
- `REDIS_PASSWORD` - 64 caractères cryptographiques

### BetterAuth SSO
- `BETTER_AUTH_SECRET` - 64 caractères
- `BETTER_AUTH_URL` - https://alecia.markets

### Strapi CMS
- `STRAPI_ADMIN_JWT_SECRET` - 64 caractères
- `STRAPI_JWT_SECRET` - 64 caractères
- `STRAPI_APP_KEYS` - 64 caractères
- `STRAPI_API_TOKEN_SALT` - 64 caractères

### Activepieces
- `AP_ENCRYPTION_KEY` - 64 caractères
- `AP_JWT_SECRET` - 64 caractères

### Minio
- `MINIO_ROOT_USER` - alecia-admin
- `MINIO_ROOT_PASSWORD` - 64 caractères

## Domaines Configurés

### Production (alecia.markets)
- alecia.markets → Website (port 3000)
- colab.alecia.markets → Colab (port 3001)
- cms.alecia.markets → Strapi CMS (port 1337)
- flows.alecia.markets → Activepieces (port 8080)
- sign.alecia.markets → DocuSeal (port 3000)
- analytics.alecia.markets → Plausible (port 8000)
- storage.alecia.markets → Minio (port 9000)
- s3.alecia.markets → Minio S3 API (port 9000)
- feeds.alecia.markets → Miniflux (port 8080)
- search.alecia.markets → SearXNG (port 8080)
- docs.alecia.markets → Stirling PDF (port 8080)
- vault.alecia.markets → Vaultwarden (port 80)

## Prochaines Étapes (Après Déploiement)

### Tests de Santé
```bash
# Vérifier tous les services
./scripts/monitor-vps.sh

# Tester les endpoints principaux
curl -I https://alecia.markets
curl -I https://colab.alecia.markets
curl -I https://cms.alecia.markets
curl -I https://flows.alecia.markets
```

### Configuration Minio
```bash
# Créer les buckets S3
mc alias set alecia https://s3.alecia.markets alecia-admin <password>
mc mb alecia/alecia-storage
mc mb alecia/strapi-uploads
mc mb alecia/alecia-sign
mc policy set download alecia/alecia-storage
```

### Configuration Strapi
1. Accéder à https://cms.alecia.markets
2. Créer le premier admin
3. Configurer le plugin Upload pour Minio
4. Importer les content types

### Configuration Activepieces
1. Accéder à https://flows.alecia.markets
2. SSO automatique via BetterAuth
3. Importer les 9 custom pieces M&A
4. Activer les 5 workflow templates

## Timeline Estimée

- **Maintenant** : Création archive + upload (2-3 min)
- **+5 min** : Build Website + Colab (10-15 min)
- **+20 min** : Build Hocuspocus + CMS + Flows (5-10 min)
- **+30 min** : Déploiement final + tests (5 min)

**Total estimé** : 30-40 minutes pour un déploiement complet

## Commandes Utiles

### Monitoring
```bash
# Statut global
ssh ubuntu@51.255.194.94 'cd ~/alecia/alepanel && docker compose --env-file .env -f docker-compose.production.yml ps'

# Logs d'un service
ssh ubuntu@51.255.194.94 'cd ~/alecia/alepanel && docker logs alecia-website --tail 50 -f'

# Ressources système
ssh ubuntu@51.255.194.94 'top -bn1 | head -20'
ssh ubuntu@51.255.194.94 'df -h'
```

### Redémarrage d'un service
```bash
ssh ubuntu@51.255.194.94 'cd ~/alecia/alepanel && docker compose --env-file .env -f docker-compose.production.yml restart website'
```

### Rebuild complet
```bash
./scripts/deploy-complete.sh
```

## Notes Techniques

### Permissions Docker
- Toutes les images Next.js utilisent `user nextjs` (UID 1001)
- Toutes les copies de fichiers utilisent `--chown=nextjs:nodejs`
- Strapi utilise `user strapi` (UID 1001) avec `--chown=strapi:nodejs`

### Monorepo Turborepo
- Les builds utilisent `pnpm turbo build --filter=<app>`
- Les dépendances inter-packages sont gérées par Turbo
- Les node_modules sont installés via `pnpm install --frozen-lockfile`

### Docker Multi-stage
- Stage `deps` : Installation des dépendances
- Stage `builder` : Build de l'application
- Stage `runner` : Image de production (standalone Next.js)

### Réseau Docker
- Réseau `alecia-network` (bridge)
- Communication inter-conteneurs via noms de services
- Exposition externe via Caddy reverse proxy

## Troubleshooting

### Service en crashloop
```bash
# Voir les logs
docker logs alecia-<service> --tail 100

# Vérifier les variables d'env
docker exec alecia-<service> env | grep -i <var>

# Redémarrer avec force recreate
docker compose --env-file .env -f docker-compose.production.yml up -d --force-recreate <service>
```

### Rebuild d'une seule image
```bash
cd ~/alecia/alepanel
docker build -f apps/website/Dockerfile -t alecia/website:latest .
docker compose --env-file .env -f docker-compose.production.yml up -d --force-recreate website
```

### Nettoyer les images
```bash
docker image prune -a -f
docker system prune -a -f --volumes
```
