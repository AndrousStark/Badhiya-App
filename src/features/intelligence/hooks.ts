/**
 * TanStack Query hooks for intelligence (competitor price tracking).
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getTrackedProducts,
  comparePrices,
  getPriceTrends,
  getPriceAlerts,
  markAlertRead,
  trackProduct,
  untrackProduct,
  getInsights,
  refreshPrices,
} from './api';
import type {
  TrackedProduct,
  PriceComparison,
  PriceHistoryPoint,
  PriceAlert,
  InsightsResponse,
  TrackProductDto,
} from './schemas';
import { auth$ } from '@/stores/auth';
import { haptic } from '@/lib/haptics';

export const intelKeys = {
  all: ['intelligence'] as const,
  tracked: (bId: string) => [...intelKeys.all, 'tracked', bId] as const,
  compare: (bId: string, product: string) =>
    [...intelKeys.all, 'compare', bId, product] as const,
  trends: (bId: string, product: string, days: number) =>
    [...intelKeys.all, 'trends', bId, product, days] as const,
  alerts: (bId: string) => [...intelKeys.all, 'alerts', bId] as const,
  insights: (bId: string) => [...intelKeys.all, 'insights', bId] as const,
};

export function useTrackedProducts() {
  const bId = auth$.businessId.get();
  return useQuery<TrackedProduct[]>({
    queryKey: intelKeys.tracked(bId ?? 'none'),
    queryFn: () => getTrackedProducts(bId!),
    enabled: !!bId,
    staleTime: 5 * 60_000,
  });
}

export function usePriceComparison(productName: string | undefined) {
  const bId = auth$.businessId.get();
  return useQuery<PriceComparison>({
    queryKey: intelKeys.compare(bId ?? 'none', productName ?? ''),
    queryFn: () => comparePrices(bId!, productName!),
    enabled: !!bId && !!productName,
    staleTime: 5 * 60_000,
  });
}

export function usePriceTrends(productName: string | undefined, days = 30) {
  const bId = auth$.businessId.get();
  return useQuery<PriceHistoryPoint[]>({
    queryKey: intelKeys.trends(bId ?? 'none', productName ?? '', days),
    queryFn: () => getPriceTrends(bId!, productName!, days),
    enabled: !!bId && !!productName,
    staleTime: 10 * 60_000,
  });
}

export function usePriceAlerts() {
  const bId = auth$.businessId.get();
  return useQuery<PriceAlert[]>({
    queryKey: intelKeys.alerts(bId ?? 'none'),
    queryFn: () => getPriceAlerts(bId!),
    enabled: !!bId,
    staleTime: 60_000,
  });
}

export function useInsights() {
  const bId = auth$.businessId.get();
  return useQuery<InsightsResponse>({
    queryKey: intelKeys.insights(bId ?? 'none'),
    queryFn: () => getInsights(bId!, { limit: 10 }),
    enabled: !!bId,
    staleTime: 5 * 60_000,
  });
}

// ─── Writes ─────────────────────────────────────────────

export function useTrackProduct() {
  const qc = useQueryClient();
  const bId = auth$.businessId.get();
  return useMutation<
    { id: string; searchQuery: string; platforms: string[] },
    Error,
    TrackProductDto
  >({
    mutationFn: (dto) => trackProduct(bId!, dto),
    onSuccess: () => {
      haptic('confirm');
      qc.invalidateQueries({ queryKey: intelKeys.tracked(bId ?? 'none') });
    },
    onError: () => haptic('error'),
  });
}

export function useUntrackProduct() {
  const qc = useQueryClient();
  const bId = auth$.businessId.get();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (trackId) => untrackProduct(bId!, trackId),
    onSuccess: () => {
      haptic('confirm');
      qc.invalidateQueries({ queryKey: intelKeys.tracked(bId ?? 'none') });
    },
  });
}

export function useMarkAlertRead() {
  const qc = useQueryClient();
  const bId = auth$.businessId.get();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (alertId) => markAlertRead(bId!, alertId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: intelKeys.alerts(bId ?? 'none') });
    },
  });
}

export function useRefreshPrices() {
  const bId = auth$.businessId.get();
  return useMutation<{ queued: string[] }, Error, void>({
    mutationFn: () => refreshPrices(bId!),
    onSuccess: () => haptic('confirm'),
    onError: () => haptic('error'),
  });
}
