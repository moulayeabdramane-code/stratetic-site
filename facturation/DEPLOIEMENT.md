# Mise en ligne sur Coolify — stratetic.art/facturation (dépôt du site)

```
Dépôt GitHub moulayeabdramane-code/stratetic-site (branche main)
├── (racine)      → site Next.js        → https://stratetic.art/              [ressource existante, inchangée]
└── facturation/  → cette application   → https://stratetic.art/facturation/  [nouvelle ressource]
```

- **Un seul dépôt, deux ressources Coolify.** Chacune construit sa partie avec son propre Dockerfile. Le site ignore le dossier `facturation/` (`.dockerignore`, TypeScript, ESLint).
- **Aucun sous-domaine ni réglage DNS.** Le proxy de Coolify (Traefik) envoie le chemin `/facturation` vers la facturation, et tout le reste vers le site.
- **Certificat HTTPS** : celui de stratetic.art est réutilisé.
- **Connexion propre à la facturation** :
  - comptes utilisateurs, mots de passe chiffrés (scrypt) ;
  - blocage de 15 minutes après 5 échecs ;
  - cookie de session limité à `/facturation`, jamais envoyé au site.
- **Dépôt public :** il ne contient aucune donnée client. Les factures, les comptes et la clé des QR codes vivent uniquement dans le volume `/app/data` du serveur.

---

## 1. Ressource Coolify

Dans le **même projet** que le site, et sur le **même serveur** (`localhost`) :
*+ New → Git Repository (with GitHub App)*, choisissez la GitHub App déjà utilisée par le site, puis le dépôt `moulayeabdramane-code/stratetic-site`.

| Réglage | Valeur |
|---|---|
| Dépôt / branche | `stratetic-site` / `main` |
| Build Pack | **Dockerfile** |
| **Base Directory** | **`/facturation`** |
| Dockerfile Location | `/Dockerfile` (relatif au Base Directory) |
| **Domains** | **`https://stratetic.art/facturation`** |
| **Ports Exposes** | **`3210`** |
| Watch Paths | `facturation/**` (seules les modifications de la facturation la redéploient) |
| Health Check | chemin `/healthz` (déjà déclaré dans l'image) |

Points d'attention :
- **Domaine** : ne touchez pas au domaine de la ressource du site (`https://stratetic.art`). Traefik donne automatiquement la priorité à la règle la plus précise, `/facturation`.
- **Préfixe** : que Coolify retire `/facturation` avant de transmettre la requête ou non, l'application fonctionne dans les deux cas.
- **`BASE_PATH`** vaut déjà `/facturation` dans l'image.
- **Facultatif** : dans la ressource du site, des *Watch Paths* qui excluent `facturation/**` évitent de reconstruire le site quand seule la facturation change. Sans ce réglage, le site est simplement reconstruit à l'identique.

### Volume persistant — indispensable

*Persistent Storage → + Add → Volume Mount*

| Name | Destination Path |
|---|---|
| `facturation-data` | `/app/data` |

⚠️ Sans ce volume, **factures, comptes et paramètres sont effacés à chaque redéploiement**.

### Variables d'environnement

| Variable | Valeur | Remarque |
|---|---|---|
| `INITIAL_ADMIN_EMAIL` | votre e-mail | Compte administrateur créé au premier démarrage |
| `INITIAL_ADMIN_PASSWORD` | un mot de passe provisoire | Cochez *Is Secret*. Il sera à changer dès la première connexion. Sans cette variable, un mot de passe est généré et affiché dans les journaux du déploiement. |
| `SMTP_PASS` | mot de passe d'application de votre messagerie | Facultatif (envoi des factures par e-mail). Cochez *Is Secret*. |

L'image définit déjà `BASE_PATH=/facturation`, `TZ=Africa/Niamey`, le port, Chromium et les chemins de données.

Puis **Deploy**. Comptez 3 à 5 minutes pour la première construction, à cause du téléchargement de Chromium.

**Ressources :** au moins **1 Go de RAM** libre sur le serveur. Chromium consomme environ 200 à 300 Mo pendant la génération d'un PDF.

## 2. Première connexion

1. Ouvrez **https://stratetic.art/facturation**.
2. Connectez-vous avec `INITIAL_ADMIN_EMAIL` et le mot de passe provisoire.
3. Choisissez votre mot de passe personnel (10 caractères minimum).
4. Vous pouvez ensuite **supprimer `INITIAL_ADMIN_PASSWORD`** dans Coolify. Elle ne sert qu'au tout premier démarrage.
5. **Paramètres** :
   - vérifiez l'émetteur et la banque ;
   - le prochain numéro doit être **FAC-2026-045** ;
   - pour l'e-mail, choisissez « Envoi direct SMTP », puis l'hôte, le port et l'utilisateur.
6. **Utilisateurs** : créez les comptes de l'équipe.
   - Un mot de passe provisoire s'affiche une seule fois ; transmettez-le à la personne.
   - **Utilisateur** : documents, clients, catalogue, statistiques.
   - **Administrateur** : tout, y compris paramètres, comptes et restauration.

### Reprendre des données saisies sur le PC

- Sur le PC : **Paramètres › Sauvegarde › Exporter (JSON)**.
- En ligne : **Importer**.

La clé des QR codes est transférée. Les comptes ne font **pas** partie des sauvegardes : ceux du serveur sont conservés.

## 3. Contenu du volume `/app/data`

| Élément | Rôle |
|---|---|
| `factures.db` | Base : documents, clients, paiements, journal, comptes, sessions |
| `settings.json` | Paramètres (créés au premier démarrage, puis modifiés depuis l'écran Paramètres) |
| `pdf/` | PDF archivés des documents émis |
| `uploads/` | Logos téléversés |
| `secret.key` | Clé des QR codes de vérification |
| `backups/` | Copies automatiques faites avant chaque import |

**Sauvegardes conseillées :**
- export JSON régulier depuis l'application ;
- sauvegarde du volume `facturation-data` côté serveur.

## 4. Mettre à jour l'application

Modifiez le dossier `facturation/` du dépôt `stratetic-site`, puis poussez sur `main`. Coolify reconstruit et redéploie (bouton **Deploy**, ou déploiement automatique s'il est activé). Les données du volume ne sont pas touchées.

## 5. Dépannage

| Symptôme | Cause probable |
|---|---|
| `stratetic.art/facturation` affiche une page 404 du site | La ressource facturation n'est pas démarrée, ou la règle `/facturation` n'est pas prise en compte : vérifiez son état, son champ *Domains* et son *Base Directory*, puis redéployez-la. Si votre version de Coolify n'accepte pas de chemin dans *Domains*, voir « Solution de repli » ci-dessous. |
| Échec de construction « Dockerfile not found » | *Base Directory* doit valoir `/facturation` et *Dockerfile Location* `/Dockerfile` |
| Page blanche, styles absents | `BASE_PATH` modifié ou vide : il doit valoir `/facturation` (valeur par défaut de l'image) |
| « Impossible d'ouvrir la base dans /app/data » | Volume absent ou non accessible en écriture : vérifiez *Persistent Storage* |
| « Trop de tentatives » | Blocage de 15 minutes après 5 échecs : patientez |
| Mot de passe administrateur perdu | Un autre administrateur peut le réinitialiser (*Utilisateurs › Réinitialiser*). S'il n'y en a pas, voir ci-dessous. |
| PDF en erreur ou très lent | Mémoire insuffisante : consultez les journaux de la ressource |

**Dernier administrateur perdu :**
1. Arrêtez la ressource.
2. Dans son terminal Coolify, supprimez les comptes avec la commande ci-dessous, qui ne touche pas aux factures.
3. Redéployez avec `INITIAL_ADMIN_EMAIL` et `INITIAL_ADMIN_PASSWORD` : un nouvel administrateur est créé.

```bash
node -e "const {DatabaseSync}=require('node:sqlite');new DatabaseSync('/app/data/factures.db').exec('DELETE FROM sessions; DELETE FROM users')"
```

### Solution de repli (si Coolify refuse un chemin dans *Domains*)

1. Laissez la ressource facturation **sans domaine public**.
2. Faites relayer `/facturation` par le site Next.js : dans le `next.config.ts` à la racine du dépôt, ajoutez une réécriture vers l'adresse interne de la facturation (*nom du conteneur*, visible dans Coolify), ainsi :

   ```ts
   async rewrites() {
     return [
       { source: '/facturation', destination: 'http://<conteneur-facturation>:3210/facturation/' },
       { source: '/facturation/:path*', destination: 'http://<conteneur-facturation>:3210/facturation/:path*' },
     ];
   }
   ```

3. Les deux ressources doivent être sur le même réseau Docker : même serveur et même projet, ou *Connect to Predefined Network*.

## 6. Usage local (sans serveur)

- `npm start` sur le PC sert l'application à la racine (`http://localhost:3210/`), sans `BASE_PATH`.
- Une connexion est demandée : le compte administrateur initial s'affiche dans la console au premier lancement.
- `AUTH_DISABLED=1` dans `.env` supprime la page de connexion, pour un PC utilisé seul. C'est à proscrire en ligne.
