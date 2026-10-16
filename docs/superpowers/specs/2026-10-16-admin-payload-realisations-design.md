# Espace admin — sous-projet 1 : socle Payload + Réalisations

- **Date :** 2026-10-16
- **Statut :** conception validée, en attente de relecture de la spec
- **Périmètre :** premier des 6 sous-projets de l'espace admin

## Contexte

Le site stratetic.art (Next.js 16.2.10, App Router, React 19, Tailwind v4) n'a ni base
de données, ni API, ni authentification. Tout le contenu est écrit en dur dans les
composants. Les formulaires passent par FormSubmit.

L'objectif global est un espace admin complet d'agence, découpé en sous-projets
livrés l'un après l'autre :

1. **Socle + Réalisations** ← *ce document*
2. Messages & devis (boîte de réception, remplace FormSubmit)
3. Blog (éditeur riche, brouillons, publication)
4. Statistiques (visites, demandes, sans cookie)
5. Extras d'agence (clients/témoignages, SEO, journal d'activité)
6. Sauvegarde hors VPS

Les sous-projets 2 à 6 auront chacun leur propre spec.

## Décisions prises

| Sujet | Décision | Raison |
|---|---|---|
| Moteur d'admin | **Payload CMS 3**, intégré à l'app Next.js | Fournit auth, médiathèque, éditeur riche, brouillons et versions. Compatible Next 16.2+ et SQLite |
| Base de données | **SQLite** via `@payloadcms/db-sqlite` (Drizzle + libSQL) | Un seul VPS, aucun service en plus, sauvegarde simple |
| Utilisateurs | **Un seul administrateur** | Demande explicite. Payload permet d'ajouter des rôles plus tard |
| Emplacement | `/admin` sur stratetic.art, même conteneur Coolify | Pas de nouvelle ressource à déployer |

## 1. Architecture

### Structure des routes

Payload exige son propre layout racine. On utilise deux groupes de routes, chacun
avec son layout racine. **Aucune URL publique ne change.**

```
src/
  app/
    (site)/
      layout.tsx        ← layout actuel (polices Inter/Archivo, Lenis, globals.css)
      page.tsx          ← accueil
      a-propos/ services/ realisations/ blog/ contact/
      confidentialite/ mentions-legales/
    (payload)/
      admin/[[...segments]]/page.tsx   ← généré par Payload
      api/[...slug]/route.ts           ← API REST Payload
      layout.tsx                       ← layout Payload
  payload.config.ts
  collections/
    Users.ts
    Media.ts
    Realisations.ts
  lib/
    payload.ts          ← getPayload() + helpers de lecture
    youtube.ts          ← extraction d'ID depuis une URL YouTube
    nombres.ts          ← nombre écrit en toutes lettres (« huit », « neuf »)
  seed/
    realisations.ts     ← import initial des 9 projets
```

### Configuration Next.js

`next.config.ts` est enveloppé par `withPayload`. On garde `output: "standalone"` et
`images.unoptimized: true` : les `.webp` actuels du site restent servis tels quels.
`sharp` est ajouté **uniquement pour Payload**, qui génère les variantes des images
envoyées dans l'admin.

### Persistance

Tout ce qui doit survivre à un redéploiement est sur un **volume persistant Coolify
monté sur `/data`** :

- `/data/stratetic.db` : base SQLite, en mode WAL
- `/data/media/` : fichiers envoyés via l'admin
- `/data/backups/` : sauvegardes nocturnes

Les migrations Payload sont générées en développement (`payload migrate:create`),
commitées dans `src/migrations/`, et appliquées au démarrage du conteneur via
l'option `prodMigrations` de l'adaptateur. Aucune commande manuelle.

### Lecture côté site

Les pages publiques (Server Components) lisent la base via l'**API locale** de
Payload (`getPayload({ config })`), sans appel HTTP.

`next build` **ne doit pas** dépendre de la base, qui n'existe pas pendant le build
Docker. Les pages qui lisent Payload sont donc rendues à la requête, avec un cache
de données étiqueté (tag `realisations`).

Un hook `afterChange` / `afterDelete` sur la collection `Realisations` invalide ce
tag. Un enregistrement dans l'admin est donc visible immédiatement sur le site,
**sans redéploiement**.

### Admin

- Interface en **français** (`@payloadcms/translations`).
- Logo Stratetic dans la barre et sur l'écran de connexion. Couleurs navy `#0d2438`
  et olive `#96b912` via les variables CSS de Payload.
- `/admin` porte `noindex, nofollow`.

## 2. Collections

### `Users`

- Collection d'authentification Payload, **un seul compte administrateur**.
- `maxLoginAttempts: 5`, `lockTime: 10 min`.
- Création, lecture et modification réservées à un utilisateur connecté. Pas
  d'inscription publique.
- **Premier compte :** créé au démarrage (`onInit`) à partir de
  `INITIAL_ADMIN_EMAIL` et `INITIAL_ADMIN_PASSWORD` si la collection est vide. Si
  ces variables manquent, le démarrage échoue avec un message explicite. L'écran
  « créer le premier utilisateur » n'est jamais exposé.

### `Media`

- Collection d'upload Payload, fichiers stockés dans `/data/media`.
- Types acceptés : images (`image/*`) et `application/pdf`.
- `alt` **obligatoire** pour les images (accessibilité et SEO).
- Variantes WebP générées par `sharp` :
  - `thumbnail` : 400 px
  - `card` : 960 px
  - `large` : 1920 px
- Lecture publique. Écriture réservée à l'admin.

### `Realisations`

| Champ | Type Payload | Règles |
|---|---|---|
| `title` | `text` | requis |
| `slug` | `text` | unique, indexé. Généré depuis `title` s'il est vide, modifiable. Sert d'ancre `/realisations#slug` |
| `category` | `text` | ex. « Énergie · Privé » |
| `description` | `textarea` | requis |
| `tags` | `array` de `{ label: text }` | |
| `type` | `select` : `video` · `website` · `pdf` | requis, défaut `video` |
| `youtubeId` | `text` | affiché et requis si `type = video`. Accepte une URL YouTube complète ; un hook `beforeValidate` en extrait l'ID. ID invalide → erreur de validation |
| `externalUrl` | `text` (URL) | affiché et requis si `type = website` |
| `pdf` | `upload` → `Media` | affiché et requis si `type = pdf`. Doit être un PDF |
| `cover` | `upload` → `Media` | optionnel si `video` (repli : `https://i.ytimg.com/vi/<id>/hqdefault.jpg`), requis sinon |
| `showOnHome` | `checkbox` | défaut `false` |

Options de la collection :

- `orderable: true` : ordre par glisser-déposer, utilisé par l'accueil et par
  `/realisations`.
- `versions.drafts: true` : statut brouillon / publié.
- Accès en lecture : public pour les documents `_status = published`, tout pour
  l'admin. Écriture réservée à l'admin.
- `admin.useAsTitle: "title"`. Colonnes par défaut : titre, type, affiché sur
  l'accueil, statut.

## 3. Branchement du site public

`src/lib/payload.ts` expose deux fonctions mises en cache :

- `getRealisations()` : tous les projets publiés, dans l'ordre.
- `getHomeRealisations()` : les projets publiés avec `showOnHome`, dans l'ordre.

Les deux renvoient un type de vue unique qui découple les composants de Payload :

```ts
type RealisationView = {
  slug: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  type: "video" | "website" | "pdf";
  youtubeId?: string;
  externalUrl?: string;
  pdfUrl?: string;
  coverUrl: string;   // repli miniature YouTube déjà résolu
  coverAlt: string;
};
```

Modifications des composants :

- `src/components/sections/WorkGallery.tsx`
  - Le tableau `caseStudies` est supprimé.
  - Le composant reçoit `projects: RealisationView[]` en prop depuis la page
    d'accueil (Server Component). Il reste un Client Component pour la lightbox.
  - Le titre devient `« {Nombre} projets, {nombre} univers »`, calculé avec
    `nombres.ts`.
- `src/app/(site)/realisations/page.tsx`
  - Le tableau `projects` et la constante `ARISE_URL` sont supprimés.
  - La page lit `getRealisations()`.
  - L'affichage selon `type` reste le même : iframe YouTube, livret PDF
    (`PdfBooklet`) ou lien vers le site.
  - Le titre du `PageHero` est calculé de la même façon.
- `CaseStudy` dans `src/types/content.ts` est supprimé s'il n'a plus d'usage.

**Aucun projet publié** → la section de l'accueil est masquée. La page
`/realisations` affiche un message neutre (« Nos projets arrivent bientôt »).

## 4. Import initial

`src/seed/realisations.ts` est exécuté dans `onInit`, **uniquement si la collection
`Realisations` est vide**. Il est idempotent.

Il :

1. Envoie dans `Media` les couvertures des projets non vidéo depuis `public/` :
   - ARISE : `Siteweb_Arise.jpg`
   - CPTP : `catalogue-cptp-cover.webp`
2. Envoie dans `Media` le PDF du CPTP.
3. Crée les **9 projets** de l'actuel `/realisations/page.tsx`, dans le même ordre,
   statut **publié**.
4. Coche `showOnHome` pour les 8 projets actuellement présents dans `WorkGallery`
   (tous sauf CPTP).

Les vidéos n'ont pas de couverture : la miniature YouTube sert, comme aujourd'hui.

Résultat attendu : au premier démarrage, le site est **visuellement identique** à la
version actuelle.

## 5. Déploiement

### Variables Coolify

| Variable | Valeur | Secret |
|---|---|---|
| `PAYLOAD_SECRET` | aléatoire, ≥ 32 octets | oui |
| `DATABASE_URI` | `file:/data/stratetic.db` | non |
| `NEXT_PUBLIC_SERVER_URL` | `https://stratetic.art` | non |
| `INITIAL_ADMIN_EMAIL` | e-mail de l'administrateur | non |
| `INITIAL_ADMIN_PASSWORD` | mot de passe provisoire, à changer à la 1re connexion | oui |

### Volume

Volume persistant Coolify monté sur `/data`.

### Dockerfile

Le multi-étapes `node:20-slim` est conservé, avec `npm install` (et non `npm ci`).
Ajouts :

- Création de `/data` avec le propriétaire `nextjs:nodejs` dans l'étape runtime.
- Les migrations sont importées par `payload.config.ts` (`prodMigrations`). Elles
  sont donc incluses dans le bundle standalone : rien à copier.
- Copie de `scripts/backup-db.mjs` dans l'image runtime. Le script utilise
  `@libsql/client`, déjà présent via l'adaptateur Payload.
- `NODE_OPTIONS=--max-old-space-size=4096` sur l'étape build, ajouté seulement si
  le build échoue faute de mémoire sur le VPS.

### Sauvegardes

- Une tâche planifiée Coolify, chaque nuit, exécute `node scripts/backup-db.mjs`.
- Le script lance `VACUUM INTO '/data/backups/stratetic-AAAA-MM-JJ.db'` (copie
  cohérente même pendant les écritures) et supprime les copies de plus de 14 jours.
- La copie hors du VPS relève du sous-projet 6.

### Retour arrière

Si le déploiement échoue, Coolify reste sur l'image actuelle, qui n'utilise pas
`/data`. Le site public ne casse pas.

## 6. Sécurité

- Lecture publique limitée aux réalisations **publiées** et aux médias. `Users` et
  brouillons réservés à l'admin.
- **GraphQL désactivé** (`graphQL.disable: true`). Seule l'API REST reste, protégée
  par les règles d'accès.
- `csrf` et `cors` limités à `NEXT_PUBLIC_SERVER_URL`.
- Verrouillage du compte après 5 échecs (10 min).
- `/admin` en `noindex`.
- `PAYLOAD_SECRET` et `INITIAL_ADMIN_PASSWORD` ne sont jamais commités. Un
  `.env.example` documente les variables sans valeur.

## 7. Gestion des erreurs

| Situation | Comportement |
|---|---|
| Base illisible ou absente au rendu | La page renvoie la page d'erreur Next.js. Les autres pages, qui ne lisent pas Payload, continuent de fonctionner |
| URL YouTube invalide dans l'admin | Erreur de validation sur le champ. L'enregistrement est refusé |
| Couverture manquante pour un site ou un PDF | Erreur de validation, champ requis |
| Variables `INITIAL_ADMIN_*` absentes avec une base vide | Le démarrage échoue avec un message clair dans les logs Coolify |
| Échec d'une migration au démarrage | Le conteneur ne démarre pas. Coolify garde l'ancienne version |

## 8. Vérification

Pas de framework de test dans ce dépôt, conformément à `CLAUDE.md`. Vérification :

1. `npm run build` passe, et `npm run lint` ne signale aucune nouvelle erreur.
2. En développement, base vierge :
   - l'import crée 9 projets ;
   - l'accueil et `/realisations` sont identiques à la version actuelle.
3. Dans l'admin, en contrôlant l'accueil et `/realisations` après chaque action :
   - créer un projet vidéo en collant une URL YouTube complète ;
   - le réordonner ;
   - le décocher de l'accueil ;
   - le passer en brouillon ;
   - le supprimer.
4. Image Docker construite en local et lancée avec un volume vide :
   - les migrations s'appliquent ;
   - le compte admin est créé ;
   - l'import a lieu ;
   - la connexion à `/admin` fonctionne.
5. Après le déploiement : stratetic.art, `/realisations` et `/admin` répondent, et
   une modification faite dans l'admin apparaît sur le site sans redéploiement.

## Hors périmètre

Blog, messages et devis, statistiques, clients et témoignages, SEO éditable,
plusieurs utilisateurs et rôles, double authentification, sauvegarde hors VPS.
