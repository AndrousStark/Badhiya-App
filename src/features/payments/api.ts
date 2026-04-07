/**
 * Payments API — payment links, subscriptions, plans.
 */

import { z } from 'zod';
import { api } from '@/lib/api';
import {
  subscriptionPlanSchema,
  businessPlanSchema,
  paymentLinkListSchema,
  type SubscriptionPlan,
  type BusinessPlan,
  type PaymentLinkList,
  type CreatePaymentLinkDto,
  type CreateSubscriptionDto,
} from './schemas';

// ─── Payment links ──────────────────────────────────────

export async function createPaymentLink(
  bId: string,
  dto: CreatePaymentLinkDto,
): Promise<{ shortUrl: string }> {
  return api.post(`/businesses/${bId}/payments/link`, dto);
}

export async function listPaymentLinks(
  bId: string,
  options: { status?: string; limit?: number; offset?: number } = {},
): Promise<PaymentLinkList> {
  const params: Record<string, string> = {};
  if (options.status) params.status = options.status;
  if (options.limit !== undefined) params.limit = String(options.limit);
  if (options.offset !== undefined) params.offset = String(options.offset);
  const data = await api.get<unknown>(`/businesses/${bId}/payments/links`, {
    params,
  });
  return paymentLinkListSchema.parse(data);
}

// ─── Subscription ───────────────────────────────────────

export async function getBusinessSubscription(
  bId: string,
): Promise<BusinessPlan> {
  const data = await api.get<unknown>(`/businesses/${bId}/subscription`);
  return businessPlanSchema.parse(data);
}

export async function createSubscription(
  bId: string,
  dto: CreateSubscriptionDto,
): Promise<{ shortUrl: string | null; invoiceNumber: string }> {
  return api.post(`/businesses/${bId}/subscription`, dto);
}

export async function cancelSubscription(
  bId: string,
): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/businesses/${bId}/subscription`);
}

// ─── Plans (public) ─────────────────────────────────────

export async function listPlans(): Promise<SubscriptionPlan[]> {
  const data = await api.get<unknown>('/plans');
  return z.array(subscriptionPlanSchema).parse(data);
}
