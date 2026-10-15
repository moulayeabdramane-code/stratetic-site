-- Schéma SQLite de l'application de facturation.
-- Les règles d'intégrité critiques (numérotation, documents émis) sont
-- garanties par des déclencheurs : même une requête manuelle ne peut pas
-- les contourner.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS clients (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  address_lines TEXT NOT NULL DEFAULT '[]',   -- JSON : ["ligne 1", "ligne 2"]
  email         TEXT,
  phone         TEXT,
  tax_ids       TEXT NOT NULL DEFAULT '[]',   -- JSON : [{"label":"NIF","value":"12345"}]
  notes         TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  detail      TEXT,
  unit_price  REAL NOT NULL DEFAULT 0,
  vat_rate    REAL NOT NULL DEFAULT 0,
  currency    TEXT NOT NULL DEFAULT 'XOF',
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- Compteurs de numérotation : une ligne par (type, année). En mode continu,
-- year = 0. `last` = dernier numéro attribué.
CREATE TABLE IF NOT EXISTS counters (
  type  TEXT NOT NULL CHECK (type IN ('facture', 'proforma')),
  year  INTEGER NOT NULL,
  last  INTEGER NOT NULL CHECK (last >= 0),
  PRIMARY KEY (type, year)
);

CREATE TABLE IF NOT EXISTS documents (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  type             TEXT NOT NULL CHECK (type IN ('facture', 'proforma')),
  number           TEXT UNIQUE,                -- NULL tant que brouillon
  series_year      INTEGER,
  seq              INTEGER,
  status           TEXT NOT NULL DEFAULT 'brouillon'
                   CHECK (status IN ('brouillon', 'emise', 'envoyee', 'payee', 'annulee', 'convertie')),
  client_id        INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  client_name      TEXT,                       -- dénormalisé pour la recherche
  data             TEXT NOT NULL,              -- JSON : client, lignes, conditions…
  totals           TEXT,                       -- JSON : totaux (figés à l'émission)
  issuer_snapshot  TEXT,                       -- JSON : paramètres émetteur figés
  issue_date       TEXT,
  due_date         TEXT,
  currency         TEXT NOT NULL DEFAULT 'XOF',
  exchange_rate    REAL NOT NULL DEFAULT 1,
  total_ht         REAL NOT NULL DEFAULT 0,
  net_to_pay       REAL NOT NULL DEFAULT 0,
  signature        TEXT,
  source_id        INTEGER REFERENCES documents(id),
  converted_to_id  INTEGER REFERENCES documents(id),
  issued_at        TEXT,
  sent_at          TEXT,
  paid_at          TEXT,
  cancelled_at     TEXT,
  cancel_reason    TEXT,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL,
  UNIQUE (type, series_year, seq)
);
CREATE INDEX IF NOT EXISTS idx_documents_client ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_issue ON documents(issue_date);

CREATE TABLE IF NOT EXISTS payments (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id  INTEGER NOT NULL REFERENCES documents(id),
  date         TEXT NOT NULL,
  amount       REAL NOT NULL CHECK (amount > 0),
  method       TEXT,
  note         TEXT,
  created_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_payments_doc ON payments(document_id);

-- Journal de traçabilité (création, modification, émission, envoi…)
CREATE TABLE IF NOT EXISTS audit_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id  INTEGER,
  action       TEXT NOT NULL,
  details      TEXT,
  at           TEXT NOT NULL,
  user         TEXT                          -- auteur de l'action (nom du compte)
);
CREATE INDEX IF NOT EXISTS idx_audit_doc ON audit_log(document_id);

-- Comptes utilisateurs (mots de passe hachés scrypt + sel unique)
CREATE TABLE IF NOT EXISTS users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE COLLATE NOCASE,
  role            TEXT NOT NULL DEFAULT 'utilisateur' CHECK (role IN ('admin', 'utilisateur')),
  salt            TEXT NOT NULL,
  hash            TEXT NOT NULL,
  must_change     INTEGER NOT NULL DEFAULT 0,   -- 1 = changement de mot de passe exigé
  active          INTEGER NOT NULL DEFAULT 1,
  last_login_at   TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

-- Sessions : seule l'empreinte SHA-256 du jeton est stockée
CREATE TABLE IF NOT EXISTS sessions (
  token_hash  TEXT PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL,
  expires_at  TEXT NOT NULL,
  ip          TEXT,
  user_agent  TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- ---------------------------------------------------------------------------
-- Verrous
-- ---------------------------------------------------------------------------

-- Un compteur ne peut qu'avancer d'exactement 1 : ni saut, ni retour arrière.
CREATE TRIGGER IF NOT EXISTS counters_strict_increment
BEFORE UPDATE OF last ON counters
WHEN NEW.last <> OLD.last + 1
BEGIN
  SELECT RAISE(ABORT, 'Compteur verrouillé : seule une incrémentation de 1 est autorisée');
END;

CREATE TRIGGER IF NOT EXISTS counters_no_delete
BEFORE DELETE ON counters
BEGIN
  SELECT RAISE(ABORT, 'Compteur verrouillé : suppression interdite');
END;

-- Un document émis ne peut plus changer de numéro ni de contenu.
CREATE TRIGGER IF NOT EXISTS documents_issued_locked
BEFORE UPDATE OF type, number, series_year, seq, data, totals, issuer_snapshot,
                 issue_date, due_date, currency, exchange_rate, net_to_pay, total_ht,
                 client_id, signature
ON documents
WHEN OLD.number IS NOT NULL
BEGIN
  SELECT RAISE(ABORT, 'Document émis : contenu et numéro verrouillés');
END;

-- Un document numéroté ne peut pas être supprimé (il peut être annulé).
CREATE TRIGGER IF NOT EXISTS documents_issued_no_delete
BEFORE DELETE ON documents
WHEN OLD.number IS NOT NULL
BEGIN
  SELECT RAISE(ABORT, 'Document émis : suppression interdite (utilisez l''annulation)');
END;
