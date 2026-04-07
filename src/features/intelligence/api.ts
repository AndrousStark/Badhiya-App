/**
 * Intelligence API — competitor price tracking.
 *
 * 9 endpoints under /businesses/:id/intelligence.
 */

import { z } from 'zod';
import { api } from '@/lib/api';
import {
  trackedProductSchema,
  priceComparisonSchema,
  priceHistoryPointSchema,
  priceAlertSchema,
  insightsResponseSchema,
  type TrackedProduct,
  type PriceComparison,
  type PriceHistoryPoint,
  type PriceAlert,
  type InsightsResponse,
  type TrackProductDto,
} from './schemas';

const base = (bId: string) => `/businesses/${bId}/intelligence`;

export async function getTrackedProducts(
  bId: string,
): Promise<TrackedProduct[]> {
  const data = await api.get<unknown>(`${base(bId)}/competitors`);
  return z.array(trackedProductSchema).parse(data);
}

export async function comparePrices(
  bId: string,
  productName: string,
  options: { category?: string; platform?: string } = {},
): Promise<PriceComparison> {
  const params: Record<string, string> = { productName };
  if (options.category) params.category = options.category;
  if (options.platform) params.platform = options.platform;
  const data = await api.get<unknown>(`${base(bId)}/prices/compare`, { params });
  return priceComparisonSchema.parse(data);
}

export async function getPriceTrends(
  bId: string,
  productName: string,
  days = 30,
): Promise<PriceHistoryPoint[]> {
  const data = await api.get<unknown>(`${base(bId)}/prices/trends`, {
    params: { productName, days: String(days) },
  });
  return z.array(priceHistoryPointSchema).parse(data);
}

export async function getPriceAlerts(
  bId: string,
  limit = 20,
): Promise<PriceAlert[]> {
  const data = await api.get<unknown>(`${base(bId)}/alerts`, {
    params: { limit: String(limit) },
  });
  return z.array(priceAlertSchema).parse(data);
}

export async function markAlertRead(
  bId: string,
  alertId: string,
): Promise<{ success: boolean }> {
  return api.post<{ success: boolean }>(`${base(bId)}/alerts/${alertId}/read`);
}

export async function trackProduct(
  bId: string,
  dto: TrackProductDto,
): Promise<{ id: string; searchQuery: string; platforms: string[] }> {
  return api.post(`${base(bId)}/track`, dto);
}

export async function untrackProduct(
  bId: string,
  trackId: string,
): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`${base(bId)}/track/${trackId}`);
}

export async function getInsights(
  bId: string,
  options: { limit?: number; offset?: number } = {},
): Promise<InsightsResponse> {
  const params: Record<string, string> = {};
  if (options.limit !== undefined) params.limit = String(options.limit);
  if (options.offset !== undefined) params.offset = String(options.offset);
  const data = await api.get<unknown>(`${base(bId)}/insights`, { params });
  return insightsResponseSchema.parse(data);
}

export async function refreshPrices(
  bId: string,
): Promise<{ queued: string[] }> {
  return api.post<{ queued: string[] }>(`${base(bId)}/refresh`);
}
