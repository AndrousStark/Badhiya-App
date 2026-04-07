/**
 * Drizzle schema for on-device SQLite.
 *
 * Mirrors the backend Postgres schema (see backend/src/database/migrations/)
 * but simplified for mobile:
 *   - No multi-tenant row isolation (one SQLite file per business)
 *   - No pgvector columns (semantic cache lives server-side)
 *   - Sync bookkeeping columns added to every table
 *
 * Sync status lifecycle:
 *   created → syncing → synced
 *   updated → syncing → synced
 *   deleted → syncing → (removed after server confirms)
 *
 * Server is authoritative on `serverId`. Local `id` is a UUID generated
 * on-device so we can reference rows offline before sync completes.
 */

import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ─── TRANSACTIONS ─────────────────────────────────────────
export const transactions = sqliteTable(
  'transactions',
  {
    id: text('id').primaryKey(),
    businessId: text('business_id').notNull(),
    type: text('type', { enum: ['sale', 'expense', 'payment'] }).notNull(),
    amount: real('amount').notNull(),
    item: text('item'),
    category: text('category'),
    customerId: text('customer_id'),
    recordedVia: text('recorded_via', {
      enum: ['voice', 'text', 'whatsapp', 'manual', 'ondc', 'camera'],
    }).default('manual'),
    notes: text('notes'),
    createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
    // Sync bookkeeping
    syncStatus: text('sync_status', {
      enum: ['created', 'updated', 'deleted', 'syncing', 'synced'],
    })
      .notNull()
      .default('created'),
    serverId: text('server_id'),
    lastSyncedAt: text('last_synced_at'),
  },
  (table) => ({
    businessIdx: index('idx_tx_business').on(table.businessId),
    createdIdx: index('idx_tx_created').on(table.createdAt),
    syncIdx: index('idx_tx_sync').on(table.syncStatus),
  }),
);

// ─── CUSTOMERS (for khata) ────────────────────────────────
export const customers = sqliteTable(
  'customers',
  {
    id: text('id').primaryKey(),
    businessId: text('business_id').notNull(),
    name: text('name').notNull(),
    phone: text('phone'),
    photoUri: text('photo_uri'),
    totalOutstanding: real('total_outstanding').notNull().default(0),
    lastPaymentAt: text('last_payment_at'),
    status: text('status', { enum: ['active', 'paid', 'overdue', 'urgent'] })
      .notNull()
      .default('active'),
    createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
    syncStatus: text('sync_status').notNull().default('created'),
    serverId: text('server_id'),
    lastSyncedAt: text('last_synced_at'),
  },
  (table) => ({
    businessIdx: index('idx_cust_business').on(table.businessId),
    statusIdx: index('idx_cust_status').on(table.status),
  }),
);

// ─── CREDIT ENTRIES (ledger per customer) ─────────────────
export const creditEntries = sqliteTable(
  'credit_entries',
  {
    id: text('id').primaryKey(),
    customerId: text('customer_id')
      .notNull()
      .references(() => customers.id),
    type: text('type', { enum: ['credit', 'payment'] }).notNull(),
    amount: real('amount').notNull(),
    description: text('description'),
    createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
    syncStatus: text('sync_status').notNull().default('created'),
    serverId: text('server_id'),
  },
  (table) => ({
    customerIdx: index('idx_credit_customer').on(table.customerId),
  }),
);

// ─── PRODUCTS (inventory) ─────────────────────────────────
export const products = sqliteTable(
  'products',
  {
    id: text('id').primaryKey(),
    businessId: text('business_id').notNull(),
    name: text('name').notNull(),
    category: text('category'),
    price: real('price').notNull(),
    costPrice: real('cost_price'),
    stock: integer('stock').notNull().default(0),
    threshold: integer('threshold').default(5),
    barcode: text('barcode'),
    expiryDate: text('expiry_date'),
    photoUri: text('photo_uri'),
    createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
    syncStatus: text('sync_status').notNull().default('created'),
    serverId: text('server_id'),
  },
  (table) => ({
    businessIdx: index('idx_prod_business').on(table.businessId),
    barcodeIdx: index('idx_prod_barcode').on(table.barcode),
  }),
);

// ─── TYPE EXPORTS ─────────────────────────────────────────
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type CreditEntry = typeof creditEntries.$inferSelect;
export type NewCreditEntry = typeof creditEntries.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
