/**
 * Business feature schemas.
 *
 * Mirrors the backend BusinessesController contracts. The onboarding
 * wizard collects these fields across 4 steps and submits a single
 * POST /businesses request on completion.
 */

import { z } from 'zod';

export const businessTypes = [
  'kirana',
  'restaurant',
  'medical',
  'garment',
  'electronics',
  'salon',
  'services',
  'other',
] as const;

export type BusinessType = (typeof businessTypes)[number];

export const createBusinessSchema = z.object({
  name: z
    .string()
    .min(2, 'Shop name is too short')
    .max(120, 'Shop name is too long'),
  type: z.enum(businessTypes),
  city: z.string().min(2).max(80),
  area: z.string().max(120).optional(),
  gstin: z
    .string()
    .regex(
      /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}\d{1}[Z]{1}[A-Z\d]{1}$/,
      'Invalid GSTIN format',
    )
    .optional()
    .or(z.literal('').transform(() => undefined)),
  udyam: z
    .string()
    .regex(/^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/, 'Invalid Udyam number')
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

export const businessResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  city: z.string().nullable(),
  area: z.string().nullable(),
  gstin: z.string().nullable(),
  udyam: z.string().nullable(),
  healthScore: z.number().nullable(),
  healthLevel: z.string().nullable(),
  createdAt: z.string().optional(),
});

export type CreateBusinessDto = z.infer<typeof createBusinessSchema>;
export type Business = z.infer<typeof businessResponseSchema>;

// ─── Dashboard KPIs ──────────────────────────────────────
// Backend GET /businesses/:id/dashboard returns:
//   { todayRevenue, todayExpenses, todayProfit, totalOutstanding,
//     healthScore, healthLevel, transactionCount }
export const dashboardSchema = z.object({
  todayRevenue: z.coerce.number(),
  todayExpenses: z.coerce.number(),
  todayProfit: z.coerce.number(),
  totalOutstanding: z.coerce.number(),
  healthScore: z.coerce.number(),
  healthLevel: z.string().nullable().optional(),
  transactionCount: z.coerce.number(),
});

export type Dashboard = z.infer<typeof dashboardSchema>;

// ─── Store stats (for Dukan tab header) ─────────────────
// Backend GET /businesses/:id/store/stats returns:
//   { totalProducts, ordersToday, todayRevenue, recentOrders: [...] }
export const storeStatsSchema = z.object({
  totalProducts: z.coerce.number(),
  ordersToday: z.coerce.number(),
  todayRevenue: z.coerce.number(),
  recentOrders: z
    .array(
      z.object({
        id: z.string(),
        customer: z.string().nullable().optional(),
        total: z.coerce.number(),
        type: z.string().optional(),
        source: z.string().nullable().optional(),
        created_at: z.string().optional(),
      }),
    )
    .default([]),
});
export type StoreStats = z.infer<typeof storeStatsSchema>;

// ─── Government scheme matches ──────────────────────────
// Backend GET /businesses/:id/schemes returns:
//   Array<{ id, name, nameHi, maxAmount, subsidy, matchScore, category }>
export const schemeMatchSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameHi: z.string().nullable().optional(),
  maxAmount: z.coerce.number().nullable().optional(),
  subsidy: z.string().nullable().optional(),
  matchScore: z.coerce.number(),
  category: z.string().nullable().optional(),
});
export type SchemeMatch = z.infer<typeof schemeMatchSchema>;

// ─── UI helpers ───────────────────────────────────────────
export const businessTypeLabels: Record<BusinessType, { hi: string; en: string; emoji: string }> = {
  kirana:      { hi: 'किराना / General Store', en: 'Kirana / Grocery',  emoji: '🏪' },
  restaurant:  { hi: 'रेस्टोरेंट / ढाबा',       en: 'Restaurant / Café', emoji: '🍽️' },
  medical:     { hi: 'मेडिकल / फार्मेसी',      en: 'Medical / Pharmacy', emoji: '💊' },
  garment:     { hi: 'कपड़े की दुकान',         en: 'Garment / Apparel', emoji: '👕' },
  electronics: { hi: 'इलेक्ट्रॉनिक्स',          en: 'Electronics',       emoji: '📱' },
  salon:       { hi: 'सैलून / पार्लर',          en: 'Salon / Parlor',    emoji: '💇' },
  services:    { hi: 'सेवाएँ',                 en: 'Services',          emoji: '🔧' },
  other:       { hi: 'और / Other',            en: 'Other',             emoji: '✨' },
};
