/**
 * TanStack Query hooks for the customers/credit feature.
 *
 * Phase 5: ONLINE-FIRST. Reads are cached + revalidated, writes go
 * straight to the server with optimistic UI invalidation.
 *
 * Phase 5.5 (later): add offline write queue using local Drizzle
 * customers + credit_entries tables, with find-or-create logic that
 * mirrors the backend.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listCustomers,
  getCreditSummary,
  getCustomerLedger,
  receivePayment,
  sendReminder,
  sendBulkReminders,
} from './api';
import type {
  Customer,
  CreditSummary,
  CustomerLedger,
  CreditMutationResponse,
  GiveCreditDto,
  ReceivePaymentDto,
} from './schemas';
import { auth$ } from '@/stores/auth';
import { haptic } from '@/lib/haptics';
import { businessKeys } from '@/features/businesses/hooks';
import {
  createCreditGiveOffline,
  createPaymentReceiveOffline,
  syncPendingTransactions,
} from '@/services/sync';

// ─── Query keys ──────────────────────────────────────────
export const customerKeys = {
  all: ['customers'] as const,
  list: (businessId: string) => [...customerKeys.all, 'list', businessId] as const,
  summary: (businessId: string) =>
    [...customerKeys.all, 'summary', businessId] as const,
  ledger: (businessId: string, customerId: string) =>
    [...customerKeys.all, 'ledger', businessId, customerId] as const,
};

// ─── Reads ──────────────────────────────────────────────
export function useCustomers() {
  const businessId = auth$.businessId.get();
  return useQuery<Customer[]>({
    queryKey: customerKeys.list(businessId ?? 'none'),
    queryFn: () => listCustomers(businessId!),
    enabled: !!businessId,
    staleTime: 30_000,
  });
}

export function useCreditSummary() {
  const businessId = auth$.businessId.get();
  return useQuery<CreditSummary>({
    queryKey: customerKeys.summary(businessId ?? 'none'),
    queryFn: () => getCreditSummary(businessId!),
    enabled: !!businessId,
    staleTime: 30_000,
  });
}

export function useCustomerLedger(customerId: string | undefined) {
  const businessId = auth$.businessId.get();
  return useQuery<CustomerLedger>({
    queryKey: customerKeys.ledger(businessId ?? 'none', customerId ?? 'none'),
    queryFn: () => getCustomerLedger(businessId!, customerId!),
    enabled: !!businessId && !!customerId,
    staleTime: 15_000,
  });
}

// ─── Writes ─────────────────────────────────────────────
//
// Both mutations write **local-first** via the sync engine (SQLite
// insert + customer find-or-create + totalOutstanding update), then
// fire-and-forget attempt a network push. The Query summary is
// optimistically updated so the Khata header reflects the new
// balance instantly, and the customer list is invalidated to pull
// the fresh aggregated view after the sync lands.
//
// If the network call fails, the local row stays queued — the next
// sync tick (app foreground, reconnect, manual) will retry. This is
// why give/receive can never return an error to the user for network
// reasons alone.

export function useGiveCredit() {
  const queryClient = useQueryClient();
  const businessId = auth$.businessId.get();

  return useMutation<
    { newOutstanding: number },
    Error,
    GiveCreditDto,
    { prevSummary: CreditSummary | undefined }
  >({
    mutationFn: async (dto) => {
      // 1. Local-first write — always succeeds if SQLite is healthy.
      const local = await createCreditGiveOffline({
        customerName: dto.customerName,
        customerPhone: dto.customerPhone ?? null,
        amount: dto.amount,
        description: dto.description ?? null,
      });
      // 2. Kick off a background sync so the row hits the server if
      //    we're online — but don't block the UI on it. Errors are
      //    swallowed here; the sync engine re-queues them.
      void syncPendingTransactions().catch(() => undefined);
      return { newOutstanding: local.newOutstanding };
    },
    onMutate: async (dto) => {
      if (!businessId) return { prevSummary: undefined };
      await queryClient.cancelQueries({
        queryKey: customerKeys.summary(businessId),
      });
      const prev = queryClient.getQueryData<CreditSummary>(
        customerKeys.summary(businessId),
      );
      if (prev) {
        queryClient.setQueryData<CreditSummary>(
          customerKeys.summary(businessId),
          { ...prev, totalOutstanding: prev.totalOutstanding + dto.amount },
        );
      }
      return { prevSummary: prev };
    },
    onError: (_err, _dto, ctx) => {
      haptic('error');
      if (businessId && ctx?.prevSummary) {
        queryClient.setQueryData(
          customerKeys.summary(businessId),
          ctx.prevSummary,
        );
      }
    },
    onSuccess: () => {
      haptic('confirm');
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({ queryKey: businessKeys.all });
    },
  });
}

export function useReceivePayment(customerId: string) {
  const queryClient = useQueryClient();
  const businessId = auth$.businessId.get();

  return useMutation<
    CreditMutationResponse,
    Error,
    ReceivePaymentDto,
    { prevSummary: CreditSummary | undefined }
  >({
    // Payments are still online-first because the backend endpoint is
    // /credit/:customerId/payment — we need the server customer id,
    // which only exists after the customer has synced. A future
    // iteration can queue payments against local-only customers by
    // deferring in the sync engine (see syncPendingCreditEntries).
    mutationFn: async (dto) => {
      try {
        return await receivePayment(businessId!, customerId, dto);
      } catch (err) {
        // If the online call fails, fall back to a local-only entry
        // against the cached customer row — sync will push it later
        // once the network is back.
        await createPaymentReceiveOffline({
          localCustomerId: customerId,
          amount: dto.amount,
        });
        throw err;
      }
    },
    onMutate: async (dto) => {
      if (!businessId) return { prevSummary: undefined };
      await queryClient.cancelQueries({
        queryKey: customerKeys.summary(businessId),
      });
      const prev = queryClient.getQueryData<CreditSummary>(
        customerKeys.summary(businessId),
      );
      if (prev) {
        const nextTotal = Math.max(0, prev.totalOutstanding - dto.amount);
        queryClient.setQueryData<CreditSummary>(
          customerKeys.summary(businessId),
          { ...prev, totalOutstanding: nextTotal },
        );
      }
      return { prevSummary: prev };
    },
    onError: (_err, _dto, ctx) => {
      haptic('error');
      if (businessId && ctx?.prevSummary) {
        queryClient.setQueryData(
          customerKeys.summary(businessId),
          ctx.prevSummary,
        );
      }
    },
    onSuccess: () => {
      haptic('revealMoney');
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({ queryKey: businessKeys.all });
    },
  });
}

export function useSendReminder() {
  const businessId = auth$.businessId.get();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (customerId) => sendReminder(businessId!, customerId),
    onSuccess: () => haptic('confirm'),
    onError: () => haptic('error'),
  });
}

export function useSendBulkReminders() {
  const businessId = auth$.businessId.get();
  return useMutation<{ sent: number; failed: number }, Error, void>({
    mutationFn: () => sendBulkReminders(businessId!),
    onSuccess: () => haptic('confirm'),
    onError: () => haptic('error'),
  });
}
