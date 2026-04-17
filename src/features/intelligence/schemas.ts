/**
 * Intelligence feature schemas — competitor price tracking, alerts, insights.
 *
 * Backend endpoints (under /businesses/:id/intelligence):
 *   GET  /competitors          — tracked products + latest prices
 *   GET  /prices/compare       — cross-platform price comparison
 *   GET  /prices/trends        — price history over N days
 *   GET  /alerts               — price drop/undercut alerts
 *   POST /alerts/:alertId/read — mark alert read
 *   POST /track                — start tracking a product
 *   DELETE /track/:trackId     — stop tracking
 *   GET  /insights             — weekly digest insights
 *   POST /refresh              — trigger price refresh
 */

import { z } from 'zod';

// ─── Enums ──────────────────────────────────────────────
export const platformEnum = z.enum([
  'blinkit',
  'zepto',
  'bigbasket',
  'jiomart',
  'dmart',
  'swiggy_instamart',
  'flipkart_minutes',
]);
export type Platform = z.infer<typeof platformEnum>;

export const alertSeverityEnum = z.enum(['critical', 'high', 'medium', 'low']);
export type AlertSeverity = z.infer<typeof alertSeverityEnum>;

export const priceAlertTypeEnum = z.enum(['undercut', 'price_drop', 'price_increase']);
export type PriceAlertType = z.infer<typeof priceAlertTypeEnum>;

// ─── Competitor price ───────────────────────────────────
export const competitorPriceSchema = z.object({
  id: z.string(),
  productName: z.string(),
  category: z.string().nullable(),
  platform: z.string(),
  price: z.coerce.number(),
  mrp: z.coerce.number().nullable(),
  discountPct: z.coerce.number(),
  available: z.boolean(),
  productUrl: z.string().nullable(),
  fetchedAt: z.string(),
});
export type CompetitorPrice = z.infer<typeof competitorPriceSchema>;

// ─── Tracked product ────────────────────────────────────
export const trackedProductSchema = z.object({
  id: z.string(),
  searchQuery: z.string(),
  platforms: z.array(z.string()),
  isActive: z.boolean(),
  lastCheckedAt: z.string().nullable(),
  latestPrices: z.array(competitorPriceSchema),
});
export type TrackedProduct = z.infer<typeof trackedProductSchema>;

// ─── Price comparison ───────────────────────────────────
export const priceComparisonSchema = z.object({
  productName: z.string(),
  yourPrice: z.coerce.number().nullable(),
  competitors: z.array(
    z.object({
      platform: z.string(),
      price: z.coerce.number(),
      mrp: z.coerce.number().nullable(),
      discountPct: z.coerce.number(),
      available: z.boolean(),
      difference: z.coerce.number().nullable(),
      fetchedAt: z.string(),
    }),
  ),
});
export type PriceComparison = z.infer<typeof priceComparisonSchema>;

// ─── Price history point ────────────────────────────────
export const priceHistoryPointSchema = z.object({
  date: z.string(),
  platform: z.string(),
  price: z.coerce.number(),
  available: z.boolean(),
});
export type PriceHistoryPoint = z.infer<typeof priceHistoryPointSchema>;

// ─── Price alert ────────────────────────────────────────
export const priceAlertSchema = z.object({
  id: z.string(),
  productName: z.string(),
  platform: z.string(),
  competitorPrice: z.coerce.number(),
  yourPrice: z.coerce.number(),
  priceDifference: z.coerce.number(),
  alertType: z.string(),
  severity: z.string(),
  message: z.string(),
  isRead: z.boolean(),
  createdAt: z.string(),
});
export type PriceAlert = z.infer<typeof priceAlertSchema>;

// ─── Weekly digest / insight ────────────────────────────
export const weeklyDigestSchema = z.object({
  id: z.string(),
  title: z.string(),
  titleHindi: z.string().nullable(),
  content: z.string(),
  data: z.record(z.unknown()).optional().default({}),
  createdAt: z.string(),
});
export type WeeklyDigest = z.infer<typeof weeklyDigestSchema>;

export const insightsResponseSchema = z.object({
  insights: z.array(weeklyDigestSchema),
  total: z.coerce.number(),
});
export type InsightsResponse = z.infer<typeof insightsResponseSchema>;

// ─── Track product request ──────────────────────────────
export const trackProductSchema = z.object({
  searchQuery: z.string().min(2, 'Product name too short').max(255),
  platforms: z
    .array(platformEnum)
    .min(1)
    .default(['blinkit', 'zepto', 'bigbasket']),
});
export type TrackProductDto = z.infer<typeof trackProductSchema>;

// ─── Static metadata ────────────────────────────────────
export const PLATFORM_META: Record<
  string,
  { label: string; color: string; emoji: string }
> = {
  blinkit:          { label: 'Blinkit',          color: '#F9E923', emoji: '⚡' },
  zepto:            { label: 'Zepto',            color: '#6C3BF5', emoji: '🚀' },
  bigbasket:        { label: 'BigBasket',        color: '#84C225', emoji: '🛒' },
  jiomart:          { label: 'JioMart',          color: '#0070C0', emoji: '🛍️' },
  dmart:            { label: 'DMart',            color: '#1A8C28', emoji: '🏪' },
  swiggy_instamart: { label: 'Swiggy Instamart', color: '#FC8019', emoji: '🧡' },
  flipkart_minutes: { label: 'Flipkart Minutes', color: '#2874F0', emoji: '📦' },
};

export type SeverityMeta = { label: string; color: string; emoji: string };
const SEVERITY_META_STATIC = {
  critical: { label: 'Critical', color: '#DC2626', emoji: '🔴' },
  high:     { label: 'High',     color: '#EA580C', emoji: '🟠' },
  medium:   { label: 'Medium',   color: '#F59E0B', emoji: '🟡' },
  low:      { label: 'Low',      color: '#059669', emoji: '🟢' },
} satisfies Record<string, SeverityMeta>;
export const SEVERITY_META: Record<string, SeverityMeta> = SEVERITY_META_STATIC;

/** Resolves a severity string to its metadata. */
export function getSeverityMeta(severity: string): SeverityMeta {
  return SEVERITY_META[severity] ?? SEVERITY_META_STATIC.low;
}
