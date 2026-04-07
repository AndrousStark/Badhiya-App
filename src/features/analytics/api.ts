/**
 * Analytics API — wraps the 5 backend analytics endpoints.
 *
 *   GET /businesses/:id/analytics/revenue/chart?days=N
 *   GET /businesses/:id/analytics/pnl/monthly?year=&month=
 *   GET /businesses/:id/analytics/expenses/breakdown?year=&month=
 *   GET /businesses/:id/analytics/health-score/breakdown
 *   GET /businesses/:id/analytics/report/monthly?year=&month=
 */

import { api } from '@/lib/api';
import {
  revenueChartSchema,
  monthlyPnlSchema,
  expenseBreakdownSchema,
  healthScoreBreakdownSchema,
  monthlyReportSchema,
  type RevenuePoint,
  type MonthlyPnl,
  type ExpenseBreakdown,
  type HealthScoreBreakdown,
  type MonthlyReport,
} from './schemas';

export async function getRevenueChart(
  businessId: string,
  days = 30,
): Promise<RevenuePoint[]> {
  const data = await api.get<unknown>(
    `/businesses/${businessId}/analytics/revenue/chart`,
    { params: { days: String(days) } },
  );
  return revenueChartSchema.parse(data);
}

export async function getMonthlyPnl(
  businessId: string,
  year?: number,
  month?: number,
): Promise<MonthlyPnl> {
  const params: Record<string, string> = {};
  if (year !== undefined) params.year = String(year);
  if (month !== undefined) params.month = String(month);
  const data = await api.get<unknown>(
    `/businesses/${businessId}/analytics/pnl/monthly`,
    { params },
  );
  return monthlyPnlSchema.parse(data);
}

export async function getExpenseBreakdown(
  businessId: string,
  year?: number,
  month?: number,
): Promise<ExpenseBreakdown> {
  const params: Record<string, string> = {};
  if (year !== undefined) params.year = String(year);
  if (month !== undefined) params.month = String(month);
  const data = await api.get<unknown>(
    `/businesses/${businessId}/analytics/expenses/breakdown`,
    { params },
  );
  return expenseBreakdownSchema.parse(data);
}

export async function getHealthScoreBreakdown(
  businessId: string,
): Promise<HealthScoreBreakdown> {
  const data = await api.get<unknown>(
    `/businesses/${businessId}/analytics/health-score/breakdown`,
  );
  return healthScoreBreakdownSchema.parse(data);
}

export async function getMonthlyReport(
  businessId: string,
  year?: number,
  month?: number,
): Promise<MonthlyReport> {
  const params: Record<string, string> = {};
  if (year !== undefined) params.year = String(year);
  if (month !== undefined) params.month = String(month);
  const data = await api.get<unknown>(
    `/businesses/${businessId}/analytics/report/monthly`,
    { params },
  );
  return monthlyReportSchema.parse(data);
}

/**
 * Build a printable HTML URL for the monthly report. Pass to expo-web-browser
 * or Linking.openURL to open in a system browser. The backend returns
 * pre-rendered HTML at this endpoint.
 */
export function getMonthlyReportHtmlUrl(
  businessId: string,
  year: number,
  month: number,
): string {
  const base = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:4000/api/v1';
  return `${base}/businesses/${businessId}/analytics/export/report/monthly?year=${year}&month=${month}`;
}
