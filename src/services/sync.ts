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
import { eq, and, ne, count, or } from 'drizzle-orm';
import { observable } from '@legendapp/state';

import { db } from '@/db/client';
import {
  transactions,
  customers,
  creditEntries,
  type NewTransaction,
} from '@/db/schema';
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
  const [txnRows, customerRows, creditRows] = await Promise.all([
    db
      .select({ c: count() })
      .from(transactions)
      .where(
        and(
          eq(transactions.businessId, businessId),
          ne(transactions.syncStatus, 'synced'),
        ),
      ),
    db
      .select({ c: count() })
      .from(customers)
      .where(
        and(
          eq(customers.businessId, businessId),
          ne(customers.syncStatus, 'synced'),
        ),
      ),
    db
      .select({ c: count() })
      .from(creditEntries)
      .where(ne(creditEntries.syncStatus, 'synced')),
  ]);
  syncStatus$.pendingCount.set(
    (txnRows[0]?.c ?? 0) + (customerRows[0]?.c ?? 0) + (creditRows[0]?.c ?? 0),
  );
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

// ─── Credit entry offline helpers ───────────────────────

export interface CreditGiveOfflineInput {
  customerName: string;
  customerPhone?: string | null;
  amount: number;
  description?: string | null;
}

export interface CreditGiveOfflineResult {
  customerId: string;
  creditEntryId: string;
  newOutstanding: number;
  createdCustomer: boolean;
}

/**
 * Record a "udhar diya" entry locally. Finds or creates the customer
 * (phone first, then name fallback), inserts a credit entry with
 * syncStatus='created', bumps the customer's local totalOutstanding.
 * Safe to call offline — the sync engine will push both rows on
 * reconnect.
 */
export async function createCreditGiveOffline(
  input: CreditGiveOfflineInput,
): Promise<CreditGiveOfflineResult> {
  const businessId = auth$.businessId.get();
  if (!businessId) throw new Error('No active business');

  const customer = await findOrCreateCustomerOffline(
    businessId,
    input.customerName.trim(),
    input.customerPhone?.trim() || null,
  );

  const creditEntryId = generateLocalId();
  await db.insert(creditEntries).values({
    id: creditEntryId,
    customerId: customer.id,
    type: 'credit',
    amount: input.amount,
    description: input.description?.trim() || null,
    syncStatus: 'created',
  });

  const newOutstanding = customer.totalOutstanding + input.amount;
  await db
    .update(customers)
    .set({ totalOutstanding: newOutstanding })
    .where(eq(customers.id, customer.id));

  await refreshPendingCount();
  return {
    customerId: customer.id,
    creditEntryId,
    newOutstanding,
    createdCustomer: customer.wasCreated,
  };
}

export interface PaymentReceiveOfflineInput {
  localCustomerId: string;
  amount: number;
  description?: string | null;
}

/**
 * Record a "paise mile" entry locally against an existing local
 * customer. Requires a local customer id — payments can't create a
 * customer since the backend flow separates /give from /payment.
 */
export async function createPaymentReceiveOffline(
  input: PaymentReceiveOfflineInput,
): Promise<{ creditEntryId: string; newOutstanding: number }> {
  const customer = await db
    .select()
    .from(customers)
    .where(eq(customers.id, input.localCustomerId));
  if (!customer[0]) {
    throw new Error(`Customer not found: ${input.localCustomerId}`);
  }

  const creditEntryId = generateLocalId();
  await db.insert(creditEntries).values({
    id: creditEntryId,
    customerId: customer[0].id,
    type: 'payment',
    amount: input.amount,
    description: input.description?.trim() || null,
    syncStatus: 'created',
  });

  const newOutstanding = Math.max(0, customer[0].totalOutstanding - input.amount);
  await db
    .update(customers)
    .set({
      totalOutstanding: newOutstanding,
      lastPaymentAt: new Date().toISOString(),
    })
    .where(eq(customers.id, customer[0].id));

  await refreshPendingCount();
  return { creditEntryId, newOutstanding };
}

async function findOrCreateCustomerOffline(
  businessId: string,
  name: string,
  phone: string | null,
): Promise<{
  id: string;
  totalOutstanding: number;
  wasCreated: boolean;
  serverId: string | null;
}> {
  // Match by phone first (most reliable), then by case-insensitive name.
  const existing = phone
    ? await db
        .select()
        .from(customers)
        .where(
          and(eq(customers.businessId, businessId), eq(customers.phone, phone)),
        )
    : await db
        .select()
        .from(customers)
        .where(
          and(eq(customers.businessId, businessId), eq(customers.name, name)),
        );

  if (existing[0]) {
    return {
      id: existing[0].id,
      totalOutstanding: existing[0].totalOutstanding,
      wasCreated: false,
      serverId: existing[0].serverId ?? null,
    };
  }

  const id = generateLocalId();
  await db.insert(customers).values({
    id,
    businessId,
    name,
    phone,
    totalOutstanding: 0,
    syncStatus: 'created',
  });
  return { id, totalOutstanding: 0, wasCreated: true, serverId: null };
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

  // ─── Credit entries ────────────────────────────────
  const creditResult = await syncPendingCreditEntries(businessId);
  result.attempted += creditResult.attempted;
  result.succeeded += creditResult.succeeded;
  result.failed += creditResult.failed;
  result.errors.push(...creditResult.errors);

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

/**
 * Push pending credit entries to the backend.
 *
 * For 'credit' entries: calls POST /credit/give with the local
 * customer's name + phone. The backend auto-creates the customer
 * if new; we learn the server customer id from the response and
 * stamp it onto the local customer row so subsequent payment
 * entries can reference it.
 *
 * For 'payment' entries: requires the local customer to have a
 * serverId already (either from a prior credit_given sync or from
 * a fresh customers fetch). If the customer hasn't synced yet,
 * we skip the payment this round — next sync will retry after
 * the dependency resolves.
 */
async function syncPendingCreditEntries(
  businessId: string,
): Promise<Omit<SyncResult, 'durationMs'>> {
  const pending = await db
    .select()
    .from(creditEntries)
    .where(
      or(
        eq(creditEntries.syncStatus, 'created'),
        eq(creditEntries.syncStatus, 'updated'),
      ),
    );

  const result = {
    attempted: pending.length,
    succeeded: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const row of pending) {
    try {
      const customer = (
        await db.select().from(customers).where(eq(customers.id, row.customerId))
      )[0];
      if (!customer) {
        throw new Error(`orphaned credit entry ${row.id} (no local customer)`);
      }

      await db
        .update(creditEntries)
        .set({ syncStatus: 'syncing' })
        .where(eq(creditEntries.id, row.id));

      if (row.type === 'credit') {
        const response = await api.post<{
          customer: { id: string };
          newOutstanding: number;
        }>(`/businesses/${businessId}/credit/give`, {
          customerName: customer.name,
          customerPhone: customer.phone ?? undefined,
          amount: row.amount,
          description: row.description ?? undefined,
          recordedVia: 'app',
        });

        // Stamp the server's customer id onto our local row so later
        // payment syncs can use /credit/:serverId/payment.
        if (!customer.serverId) {
          await db
            .update(customers)
            .set({ serverId: response.customer.id, syncStatus: 'synced' })
            .where(eq(customers.id, customer.id));
        }

        await db
          .update(creditEntries)
          .set({
            syncStatus: 'synced',
            serverId: response.customer.id,
          })
          .where(eq(creditEntries.id, row.id));
      } else {
        // payment
        if (!customer.serverId) {
          // Customer hasn't reached the backend yet — defer. Revert the
          // 'syncing' flag so the next run retries.
          await db
            .update(creditEntries)
            .set({ syncStatus: row.syncStatus })
            .where(eq(creditEntries.id, row.id));
          continue;
        }
        await api.post(
          `/businesses/${businessId}/credit/${customer.serverId}/payment`,
          { amount: row.amount, recordedVia: 'app' },
        );
        await db
          .update(creditEntries)
          .set({ syncStatus: 'synced', serverId: customer.serverId })
          .where(eq(creditEntries.id, row.id));
      }

      result.succeeded++;
    } catch (err) {
      await db
        .update(creditEntries)
        .set({ syncStatus: row.syncStatus })
        .where(eq(creditEntries.id, row.id));
      result.failed++;
      result.errors.push(
        axios.isAxiosError(err)
          ? `HTTP ${err.response?.status ?? 0}: ${err.message}`
          : (err as Error).message,
      );
    }
  }

  return result;
}

// ─── Helpers ────────────────────────────────────────────
function generateLocalId(): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `loc_${time}_${rand}`;
}
