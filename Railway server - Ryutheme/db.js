const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || '';
const hasDatabase = !!connectionString;

let pool = null;

if (hasDatabase) {
  pool = new Pool({
    connectionString,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false }
  });
}

async function query(text, params) {
  if (!pool) {
    throw new Error('DATABASE_URL is not configured');
  }
  return pool.query(text, params);
}

async function ensureSchema() {
  if (!pool) return false;

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      public_id TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS devices (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      device_token_hash TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_devices_user_id
    ON devices(user_id);
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS google_accounts (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      google_sub TEXT NOT NULL UNIQUE,
      email TEXT,
      email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      name TEXT,
      picture TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_google_accounts_user_id
    ON google_accounts(user_id);
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS badge_entitlements (
      user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      badge_id   TEXT   NOT NULL,
      granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, badge_id)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS badge_active (
      user_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
      badge_id TEXT   NOT NULL,
      set_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  return true;
}

module.exports = {
  hasDatabase,
  ensureSchema,
  query
};
