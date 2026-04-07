/**
 * Search feature schemas.
 *
 * Backend GET /businesses/:id/search?q=foo returns:
 *   { transactions: [...], customers: [...], products: [...] }
 *
 * Each group has at most 5 results. Numeric fields come back as PG strings.
 */

import { z } from 'zod';

export const searchTransactionSchema = z
  .object({
    id: z.string(),
    type: z.string(),
    item: z.string().nullable().optional(),
    amount: z.coerce.number(),
    created_at: z.string().optional(),
  })
  .transform((row) => ({
    id: row.id,
    kind: 'transaction' as const,
    type: row.type,
    label: row.item ?? 'Transaction',
    amount: row.amount,
    createdAt: row.created_at ?? '',
  }));

export const searchCustomerSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    phone: z.string().nullable().optional(),
    total_outstanding: z.coerce.number(),
  })
  .transform((row) => ({
    id: row.id,
    kind: 'customer' as const,
    label: row.name,
    phone: row.phone ?? null,
    outstanding: row.total_outstanding,
  }));

export const searchProductSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    category: z.string().nullable().optional(),
    price: z.coerce.number().nullable().optional(),
    stock_quantity: z.coerce.number(),
  })
  .transform((row) => ({
    id: row.id,
    kind: 'product' as const,
    label: row.name,
    category: row.category ?? null,
    price: row.price ?? 0,
    stock: row.stock_quantity,
  }));

export const searchResultSchema = z.object({
  transactions: z.array(searchTransactionSchema).default([]),
  customers: z.array(searchCustomerSchema).default([]),
  products: z.array(searchProductSchema).default([]),
});

export type SearchResult = z.infer<typeof searchResultSchema>;
export type SearchTransaction = z.infer<typeof searchTransactionSchema>;
export type SearchCustomer = z.infer<typeof searchCustomerSchema>;
export type SearchProduct = z.infer<typeof searchProductSchema>;
