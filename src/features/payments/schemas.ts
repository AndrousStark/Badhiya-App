/**
 * Payments feature schemas — payment links, subscriptions, plans.
 *
 * Backend endpoints:
 *   POST /businesses/:id/payments/link     — create Razorpay payment link
 *   GET  /businesses/:id/payments/links    — list payment links
 *   GET  /businesses/:id/subscription      — current plan + subscription
 *   POST /businesses/:id/subscription      — create/upgrade subscription
 *   DELETE /businesses/:id/subscription    — cancel subscription
 *   GET  /plans                            — list available plans (public)
 */

import { z } from 'zod';

// ─── Enums ──────────────────────────────────────────────
export const planCodeEnum = z.enum(['free', 'starter', 'growth', 'enterprise']);
export type PlanCode = z.infer<typeof planCodeEnum>;

export const billingCycleEnum = z.enum(['monthly', 'annual']);
export type BillingCycle = z.infer<typeof billingCycleEnum>;

export const paymentLinkStatusEnum = z.enum([
  'created',
  'sent',
  'partially_paid',
  'paid',
  'expired',
  'cancelled',
]);
export type PaymentLinkStatus = z.infer<typeof paymentLinkStatusEnum>;

export const paymentSourceEnum = z.enum([
  'web',
  'whatsapp',
  'app',
  'ondc',
  'invoice',
]);
export type PaymentSource = z.infer<typeof paymentSourceEnum>;

// ─── Subscription plan ──────────────────────────────────
export const subscriptionPlanSchema = z
  .object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    name_hindi: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    monthly_price: z.coerce.number(),
    annual_price: z.coerce.number(),
    currency: z.string().optional(),
    features: z.record(z.unknown()).optional().default({}),
    limits: z.record(z.coerce.number()).optional().default({}),
    is_active: z.boolean().optional(),
    sort_order: z.coerce.number().optional(),
  })
  .passthrough()
  .transform((row) => ({
    id: row.id,
    code: row.code as PlanCode,
    name: row.name,
    nameHindi: row.name_hindi ?? null,
    description: row.description ?? null,
    monthlyPrice: row.monthly_price,
    annualPrice: row.annual_price,
    currency: row.currency ?? 'INR',
    features: row.features as Record<string, unknown>,
    limits: row.limits as Record<string, number>,
    isActive: row.is_active ?? true,
    sortOrder: row.sort_order ?? 0,
  }));
export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;

// ─── Business plan (current subscription) ───────────────
export const businessPlanSchema = z.object({
  plan: subscriptionPlanSchema,
  subscription: z
    .object({
      id: z.string(),
      billing_cycle: z.string().optional(),
      amount: z.coerce.number().optional(),
      status: z.string().optional(),
      next_billing_date: z.string().nullable().optional(),
      razorpay_subscription_id: z.string().nullable().optional(),
    })
    .passthrough()
    .transform((row) => ({
      id: row.id,
      billingCycle: (row.billing_cycle ?? 'monthly') as BillingCycle,
      amount: row.amount ?? 0,
      status: row.status ?? 'active',
      nextBillingDate: row.next_billing_date ?? null,
    }))
    .nullable(),
});
export type BusinessPlan = z.infer<typeof businessPlanSchema>;

// ─── Payment link ───────────────────────────────────────
export const paymentLinkSchema = z.object({
  id: z.string(),
  amount: z.coerce.number(),
  description: z.string().nullable().optional(),
  customerName: z.string().nullable().optional(),
  customerPhone: z.string().nullable().optional(),
  status: z.string(),
  shortUrl: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  expiresAt: z.string().nullable().optional(),
});
export type PaymentLink = z.infer<typeof paymentLinkSchema>;

export const paymentLinkListSchema = z.object({
  data: z.array(paymentLinkSchema),
  meta: z.object({
    total: z.coerce.number(),
    limit: z.coerce.number(),
    offset: z.coerce.number(),
  }),
});
export type PaymentLinkList = z.infer<typeof paymentLinkListSchema>;

// ─── DTOs ───────────────────────────────────────────────
export const createPaymentLinkSchema = z.object({
  amount: z.number().min(1, 'Amount must be at least ₹1'),
  description: z.string().max(500).optional(),
  customerName: z.string().min(1, 'Customer name required').max(255),
  customerPhone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
  customerEmail: z.string().email().optional().or(z.literal('').transform(() => undefined)),
  orderId: z.string().uuid().optional(),
  source: paymentSourceEnum.default('app'),
  expiresInHours: z.number().int().min(1).max(720).default(72),
});
export type CreatePaymentLinkDto = z.infer<typeof createPaymentLinkSchema>;

export const createSubscriptionSchema = z.object({
  planCode: planCodeEnum,
  billingCycle: billingCycleEnum,
});
export type CreateSubscriptionDto = z.infer<typeof createSubscriptionSchema>;

// ─── Plan metadata ──────────────────────────────────────
export const PLAN_META: Record<
  string,
  { emoji: string; color: string; tagline: string }
> = {
  free:       { emoji: '🌱', color: '#9CA3AF', tagline: 'Shuru karo' },
  starter:    { emoji: '🚀', color: '#F59E0B', tagline: 'Chhoti dukan ke liye' },
  growth:     { emoji: '📈', color: '#1A56DB', tagline: 'Badhte business ke liye' },
  enterprise: { emoji: '🏢', color: '#7C3AED', tagline: 'Bada business, full power' },
};

export const LINK_STATUS_META: Record<
  string,
  { label: string; color: string }
> = {
  created:        { label: 'Created',   color: '#6B7280' },
  sent:           { label: 'Sent',      color: '#1A56DB' },
  partially_paid: { label: 'Partial',   color: '#F59E0B' },
  paid:           { label: 'Paid',      color: '#059669' },
  expired:        { label: 'Expired',   color: '#DC2626' },
  cancelled:      { label: 'Cancelled', color: '#9CA3AF' },
};
