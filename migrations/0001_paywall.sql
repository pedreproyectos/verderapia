-- Paywall de cursos: órdenes, accesos, sesiones y logs.
-- Aplicar con: wrangler d1 execute verderapia-paywall --remote --file=migrations/0001_paywall.sql
-- o pegando este SQL en D1 → Console del dashboard.

CREATE TABLE IF NOT EXISTS orders (
  id               TEXT PRIMARY KEY,        -- ord_<ulid>
  curso_slug       TEXT NOT NULL,
  email            TEXT NOT NULL,
  nombre           TEXT,
  amount_clp       INTEGER NOT NULL,
  currency         TEXT NOT NULL DEFAULT 'CLP',
  provider         TEXT NOT NULL,           -- flow | transferencia | demo | manual
  provider_ref     TEXT,
  provider_payment TEXT,
  status           TEXT NOT NULL,           -- pending|paid|rejected|refunded
  paid_at          TEXT,
  created_at       TEXT NOT NULL,
  raw              TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_provider_payment
  ON orders(provider, provider_payment);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status, created_at);

CREATE TABLE IF NOT EXISTS access_tokens (
  id          TEXT PRIMARY KEY,
  order_id    TEXT NOT NULL,
  token_hash  TEXT NOT NULL UNIQUE,         -- SHA-256 del token
  expires_at  TEXT NOT NULL,                -- para canjear (7 días)
  used_at     TEXT,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_access_tokens_order ON access_tokens(order_id);

CREATE TABLE IF NOT EXISTS sessions (
  id           TEXT PRIMARY KEY,
  order_id     TEXT NOT NULL,
  curso_slug   TEXT NOT NULL,
  email        TEXT NOT NULL,
  expires_at   TEXT,                        -- NULL = sin vencimiento
  revoked_at   TEXT,
  created_at   TEXT NOT NULL,
  last_seen_at TEXT,
  user_agent   TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_order ON sessions(order_id);

CREATE TABLE IF NOT EXISTS webhook_events (
  id          TEXT PRIMARY KEY,
  received_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS email_log (
  id          TEXT PRIMARY KEY,
  order_id    TEXT NOT NULL,
  kind        TEXT NOT NULL,                -- access|resend|transfer
  to_email    TEXT NOT NULL,
  provider_id TEXT,
  status      TEXT NOT NULL,                -- sent|skipped|failed
  error       TEXT,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_email_log_order ON email_log(order_id);

CREATE TABLE IF NOT EXISTS video_progress (
  session_id TEXT NOT NULL,
  video_id   TEXT NOT NULL,
  seconds    INTEGER NOT NULL DEFAULT 0,
  completed  INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (session_id, video_id)
);
