/**
 * Forecasting feature schemas — demand prediction, festivals, alerts, trends.
 *
 * Backend endpoints (under /businesses/:id/forecasting):
 *   GET  /predict           — demand forecast for next N days
 *   GET  /festivals/upcoming — festivals with demand multipliers
 *   GET  /alerts            — stock-up recommendations
 *   POST /alerts/action     — acknowledge/dismiss alert
 *   GET  /trends            — category trends (week-over-week)
 *   POST /refresh           — trigger forecast refresh
 */

import { z } from 'zod';

// ─── Forecast point ─────────────────────────────────────
export const forecastPointSchema = z.object({
  date: z.string(),
  predictedQuantity: z.coerce.number(),
  predictedRevenue: z.coerce.number(),
  confidenceLower: z.coerce.number(),
  confidenceUpper: z.coerce.number(),
  festivalName: z.string().nullable(),
  festivalMultiplier: z.coerce.number(),
});
export type ForecastPoint = z.infer<typeof forecastPointSchema>;

// ─── Upcoming festival ──────────────────────────────────
export const upcomingFestivalSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameHindi: z.string().nullable(),
  date: z.string(),
  daysUntil: z.coerce.number(),
  overallMultiplier: z.coerce.number(),
  categoryImpact: z.record(z.coerce.number()),
  preFestivalDays: z.coerce.number(),
  postFestivalDays: z.coerce.number(),
  region: z.string(),
  type: z.string(),
});
export type UpcomingFestival = z.infer<typeof upcomingFestivalSchema>;

// ─── Forecast alert ─────────────────────────────────────
export const forecastAlertSchema = z.object({
  id: z.string(),
  alertType: z.string(),
  severity: z.string(),
  title: z.string(),
  titleHindi: z.string().nullable(),
  message: z.string(),
  messageHindi: z.string().nullable(),
  productId: z.string().nullable(),
  category: z.string().nullable(),
  festivalName: z.string().nullable(),
  recommendedAction: z.string().nullable(),
  recommendedQuantity: z.coerce.number().nullable(),
  targetDate: z.string().nullable(),
  daysUntilEvent: z.coerce.number().nullable(),
  status: z.string(),
  createdAt: z.string(),
});
export type ForecastAlert = z.infer<typeof forecastAlertSchema>;

// ─── Category trend ─────────────────────────────────────
export const categoryTrendSchema = z.object({
  category: z.string(),
  currentWeekRevenue: z.coerce.number(),
  priorWeekRevenue: z.coerce.number(),
  changePercent: z.coerce.number(),
  currentWeekQuantity: z.coerce.number(),
  priorWeekQuantity: z.coerce.number(),
});
export type CategoryTrend = z.infer<typeof categoryTrendSchema>;

// ─── Alert action request ───────────────────────────────
export const alertActionSchema = z.object({
  alertId: z.string(),
  action: z.enum(['acknowledged', 'dismissed']),
});
export type AlertActionDto = z.infer<typeof alertActionSchema>;

// ─── Static metadata ────────────────────────────────────
export const FESTIVAL_TYPE_META: Record<
  string,
  { emoji: string; color: string }
> = {
  religious: { emoji: '🪔', color: '#F59E0B' },
  national:  { emoji: '🇮🇳', color: '#FF6B35' },
  harvest:   { emoji: '🌾', color: '#059669' },
  seasonal:  { emoji: '☀️', color: '#0EA5E9' },
  wedding:   { emoji: '💒', color: '#EC4899' },
};

export const ALERT_SEVERITY_META: Record<
  string,
  { label: string; color: string; emoji: string }
> = {
  critical: { label: 'Critical', color: '#DC2626', emoji: '🔴' },
  high:     { label: 'High',     color: '#EA580C', emoji: '🟠' },
  medium:   { label: 'Medium',   color: '#F59E0B', emoji: '🟡' },
  low:      { label: 'Low',      color: '#059669', emoji: '🟢' },
};
