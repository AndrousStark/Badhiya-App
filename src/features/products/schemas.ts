/**
 * Products (inventory) feature schemas.
 *
 * Backend column names (snake_case Postgres):
 *   stock_quantity, low_stock_threshold, cost_price, is_active
 * Mobile uses camelCase: stockQuantity, lowStockThreshold, costPrice, isActive
 *
 * Numeric fields come back as STRINGS from PG numeric — coerce.
 */

import { z } from 'zod';

// ─── Product record ─────────────────────────────────────
export const productSchema = z
  .object({
    id: z.string(),
    business_id: z.string().optional(),
    name: z.string(),
    category: z.string().nullable().optional(),
    price: z.coerce.number().nullable().optional(),
    cost_price: z.coerce.number().nullable().optional(),
    stock_quantity: z.coerce.number(),
    low_stock_threshold: z.coerce.number().nullable().optional(),
    barcode: z.string().nullable().optional(),
    photo_uri: z.string().nullable().optional(),
    is_active: z.boolean().optional(),
    expiry_date: z.string().nullable().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .transform((row) => ({
    id: row.id,
    name: row.name,
    category: row.category ?? null,
    price: row.price ?? 0,
    costPrice: row.cost_price ?? null,
    stockQuantity: row.stock_quantity,
    lowStockThreshold: row.low_stock_threshold ?? 5,
    barcode: row.barcode ?? null,
    photoUri: row.photo_uri ?? null,
    isActive: row.is_active ?? true,
    expiryDate: row.expiry_date ?? null,
    createdAt: row.created_at ?? new Date().toISOString(),
    // Computed
    isLowStock: row.stock_quantity <= (row.low_stock_threshold ?? 5),
    isOutOfStock: row.stock_quantity <= 0,
    margin:
      row.price && row.cost_price && row.cost_price > 0
        ? Math.round(((row.price - row.cost_price) / row.price) * 100)
        : null,
    stockValue: (row.cost_price ?? row.price ?? 0) * row.stock_quantity,
  }));

export type Product = z.infer<typeof productSchema>;

// ─── Add product request ────────────────────────────────
export const addProductSchema = z.object({
  name: z
    .string()
    .min(2, 'Product name is too short')
    .max(120, 'Product name is too long'),
  category: z.string().max(60).optional(),
  price: z.number().positive('Price must be greater than 0').optional(),
  costPrice: z.number().positive('Cost price must be greater than 0').optional(),
  stockQuantity: z.number().int().min(0).optional(),
  barcode: z
    .string()
    .min(8, 'Barcode is too short')
    .max(20, 'Barcode is too long')
    .optional()
    .or(z.literal('').transform(() => undefined)),
});
export type AddProductDto = z.infer<typeof addProductSchema>;

// ─── Update stock request ───────────────────────────────
export const updateStockSchema = z.object({
  quantityChange: z
    .number()
    .int()
    .refine((n) => n !== 0, 'Quantity change must not be zero'),
});
export type UpdateStockDto = z.infer<typeof updateStockSchema>;

// ─── Common categories for the kirana segment ───────────
export const productCategories = [
  { value: 'grocery', label: 'Grocery / किराना', emoji: '🛒' },
  { value: 'dairy', label: 'Dairy / दूध', emoji: '🥛' },
  { value: 'snacks', label: 'Snacks / नमकीन', emoji: '🥨' },
  { value: 'beverages', label: 'Beverages / पेय', emoji: '🥤' },
  { value: 'personal_care', label: 'Personal Care', emoji: '🧴' },
  { value: 'household', label: 'Household / घरेलू', emoji: '🧹' },
  { value: 'frozen', label: 'Frozen', emoji: '🧊' },
  { value: 'other', label: 'Other / और', emoji: '✨' },
] as const;

export type ProductCategory = (typeof productCategories)[number]['value'];
