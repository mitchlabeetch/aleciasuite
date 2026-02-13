# 🔒 Correction du Problème SSL - HSTS

## 🔍 Diagnostic

**DNS** : ✅ OK - alecia.markets → 51.255.194.94
**Ports** : ✅ OK - 80 et 443 ouverts
**SSL** : ❌ PROBLÈME - Pas de certificat valide

## ⚠️ Pourquoi Cette Erreur ?

L'erreur HSTS signifie :
1. Le domaine alecia.markets a été visité avec HTTPS dans le passé (probablement sur Vercel)
2. Le navigateur a mémorisé que ce domaine EXIGE HTTPS (HSTS = HTTP Strict Transport Security)
3. Maintenant, le serveur n'a pas de certificat SSL valide
4. Firefox refuse de se connecter pour des raisons de sécurité

## 🚀 Solution : Générer les Certificats SSL

### Étape 1 : Se Connecter au VPS

```bash
ssh ubuntu@51.255.194.94
cd ~/alecia/alepanel
```

### Étape 2 : Vérifier l'État de Caddy

```bash
# Statut du conteneur Caddy
docker ps | grep caddy

# Logs de Caddy (pour voir les erreurs)
docker logs alecia-caddy --tail 50
```

**Résultats possibles** :

#### Cas A : Caddy n'est PAS démarré
```bash
# Démarrer Caddy
docker compose --env-file .env -f docker-compose.production.yml up -d caddy

# Vérifier les logs
docker logs alecia-caddy -f
```

#### Cas B : Caddy est démarré mais pas de certificat
```bash
# Redémarrer Caddy pour forcer la génération des certificats
docker compose --env-file .env -f docker-compose.production.yml restart caddy

# Suivre les logs en temps réel
docker logs alecia-caddy -f
```

Vous devriez voir dans les logs :
```
[INFO] obtaining certificate for alecia.markets
[INFO] successfully obtained certificate for alecia.markets
```

#### Cas C : Erreur dans les logs Caddy

Si vous voyez des erreurs comme :
- `failed to get certificate` → Problème avec Let's Encrypt
- `port already in use` → Un autre service utilise les ports 80/443
- `no such host` → Problème DNS (mais peu probable vu le diagnostic)

**Solution pour "port already in use"** :
```bash
# Vérifier ce qui écoute sur les ports 80 et 443
sudo netstat -tlnp | grep -E ':(80|443)'

# Si c'est un autre service (nginx, apache), arrêtez-le
sudo systemctl stop nginx
sudo systemctl stop apache2

# Puis redémarrez Caddy
docker compose --env-file .env -f docker-compose.production.yml restart caddy
```

### Étape 3 : Vérifier la Configuration Caddy

```bash
# Voir le Caddyfile
docker exec alecia-caddy cat /etc/caddy/Caddyfile
```

Le Caddyfile devrait contenir :

```caddy
{
    email admin@alecia.fr
    auto_https on
}

alecia.markets {
    reverse_proxy alecia-website:3000
}

www.alecia.markets {
    redir https://alecia.markets{uri}
}

colab.alecia.markets {
    reverse_proxy alecia-colab:3001
}

cms.alecia.markets {
    reverse_proxy alecia-cms:1337
}

flows.alecia.markets {
    reverse_proxy alecia-flows:8080
}

sign.alecia.markets {
    reverse_proxy alecia-sign:3000
}
```

**Si le Caddyfile est vide ou incorrect**, il faut le corriger :

```bash
# Vérifier que le fichier existe sur le VPS
cat infrastructure/caddy/Caddyfile
```

Si le fichier est correct en local mais pas dans le conteneur, redéployer Caddy :
```bash
docker compose --env-file .env -f docker-compose.production.yml up -d --force-recreate caddy
```

### Étape 4 : Test du Certificat SSL

Attendez 30 secondes, puis testez :

```bash
# Test depuis le VPS
curl -I https://alecia.markets

# Devrait retourner "HTTP/2 200" ou "HTTP/1.1 200"
```

Depuis votre Mac :
```bash
curl -I https://alecia.markets
```

### Étape 5 : Nettoyer le Cache HSTS du Navigateur

Une fois que le certificat SSL est généré, vous devez effacer le cache HSTS de Firefox :

**Firefox** :
1. Ouvrir une nouvelle fenêtre de navigation privée (Cmd+Shift+P)
2. Aller sur https://alecia.markets
3. OU effacer complètement le cache HSTS :
   - Taper `about:config` dans la barre d'adresse
   - Chercher `network.stricttransportsecurity`
   - Cliquer droit → Réinitialiser sur `network.stricttransportsecurity.preloadlist`

**Chrome/Brave** :
1. Aller sur `chrome://net-internals/#hsts`
2. Dans "Delete domain security policies", entrer `alecia.markets`
3. Cliquer "Delete"

**Safari** :
1. Développement → Vider les caches
2. Ou fermer Safari et supprimer :
   ```bash
   rm ~/Library/Cookies/HSTS.plist
   ```

## 🔧 Solution Alternative : Désactiver HSTS Temporairement

Si vous voulez accéder au site SANS HTTPS temporairement (pour debug), vous pouvez :

**Modifier le Caddyfile** pour désactiver HTTPS :

```bash
# Sur le VPS
cd ~/alecia/alepanel
cat > infrastructure/caddy/Caddyfile << 'EOF'
{
    auto_https off
}

:80 {
    reverse_proxy alecia-website:3000
}
EOF

# Redémarrer Caddy
docker compose --env-file .env -f docker-compose.production.yml up -d --force-recreate caddy
```

Puis accédez à : **http://alecia.markets** (HTTP, pas HTTPS)

⚠️ **ATTENTION** : Ceci est TEMPORAIRE pour le debug. En production, vous DEVEZ avoir HTTPS.

## 📊 Vérification Complète

Une fois que tout fonctionne, vérifiez que tous les sous-domaines ont des certificats :

```bash
# Tester tous les domaines
curl -I https://alecia.markets
curl -I https://colab.alecia.markets
curl -I https://cms.alecia.markets
curl -I https://flows.alecia.markets
curl -I https://sign.alecia.markets
```

Tous devraient retourner `HTTP/2 200` ou `HTTP/1.1 200`.

## 🎯 Résumé des Étapes

1. ✅ SSH vers le VPS
2. ✅ Vérifier que Caddy tourne : `docker ps | grep caddy`
3. ✅ Voir les logs : `docker logs alecia-caddy --tail 50`
4. ✅ Redémarrer Caddy : `docker compose restart caddy`
5. ✅ Attendre 30s pour la génération des certificats
6. ✅ Tester : `curl -I https://alecia.markets`
7. ✅ Nettoyer le cache HSTS du navigateur
8. ✅ Recharger la page

## 📝 Notes Importantes

**Let's Encrypt Rate Limits** :
- Let's Encrypt a des limites : 5 certificats par semaine par domaine
- Si vous régénérez trop souvent, vous serez bloqué pendant 7 jours
- En staging (développement), utilisez `acme_ca https://acme-staging-v02.api.letsencrypt.org/directory` dans le Caddyfile

**Ports Requis** :
- Port 80 (HTTP) : Requis pour le challenge ACME de Let's Encrypt
- Port 443 (HTTPS) : Pour le traffic HTTPS

**Firewall OVH** :
Si les certificats ne se génèrent toujours pas, vérifiez le firewall OVH :
- Connectez-vous à l'interface OVH
- Vérifiez que les ports 80 et 443 sont ouverts en TCP
- Vérifiez qu'il n'y a pas de règles qui bloquent Let's Encrypt

## 🆘 Si Ça Ne Marche Toujours Pas

Vérifiez la connectivité Let's Encrypt :

```bash
# Depuis le VPS
curl -I https://acme-v02.api.letsencrypt.org/directory

# Devrait retourner HTTP/2 200
```

Si cette commande échoue, c'est un problème de réseau/firewall qui empêche le VPS de contacter Let's Encrypt.

---

**Prochaine action** : Connectez-vous au VPS et exécutez les vérifications de l'Étape 2 ! 🚀
