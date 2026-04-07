import { api } from '@/lib/api';
import {
  businessResponseSchema,
  dashboardSchema,
  storeStatsSchema,
  schemeMatchSchema,
  type CreateBusinessDto,
  type Business,
  type Dashboard,
  type StoreStats,
  type SchemeMatch,
} from './schemas';
import { z } from 'zod';

/**
 * Create the authenticated user's business.
 * Called at the end of the onboarding wizard.
 */
export async function createBusiness(dto: CreateBusinessDto): Promise<Business> {
  const data = await api.post<unknown>('/businesses', dto);
  return businessResponseSchema.parse(data);
}

/**
 * List the authenticated user's businesses.
 * Called on app open to rehydrate business context into auth store.
 */
export async function listBusinesses(): Promise<Business[]> {
  const data = await api.get<unknown>('/businesses');
  return z.array(businessResponseSchema).parse(data);
}

/**
 * Fetch the dashboard KPIs for a business.
 * Called by the Home tab on every focus.
 */
export async function getDashboard(businessId: string): Promise<Dashboard> {
  const data = await api.get<unknown>(`/businesses/${businessId}/dashboard`);
  return dashboardSchema.parse(data);
}

/**
 * Fetch store stats — total products, today's orders, today's revenue,
 * recent orders. Used by Dukan tab header.
 */
export async function getStoreStats(businessId: string): Promise<StoreStats> {
  const data = await api.get<unknown>(`/businesses/${businessId}/store/stats`);
  return storeStatsSchema.parse(data);
}

/**
 * Fetch government schemes matched to this business profile.
 * Backend computes matchScore from business type, GST, health score, revenue.
 */
export async function getSchemeMatches(
  businessId: string,
): Promise<SchemeMatch[]> {
  const data = await api.get<unknown>(`/businesses/${businessId}/schemes`);
  return z.array(schemeMatchSchema).parse(data);
}
