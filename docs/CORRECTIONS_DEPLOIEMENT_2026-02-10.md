# Corrections Appliquées au Déploiement - 2026-02-10

## Problèmes Identifiés et Résolus

### 1. Noms d'Images Docker Incorrects ❌ → ✅

**Problème** :
- `docker-compose.production.yml` utilisait `${REGISTRY:-ghcr.io/alecia}/alecia-website`
- Quand REGISTRY n'est pas défini, ça devenait `alecia/alecia-website` (préfixe double)
- Docker Compose essayait de pull depuis Docker Hub au lieu d'utiliser les images locales

**Solution** :
```yaml
# AVANT
image: ${REGISTRY:-ghcr.io/alecia}/alecia-website:${IMAGE_TAG:-latest}

# APRÈS
image: alecia/website:latest
pull_policy: never  # Force utilisation des images locales
```

**Fichiers modifiés** :
- `docker-compose.production.yml` (5 services : website, colab, cms, flows, caddy)

### 2. Variables d'Environnement Non Chargées ❌ → ✅

**Problème** :
- Le fichier `.env` existait mais n'était pas utilisé par docker compose
- Résultat : "WARN The 'POSTGRES_PASSWORD' variable is not set"
- Tous les services utilisaient des chaînes vides pour les secrets

**Solution** :
```bash
# AVANT
docker compose -f docker-compose.production.yml up -d

# APRÈS
docker compose --env-file .env -f docker-compose.production.yml up -d
```

**Impact** :
- Tous les 28 secrets (PostgreSQL, Redis, Minio, BetterAuth, Strapi, etc.) maintenant correctement définis

### 3. Génération Automatique des Secrets ✅

**Amélioration** :
- Ajout d'un script qui génère automatiquement tous les secrets cryptographiques
- Utilise `openssl rand -hex 32` pour des secrets de 64 caractères
- Génération directe sur le VPS pendant le déploiement

**Secrets générés** :
1. POSTGRES_PASSWORD (64 chars)
2. REDIS_PASSWORD (64 chars)
3. MINIO_ROOT_USER + MINIO_ROOT_PASSWORD
4. BETTER_AUTH_SECRET + TOKEN_ENCRYPTION_KEY
5. STRAPI_JWT_SECRET + STRAPI_ADMIN_JWT_SECRET + STRAPI_APP_KEYS + STRAPI_API_TOKEN_SALT
6. AP_ENCRYPTION_KEY + AP_JWT_SECRET (Activepieces)
7. PLAUSIBLE_SECRET_KEY_BASE
8. MINIFLUX_ADMIN_PASSWORD
9. DOCUSEAL_SECRET_KEY_BASE
10. VAULTWARDEN_ADMIN_TOKEN
11. STIRLING_PASSWORD

## Scripts Créés

### 1. deploy-final.exp (Script Principal)
- Upload du code via SCP
- Extraction sur le VPS
- Génération automatique du `.env` avec secrets
- Déploiement avec `--env-file .env`
- Vérification du statut final

### 2. deploy-complete.sh
- Version bash avec confirmation automatique
- Création d'archive tar.gz (excluant node_modules, .next, etc.)
- Upload et exécution du rebuild sur VPS

### 3. rebuild-and-deploy.sh
- Build des 5 images Docker personnalisées
- Redémarrage de la stack
- Détection des services en crashloop
- Affichage des logs d'erreur

### 4. monitor-vps.sh
- Monitoring rapide du statut des services
- Ressources système (CPU, mémoire, disque)
- Derniers logs de chaque service

### 5. fix-docker-compose-vps.sh
- Correction des noms d'images en live sur le VPS
- Ajout de `pull_policy: never`
- Vérification du .env

## Timeline du Déploiement Final

1. **Archive** (~60s)
   - Compression du code (exclusions : node_modules, .next, dist, build, .git, infrastructure/repos)
   - Taille : ~160MB

2. **Upload** (~2-3 min)
   - SCP vers ubuntu@51.255.194.94:~/

3. **Extraction** (~10s)
   - Décompression sur le VPS
   - Backup de l'ancien code si existant

4. **Génération .env** (~5s)
   - 28 variables avec secrets cryptographiques
   - Génération via openssl directement sur VPS

5. **Déploiement** (~2-5 min)
   - `docker compose --env-file .env up -d`
   - Pull des images FOSS depuis Docker Hub
   - Démarrage des 20 services

**Durée totale estimée** : 5-10 minutes

## Différences avec les Tentatives Précédentes

| Aspect | Tentative Précédente | Déploiement Final |
|--------|---------------------|-------------------|
| Noms d'images | `alecia/alecia-website` | `alecia/website` |
| Pull policy | Essaie de pull depuis registry | `never` (force local) |
| .env | Fichier présent mais non utilisé | `--env-file .env` explicite |
| Secrets | Valeurs vides (circular ref) | Générés cryptographiquement |
| Rebuild | Images pas reconstruites | N/A (utilise images existantes) |

## Services Déployés (20 au total)

### Infrastructure (4)
- postgres (PostgreSQL 16)
- redis (Redis 7)
- minio (Minio S3)
- clickhouse (ClickHouse OLAP)

### Apps Personnalisées (6) - Images Locales
- website (alecia/website:latest)
- colab (alecia/colab:latest)
- cms (alecia/cms:latest)
- flows (alecia/flows:latest)
- hocuspocus (alecia/hocuspocus:latest)
- caddy (alecia/caddy:latest)

### FOSS (10) - Images Docker Hub
- docuseal/docuseal:latest
- frooodle/s-pdf:latest
- gotenberg/gotenberg:latest
- searxng/searxng:latest
- plausible/analytics:latest
- miniflux/miniflux:latest
- vaultwarden/server:latest
- postgres:16-alpine (pour Activepieces)
- clickhouse/clickhouse-server:latest

## Vérification Post-Déploiement

### 1. Vérifier les Conteneurs
```bash
ssh ubuntu@51.255.194.94 'cd ~/alecia/alepanel && docker ps --format "table {{.Names}}\t{{.Status}}"'
```

### 2. Récupérer les Secrets
```bash
ssh ubuntu@51.255.194.94 'cat ~/alecia/alepanel/.env'
```

### 3. Tester les Endpoints
```bash
curl -I https://alecia.markets
curl -I https://colab.alecia.markets
curl -I https://cms.alecia.markets
curl -I https://flows.alecia.markets
curl -I https://sign.alecia.markets
```

### 4. Vérifier les Logs
```bash
ssh ubuntu@51.255.194.94 'cd ~/alecia/alepanel && docker logs alecia-website --tail 20'
ssh ubuntu@51.255.194.94 'cd ~/alecia/alepanel && docker logs alecia-cms --tail 20'
ssh ubuntu@51.255.194.94 'cd ~/alecia/alepanel && docker logs alecia-caddy --tail 20'
```

## Prochaines Étapes

1. ✅ Vérifier que tous les services sont UP
2. ⏳ Tester l'accès HTTPS via Caddy
3. ⏳ Configurer Minio (créer buckets S3)
4. ⏳ Configurer Strapi (premier admin)
5. ⏳ Configurer Activepieces (importer custom pieces)
6. ⏳ Tester le SSO BetterAuth entre services

## Notes Techniques

### Exclusions de l'Archive
- node_modules (réinstallés lors du build Docker)
- .next (généré lors du build Next.js)
- dist (généré lors du build TypeScript)
- build (généré lors du build)
- .git (historique non nécessaire en prod)
- infrastructure/repos (637MB de repos FOSS)
- .turbo (cache local Turborepo)
- scripts/migration/data/convex-export (snapshots Convex)

### Pull Policy
- `never` : Force Docker à utiliser les images locales
- Empêche les tentatives de pull depuis Docker Hub/GHCR
- Essentiel pour les images custom buildées localement

### Docker Compose v2
- Syntaxe : `docker compose` (sans tiret)
- Flag `--env-file` : Explicite le fichier .env à utiliser
- Flag `-f` : Spécifie le fichier docker-compose

### Expect Scripts
- Timeout : 7200s (2h) pour les opérations longues
- Gestion interactive du mot de passe SSH
- Output en temps réel avec send_user
- Cleanup automatique (suppression archive locale)
