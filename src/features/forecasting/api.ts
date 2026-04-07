/**
 * Forecasting API — demand prediction, festivals, alerts, trends.
 *
 * 6 endpoints under /businesses/:id/forecasting.
 */

import { z } from 'zod';
import { api } from '@/lib/api';
import {
  forecastPointSchema,
  upcomingFestivalSchema,
  forecastAlertSchema,
  categoryTrendSchema,
  type ForecastPoint,
  type UpcomingFestival,
  type ForecastAlert,
  type CategoryTrend,
  type AlertActionDto,
} from './schemas';

const base = (bId: string) => `/businesses/${bId}/forecasting`;

export async function getDemandForecast(
  bId: string,
  options: { category?: string; days?: number; productId?: string } = {},
): Promise<ForecastPoint[]> {
  const params: Record<string, string> = {};
  if (options.category) params.category = options.category;
  if (options.days !== undefined) params.days = String(options.days);
  if (options.productId) params.productId = options.productId;
  const data = await api.get<unknown>(`${base(bId)}/predict`, { params });
  return z.array(forecastPointSchema).parse(data);
}

export async function getUpcomingFestivals(
  bId: string,
): Promise<UpcomingFestival[]> {
  const data = await api.get<unknown>(`${base(bId)}/festivals/upcoming`);
  return z.array(upcomingFestivalSchema).parse(data);
}

export async function getForecastAlerts(
  bId: string,
): Promise<ForecastAlert[]> {
  const data = await api.get<unknown>(`${base(bId)}/alerts`);
  return z.array(forecastAlertSchema).parse(data);
}

export async function actionForecastAlert(
  bId: string,
  dto: AlertActionDto,
): Promise<{ success: boolean; alertId: string; status: string }> {
  return api.post(`${base(bId)}/alerts/action`, dto);
}

export async function getCategoryTrends(
  bId: string,
): Promise<CategoryTrend[]> {
  const data = await api.get<unknown>(`${base(bId)}/trends`);
  return z.array(categoryTrendSchema).parse(data);
}

export async function refreshForecasts(
  bId: string,
): Promise<{ queued: string[] }> {
  return api.post<{ queued: string[] }>(`${base(bId)}/refresh`);
}
