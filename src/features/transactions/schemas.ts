/**
 * Transaction feature schemas.
 *
 * The backend uses snake_case Postgres column names and serializes
 * numeric columns as STRINGS (not numbers). We use z.coerce.number()
 * to handle both shapes.
 *
 * IMPORTANT type mapping:
 *   Mobile uses 'payment'
 *   Backend uses 'payment_received'
 *   The api.ts layer handles the bidirectional mapping.
 */

import { z } from 'zod';

export const transactionTypeMobile = ['sale', 'expense', 'payment'] as const;
export type TransactionTypeMobile = (typeof transactionTypeMobile)[number];

// What the backend accepts/returns
export const transactionTypeBackend = ['sale', 'expense', 'payment_received'] as const;
export type TransactionTypeBackend = (typeof transactionTypeBackend)[number];

// ─── Mappers between mobile and backend type names ─────
export function toBackendType(t: TransactionTypeMobile): TransactionTypeBackend {
  return t === 'payment' ? 'payment_received' : t;
}

export function fromBackendType(t: string): TransactionTypeMobile {
  if (t === 'payment_received') return 'payment';
  if (t === 'sale') return 'sale';
  if (t === 'expense') return 'expense';
  return 'sale';
}

// ─── Transaction record (from server) ───────────────────
// Accepts both snake_case and camelCase keys for forward compatibility.
export const transactionSchema = z
  .object({
    id: z.string(),
    business_id: z.string().optional(),
    businessId: z.string().optional(),
    type: z.string(),
    amount: z.coerce.number(),
    item: z.string().nullable().optional(),
    quantity: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    customer_name: z.string().nullable().optional(),
    customerName: z.string().nullable().optional(),
    recorded_via: z.string().optional(),
    recordedVia: z.string().optional(),
    created_at: z.string().optional(),
    createdAt: z.string().optional(),
  })
  .transform((row) => ({
    id: row.id,
    businessId: row.businessId ?? row.business_id ?? '',
    type: fromBackendType(row.type),
    amount: row.amount,
    item: row.item ?? null,
    quantity: row.quantity ?? null,
    category: row.category ?? null,
    notes: row.notes ?? null,
    customerName: row.customerName ?? row.customer_name ?? null,
    recordedVia: row.recordedVia ?? row.recorded_via ?? 'app',
    createdAt: row.createdAt ?? row.created_at ?? new Date().toISOString(),
  }));

export type Transaction = z.infer<typeof transactionSchema>;

// ─── List response ───────────────────────────────────────
export const transactionListSchema = z.object({
  data: z.array(transactionSchema),
  total: z.coerce.number(),
  limit: z.coerce.number().optional(),
  offset: z.coerce.number().optional(),
});
export type TransactionList = z.infer<typeof transactionListSchema>;

// ─── Create transaction request ──────────────────────────
export const createTransactionSchema = z.object({
  type: z.enum(transactionTypeMobile),
  amount: z.number().positive('Amount must be greater than 0'),
  item: z.string().max(200).optional(),
  quantity: z.string().max(40).optional(),
  category: z.string().max(60).optional(),
  notes: z.string().max(500).optional(),
  customerName: z.string().max(120).optional(),
  recordedVia: z
    .enum(['voice', 'text', 'whatsapp', 'manual', 'ondc', 'camera', 'app'])
    .optional()
    .default('app'),
});
export type CreateTransactionDto = z.infer<typeof createTransactionSchema>;

// ─── Create response ─────────────────────────────────────
export const createTransactionResponseSchema = z.object({
  transaction: transactionSchema,
  todayTotal: z.coerce.number(),
  todayCount: z.coerce.number(),
});
export type CreateTransactionResponse = z.infer<typeof createTransactionResponseSchema>;

// ─── Daily P&L ───────────────────────────────────────────
export const dailyPnlSchema = z.object({
  date: z.string(),
  totalRevenue: z.coerce.number(),
  totalExpenses: z.coerce.number(),
  profit: z.coerce.number(),
  transactionCount: z.coerce.number(),
  topItems: z.array(
    z.object({
      item: z.string(),
      amount: z.coerce.number(),
      count: z.coerce.number(),
    }),
  ),
});
export type DailyPnl = z.infer<typeof dailyPnlSchema>;
