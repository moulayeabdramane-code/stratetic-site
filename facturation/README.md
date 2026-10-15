# Facturation STRATETIC

Application locale de **factures proforma et définitives** pour l'Agence STRATETIC.
Les PDF reproduisent le modèle de facture STRATETIC fourni (conservé localement dans `docs/prive/`, non versionné) :
même mise en page, mêmes couleurs, même logo, mêmes positions au point près.

Exemples générés : [docs/exemple-facture-modele.pdf](docs/exemple-facture-modele.pdf), [docs/exemple-proforma.pdf](docs/exemple-proforma.pdf), [docs/exemple-facture-longue.pdf](docs/exemple-facture-longue.pdf).

---

## 1. Installation

> **Mise en ligne sur Coolify, à l'adresse https://stratetic.art/facturation (sans sous-domaine) :** voir [DEPLOIEMENT.md](DEPLOIEMENT.md).

**Connexion :** au premier lancement, un compte administrateur est créé et ses identifiants s'affichent dans la console. Le mot de passe provisoire doit être changé à la première connexion. Les autres comptes se créent dans **Utilisateurs**.

**Prérequis :**
- Node.js **22.13 ou plus récent** (testé avec Node 24), qui fournit la base SQLite intégrée ;
- Google Chrome ou Microsoft Edge installé, utilisé pour fabriquer les PDF (aucun navigateur n'est téléchargé).

```bash
npm install
```

```bash
npm run build
```

```bash
npm start
```

Ouvrez ensuite **http://localhost:3210**.

Sous Windows, un double-clic sur **`demarrer.bat`** fait tout : installation au premier lancement, compilation de l'interface, démarrage, ouverture du navigateur.

### Tablette

Au démarrage, la console affiche aussi une adresse du type `http://192.168.1.20:3210`. Ouvrez-la depuis la tablette, connectée au même Wi-Fi que le PC.
Chaque personne se connecte avec son propre compte.

### Hors ligne

Tout fonctionne sans Internet : serveur, base de données, polices, logo et génération PDF sont locaux.
Seul l'envoi d'e-mails par SMTP a besoin du réseau.

---

## 2. Utilisation

| Écran | Rôle |
|---|---|
| **Tableau de bord** | Indicateurs (CA du mois et de l'année, impayés, retards), alerte des factures en retard, liste filtrable (type, statut, client, dates), recherche, tri par colonne, export CSV |
| **Nouvelle facture / proforma** | Saisie avec aperçu en direct identique au PDF, sauvegarde automatique du brouillon |
| **Clients** | Fiches réutilisables (auto-complétion) ; bouton *Facture* / *Proforma* qui crée un brouillon reprenant les lignes habituelles du client |
| **Catalogue** | Produits et services à prix pré-enregistrés, proposés à la saisie des lignes |
| **Statistiques** | CA mensuel facturé et encaissé, CA annuel, meilleurs clients, impayés, taux de conversion des proformas |
| **Vérifier** | Contrôle d'authenticité à partir du contenu du QR code d'une facture |
| **Paramètres** | Émetteur, banque, pied de page, mentions, couleurs, logo, numérotation, devises, TVA, e-mail, sauvegarde |

### Cycle de vie d'un document

```
brouillon ──Émettre──▶ émise ──Envoyer──▶ envoyée ──paiements──▶ payée
   │                     └───────── Annuler ─────────▶ annulée
   └─ Supprimer (seul un brouillon peut l'être)

proforma ──Convertir en facture──▶ facture émise (numéro FAC suivant) ; la proforma passe en « convertie »
« En retard » = facture émise ou envoyée, échéance dépassée, solde restant > 0
```

- **Brouillon** : modifiable, sans numéro, enregistré automatiquement une seconde après chaque frappe.
- **Émettre** : attribue le numéro définitif, puis verrouille le contenu.
- **Dupliquer** : crée un nouveau brouillon (même type, ou l'autre type avec « Copier en… »).
- **Paiements** : partiels ou totaux. Le statut passe à *payée* quand le solde est nul.
- **Envoyer** : envoi SMTP direct avec le PDF joint, ou ouverture de votre messagerie avec le PDF téléchargé.
- **Imprimer / PDF** : le PDF d'un document émis est archivé dans `data/pdf/NUMERO.pdf` à sa première génération. Il ne change plus ensuite, même si les paramètres évoluent.

---

## 3. Numérotation et sécurité

- **Deux séries indépendantes** : `FAC-2026-045…` pour les factures, `PRO-2026-001…` pour les proformas.
- **Remise à zéro** chaque 1er janvier (`"reset": "annual"`) ou numérotation continue (`"continuous"`).
- **Aucun doublon, aucun trou** :
  - le numéro n'est attribué qu'à l'émission, dans une transaction SQLite unique : si quoi que ce soit échoue, rien n'est consommé ;
  - un document numéroté ne peut pas être supprimé, seulement annulé, et il garde son numéro.
- **Verrous en base** (déclencheurs SQLite, donc actifs même en cas de modification manuelle de la base) :
  - un compteur ne peut avancer que de 1 ;
  - le numéro et le contenu d'un document émis sont figés ;
  - un document émis ne peut pas être supprimé.
- **Chronologie** : impossible d'émettre un document daté d'avant le dernier document émis de la même série.
- **Format et préfixes** : modifiables uniquement tant qu'aucun document n'a été émis.
- **Reprise d'une numérotation existante** : `numbering.start` indique le dernier numéro déjà utilisé hors application. Le modèle étant `FAC-2026-044`, la première facture émise ici sera **FAC-2026-045**. Cette valeur se verrouille dès que le compteur a servi.
- **Comptes utilisateurs** :
  - mots de passe hachés avec scrypt (sel unique, comparaison à temps constant), 10 caractères minimum ;
  - blocage de 15 minutes après 5 échecs (par adresse IP et par e-mail) ;
  - sessions de 7 jours en cookie `HttpOnly`, `SameSite=Lax`, `Secure` en HTTPS, dont seule l'empreinte est stockée en base ;
  - écritures refusées depuis une autre origine (protection CSRF) ;
  - rôles **Administrateur** (tout) et **Utilisateur** (documents, clients, catalogue, statistiques, sans paramètres ni comptes ni restauration).
- **Traçabilité** : journal horodaté de chaque document (création, modifications, émission, envoi, paiements, annulation, conversion, duplication).
  - Le document émis fige aussi un instantané des paramètres (émetteur, banque, couleurs, mentions) : un changement ultérieur ne modifie pas les factures passées.
- **QR code de vérification** :
  - il contient le numéro, la date, le montant et un code HMAC-SHA256 calculé avec une clé secrète locale (`data/secret.key`, créée au premier lancement) ;
  - l'écran *Vérifier* détecte toute altération ;
  - cette clé est **incluse automatiquement dans la sauvegarde JSON** et restaurée avec elle : sans elle, les anciens QR codes ne pourraient plus être vérifiés.

---

## 4. Configuration

### `config/settings.json`

Tout est modifiable depuis l'écran **Paramètres**, ou à la main dans ce fichier.

| Clé | Contenu |
|---|---|
| `issuer` | Nom, adresse (une ligne par élément), e-mail, téléphone, identifiants légaux (NIF, RC…), chemin du logo |
| `bank` | Nom de la banque et lignes de coordonnées imprimées |
| `footer` | Textes gauche et droite du pied de page |
| `documents` | Titres (`FACTURE`, `PROFORMA`), libellés, conditions par défaut, mentions légales, conditions générales (page annexe), délais de paiement, modes de règlement, filigrane, QR code |
| `theme` | Les 10 couleurs du modèle (bleu nuit `#022539`, vert `#A1BE01`…) |
| `numbering` | `reset` (`annual` / `continuous`), `format` (`{PREFIX}-{YEAR}-{SEQ}`), `padding` (3 → `044`), `prefixes`, `start` (reprise) |
| `currencies`, `baseCurrency` | Devises : libellé, décimales, taux manuel vers la devise de référence, mots pour le montant en lettres |
| `vatRates`, `defaultVatRate` | Taux de TVA proposés (0 et 19 %) et taux par défaut (0 %, comme sur le modèle) |
| `email` | Mode (`mailto` ou `smtp`), serveur SMTP, modèles d'objet et de message (`{TITLE}`, `{NUMBER}`, `{AMOUNT}`, `{DUE}`, `{CLIENT}`) |
| `server` | Port (3210) et interface d'écoute |
| `pdf.browserPath` | Chemin de Chrome/Edge si la détection automatique échoue |

### `.env` (secrets, à créer à partir de `.env.example`)

| Variable | Rôle |
|---|---|
| `SMTP_PASS` | Mot de passe SMTP. Il n'est jamais écrit dans `settings.json`. Pour Yahoo ou Gmail, utilisez un *mot de passe d'application*. |
| `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD` | Compte administrateur créé au premier démarrage (sinon `admin@stratetic.art` et un mot de passe généré, affiché dans la console) |
| `AUTH_DISABLED` | `1` = pas de page de connexion (PC utilisé seul uniquement, jamais en ligne) |
| `BASE_PATH` | Chemin public de l'application (`/facturation` dans l'image Docker ; vide en local = racine) |
| `CHROME_PATH` | Chemin du navigateur (facultatif) |

---

## 5. Choix appliqués aux points à clarifier

| Question | Décision retenue |
|---|---|
| Polices | Les polices du modèle ne sont pas récupérables (glyphes intégrés sans nom). Équivalents libres de droits (licence OFL), intégrés au projet : **Jost** pour les titres type Futura, **Figtree** pour le texte type Proxima Nova. L'interlettrage est calibré pour retrouver les largeurs du modèle. Pour utiliser vos propres fichiers Futura / Proxima Nova, remplacez-les dans `server/template/fonts/`. |
| Titre proforma | « PROFORMA » à la place de « FACTURE » ; cartouche « N° PROFORMA » ; « VALIDITÉ » à la place de « ÉCHÉANCE » |
| Format du numéro | 3 chiffres comme le modèle (`FAC-2026-045`), configurable ; reprise à 044 pour les factures, départ à 001 pour les proformas |
| Éléments absents du modèle | Remise de ligne : ligne verte sous le détail. Remise globale, TVA par taux, TTC et acompte : lignes supplémentaires dans le bloc des totaux, seulement si elles sont non nulles. QR code : à droite des coordonnées bancaires. Contre-valeur en devise : sous « Net à payer ». Filigrane : diagonal, très clair. |
| Totaux plus hauts | Quand ils ne tiennent plus au-dessus des conditions, ils sont resserrés et « Arrêtée à » passe à leur gauche, dans la zone vide du modèle. Le passage à une page 2 n'intervient qu'en dernier recours. |
| Factures longues | En-tête du tableau répété, pied de page et « Page x / y » sur chaque page, totaux et conditions sur la dernière |
| TVA | 0 % par défaut (comme le modèle), 19 % disponible, TVA par ligne |
| Document émis | Verrouillé ; correction par annulation puis nouvelle facture ; paiements partiels suivis |
| QR code | Vérification (numéro, date, montant, code d'intégrité) |
| E-mail | `mailto` par défaut, avec le PDF téléchargé à joindre ; SMTP direct dès que `SMTP_PASS` est défini |
| Montant en lettres | Formule du modèle (« Cent mille francs CFA ») ; euros et centimes pour les autres devises ; calculé sur le net à payer |
| Tablette | Accès au serveur du PC par le réseau local |

---

## 6. Sauvegarde

- **Paramètres › Sauvegarde › Exporter (JSON)** : tout le contenu (documents, clients, catalogue, paiements, compteurs, journal, paramètres **et clé des QR codes**) dans un seul fichier.
- **Importer** : restauration complète, clé comprise. Les comptes utilisateurs ne sont pas concernés : ils restent ceux du serveur. L'état actuel est d'abord copié dans `data/backups/`. Une sauvegarde plus ancienne, sans clé, conserve la clé en place.
- **Gardez ce fichier en lieu sûr** (clé USB, cloud privé) : avec la clé, quelqu'un pourrait fabriquer de faux QR codes « authentiques ».
- **Export CSV** : historique des documents (séparateur `;`, compatible Excel). Depuis le tableau de bord, l'export suit les filtres actifs.
- Vous pouvez aussi copier le dossier `data/` (base `factures.db`, PDF archivés, `secret.key`) application arrêtée.

---

## 7. Développement

| Commande | Effet |
|---|---|
| `npm test` | 42 tests : montant en lettres, calculs, numérotation, verrous, conversion, paiements, sauvegarde, rendu PDF, comptes et sécurité, publication sous /facturation |
| `npm run example` | Régénère les PDF d'exemple dans `docs/` |
| `npm run dev` + `npm run dev:client` | Serveur avec rechargement automatique + interface Vite sur http://localhost:5173 |

### Arborescence

```
facturation-stratetic/
├── config/settings.json        Paramètres (émetteur, banque, couleurs, numérotation, devises…)
├── shared/                     Code commun serveur + interface
│   ├── totals.js               Calcul HT / remises / TVA / TTC / acompte
│   ├── numberToWords.js        Montant en lettres (français)
│   └── format.js               Montants, dates, numéros
├── server/
│   ├── index.js                Démarrage du serveur
│   ├── app.js                  Application Express (API + interface + gabarit, chemin de base)
│   ├── auth.js                 Sessions, contrôle d'accès, protection CSRF
│   ├── paths.js
│   ├── db/schema.sql           Tables + déclencheurs de verrouillage
│   ├── db/database.js          SQLite natif (node:sqlite), transactions
│   ├── routes/api.js           API REST
│   ├── services/               documents, numbering, clients, products, stats,
│   │                           backup, mail, pdf, qr, renderer, settings
│   └── template/               Gabarit de la facture
│       ├── invoice.css         Mise en page (cotes du modèle)
│       ├── paginate.js         Pagination automatique
│       ├── fonts/              Jost, Figtree (OFL)
│       └── assets/logo.png     Logo extrait du modèle
├── client/                     Interface React (Vite)
│   └── src/ App.jsx, pages/, components/, lib/, styles.css
├── scripts/                    Exemples (generate-example.js, sample-data.js)
├── tests/                      Tests (node:test)
├── docs/                       Modèle de référence, PDF d'exemple, comparaison
├── data/                       Créé au lancement : factures.db, pdf/, uploads/, backups/, secret.key
├── demarrer.bat                Lanceur Windows
├── Dockerfile                  Image pour Coolify (Chromium inclus)
├── DEPLOIEMENT.md              Mise en ligne sur Coolify
└── .env.example
```

**Dépendances :**
- au fonctionnement : `express`, `puppeteer-core`, `nodemailer`, `qrcode` ;
- à la compilation : `react`, `react-dom`, `vite`, `@vitejs/plugin-react`.

La base de données utilise le SQLite intégré à Node ; les graphiques sont dessinés en SVG, sans bibliothèque.

---

## 8. Dépannage

| Problème | Solution |
|---|---|
| « Aucun navigateur Chrome/Edge trouvé » | Renseignez `pdf.browserPath` dans `config/settings.json` |
| « Interface non compilée » | Lancez `npm run build` |
| Le port 3210 est occupé | Changez `server.port`, ou lancez avec `PORT=3300` |
| Envoi SMTP refusé | Vérifiez l'hôte, le port (465 = SSL), l'utilisateur, et `SMTP_PASS` (mot de passe d'application) |
| Dossier dans OneDrive | Fonctionne, mais mettre `node_modules` et `data/` hors synchronisation évite des lenteurs |
