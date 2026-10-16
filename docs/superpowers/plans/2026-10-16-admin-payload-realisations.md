# Espace admin — socle Payload + Réalisations : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Objectif :** ajouter un admin Payload CMS 3 à `/admin` sur stratetic.art, avec une
collection « Réalisations » qui alimente l'accueil et `/realisations` sans redéploiement.

**Architecture :**
- Payload 3.91 est installé dans l'app Next.js existante, avec deux groupes de routes :
  `(site)` pour les pages actuelles et `(payload)` pour l'admin et l'API.
- Données dans SQLite (`@payloadcms/db-sqlite`) et médias sur disque, les deux sous
  `/data`, un volume Coolify.
- Les pages publiques lisent la base via l'API locale, derrière un cache `unstable_cache`
  étiqueté `realisations` que les hooks Payload invalident.

**Stack :** Next.js 16.4.2, React 19.2, Payload 3.91.0, `@payloadcms/db-sqlite`,
`sharp`, TypeScript strict, Tailwind v4.

**Spec :** [`docs/superpowers/specs/2026-10-16-admin-payload-realisations-design.md`](../specs/2026-10-16-admin-payload-realisations-design.md)

---

## Notes préalables (à lire avant de commencer)

- **Montée de version obligatoire.** `@payloadcms/next@3.91.0` exige
  `next >=16.3.3 <17`. Le dépôt est en 16.2.10 : la tâche 1 passe en **16.4.2**.
- **Pas de framework de test** dans ce dépôt (règle de `CLAUDE.md` : ne pas en
  inventer). La vérification se fait par :
  - `npm run build` ;
  - le serveur de dev et `curl` ;
  - des contrôles ponctuels des fonctions pures avec `node --experimental-strip-types`
    (Node 24 en local).
- **Branche de travail.** Coolify redéploie à chaque push sur `main`. Tout le travail
  se fait sur la branche `feat/admin-payload`. **Ne jamais pousser `main` avant la
  tâche 15** : Coolify doit d'abord avoir le volume et les variables.
- **Docker absent sur ce PC.** L'image ne peut pas être testée en local. La tâche 14
  lance donc le serveur *standalone* de production sur une base vide, ce qui exerce
  les mêmes chemins (migrations, création de l'admin, import).
- **Imports relatifs dans la config Payload.** Les fichiers chargés par la CLI Payload
  (`src/payload.config.ts`, `src/collections/**`, `src/seed/**`, `src/lib/youtube.ts`,
  `src/lib/slug.ts`) utilisent des **imports relatifs**, pas l'alias `@/`. Les
  composants React du site gardent `@/`.
- Les commandes sont écrites pour **Git Bash**. Répertoire de travail :
  `D:/STRATETIC/Nouveau site Stratetic`.

## Carte des fichiers

| Fichier | Rôle |
|---|---|
| `package.json` | Next 16.4.2, dépendances Payload, `"type": "module"`, script `payload` |
| `tsconfig.json` | alias `@payload-config` |
| `next.config.ts` | `withPayload(...)` |
| `.gitignore`, `.dockerignore` | ignorer `data/`, garder `.env.example` |
| `.env.example` | variables documentées, sans valeur |
| `src/app/(site)/**` | pages actuelles, déplacées sans changement d'URL |
| `src/app/(site)/layout.tsx` | layout racine du site (ex-`src/app/layout.tsx`) |
| `src/app/(payload)/**` | admin et API REST (fichiers Payload) |
| `src/payload.config.ts` | configuration Payload |
| `src/collections/Users.ts` | compte administrateur |
| `src/collections/Media.ts` | médiathèque (images et PDF) |
| `src/collections/Realisations.ts` | réalisations |
| `src/collections/access.ts` | règle d'accès `authenticated` |
| `src/collections/hooks/revalidate.ts` | invalidation du cache `realisations` |
| `src/lib/youtube.ts` | extraction d'ID et miniature YouTube |
| `src/lib/slug.ts` | `slugify` |
| `src/lib/nombres.ts` | nombres en toutes lettres et titres « N projets, N univers » |
| `src/lib/realisations.ts` | requêtes en cache et type `RealisationView` |
| `src/seed/onInit.ts` | point d'entrée `onInit` |
| `src/seed/ensureAdmin.ts` | création du premier administrateur |
| `src/seed/realisations-data.ts` | les 9 projets actuels |
| `src/seed/seedRealisations.ts` | import initial idempotent |
| `src/instrumentation.ts` | initialise Payload au démarrage du serveur |
| `src/components/admin/Logo.tsx`, `Icon.tsx` | logo Stratetic dans l'admin |
| `src/migrations/**` | migrations générées par Payload |
| `src/components/sections/WorkGallery.tsx` | reçoit les projets en prop |
| `src/app/(site)/page.tsx` | lit `getHomeRealisations()` |
| `src/app/(site)/realisations/page.tsx` | lit `getRealisations()` |
| `src/types/content.ts` | suppression de `CaseStudy` |
| `scripts/backup-db.mjs` | sauvegarde nocturne `VACUUM INTO` |
| `Dockerfile` | Node 22, `/data`, variables par défaut, script de sauvegarde |
| `CLAUDE.md` | documenter l'admin |

**Écart assumé par rapport à la spec :**
- `alt` est requis pour **tous** les médias, PDF compris : le champ sert de description
  du fichier. Le rendre conditionnel au type MIME n'est pas fiable avant le traitement
  de l'upload.
- `RealisationView` gagne un champ `showOnHome`, qui permet de filtrer l'accueil depuis
  une seule requête en cache.

---

### Tâche 0 : branche de travail

- [ ] **Étape 1 : vérifier l'état du dépôt**

```bash
cd "D:/STRATETIC/Nouveau site Stratetic" && git status --short && git branch --show-current
```

Attendu : branche `main`. Seul `.claude/settings.local.json` peut apparaître modifié ;
c'est une config locale, on n'y touche pas.

- [ ] **Étape 2 : créer la branche**

```bash
git checkout -b feat/admin-payload
```

Attendu : `Switched to a new branch 'feat/admin-payload'`.

---

### Tâche 1 : passer Next.js en 16.4.2

**Fichiers :** modifier `package.json` et `package-lock.json`.

- [ ] **Étape 1 : relever le niveau de lint actuel**

```bash
npm run lint 2>&1 | tail -5
```

Notez le nombre d'erreurs et d'avertissements. Les tâches suivantes ne doivent pas
**ajouter** d'erreurs.

- [ ] **Étape 2 : installer la nouvelle version**

```bash
npm install next@16.4.2 eslint-config-next@16.4.2 --no-audit --no-fund
```

Attendu : installation sans erreur de dépendance.

- [ ] **Étape 3 : lire les notes de version utiles**

```bash
ls node_modules/next/dist/docs/01-app/02-guides | grep -i upgrad
```

S'il existe un guide de mise à jour 16.3 ou 16.4, lisez ses avertissements de
dépréciation.

- [ ] **Étape 4 : vérifier le build**

```bash
npm run build 2>&1 | tail -25
```

Attendu : `✓ Compiled successfully` et la liste des routes (`/`, `/a-propos`, `/blog`,
`/contact`, `/realisations`, …), sans erreur.

- [ ] **Étape 5 : commit**

```bash
git add package.json package-lock.json
git commit -m "$(cat <<'EOF'
Next.js 16.4.2 (prérequis Payload 3.91)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Tâche 2 : dépendances Payload et configuration du projet

**Fichiers :**
- Modifier : `package.json`, `tsconfig.json`, `.gitignore`, `.dockerignore`.
- Créer : `.env.example`, `.env` (local, non commité), `data/` (local, non commité).

- [ ] **Étape 1 : installer les paquets**

```bash
npm install payload@3.91.0 @payloadcms/next@3.91.0 @payloadcms/db-sqlite@3.91.0 @payloadcms/translations@3.91.0 graphql@^16.8.1 sharp --no-audit --no-fund
```

Attendu : installation sans conflit de dépendances. Si npm signale un conflit de peer
dependency sur `next`, c'est que la tâche 1 n'est pas faite.

- [ ] **Étape 2 : passer le projet en ESM et ajouter le script `payload`**

Dans `package.json`, ajoutez `"type": "module"` juste après `"private": true`, puis
remplacez le bloc `scripts` par :

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "payload": "payload"
  },
```

- [ ] **Étape 3 : ajouter l'alias `@payload-config`**

Dans `tsconfig.json`, remplacez le bloc `paths` par :

```json
    "paths": {
      "@/*": ["./src/*"],
      "@payload-config": ["./src/payload.config.ts"]
    }
```

- [ ] **Étape 4 : mettre à jour `.gitignore`**

Remplacez la section `# env files` par :

```gitignore
# env files (can opt-in for committing if needed)
.env*
!.env.example
```

Puis ajoutez à la fin :

```gitignore

# Données Payload locales (base SQLite + médias). En prod : volume Coolify /data.
/data
```

- [ ] **Étape 5 : mettre à jour `.dockerignore`**

Ajoutez à la fin :

```
# Données locales et secrets : jamais dans l'image
data
.env
```

- [ ] **Étape 6 : créer `.env.example`**

```dotenv
# Secret de chiffrement Payload (cookies, jetons). Aléatoire, 32 octets ou plus.
PAYLOAD_SECRET=
# Base SQLite. Dev : file:./data/stratetic.db — Prod (défaut Dockerfile) : file:/data/stratetic.db
DATABASE_URI=file:./data/stratetic.db
# Dossier des médias envoyés via l'admin. Dev : ./data/media — Prod (défaut Dockerfile) : /data/media
MEDIA_DIR=
# URL publique du site (CORS / CSRF de l'admin)
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
# Premier administrateur, créé au démarrage si aucun compte n'existe
INITIAL_ADMIN_EMAIL=
INITIAL_ADMIN_PASSWORD=
```

- [ ] **Étape 7 : créer le `.env` local et le dossier `data/`**

```bash
mkdir -p data/media
SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
PASS=$(node -e "console.log(require('crypto').randomBytes(12).toString('base64url'))")
cat > .env <<EOF
PAYLOAD_SECRET=$SECRET
DATABASE_URI=file:./data/stratetic.db
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
INITIAL_ADMIN_EMAIL=admin@stratetic.local
INITIAL_ADMIN_PASSWORD=$PASS
EOF
git check-ignore .env data && echo "OK : ignorés"
```

Attendu : `OK : ignorés`. Le mot de passe de dev reste dans `.env` : ne l'affichez pas.

- [ ] **Étape 8 : vérifier que le site compile toujours**

```bash
npm run build 2>&1 | tail -8
```

Attendu : build réussi. Avec `"type": "module"`, `next.config.ts`, `postcss.config.mjs`
et `eslint.config.mjs` restent compatibles. La garde CommonJS de `scrub-engine.js`
(`typeof module !== 'undefined'`) est inoffensive.

- [ ] **Étape 9 : commit**

```bash
git add package.json package-lock.json tsconfig.json .gitignore .dockerignore .env.example
git commit -m "$(cat <<'EOF'
Dépendances Payload 3.91 (SQLite) et configuration ESM

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Tâche 3 : déplacer le site dans le groupe de routes `(site)`

**Fichiers :** déplacer `src/app/{layout.tsx,page.tsx,a-propos,blog,confidentialite,contact,mentions-legales,realisations,services}` vers `src/app/(site)/`. `globals.css` et `favicon.ico` restent dans `src/app/`.

- [ ] **Étape 1 : déplacer avec git**

```bash
mkdir -p "src/app/(site)"
for p in layout.tsx page.tsx a-propos blog confidentialite contact mentions-legales realisations services; do
  git mv "src/app/$p" "src/app/(site)/$p"
done
ls "src/app" "src/app/(site)"
```

Attendu :
- `src/app` : `(site)  favicon.ico  globals.css`
- `src/app/(site)` : les 7 dossiers, plus `layout.tsx` et `page.tsx`.

- [ ] **Étape 2 : corriger l'import de la feuille de style**

Dans `src/app/(site)/layout.tsx`, remplacez :

```tsx
import "./globals.css";
```

par :

```tsx
import "../globals.css";
```

- [ ] **Étape 3 : vérifier qu'aucun import relatif n'est cassé**

```bash
grep -rn "from \"\.\./\|from '\.\./" "src/app/(site)" | grep -v globals.css
```

Attendu : aucune sortie. Les pages utilisent l'alias `@/`.

- [ ] **Étape 4 : build et contrôle des URL**

```bash
npm run build 2>&1 | grep -E "^(┌|├|└)|error|Error" | head -20
```

Attendu : mêmes routes qu'avant (`/`, `/a-propos`, `/blog`, `/confidentialite`,
`/contact`, `/mentions-legales`, `/realisations`, `/services`), sans erreur.

- [ ] **Étape 5 : commit**

```bash
git add -A src/app
git commit -m "$(cat <<'EOF'
Pages du site dans le groupe de routes (site), URL inchangées

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Tâche 4 : fonctions pures (`youtube`, `slug`, `nombres`)

**Fichiers :** créer `src/lib/youtube.ts`, `src/lib/slug.ts`, `src/lib/nombres.ts`.

- [ ] **Étape 1 : écrire le contrôle avant le code**

Créez le script de contrôle
`C:/Users/moula/AppData/Local/Temp/claude/D--STRATETIC-Nouveau-site-Stratetic/25d8449b-7cf1-4882-bc8b-aac6aae8b213/scratchpad/check-lib.ts`.
C'est un fichier jetable, hors du dépôt.

```ts
import assert from "node:assert/strict";
import { extractYouTubeId, isYouTubeId, youTubeThumbnail } from "D:/STRATETIC/Nouveau site Stratetic/src/lib/youtube.ts";
import { slugify } from "D:/STRATETIC/Nouveau site Stratetic/src/lib/slug.ts";
import { nombreEnLettres, titreProjets } from "D:/STRATETIC/Nouveau site Stratetic/src/lib/nombres.ts";

// youtube
assert.equal(extractYouTubeId("7KosqdnyWXk"), "7KosqdnyWXk");
assert.equal(extractYouTubeId("https://www.youtube.com/watch?v=7KosqdnyWXk&t=3s"), "7KosqdnyWXk");
assert.equal(extractYouTubeId("https://youtu.be/_AplCctINfE?si=abc"), "_AplCctINfE");
assert.equal(extractYouTubeId("https://www.youtube.com/shorts/1UfF72OEsmM"), "1UfF72OEsmM");
assert.equal(extractYouTubeId("https://www.youtube-nocookie.com/embed/NjAKRQmZIbQ?rel=0"), "NjAKRQmZIbQ");
assert.equal(extractYouTubeId("youtube.com/watch?v=QhqzRDhcfck"), "QhqzRDhcfck");
assert.equal(extractYouTubeId("  KPwU07osF80  "), "KPwU07osF80");
assert.equal(extractYouTubeId("https://vimeo.com/123"), null);
assert.equal(extractYouTubeId("pas une url"), null);
assert.equal(isYouTubeId("7e2KbO8m21Q"), true);
assert.equal(isYouTubeId("trop-court"), false);
assert.equal(youTubeThumbnail("7KosqdnyWXk"), "https://i.ytimg.com/vi/7KosqdnyWXk/hqdefault.jpg");

// slug
assert.equal(slugify("CDS Niger — Forum FIER/JNER 2026"), "cds-niger-forum-fier-jner-2026");
assert.equal(slugify("Énergie · Privé"), "energie-prive");
assert.equal(slugify("  --Déjà--  "), "deja");

// nombres
assert.equal(nombreEnLettres(8), "huit");
assert.equal(nombreEnLettres(17), "dix-sept");
assert.equal(nombreEnLettres(42), "42");
assert.equal(titreProjets(8), "Huit projets, huit univers");
assert.equal(titreProjets(9), "Neuf projets, neuf univers");
assert.equal(titreProjets(1), "Un projet, un univers");
assert.equal(titreProjets(25), "25 projets, 25 univers");

console.log("OK : toutes les vérifications passent");
```

- [ ] **Étape 2 : constater l'échec**

```bash
node --experimental-strip-types "C:/Users/moula/AppData/Local/Temp/claude/D--STRATETIC-Nouveau-site-Stratetic/25d8449b-7cf1-4882-bc8b-aac6aae8b213/scratchpad/check-lib.ts"
```

Attendu : erreur `ERR_MODULE_NOT_FOUND` sur `src/lib/youtube.ts`.

- [ ] **Étape 3 : écrire `src/lib/youtube.ts`**

```ts
// Utilitaires YouTube sans dépendance — utilisés par l'admin (validation) et le site.
const ID_RE = /^[A-Za-z0-9_-]{11}$/;

export function isYouTubeId(value: string): boolean {
  return ID_RE.test(value);
}

/**
 * Extrait l'ID d'une URL YouTube (watch, youtu.be, shorts, embed, nocookie)
 * ou renvoie l'ID tel quel. `null` si rien d'exploitable.
 */
export function extractYouTubeId(input: string): string | null {
  const value = input.trim();
  if (ID_RE.test(value)) return value;

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^(www|m)\./, "");
  let id: string | null = null;
  if (host === "youtu.be") {
    id = url.pathname.slice(1).split("/")[0] ?? null;
  } else if (host === "youtube-nocookie.com" || host.endsWith("youtube.com")) {
    id = url.searchParams.get("v");
    if (!id) {
      const match = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
      id = match?.[1] ?? null;
    }
  }
  return id && ID_RE.test(id) ? id : null;
}

/** Miniature générée par YouTube pour toute vidéo (hqdefault existe toujours). */
export function youTubeThumbnail(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
```

- [ ] **Étape 4 : écrire `src/lib/slug.ts`**

```ts
// Slug URL-safe en minuscules, sans accents : « Énergie · Privé » → « energie-prive ».
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
```

- [ ] **Étape 5 : écrire `src/lib/nombres.ts`**

```ts
// Nombres en toutes lettres pour les titres éditoriaux (« Huit projets, huit univers »).
const MOTS = [
  "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
  "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept",
  "dix-huit", "dix-neuf", "vingt",
];

/** 0–20 en lettres ; au-delà, les chiffres. */
export function nombreEnLettres(n: number): string {
  return Number.isInteger(n) && n >= 0 && n < MOTS.length ? MOTS[n] : String(n);
}

/** « Huit projets, huit univers » — accord au singulier pour 1. */
export function titreProjets(n: number): string {
  const mot = nombreEnLettres(n);
  const majuscule = mot.charAt(0).toUpperCase() + mot.slice(1);
  return `${majuscule} ${n === 1 ? "projet" : "projets"}, ${mot} univers`;
}
```

- [ ] **Étape 6 : constater le succès**

```bash
node --experimental-strip-types "C:/Users/moula/AppData/Local/Temp/claude/D--STRATETIC-Nouveau-site-Stratetic/25d8449b-7cf1-4882-bc8b-aac6aae8b213/scratchpad/check-lib.ts"
```

Attendu : `OK : toutes les vérifications passent`.

- [ ] **Étape 7 : commit**

```bash
git add src/lib/youtube.ts src/lib/slug.ts src/lib/nombres.ts
git commit -m "$(cat <<'EOF'
Utilitaires YouTube, slug et nombres en lettres

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Tâche 5 : collections Payload

**Fichiers :** créer
- `src/collections/access.ts`
- `src/collections/hooks/revalidate.ts`
- `src/collections/Users.ts`
- `src/collections/Media.ts`
- `src/collections/Realisations.ts`

- [ ] **Étape 1 : `src/collections/access.ts`**

```ts
import type { Access } from "payload";

/** Réservé à un utilisateur connecté (l'administrateur). */
export const authenticated: Access = ({ req: { user } }) => Boolean(user);
```

- [ ] **Étape 2 : `src/collections/hooks/revalidate.ts`**

```ts
import { revalidateTag } from "next/cache";
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  RequestContext,
} from "payload";

/** Tag du cache des réalisations lu par le site (src/lib/realisations.ts). */
export const REALISATIONS_TAG = "realisations";

// L'import initial tourne au démarrage, hors requête : revalidateTag y lèverait.
// Il passe donc `context.disableRevalidate`.
function revalidate(context: RequestContext) {
  if (context.disableRevalidate) return;
  revalidateTag(REALISATIONS_TAG, { expire: 0 });
}

export const revalidateAfterChange: CollectionAfterChangeHook = ({ doc, context }) => {
  revalidate(context);
  return doc;
};

export const revalidateAfterDelete: CollectionAfterDeleteHook = ({ doc, context }) => {
  revalidate(context);
  return doc;
};
```

- [ ] **Étape 3 : `src/collections/Users.ts`**

```ts
import type { CollectionConfig } from "payload";
import { authenticated } from "./access";

export const Users: CollectionConfig = {
  slug: "users",
  labels: { singular: "Administrateur", plural: "Administrateurs" },
  admin: { useAsTitle: "email", group: "Réglages" },
  // 5 essais ratés → compte verrouillé 10 minutes.
  auth: { maxLoginAttempts: 5, lockTime: 10 * 60 * 1000 },
  access: {
    create: authenticated,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [],
};
```

- [ ] **Étape 4 : `src/collections/Media.ts`**

```ts
import path from "path";
import type { CollectionConfig } from "payload";
import { authenticated } from "./access";
import { revalidateAfterChange, revalidateAfterDelete } from "./hooks/revalidate";

// Prod : /data/media (volume Coolify, défini dans le Dockerfile). Dev : ./data/media.
const MEDIA_DIR = process.env.MEDIA_DIR || path.resolve(process.cwd(), "data/media");

export const Media: CollectionConfig = {
  slug: "media",
  labels: { singular: "Média", plural: "Médias" },
  admin: { useAsTitle: "alt", group: "Contenu" },
  access: {
    read: () => true,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    // Une couverture remplacée change d'URL : on rafraîchit les réalisations.
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      label: "Texte alternatif / description",
    },
  ],
  upload: {
    staticDir: MEDIA_DIR,
    mimeTypes: ["image/*", "application/pdf"],
    adminThumbnail: "thumbnail",
    imageSizes: [
      { name: "thumbnail", width: 400, formatOptions: { format: "webp", options: { quality: 80 } } },
      { name: "card", width: 960, formatOptions: { format: "webp", options: { quality: 82 } } },
      { name: "large", width: 1920, formatOptions: { format: "webp", options: { quality: 85 } } },
    ],
  },
};
```

- [ ] **Étape 5 : `src/collections/Realisations.ts`**

```ts
import type { CollectionConfig } from "payload";
import { extractYouTubeId, isYouTubeId } from "../lib/youtube";
import { slugify } from "../lib/slug";
import { authenticated } from "./access";
import { revalidateAfterChange, revalidateAfterDelete } from "./hooks/revalidate";

export const Realisations: CollectionConfig = {
  slug: "realisations",
  labels: { singular: "Réalisation", plural: "Réalisations" },
  // Ordre par glisser-déposer (champ _order), utilisé par l'accueil et /realisations.
  orderable: true,
  versions: { drafts: true },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "type", "showOnHome", "_status"],
    group: "Contenu",
  },
  access: {
    // Public : uniquement les projets publiés. Admin : tout.
    read: ({ req: { user } }) => (user ? true : { _status: { equals: "published" } }),
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  fields: [
    { name: "title", type: "text", required: true, label: "Titre" },
    {
      name: "slug",
      type: "text",
      unique: true,
      index: true,
      label: "Identifiant d'URL",
      admin: {
        position: "sidebar",
        description: "Ancre /realisations#… — généré depuis le titre si vide.",
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (typeof value === "string" && value.trim()) return slugify(value);
            return typeof data?.title === "string" ? slugify(data.title) : value;
          },
        ],
      },
    },
    { name: "category", type: "text", label: "Catégorie", admin: { description: "ex. Énergie · Privé" } },
    { name: "description", type: "textarea", required: true, label: "Description" },
    {
      name: "tags",
      type: "array",
      label: "Tags",
      labels: { singular: "Tag", plural: "Tags" },
      fields: [{ name: "label", type: "text", required: true, label: "Tag" }],
    },
    {
      name: "type",
      type: "select",
      required: true,
      defaultValue: "video",
      label: "Type de projet",
      options: [
        { label: "Vidéo (YouTube)", value: "video" },
        { label: "Site web", value: "website" },
        { label: "Document PDF", value: "pdf" },
      ],
    },
    {
      name: "youtubeId",
      type: "text",
      label: "Vidéo YouTube",
      admin: {
        condition: (_, siblingData) => siblingData?.type === "video",
        description: "Collez l'URL YouTube complète : l'identifiant est extrait automatiquement.",
      },
      hooks: {
        beforeValidate: [
          ({ value }) => (typeof value === "string" ? (extractYouTubeId(value) ?? value.trim()) : value),
        ],
      },
      validate: (value: string | null | undefined, { siblingData }: { siblingData: { type?: string } }) => {
        if (siblingData?.type !== "video") return true;
        if (!value) return "Requis pour un projet vidéo.";
        return isYouTubeId(value) || "URL ou identifiant YouTube invalide.";
      },
    },
    {
      name: "externalUrl",
      type: "text",
      label: "Adresse du site",
      admin: { condition: (_, siblingData) => siblingData?.type === "website" },
      validate: (value: string | null | undefined, { siblingData }: { siblingData: { type?: string } }) => {
        if (siblingData?.type !== "website") return true;
        if (!value) return "Requis pour un projet site web.";
        return /^https?:\/\/\S+$/i.test(value) || "Adresse invalide (doit commencer par https://).";
      },
    },
    {
      name: "pdf",
      type: "upload",
      relationTo: "media",
      label: "Fichier PDF",
      filterOptions: { mimeType: { equals: "application/pdf" } },
      admin: { condition: (_, siblingData) => siblingData?.type === "pdf" },
      validate: (value: unknown, { siblingData }: { siblingData: { type?: string } }) =>
        siblingData?.type !== "pdf" || Boolean(value) || "Requis pour un projet PDF.",
    },
    {
      name: "cover",
      type: "upload",
      relationTo: "media",
      label: "Image de couverture",
      filterOptions: { mimeType: { contains: "image/" } },
      admin: {
        description: "Optionnelle pour une vidéo (la miniature YouTube est utilisée par défaut).",
      },
      validate: (value: unknown, { siblingData }: { siblingData: { type?: string } }) =>
        siblingData?.type === "video" || Boolean(value) || "Image de couverture requise.",
    },
    {
      name: "showOnHome",
      type: "checkbox",
      defaultValue: false,
      label: "Afficher sur l'accueil",
      admin: { position: "sidebar" },
    },
  ],
};
```

Si TypeScript refuse la signature explicite d'un `validate` : supprimez les annotations
de type des deux paramètres (`(value, { siblingData }) => …`). Le typage contextuel de
Payload prend alors le relais. Gardez le corps de la fonction tel quel.

- [ ] **Étape 6 : commit**

Le contrôle de type se fait à la tâche 6, une fois la configuration branchée.

```bash
git add src/collections
git commit -m "$(cat <<'EOF'
Collections Payload : Users, Media, Realisations

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Tâche 6 : configuration Payload, routes admin et API, `next.config`

**Fichiers :**
- Créer : `src/payload.config.ts`, `src/components/admin/Logo.tsx`,
  `src/components/admin/Icon.tsx`.
- Créer sous `src/app/(payload)/` : `layout.tsx`, `custom.scss`, `admin/importMap.js`,
  `admin/[[...segments]]/page.tsx`, `admin/[[...segments]]/not-found.tsx`,
  `api/[...slug]/route.ts`.
- Modifier : `next.config.ts`, `eslint.config.mjs`.

- [ ] **Étape 1 : `src/payload.config.ts`, sans migrations ni `onInit` pour l'instant**

```ts
import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { fr } from "@payloadcms/translations/languages/fr";
import sharp from "sharp";
import { Users } from "./collections/Users";
import { Media } from "./collections/Media";
import { Realisations } from "./collections/Realisations";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";

export default buildConfig({
  serverURL,
  secret: process.env.PAYLOAD_SECRET || "",
  admin: {
    user: Users.slug,
    theme: "light",
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: " — Admin STRATETIC",
      robots: { index: false, follow: false },
    },
    components: {
      graphics: {
        Logo: "/components/admin/Logo#Logo",
        Icon: "/components/admin/Icon#Icon",
      },
    },
  },
  collections: [Realisations, Media, Users],
  i18n: { supportedLanguages: { fr }, fallbackLanguage: "fr" },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || `file:${path.resolve(process.cwd(), "data/stratetic.db")}`,
    },
    wal: true,
  }),
  // API REST seulement : GraphQL n'est pas utilisé (surface d'attaque en moins).
  graphQL: { disable: true },
  cors: [serverURL],
  csrf: [serverURL],
  sharp,
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
});
```

- [ ] **Étape 2 : logo et icône de l'admin**

`src/components/admin/Logo.tsx`, logo blanc pour le fond navy de l'écran de connexion :

```tsx
/* eslint-disable @next/next/no-img-element -- composant de l'admin Payload, hors pipeline next/image */
export function Logo() {
  return (
    <img
      src="/brand/Logo%20Stratetic%20New%20White-01.png"
      alt="STRATETIC"
      style={{ width: 240, maxWidth: "100%", height: "auto" }}
    />
  );
}
```

`src/components/admin/Icon.tsx` :

```tsx
/* eslint-disable @next/next/no-img-element -- composant de l'admin Payload, hors pipeline next/image */
export function Icon() {
  return (
    <img
      src="/brand/Icon%20Stratetic%20New-01.png"
      alt="STRATETIC"
      style={{ width: 28, height: 28, objectFit: "contain" }}
    />
  );
}
```

- [ ] **Étape 3 : fichiers Payload du groupe `(payload)`**

Ce sont les fichiers du modèle officiel Payload 3.91, sans GraphQL.

`src/app/(payload)/layout.tsx` :

```tsx
/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from "@payload-config";
import "@payloadcms/next/css";
import type { ServerFunctionClient } from "payload";
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";
import React from "react";

import { importMap } from "./admin/importMap.js";
import "./custom.scss";

type Args = {
  children: React.ReactNode;
};

const serverFunction: ServerFunctionClient = async function (args) {
  "use server";
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  });
};

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
);

export default Layout;
```

`src/app/(payload)/admin/[[...segments]]/page.tsx` :

```tsx
/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import type { Metadata } from "next";

import config from "@payload-config";
import { RootPage, generatePageMetadata } from "@payloadcms/next/views";
import { importMap } from "../importMap";

type Args = {
  params: Promise<{
    segments: string[];
  }>;
  searchParams: Promise<{
    [key: string]: string | string[];
  }>;
};

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams });

const Page = ({ params, searchParams }: Args) =>
  RootPage({ config, params, searchParams, importMap });

export default Page;
```

`src/app/(payload)/admin/[[...segments]]/not-found.tsx` :

```tsx
/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import type { Metadata } from "next";

import config from "@payload-config";
import { NotFoundPage, generatePageMetadata } from "@payloadcms/next/views";
import { importMap } from "../importMap";

type Args = {
  params: Promise<{
    segments: string[];
  }>;
  searchParams: Promise<{
    [key: string]: string | string[];
  }>;
};

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams });

const NotFound = ({ params, searchParams }: Args) =>
  NotFoundPage({ config, params, searchParams, importMap });

export default NotFound;
```

`src/app/(payload)/api/[...slug]/route.ts` :

```ts
/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from "@payload-config";
import "@payloadcms/next/css";
import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from "@payloadcms/next/routes";

export const GET = REST_GET(config);
export const POST = REST_POST(config);
export const DELETE = REST_DELETE(config);
export const PATCH = REST_PATCH(config);
export const PUT = REST_PUT(config);
export const OPTIONS = REST_OPTIONS(config);
```

`src/app/(payload)/admin/importMap.js` : version de départ, régénérée à l'étape 7.

```js
/** @type import('payload').ImportMap */
export const importMap = {};
```

`src/app/(payload)/custom.scss` :

```scss
// Habillage Stratetic de l'admin Payload (navy #0d2438, olive #96b912).
@layer payload {
  // Écran de connexion : fond navy sous le logo blanc.
  .template-minimal {
    background-color: #0d2438;
  }

  :root {
    --theme-success-500: #96b912;
  }
}
```

- [ ] **Étape 4 : envelopper `next.config.ts`**

Remplacez la première ligne :

```ts
import type { NextConfig } from "next";
```

par :

```ts
import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";
```

Puis remplacez la dernière ligne :

```ts
export default nextConfig;
```

par :

```ts
export default withPayload(nextConfig, { devBundleServerPackages: false });
```

- [ ] **Étape 5 : exclure les fichiers générés du lint**

Dans `eslint.config.mjs`, ajoutez dans `globalIgnores([...])`, après `"facturation/**",` :

```js
    // Fichiers générés par Payload
    "src/payload-types.ts",
    "src/migrations/**",
    "src/app/(payload)/admin/importMap.js",
```

- [ ] **Étape 6 : générer les types**

```bash
npm run payload -- generate:types
ls -la src/payload-types.ts && grep -n "export interface Realisation\b\|export interface Media\b" src/payload-types.ts
```

Attendu : le fichier existe et déclare `export interface Realisation {` et
`export interface Media {`.

- [ ] **Étape 7 : régénérer l'import map**

Elle doit contenir les composants Logo et Icon.

```bash
npm run payload -- generate:importmap
grep -n "Logo\|Icon" "src/app/(payload)/admin/importMap.js"
```

Attendu : deux entrées, `/components/admin/Logo#Logo` et `/components/admin/Icon#Icon`.

- [ ] **Étape 8 : contrôle de type et build**

```bash
npx tsc --noEmit 2>&1 | head -30
npm run build 2>&1 | tail -30
```

Attendu : `tsc` sans erreur. Le build réussit et liste `/admin/[[...segments]]` et
`/api/[...slug]` en dynamique (ƒ).

En cas d'erreur de type sur un `validate`, appliquez la consigne de la tâche 5, étape 5.

- [ ] **Étape 9 : vérifier l'admin en dev**

Lancez le serveur de dev avec `preview_start` (configuration `dev` de
`.claude/launch.json`), puis :

```bash
curl -s -L -o /dev/null -w "%{http_code} %{url_effective}\n" http://localhost:3000/admin
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
```

Attendu :
- `/admin` répond `200` après redirection vers `/admin/create-first-user`. C'est
  normal, la tâche 7 ajoute la création automatique. Ne créez **pas** de compte à la
  main.
- `/` répond `200`.

`data/stratetic.db` a été créé : en dev, Payload pousse le schéma automatiquement.

- [ ] **Étape 10 : commit**

```bash
git add src/payload.config.ts src/payload-types.ts src/components/admin "src/app/(payload)" next.config.ts eslint.config.mjs
git commit -m "$(cat <<'EOF'
Admin Payload à /admin : config SQLite, routes, habillage Stratetic

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Tâche 7 : création de l'admin, import initial et initialisation au démarrage

**Fichiers :**
- Créer : `src/seed/ensureAdmin.ts`, `src/seed/realisations-data.ts`,
  `src/seed/seedRealisations.ts`, `src/seed/onInit.ts`, `src/instrumentation.ts`.
- Modifier : `src/payload.config.ts`.

- [ ] **Étape 1 : `src/seed/ensureAdmin.ts`**

```ts
import type { Payload } from "payload";

/**
 * Crée le premier administrateur depuis l'environnement si la base n'en a aucun.
 * Ainsi, l'écran public « créer le premier utilisateur » n'est jamais exposé.
 */
export async function ensureAdmin(payload: Payload): Promise<void> {
  const { totalDocs } = await payload.count({ collection: "users" });
  if (totalDocs > 0) return;

  const email = process.env.INITIAL_ADMIN_EMAIL;
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "[admin] Aucun administrateur en base : définissez INITIAL_ADMIN_EMAIL et INITIAL_ADMIN_PASSWORD, puis redémarrez.",
    );
  }

  await payload.create({ collection: "users", data: { email, password } });
  payload.logger.info(`[admin] Compte administrateur créé : ${email}`);
}
```

- [ ] **Étape 2 : `src/seed/realisations-data.ts`**

C'est la copie fidèle des 9 projets de `src/app/(site)/realisations/page.tsx`, dans le
même ordre.

```ts
// Données de l'import initial : les 9 projets du site avant l'admin, dans l'ordre d'affichage.
export type SeedProject = {
  slug: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  type: "video" | "website" | "pdf";
  youtubeId?: string;
  externalUrl?: string;
  /** Chemin relatif à public/ — envoyé dans la médiathèque. */
  coverFile?: string;
  /** Chemin relatif à public/ — envoyé dans la médiathèque. */
  pdfFile?: string;
  showOnHome: boolean;
};

export const SEED_PROJECTS: SeedProject[] = [
  {
    slug: "cds-niger",
    title: "CDS Niger — Forum FIER/JNER 2026",
    category: "Énergie · Privé",
    description:
      "Campagne complète pour le forum sur les énergies renouvelables. Spot audiovisuel, 7 supports print et déclinaisons réseaux sociaux.",
    tags: ["Spot vidéo", "Print & display", "Réseaux sociaux"],
    type: "video",
    youtubeId: "7KosqdnyWXk",
    showOnHome: true,
  },
  {
    slug: "arise-mali",
    title: "ARISE / Keneya Yiriwali (Mali)",
    category: "ONG · Santé publique",
    description:
      "Site de présentation du programme de santé — conception UX/UI et développement sur mesure pour une double audience bailleurs et terrain.",
    tags: ["Site web", "UX/UI Design", "Développement sur mesure"],
    type: "website",
    externalUrl: "https://arisekeneya.org/",
    coverFile: "images/site/Siteweb_Arise.jpg",
    showOnHome: true,
  },
  {
    slug: "niger-emploi",
    title: "Niger Emploi — Spot publicitaire",
    category: "Digital · Emploi",
    description:
      "Spot dynamique multi-formats pour la principale plateforme d'offres d'emploi du Niger.",
    tags: ["Spot vidéo", "Multi-formats", "Motion design"],
    type: "video",
    youtubeId: "1UfF72OEsmM",
    showOnHome: true,
  },
  {
    slug: "ansi",
    title: "ANSI — Table ronde des bailleurs, Paris",
    category: "Institution publique",
    description:
      "Spot institutionnel haute exigence, projeté lors de la table ronde internationale pour la transformation numérique du Niger.",
    tags: ["Film institutionnel", "Diffusion internationale"],
    type: "video",
    youtubeId: "NjAKRQmZIbQ",
    showOnHome: true,
  },
  {
    slug: "cipmen",
    title: "CIPMEN — Film entrepreneuriat",
    category: "Entrepreneuriat · Niger",
    description:
      "Film documentaire sur les parcours d'entrepreneurs accompagnés par le centre d'incubation nigérien.",
    tags: ["Film documentaire", "Tournage Niger"],
    type: "video",
    youtubeId: "7e2KbO8m21Q",
    showOnHome: true,
  },
  {
    slug: "complait",
    title: "COMPLAIT — Spot publicitaire",
    category: "Communication · Spot",
    description:
      "Spot court et percutant conçu et produit de A à Z — concept, tournage, montage et motion design.",
    tags: ["Spot vidéo", "Motion design"],
    type: "video",
    youtubeId: "_AplCctINfE",
    showOnHome: true,
  },
  {
    slug: "2scale-snv",
    title: "2Scale / SNV — Success Story",
    category: "Agribusiness · ONG",
    description:
      "Film de success story pour le programme d'agribusiness inclusif SNV, aux standards de reporting bailleurs internationaux.",
    tags: ["Success story", "Terrain Niger", "Bailleurs"],
    type: "video",
    youtubeId: "QhqzRDhcfck",
    showOnHome: true,
  },
  {
    slug: "aet",
    title: "AET — Projet PISCCA, Niamey",
    category: "Social · Genre · Niger",
    description:
      "Retour vidéo sur le plaidoyer mené auprès de 50 filles-mères et mères célibataires — débats télévisés, radios communautaires en haoussa, société civile et autorités locales.",
    tags: ["Film documentaire", "Plaidoyer", "Droits des femmes"],
    type: "video",
    youtubeId: "KPwU07osF80",
    showOnHome: true,
  },
  {
    slug: "cptp-catalogue",
    title: "CPTP — Catalogue des formations 2026",
    category: "Institution publique · Formation",
    description:
      "Conception graphique et mise en page du catalogue annuel des formations du Centre de Perfectionnement des Travaux Publics de Niamey — direction artistique complète, de la couverture au dernier module.",
    tags: ["Design graphique", "Mise en page", "Catalogue institutionnel"],
    type: "pdf",
    coverFile: "images/site/catalogue-cptp-cover.webp",
    pdfFile: "documents/catalogue-formations-cptp-2026.pdf",
    showOnHome: false,
  },
];
```

- [ ] **Étape 3 : `src/seed/seedRealisations.ts`**

```ts
import path from "path";
import type { Payload } from "payload";
import { SEED_PROJECTS } from "./realisations-data";

/**
 * Import initial, idempotent : ne fait rien si la collection a déjà des documents.
 * Création séquentielle → le hook « orderable » attribue l'ordre d'affichage.
 */
export async function seedRealisations(payload: Payload): Promise<void> {
  const { totalDocs } = await payload.count({ collection: "realisations" });
  if (totalDocs > 0) return;

  const publicDir = path.resolve(process.cwd(), "public");
  const context = { disableRevalidate: true };

  for (const project of SEED_PROJECTS) {
    const cover = project.coverFile
      ? await payload.create({
          collection: "media",
          data: { alt: project.title },
          filePath: path.join(publicDir, project.coverFile),
          context,
        })
      : null;
    const pdf = project.pdfFile
      ? await payload.create({
          collection: "media",
          data: { alt: `${project.title} (PDF)` },
          filePath: path.join(publicDir, project.pdfFile),
          context,
        })
      : null;

    await payload.create({
      collection: "realisations",
      context,
      data: {
        title: project.title,
        slug: project.slug,
        category: project.category,
        description: project.description,
        tags: project.tags.map((label) => ({ label })),
        type: project.type,
        youtubeId: project.youtubeId,
        externalUrl: project.externalUrl,
        cover: cover?.id,
        pdf: pdf?.id,
        showOnHome: project.showOnHome,
        _status: "published",
      },
    });
  }

  payload.logger.info(`[seed] ${SEED_PROJECTS.length} réalisations importées.`);
}
```

- [ ] **Étape 4 : `src/seed/onInit.ts`**

```ts
import type { Payload } from "payload";
import { ensureAdmin } from "./ensureAdmin";
import { seedRealisations } from "./seedRealisations";

export async function onInit(payload: Payload): Promise<void> {
  await ensureAdmin(payload);
  await seedRealisations(payload);
}
```

- [ ] **Étape 5 : brancher `onInit` dans `src/payload.config.ts`**

Ajoutez l'import après celui de `Realisations` :

```ts
import { onInit } from "./seed/onInit";
```

Puis ajoutez la clé suivante juste après la ligne `typescript: { … },` :

```ts
  onInit,
```

- [ ] **Étape 6 : `src/instrumentation.ts`**

Payload s'initialise au démarrage du serveur, et non à la première visite. Les
migrations, la création de l'admin et l'import ont donc lieu avant toute requête.

```ts
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  // Pas de base pendant `next build` (build Docker) : on n'initialise rien.
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const { getPayload } = await import("payload");
  const { default: config } = await import("@payload-config");
  try {
    await getPayload({ config });
  } catch (error) {
    console.error("[payload] Échec de l'initialisation :", error);
    // En prod, le conteneur s'arrête : l'échec est visible dans Coolify.
    if (process.env.NODE_ENV === "production") process.exit(1);
    throw error;
  }
}
```

- [ ] **Étape 7 : vérifier sur une base vierge**

Arrêtez le serveur de dev (`preview_stop`), puis repartez d'une base vide :

```bash
rm -rf data && mkdir -p data/media
```

Relancez `preview_start` (configuration `dev`), puis lisez les logs avec
`preview_logs`, recherche `[admin]` puis `[seed]`.

Attendu :
- `[admin] Compte administrateur créé : admin@stratetic.local`
- `[seed] 9 réalisations importées.`

```bash
ls data/media | head -20
curl -s "http://localhost:3000/api/realisations?limit=20&depth=0&sort=_order" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log(j.totalDocs, j.docs.map(d=>d.slug).join(','))})"
```

Attendu :
- `data/media` contient `Siteweb_Arise.jpg`, `catalogue-cptp-cover.webp`,
  `catalogue-formations-cptp-2026.pdf` et leurs variantes `-400x…`, `-960x…`,
  `-1920x…` en `.webp`. Les variantes de taille supérieure à l'original peuvent être
  absentes.
- La requête curl affiche `9` puis
  `cds-niger,arise-mali,niger-emploi,ansi,cipmen,complait,2scale-snv,aet,cptp-catalogue`.

- [ ] **Étape 8 : vérifier l'idempotence**

Redémarrez le serveur de dev (`preview_stop` puis `preview_start`) et relancez la
requête curl de l'étape 7. Attendu : toujours `9`. Les logs ne montrent ni
`[admin] Compte administrateur créé` ni `[seed]`.

- [ ] **Étape 9 : vérifier la connexion à l'admin**

Dans le navigateur intégré, ouvrez `http://localhost:3000/admin`. Attendu : l'écran de
connexion (fond navy, logo blanc), et **pas** l'écran « créer le premier utilisateur ».

Connectez-vous avec `INITIAL_ADMIN_EMAIL` et `INITIAL_ADMIN_PASSWORD` du `.env`, en
lisant le fichier sans afficher le mot de passe dans le chat. Attendu :
- la liste « Réalisations » montre les 9 projets, tous en « Publié » ;
- le groupe « Contenu » contient Réalisations et Médias ;
- le groupe « Réglages » contient Administrateurs.

- [ ] **Étape 10 : commit**

```bash
git add src/seed src/instrumentation.ts src/payload.config.ts
git commit -m "$(cat <<'EOF'
Admin créé depuis l'environnement + import initial des 9 réalisations

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Tâche 8 : couche de lecture `src/lib/realisations.ts`

**Fichiers :** créer `src/lib/realisations.ts`.

- [ ] **Étape 1 : écrire le module**

```ts
import { unstable_cache } from "next/cache";
import { getPayload } from "payload";
import config from "@payload-config";
import type { Media, Realisation } from "@/payload-types";
import { youTubeThumbnail } from "@/lib/youtube";
import { REALISATIONS_TAG } from "@/collections/hooks/revalidate";

/** Vue d'une réalisation pour le site : découple les composants de Payload. */
export type RealisationView = {
  slug: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  type: "video" | "website" | "pdf";
  youtubeId?: string;
  externalUrl?: string;
  pdfUrl?: string;
  /** Couverture résolue : image envoyée, sinon miniature YouTube. */
  coverUrl: string;
  coverAlt: string;
  showOnHome: boolean;
};

function asMedia(value: number | Media | null | undefined): Media | null {
  return value && typeof value === "object" ? value : null;
}

export function toView(doc: Realisation): RealisationView | null {
  const cover = asMedia(doc.cover);
  const pdf = asMedia(doc.pdf);
  const coverUrl =
    cover?.sizes?.card?.url ||
    cover?.url ||
    (doc.youtubeId ? youTubeThumbnail(doc.youtubeId) : null);
  // Un projet sans visuel ne peut pas s'afficher proprement : on l'écarte.
  if (!coverUrl) return null;

  return {
    slug: doc.slug || String(doc.id),
    title: doc.title,
    category: doc.category ?? "",
    description: doc.description,
    tags: (doc.tags ?? []).map((tag) => tag.label),
    type: doc.type,
    youtubeId: doc.youtubeId ?? undefined,
    externalUrl: doc.externalUrl ?? undefined,
    pdfUrl: pdf?.url ?? undefined,
    coverUrl,
    coverAlt: cover?.alt || doc.title,
    showOnHome: Boolean(doc.showOnHome),
  };
}

async function fetchRealisations(): Promise<RealisationView[]> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "realisations",
    where: { _status: { equals: "published" } },
    sort: "_order",
    depth: 1,
    pagination: false,
  });
  return docs.map(toView).filter((view): view is RealisationView => view !== null);
}

/** Tous les projets publiés, dans l'ordre de l'admin. Invalidé par les hooks Payload. */
export const getRealisations = unstable_cache(fetchRealisations, ["realisations"], {
  tags: [REALISATIONS_TAG],
});

/** Projets publiés cochés « Afficher sur l'accueil ». */
export async function getHomeRealisations(): Promise<RealisationView[]> {
  return (await getRealisations()).filter((project) => project.showOnHome);
}
```

- [ ] **Étape 2 : contrôle de type**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Attendu : aucune erreur.

Si `doc.type` est typé `string | null` dans `payload-types.ts` et non comme une union,
remplacez `type: doc.type,` par `type: doc.type as RealisationView["type"],`. Le champ
est `required`, la valeur est donc toujours présente.

- [ ] **Étape 3 : commit**

```bash
git add src/lib/realisations.ts
git commit -m "$(cat <<'EOF'
Lecture des réalisations en cache, invalidée par l'admin

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Tâche 9 : brancher l'accueil (`WorkGallery`)

**Fichiers :**
- Modifier : `src/components/sections/WorkGallery.tsx` (réécriture complète),
  `src/app/(site)/page.tsx`, `src/types/content.ts`.

- [ ] **Étape 1 : réécrire `src/components/sections/WorkGallery.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { PlayIcon, CloseIcon } from "@/components/icons";
import { Reveal } from "@/components/motion/Reveal";
import { titreProjets } from "@/lib/nombres";
import type { RealisationView } from "@/lib/realisations";

const ACTION_LABEL: Record<RealisationView["type"], string> = {
  video: "▶ Regarder le film",
  website: "Visiter le site →",
  pdf: "Feuilleter le document →",
};

function CardShell({
  project,
  onPlay,
}: {
  project: RealisationView;
  onPlay: (youtubeId: string) => void;
}) {
  // Texte superposé DANS la carte : la hauteur totale = la hauteur d'image,
  // rien ne peut déborder. Vidéo → lightbox YouTube ; site → lien externe ;
  // PDF → livret feuilletable sur /realisations.
  const content = (
    <>
      <Image
        src={project.coverUrl}
        alt={project.coverAlt}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="(min-width: 1280px) 24vw, (min-width: 768px) 46vw, 92vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
      <div className="absolute top-4 left-4 flex items-center justify-center w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm group-hover:bg-brand-olive transition-colors">
        <PlayIcon className="h-4 w-4 text-white" />
      </div>
      <div className="absolute inset-x-0 bottom-0 p-5 text-left">
        <h3 className="font-heading uppercase text-base md:text-lg text-white line-clamp-2">
          {project.title}
        </h3>
        <p className="text-white/70 text-sm mt-1.5 line-clamp-2">
          {project.description}
        </p>
        <span className="inline-block text-brand-olive text-xs font-semibold uppercase tracking-wide mt-2 group-hover:underline">
          {ACTION_LABEL[project.type]}
        </span>
      </div>
    </>
  );

  const shellClass =
    "group relative block w-full aspect-video rounded-2xl overflow-hidden bg-white/5 border border-white/10 cursor-pointer";

  if (project.type === "video" && project.youtubeId) {
    const youtubeId = project.youtubeId;
    return (
      <button
        type="button"
        onClick={() => onPlay(youtubeId)}
        aria-label={`Regarder le film : ${project.title}`}
        className={shellClass}
      >
        {content}
      </button>
    );
  }
  if (project.type === "website" && project.externalUrl) {
    return (
      <a
        href={project.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Visiter le site : ${project.title}`}
        className={shellClass}
      >
        {content}
      </a>
    );
  }
  return (
    <a
      href={`/realisations#${project.slug}`}
      aria-label={`Voir le projet : ${project.title}`}
      className={shellClass}
    >
      {content}
    </a>
  );
}

export function WorkGallery({ projects }: { projects: RealisationView[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox]);

  // Aucun projet publié pour l'accueil : la section disparaît.
  if (projects.length === 0) return null;

  return (
    <section id="realisations" className="bg-brand-navy text-white py-20 px-6 md:px-10">
      <div className="max-w-[1600px] mx-auto">
        <Reveal>
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="uppercase tracking-widest text-sm text-white/70">
                Nos réalisations
              </p>
              <h2 className="font-heading uppercase text-3xl md:text-4xl leading-tight mt-3">
                {titreProjets(projects.length)}
              </h2>
            </div>
            <a
              href="/realisations"
              className="bg-gradient-accent text-white rounded-full px-6 py-3 font-heading uppercase text-sm shrink-0"
            >
              Tous les projets
            </a>
          </div>
          <div className="border-b border-white/20 mt-6" />
        </Reveal>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mt-10">
          {projects.map((project, i) => (
            <Reveal key={project.slug} delay={(i % 4) * 70}>
              <CardShell project={project} onPlay={setLightbox} />
            </Reveal>
          ))}
        </div>
      </div>

      {/* Lightbox YouTube */}
      {lightbox && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            aria-label="Fermer la vidéo"
            onClick={() => setLightbox(null)}
            className="absolute top-6 right-6 w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/25 transition-colors"
          >
            <CloseIcon className="size-5" />
          </button>
          <div
            className="w-full max-w-5xl aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              title="Film STRATETIC"
              src={`https://www.youtube-nocookie.com/embed/${lightbox}?autoplay=1&rel=0`}
              className="w-full h-full"
              style={{ border: 0 }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </section>
  );
}

export default WorkGallery;
```

`WorkGallery` est un Client Component. Il importe `RealisationView` en `import type`,
ce qui est effacé à la compilation : le code serveur de `src/lib/realisations.ts`
(Payload) n'entre donc pas dans le bundle client.

- [ ] **Étape 2 : rendre l'accueil dynamique et lui passer les projets**

Dans `src/app/(site)/page.tsx`, ajoutez en tête des imports :

```tsx
import { connection } from "next/server";
import { getHomeRealisations } from "@/lib/realisations";
```

Remplacez :

```tsx
export default function Home() {
  return (
```

par :

```tsx
export default async function Home() {
  // Rendu à la requête : la base n'existe pas pendant le build Docker.
  await connection();
  const projects = await getHomeRealisations();

  return (
```

Et remplacez :

```tsx
        <WorkGallery />
```

par :

```tsx
        <WorkGallery projects={projects} />
```

- [ ] **Étape 3 : supprimer le type `CaseStudy` devenu inutile**

Dans `src/types/content.ts`, supprimez ce bloc :

```ts
export interface CaseStudy {
  title: string;
  description: string;
  placeholderLabel: string;
}

```

```bash
grep -rn "CaseStudy" src
```

Attendu : aucune sortie.

- [ ] **Étape 4 : contrôle de type et vérification en dev**

```bash
npx tsc --noEmit 2>&1 | head -20
curl -s http://localhost:3000/ | grep -o "Huit projets, huit univers\|ytimg.com/vi/[A-Za-z0-9_-]*\|/api/media/file/[^\"]*" | sort -u
```

Attendu :
- `tsc` sans erreur ;
- `Huit projets, huit univers` ;
- 7 URLs `ytimg.com/vi/…` ;
- une URL `/api/media/file/Siteweb_Arise-960x….webp` (couverture d'ARISE) ;
- pas de CPTP, qui n'est pas affiché sur l'accueil.

- [ ] **Étape 5 : commit**

```bash
git add src/components/sections/WorkGallery.tsx "src/app/(site)/page.tsx" src/types/content.ts
git commit -m "$(cat <<'EOF'
Accueil : « Nos réalisations » alimenté par l'admin

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Tâche 10 : brancher la page `/realisations`

**Fichiers :** modifier `src/app/(site)/realisations/page.tsx` (réécriture complète).

- [ ] **Étape 1 : réécrire la page**

```tsx
import type { Metadata } from "next";
import Image from "next/image";
import { connection } from "next/server";
import { HeaderNav } from "@/components/sections/HeaderNav";
import { PageHero } from "@/components/sections/PageHero";
import { CtaFooter } from "@/components/sections/CtaFooter";
import { TestimonialsSection } from "@/components/sections/BlogTestimonials";
import { Reveal } from "@/components/motion/Reveal";
import { PdfBooklet } from "@/components/sections/PdfBookletLazy";
import { getRealisations } from "@/lib/realisations";
import { nombreEnLettres, titreProjets } from "@/lib/nombres";

export const metadata: Metadata = {
  title: "Réalisations — STRATETIC",
  description:
    "Spots, documentaires, sites web, campagnes complètes : plus de 100 projets livrés pour des ONG, entreprises et institutions au Niger, au Sahel et au-delà.",
};

export default async function RealisationsPage() {
  // Rendu à la requête : la base n'existe pas pendant le build Docker.
  await connection();
  const projects = await getRealisations();
  const n = projects.length;

  return (
    <>
      <HeaderNav />
      <main className="flex-1">
        <PageHero
          eyebrow="Réalisations"
          title={n > 0 ? `${titreProjets(n)}.` : "Nos réalisations."}
          intro={
            n > 0
              ? `Plus de 100 projets livrés depuis 2013 pour des ONG, entreprises et institutions. En voici ${nombreEnLettres(n)} qui ${n === 1 ? "raconte" : "racontent"} l'étendue de ce qu'on sait faire.`
              : "Plus de 100 projets livrés depuis 2013 pour des ONG, entreprises et institutions."
          }
        />

        <section className="bg-brand-offwhite py-24 px-6 md:px-10">
          {n === 0 ? (
            <p className="max-w-[1600px] mx-auto text-center text-muted-foreground">
              Nos projets arrivent bientôt.
            </p>
          ) : (
            <div className="max-w-[1600px] mx-auto grid md:grid-cols-2 gap-10">
              {projects.map((project, i) => (
                <Reveal key={project.slug} delay={i * 60}>
                  <article id={project.slug} className="h-full flex flex-col scroll-mt-28">
                    <div className="relative aspect-video rounded-2xl overflow-hidden border border-border bg-black">
                      {project.type === "video" && project.youtubeId ? (
                        <iframe
                          title={`Film : ${project.title}`}
                          src={`https://www.youtube-nocookie.com/embed/${project.youtubeId}?rel=0`}
                          className="absolute inset-0 w-full h-full"
                          style={{ border: 0 }}
                          loading="lazy"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      ) : project.type === "pdf" && project.pdfUrl ? (
                        <PdfBooklet
                          pdfUrl={project.pdfUrl}
                          coverImage={project.coverUrl}
                          title={project.title}
                        />
                      ) : (
                        <a
                          href={project.externalUrl ?? "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Visiter le site : ${project.title}`}
                          className="group block absolute inset-0"
                        >
                          <Image
                            src={project.coverUrl}
                            alt={project.coverAlt}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(min-width: 768px) 45vw, 90vw"
                          />
                          <span className="absolute bottom-4 left-4 bg-gradient-accent text-white text-xs font-heading uppercase px-4 py-2 rounded-full">
                            Visiter le site →
                          </span>
                        </a>
                      )}
                    </div>
                    <p className="uppercase tracking-widest text-xs text-brand-olive mt-5">
                      {project.category}
                    </p>
                    <h2 className="font-heading uppercase text-xl md:text-2xl mt-2">
                      {project.title}
                    </h2>
                    <p className="text-muted-foreground text-sm mt-2">
                      {project.description}
                    </p>
                    <ul className="flex flex-wrap gap-2 mt-4">
                      {project.tags.map((tag) => (
                        <li
                          key={tag}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-brand-navy/5 border border-border text-brand-navy"
                        >
                          {tag}
                        </li>
                      ))}
                    </ul>
                  </article>
                </Reveal>
              ))}
            </div>
          )}
        </section>

        {/* Le meilleur du nouveau site : la preuve sociale à côté du travail. */}
        <TestimonialsSection />

        <CtaFooter />
      </main>
    </>
  );
}
```

- [ ] **Étape 2 : vérifier les props de `PdfBooklet`**

```bash
grep -n "pdfUrl\|coverImage\|title" src/components/sections/PdfBookletLazy.tsx | head
```

Attendu : le composant accepte bien `pdfUrl`, `coverImage` et `title`, comme dans
l'ancienne page.

- [ ] **Étape 3 : contrôle de type et vérification en dev**

```bash
npx tsc --noEmit 2>&1 | head -20
curl -s http://localhost:3000/realisations | grep -o "Neuf projets, neuf univers\.\|En voici neuf qui racontent\|youtube-nocookie.com/embed/[A-Za-z0-9_-]*\|id=\"[a-z0-9-]*\"" | sort -u
```

Attendu :
- `tsc` sans erreur ;
- le titre `Neuf projets, neuf univers.` et la phrase `En voici neuf qui racontent` ;
- 7 iframes `embed/…` ;
- les 9 ancres `id="cds-niger"` … `id="cptp-catalogue"`.

Dans le navigateur intégré, ouvrez `http://localhost:3000/realisations#cptp-catalogue`
et vérifiez que le livret PDF s'ouvre et se feuillette. Il charge
`/api/media/file/catalogue-formations-cptp-2026.pdf`.

- [ ] **Étape 4 : commit**

```bash
git add "src/app/(site)/realisations/page.tsx"
git commit -m "$(cat <<'EOF'
Page /realisations alimentée par l'admin

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Tâche 11 : vérifier le cycle admin → site sans redéploiement

Aucun fichier modifié : c'est une vérification de bout en bout, en dev, dans le
navigateur intégré, connecté à l'admin.

- [ ] **Étape 1 : création**

Dans l'admin, créez une réalisation :
- titre `Test admin`, description `Projet de test` ;
- type Vidéo ;
- dans le champ YouTube, collez `https://www.youtube.com/watch?v=7KosqdnyWXk&t=10s` ;
- cochez « Afficher sur l'accueil » ;
- cliquez sur **Publier**.

Attendu : le champ YouTube affiche `7KosqdnyWXk` après l'enregistrement, et le slug vaut
`test-admin`.

```bash
curl -s http://localhost:3000/ | grep -o "Neuf projets, neuf univers\|Test admin" | sort -u
```

Attendu : `Neuf projets, neuf univers` et `Test admin`.

- [ ] **Étape 2 : validation**

Dans un nouveau projet de type Vidéo, saisissez `https://vimeo.com/123` puis cliquez sur
Publier. Attendu : l'erreur « URL ou identifiant YouTube invalide. » et aucun
enregistrement. Abandonnez ce brouillon.

- [ ] **Étape 3 : réordonner**

Dans la liste Réalisations, triez par ordre (poignée de glisser-déposer) et faites
glisser `Test admin` en première position.

```bash
curl -s http://localhost:3000/realisations | grep -o 'id="[a-z0-9-]*"' | head -2
```

Attendu : `id="test-admin"` en premier.

- [ ] **Étape 4 : retirer de l'accueil**

Décochez « Afficher sur l'accueil » sur `Test admin` et publiez.

```bash
curl -s http://localhost:3000/ | grep -c "Test admin"
```

Attendu : `0`.

- [ ] **Étape 5 : brouillon**

Repassez `Test admin` en brouillon (action « Dépublier »).

```bash
curl -s http://localhost:3000/realisations | grep -c "Test admin"
curl -s "http://localhost:3000/api/realisations?where[slug][equals]=test-admin" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).totalDocs))"
```

Attendu : `0` puis `0`. Hors connexion, l'API ne renvoie pas les brouillons.

- [ ] **Étape 6 : suppression**

Supprimez `Test admin`. Rechargez `/realisations` : le titre redevient
`Neuf projets, neuf univers.` et les 9 projets d'origine sont dans l'ordre d'origine.

- [ ] **Étape 7 : verrouillage du compte**

Dans une fenêtre déconnectée, ratez 5 fois la connexion, avec le bon e-mail et un
mauvais mot de passe. Attendu : au 5ᵉ échec, un message de compte verrouillé.

Pour ne pas attendre 10 minutes, repartez d'une base neuve : arrêtez le serveur,
`rm -rf data && mkdir -p data/media`, relancez.

---

### Tâche 12 : migration initiale et `prodMigrations`

**Fichiers :**
- Créer : `src/migrations/*` (générés).
- Modifier : `src/payload.config.ts`.

- [ ] **Étape 1 : générer la migration initiale**

```bash
npm run payload -- migrate:create initial
ls src/migrations
```

Attendu : `index.ts`, plus un fichier `AAAAMMJJ_HHMMSS_initial.ts` et son `.json`.

Si la CLI demande une confirmation à propos du mode « push » de dev, répondez `y` : la
migration est calculée depuis la configuration, pas depuis la base locale.

- [ ] **Étape 2 : brancher `prodMigrations`**

Dans `src/payload.config.ts`, ajoutez l'import :

```ts
import { migrations } from "./migrations";
```

Puis remplacez le bloc `db` par :

```ts
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || `file:${path.resolve(process.cwd(), "data/stratetic.db")}`,
    },
    wal: true,
    // Appliquées au démarrage, en production uniquement (conteneur longue durée).
    prodMigrations: migrations,
  }),
```

- [ ] **Étape 3 : build**

```bash
npx tsc --noEmit 2>&1 | head -10
npm run build 2>&1 | tail -25
```

Attendu :
- aucune erreur ;
- `/` et `/realisations` en dynamique (ƒ) ;
- aucune ligne `[admin]` ni `[seed]` dans la sortie du build : `instrumentation.ts`
  ne tourne pas au build.

- [ ] **Étape 4 : commit**

```bash
git add src/migrations src/payload.config.ts
git commit -m "$(cat <<'EOF'
Migration initiale Payload appliquée au démarrage en production

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Tâche 13 : Dockerfile et script de sauvegarde

**Fichiers :**
- Créer : `scripts/backup-db.mjs`.
- Modifier : `Dockerfile`.

- [ ] **Étape 1 : `scripts/backup-db.mjs`**

```js
// Sauvegarde nocturne de la base SQLite (tâche planifiée Coolify).
// VACUUM INTO produit une copie cohérente même pendant des écritures.
// Usage : node scripts/backup-db.mjs
import { mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URI || "file:/data/stratetic.db";
const dir = process.env.BACKUP_DIR || "/data/backups";
const KEEP_DAYS = 14;

mkdirSync(dir, { recursive: true });
const target = path.join(dir, `stratetic-${new Date().toISOString().slice(0, 10)}.db`);
// VACUUM INTO échoue si le fichier cible existe déjà (relance le même jour).
rmSync(target, { force: true });

const client = createClient({ url });
await client.execute({ sql: "VACUUM INTO ?", args: [target] });
client.close();

const limit = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000;
for (const name of readdirSync(dir)) {
  const file = path.join(dir, name);
  if (/^stratetic-\d{4}-\d{2}-\d{2}\.db$/.test(name) && statSync(file).mtimeMs < limit) {
    rmSync(file);
  }
}
console.log(`[backup] ${target}`);
```

- [ ] **Étape 2 : tester le script en local**

```bash
DATABASE_URI=file:./data/stratetic.db BACKUP_DIR=./data/backups node scripts/backup-db.mjs
ls -la data/backups
```

Attendu : `[backup] data/backups/stratetic-AAAA-MM-JJ.db` et un fichier de quelques
centaines de Ko. Relancez la commande : pas d'erreur, le fichier est remplacé.

- [ ] **Étape 3 : modifier le `Dockerfile`**

Remplacez la ligne :

```dockerfile
FROM node:20-slim AS base
```

par :

```dockerfile
# Node 22 : version de référence de Payload 3 (>= 20.18.1 requis).
FROM node:22-slim AS base
```

Puis remplacez tout le bloc `# --- Runtime ---` jusqu'à la fin du fichier par :

```dockerfile
# --- Runtime ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Données Payload sur le volume Coolify monté sur /data.
ENV DATABASE_URI=file:/data/stratetic.db
ENV MEDIA_DIR=/data/media
ENV BACKUP_DIR=/data/backups

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs \
  && mkdir -p /data/media /data/backups \
  && chown -R nextjs:nodejs /data

# Le serveur autonome + les assets statiques + le dossier public.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Sauvegarde nocturne (tâche planifiée Coolify : node scripts/backup-db.mjs).
COPY --from=builder --chown=nextjs:nodejs /app/scripts/backup-db.mjs ./scripts/backup-db.mjs

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
```

Ne touchez pas aux étapes `deps` et `builder`. `npm install`, et non `npm ci`, reste
volontaire (voir `CLAUDE.md`).

- [ ] **Étape 4 : commit**

```bash
git add scripts/backup-db.mjs Dockerfile
git commit -m "$(cat <<'EOF'
Docker : Node 22, volume /data pour Payload, sauvegarde nocturne SQLite

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Tâche 14 : répétition de la production en local (standalone, base vide)

Aucun fichier modifié. Cette tâche reproduit le conteneur sans Docker.

- [ ] **Étape 1 : build de production**

Arrêtez le serveur de dev (`preview_stop`), puis :

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Étape 2 : assembler le dossier standalone comme dans le Dockerfile**

```bash
cp -r public .next/standalone/public
mkdir -p .next/standalone/.next .next/standalone/scripts
cp -r .next/static .next/standalone/.next/static
cp scripts/backup-db.mjs .next/standalone/scripts/
REPET="C:/Users/moula/AppData/Local/Temp/claude/D--STRATETIC-Nouveau-site-Stratetic/25d8449b-7cf1-4882-bc8b-aac6aae8b213/scratchpad/repet-data"
rm -rf "$REPET" && mkdir -p "$REPET/media" "$REPET/backups"
ls .next/standalone/node_modules/@libsql | head
```

Attendu : `@libsql/client` (et ses paquets voisins) figure dans le `node_modules` de
standalone. Le script de sauvegarde en dépend.

- [ ] **Étape 3 : démarrer en mode production sur la base vide**

Lancez en arrière-plan (`run_in_background: true`) :

```bash
cd .next/standalone && REPET="C:/Users/moula/AppData/Local/Temp/claude/D--STRATETIC-Nouveau-site-Stratetic/25d8449b-7cf1-4882-bc8b-aac6aae8b213/scratchpad/repet-data" && \
NODE_ENV=production PORT=3100 HOSTNAME=127.0.0.1 \
DATABASE_URI="file:$REPET/stratetic.db" MEDIA_DIR="$REPET/media" \
NEXT_PUBLIC_SERVER_URL=http://127.0.0.1:3100 \
PAYLOAD_SECRET=$(grep PAYLOAD_SECRET ../../.env | cut -d= -f2) \
INITIAL_ADMIN_EMAIL=admin@stratetic.local \
INITIAL_ADMIN_PASSWORD=$(grep INITIAL_ADMIN_PASSWORD ../../.env | cut -d= -f2) \
node server.js
```

Attendu dans la sortie :
- `Ready` ;
- les migrations appliquées (`Migrating: …_initial` puis `Migrated`) ;
- `[admin] Compte administrateur créé` ;
- `[seed] 9 réalisations importées.`

- [ ] **Étape 4 : vérifier les réponses**

```bash
for p in / /realisations /admin /a-propos /services /contact /blog; do
  printf "%s %s\n" "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3100$p)" "$p"
done
curl -s http://127.0.0.1:3100/ | grep -o "Huit projets, huit univers"
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1:3100/api/media/file/catalogue-formations-cptp-2026.pdf
```

Attendu :
- `200` partout ;
- `Huit projets, huit univers` ;
- `200 application/pdf`.

- [ ] **Étape 5 : vérifier la sauvegarde depuis standalone**

```bash
cd .next/standalone && REPET="C:/Users/moula/AppData/Local/Temp/claude/D--STRATETIC-Nouveau-site-Stratetic/25d8449b-7cf1-4882-bc8b-aac6aae8b213/scratchpad/repet-data" && \
DATABASE_URI="file:$REPET/stratetic.db" BACKUP_DIR="$REPET/backups" node scripts/backup-db.mjs
```

Attendu : `[backup] …/stratetic-AAAA-MM-JJ.db`.

- [ ] **Étape 6 : vérifier l'échec explicite sans identifiants admin**

Arrêtez le serveur. Videz `repet-data`, puis relancez la commande de l'étape 3
**sans** les deux lignes `INITIAL_ADMIN_*`.

Attendu : le processus s'arrête avec
`[admin] Aucun administrateur en base : définissez INITIAL_ADMIN_EMAIL et INITIAL_ADMIN_PASSWORD…`.

Arrêtez ensuite le processus s'il tourne encore.

- [ ] **Étape 7 : lint final**

```bash
npm run lint 2>&1 | tail -5
```

Attendu : pas plus d'erreurs que le relevé de la tâche 1, étape 1.

---

### Tâche 15 : documentation, configuration Coolify et mise en ligne

**Fichiers :** modifier `CLAUDE.md`.

- [ ] **Étape 1 : documenter l'admin dans `CLAUDE.md`**

Dans `CLAUDE.md`, remplacez le paragraphe de la section `### Pages & content` qui
commence par `- **Content is inline**` par :

```markdown
- **Content is inline** for most sections: each section/page declares `const` arrays/objects at the top of its own file, typed against `src/types/content.ts`. To change that copy, edit the component.
- **Exception — Réalisations come from the Payload admin** (`/admin`): `src/lib/realisations.ts` reads them via the Payload Local API behind `unstable_cache` (tag `realisations`), invalidated by the collection hooks in `src/collections/hooks/revalidate.ts`. Pages that read Payload call `await connection()` so `next build` never needs the DB.
```

Puis ajoutez, à la fin de la section `## Architecture` :

```markdown
### Admin (Payload CMS 3)

- Two root layouts via route groups: `src/app/(site)/` (the public site) and `src/app/(payload)/` (Payload admin + REST API — those files are Payload's generated boilerplate, don't edit them by hand).
- Config: `src/payload.config.ts`. Collections in `src/collections/`. SQLite via `@payloadcms/db-sqlite` (`DATABASE_URI`), uploads in `MEDIA_DIR`. Both live on the Coolify volume `/data` in production.
- `src/instrumentation.ts` initialises Payload at server start: migrations (`prodMigrations`, production only), `ensureAdmin` (first admin from `INITIAL_ADMIN_EMAIL`/`INITIAL_ADMIN_PASSWORD`), and the idempotent seed in `src/seed/`.
- After changing a collection: `npm run payload -- generate:types`, then `npm run payload -- migrate:create <name>` and commit `src/migrations/`. After adding an admin custom component: `npm run payload -- generate:importmap`.
- Local dev needs a `.env` (see `.env.example`) and a `data/` folder (gitignored).
```

Dans la section `## Deployment`, remplacez la ligne qui commence par
`` - `next.config.ts` sets `` par :

```markdown
- `next.config.ts` sets `output: "standalone"` and `images.unoptimized: true` (the site's own images are pre-sized `.webp` served as-is), wrapped in `withPayload`. `sharp` is installed **only for Payload**, which generates the admin-uploaded image variants.
```

Puis ajoutez :

```markdown
- Coolify needs a persistent volume on `/data` and the env vars `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`, `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD` (`DATABASE_URI`/`MEDIA_DIR` default to `/data/...` in the Dockerfile). Nightly backup = Coolify scheduled task `node scripts/backup-db.mjs`.
```

- [ ] **Étape 2 : commit et push de la branche, pas de `main`**

```bash
git add CLAUDE.md
git commit -m "$(cat <<'EOF'
Documentation de l'admin Payload

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
git push -u origin feat/admin-payload
```

Coolify ne surveille que `main` : ce push ne déclenche aucun déploiement.

- [ ] **Étape 3 : PAUSE — configuration Coolify par l'utilisateur**

Ne fusionnez pas dans `main` avant que l'utilisateur ait confirmé les réglages
suivants dans Coolify, sur l'application du site (`k918lmsto9atp3ltinuh4j02`).

Générez d'abord le secret à lui transmettre :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Réglages à confirmer :
1. **Persistent Storage** → ajouter un volume, chemin de destination `/data`.
2. **Environment Variables** :
   - `PAYLOAD_SECRET` = le secret généré, case *Is Secret* cochée ;
   - `NEXT_PUBLIC_SERVER_URL` = `https://stratetic.art`, disponible au build et au
     runtime ;
   - `INITIAL_ADMIN_EMAIL` = son e-mail ;
   - `INITIAL_ADMIN_PASSWORD` = un mot de passe provisoire, case *Is Secret* cochée.
3. **Healthcheck** : activé, chemin `/`, port `3000`. Un nouveau conteneur qui ne
   démarre pas ne remplace alors pas l'ancien.
4. **Scheduled Tasks** → nouvelle tâche :
   - commande `node scripts/backup-db.mjs` ;
   - fréquence `0 3 * * *` (3 h, heure de Niamey = UTC+1 → 2 h UTC) ;
   - conteneur : celui de l'application.

- [ ] **Étape 4 : fusionner et déployer**

À faire seulement après la confirmation explicite de l'étape 3.

```bash
git checkout main
git merge --no-ff feat/admin-payload -m "Espace admin Payload : socle + Réalisations"
git push origin main
```

Puis suivez le déploiement, qui dure plusieurs minutes (build Payload) :

```bash
i=0; until curl -s -o /dev/null -w "%{http_code}" https://stratetic.art/admin | grep -q 200; do i=$((i+1)); [ $i -ge 40 ] && echo TIMEOUT && break; sleep 15; done; echo fin
```

- [ ] **Étape 5 : vérifier la production**

```bash
for p in / /realisations /admin /a-propos /services /contact /blog; do
  printf "%s %s\n" "$(curl -s -o /dev/null -w '%{http_code}' https://stratetic.art$p)" "$p"
done
curl -s https://stratetic.art/ | grep -o "Huit projets, huit univers"
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" https://stratetic.art/api/media/file/catalogue-formations-cptp-2026.pdf
```

Attendu : `200` partout, `Huit projets, huit univers`, et `200 application/pdf`.

Ensuite, l'utilisateur :
- se connecte à `https://stratetic.art/admin` ;
- change son mot de passe provisoire ;
- modifie la description d'un projet, puis vérifie que le site la reflète sans
  redéploiement.

Il peut alors supprimer `INITIAL_ADMIN_PASSWORD` de Coolify, qui ne sert qu'au tout
premier démarrage.

- [ ] **Étape 6 : mémoire du projet**

Mettez à jour la mémoire `stratetic-deploiement-coolify` :
- volume `/data` ;
- variables Payload ;
- tâche de sauvegarde ;
- admin à `https://stratetic.art/admin`.
