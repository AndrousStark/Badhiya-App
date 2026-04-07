/**
 * TanStack Query hooks for forecasting (demand prediction).
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getDemandForecast,
  getUpcomingFestivals,
  getForecastAlerts,
  actionForecastAlert,
  getCategoryTrends,
  refreshForecasts,
} from './api';
import type {
  ForecastPoint,
  UpcomingFestival,
  ForecastAlert,
  CategoryTrend,
  AlertActionDto,
} from './schemas';
import { auth$ } from '@/stores/auth';
import { haptic } from '@/lib/haptics';

export const forecastKeys = {
  all: ['forecasting'] as const,
  predict: (bId: string, category?: string, days?: number) =>
    [...forecastKeys.all, 'predict', bId, category ?? 'all', days ?? 30] as const,
  festivals: (bId: string) =>
    [...forecastKeys.all, 'festivals', bId] as const,
  alerts: (bId: string) =>
    [...forecastKeys.all, 'alerts', bId] as const,
  trends: (bId: string) =>
    [...forecastKeys.all, 'trends', bId] as const,
};

export function useDemandForecast(
  options: { category?: string; days?: number } = {},
) {
  const bId = auth$.businessId.get();
  return useQuery<ForecastPoint[]>({
    queryKey: forecastKeys.predict(bId ?? 'none', options.category, options.days),
    queryFn: () =>
      getDemandForecast(bId!, {
        category: options.category,
        days: options.days ?? 30,
      }),
    enabled: !!bId,
    staleTime: 5 * 60_000,
  });
}

export function useUpcomingFestivals() {
  const bId = auth$.businessId.get();
  return useQuery<UpcomingFestival[]>({
    queryKey: forecastKeys.festivals(bId ?? 'none'),
    queryFn: () => getUpcomingFestivals(bId!),
    enabled: !!bId,
    staleTime: 60 * 60_000, // festivals change daily, not per-minute
  });
}

export function useForecastAlerts() {
  const bId = auth$.businessId.get();
  return useQuery<ForecastAlert[]>({
    queryKey: forecastKeys.alerts(bId ?? 'none'),
    queryFn: () => getForecastAlerts(bId!),
    enabled: !!bId,
    staleTime: 5 * 60_000,
  });
}

export function useCategoryTrends() {
  const bId = auth$.businessId.get();
  return useQuery<CategoryTrend[]>({
    queryKey: forecastKeys.trends(bId ?? 'none'),
    queryFn: () => getCategoryTrends(bId!),
    enabled: !!bId,
    staleTime: 5 * 60_000,
  });
}

export function useActionForecastAlert() {
  const qc = useQueryClient();
  const bId = auth$.businessId.get();
  return useMutation<
    { success: boolean; alertId: string; status: string },
    Error,
    AlertActionDto
  >({
    mutationFn: (dto) => actionForecastAlert(bId!, dto),
    onSuccess: () => {
      haptic('confirm');
      qc.invalidateQueries({ queryKey: forecastKeys.alerts(bId ?? 'none') });
    },
    onError: () => haptic('error'),
  });
}

export function useRefreshForecasts() {
  const bId = auth$.businessId.get();
  return useMutation<{ queued: string[] }, Error, void>({
    mutationFn: () => refreshForecasts(bId!),
    onSuccess: () => haptic('confirm'),
    onError: () => haptic('error'),
  });
}
