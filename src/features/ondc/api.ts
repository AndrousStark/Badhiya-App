/**
 * ONDC API — wraps the 11 backend ONDC management endpoints.
 *
 * The mobile app NEVER speaks the Beckn protocol directly. The backend
 * handles all signing/encryption with the ONDC network — mobile only
 * uses the management API surface for sellers.
 */

import { z } from 'zod';
import { api } from '@/lib/api';
import {
  ondcConfigResponseSchema,
  ondcConfigRegisteredSchema,
  ondcStatsSchema,
  ondcCatalogItemSchema,
  ondcOrderListSchema,
  type OndcConfig,
  type OndcConfigRegistered,
  type OndcStats,
  type OndcCatalogItem,
  type OndcOrderList,
  type RegisterSellerDto,
  type CatalogSyncDto,
  type UpdateOrderStatusDto,
} from './schemas';

// ─── Configuration ──────────────────────────────────────
export async function getOndcConfig(businessId: string): Promise<OndcConfig> {
  const data = await api.get<unknown>(`/businesses/${businessId}/ondc/config`);
  return ondcConfigResponseSchema.parse(data);
}

export async function registerOndcSeller(
  businessId: string,
  dto: RegisterSellerDto,
): Promise<OndcConfigRegistered> {
  const data = await api.post<unknown>(
    `/businesses/${businessId}/ondc/register`,
    dto,
  );
  return ondcConfigRegisteredSchema.parse(data);
}

export async function updateOndcConfig(
  businessId: string,
  updates: Partial<RegisterSellerDto>,
): Promise<OndcConfigRegistered> {
  const data = await api.patch<unknown>(
    `/businesses/${businessId}/ondc/config`,
    updates,
  );
  return ondcConfigRegisteredSchema.parse(data);
}

export async function toggleOndcActive(
  businessId: string,
  isActive: boolean,
): Promise<{ isActive: boolean }> {
  return api.post<{ isActive: boolean }>(
    `/businesses/${businessId}/ondc/toggle`,
    { isActive },
  );
}

// ─── Catalog ────────────────────────────────────────────
export async function syncCatalog(
  businessId: string,
  dto: CatalogSyncDto,
): Promise<{ synced: number; skipped: number; failed: number }> {
  return api.post(`/businesses/${businessId}/ondc/catalog/sync`, dto);
}

export async function getCatalogItems(
  businessId: string,
): Promise<OndcCatalogItem[]> {
  const data = await api.get<unknown>(
    `/businesses/${businessId}/ondc/catalog/items`,
  );
  return z.array(ondcCatalogItemSchema).parse(data);
}

export async function delistProduct(
  businessId: string,
  productId: string,
): Promise<{ success: boolean; message: string }> {
  return api.post<{ success: boolean; message: string }>(
    `/businesses/${businessId}/ondc/catalog/delist/${productId}`,
  );
}

// ─── Orders ─────────────────────────────────────────────
export async function listOndcOrders(
  businessId: string,
  options: { state?: string; limit?: number; offset?: number } = {},
): Promise<OndcOrderList> {
  const params: Record<string, string> = {};
  if (options.state) params.state = options.state;
  if (options.limit !== undefined) params.limit = String(options.limit);
  if (options.offset !== undefined) params.offset = String(options.offset);
  const data = await api.get<unknown>(
    `/businesses/${businessId}/ondc/orders`,
    { params },
  );
  return ondcOrderListSchema.parse(data);
}

export async function updateOrderStatus(
  businessId: string,
  orderId: string,
  dto: UpdateOrderStatusDto,
): Promise<unknown> {
  return api.patch(
    `/businesses/${businessId}/ondc/orders/${orderId}/status`,
    dto,
  );
}

// ─── Stats ──────────────────────────────────────────────
export async function getOndcStats(businessId: string): Promise<OndcStats> {
  const data = await api.get<unknown>(`/businesses/${businessId}/ondc/stats`);
  return ondcStatsSchema.parse(data);
}

// ─── GST Invoice export (analytics module) ──────────────
/**
 * Build a printable invoice HTML URL. Open in system browser via
 * Linking.openURL — backend returns pre-rendered HTML at this endpoint.
 *
 * Note: this hits the ANALYTICS module (analytics/export/invoice/:orderId)
 * not the ONDC module — but it's the natural pair to the order detail
 * screen so we expose it from this feature module.
 */
export function getInvoiceHtmlUrl(
  businessId: string,
  orderId: string,
): string {
  const base = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:4000/api/v1';
  return `${base}/businesses/${businessId}/analytics/export/invoice/${orderId}`;
}
