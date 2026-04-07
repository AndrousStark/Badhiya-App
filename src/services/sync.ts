/**
 * Offline-first sync engine — Phase 4 implementation.
 *
 * Strategy:
 *   1. Components write to local Drizzle SQLite via createTransactionOffline()
 *   2. Records start with sync_status='created' and a local UUID id
 *   3. UI updates instantly via Legend State observable + react-query refetch
 *   4. syncPendingTransactions() walks all non-synced rows and pushes them
 *   5. On 2xx response, row flips to 'synced' and stores the server id
 *   6. On error, row reverts to its original status for next attempt
 *
 * Triggers (the caller decides when to call syncPendingTransactions):
 *   - On app foreground (AppState 'active') — handled in app/_layout.tsx
 *   - On network reconnect — handled by a NetworkStatus listener
 *   - On manual "Force Sync" button (debug screen)
 *   - Every 15 minutes via expo-background-task (Phase 10)
 *
 * Observable status: syncStatus$ exposes the live count of pending rows
 * so any component can show "X items syncing…" without re-querying SQLite.
 */

import axios from 'axios';
import { eq, and, ne, count } from 'drizzle-orm';
import { observable } from '@legendapp/state';

import { db } from '@/db/client';
import { transactions, type NewTransaction } from '@/db/schema';
import { auth$ } from '@/stores/auth';
import { api } from '@/lib/api';
import { toBackendType } from '@/features/transactions/schemas';

// ─── Types ──────────────────────────────────────────────
export type SyncStatus =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'syncing'
  | 'synced';

export interface SyncResult {
  attempted: number;
  succeeded: number;
  failed: number;
  errors: string[];
  durationMs: number;
}

export interface SyncStatusState {
  pendingCount: number;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  lastError: string | null;
}

// ─── Reactive sync status ───────────────────────────────
export const syncStatus$ = observable<SyncStatusState>({
  pendingCount: 0,
  isSyncing: false,
  lastSyncedAt: null,
  lastError: null,
});

/** Recompute pendingCount from the local DB. Call after any write. */
export async function refreshPendingCount(): Promise<void> {
  const businessId = auth$.businessId.get();
  if (!businessId) {
    syncStatus$.pendingCount.set(0);
    return;
  }
  const rows = await db
    .select({ c: count() })
    .from(transactions)
    .where(
      and(
        eq(transactions.businessId, businessId),
        ne(transactions.syncStatus, 'synced'),
      ),
    );
  syncStatus$.pendingCount.set(rows[0]?.c ?? 0);
}

// ─── Local writes ───────────────────────────────────────
export async function createTransactionOffline(
  input: Omit<NewTransaction, 'id' | 'syncStatus' | 'businessId'>,
): Promise<string> {
  const businessId = auth$.businessId.get();
  if (!businessId) throw new Error('No active business');

  const id = generateLocalId();
  await db.insert(transactions).values({
    ...input,
    id,
    businessId,
    syncStatus: 'created',
  });
  await refreshPendingCount();
  return id;
}

// ─── Server sync ────────────────────────────────────────
let inFlightSync: Promise<SyncResult> | null = null;

export async function syncPendingTransactions(): Promise<SyncResult> {
  // Single-flight: if a sync is already running, return its promise.
  if (inFlightSync) return inFlightSync;

  inFlightSync = doSync();
  try {
    return await inFlightSync;
  } finally {
    inFlightSync = null;
  }
}

async function doSync(): Promise<SyncResult> {
  const startedAt = Date.now();
  const businessId = auth$.businessId.get();

  if (!businessId) {
    return { attempted: 0, succeeded: 0, failed: 0, errors: ['no_business'], durationMs: 0 };
  }

  syncStatus$.isSyncing.set(true);
  syncStatus$.lastError.set(null);

  const pending = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.businessId, businessId),
        ne(transactions.syncStatus, 'synced'),
      ),
    );

  const result: SyncResult = {
    attempted: pending.length,
    succeeded: 0,
    failed: 0,
    errors: [],
    durationMs: 0,
  };

  for (const row of pending) {
    try {
      // Mark as syncing in local DB
      await db
        .update(transactions)
        .set({ syncStatus: 'syncing' })
        .where(eq(transactions.id, row.id));

      // POST to backend with backend-shaped type
      const response = await api.post<{
        transaction: { id: string };
        todayTotal: number;
        todayCount: number;
      }>(`/businesses/${businessId}/transactions`, {
        type: toBackendType(row.type as 'sale' | 'expense' | 'payment'),
        amount: row.amount,
        item: row.item ?? undefined,
        category: row.category ?? undefined,
        notes: row.notes ?? undefined,
        customerName: row.customerId ?? undefined,
        recordedVia: 'app',
      });

      // On success, mark synced + store server id
      await db
        .update(transactions)
        .set({
          syncStatus: 'synced',
          serverId: response.transaction.id,
          lastSyncedAt: new Date().toISOString(),
        })
        .where(eq(transactions.id, row.id));

      result.succeeded++;
    } catch (err) {
      // Revert to original status so we retry next time
      await db
        .update(transactions)
        .set({ syncStatus: row.syncStatus })
        .where(eq(transactions.id, row.id));
      result.failed++;
      result.errors.push(
        axios.isAxiosError(err)
          ? `HTTP ${err.response?.status ?? 0}: ${err.message}`
          : (err as Error).message,
      );
    }
  }

  result.durationMs = Date.now() - startedAt;

  // Update reactive status
  await refreshPendingCount();
  syncStatus$.isSyncing.set(false);
  syncStatus$.lastSyncedAt.set(Date.now());
  if (result.failed > 0) {
    syncStatus$.lastError.set(result.errors[0] ?? 'Unknown error');
  }

  return result;
}

// ─── Helpers ────────────────────────────────────────────
function generateLocalId(): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `loc_${time}_${rand}`;
}
