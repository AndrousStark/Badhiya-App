/**
 * TanStack Query hooks for payments (links, subscriptions, plans).
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPaymentLink,
  listPaymentLinks,
  getBusinessSubscription,
  createSubscription,
  cancelSubscription,
  listPlans,
} from './api';
import type {
  BusinessPlan,
  PaymentLinkList,
  SubscriptionPlan,
  CreatePaymentLinkDto,
  CreateSubscriptionDto,
} from './schemas';
import { auth$ } from '@/stores/auth';
import { haptic } from '@/lib/haptics';

export const paymentKeys = {
  all: ['payments'] as const,
  links: (bId: string) => [...paymentKeys.all, 'links', bId] as const,
  subscription: (bId: string) =>
    [...paymentKeys.all, 'subscription', bId] as const,
  plans: () => [...paymentKeys.all, 'plans'] as const,
};

// ─── Reads ──────────────────────────────────────────────

export function usePaymentLinks(status?: string) {
  const bId = auth$.businessId.get();
  return useQuery<PaymentLinkList>({
    queryKey: [...paymentKeys.links(bId ?? 'none'), status ?? 'all'],
    queryFn: () => listPaymentLinks(bId!, { status, limit: 50 }),
    enabled: !!bId,
    staleTime: 60_000,
  });
}

export function useBusinessSubscription() {
  const bId = auth$.businessId.get();
  return useQuery<BusinessPlan>({
    queryKey: paymentKeys.subscription(bId ?? 'none'),
    queryFn: () => getBusinessSubscription(bId!),
    enabled: !!bId,
    staleTime: 5 * 60_000,
  });
}

export function usePlans() {
  return useQuery<SubscriptionPlan[]>({
    queryKey: paymentKeys.plans(),
    queryFn: listPlans,
    staleTime: 60 * 60_000, // plans rarely change
  });
}

// ─── Writes ─────────────────────────────────────────────

export function useCreatePaymentLink() {
  const qc = useQueryClient();
  const bId = auth$.businessId.get();
  return useMutation<{ shortUrl: string }, Error, CreatePaymentLinkDto>({
    mutationFn: (dto) => createPaymentLink(bId!, dto),
    onSuccess: () => {
      haptic('revealMoney');
      qc.invalidateQueries({ queryKey: paymentKeys.links(bId ?? 'none') });
    },
    onError: () => haptic('error'),
  });
}

export function useCreateSubscription() {
  const qc = useQueryClient();
  const bId = auth$.businessId.get();
  return useMutation<
    { shortUrl: string | null; invoiceNumber: string },
    Error,
    CreateSubscriptionDto
  >({
    mutationFn: (dto) => createSubscription(bId!, dto),
    onSuccess: () => {
      haptic('revealMoney');
      qc.invalidateQueries({
        queryKey: paymentKeys.subscription(bId ?? 'none'),
      });
    },
    onError: () => haptic('error'),
  });
}

export function useCancelSubscription() {
  const qc = useQueryClient();
  const bId = auth$.businessId.get();
  return useMutation<{ message: string }, Error, void>({
    mutationFn: () => cancelSubscription(bId!),
    onSuccess: () => {
      haptic('confirm');
      qc.invalidateQueries({
        queryKey: paymentKeys.subscription(bId ?? 'none'),
      });
    },
    onError: () => haptic('error'),
  });
}
