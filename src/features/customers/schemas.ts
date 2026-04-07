/**
 * Customer + credit ledger schemas.
 *
 * Backend status enum: 'paid' | 'overdue_60' | 'overdue_30' | 'current'
 * Mobile status enum:  'paid' | 'urgent'    | 'aging'      | 'ok'
 *
 * The mapper lets the rest of the app use the friendlier mobile names
 * without leaking backend-specific values into UI components.
 *
 * Backend ledger entry types:
 *   'credit_given'     — udhar diya
 *   'payment_received' — paise mile
 *
 * Mobile uses 'credit' | 'payment' internally, mapped at the boundary.
 */

import { z } from 'zod';

// ─── Status mapping ─────────────────────────────────────
export const customerStatuses = ['paid', 'urgent', 'aging', 'ok'] as const;
export type CustomerStatus = (typeof customerStatuses)[number];

export function mapStatus(backendStatus: string | null | undefined): CustomerStatus {
  switch (backendStatus) {
    case 'paid':
      return 'paid';
    case 'overdue_60':
      return 'urgent';
    case 'overdue_30':
      return 'aging';
    case 'current':
      return 'ok';
    default:
      return 'ok';
  }
}

// ─── Customer record ────────────────────────────────────
export const customerSchema = z
  .object({
    id: z.string(),
    business_id: z.string().optional(),
    name: z.string(),
    phone: z.string().nullable().optional(),
    total_outstanding: z.coerce.number(),
    last_transaction_at: z.string().nullable().optional(),
    last_payment_at: z.string().nullable().optional(),
    created_at: z.string().optional(),
    status: z.string().optional(),
  })
  .transform((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone ?? null,
    initial: (row.name?.charAt(0) ?? '?').toUpperCase(),
    totalOutstanding: row.total_outstanding,
    status: mapStatus(row.status),
    lastPaymentAt: row.last_payment_at ?? null,
    lastTransactionAt: row.last_transaction_at ?? null,
    daysAging: computeDaysAging(row.last_transaction_at),
    lastPaymentText: lastPaymentText(row.last_payment_at, row.last_transaction_at),
    createdAt: row.created_at ?? new Date().toISOString(),
  }));

export type Customer = z.infer<typeof customerSchema>;

// ─── Credit summary ────────────────────────────────────
export const creditSummarySchema = z.object({
  totalOutstanding: z.coerce.number(),
  overdue60Plus: z.coerce.number(),
  activeCustomers: z.coerce.number(),
  totalCustomers: z.coerce.number(),
});

export type CreditSummary = z.infer<typeof creditSummarySchema>;

// ─── Ledger entry ──────────────────────────────────────
export const ledgerEntryTypes = ['credit', 'payment'] as const;
export type LedgerEntryType = (typeof ledgerEntryTypes)[number];

function mapLedgerType(backend: string): LedgerEntryType {
  return backend === 'payment_received' ? 'payment' : 'credit';
}

export const ledgerEntrySchema = z
  .object({
    id: z.string(),
    business_id: z.string().optional(),
    customer_id: z.string().optional(),
    type: z.string(),
    amount: z.coerce.number(),
    description: z.string().nullable().optional(),
    recorded_via: z.string().nullable().optional(),
    created_at: z.string(),
  })
  .transform((row) => ({
    id: row.id,
    type: mapLedgerType(row.type),
    amount: row.amount,
    description: row.description ?? null,
    recordedVia: row.recorded_via ?? 'app',
    createdAt: row.created_at,
  }));

export type LedgerEntry = z.infer<typeof ledgerEntrySchema>;

// ─── Customer ledger response ──────────────────────────
export const customerLedgerSchema = z.object({
  customer: customerSchema,
  entries: z.array(ledgerEntrySchema),
});
export type CustomerLedger = z.infer<typeof customerLedgerSchema>;

// ─── Request bodies ────────────────────────────────────
export const giveCreditSchema = z.object({
  customerName: z.string().min(2, 'Customer name is too short').max(120),
  customerPhone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  amount: z.number().positive('Amount must be greater than 0'),
  description: z.string().max(500).optional(),
});
export type GiveCreditDto = z.infer<typeof giveCreditSchema>;

export const receivePaymentSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
});
export type ReceivePaymentDto = z.infer<typeof receivePaymentSchema>;

// ─── Mutation responses ────────────────────────────────
export const creditMutationResponseSchema = z.object({
  customer: customerSchema,
  newOutstanding: z.coerce.number(),
});
export type CreditMutationResponse = z.infer<typeof creditMutationResponseSchema>;

// ─── Helpers ───────────────────────────────────────────
function computeDaysAging(isoDate: string | null | undefined): number {
  if (!isoDate) return 0;
  try {
    const then = new Date(isoDate).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((now - then) / (1000 * 60 * 60 * 24)));
  } catch {
    return 0;
  }
}

function lastPaymentText(
  lastPayment: string | null | undefined,
  lastTransaction: string | null | undefined,
): string {
  if (lastPayment) {
    const days = computeDaysAging(lastPayment);
    if (days === 0) return 'Aaj paid';
    if (days === 1) return 'Kal paid';
    return `Last paid · ${days} din`;
  }
  if (lastTransaction) {
    const days = computeDaysAging(lastTransaction);
    if (days >= 60) return `Overdue · ${days} din`;
    return `${days} din pehle`;
  }
  return 'Naya grahak';
}
