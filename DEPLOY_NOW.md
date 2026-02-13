# 🚀 Déploiement Alecia Suite - Guide Express

**Date** : 2026-02-10
**VPS** : ubuntu@51.255.194.94
**Domaine** : alecia.markets

---

## ✅ Tout est Prêt !

Tous les fichiers ont été corrigés :
- ✅ 5 Dockerfiles (permissions + npm install)
- ✅ docker-compose.production.yml (noms d'images + pull_policy)

**Il ne reste que 3 commandes à exécuter manuellement.**

---

## 📋 ÉTAPE 1 : Créer l'Archive (sur votre Mac)

```bash
cd /Users/utilisateur/Desktop/alepanel
tar -czf /tmp/alepanel.tar.gz \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='dist' \
  --exclude='build' \
  --exclude='.git' \
  --exclude='infrastructure/repos' \
  --exclude='.turbo' \
  .
echo "✅ Archive créée : $(du -h /tmp/alepanel.tar.gz | cut -f1)"
```

---

## 📤 ÉTAPE 2 : Upload vers le VPS (sur votre Mac)

```bash
scp /tmp/alepanel.tar.gz ubuntu@51.255.194.94:~/
rm /tmp/alepanel.tar.gz
echo "✅ Upload terminé"
```

---0akNPw8LUX6RN8pC

## 🚀 ÉTAPE 3 : Déployer (sur le VPS)

**Connectez-vous au VPS** :
```bash
ssh ubuntu@51.255.194.94
```

**Puis copiez-collez ce bloc complet** :

```bash
# Navigation et extraction
cd ~
mkdir -p alecia/alepanel
cd alecia/alepanel
tar -xzf ~/alepanel.tar.gz
rm ~/alepanel.tar.gz
echo "✅ Code extrait"

# Génération du fichier .env avec secrets cryptographiques
cat > .env << 'EOF'
POSTGRES_PASSWORD=$(openssl rand -hex 32)
REDIS_PASSWORD=$(openssl rand -hex 32)
MINIO_ROOT_USER=alecia-admin
MINIO_ROOT_PASSWORD=$(openssl rand -hex 32)
BETTER_AUTH_SECRET=$(openssl rand -hex 32)
BETTER_AUTH_URL=https://alecia.markets
TOKEN_ENCRYPTION_KEY=$(openssl rand -hex 32)
STRAPI_JWT_SECRET=$(openssl rand -hex 32)
STRAPI_ADMIN_JWT_SECRET=$(openssl rand -hex 32)
STRAPI_APP_KEYS=$(openssl rand -hex 32)
STRAPI_API_TOKEN_SALT=$(openssl rand -hex 32)
AP_ENCRYPTION_KEY=$(openssl rand -hex 32)
AP_JWT_SECRET=$(openssl rand -hex 32)
PLAUSIBLE_SECRET_KEY_BASE=$(openssl rand -hex 32)
MINIFLUX_ADMIN_PASSWORD=$(openssl rand -hex 16)
DOCUSEAL_SECRET_KEY_BASE=$(openssl rand -hex 32)
VAULTWARDEN_ADMIN_TOKEN=$(openssl rand -hex 32)
STIRLING_PASSWORD=$(openssl rand -hex 16)
OVH_ENDPOINT=ovh-eu
OVH_APPLICATION_KEY=
OVH_APPLICATION_SECRET=
OVH_CONSUMER_KEY=
EOF

echo "✅ Fichier .env créé avec $(wc -l < .env) variables"

# Déploiement de la stack complète
echo ""
echo "🚀 Déploiement de la stack (20 services)..."
docker compose --env-file .env -f docker-compose.production.yml up -d

# Attente du démarrage
echo "⏳ Attente du démarrage (20 secondes)..."
sleep 20

# Statut des services
echo ""
echo "============================================================"
echo "STATUT DES SERVICES"
echo "============================================================"
docker ps --format 'table {{.Names}}\t{{.Status}}'

# Vérification des erreurs
echo ""
echo "🔍 Vérification des services en erreur..."
FAILED=$(docker ps -a --filter "status=restarting" --format "{{.Names}}" | grep alecia || echo "")

if [ -n "$FAILED" ]; then
  echo "⚠️  Services en crashloop :"
  echo "$FAILED"
  echo ""
  echo "Pour voir les logs d'un service :"
  echo "  docker logs alecia-<service> --tail 50"
else
  echo "✅ Tous les services démarrés correctement !"
fi

# Résumé
echo ""
echo "============================================================"
echo "RÉSUMÉ DU DÉPLOIEMENT"
echo "============================================================"
RUNNING=$(docker ps --format '{{.Names}}' | grep alecia | wc -l)
TOTAL=$(docker ps -a --format '{{.Names}}' | grep alecia | wc -l)
echo "Services actifs : $RUNNING / $TOTAL"

# Secrets importants
echo ""
echo "🔐 MOTS DE PASSE ADMIN (sauvegardez-les !) :"
echo "────────────────────────────────────────────"
grep -E "MINIFLUX_ADMIN_PASSWORD|STIRLING_PASSWORD" .env

echo ""
echo "📋 Pour voir TOUS les secrets :"
echo "  cat .env"
echo ""
echo "💾 Pour sauvegarder les secrets :"
echo "  cat .env > ~/secrets-alecia-$(date +%Y%m%d).txt"
echo ""
```

---

## 🌐 Services Disponibles

Une fois déployé, accédez à :

- **https://alecia.markets** - Site principal (Marketing + BI + CRM)
- **https://colab.alecia.markets** - Collaboration (TipTap + Yjs)
- **https://cms.alecia.markets** - CMS Strapi
- **https://flows.alecia.markets** - Automation Activepieces
- **https://sign.alecia.markets** - E-signature DocuSeal
- **https://analytics.alecia.markets** - Web analytics Plausible
- **https://storage.alecia.markets** - Minio S3

---

## 🔧 Commandes Utiles

### Voir le statut de tous les services
```bash
docker ps --format 'table {{.Names}}\t{{.Status}}'
```

### Voir les logs d'un service
```bash
docker logs alecia-website --tail 50 -f
docker logs alecia-caddy --tail 50 -f
```

### Redémarrer un service
```bash
docker compose --env-file .env -f docker-compose.production.yml restart website
```

### Arrêter toute la stack
```bash
docker compose --env-file .env -f docker-compose.production.yml down
```

### Redémarrer toute la stack
```bash
docker compose --env-file .env -f docker-compose.production.yml up -d
```

---

## 📊 Architecture Déployée (20 Services)

### Infrastructure (4)
- **postgres** - PostgreSQL 16 (7 bases de données)
- **redis** - Redis 7 (cache + sessions)
- **minio** - Minio S3 (object storage)
- **clickhouse** - ClickHouse (analytics OLAP)

### Applications Custom (6)
- **website** - Next.js 15 (Marketing + BI + CRM)
- **colab** - Next.js 16 (Collaboration)
- **cms** - Strapi CE (headless CMS)
- **flows** - Activepieces (automation)
- **hocuspocus** - WebSocket server (Yjs sync)
- **caddy** - Reverse proxy + SSL auto

### Services FOSS (10)
- **sign** - DocuSeal (e-signature + VDR)
- **stirling-pdf** - Stirling PDF (manipulation PDF)
- **gotenberg** - Gotenberg (conversion documents)
- **searxng** - SearXNG (métamoteur)
- **plausible** - Plausible Analytics
- **miniflux** - Miniflux (lecteur RSS)
- **vaultwarden** - Vaultwarden (mots de passe)
- **activepieces-postgres** - PostgreSQL Activepieces
- **plausible-events-db** - ClickHouse Plausible
- **feeds** - Service RSS

---

## 📚 Documentation Complète

- `docs/DEPLOYMENT_FINAL_2026-02-10.md` - Guide complet
- `docs/CORRECTIONS_DEPLOIEMENT_2026-02-10.md` - Détails des corrections

---

## 🆘 Dépannage

### Problème : Service en crashloop

```bash
# Voir les logs détaillés
docker logs alecia-<service> --tail 100

# Vérifier les variables d'environnement
docker exec alecia-<service> env | grep -i <variable>

# Redémarrer avec force recreate
docker compose --env-file .env -f docker-compose.production.yml up -d --force-recreate <service>
```

### Problème : "pull access denied"

**Solution** : Vérifier que `pull_policy: never` est bien dans docker-compose.production.yml pour les images custom :
```yaml
website:
  image: alecia/website:latest
  pull_policy: never  # ← Doit être présent
```

### Problème : Variables d'environnement vides

**Solution** : Toujours utiliser `--env-file .env` :
```bash
docker compose --env-file .env -f docker-compose.production.yml up -d
```

---

## ✅ C'est Tout !

**3 commandes à exécuter** = votre suite Alecia déployée ! 🎉

**Questions ?** Référez-vous à la documentation complète dans le dossier `docs/`.
