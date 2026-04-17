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
  giveCredit,
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
// Both mutations do an optimistic update on the summary so the header
// "Total Pending" reflects the new balance instantly. The customer
// list and ledger are invalidated on success for an authoritative
// refresh — we don't optimistically insert new customer rows because
// the server assigns the id and aging bucket, which we'd only be
// guessing at locally.
export function useGiveCredit() {
  const queryClient = useQueryClient();
  const businessId = auth$.businessId.get();

  return useMutation<
    CreditMutationResponse,
    Error,
    GiveCreditDto,
    { prevSummary: CreditSummary | undefined }
  >({
    mutationFn: (dto) => giveCredit(businessId!, dto),
    onMutate: async (dto) => {
      if (!businessId) return { prevSummary: undefined };
      await queryClient.cancelQueries({ queryKey: customerKeys.summary(businessId) });
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
    mutationFn: (dto) => receivePayment(businessId!, customerId, dto),
    onMutate: async (dto) => {
      if (!businessId) return { prevSummary: undefined };
      await queryClient.cancelQueries({ queryKey: customerKeys.summary(businessId) });
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
