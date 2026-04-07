/**
 * SQLite + Drizzle client.
 *
 * One database file per business. Switching business tenants
 * swaps the DB file. Logout deletes it.
 *
 * `initDb()` runs raw CREATE TABLE IF NOT EXISTS on first import so
 * Sprint 1 de-risk screens don't need drizzle-kit migrations. Once
 * Phase 2 ships, replace this with `useMigrations(db, migrations)`
 * from `drizzle-orm/expo-sqlite/migrator` + a drizzle-kit generated
 * migrations folder.
 */

import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

const DB_NAME = 'badhiya.db';

const sqlite = openDatabaseSync(DB_NAME, {
  enableChangeListener: true, // required for useLiveQuery reactivity
});

export const db = drizzle(sqlite, { schema });

// ─── Bootstrap tables on first run ─────────────────────────
// Sprint 1 shortcut: raw CREATE TABLE IF NOT EXISTS for each table.
// Phase 2: replace with drizzle-kit generated migrations.
try {
  sqlite.execSync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      item TEXT,
      category TEXT,
      customer_id TEXT,
      recorded_via TEXT DEFAULT 'manual',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      sync_status TEXT NOT NULL DEFAULT 'created',
      server_id TEXT,
      last_synced_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_tx_business ON transactions(business_id);
    CREATE INDEX IF NOT EXISTS idx_tx_created ON transactions(created_at);
    CREATE INDEX IF NOT EXISTS idx_tx_sync ON transactions(sync_status);

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      photo_uri TEXT,
      total_outstanding REAL NOT NULL DEFAULT 0,
      last_payment_at TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      sync_status TEXT NOT NULL DEFAULT 'created',
      server_id TEXT,
      last_synced_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_cust_business ON customers(business_id);
    CREATE INDEX IF NOT EXISTS idx_cust_status ON customers(status);

    CREATE TABLE IF NOT EXISTS credit_entries (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      sync_status TEXT NOT NULL DEFAULT 'created',
      server_id TEXT,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE INDEX IF NOT EXISTS idx_credit_customer ON credit_entries(customer_id);

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      price REAL NOT NULL,
      cost_price REAL,
      stock INTEGER NOT NULL DEFAULT 0,
      threshold INTEGER DEFAULT 5,
      barcode TEXT,
      expiry_date TEXT,
      photo_uri TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      sync_status TEXT NOT NULL DEFAULT 'created',
      server_id TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_prod_business ON products(business_id);
    CREATE INDEX IF NOT EXISTS idx_prod_barcode ON products(barcode);
  `);
} catch (err) {
  // Swallow here so module import never crashes. Sync screen will surface errors.
  console.warn('[db] bootstrap failed:', err);
}

export type DrizzleDb = typeof db;
export { schema };
