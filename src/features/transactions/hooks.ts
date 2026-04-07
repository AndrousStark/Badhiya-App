/**
 * TanStack Query hooks for the transactions feature.
 *
 * Optimistic updates: when the user records a transaction, the local
 * cache is updated immediately so the UI feels instant. Background
 * sync via `services/sync.ts` reconciles with the server.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listTransactions, createTransaction, getTodayPnl } from './api';
import type {
  CreateTransactionDto,
  CreateTransactionResponse,
  DailyPnl,
  TransactionList,
} from './schemas';
import { auth$ } from '@/stores/auth';
import { haptic } from '@/lib/haptics';

// ─── Query keys ──────────────────────────────────────────
export const txnKeys = {
  all: ['transactions'] as const,
  list: (businessId: string, type?: string) =>
    [...txnKeys.all, 'list', businessId, type ?? 'all'] as const,
  pnlToday: (businessId: string) =>
    [...txnKeys.all, 'pnl', 'today', businessId] as const,
};

// ─── List ────────────────────────────────────────────────
export function useTransactions(opts?: { type?: 'sale' | 'expense' | 'payment'; limit?: number }) {
  const businessId = auth$.businessId.get();
  return useQuery<TransactionList>({
    queryKey: txnKeys.list(businessId ?? 'none', opts?.type),
    queryFn: () =>
      listTransactions(businessId!, {
        type: opts?.type,
        limit: opts?.limit ?? 20,
      }),
    enabled: !!businessId,
    staleTime: 30_000,
  });
}

// ─── Today P&L ───────────────────────────────────────────
export function useTodayPnl() {
  const businessId = auth$.businessId.get();
  return useQuery<DailyPnl>({
    queryKey: txnKeys.pnlToday(businessId ?? 'none'),
    queryFn: () => getTodayPnl(businessId!),
    enabled: !!businessId,
    staleTime: 30_000,
  });
}

// ─── Create (online path) ───────────────────────────────
// For offline-first, components should call createTransactionOffline()
// from src/services/sync.ts instead. This hook is for guaranteed-online
// flows (e.g., debug screens, admin tools).
export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const businessId = auth$.businessId.get();

  return useMutation<CreateTransactionResponse, Error, CreateTransactionDto>({
    mutationFn: (dto) => createTransaction(businessId!, dto),
    onSuccess: () => {
      haptic('confirm');
      // Invalidate so the list + dashboard refetch
      queryClient.invalidateQueries({ queryKey: txnKeys.all });
      queryClient.invalidateQueries({ queryKey: ['businesses', 'dashboard'] });
    },
    onError: () => {
      haptic('error');
    },
  });
}
